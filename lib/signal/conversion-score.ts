/**
 * Conversion-ease score for /signal leads.
 *
 * A heuristic that ranks who is most ready + able to become a paying customer,
 * computed from signals the engine already produces (routing_signal) plus the
 * lead's bucket and funnel status. Built from analysis of 94 real extractions:
 * the top tier is strategy-bucket + high commercial_fit + mature + buyer signals.
 *
 * IMPORTANT — this predicts FIT, not proven conversion. With only ~9 buyers so
 * far it is an evidence-informed heuristic, not a validated model. Re-weight
 * against actual purchases once enough conversions accumulate.
 */
import type { RoutingSignal } from "@/lib/prompts/signal-engine";

export type ConversionTier = "hot" | "warm" | "cold";

export interface ConversionScoreInput {
  routingSignal?: RoutingSignal | null | unknown;
  bucket?:        string | null;
  status?:        string | null;
}

export interface ConversionScore {
  score: number;          // ~0–12
  tier:  ConversionTier;
  // The factors that fired, for an at-a-glance "why" in the admin.
  reasons: string[];
}

const FIT_PTS:    Record<string, number> = { high: 3, medium: 2, low: 1, unclear: 0 };
const STAGE_PTS:  Record<string, number> = { established: 3, scaling: 2, practicing: 1, exploring: 0, unclear: 0 };
const MATURITY_PTS: Record<string, number> = { mature: 2, transitional: 1, raw: 0 };
const BUCKET_PTS: Record<string, number> = { strategy: 2, challenge: 1, hive: 0, nurture: 0, none: 0 };
const STATUS_PTS: Record<string, number> = { high_intent: 2, engaged: 1 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rs(v: unknown): any {
  return v && typeof v === "object" ? v : {};
}

export function conversionScore(input: ConversionScoreInput): ConversionScore {
  const r = rs(input.routingSignal);
  const reasons: string[] = [];
  let score = 0;

  const fit = r.commercial_fit as string | undefined;
  if (fit && FIT_PTS[fit] !== undefined) {
    score += FIT_PTS[fit];
    if (fit === "high")   reasons.push("עסק אמיתי (fit גבוה)");
    if (fit === "medium") reasons.push("פוטנציאל מסחרי");
  }

  const stage = r.founder_stage as string | undefined;
  if (stage && STAGE_PTS[stage] !== undefined) {
    score += STAGE_PTS[stage];
    if (stage === "established" || stage === "scaling") reasons.push("שלב עסקי בשל");
  }

  const maturity = r.signal_maturity as string | undefined;
  if (maturity && MATURITY_PTS[maturity] !== undefined) {
    score += MATURITY_PTS[maturity];
    if (maturity === "mature") reasons.push("אות בשל, מוכן לפעולה");
    if (maturity === "raw")    reasons.push("עדיין raw — נורצ'ר/שיחה קודם");
  } else {
    score += 0.5; // unknown maturity — neutral
  }

  if (Array.isArray(r.buyer_signals) && r.buyer_signals.length > 0) {
    score += 1;
    reasons.push("ביטא כוונה מסחרית");
  }

  const bucket = input.bucket ?? "";
  if (BUCKET_PTS[bucket]) score += BUCKET_PTS[bucket];
  if (bucket === "strategy") reasons.push("נותב לאסטרטגיה");

  const status = input.status ?? "";
  if (STATUS_PTS[status]) {
    score += STATUS_PTS[status];
    reasons.push(status === "high_intent" ? "high-intent בפאנל" : "כבר engaged");
  }

  if (typeof r.confidence === "number" && r.confidence >= 0.7) score += 0.5;

  score = Math.round(score * 10) / 10;
  const tier: ConversionTier = score >= 8 ? "hot" : score >= 5 ? "warm" : "cold";
  return { score, tier, reasons };
}

/** Normalize an Israeli phone to a wa.me-ready international string (972…). */
export function toWhatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0"))   return "972" + digits.slice(1);
  if (digits.length === 9)      return "972" + digits; // 5X-XXXXXXX without leading 0
  return digits;
}
