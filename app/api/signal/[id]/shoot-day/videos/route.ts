/**
 * POST /api/signal/[id]/shoot-day/videos   (Phase 3 — videos, one act per call)
 *
 * Body: { identity_statement, pillars (4), act: 1 | 2 | 3 }
 *
 * Generates the 4 videos of ONE act (act 1 = videos 1-4, act 2 = 5-8,
 * act 3 = 9-12). One act is ~2700 output tokens / ~15-20s — safely under the
 * Vercel 60s cap, where a single 12-video call is not. The slice is cached as
 * signal.shoot_day_act{N}; the GET endpoint assembles the full 12-video plan
 * once all three acts + strategy + gifts exist.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  VIDEOS_PACK_SYSTEM,
  VIDEOS_PACK_MAX_TOKENS,
  buildVideosContextMessage,
  validateVideosPack,
  validatePillar,
  ACT_VIDEO_NUMBERS,
  type Pillar,
} from "@/lib/prompts/shoot-day-engine";
import {
  normalizeShootDayText,
  sanitizeHadarQuotes,
  lintShootDay,
} from "@/lib/prompts/shoot-day-lint";
import {
  gateAndBuildContext,
  runPack,
  parseJsonResponse,
  mergeSlice,
} from "@/lib/shoot-day/phase3";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ── Parse + validate body ────────────────────────────────────────────
  let identity_statement: string;
  let pillars: Pillar[];
  let act: 1 | 2 | 3;
  try {
    const body = await req.json();
    identity_statement = String(body?.identity_statement ?? "");
    pillars            = body?.pillars;
    act                = Number(body?.act) as 1 | 2 | 3;
    if (!identity_statement || !Array.isArray(pillars) || pillars.length !== 4 || !pillars.every(validatePillar)) {
      return NextResponse.json({ error: "Missing or invalid phase-1 payload (identity_statement + 4 pillars)" }, { status: 400 });
    }
    if (![1, 2, 3].includes(act)) {
      return NextResponse.json({ error: "act must be 1, 2, or 3" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gate = await gateAndBuildContext(req, id);
  if (!gate.ok) return gate.response;

  // ── Generate this act ────────────────────────────────────────────────
  let text = "";
  try {
    text = await runPack(
      VIDEOS_PACK_SYSTEM,
      buildVideosContextMessage(gate.ctx, identity_statement, pillars, act),
      VIDEOS_PACK_MAX_TOKENS,
    );
  } catch (e) {
    return NextResponse.json({ error: "Videos generation failed", details: String(e) }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(text);
  } catch (e) {
    return NextResponse.json({ error: "Videos JSON parse failed", details: String(e), raw: text.slice(0, 500) }, { status: 500 });
  }
  if (!validateVideosPack(parsed)) {
    return NextResponse.json({ error: "Videos pack invalid shape", raw: text.slice(0, 500) }, { status: 500 });
  }

  // Keep only the videos that belong to the requested act (defensive).
  const expected = ACT_VIDEO_NUMBERS[act];
  const videos = sanitizeHadarQuotes(normalizeShootDayText(parsed.videos))
    .filter((v) => expected.includes(v.number));
  if (videos.length === 0) {
    return NextResponse.json({ error: `Model returned no videos for act ${act}`, raw: text.slice(0, 500) }, { status: 500 });
  }

  const warnings = lintShootDay(videos);
  if (warnings.length) console.warn(`[shoot-day act ${act}] lint:`, warnings);

  await mergeSlice(gate.supabase, id, `shoot_day_act${act}`, videos);

  return NextResponse.json({ act, videos, warnings });
}
