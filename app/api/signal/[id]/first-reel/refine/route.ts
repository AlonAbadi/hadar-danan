/**
 * POST /api/signal/[id]/first-reel/refine?t=<kaveret token>
 * Body: { story, stance, payoff }
 * → { title, script, language }
 *
 * The intake step Alon 2026-07-24 added on top of the first-reel flow:
 * BEFORE the prospect sees the auto-generated script, they answer 3
 * Hadar-style questions (story / stance / payoff). This endpoint runs
 * the full /first pipeline (signal + answers → move-select → draft →
 * critique → optional revision) and returns a refined script that IS
 * the prospect, not just their signal.
 *
 * Persists the refined script under signal.shoot_day_v1 so a returning
 * caller (same /kaveret/first-reel URL) picks it up on next load via
 * the existing GET /first-reel endpoint. Also records the intake
 * attempt under signal.first_reel_intake for Alon's admin view.
 *
 * IP: response body carries only title/script/language. Move name,
 * critique score, and their rationales stay server-side.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { APPROVED_MOVE_NAMES, type SignatureMoveName } from "@/lib/lab/hadar-brain";
import type { LabSignal } from "@/lib/lab/prompts";
import {
  FIRST_MODEL,
  FIRST_MOVE_SELECT_MAX_TOKENS,
  FIRST_SCRIPT_MAX_TOKENS,
  FIRST_CRITIQUE_MAX_TOKENS,
  buildFirstMoveSystem,
  buildFirstMoveUser,
  buildFirstScriptSystem,
  buildFirstScriptUser,
  buildFirstCritiqueSystem,
  buildFirstCritiqueUser,
  type FirstAnswers,
  type FirstMoveChoice,
  type FirstScript,
  type FirstCritique,
} from "@/lib/first/prompts";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 180;

function stripFence(text: string): string {
  return text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

async function claudeJson<T>(anthropic: Anthropic, opts: { system: string; user: string; maxTokens: number; temperature: number }): Promise<T> {
  const rsp = await anthropic.messages.create({
    model:       FIRST_MODEL,
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

function normalizeScript(raw: Partial<FirstScript>, fallbackTitle: string): FirstScript {
  const cleanStr = (v: unknown) => String(v ?? "").replace(/[—–]/g, ",").trim();
  return {
    title:              cleanStr(raw.title) || fallbackTitle,
    hook:               cleanStr(raw.hook),
    body:               cleanStr(raw.body),
    cta:                undefined,
    preserved_phrases:  Array.isArray(raw.preserved_phrases)
                          ? raw.preserved_phrases.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
    move_applied:       cleanStr(raw.move_applied),
    voice_devices_used: Array.isArray(raw.voice_devices_used)
                          ? raw.voice_devices_used.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
  };
}

/** Flatten a LabScript into the single-string shape /kaveret/first-reel
 *  expects (the GET endpoint returns a `script` string that
 *  toScriptShape splits back into hook/body/cta). */
