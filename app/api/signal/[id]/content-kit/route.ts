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
  CONTENT_KIT_MODEL, CONTENT_PACK_MODEL,
  VOICE_PACK_MAX_TOKENS,    VOICE_PACK_SYSTEM,
  IDENTITY_PACK_MAX_TOKENS, IDENTITY_PACK_SYSTEM,
  STRATEGY_PACK_MAX_TOKENS, STRATEGY_PACK_SYSTEM,
  CONTENT_PACK_MAX_TOKENS,  CONTENT_PACK_SYSTEM,
  buildContextMessage,
  validateContentKit,
  type ContentKit,
} from "@/lib/prompts/content-kit-engine";
import { isCreditError, alertCreditExhausted } from "@/lib/signal/credit-alert";

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

  // ── Generate via 3 parallel Claude calls ────────────────────────────
  // Splitting the kit across three packs keeps each individual call well
  // under the 60s function timeout: each pack runs ~15-25s and they execute
  // in parallel via Promise.all, total wall time ~25-30s.
  let parsed: ContentKit;
  try {
    const client = new Anthropic();
    const userMessage = buildContextMessage({
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

    // Extract the first balanced {...} object from a free-form Claude reply.
    // Throws if no balanced JSON object can be found.
    function extractJsonObject(text: string): string {
      const t = text.trim();
      const firstBrace = t.indexOf("{");
      if (firstBrace < 0) throw new Error("no opening brace");
      let depth = 0, end = -1, inStr = false, esc = false;
      for (let i = firstBrace; i < t.length; i++) {
        const ch = t[i];
        if (inStr) {
          if (esc) esc = false;
          else if (ch === "\\") esc = true;
          else if (ch === '"') inStr = false;
        } else {
          if (ch === '"') inStr = true;
          else if (ch === "{") depth++;
          else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
        }
      }
      if (end < 0) throw new Error("unbalanced JSON");
      return t.slice(firstBrace, end + 1);
    }

    async function callPack(systemPrompt: string, maxTokens: number, label: string, model: string = CONTENT_KIT_MODEL): Promise<Record<string, unknown>> {
      // Per-call abort — keep parallel packs independent. 56s leaves 4s
      // margin under Vercel's 60s function ceiling.
      const ac = new AbortController();
      const tid = setTimeout(() => ac.abort(), 56_000);
      let lastErr: unknown = null;
      try {
        // 2 attempts — first failure is usually malformed JSON from a model
        // verbosity spike; the second tends to be cleaner.
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const aiRes = await client.messages.create({
              model,
              max_tokens: maxTokens,
              system:     systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            }, { signal: ac.signal });
            const block = aiRes.content[0];
            if (!block || block.type !== "text") throw new Error(`non-text (${label})`);
            const json = extractJsonObject(block.text);
            return JSON.parse(json) as Record<string, unknown>;
          } catch (e: unknown) {
            lastErr = e;
            const status = (e as { status?: number })?.status;
            const isRetryable = status === 429 || status === 529 ||
                                (e instanceof SyntaxError) ||
                                (e instanceof Error && /unbalanced|no opening|no JSON/i.test(e.message));
            if (!isRetryable || attempt === 1) throw e;
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        throw lastErr ?? new Error(`failed (${label})`);
      } finally {
        clearTimeout(tid);
      }
    }

    const [voicePack, identityPack, strategyPack, contentPack] = await Promise.all([
      callPack(VOICE_PACK_SYSTEM,    VOICE_PACK_MAX_TOKENS,    "voice"),
      callPack(IDENTITY_PACK_SYSTEM, IDENTITY_PACK_MAX_TOKENS, "identity"),
      callPack(STRATEGY_PACK_SYSTEM, STRATEGY_PACK_MAX_TOKENS, "strategy"),
      callPack(CONTENT_PACK_SYSTEM,  CONTENT_PACK_MAX_TOKENS,  "content", CONTENT_PACK_MODEL),
    ]);

    const merged = { ...voicePack, ...identityPack, ...strategyPack, ...contentPack };
    if (!validateContentKit(merged)) {
      throw new Error("Merged kit failed validation");
    }
    parsed = merged;
  } catch (e) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/content-kit — claude call",
      error:   String(e),
      payload: { extractionId: id },
    });
    if (isCreditError(e)) await alertCreditExhausted(supabase, "api/signal/[id]/content-kit");
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
