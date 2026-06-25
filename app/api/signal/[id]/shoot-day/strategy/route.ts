/**
 * POST /api/signal/[id]/shoot-day/strategy   (Phase 3 — strategy)
 *
 * Body: { identity_statement, pillars (4) }
 *
 * Generates visual_direction + schedule + 3 decisions in one ~2500-token call
 * (~10s). Cached as signal.shoot_day_strategy; assembled into the full plan by
 * the GET endpoint.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  STRATEGY_PACK_SYSTEM,
  STRATEGY_PACK_MAX_TOKENS,
  buildStrategyContextMessage,
  validateStrategyPack,
  validatePillar,
  type Pillar,
} from "@/lib/prompts/shoot-day-engine";
import { normalizeShootDayText, lintShootDay } from "@/lib/prompts/shoot-day-lint";
import { gateAndBuildContext, runPack, parseJsonResponse, mergeSlice } from "@/lib/shoot-day/phase3";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let identity_statement: string;
  let pillars: Pillar[];
  try {
    const body = await req.json();
    identity_statement = String(body?.identity_statement ?? "");
    pillars            = body?.pillars;
    if (!identity_statement || !Array.isArray(pillars) || pillars.length !== 4 || !pillars.every(validatePillar)) {
      return NextResponse.json({ error: "Missing or invalid phase-1 payload (identity_statement + 4 pillars)" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gate = await gateAndBuildContext(req, id);
  if (!gate.ok) return gate.response;

  let text = "";
  try {
    text = await runPack(
      STRATEGY_PACK_SYSTEM,
      buildStrategyContextMessage(gate.ctx, identity_statement, pillars),
      STRATEGY_PACK_MAX_TOKENS,
    );
  } catch (e) {
    return NextResponse.json({ error: "Strategy generation failed", details: String(e) }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(text);
  } catch (e) {
    return NextResponse.json({ error: "Strategy JSON parse failed", details: String(e), raw: text.slice(0, 500) }, { status: 500 });
  }
  if (!validateStrategyPack(parsed)) {
    return NextResponse.json({ error: "Strategy pack invalid shape", raw: text.slice(0, 500) }, { status: 500 });
  }

  const strategy = normalizeShootDayText({
    visual_direction: parsed.visual_direction,
    schedule:         parsed.schedule,
    decisions:        parsed.decisions,
  });

  const warnings = lintShootDay(strategy);
  if (warnings.length) console.warn("[shoot-day strategy] lint:", warnings);

  await mergeSlice(gate.supabase, id, "shoot_day_strategy", strategy);

  return NextResponse.json({ ...strategy, warnings });
}