function scriptToPlainText(s: FirstScript): string {
  const parts = [s.hook, s.body].filter((p) => p && p.trim().length);
  return parts.join("\n");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tokenId = verifyKaveretToken(req.nextUrl.searchParams.get("t"));
  if (!tokenId || tokenId !== id) {
    return NextResponse.json({ error: "קישור לא תקין" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const answers: FirstAnswers = {
    story:  String(body?.story  ?? "").trim(),
    stance: String(body?.stance ?? "").trim(),
    payoff: String(body?.payoff ?? "").trim(),
  };
  if (answers.story.length < 20 || answers.stance.length < 5) {
    return NextResponse.json({ error: "answers_too_thin" }, { status: 400 });
  }

  const db = createServerClient();
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, signal")
    .eq("id", id)
    .maybeSingle();
  if (!ext?.signal?.signal) {
    return NextResponse.json({ error: "signal_required" }, { status: 400 });
  }

  const s = ext.signal;
  const signal: LabSignal = {
    signal:         String(s.signal ?? ""),
    signal_promise: String(s.signal_promise ?? ""),
    pain_source:    String(s.pain_source ?? ""),
    element:        String(s.element ?? ""),
    central_tool:   String(s.central_tool ?? ""),
    people:         String(s.people ?? ""),
    warm_note:      String(s.warm_note ?? ""),
    occupation:     null,
    gender:         (s.gender === "m" || s.gender === "f") ? s.gender : null,
    name:           null,
  };

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // ── Stage 1: Move selection ──────────────────────────────────────────
  let moveRaw: Partial<FirstMoveChoice>;
  try {
    moveRaw = await claudeJson<Partial<FirstMoveChoice>>(anthropic, {
      system:      buildFirstMoveSystem(signal),
      user:        buildFirstMoveUser(answers, signal),
      maxTokens:   FIRST_MOVE_SELECT_MAX_TOKENS,
      temperature: 0.6,
    });
  } catch (e) {
    return NextResponse.json({ error: "move_parse_failed", detail: String((e as Error).message) }, { status: 502 });
  }
  const moveName = String(moveRaw.name ?? "").trim();
  if (!moveName || !APPROVED_MOVE_NAMES.includes(moveName as SignatureMoveName)) {
    return NextResponse.json({ error: "move_invalid", got: moveName }, { status: 502 });
  }
  const move: FirstMoveChoice = {
    name:  moveName as SignatureMoveName,
    why:   String(moveRaw.why ?? "").trim(),
    frame: String(moveRaw.frame ?? "").trim(),
  };

  // ── Stage 2: Script draft ────────────────────────────────────────────
  let draftRaw: Partial<FirstScript>;
  try {
    draftRaw = await claudeJson<Partial<FirstScript>>(anthropic, {
      system:      buildFirstScriptSystem(move, signal),
      user:        buildFirstScriptUser(answers, signal),
      maxTokens:   FIRST_SCRIPT_MAX_TOKENS,
      temperature: 0.65,
    });
  } catch (e) {
    return NextResponse.json({ error: "script_parse_failed", detail: String((e as Error).message) }, { status: 502 });
  }
  const draft = normalizeScript(draftRaw, "הרגע שהוא אתה");
  if (!draft.hook || !draft.body) {
    return NextResponse.json({ error: "empty_script" }, { status: 502 });
  }

  // ── Stage 3: Critique + optional revision ────────────────────────────
  let critique: FirstCritique = { score: 5, what_missed: "", revised: null };
  try {
    const raw = await claudeJson<Partial<FirstCritique>>(anthropic, {
      system:      buildFirstCritiqueSystem(move, signal),
      user:        buildFirstCritiqueUser(answers, draft, signal),
      maxTokens:   FIRST_CRITIQUE_MAX_TOKENS,
      temperature: 0.4,
    });
    const score = Number(raw.score);
    critique = {
      score:       Number.isFinite(score) ? Math.max(1, Math.min(5, Math.round(score))) : 5,
      what_missed: String(raw.what_missed ?? "").trim(),
      revised:     raw.revised ? normalizeScript(raw.revised, "הרגע שהוא אתה") : null,
    };
  } catch {
    critique = { score: 5, what_missed: "critique_unavailable", revised: null };
  }

  const finalScript: FirstScript = (critique.revised && critique.revised.hook && critique.revised.body)
    ? critique.revised
    : draft;

  // ── Persist the refined script back into the shape /first-reel reads ──
  // The existing GET /first-reel endpoint reads signal.shoot_day.videos[0]
  // (or signal.shoot_day_v1) via findShootDayVideo. We overwrite the v1
  // slice so returning callers immediately see the refined script. Also
  // record the intake attempt separately for Alon's admin view.
  const intakeState = (ext.signal?.first_reel_intake ?? {}) as Record<string, any>;
  const attempts    = Array.isArray(intakeState.attempts) ? intakeState.attempts : [];
  attempts.unshift({
    answers,
    move,
    script:            finalScript,
    draft_script:      draft,
    critique,
    generated_at:      new Date().toISOString(),
  });

  const nextSignal = {
    ...ext.signal,
    // Overwrite the v1 slice so the existing GET endpoint returns the
    // refined script for future page loads.
    shoot_day_v1: {
      number: 1,
      title:  finalScript.title,
      script: { hook: finalScript.hook, body: finalScript.body, cta: null },
    },
    first_reel_intake: { ...intakeState, attempts: attempts.slice(0, 10) },
  };
  await (db as any).from("signal_extractions").update({ signal: nextSignal }).eq("id", id);

  const language = String(s.language ?? "he") === "en" ? "en" : "he";
  return NextResponse.json({
    title:    finalScript.title,
    script:   scriptToPlainText(finalScript),
    language,
  });
}
