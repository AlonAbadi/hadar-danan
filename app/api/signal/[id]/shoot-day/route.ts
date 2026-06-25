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
  type Video,
} from "@/lib/prompts/shoot-day-engine";

// Slices written by the Phase 3 endpoints are stored as JSON strings via the
// atomic merge RPC. Parse one back into an object, tolerating already-parsed
// values and bad JSON.
function parseSlice<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v !== "string") return v as T;
  try { return JSON.parse(v) as T; } catch { return null; }
}

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
    for (const k of [
      "shoot_day", "shoot_day_phase1", "shoot_day_generated_at",
      "shoot_day_act1", "shoot_day_act2", "shoot_day_act3",
      "shoot_day_strategy", "shoot_day_gifts",
    ]) {
      delete (wiped as Record<string, unknown>)[k];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("signal_extractions")
      .update({ signal: wiped })
      .eq("id", id);
    row.signal = wiped;
  }

  // Fully-built plan (all 12 videos) cached? return immediately.
  if (row.signal.shoot_day &&
      validateShootDayPlan(row.signal.shoot_day) &&
      (row.signal.shoot_day as ShootDayPlan).videos.length === 12) {
    return NextResponse.json({
      phase:        "complete",
      plan:         row.signal.shoot_day as ShootDayPlan,
      generated_at: row.signal.shoot_day_generated_at ?? null,
      full:         true,
      cached:       true,
    });
  }

  // Assemble the full plan from Phase 3 slices once every piece exists, and
  // cache it (upgrading any 1-video preview to the full 12-video plan).
  // identity+pillars come from the phase-1 cache, or from the preview plan if
  // Phase 2 already ran and cleared the phase-1 partial.
  const cachedPlan = (row.signal.shoot_day && validateShootDayPlan(row.signal.shoot_day))
    ? (row.signal.shoot_day as ShootDayPlan) : null;
  const phase1   = validateIdentityPillarsPack(row.signal.shoot_day_phase1)
    ? row.signal.shoot_day_phase1
    : (cachedPlan ? { identity_statement: cachedPlan.identity_statement, pillars: cachedPlan.pillars } : null);
  const act1     = parseSlice<Video[]>(row.signal.shoot_day_act1);
  const act2     = parseSlice<Video[]>(row.signal.shoot_day_act2);
  const act3     = parseSlice<Video[]>(row.signal.shoot_day_act3);
  const strategy = parseSlice<{ visual_direction: unknown; schedule: unknown; decisions: unknown }>(row.signal.shoot_day_strategy);
  const gifts    = parseSlice<string[]>(row.signal.shoot_day_gifts);
  const progress = {
    identity: !!phase1, act1: !!act1, act2: !!act2, act3: !!act3,
    strategy: !!strategy, gifts: !!gifts,
  };

  if (phase1 && act1 && act2 && act3 && strategy && gifts) {
    const videos = [...act1, ...act2, ...act3].sort((a, b) => a.number - b.number);
    const plan = {
      identity_statement: phase1.identity_statement,
      pillars:            phase1.pillars,
      videos,
      visual_direction:   strategy.visual_direction,
      schedule:           strategy.schedule,
      decisions:          strategy.decisions,
      gift_sentences:     gifts,
    } as ShootDayPlan;

    if (validateShootDayPlan(plan) && videos.length === 12) {
      const generated_at = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("signal_extractions")
        .update({ signal: { ...row.signal, shoot_day: plan, shoot_day_generated_at: generated_at } })
        .eq("id", id);
      return NextResponse.json({ phase: "complete", plan, generated_at, full: true, cached: false });
    }
  }

  // Cached plan with fewer than 12 videos (identity + pillars + video #1 from
  // Phase 2). Stays phase:"complete" so the existing UI keeps rendering it;
  // `full:false` + `progress` let a newer UI know more acts can be generated.
  if (cachedPlan) {
    return NextResponse.json({
      phase:        "complete",
      plan:         cachedPlan,
      generated_at: row.signal.shoot_day_generated_at ?? null,
      full:         false,
      progress,
      cached:       true,
    });
  }

  // Cached phase-1 partial? skip the Claude call and return it
  if (phase1) {
    return NextResponse.json({
      phase: "started",
      identity_statement: phase1.identity_statement,
      pillars:            phase1.pillars,
      progress,
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
