/**
 * GET /api/signal/[id]/content-kit
 *
 * Returns the Content Kit for a signal extraction — Hive perk. First call
 * for a given extraction runs Claude (~$0.03, 30-60s); result is cached on
 * signal_extractions.signal.content_kit so subsequent calls return instantly
 * for free.
 *
 * Gating: the owning user must have hive_status='active'. Service-role
 * callers (admin tooling) can bypass with header X-Admin-Bypass-Hive=1, but
 * the admin password is required (Basic Auth handled by proxy.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import {
  CONTENT_KIT_MODEL,
  CONTENT_KIT_MAX_TOKENS,
  CONTENT_KIT_SYSTEM_PROMPT,
  buildContentKitUserMessage,
  validateContentKit,
  type ContentKit,
} from "@/lib/prompts/content-kit-engine";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const supabase = createServerClient();

  // ── Load extraction + owner ──────────────────────────────────────────
  const { data: row } = await safeFrom(supabase, "signal_extractions")
    .select("signal, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!row?.signal?.signal) {
    return NextResponse.json({ error: "signal not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (supabase as any)
    .from("users")
    .select("name, hive_status, occupation")
    .eq("id", row.user_id)
    .maybeSingle();
  if (!userRow) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  // ── Hive gating ──────────────────────────────────────────────────────
  // Admin Basic Auth (handled by proxy.ts) is implicitly trusted to bypass
  // via the X-Admin-Bypass-Hive header — useful for QA without forcing the
  // tester to flip hive_status.
  const adminBypass = req.headers.get("x-admin-bypass-hive") === "1";
  const isHive      = userRow.hive_status === "active";
  if (!isHive && !adminBypass) {
    return NextResponse.json(
      { error: "Content Kit is a Hive perk", upgrade_url: "/hive" },
      { status: 403 },
    );
  }

  // ── Return cached kit if present ─────────────────────────────────────
  if (row.signal.content_kit && validateContentKit(row.signal.content_kit)) {
    return NextResponse.json({
      kit:          row.signal.content_kit as ContentKit,
      generated_at: row.signal.content_kit_generated_at ?? null,
      cached:       true,
    });
  }

  // ── Generate via Claude ──────────────────────────────────────────────
  let parsed: ContentKit;
  let raw: unknown = null;
  try {
    const client = new Anthropic();
    const userMessage = buildContentKitUserMessage({
      signal:         String(row.signal.signal         ?? ""),
      signal_promise: String(row.signal.signal_promise ?? ""),
      pain_source:    String(row.signal.pain_source    ?? ""),
      element:        String(row.signal.element        ?? ""),
      central_tool:   String(row.signal.central_tool   ?? ""),
      people:         String(row.signal.people         ?? ""),
      warm_note:      String(row.signal.warm_note      ?? ""),
      occupation:     typeof userRow.occupation === "string" ? userRow.occupation : null,
      firstName:      typeof userRow.name === "string" ? userRow.name.split(" ")[0] : null,
    });

    let aiRes: Awaited<ReturnType<typeof client.messages.create>> | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        aiRes = await client.messages.create({
          model:      CONTENT_KIT_MODEL,
          max_tokens: CONTENT_KIT_MAX_TOKENS,
          system:     CONTENT_KIT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });
        break;
      } catch (e: unknown) {
        lastErr = e;
        const status = (e as { status?: number })?.status;
        if (status !== 429 && status !== 529) throw e;
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
      }
    }
    if (!aiRes) throw lastErr ?? new Error("Anthropic call failed");

    const block = aiRes.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Model returned non-text block");
    }
    const cleanText = block.text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    raw = JSON.parse(cleanText);

    if (!validateContentKit(raw)) {
      throw new Error("Model returned invalid Content Kit shape");
    }
    parsed = raw;
  } catch (e) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/content-kit — claude call",
      error:   String(e),
      payload: { extractionId: id, raw },
    });
    return NextResponse.json(
      { error: "Content Kit generation failed. Try again in a moment." },
      { status: 502 },
    );
  }

  // ── Persist on the extraction ────────────────────────────────────────
  const generatedAt = new Date().toISOString();
  try {
    const updatedSignal = {
      ...row.signal,
      content_kit: parsed,
      content_kit_generated_at: generatedAt,
    };
    await safeFrom(supabase, "signal_extractions")
      .update({ signal: updatedSignal })
      .eq("id", id);
  } catch (e) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/content-kit — cache write",
      error:   String(e),
      payload: { extractionId: id },
    });
    // Non-fatal: we still return the freshly-generated kit.
  }

  return NextResponse.json({
    kit:          parsed,
    generated_at: generatedAt,
    cached:       false,
  });
}
