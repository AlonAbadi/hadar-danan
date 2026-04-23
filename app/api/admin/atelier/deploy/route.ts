/**
 * POST /api/admin/atelier/deploy
 *
 * One-click deployment agent for Atelier preview sites.
 * Given a generated lib/client.ts string, this route:
 *  1. Forks atelier-client-template on GitHub as beegood-{slug}
 *  2. Injects the generated lib/client.ts into the fork
 *  3. Creates a Vercel project linked to the fork
 *  4. Sets all env vars (PREVIEW_MODE=true + stubs for every service)
 *  5. Triggers the first production deployment
 *  6. Saves preview_url + project metadata to atelier_applications
 *
 * Returns immediately after triggering the deploy — the site will be live
 * within ~3 minutes (Next.js build time on Vercel).
 *
 * Required env vars in beegood.online:
 *   GITHUB_TOKEN   — classic PAT, scopes: repo
 *   GITHUB_OWNER   — account/org that owns the template (default: AlonAbadi)
 *   VERCEL_TOKEN   — from Vercel Settings → Tokens
 *   VERCEL_TEAM_ID — optional, leave empty for personal account
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function githubFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

function vercelFetch(path: string, token: string, teamId: string | undefined, options: RequestInit = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const url = teamId
    ? `https://api.vercel.com${path}${sep}teamId=${teamId}`
    : `https://api.vercel.com${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

/** Polls until the GitHub fork repo is accessible (fork creation is async). */
async function waitForFork(owner: string, repo: string, token: string): Promise<boolean> {
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await githubFetch(`/repos/${owner}/${repo}`, token);
    if (res.ok) return true;
  }
  return false;
}

/** Extracts a product price from the generated client.ts string. */
function extractPrice(code: string, product: string): string {
  const match = code.match(new RegExp(`${product}:\\s*\\{[^}]*?price:\\s*(\\d+)`, "s"));
  return match?.[1] ?? "";
}

/**
 * Downloads an image from a URL (e.g. Supabase storage) and pushes it
 * to the GitHub fork at the given public/ path.
 * Silently skips if the image URL is empty or the download fails.
 */
async function pushImageToFork(
  owner: string,
  repo: string,
  token: string,
  imageUrl: string,
  publicPath: string  // e.g. "public/hero.jpg"
): Promise<void> {
  if (!imageUrl) return;
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return;
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Get existing file SHA so GitHub accepts the PUT (update vs create)
    const existingRes  = await githubFetch(`/repos/${owner}/${repo}/contents/${publicPath}`, token);
    const existingData = existingRes.ok ? (await existingRes.json() as { sha?: string }) : {};

    await githubFetch(`/repos/${owner}/${repo}/contents/${publicPath}`, token, {
      method: "PUT",
      body: JSON.stringify({
        message: `chore: add ${publicPath}`,
        content: base64,
        ...(existingData.sha ? { sha: existingData.sha } : {}),
      }),
    });
  } catch {
    // Non-fatal — placeholder images in the template are the fallback
  }
}

