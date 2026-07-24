/**
 * POST /api/first/generate
 * Body: { story, stance, payoff }
 * → { script, move, critique }
 *
 * The acquisition first-video endpoint. Runs the same 4-stage pipeline
 * as the lab (move-selection → draft → critique → optional revision),
 * with the /first-specific prompts that hard-constrain length to
 * 20-30 seconds.
 *
 * Gated to LAB_ALLOWED_EMAILS (Alon-only) while we validate. Once Alon
 * approves the output pattern, we widen the gate to real prospects.
 *
 * Persists the result under signal.first on the caller's most recent
 * signal_extraction row, so Alon can see accumulated attempts.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireLabUser } from "@/lib/lab/gate";
import { createServerClient } from "@/lib/supabase/server";
import { APPROVED_MOVE_NAMES, type SignatureMoveName } from "@/lib/lab/hadar-brain";
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
    cta:                undefined,       // /first never emits a CTA in the script
    preserved_phrases:  Array.isArray(raw.preserved_phrases)
                          ? raw.preserved_phrases.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
    move_applied:       cleanStr(raw.move_applied),
    voice_devices_used: Array.isArray(raw.voice_devices_used)
                          ? raw.voice_devices_used.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
  };
}

export async function POST(req: NextRequest) {
  const gate = await requireLabUser(req);
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const answers: FirstAnswers = {
    story:  String(body?.story  ?? "").trim(),
    stance: String(body?.stance ?? "").trim(),
    payoff: String(body?.payoff ?? "").trim(),
  };
  if (answers.story.length < 20 || answers.stance.length < 5) {
    return NextResponse.json({ error: "answers_too_thin" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // ── Stage 1: Move selection ──────────────────────────────────────────
  let moveRaw: Partial<FirstMoveChoice>;
  try {
    moveRaw = await claudeJson<Partial<FirstMoveChoice>>(anthropic, {
      system:      buildFirstMoveSystem(),
      user:        buildFirstMoveUser(answers),
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
      system:      buildFirstScriptSystem(move),
      user:        buildFirstScriptUser(answers),
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
      system:      buildFirstCritiqueSystem(move),
      user:        buildFirstCritiqueUser(answers, draft),
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

  // ── Persist under signal.first on the caller's most recent extraction ─
  const db = createServerClient();
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, signal")
    .eq("user_id", gate.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ext) {
    const firstState = (ext.signal?.first ?? {}) as Record<string, any>;
    const attempts   = Array.isArray(firstState.attempts) ? firstState.attempts : [];
    attempts.unshift({
      answers,
      move,
      script:       finalScript,
      draft_script: draft,
      critique,
      generated_at: new Date().toISOString(),
    });
    const nextSignal = {
      ...ext.signal,
      first: { ...firstState, attempts: attempts.slice(0, 10) },
    };
    await (db as any).from("signal_extractions").update({ signal: nextSignal }).eq("id", ext.id);
  }

  // IP protection: move name + why + frame + critique are proprietary and
  // must never travel to the client. Persist them server-side (above) for
  // Alon's admin view; return only the prospect-facing script + a bare
  // meta indicator that a critique pass happened. Alon 2026-07-24.
  return NextResponse.json({
    script:            finalScript,
    critique_happened: critique.revised !== null,
  });
}
