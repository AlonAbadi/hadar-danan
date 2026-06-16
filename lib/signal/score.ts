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

/**
 * Commitment lexicon — forked from /apply (`lib/stageScore.ts`).
 *
 * Why forked: /apply is an explicit commitment form where coached buzzwords
 * (להשקיע, רצינות, להעז) are real signal — people deliberately surface them.
 * /signal is a soul-extraction; the same buzzwords there are usually coached
 * vocabulary, not lived intent. We keep only words that predict commercial
 * intent when they appear in *spontaneous* answers to non-commercial questions.
 *
 * Removed (noisy or coached in this context): אעשה, להגיע, ללכת, שעות, מתחיל,
 * מתחילה, מוכן, מוכנה, אשקיע, להשקיע, להעז, רצינות, אני עושה, נדרש, אין דבר.
 * Added (concrete time-binding, present spontaneously in high-intent answers):
 * השנה, ברבעון, החודש, החלטה, סגרתי על, שמתי לעצמי.
 */
const COMMIT_WORDS = [
  "מחויבות", "מתחייב", "מתחייבת",
  "אני נחושה", "נחוש", "על הסף",
  "אין לוותר", "מקדישה", "מסור",
  "החלטתי", "החלטה",
  "השנה", "ברבעון", "החודש",
  "סגרתי על", "שמתי לעצמי",
] as const;

/**
 * Founder-shape detection from the occupation field. Pruned to remove the
 * self-labels that anyone can claim without traction (יזם, בעל עסק, מייסד,
 * פרילנס, עצמאי). Kept only the structural / role-based markers.
 */
const FOUNDER_HINTS_OCCUPATION = [
  "מנכ", "סוכנות", "חברה", "ייעוץ", "סטודיו",
  "מאמן עסקי", "מאמנת עסקית", "יועץ", "יועצת",
  "אסטרטג", "אסטרטגית",
] as const;

/**
 * Senior / high-ticket professional occupations. These roles imply
 * substantial revenue potential by virtue of the practice itself — a
 * working lawyer or doctor is already commercial, even when their
 * answers to soul-questions don't surface "business vocabulary"
 * (clients/team/quarter/decision). Used as a SECOND strategy path,
 * gated on substantial depth to avoid pushing early-career juniors
 * into a ₪4,000 offer they aren't ready for.
 *
 * Origin: דובי וינרוט (עו"ד) returned long, mature answers but zero
 * commit-words → rules defaulted him to ₪197 challenge, when his real
 * fit is the strategy meeting.
 */
const SENIOR_PROFESSIONAL_HINTS = [
  // Lawyer variants — Hebrew users write the role many ways
  "עו\"ד", "עוד", "עורך דין", "עורכת דין", "עריכת דין", "משפטן", "משפטנית", "משפטים",
  // Doctor / physician
  "רופא", "רופאה", "רפואה", "ד\"ר", "דוקטור",
  // Mental health
  "פסיכולוג", "פסיכולוגית", "פסיכולוגיה", "פסיכיאטר", "פסיכיאטרית",
  "פסיכותרפיסט", "פסיכותרפיסטית",
  // Accounting
  "רו\"ח", "רואה חשבון", "רואת חשבון", "חשבונאות",
  // Real estate
  "נדל\"ן", "נדלן", "סוכן נדלן", "סוכנת נדלן",
  // Architecture / engineering (senior)
  "אדריכל", "אדריכלית", "אדריכלות",
  // Domain expert / mentor by title
  "מומחה", "מומחית",
] as const;

/**
 * Founder-shape detection from inside the answer text — business-owner
 * identity language that surfaces naturally when someone actually runs a
 * business, even if their occupation field says "מטפלת" or "מעצבת". This
 * catches the practitioner-with-revenue cases the occupation regex misses.
 */
const FOUNDER_HINTS_ANSWERS = [
  "הלקוחות שלי", "הלקוחה שלי", "העסק שלי", "הצוות שלי",
  "המנויים שלי", "הקהילה שלי", "השיעורים שלי",
  "ניהלתי", "ניהלת", "בנינו", "בניתי", "ייסדתי", "הקמתי",
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

const STRATEGY_MIN_DEPTH               = 480;  // total chars across 5 answers
const STRATEGY_MIN_COMMIT_HITS         = 2;
const STRATEGY_SENIOR_PRO_MIN_DEPTH    = 700;  // gate for the senior-pro path — proves depth, not just title
const NURTURE_MIN_DEPTH                = 40;   // below this → none (genuinely empty)
const NURTURE_MAX_DEPTH                = 80;   // between NURTURE_MIN and this → nurture path
const LLM_OVERRIDE_MIN_CONFIDENCE      = 0.7;  // LLM must clear this to override rules

export function determineBucket(input: DetermineInput): BucketDecision {
  const { answers, occupation, userStatus, hiveActive, routingSignal } = input;

  const fullText = Object.values(answers).filter(Boolean).join(" ");
  const depth = fullText.trim().length;

  const commitHits = COMMIT_WORDS.reduce(
    (n, w) => (fullText.includes(w) ? n + 1 : n),
    0,
  );

  // Two-source founder detection: pruned occupation regex OR business-owner
  // identity language inside the answer text. Either firing is enough — the
  // single-source check was missing practitioners-with-revenue (e.g. "מטפלת"
  // with 80 paying clients/year) who don't self-label as founders.
  const occLower = (occupation ?? "").toLowerCase();
  const occHit = FOUNDER_HINTS_OCCUPATION.some((h) => occLower.includes(h.toLowerCase()));
  const answerHit = FOUNDER_HINTS_ANSWERS.some((h) => fullText.includes(h));
  const founderHint = occHit || answerHit;
  const seniorProHit = SENIOR_PROFESSIONAL_HINTS.some((h) => occLower.includes(h.toLowerCase()));

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

  // Rule 3a (rules fallback): strategy qualification — founder + deep + committed
  if (founderHint && depth >= STRATEGY_MIN_DEPTH && commitHits >= STRATEGY_MIN_COMMIT_HITS) {
    return {
      bucket:      "strategy",
      reason:      `rules: founder + depth ${depth} + ${commitHits} commit hits`,
      depth, commitHits, founderHint,
    };
  }

  // Rule 3b (rules fallback): senior professional + substantial depth →
  // strategy. Independent of commit-word vocabulary, which soul-questions
  // don't naturally elicit from established practitioners. Depth gate proves
  // they're showing up substantively, not just claiming the title.
  if (seniorProHit && depth >= STRATEGY_SENIOR_PRO_MIN_DEPTH) {
    return {
      bucket:      "strategy",
      reason:      `rules: senior pro (${occupation}) + depth ${depth}`,
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
