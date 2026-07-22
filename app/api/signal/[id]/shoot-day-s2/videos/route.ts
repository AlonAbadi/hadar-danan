/**
 * POST /api/signal/[id]/shoot-day-s2/videos   (Season 2 · "אני בפעולה")
 *
 * Body: { identity_statement, pillars (4), numbers: number[] }
 *
 * Season 2 mirrors Season 1's videos route but generates the six
 * "אני בפעולה" episodes (numbers 21..26, stored on
 * signal.shoot_day_s2_v{n}). Reuses the same identity + pillars from the
 * original signal, since the whole point of Hadar's canonical funnel is
 * that every season expresses the same signal from a different angle.
 *
 * Alon 2026-07-22.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  VIDEOS_S2_PACK_SYSTEM,
  VIDEOS_S2_PACK_MAX_TOKENS,
  buildVideosS2ContextMessage,
  validateVideosPack,
  validatePillar,
  shootDayLanguage,
  withLanguage,
  type Pillar,
} from "@/lib/prompts/shoot-day-engine";
import {
  normalizeShootDayText,
  sanitizeHadarQuotes,
  lintCorpusLeaks,
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

const MAX_BATCH        = 3;   // Season 2 videos are longer/richer — send 1-2
const TOKENS_PER_VIDEO = 2700;
const S2_NUMBERS       = [21, 22, 23, 24, 25, 26];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ── Parse + validate body ────────────────────────────────────────────
  let identity_statement: string;
  let pillars: Pillar[];
  let numbers: number[];
  try {
    const body = await req.json();
    identity_statement = String(body?.identity_statement ?? "");
    pillars            = body?.pillars;
    numbers            = Array.isArray(body?.numbers) ? body.numbers.map(Number) : [];
    if (!identity_statement || !Array.isArray(pillars) || pillars.length !== 4 || !pillars.every(validatePillar)) {
      return NextResponse.json({ error: "Missing or invalid phase-1 payload (identity_statement + 4 pillars)" }, { status: 400 });
    }
    numbers = numbers.filter((n) => Number.isInteger(n) && S2_NUMBERS.includes(n));
    numbers = [...new Set(numbers)];
    if (numbers.length === 0 || numbers.length > MAX_BATCH) {
      return NextResponse.json({ error: `numbers must be 1-${MAX_BATCH} S2 video numbers in 21..26` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gate = await gateAndBuildContext(req, id);
  if (!gate.ok) return gate.response;

  const lang = shootDayLanguage(gate.signal);

  // Primary video for temperature + sampling rotation (Phase A diversity).
  const primaryVideo = numbers[0];

  // ── Generate the requested videos ────────────────────────────────────
  let text = "";
  try {
    text = await runPack(
      withLanguage(VIDEOS_S2_PACK_SYSTEM, lang),
      buildVideosS2ContextMessage(gate.ctx, identity_statement, pillars, numbers),
      Math.min(numbers.length * TOKENS_PER_VIDEO, VIDEOS_S2_PACK_MAX_TOKENS),
      { extractionId: id, occupation: gate.ctx.occupation, videoNumber: primaryVideo },
      // Season 2 leans into scene detail — a touch warmer than S1 defaults,
      // but never past 1.0 (Anthropic max).
      1.0,
    );
  } catch (e) {
    return NextResponse.json({ error: "Videos generation failed", details: String(e) }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(text);
  } catch (e) {
    try {
      await gate.supabase.from("error_logs").insert({
        context: "shoot-day-s2 videos JSON parse failed",
        error: String(e),
        payload: { extractionId: id, numbers, raw: text.slice(0, 4000) },
      });
    } catch { /* ignore */ }
    return NextResponse.json({ error: "Videos JSON parse failed", details: String(e), raw: text.slice(0, 500) }, { status: 500 });
  }
  if (!validateVideosPack(parsed)) {
    try {
      await gate.supabase.from("error_logs").insert({
        context: "shoot-day-s2 videos pack invalid shape",
        error: "validateVideosPack returned false",
        payload: { extractionId: id, numbers, raw: text.slice(0, 8000) },
      });
    } catch { /* ignore */ }
    return NextResponse.json({ error: "Videos pack invalid shape", raw: text.slice(0, 500) }, { status: 500 });
  }

  const videos = sanitizeHadarQuotes(normalizeShootDayText(parsed.videos))
    .filter((v) => numbers.includes(v.number));
  if (videos.length === 0) {
    return NextResponse.json({ error: `Model returned none of the requested S2 videos (${numbers.join(",")})`, raw: text.slice(0, 500) }, { status: 500 });
  }

  // Anti-verbatim leak enforcement — same rule as Season 1.
  const leaks = lintCorpusLeaks(videos.map((v) => v.script));
  if (leaks.length > 0) {
    console.error(`[shoot-day-s2 videos ${numbers.join(",")}] corpus-leak reject:`, leaks);
    return NextResponse.json(
      { error: "Verbatim corpus leak detected — retrying", details: leaks[0] },
      { status: 422 },
    );
  }

  // Cache each S2 video on its own slice — same pattern as Season 1 but
  // under shoot_day_s2_v{n}. The v-number matches the JSON number
  // (21..26) so writers and readers agree without any translation table.
  for (const v of videos) {
    await mergeSlice(gate.supabase, id, `shoot_day_s2_v${v.number}`, v);
  }

  return NextResponse.json({ videos });
}
