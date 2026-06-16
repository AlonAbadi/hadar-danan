/**
 * Bucket determination for the /signal result page.
 *
 * Decides which conversion offer the visitor sees after extraction:
 *
 *   - "strategy"  → ₪4,000 strategy meeting (face-to-face, 90 min)
 *   - "challenge" → ₪197 on-demand challenge (default for qualified-but-not-strategic leads)
 *   - "hive"      → ₪97/mo retainer (only for existing customers)
 *   - "nurture"   → free training (₪0) — for thin-but-warm signals; converts the dead-end into a list-build
 *   - "none"      → no offer; truly thin answers, save+share only
 *
 * Routing flow (in priority order):
 *   1. If the user is an existing customer (status IN buyer / booked) AND not
 *      yet a Hive member → "hive".
 *   2. If the LLM produced a high-confidence routing_signal, it drives the
 *      decision (with rules as a guardrail). This is the primary path post-
 *      schema-extension — the LLM has read all 5 answers and can judge
 *      commercial fit better than character-counting regex.
 *   3. If no LLM signal or low confidence, fall back to deterministic rules:
 *      - founderHint + depth + commitHits → strategy
 *      - very thin (< 40 chars total) → none
 *      - thin but engaged (40-79 chars) → nurture (free training)
 *      - default → challenge
 */

import type { SignalAnswers, RoutingSignal } from "@/lib/prompts/signal-engine";
import { validateRoutingSignal } from "@/lib/prompts/signal-engine";

export type Bucket = "strategy" | "challenge" | "hive" | "nurture" | "none";

/** Commitment lexicon — same as /apply, kept in sync deliberately. */
const COMMIT_WORDS = [
  "אעשה", "אשקיע", "להשקיע", "להגיע", "מחויבות", "מתחייב", "מתחייבת",
  "אני נחושה", "נחוש", "על הסף", "נדרש", "להעז", "ללכת",
  "אין לוותר", "אין דבר", "שעות", "מקדישה", "מסור", "רצינות",
  "מוכן", "מוכנה", "מתחיל", "מתחילה", "החלטתי", "אני עושה",
] as const;

/**
 * Heuristic check for "founder-shape" occupations: someone who self-identifies
 * as running a business, agency, or independent practice. The exact match
 * doesn't have to be perfect — it just has to bias the bucket decision when
 * combined with deep answers + commitment language.
 */
const FOUNDER_HINTS = [
  "יזם", "יזמית", "בעל עסק", "בעלת עסק", "מנכ", "מנהל", "מנהלת",
  "סוכנות", "חברה", "ייעוץ", "מייסד", "מייסדת", "פרילנס", "עצמאי",
  "עצמאית", "בעל סטודיו", "בעלת סטודיו", "מאמן עסקי", "מאמנת עסקית",
  "יועץ", "יועצת", "אסטרטג", "אסטרטגית",
] as const;

/**
 * Bucket score result — exposes the breakdown so we can store + analyze later.
 */
export interface BucketDecision {
  bucket:    Bucket;
  reason:    string;          // one-line explanation, useful in admin
  depth:     number;          // total chars across answers
  commitHits: number;         // count of commit words hit
  founderHint: boolean;       // occupation matched a founder pattern
}

interface DetermineInput {
  answers:        SignalAnswers;
  occupation:     string | null | undefined;
  userStatus:     string | null | undefined; // public.users.status
  hiveActive:     boolean;
  routingSignal?: RoutingSignal | unknown;   // optional — LLM's commercial-fit assessment
}

const STRATEGY_MIN_DEPTH         = 480;  // total chars across 5 answers
const STRATEGY_MIN_COMMIT_HITS   = 2;
const NURTURE_MIN_DEPTH          = 40;   // below this → none (genuinely empty)
const NURTURE_MAX_DEPTH          = 80;   // between NURTURE_MIN and this → nurture path
const LLM_OVERRIDE_MIN_CONFIDENCE = 0.7; // LLM must clear this to override rules

export function determineBucket(input: DetermineInput): BucketDecision {
  const { answers, occupation, userStatus, hiveActive, routingSignal } = input;

  const fullText = Object.values(answers).filter(Boolean).join(" ");
  const depth = fullText.trim().length;

  const commitHits = COMMIT_WORDS.reduce(
    (n, w) => (fullText.includes(w) ? n + 1 : n),
    0,
  );

  const occLower = (occupation ?? "").toLowerCase();
  const founderHint = FOUNDER_HINTS.some((h) => occLower.includes(h.toLowerCase()));

  // Rule 1: existing customer → Hive (continuation, not new sale). This rule
  // always wins regardless of LLM signal — retention overrides acquisition.
  const isCustomer = userStatus === "buyer" || userStatus === "booked";
  if (isCustomer && !hiveActive) {
    return {
      bucket:      "hive",
      reason:      "existing customer not yet in Hive",
      depth, commitHits, founderHint,
    };
  }

  // Rule 2: LLM-driven routing (if a valid high-confidence routing_signal is
  // present). The LLM has read all 5 answers in context; its judgment beats
  // regex-on-raw-text when confidence is high. Below the threshold, fall
  // through to rules as a guardrail.
  const llm = validateRoutingSignal(routingSignal) ? routingSignal : null;
  if (llm && llm.confidence >= LLM_OVERRIDE_MIN_CONFIDENCE) {
    if (llm.recommended_bucket === "strategy") {
      return {
        bucket:      "strategy",
        reason:      `LLM strategy (confidence ${llm.confidence.toFixed(2)}, fit=${llm.commercial_fit}, stage=${llm.founder_stage})`,
        depth, commitHits, founderHint,
      };
    }
    if (llm.recommended_bucket === "nurture") {
      return {
        bucket:      "nurture",
        reason:      `LLM nurture (confidence ${llm.confidence.toFixed(2)}, fit=${llm.commercial_fit})`,
        depth, commitHits, founderHint,
      };
    }
    if (llm.recommended_bucket === "challenge") {
      return {
        bucket:      "challenge",
        reason:      `LLM challenge (confidence ${llm.confidence.toFixed(2)}, fit=${llm.commercial_fit})`,
        depth, commitHits, founderHint,
      };
    }
    // "uncertain" falls through to rules
  }

  // Rule 3 (rules fallback): strategy qualification — founder + deep + committed
  if (founderHint && depth >= STRATEGY_MIN_DEPTH && commitHits >= STRATEGY_MIN_COMMIT_HITS) {
    return {
      bucket:      "strategy",
      reason:      `rules: founder + depth ${depth} + ${commitHits} commit hits`,
      depth, commitHits, founderHint,
    };
  }

  // Rule 4 (rules fallback): truly empty → none
  if (depth < NURTURE_MIN_DEPTH) {
    return {
      bucket:      "none",
      reason:      `rules: depth ${depth} below nurture floor`,
      depth, commitHits, founderHint,
    };
  }

  // Rule 5 (rules fallback): thin but engaged → nurture (free training)
  if (depth < NURTURE_MAX_DEPTH) {
    return {
      bucket:      "nurture",
      reason:      `rules: depth ${depth} in nurture band`,
      depth, commitHits, founderHint,
    };
  }

  // Rule 6 (rules fallback): default → Challenge
  return {
    bucket:      "challenge",
    reason:      "rules: default route",
    depth, commitHits, founderHint,
  };
}
