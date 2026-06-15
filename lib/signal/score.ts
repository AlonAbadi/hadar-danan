/**
 * Bucket determination for the /signal result page.
 *
 * Decides which conversion offer the visitor sees after extraction:
 *
 *   - "strategy"  → ₪4,000 strategy meeting (face-to-face, 90 min)
 *   - "challenge" → ₪197 on-demand challenge (default for non-qualified leads)
 *   - "hive"      → ₪97/mo retainer (only for existing customers)
 *   - "none"      → no offer; the signal was too shallow to qualify any push
 *
 * Routing rules (in priority order):
 *   1. If the user is an existing customer (status IN buyer / booked) AND not
 *      yet a Hive member → "hive".
 *   2. If the signal qualifies for strategy (deep answers + commitment language
 *      + founder-style occupation) → "strategy".
 *   3. If the answers were so thin they don't justify any push → "none".
 *   4. Default → "challenge". The Challenge is the brand's entry-level door —
 *      anyone who left meaningful answers belongs here.
 */

import type { SignalAnswers } from "@/lib/prompts/signal-engine";

export type Bucket = "strategy" | "challenge" | "hive" | "none";

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
  answers:    SignalAnswers;
  occupation: string | null | undefined;
  userStatus: string | null | undefined; // public.users.status
  hiveActive: boolean;
}

const STRATEGY_MIN_DEPTH        = 480;  // total chars across 5 answers
const STRATEGY_MIN_COMMIT_HITS  = 2;
const TOO_SHALLOW_MAX_DEPTH     = 80;   // below this → no offer

export function determineBucket(input: DetermineInput): BucketDecision {
  const { answers, occupation, userStatus, hiveActive } = input;

  const fullText = Object.values(answers).filter(Boolean).join(" ");
  const depth = fullText.trim().length;

  const commitHits = COMMIT_WORDS.reduce(
    (n, w) => (fullText.includes(w) ? n + 1 : n),
    0,
  );

  const occLower = (occupation ?? "").toLowerCase();
  const founderHint = FOUNDER_HINTS.some((h) => occLower.includes(h.toLowerCase()));

  // Rule 1: existing customer → Hive (continuation, not new sale)
  const isCustomer = userStatus === "buyer" || userStatus === "booked";
  if (isCustomer && !hiveActive) {
    return {
      bucket:      "hive",
      reason:      "existing customer not yet in Hive",
      depth, commitHits, founderHint,
    };
  }

  // Rule 2: strategy qualification — founder-shape + deep + committed
  if (founderHint && depth >= STRATEGY_MIN_DEPTH && commitHits >= STRATEGY_MIN_COMMIT_HITS) {
    return {
      bucket:      "strategy",
      reason:      `founder occupation + depth ${depth} + ${commitHits} commit hits`,
      depth, commitHits, founderHint,
    };
  }

  // Rule 3: too shallow for any push
  if (depth < TOO_SHALLOW_MAX_DEPTH) {
    return {
      bucket:      "none",
      reason:      `depth ${depth} below threshold`,
      depth, commitHits, founderHint,
    };
  }

  // Rule 4: default → Challenge (the entry door)
  return {
    bucket:      "challenge",
    reason:      "default route",
    depth, commitHits, founderHint,
  };
}
