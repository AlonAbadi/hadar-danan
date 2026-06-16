/**
 * GET /api/signal/[id]/shoot-day  (Phase 1)
 *
 * Returns either:
 *  (a) a cached complete ShootDayPlan if one exists (cached:true), or
 *  (b) a fresh identity_statement + 4 pillars (phase: "started").
 *
 * Phase 2 is at /api/signal/[id]/shoot-day/finish — the client POSTs
 * back the phase-1 output and receives the remaining packs (videos +
 * strategy + gift_sentences) in parallel.
 *
 * Why the split:
 *  Vercel Hobby caps function duration at 60s. Running 4 Claude calls
 *  (1 sequential + 3 parallel) in one invocation is ~45-55s — too close
 *  to the limit. Splitting the work across two invocations gives each
 *  one ~25-30s of headroom.
 *
 * Gating: caller must own the extraction AND have hive_status='active'.
 * Admin Basic Auth bypass via X-Admin-Bypass-Hive=1.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import {
  SHOOT_DAY_MODEL_SONNET,
  IDENTITY_PILLARS_PACK_SYSTEM,
  IDENTITY_PILLARS_PACK_MAX_TOKENS,
  buildContextMessage,
  validateIdentityPillarsPack,
  validateShootDayPlan,
  type ShootDayPlan,
  type ShootDayContext,
} from "@/lib/prompts/shoot-day-engine";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

function parseJsonResponse(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  return JSON.parse(cleaned);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const supabase = createServerClient();

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
    .select("name, hive_status, occupation, gender")
    .eq("id", row.user_id)
    .maybeSingle();

  if (!userRow) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const adminBypass = req.headers.get("x-admin-bypass-hive") === "1";
  const isHive      = userRow.hive_status === "active";
  if (!isHive && !adminBypass) {
    return NextResponse.json(
      { error: "Shoot Day is a Hive perk", upgrade_url: "/hive" },
      { status: 403 },
    );
  }

  // Force-refresh escape hatch: ?refresh=1 wipes the cache so the next call
  // regenerates from scratch. Used when prompt rules change and the cached
  // output no longer reflects them.
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  if (refresh) {
    const wiped = { ...row.signal };
    delete (wiped as Record<string, unknown>).shoot_day;
    delete (wiped as Record<string, unknown>).shoot_day_phase1;
    delete (wiped as Record<string, unknown>).shoot_day_generated_at;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("signal_extractions")
      .update({ signal: wiped })
      .eq("id", id);
    row.signal = wiped;
  }

  // Cached complete plan? return immediately
  if (row.signal.shoot_day && validateShootDayPlan(row.signal.shoot_day)) {
    return NextResponse.json({
      phase:        "complete",
      plan:         row.signal.shoot_day as ShootDayPlan,
      generated_at: row.signal.shoot_day_generated_at ?? null,
      cached:       true,
    });
  }

  // Cached phase-1 partial? skip the Claude call and return it
  if (row.signal.shoot_day_phase1 &&
      validateIdentityPillarsPack(row.signal.shoot_day_phase1)) {
    return NextResponse.json({
      phase: "started",
      identity_statement: row.signal.shoot_day_phase1.identity_statement,
      pillars:            row.signal.shoot_day_phase1.pillars,
    });
  }

  // ── Phase 1: Identity + 4 Pillars ────────────────────────────────────
  const ctx: ShootDayContext = {
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

  try {
    const client = new Anthropic();
    const resp = await client.messages.create({
      model:      SHOOT_DAY_MODEL_SONNET,
      max_tokens: IDENTITY_PILLARS_PACK_MAX_TOKENS,
      system:     IDENTITY_PILLARS_PACK_SYSTEM,
      messages:   [{ role: "user", content: buildContextMessage(ctx) }],
    });

    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    const parsed = parseJsonResponse(text);
    if (!validateIdentityPillarsPack(parsed)) {
      return NextResponse.json(
        { error: "Phase 1 (identity+pillars) returned invalid shape", raw: text.slice(0, 500) },
        { status: 500 },
      );
    }

    // Cache phase-1 so a retry / abandoned phase-2 doesn't waste a Claude call
    const newSignal = {
      ...row.signal,
      shoot_day_phase1: {
        identity_statement: parsed.identity_statement,
        pillars:            parsed.pillars,
        generated_at:       new Date().toISOString(),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("signal_extractions")
      .update({ signal: newSignal })
      .eq("id", id);

    return NextResponse.json({
      phase: "started",
      identity_statement: parsed.identity_statement,
      pillars:            parsed.pillars,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Phase 1 failed", details: String(e) },
      { status: 500 },
    );
  }
}
