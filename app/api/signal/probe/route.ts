/**
 * POST /api/signal/probe
 *
 * The one dynamic follow-up. Given a single questionnaire answer, asks Claude
 * whether it holds a concrete lived moment. If not, returns ONE warm follow-up
 * question (Hadar's voice) the form shows inline — soft, optional, never blocks.
 *
 * Cheap + fast: one short Sonnet call (~1s). Soft-fails open — any error or
 * timeout returns { concrete: true } so the form never gets stuck on the probe.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { SIGNAL_QUESTIONS } from "@/lib/prompts/signal-engine";
import {
  SIGNAL_PROBE_MODEL,
  SIGNAL_PROBE_MAX_TOKENS,
  SIGNAL_PROBE_SYSTEM_PROMPT,
  buildProbeUserMessage,
  parseProbeResult,
} from "@/lib/prompts/signal-probe";

export const runtime = "nodejs";
export const maxDuration = 15;

// Soft-fail response: treat the answer as concrete so the form proceeds with no
// follow-up. Used on any error, timeout, rate-limit, or unparseable output —
// the probe is an enhancement, never a gate.
const PASS = NextResponse.json({ concrete: true, followup: null });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return PASS;
  }

  const { answer, questionKey, gender } = (body ?? {}) as {
    answer?: string;
    questionKey?: string;
    gender?: "m" | "f";
  };

  // Need a real answer with at least a little substance to be worth probing.
  if (typeof answer !== "string" || answer.trim().length < 12) return PASS;

  const question = SIGNAL_QUESTIONS.find((q) => q.key === questionKey);
  const questionLabel = question?.label ?? "מה עזר לך לצאת מזה, מה פיתחת בעצמך";

  // Rate limit per IP — modest, the probe runs a few times per diagnostic.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!rateLimit(`signal-probe:${ip}`, 30, 60 * 1000)) return PASS;

  try {
    const anthropic = new Anthropic();
    const resp = await anthropic.messages.create({
      model:      SIGNAL_PROBE_MODEL,
      max_tokens: SIGNAL_PROBE_MAX_TOKENS,
      system:     SIGNAL_PROBE_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildProbeUserMessage(questionLabel, answer, gender) },
      ],
    });

    const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const result = parseProbeResult(text);
    if (!result) return PASS;

    return NextResponse.json(result);
  } catch (err) {
    // Best-effort error log; never let the probe break the flow.
    try {
      const db = createServerClient();
      await db.from("error_logs").insert({
        context: "api/signal/probe POST",
        error:   err instanceof Error ? err.message : String(err),
        payload: { questionKey },
      });
    } catch {
      // swallow — soft-fail open
    }
    return PASS;
  }
}
