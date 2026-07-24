/**
 * POST /api/lab/generate-script
 * Body: { extraction_id, video_number }
 * → { script, move, critique }
 *
 * Four internal Claude calls per episode:
 *   1. Move selection — with cross-episode diversity (avoid moves already
 *      used in siblings unless keyword rules mandate)
 *   2. Script draft   — framed by the selected move + its structural template
 *   3. Critique       — score how well the template was hit
 *   4. Revision       — only if critique score < 4; produces a tightened
 *      script that actually lands the move
 *
 * The final `script` returned is the revised one when critique triggered,
 * otherwise the draft. `critique` includes the score + what was missed so
 * Alon can see whether the pass triggered.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireLabUser } from "@/lib/lab/gate";
import { findLabEpisode, LAB_EPISODES } from "@/lib/lab/episodes";
import { createServerClient } from "@/lib/supabase/server";
import { APPROVED_MOVE_NAMES, type SignatureMoveName } from "@/lib/lab/hadar-brain";
import {
  LAB_MODEL,
  MOVE_SELECT_MAX_TOKENS,
  SCRIPT_MAX_TOKENS,
  CRITIQUE_MAX_TOKENS,
  buildMoveSelectionSystem,
  buildMoveSelectionUser,
  buildScriptSystem,
  buildScriptUser,
  buildCritiqueSystem,
  buildCritiqueUser,
  type LabSignal,
  type LabMoveChoice,
  type LabScript,
  type LabQuestion,
  type LabCritique,
} from "@/lib/lab/prompts";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 180;

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

function normalizeScript(raw: Partial<LabScript>, fallbackTitle: string): LabScript {
  const cleanStr = (v: unknown) => String(v ?? "").replace(/[—–]/g, ",").trim();
  return {
    title:              cleanStr(raw.title) || fallbackTitle,
    hook:               cleanStr(raw.hook),
    body:               cleanStr(raw.body),
    cta:                raw.cta ? cleanStr(raw.cta) : undefined,
    preserved_phrases:  Array.isArray(raw.preserved_phrases)
                          ? raw.preserved_phrases.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
    move_applied:       cleanStr(raw.move_applied),
    voice_devices_used: Array.isArray(raw.voice_devices_used)
                          ? raw.voice_devices_used.map(cleanStr).filter(Boolean).slice(0, 8)
                          : [],
  };
}

/** Collect signature moves already selected across ALL episodes (both
 *  seasons), so the selector can prefer variety at the lab level, not
 *  just per-season. Excludes the current episode.
 *
 *  Alon 2026-07-24: S1E2 and S2E2 both landed on Service Reframe because
 *  within-season diversity treated the two seasons independently. Both
 *  scripts collapsed to the same "tech vs. essence" reframe. Cross-season
 *  diversity forces genuine variety across the whole lab. */
function collectSiblingMoves(labState: Record<string, any>, currentNumber: number): SignatureMoveName[] {
  const siblingNumbers = LAB_EPISODES
    .filter((e) => e.number !== currentNumber)
    .map((e) => e.number);
  const out: SignatureMoveName[] = [];
  for (const n of siblingNumbers) {
    const m = labState[String(n)]?.move?.name;
    if (m && APPROVED_MOVE_NAMES.includes(m)) out.push(m);
  }
  return out;
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

  // ── Stage 2: Move selection (with cross-episode diversity) ────────────
  const siblings = collectSiblingMoves(labState, videoNumber);
  let moveRaw: Partial<LabMoveChoice>;
  try {
    moveRaw = await claudeJson<Partial<LabMoveChoice>>(anthropic, {
      system:      buildMoveSelectionSystem(episode, siblings),
      user:        buildMoveSelectionUser(signal, questions, answers),
      maxTokens:   MOVE_SELECT_MAX_TOKENS,
      temperature: 0.5,
    });
  } catch (e) {
    return NextResponse.json({ error: "move_parse_failed", detail: String((e as Error).message) }, { status: 502 });
  }
  const moveName = String(moveRaw.name ?? "").trim();
  if (!moveName || !APPROVED_MOVE_NAMES.includes(moveName as SignatureMoveName)) {
    return NextResponse.json({ error: "move_invalid", got: moveName }, { status: 502 });
  }
  const move: LabMoveChoice = {
    name:  moveName as SignatureMoveName,
    why:   String(moveRaw.why ?? "").trim(),
    frame: String(moveRaw.frame ?? "").trim(),
  };

  // ── Stage 3: Script draft (with the move's structural template) ───────
  let draftRaw: Partial<LabScript>;
  try {
    draftRaw = await claudeJson<Partial<LabScript>>(anthropic, {
      system:      buildScriptSystem(episode, move),
      user:        buildScriptUser(signal, questions, answers),
      maxTokens:   SCRIPT_MAX_TOKENS,
      temperature: 0.65,
    });
  } catch (e) {
    return NextResponse.json({ error: "script_parse_failed", detail: String((e as Error).message) }, { status: 502 });
  }
  const draft = normalizeScript(draftRaw, episode.title);
  if (!draft.hook || !draft.body) {
    return NextResponse.json({ error: "empty_script" }, { status: 502 });
  }

  // ── Stage 4: Critique + optional revision ─────────────────────────────
  let critique: LabCritique = { score: 5, what_missed: "", revised: null };
  try {
    const raw = await claudeJson<Partial<LabCritique>>(anthropic, {
      system:      buildCritiqueSystem(episode, move),
      user:        buildCritiqueUser(signal, questions, answers, draft),
      maxTokens:   CRITIQUE_MAX_TOKENS,
      temperature: 0.4,
    });
    const score = Number(raw.score);
    critique = {
      score:       Number.isFinite(score) ? Math.max(1, Math.min(5, Math.round(score))) : 5,
      what_missed: String(raw.what_missed ?? "").trim(),
      revised:     raw.revised ? normalizeScript(raw.revised, episode.title) : null,
    };
  } catch {
    // Critique failure is non-fatal — we keep the draft.
    critique = { score: 5, what_missed: "critique_unavailable", revised: null };
  }

  // Only accept revision if it kept the hook + body non-empty.
  const finalScript: LabScript = (critique.revised && critique.revised.hook && critique.revised.body)
    ? critique.revised
    : draft;

  const nextSignal = {
    ...ext.signal,
    lab: {
      ...labState,
      [String(videoNumber)]: {
        ...slot,
        move,
        script:              finalScript,
        draft_script:        draft,       // keep for debugging / comparison
        critique,
        script_generated_at: new Date().toISOString(),
      },
    },
  };
  await (db as any).from("signal_extractions").update({ signal: nextSignal }).eq("id", extractionId);

  return NextResponse.json({ script: finalScript, move, critique });
}
