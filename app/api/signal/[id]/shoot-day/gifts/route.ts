/**
 * POST /api/signal/[id]/shoot-day/gifts   (Phase 3 — gift sentences)
 *
 * Body: { identity_statement, pillars (4) }
 *
 * Generates 5 gift sentences (Magic #6) in one ~800-token call (~5s).
 * Cached as signal.shoot_day_gifts; assembled into the full plan by GET.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  GIFT_SENTENCES_PACK_SYSTEM,
  GIFT_SENTENCES_PACK_MAX_TOKENS,
  buildGiftSentencesContextMessage,
  validateGiftSentencesPack,
  validatePillar,
  shootDayLanguage,
  withLanguage,
  type Pillar,
} from "@/lib/prompts/shoot-day-engine";
import { normalizeShootDayText } from "@/lib/prompts/shoot-day-lint";
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

  // English members (signal.language === "en") get the EN output rider.
  const lang = shootDayLanguage(gate.signal);

  let text = "";
  try {
    text = await runPack(
      withLanguage(GIFT_SENTENCES_PACK_SYSTEM, lang),
      buildGiftSentencesContextMessage(gate.ctx, identity_statement, pillars),
      GIFT_SENTENCES_PACK_MAX_TOKENS,
      { extractionId: id, occupation: gate.ctx.occupation },
    );
  } catch (e) {
    return NextResponse.json({ error: "Gift sentences generation failed", details: String(e) }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(text);
  } catch (e) {
    return NextResponse.json({ error: "Gifts JSON parse failed", details: String(e), raw: text.slice(0, 500) }, { status: 500 });
  }
  if (!validateGiftSentencesPack(parsed)) {
    return NextResponse.json({ error: "Gift sentences pack invalid shape", raw: text.slice(0, 500) }, { status: 500 });
  }

  const gift_sentences = normalizeShootDayText(parsed.gift_sentences);
  await mergeSlice(gate.supabase, id, "shoot_day_gifts", gift_sentences);

  return NextResponse.json({ gift_sentences });
}
