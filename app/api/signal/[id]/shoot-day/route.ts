/**
 * GET /api/signal/[id]/shoot-day
 *
 * Returns the Shoot Day Plan for a signal extraction — the highest-value
 * Hive perk. Mode E of the Hadar Director Engine.
 *
 * First call orchestrates 4 parallel Claude prompts (~30-40s wall time,
 * ~$0.20 cost). Result is cached on signal_extractions.signal.shoot_day,
 * so subsequent calls return instantly for free.
 *
 * The 4 packs run in 2 phases:
 *   Phase 1: identity + pillars (single Sonnet call)
 *   Phase 2: videos + strategy + gift_sentences (3 parallel calls; need
 *            identity + pillars as input)
 *
 * Why split into phases:
 *   - Videos pack needs identity_statement (V1) and the 4 pillar
 *     titles/messages (V2-V5) to construct hooks that actually reference
 *     them by name.
 *   - Strategy pack uses identity in its decision text.
 *   - Gift sentences are personalized against the 4 pillars.
 *
 * Gating: caller must own the extraction AND have hive_status='active'.
 * Admin Basic Auth bypass via X-Admin-Bypass-Hive=1.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import {
  SHOOT_DAY_MODEL_SONNET,
  SHOOT_DAY_MODEL_HAIKU,
  IDENTITY_PILLARS_PACK_SYSTEM,
  IDENTITY_PILLARS_PACK_MAX_TOKENS,
  VIDEOS_PACK_SYSTEM,
  VIDEOS_PACK_MAX_TOKENS,
  STRATEGY_PACK_SYSTEM,
  STRATEGY_PACK_MAX_TOKENS,
  GIFT_SENTENCES_PACK_SYSTEM,
  GIFT_SENTENCES_PACK_MAX_TOKENS,
  buildContextMessage,
  buildVideosContextMessage,
  buildStrategyContextMessage,
  buildGiftSentencesContextMessage,
  validateIdentityPillarsPack,
  validateVideosPack,
  validateStrategyPack,
  validateGiftSentencesPack,
  validateShootDayPlan,
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

// Extract JSON from Claude response — strip ```json fences if present
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
  const adminBypass = req.headers.get("x-admin-bypass-hive") === "1";
  const isHive      = userRow.hive_status === "active";
  if (!isHive && !adminBypass) {
    return NextResponse.json(
      { error: "Shoot Day is a Hive perk", upgrade_url: "/hive" },
      { status: 403 },
    );
  }

  // ── Return cached plan if present ────────────────────────────────────
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

  // ── Phase 1: Identity + 4 Pillars ────────────────────────────────────
  const client = new Anthropic();

  let identity_statement: string;
  let pillars: Pillar[];

  try {
    const phase1Response = await client.messages.create({
      model:      SHOOT_DAY_MODEL_SONNET,
      max_tokens: IDENTITY_PILLARS_PACK_MAX_TOKENS,
      system:     IDENTITY_PILLARS_PACK_SYSTEM,
      messages:   [{ role: "user", content: buildContextMessage(ctx) }],
    });

    const text = phase1Response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    const parsed = parseJsonResponse(text);

    if (!validateIdentityPillarsPack(parsed)) {
      return NextResponse.json(
        { error: "Phase 1 (identity+pillars) returned invalid shape", raw: text },
        { status: 500 },
      );
    }

    identity_statement = parsed.identity_statement;
    pillars            = parsed.pillars;
  } catch (e) {
    return NextResponse.json(
      { error: "Phase 1 failed", details: String(e) },
      { status: 500 },
    );
  }

  // ── Phase 2: Videos + Strategy + Gift Sentences (parallel) ──────────
  type VideosPack       = { videos: Video[] };
  type StrategyPack     = { visual_direction: VisualDirection; schedule: ScheduleBlock[]; decisions: Decision[] };
  type GiftSentencesPack = { gift_sentences: string[] };

  let videosPack: VideosPack;
  let strategyPack: StrategyPack;
  let giftPack: GiftSentencesPack;

  try {
    const [videosRes, strategyRes, giftRes] = await Promise.all([
      // Videos pack — Sonnet (quality matters for 12 video scripts)
      client.messages.create({
        model:      SHOOT_DAY_MODEL_SONNET,
        max_tokens: VIDEOS_PACK_MAX_TOKENS,
        system:     VIDEOS_PACK_SYSTEM,
        messages:   [{ role: "user", content: buildVideosContextMessage(ctx, identity_statement, pillars) }],
      }),

      // Strategy pack — Sonnet (visual direction is high-stakes)
      client.messages.create({
        model:      SHOOT_DAY_MODEL_SONNET,
        max_tokens: STRATEGY_PACK_MAX_TOKENS,
        system:     STRATEGY_PACK_SYSTEM,
        messages:   [{ role: "user", content: buildStrategyContextMessage(ctx, identity_statement, pillars) }],
      }),

      // Gift sentences — Haiku (5 short sentences, fast pack)
      client.messages.create({
        model:      SHOOT_DAY_MODEL_HAIKU,
        max_tokens: GIFT_SENTENCES_PACK_MAX_TOKENS,
        system:     GIFT_SENTENCES_PACK_SYSTEM,
        messages:   [{ role: "user", content: buildGiftSentencesContextMessage(ctx, identity_statement, pillars) }],
      }),
    ]);

    // ── Parse + validate each pack ─────────────────────────────────────
    const videosText = videosRes.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const videosParsed = parseJsonResponse(videosText);
    if (!validateVideosPack(videosParsed)) {
      return NextResponse.json(
        { error: "Videos pack returned invalid shape", raw: videosText },
        { status: 500 },
      );
    }
    videosPack = videosParsed;

    const strategyText = strategyRes.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const strategyParsed = parseJsonResponse(strategyText);
    if (!validateStrategyPack(strategyParsed)) {
      return NextResponse.json(
        { error: "Strategy pack returned invalid shape", raw: strategyText },
        { status: 500 },
      );
    }
    strategyPack = strategyParsed;

    const giftText = giftRes.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const giftParsed = parseJsonResponse(giftText);
    if (!validateGiftSentencesPack(giftParsed)) {
      return NextResponse.json(
        { error: "Gift sentences pack returned invalid shape", raw: giftText },
        { status: 500 },
      );
    }
    giftPack = giftParsed;
  } catch (e) {
    return NextResponse.json(
      { error: "Phase 2 failed", details: String(e) },
      { status: 500 },
    );
  }

  // ── Assemble final plan ─────────────────────────────────────────────
  const plan: ShootDayPlan = {
    identity_statement,
    pillars: pillars as [Pillar, Pillar, Pillar, Pillar],
    videos:          videosPack.videos,
    visual_direction: strategyPack.visual_direction,
    schedule:         strategyPack.schedule,
    decisions:        strategyPack.decisions as [Decision, Decision, Decision],
    gift_sentences:   giftPack.gift_sentences,
  };

  if (!validateShootDayPlan(plan)) {
    return NextResponse.json(
      { error: "Final plan assembly failed validation", plan },
      { status: 500 },
    );
  }

  // ── Cache on signal_extractions.signal ──────────────────────────────
  const generated_at = new Date().toISOString();
  const newSignal = {
    ...row.signal,
    shoot_day:               plan,
    shoot_day_generated_at:  generated_at,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("signal_extractions")
    .update({ signal: newSignal })
    .eq("id", id);

  return NextResponse.json({
    plan,
    generated_at,
    cached: false,
  });
}
