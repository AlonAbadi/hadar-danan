/**
 * POST /api/signal/[id]/shoot-day/director   (Phase 3 — Hadar's spoken direction)
 *
 * Body: { identity_statement, pillars (4), videos: [{number,title,type}] }
 *
 * Produces the script Hadar herself speaks: a ~90s personal director monologue
 * addressing the client by name + one short directing note per video. This is
 * the text the Higgsfield avatar (Soul ID + voice clone) will later voice.
 * Cached as signal.shoot_day_director; assembled into the plan by GET.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  DIRECTOR_PACK_SYSTEM,
  DIRECTOR_PACK_MAX_TOKENS,
  buildDirectorContextMessage,
  validateDirectorPack,
  validatePillar,
  type Pillar,
} from "@/lib/prompts/shoot-day-engine";
import { normalizeShootDayText } from "@/lib/prompts/shoot-day-lint";
import { gateAndBuildContext, runPack, parseJsonResponse, mergeSlice } from "@/lib/shoot-day/phase3";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

type VideoRef = { number: number; title: string; type: string };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let identity_statement: string;
  let pillars: Pillar[];
  let videos: VideoRef[];
  try {
    const body = await req.json();
    identity_statement = String(body?.identity_statement ?? "");
    pillars            = body?.pillars;
    videos             = Array.isArray(body?.videos) ? body.videos : [];
    if (!identity_statement || !Array.isArray(pillars) || pillars.length !== 4 || !pillars.every(validatePillar)) {
      return NextResponse.json({ error: "Missing or invalid phase-1 payload (identity_statement + 4 pillars)" }, { status: 400 });
    }
    // sanitize video refs (optional but improves note specificity)
    videos = videos
      .filter((v) => v && Number.isInteger(v.number) && v.number >= 1 && v.number <= 12)
      .map((v) => ({ number: v.number, title: String(v.title ?? ""), type: String(v.type ?? "") }));
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gate = await gateAndBuildContext(req, id);
  if (!gate.ok) return gate.response;

  let text = "";
  try {
    text = await runPack(
      DIRECTOR_PACK_SYSTEM,
      buildDirectorContextMessage(gate.ctx, identity_statement, pillars, videos),
      DIRECTOR_PACK_MAX_TOKENS,
    );
  } catch (e) {
    return NextResponse.json({ error: "Director generation failed", details: String(e) }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(text);
  } catch (e) {
    return NextResponse.json({ error: "Director JSON parse failed", details: String(e), raw: text.slice(0, 500) }, { status: 500 });
  }
  if (!validateDirectorPack(parsed)) {
    return NextResponse.json({ error: "Director pack invalid shape", raw: text.slice(0, 500) }, { status: 500 });
  }

  const director = normalizeShootDayText(parsed);
  await mergeSlice(gate.supabase, id, "shoot_day_director", director);

  return NextResponse.json({ director });
}
