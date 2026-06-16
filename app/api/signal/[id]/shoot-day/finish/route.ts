/**
 * POST /api/signal/[id]/shoot-day/finish  (Phase 2 — V1: single video)
 *
 * V1 scope (June 2026): generates ONLY Video #1 (Identity, 15s) in
 * parallel with strategy + gift sentences. Total wall time ~10-15s,
 * well under the 60s Vercel Hobby limit.
 *
 * The full 12-video generation (VIDEOS_PACK) was too slow (~30-45s for
 * the 8000-token pack alone) and pushed Phase 2 over the limit. V2+
 * will progressively generate the remaining 11 videos via per-card
 * "צור את הסרטון הבא" CTAs.
 *
 * Packs (all parallel):
 *   - single video #1 (Sonnet, fast)
 *   - strategy pack (Sonnet, medium)
 *   - gift_sentences pack (Haiku, fast)
 *
 * Caches the assembled plan on signal_extractions.signal.shoot_day so
 * subsequent calls to the GET endpoint return instantly.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import {
  SHOOT_DAY_MODEL_SONNET,
  SHOOT_DAY_MODEL_HAIKU,
  SINGLE_VIDEO_PACK_SYSTEM,
  SINGLE_VIDEO_PACK_MAX_TOKENS,
  STRATEGY_PACK_SYSTEM,
  STRATEGY_PACK_MAX_TOKENS,
  GIFT_SENTENCES_PACK_SYSTEM,
  GIFT_SENTENCES_PACK_MAX_TOKENS,
  buildSingleVideoContextMessage,
  buildStrategyContextMessage,
  buildGiftSentencesContextMessage,
  validateSingleVideoPack,
  validateStrategyPack,
  validateGiftSentencesPack,
  validateShootDayPlan,
  validatePillar,
  type ShootDayPlan,
  type ShootDayContext,
  type Pillar,
  type Video,
  type VisualDirection,
  type ScheduleBlock,
  type Decision,
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // Parse phase-1 payload
  let identity_statement: string;
  let pillars: Pillar[];
  try {
    const body = await req.json();
    identity_statement = String(body?.identity_statement ?? "");
    pillars            = body?.pillars;
    if (!identity_statement || !Array.isArray(pillars) || pillars.length !== 4 || !pillars.every(validatePillar)) {
      return NextResponse.json(
        { error: "Missing or invalid phase-1 payload (identity_statement + 4 pillars required)" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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
    .select("name, hive_status, occupation")
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

  // Already complete? return cached
  if (row.signal.shoot_day && validateShootDayPlan(row.signal.shoot_day)) {
    return NextResponse.json({
      plan:         row.signal.shoot_day as ShootDayPlan,
      generated_at: row.signal.shoot_day_generated_at ?? null,
      cached:       true,
    });
  }

  // ── Build context ────────────────────────────────────────────────────
  const ctx: ShootDayContext = {
    signal:         String(row.signal.signal         ?? ""),
    signal_promise: String(row.signal.signal_promise ?? ""),
    pain_source:    String(row.signal.pain_source    ?? ""),
    element:        String(row.signal.element        ?? ""),
    central_tool:   String(row.signal.central_tool   ?? ""),
    people:         String(row.signal.people         ?? ""),
    warm_note:      String(row.signal.warm_note      ?? ""),
    occupation:     userRow.occupation ?? null,
    bio_long:       row.signal.content_kit?.bio_long ?? undefined,
    positioning_statement: row.signal.content_kit?.positioning_statement ?? undefined,
  };

  // ── Phase 2: 3 parallel Claude calls (V1 = single video) ────────────
  type SingleVideoPack  = { video: Video };
  type StrategyPack     = { visual_direction: VisualDirection; schedule: ScheduleBlock[]; decisions: Decision[] };
  type GiftSentencesPack = { gift_sentences: string[] };

  let videoPack: SingleVideoPack;
  let strategyPack: StrategyPack;
  let giftPack: GiftSentencesPack;

  try {
    const client = new Anthropic();
    const [videoRes, strategyRes, giftRes] = await Promise.all([
      client.messages.create({
        model:      SHOOT_DAY_MODEL_SONNET,
        max_tokens: SINGLE_VIDEO_PACK_MAX_TOKENS,
        system:     SINGLE_VIDEO_PACK_SYSTEM,
        messages:   [{ role: "user", content: buildSingleVideoContextMessage(ctx, identity_statement, pillars) }],
      }),
      client.messages.create({
        model:      SHOOT_DAY_MODEL_SONNET,
        max_tokens: STRATEGY_PACK_MAX_TOKENS,
        system:     STRATEGY_PACK_SYSTEM,
        messages:   [{ role: "user", content: buildStrategyContextMessage(ctx, identity_statement, pillars) }],
      }),
      client.messages.create({
        model:      SHOOT_DAY_MODEL_HAIKU,
        max_tokens: GIFT_SENTENCES_PACK_MAX_TOKENS,
        system:     GIFT_SENTENCES_PACK_SYSTEM,
        messages:   [{ role: "user", content: buildGiftSentencesContextMessage(ctx, identity_statement, pillars) }],
      }),
    ]);

    const videoText    = videoRes.content    .filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const strategyText = strategyRes.content .filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const giftText     = giftRes.content     .filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");

    const videoParsed = parseJsonResponse(videoText);
    if (!validateSingleVideoPack(videoParsed)) {
      return NextResponse.json({ error: "Single video pack invalid shape", raw: videoText.slice(0, 500) }, { status: 500 });
    }
    videoPack = videoParsed;

    const strategyParsed = parseJsonResponse(strategyText);
    if (!validateStrategyPack(strategyParsed)) {
      return NextResponse.json({ error: "Strategy pack invalid shape", raw: strategyText.slice(0, 500) }, { status: 500 });
    }
    strategyPack = strategyParsed;

    const giftParsed = parseJsonResponse(giftText);
    if (!validateGiftSentencesPack(giftParsed)) {
      return NextResponse.json({ error: "Gift sentences pack invalid shape", raw: giftText.slice(0, 500) }, { status: 500 });
    }
    giftPack = giftParsed;
  } catch (e) {
    return NextResponse.json({ error: "Phase 2 failed", details: String(e) }, { status: 500 });
  }

  // ── Assemble + cache ─────────────────────────────────────────────────
  const plan: ShootDayPlan = {
    identity_statement,
    pillars: pillars as [Pillar, Pillar, Pillar, Pillar],
    videos:          [videoPack.video],
    visual_direction: strategyPack.visual_direction,
    schedule:         strategyPack.schedule,
    decisions:        strategyPack.decisions as [Decision, Decision, Decision],
    gift_sentences:   giftPack.gift_sentences,
  };

  if (!validateShootDayPlan(plan)) {
    return NextResponse.json({ error: "Final plan assembly failed validation", plan }, { status: 500 });
  }

  const generated_at = new Date().toISOString();
  const newSignal = {
    ...row.signal,
    shoot_day:              plan,
    shoot_day_generated_at: generated_at,
    // Phase-1 partial no longer needed once the full plan is cached
    shoot_day_phase1: undefined,
  };
  delete (newSignal as Record<string, unknown>).shoot_day_phase1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("signal_extractions")
    .update({ signal: newSignal })
    .eq("id", id);

  return NextResponse.json({ plan, generated_at, cached: false });
}
