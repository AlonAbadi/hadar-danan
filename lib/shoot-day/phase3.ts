/**
 * Shared plumbing for the Phase 3 Shoot Day endpoints (videos / strategy /
 * gifts). Each endpoint is a small wrapper around this: gate the caller,
 * build the brand context, then run one Claude call and merge the result as
 * its own top-level signal field via the atomic merge RPC (so parallel calls
 * never overwrite each other — same race fix as the asset/share-card routes).
 *
 * The completed plan is assembled from these slices by the GET endpoint.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import {
  SHOOT_DAY_MODEL_SONNET,
  type ShootDayContext,
} from "@/lib/prompts/shoot-day-engine";
import { personalizeSystemPrompt, type CustomerCorpusCtx } from "@/lib/prompts/hadar-corpus-selection";

export type GateResult =
  | { ok: true; ctx: ShootDayContext; supabase: ReturnType<typeof createServerClient>; signal: Record<string, unknown> }
  | { ok: false; response: NextResponse };

/** Validate id + Hive gating, load the brand signal, build the context. */
export async function gateAndBuildContext(req: NextRequest, id: string): Promise<GateResult> {
  if (!id) return { ok: false, response: NextResponse.json({ error: "missing id" }, { status: 400 }) };

  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any)
    .from("signal_extractions")
    .select("signal, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!row?.signal?.signal) {
    return { ok: false, response: NextResponse.json({ error: "signal not found" }, { status: 404 }) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (supabase as any)
    .from("users")
    .select("name, hive_status, occupation, gender")
    .eq("id", row.user_id)
    .maybeSingle();

  if (!userRow) {
    return { ok: false, response: NextResponse.json({ error: "user not found" }, { status: 404 }) };
  }

  const adminBypass = req.headers.get("x-admin-bypass-hive") === "1";
  const isHive      = userRow.hive_status === "active";
  if (!isHive && !adminBypass) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Shoot Day is a Hive perk", upgrade_url: "/hive" }, { status: 403 }),
    };
  }

  const ctx: ShootDayContext = {
    name:           userRow.name ?? null,
    signal:         String(row.signal.signal         ?? ""),
    signal_promise: String(row.signal.signal_promise ?? ""),
    pain_source:    String(row.signal.pain_source    ?? ""),
    element:        String(row.signal.element        ?? ""),
    central_tool:   String(row.signal.central_tool   ?? ""),
    people:         String(row.signal.people         ?? ""),
    warm_note:      String(row.signal.warm_note      ?? ""),
    occupation:     userRow.occupation ?? null,
    gender:         (userRow.gender === "m" || userRow.gender === "f") ? userRow.gender : null,
    bio_long:       row.signal.content_kit?.bio_long ?? undefined,
    positioning_statement: row.signal.content_kit?.positioning_statement ?? undefined,
  };

  return { ok: true, ctx, supabase, signal: row.signal };
}

/**
 * One Sonnet call, returns the joined text content. Since 2026-07-10 accepts
 * an optional `customerCtx` — when provided, the SYSTEM prompt has its
 * `__CUSTOMER_INJECTED_QUOTES__` placeholder replaced with a per-customer
 * quote sample (same-domain filtered, deterministically shuffled by
 * extractionId). Pass it wherever a customer is on the other end; skip it for
 * internal/tooling calls (there are none in prod at time of writing).
 */
export async function runPack(
  system: string,
  user: string,
  maxTokens: number,
  customerCtx?: CustomerCorpusCtx,
  // 2026-07-22 Alon: per-call temperature so opinion / story videos can run
  // hotter than the CTA pack. When omitted, Anthropic's default (~1.0) is
  // used, matching pre-change behavior for phase-1/2 calls.
  temperature?: number,
): Promise<string> {
  const finalSystem = customerCtx ? personalizeSystemPrompt(system, customerCtx) : system;
  const client = new Anthropic();
  const resp = await client.messages.create({
    model:      SHOOT_DAY_MODEL_SONNET,
    max_tokens: maxTokens,
    system:     finalSystem,
    messages:   [{ role: "user", content: user }],
    ...(temperature != null ? { temperature } : {}),
  });
  return resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
}

export function parseJsonResponse(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Fall back to the outermost { ... } block, in case the model wrapped the
    // JSON in prose. (Does not recover genuine truncation.)
    const first = cleaned.indexOf("{");
    const last  = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw e;
  }
}

/**
 * Atomically merge one slice as its own top-level signal field. Stored as a
 * JSON string (the RPC's value param is text); the GET endpoint JSON.parses
 * it back. Same race-safe pattern as the asset/share-card caches.
 */
export async function mergeSlice(
  supabase: ReturnType<typeof createServerClient>,
  id: string,
  field: string,
  value: unknown,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("signal_merge_field", {
    p_id:    id,
    p_field: field,
    p_value: JSON.stringify(value),
  });
}
