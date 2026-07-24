/**
 * POST /api/lab/interview-questions
 * Body: { extraction_id, video_number }
 * → { questions: [{ q, why, probe }...] }
 *
 * Generates and caches 2-3 Hadar-style interview questions for a lab
 * episode. If cached (signal.lab[n].questions exists), returns those.
 * Otherwise calls Claude and writes into signal.lab[n].questions.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireLabUser } from "@/lib/lab/gate";
import { findLabEpisode } from "@/lib/lab/episodes";
import { createServerClient } from "@/lib/supabase/server";
import {
  LAB_MODEL,
  INTERVIEW_MAX_TOKENS,
  buildInterviewSystem,
  buildInterviewUser,
  type LabSignal,
  type LabQuestion,
} from "@/lib/lab/prompts";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const gate = await requireLabUser(req);
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const extractionId = typeof body?.extraction_id === "string" ? body.extraction_id : "";
  const videoNumber  = Number(body?.video_number);
  const force        = Boolean(body?.force);
  const episode      = findLabEpisode(videoNumber);
  if (!extractionId || !episode) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

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
  if (!force && Array.isArray(slot.questions) && slot.questions.length) {
    return NextResponse.json({ questions: slot.questions, cached: true });
  }

  const s = ext.signal ?? {};
  const signal: LabSignal = {
    signal:         String(s.signal ?? ""),
    signal_promise: String(s.signal_promise ?? ""),
    pain_source:    String(s.pain_source ?? ""),
    element:        String(s.element ?? ""),
    central_tool:   String(s.central_tool ?? ""),
    people:         String(s.people ?? ""),
    warm_note:      String(s.warm_note ?? ""),
    occupation:     null,
    gender:         gate.user.gender,
    name:           gate.user.name,
  };

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const rsp = await anthropic.messages.create({
    model:       LAB_MODEL,
    max_tokens:  INTERVIEW_MAX_TOKENS,
    system:      buildInterviewSystem(episode),
    messages:    [{ role: "user", content: buildInterviewUser(signal) }],
    temperature: 0.9,
  });

  const text = rsp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text).join("").trim();

  let parsed: { questions?: LabQuestion[] };
  try {
    parsed = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
  } catch {
    return NextResponse.json({ error: "parse_failed", raw: text.slice(0, 500) }, { status: 502 });
  }
  const questions = Array.isArray(parsed?.questions)
    ? parsed.questions
        .filter((q) => q && typeof q.q === "string" && q.q.trim().length > 0)
        .slice(0, 3)
        .map((q) => ({ q: String(q.q), why: String(q.why ?? ""), probe: String(q.probe ?? "") }))
    : [];
  if (questions.length < 2) {
    return NextResponse.json({ error: "too_few_questions", raw: text.slice(0, 500) }, { status: 502 });
  }

  const nextSignal = {
    ...ext.signal,
    lab: {
      ...labState,
      [String(videoNumber)]: { ...slot, questions, questions_generated_at: new Date().toISOString() },
    },
  };
  await (db as any).from("signal_extractions").update({ signal: nextSignal }).eq("id", extractionId);

  return NextResponse.json({ questions, cached: false });
}
