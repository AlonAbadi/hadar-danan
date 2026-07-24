/**
 * POST /api/lab/answers
 * Body: { extraction_id, video_number, answers: string[] }
 * → { ok: true }
 *
 * Saves the user's raw answers for a lab episode. Answers are stored
 * verbatim (no cleaning). The script-generation step later reads them.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireLabUser } from "@/lib/lab/gate";
import { findLabEpisode } from "@/lib/lab/episodes";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ANSWER_CHARS  = 2000;
const MAX_ANSWERS       = 5;

export async function POST(req: NextRequest) {
  const gate = await requireLabUser(req);
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const extractionId = typeof body?.extraction_id === "string" ? body.extraction_id : "";
  const videoNumber  = Number(body?.video_number);
  const rawAnswers   = Array.isArray(body?.answers) ? body.answers : [];
  if (!extractionId || !findLabEpisode(videoNumber)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const answers = rawAnswers
    .slice(0, MAX_ANSWERS)
    .map((a: unknown) => String(a ?? "").trim().slice(0, MAX_ANSWER_CHARS));

  const db = createServerClient();
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, user_id, signal")
    .eq("id", extractionId)
    .maybeSingle();
  if (!ext || ext.user_id !== gate.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const labState = (ext.signal?.lab ?? {}) as Record<string, any>;
  const slot     = labState[String(videoNumber)] ?? {};
  const nextSignal = {
    ...ext.signal,
    lab: {
      ...labState,
      [String(videoNumber)]: {
        ...slot,
        answers,
        answers_saved_at: new Date().toISOString(),
        // Invalidate stale script if the user re-answered.
        script: undefined,
      },
    },
  };
  await (db as any).from("signal_extractions").update({ signal: nextSignal }).eq("id", extractionId);
  return NextResponse.json({ ok: true });
}
