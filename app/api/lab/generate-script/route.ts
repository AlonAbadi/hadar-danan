/**
 * POST /api/lab/generate-script
 * Body: { extraction_id, video_number }
 * → { script, move }
 *
 * Two internal Claude calls:
 *   1. Select signature move (given signal + episode + user's answers)
 *   2. Generate script (given signal + episode + answers + selected move)
 *
 * Both stored under signal.lab[n] alongside the interview state.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireLabUser } from "@/lib/lab/gate";
import { findLabEpisode } from "@/lib/lab/episodes";
import { createServerClient } from "@/lib/supabase/server";
import { APPROVED_MOVE_NAMES } from "@/lib/lab/hadar-brain";
import {
  LAB_MODEL,
  MOVE_SELECT_MAX_TOKENS,
  SCRIPT_MAX_TOKENS,
  buildMoveSelectionSystem,
  buildMoveSelectionUser,
  buildScriptSystem,
  buildScriptUser,
  type LabSignal,
  type LabMoveChoice,
  type LabScript,
  type LabQuestion,
} from "@/lib/lab/prompts";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 120;

function stripFence(text: string): string {
  return text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

async function claudeJson<T>(anthropic: Anthropic, opts: { system: string; user: string; maxTokens: number; temperature: number }): Promise<T> {
  const rsp = await anthropic.messages.create({
    model:       LAB_MODEL,
    max_tokens:  opts.maxTokens,
    system:      opts.system,
    messages:    [{ role: "user", content: opts.user }],
    temperature: opts.temperature,
  });
  const text = rsp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text).join("").trim();
  return JSON.parse(stripFence(text)) as T;
}

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
  if (!questions.length)  return NextResponse.json({ error: "no_questions" }, { status: 400 });
  const nonEmpty = answers.filter((a) => a && a.trim().length >= 5);
  if (!nonEmpty.length)   return NextResponse.json({ error: "no_answers" }, { status: 400 });

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

  // ── Stage 2: Move selection ──────────────────────────────────────────
  let moveRaw: Partial<LabMoveChoice>;
  try {
    moveRaw = await claudeJson<Partial<LabMoveChoice>>(anthropic, {
      system:      buildMoveSelectionSystem(episode),
      user:        buildMoveSelectionUser(signal, questions, answers),
      maxTokens:   MOVE_SELECT_MAX_TOKENS,
      temperature: 0.5,
    });
  } catch (e) {
    return NextResponse.json({ error: "move_parse_failed", detail: String((e as Error).message) }, { status: 502 });
  }
  const moveName = String(moveRaw.name ?? "").trim();
  if (!moveName || !APPROVED_MOVE_NAMES.includes(moveName as typeof APPROVED_MOVE_NAMES[number])) {
    return NextResponse.json({ error: "move_invalid", got: moveName }, { status: 502 });
  }
  const move: LabMoveChoice = {
    name:  moveName as typeof APPROVED_MOVE_NAMES[number],
    why:   String(moveRaw.why ?? "").trim(),
    frame: String(moveRaw.frame ?? "").trim(),
  };

  // ── Stage 3: Script generation ───────────────────────────────────────
  let scriptRaw: Partial<LabScript>;
  try {
    scriptRaw = await claudeJson<Partial<LabScript>>(anthropic, {
      system:      buildScriptSystem(episode, move),
      user:        buildScriptUser(signal, questions, answers),
      maxTokens:   SCRIPT_MAX_TOKENS,
      temperature: 0.65,
    });
  } catch (e) {
    return NextResponse.json({ error: "script_parse_failed", detail: String((e as Error).message) }, { status: 502 });
  }

  const cleanStr = (v: unknown) => String(v ?? "").replace(/[—–]/g, ",").trim();
  const script: LabScript = {
    title:              cleanStr(scriptRaw.title) || episode.title,
    hook:               cleanStr(scriptRaw.hook),
    body:               cleanStr(scriptRaw.body),
    cta:                scriptRaw.cta ? cleanStr(scriptRaw.cta) : undefined,
    preserved_phrases:  Array.isArray(scriptRaw.preserved_phrases)
                          ? scriptRaw.preserved_phrases.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
    move_applied:       cleanStr(scriptRaw.move_applied),
    voice_devices_used: Array.isArray(scriptRaw.voice_devices_used)
                          ? scriptRaw.voice_devices_used.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
  };
  if (!script.hook || !script.body) {
    return NextResponse.json({ error: "empty_script" }, { status: 502 });
  }

  const nextSignal = {
    ...ext.signal,
    lab: {
      ...labState,
      [String(videoNumber)]: {
        ...slot,
        move,
        script,
        script_generated_at: new Date().toISOString(),
      },
    },
  };
  await (db as any).from("signal_extractions").update({ signal: nextSignal }).eq("id", extractionId);

  return NextResponse.json({ script, move });
}