/** Extracts the whatsapp number from the generated client.ts string. */
function extractWhatsapp(code: string): string {
  const match = code.match(/whatsapp:\s*["']([^"']+)["']/);
  return match?.[1] ?? "";
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const vercelToken = process.env.VERCEL_TOKEN;
  const githubOwner = process.env.GITHUB_OWNER ?? "AlonAbadi";
  const vercelTeamId = process.env.VERCEL_TEAM_ID || undefined;

  if (!githubToken || !vercelToken) {
    return NextResponse.json(
      { error: "Missing GITHUB_TOKEN or VERCEL_TOKEN env vars" },
      { status: 500 }
    );
  }

  let body: { application_id?: string; client_slug?: string; client_code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { application_id, client_slug, client_code } = body;

  if (!application_id || !client_slug || !client_code) {
    return NextResponse.json(
      { error: "Missing application_id, client_slug, or client_code" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9-]+$/.test(client_slug)) {
    return NextResponse.json(
      { error: "client_slug must be lowercase letters, numbers, and hyphens only" },
      { status: 400 }
    );
  }

  const repoName   = `beegood-${client_slug}`;
  const previewUrl = `https://${repoName}.vercel.app`;

  // Fetch image URLs from DB (hero + og) — used later to push real images to the fork
  const supabaseForImages = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appRow } = await (supabaseForImages as any)
    .from("atelier_applications")
    .select("hero_image_url, og_image_url")
    .eq("id", application_id)
    .single() as { data: { hero_image_url?: string; og_image_url?: string } | null };

  const heroImageUrl = appRow?.hero_image_url ?? "";
  const ogImageUrl   = appRow?.og_image_url   ?? "";

  try {
    // ── Step 1: Fork the template (skip if fork already exists) ────────────
    const existsRes = await githubFetch(`/repos/${githubOwner}/${repoName}`, githubToken);
    if (!existsRes.ok) {
      const forkRes = await githubFetch(
        "/repos/AlonAbadi/atelier-client-template/forks",
        githubToken,
        {
          method: "POST",
          body: JSON.stringify({ name: repoName, default_branch_only: true }),
        }
      );
      if (!forkRes.ok && forkRes.status !== 202) {
        const err = await forkRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: `GitHub fork failed: ${(err as { message?: string }).message ?? forkRes.status}` },
          { status: 500 }
        );
      }

      const ready = await waitForFork(githubOwner, repoName, githubToken);
      if (!ready) {
        return NextResponse.json({ error: "GitHub fork timed out after 36s" }, { status: 500 });
      }
    }

    // ── Step 2: Get current SHA of lib/client.ts in the fork ───────────────
    const fileRes  = await githubFetch(
      `/repos/${githubOwner}/${repoName}/contents/lib/client.ts`,
      githubToken
    );
    const fileData = await fileRes.json() as { sha?: string };
    const fileSha  = fileData.sha;

    if (!fileSha) {
      return NextResponse.json({ error: "Could not read lib/client.ts SHA from fork" }, { status: 500 });
    }

    // ── Step 3: Push generated lib/client.ts into the fork ─────────────────
    const pushRes = await githubFetch(
      `/repos/${githubOwner}/${repoName}/contents/lib/client.ts`,
      githubToken,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `chore: inject client config for ${client_slug}`,
          content: Buffer.from(client_code, "utf-8").toString("base64"),
          sha: fileSha,
        }),
      }
    );
    if (!pushRes.ok) {
      const err = await pushRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `GitHub push failed: ${(err as { message?: string }).message ?? pushRes.status}` },
        { status: 500 }
      );
    }

    // ── Step 3b: Push real images to fork (replaces placeholder images) ────
    await Promise.all([
      pushImageToFork(githubOwner, repoName, githubToken, heroImageUrl, "public/hero.jpg"),
      pushImageToFork(githubOwner, repoName, githubToken, ogImageUrl,   "public/og-image.jpg"),
    ]);

    // ── Step 4: Create (or reuse) Vercel project linked to the fork ────────
    let vercelProjectId: string;

    const createRes = await vercelFetch("/v10/projects", vercelToken, vercelTeamId, {
      method: "POST",
      body: JSON.stringify({
        name: repoName,
        framework: "nextjs",
        gitRepository: {
          type: "github",
          repo: `${githubOwner}/${repoName}`,
        },
      }),
    });

    if (createRes.status === 409) {
      // Project already exists — fetch its id
      const getRes  = await vercelFetch(`/v10/projects/${repoName}`, vercelToken, vercelTeamId);
      const getData = await getRes.json() as { id?: string };
      if (!getData.id) {
        return NextResponse.json({ error: "Vercel project conflict — could not retrieve project id" }, { status: 500 });
      }
      vercelProjectId = getData.id;
    } else if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({})) as { error?: { message?: string } };
      return NextResponse.json(
        { error: `Vercel project creation failed: ${err.error?.message ?? createRes.status}` },
        { status: 500 }
      );
    } else {
      const data = await createRes.json() as { id: string };
      vercelProjectId = data.id;
    }

    // ── Step 5: Set env vars (all stubs + PREVIEW_MODE=true) ───────────────
    const priceChallenge = extractPrice(client_code, "challenge");
    const priceWorkshop  = extractPrice(client_code, "workshop");
    const priceCall      = extractPrice(client_code, "strategy");
    const whatsapp       = extractWhatsapp(client_code);

    const envVars = [
      { key: "PREVIEW_MODE",                   value: "true" },
      { key: "NEXT_PUBLIC_APP_URL",             value: previewUrl },
      { key: "NEXT_PUBLIC_SUPABASE_URL",        value: "https://placeholder.supabase.co" },
      { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",   value: "preview-placeholder-anon-key" },
      { key: "SUPABASE_SERVICE_ROLE_KEY",       value: "preview-placeholder-service-key" },
      { key: "RESEND_API_KEY",                  value: "re_preview_placeholder" },
      { key: "NEXT_PUBLIC_FROM_EMAIL",          value: `noreply@${repoName}.vercel.app` },
      // Leave Cardcom empty → checkout route already returns 503 for missing creds
      { key: "CARDCOM_TERMINAL",                value: "" },
      { key: "CARDCOM_API_NAME",                value: "" },
      // Prices extracted from the generated client.ts
      { key: "NEXT_PUBLIC_PRICE_CHALLENGE",     value: priceChallenge || "197" },
      { key: "NEXT_PUBLIC_PRICE_WORKSHOP",      value: priceWorkshop  || "1000" },
      { key: "NEXT_PUBLIC_PRICE_CALL",          value: priceCall      || "4000" },
      // Auth / secrets
      { key: "ADMIN_USERNAME",                  value: "admin" },
      { key: "ADMIN_PASSWORD",                  value: "beegood-preview" },
      { key: "CRON_SECRET",                     value: "preview" },
      { key: "MEMBERS_SECRET",                  value: "preview" },
      // WhatsApp
      { key: "WHATSAPP_PHONE",                  value: whatsapp || "972500000000" },
      { key: "NEXT_PUBLIC_WHATSAPP_PHONE",      value: whatsapp || "972500000000" },
    ].map(e => ({
      ...e,
      type: "plain" as const,
      target: ["production", "preview"] as ("production" | "preview")[],
    }));

    await vercelFetch(
      `/v10/projects/${vercelProjectId}/env`,
      vercelToken,
      vercelTeamId,
      {
        method: "POST",
        body: JSON.stringify(envVars),
      }
    );

    // ── Step 6: Trigger the first production deployment ────────────────────
    const forkInfoRes = await githubFetch(`/repos/${githubOwner}/${repoName}`, githubToken);
    const forkInfo    = await forkInfoRes.json() as { id?: number };

    const deployRes = await vercelFetch("/v13/deployments", vercelToken, vercelTeamId, {
      method: "POST",
      body: JSON.stringify({
        name:   repoName,
        target: "production",
        gitSource: {
          type:   "github",
          repoId: String(forkInfo.id ?? ""),
          ref:    "main",
        },
      }),
    });

    const deployData = await deployRes.json() as { id?: string; url?: string };
    const deploymentId = deployData.id ?? "";

    // ── Step 7: Persist metadata to atelier_applications ──────────────────
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("atelier_applications")
      .update({
        preview_url:       previewUrl,
        vercel_project_id: vercelProjectId,
        github_repo:       `${githubOwner}/${repoName}`,
        deployment_id:     deploymentId,
      })
      .eq("id", application_id);

    return NextResponse.json({
      ok:                true,
      preview_url:       previewUrl,
      deployment_id:     deploymentId,
      vercel_project_id: vercelProjectId,
      github_repo:       `${githubOwner}/${repoName}`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[atelier/deploy]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
