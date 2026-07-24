/**
 * POST /api/lab/generate-script
 * Body: { extraction_id, video_number }
 * → { script: { title, hook, body, cta?, preserved_phrases[] } }
 *
 * Uses the saved interview questions + user's answers to produce a script
 * that preserves the user's own words. Requires answers to exist first.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireLabUser } from "@/lib/lab/gate";
import { findLabEpisode } from "@/lib/lab/episodes";
import { createServerClient } from "@/lib/supabase/server";
import {
  LAB_MODEL,
  SCRIPT_MAX_TOKENS,
  buildScriptSystem,
  buildScriptUser,
  type LabSignal,
  type LabScript,
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
  const questions: LabQuestion[] = Array.isArray(slot.questions) ? slot.questions : [];
  const answers:   string[]      = Array.isArray(slot.answers) ? slot.answers : [];
  if (!questions.length) {
    return NextResponse.json({ error: "no_questions" }, { status: 400 });
  }
  const nonEmpty = answers.filter((a) => a && a.trim().length >= 5);
  if (nonEmpty.length === 0) {
    return NextResponse.json({ error: "no_answers" }, { status: 400 });
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
    max_tokens:  SCRIPT_MAX_TOKENS,
    system:      buildScriptSystem(episode),
    messages:    [{ role: "user", content: buildScriptUser(signal, questions, answers) }],
    temperature: 0.6,
  });

  const text = rsp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text).join("").trim();

  let parsed: Partial<LabScript>;
  try {
    parsed = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
  } catch {
    return NextResponse.json({ error: "parse_failed", raw: text.slice(0, 500) }, { status: 502 });
  }

  const cleanStr = (v: unknown) => String(v ?? "").replace(/[—–]/g, ",").trim();
  const script: LabScript = {
    title: cleanStr(parsed.title) || episode.title,
    hook:  cleanStr(parsed.hook),
    body:  cleanStr(parsed.body),
    cta:   parsed.cta ? cleanStr(parsed.cta) : undefined,
    preserved_phrases: Array.isArray(parsed.preserved_phrases)
      ? parsed.preserved_phrases.map(cleanStr).filter(Boolean).slice(0, 8)
      : [],
  };
  if (!script.hook || !script.body) {
    return NextResponse.json({ error: "empty_script", raw: text.slice(0, 500) }, { status: 502 });
  }

  const nextSignal = {
    ...ext.signal,
    lab: {
      ...labState,
      [String(videoNumber)]: { ...slot, script, script_generated_at: new Date().toISOString() },
    },
  };
  await (db as any).from("signal_extractions").update({ signal: nextSignal }).eq("id", extractionId);

  return NextResponse.json({ script });
}
