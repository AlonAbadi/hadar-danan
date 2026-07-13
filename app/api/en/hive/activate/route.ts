// The Signal Hive — FREE activation (English launch model, 2026-07-13).
//
// Nothing is sold on the English track yet: a lead who finished the reading
// activates their hive for free straight from the locked page and films ONE
// episode (season-cap 1 for EN members, lib/broadcast/season-cap.ts). The
// paid tier comes later.
//
// Auth is the kaveret token itself — the same signed proof that opens the
// locked page. Flow: verify token → activate hive on the lead's user row →
// ensure an auth account exists and is linked → mint a magic link that signs
// them straight into /en/kaveret → enqueue the English welcome email → fire
// the Meta signal (EN pixel when configured).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { rateLimit } from "@/lib/rate-limit";
import { sendCapiEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const db = createServerClient() as any;
  try {
    const body = await req.json().catch(() => ({}));
    const extractionId = verifyKaveretToken(typeof body.token === "string" ? body.token : null);
    if (!extractionId) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`en-activate:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const { data: ext } = await db
      .from("signal_extractions")
      .select("id, user_id, signal, is_test")
      .eq("id", extractionId)
      .maybeSingle();
    if (!ext?.user_id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { data: user } = await db
      .from("users")
      .select("id, email, name, auth_id, hive_status")
      .eq("id", ext.user_id)
      .maybeSingle();
    if (!user?.email) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // 1. Activate (idempotent — re-entry just re-mints the door key).
    if (user.hive_status !== "active") {
      await db
        .from("users")
        .update({ hive_status: "active", hive_started_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    // 2. Ensure an auth account exists and is linked.
    let authId: string | null = user.auth_id ?? null;
    if (!authId) {
      const { data: created, error: createErr } = await db.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
      });
      if (created?.user?.id) {
        authId = created.user.id;
      } else if (createErr) {
        // Auth user may already exist (e.g. prior Google sign-in) — find it.
        const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
        authId = (list?.users ?? []).find(
          (u: any) => u.email?.toLowerCase() === user.email.toLowerCase()
        )?.id ?? null;
      }
      if (authId) await db.from("users").update({ auth_id: authId }).eq("id", user.id);
    }

    // 3. Magic link → straight into the member home, signed in.
    let actionLink: string | null = null;
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";
      const { data: linkData } = await db.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
        options: { redirectTo: `${appUrl}/en/kaveret` },
      });
      actionLink = linkData?.properties?.action_link ?? null;
    } catch { /* fall back to /en/login below */ }

    // 4. English welcome email. The email CTA is /en/login (magic links are
    // single-use and the fresh one is being consumed by this browser).
    try {
      const { data: seqs } = await db
        .from("email_sequences")
        .select("id, subject, template_key, delay_hours")
        .eq("trigger_event", "SIGNAL_HIVE_PURCHASED_EN")
        .eq("active", true);
      if (seqs?.length) {
        const now = Date.now();
        await db.from("jobs").insert(
          seqs.map((seq: any) => ({
            type: "SEND_EMAIL",
            payload: {
              user_id: user.id,
              email: user.email,
              name: user.name ?? "",
              sequence_id: seq.id,
              subject: seq.subject,
              template_key: seq.template_key,
              is_test: ext.is_test === true,
            },
            run_at: new Date(now + (seq.delay_hours ?? 0) * 3600 * 1000).toISOString(),
            status: "pending",
          }))
        );
      }
    } catch { /* email is best-effort */ }

    // 5. Meta signal — the free activation IS the conversion for the US
    // campaign (CompleteRegistration; no value, nothing was sold).
    await sendCapiEvent({
      eventName: "CompleteRegistration",
      eventId: `en_activate_${ext.id}`,
      userData: {
        email: user.email,
        clientUserAgent: req.headers.get("user-agent") ?? undefined,
        clientIpAddress: ip === "unknown" ? undefined : ip,
        fbp: req.cookies.get("_fbp")?.value,
        fbc: req.cookies.get("_fbc")?.value,
      },
      customData: { contentName: "signal_hive_en_free" },
      isTest: ext.is_test === true,
      pixel: "en",
    });

    await db.from("events").insert({
      user_id: user.id,
      type: "EN_HIVE_ACTIVATED",
      metadata: { extraction_id: ext.id, locale: "en", free: true },
      is_test: ext.is_test === true,
    });

    return NextResponse.json({ url: actionLink ?? "/en/login?next=/en/kaveret" });
  } catch (e) {
    try {
      await db.from("error_logs").insert({
        context: "api/en/hive/activate",
        error: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
      });
    } catch { /* never propagate */ }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
