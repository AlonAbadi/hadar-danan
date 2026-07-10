/**
 * POST /api/signal/[id]/shoot-day/finish  (Phase 2 — V1: single video only)
 *
 * V1 scope (June 2026): generates ONLY Video #1 (Identity, 15s) in a single
 * Claude call. The earlier attempt to run 3 parallel calls (video +
 * strategy + gift) still hit FUNCTION_INVOCATION_TIMEOUT on Vercel Hobby
 * (60s cap), even with reduced max_tokens. One sequential Sonnet call for
 * ~1500 tokens of output is ~5-10s wall — well clear of the limit.
 *
 * V2+ will add a separate Phase 3 endpoint to generate visual_direction +
 * schedule + decisions + gift_sentences on demand (also one call each).
 *
 * Caches the assembled plan on signal_extractions.signal.shoot_day so
 * subsequent calls to the GET endpoint return instantly.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import {
  SHOOT_DAY_MODEL_SONNET,
  SINGLE_VIDEO_PACK_SYSTEM,
  SINGLE_VIDEO_PACK_MAX_TOKENS,
  buildSingleVideoContextMessage,
  validateSingleVideoPack,
  validateShootDayPlan,
  validatePillar,
  type ShootDayPlan,
  type ShootDayContext,
  type Pillar,
} from "@/lib/prompts/shoot-day-engine";
import {
  normalizeShootDayText,
  sanitizeHadarQuotes,
  stripEmDashes,
  lintCorpusLeaks,
} from "@/lib/prompts/shoot-day-lint";
import { personalizeSystemPrompt } from "@/lib/prompts/hadar-corpus-selection";

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
    gender:         (userRow.gender === "m" || userRow.gender === "f") ? userRow.gender : null,
    bio_long:       row.signal.content_kit?.bio_long ?? undefined,
    positioning_statement: row.signal.content_kit?.positioning_statement ?? undefined,
  };

  // ── Phase 2: single Claude call — Video #1 (IDENTITY) ───────────────
  let videoText = "";
  try {
    const client = new Anthropic();
    const videoRes = await client.messages.create({
      model:      SHOOT_DAY_MODEL_SONNET,
      max_tokens: SINGLE_VIDEO_PACK_MAX_TOKENS,
      system:     personalizeSystemPrompt(SINGLE_VIDEO_PACK_SYSTEM, { extractionId: id, occupation: ctx.occupation }),
      messages:   [{ role: "user", content: buildSingleVideoContextMessage(ctx, identity_statement, pillars) }],
    });
    videoText = videoRes.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  } catch (e) {
    return NextResponse.json({ error: "Phase 2 failed", details: String(e) }, { status: 500 });
  }

  let videoParsed: unknown;
  try {
    videoParsed = parseJsonResponse(videoText);
  } catch (e) {
    return NextResponse.json({ error: "Video JSON parse failed", details: String(e), raw: videoText.slice(0, 500) }, { status: 500 });
  }
  if (!validateSingleVideoPack(videoParsed)) {
    return NextResponse.json({ error: "Single video pack invalid shape", raw: videoText.slice(0, 500) }, { status: 500 });
  }

  // ── Assemble + cache (with deterministic output guards) ──────────────
  const video1 = sanitizeHadarQuotes(normalizeShootDayText([videoParsed.video]))[0];

  // Anti-verbatim leak check (Alon 2026-07-10). Same policy as the /videos
  // route: reject the pack and let the client retry so the model resamples.
  const leaks1 = lintCorpusLeaks(video1.script);
  if (leaks1.length > 0) {
    console.error(`[shoot-day finish ${id}] corpus-leak reject:`, leaks1);
    return NextResponse.json(
      { error: "Verbatim corpus leak detected — retrying", details: leaks1[0] },
      { status: 422 },
    );
  }

  const plan: ShootDayPlan = {
    identity_statement: stripEmDashes(identity_statement),
    pillars: normalizeShootDayText(pillars) as [Pillar, Pillar, Pillar, Pillar],
    videos:  [video1],
  };

  if (!validateShootDayPlan(plan)) {
    return NextResponse.json({ error: "Final plan assembly failed validation", plan }, { status: 500 });
  }

  const generated_at = new Date().toISOString();
  const newSignal = {
    ...row.signal,
    shoot_day:              plan,
    shoot_day_generated_at: generated_at,
    // Also store video 1 as a per-video slice — the GET endpoint's full-plan
    // assembly counts shoot_day_v1..v7 slices, and without this the plan
    // built via finish + builder tops out at 6 slices and never goes full.
    shoot_day_v1:           video1,
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
