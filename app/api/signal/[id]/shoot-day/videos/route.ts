/**
 * POST /api/signal/[id]/shoot-day/videos   (Phase 3 — videos, small batches)
 *
 * Body: { identity_statement, pillars (4), numbers: number[] }
 *
 * Generates the requested video numbers (the client sends 1-2 at a time so each
 * call stays well under the Vercel 60s limit — a 4-video act timed out). Each
 * produced video is cached in its own field signal.shoot_day_v{n}; the GET
 * endpoint assembles the full 12-video plan once all of them plus strategy and
 * gifts exist.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  VIDEOS_PACK_SYSTEM,
  VIDEOS_PACK_MAX_TOKENS,
  buildVideosContextMessage,
  validateVideosPack,
  validatePillar,
  shootDayLanguage,
  withLanguage,
  type Pillar,
} from "@/lib/prompts/shoot-day-engine";
import {
  normalizeShootDayText,
  sanitizeHadarQuotes,
  lintShootDay,
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

const MAX_BATCH    = 4;          // hard cap; client should send 1-2
const TOKENS_PER_VIDEO = 2500;   // bounds generation time per call

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
    numbers = numbers.filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
    numbers = [...new Set(numbers)];
    if (numbers.length === 0 || numbers.length > MAX_BATCH) {
      return NextResponse.json({ error: `numbers must be 1-${MAX_BATCH} video numbers in 1..12` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gate = await gateAndBuildContext(req, id);
  if (!gate.ok) return gate.response;

  // English members (signal.language === "en") get the EN output rider
  // appended to the system prompt; Hebrew members hit identical bytes.
  const lang = shootDayLanguage(gate.signal);

  // ── Generate the requested videos ────────────────────────────────────
  // 2026-07-22 Alon (diversity phase A): tune sampling + temperature per
  // requested video so the same customer's season stops rhyming with itself.
  //
  //  - videoNumber in the corpus context rotates which quotes the model
  //    sees; V1 and V4 get different subsets of the corpus even for the
  //    same customer.
  //
  //  - temperature is per video type. Opinion / story shapes (V4 CRITIQUE,
  //    V6 STORY_OPINION) can push higher so the model doesn't collapse to
  //    the safest phrasing. The CTA-carrying V7 stays lower to keep the
  //    invitation crisp.
  //
  // When the client requests multiple videos in one batch the model has to
  // pick a single sampling seed, so we key off the first requested number —
  // the small client (kaveret) already ships them one-by-one.
  const primaryVideo = numbers[0];
  const temperature =
    primaryVideo === 4 || primaryVideo === 6 ? 1.1 :
    primaryVideo === 7 ? 0.85 :
    undefined; // V1/V2/V3/V5 keep the default
  let text = "";
  try {
    text = await runPack(
      withLanguage(VIDEOS_PACK_SYSTEM, lang),
      buildVideosContextMessage(gate.ctx, identity_statement, pillars, numbers),
      Math.min(numbers.length * TOKENS_PER_VIDEO, VIDEOS_PACK_MAX_TOKENS),
      { extractionId: id, occupation: gate.ctx.occupation, videoNumber: primaryVideo },
      temperature,
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
        context: "shoot-day videos JSON parse failed",
        error: String(e),
        payload: { extractionId: id, numbers, raw: text.slice(0, 4000) },
      });
    } catch { /* ignore */ }
    return NextResponse.json({ error: "Videos JSON parse failed", details: String(e), raw: text.slice(0, 500) }, { status: 500 });
  }
  if (!validateVideosPack(parsed)) {
    try {
      await gate.supabase.from("error_logs").insert({
        context: "shoot-day videos pack invalid shape",
        error: "validateVideosPack returned false",
        payload: { extractionId: id, numbers, raw: text.slice(0, 8000) },
      });
    } catch { /* ignore */ }
    return NextResponse.json({ error: "Videos pack invalid shape", raw: text.slice(0, 500) }, { status: 500 });
  }

  const videos = sanitizeHadarQuotes(normalizeShootDayText(parsed.videos))
    .filter((v) => numbers.includes(v.number));
  if (videos.length === 0) {
    return NextResponse.json({ error: `Model returned none of the requested videos (${numbers.join(",")})`, raw: text.slice(0, 500) }, { status: 500 });
  }

  const warnings = lintShootDay(videos);
  if (warnings.length) console.warn(`[shoot-day videos ${numbers.join(",")}] lint:`, warnings);

  // Anti-verbatim leak enforcement (Alon 2026-07-10 rule): if the model
  // reproduces 5+ consecutive words from any corpus quote in a
  // customer-facing field, we reject the pack and let the caller retry.
  // Retries hit the same prompt but different sampling, so a second attempt
  // usually clears the leak. Persistent leakage = prompt regression, alert
  // via error log.
  const leaks = lintCorpusLeaks(videos.map((v) => v.script));
  if (leaks.length > 0) {
    console.error(`[shoot-day videos ${numbers.join(",")}] corpus-leak reject:`, leaks);
    return NextResponse.json(
      { error: "Verbatim corpus leak detected — retrying", details: leaks[0] },
      { status: 422 },
    );
  }

  // Cache each video in its own field so parallel/sequential calls never
  // overwrite one another.
  for (const v of videos) {
    await mergeSlice(gate.supabase, id, `shoot_day_v${v.number}`, v);
  }

  return NextResponse.json({ videos, warnings });
}
