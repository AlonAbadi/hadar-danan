/**
 * Pure scoring function — converts a candidate into a score + Hebrew reasons.
 *
 * Weights are tuned for high-ticket sales (strategy ₪4k / premium ₪14k /
 * partnership ₪10k-30k/mo). Recency dominates: a 3-day-old signal beats a
 * 30-day-old one, regardless of strength. Stated intent (quiz) is multiplied
 * by behavioral signal (page views, checkout), not added — to penalize "talked
 * the talk but didn't show up."
 */

import type { CandidateLead, ScoredLead } from "./types";

const HIGH_TICKET_PAGES = new Set([
  "/strategy",
  "/strategy/book",
  "/premium",
  "/partnership",
]);

const HIGH_TICKET_QUIZ_PRODUCTS = new Set(["strategy", "premium", "partnership"]);

const HIGH_TICKET_CHECKOUT_PRODUCTS = new Set(["strategy_4000", "premium_14000"]);

// Hours-since-event → decay multiplier (1.0 at 0h, 0 at 7d)
function recencyMultiplier(eventDate: string): number {
  const hoursAgo = (Date.now() - new Date(eventDate).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24)  return 1.0;
  if (hoursAgo < 72)  return 0.7;
  if (hoursAgo < 168) return 0.4;   // 7 days
  return 0.15;
}

const PRODUCT_HE: Record<string, string> = {
  strategy:       "פגישת אסטרטגיה",
  premium:        "יום צילום פרמיום",
  partnership:    "שותפות אסטרטגית",
  strategy_4000:  "פגישת אסטרטגיה",
  premium_14000:  "יום צילום פרמיום",
};

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function formatHoursAgo(h: number): string {
  if (h < 1)  return "ממש עכשיו";
  if (h < 24) return `לפני ${Math.round(h)} שעות`;
  const days = Math.round(h / 24);
  return `לפני ${days} ${days === 1 ? "יום" : "ימים"}`;
}

export function scoreLead(lead: CandidateLead): ScoredLead {
  let score = 0;
  const reasons: string[] = [];

  // ── Base score by status ─────────────────────────────────────────────────
  const baseByStatus: Record<string, number> = {
    partnership_lead: 40,
    premium_lead:     35,
    high_intent:      30,
    engaged:          15,
    lead:             5,
  };
  score += baseByStatus[lead.status] ?? 5;

  // ── Hot signal: pending checkout on high-ticket in last 7d ───────────────
  if (lead.pendingHighTicketCheckout) {
    const p = lead.pendingHighTicketCheckout;
    const h = hoursAgo(p.created_at);
    const recency = recencyMultiplier(p.created_at);
    score += 60 * recency;
    const productHe = PRODUCT_HE[p.product] ?? p.product;
    reasons.push(`התחיל/ה תשלום על ${productHe} ${formatHoursAgo(h)} ולא סיים/ה`);
  }

  // ── Quiz recommendation toward high-ticket ───────────────────────────────
  if (lead.latestQuiz && HIGH_TICKET_QUIZ_PRODUCTS.has(lead.latestQuiz.recommended_product)) {
    const match = lead.latestQuiz.match_percent ?? 0;
    const recency = recencyMultiplier(lead.latestQuiz.created_at);
    const intentBoost = 25 * (match / 100) * recency;
    score += intentBoost;

    const productHe = PRODUCT_HE[lead.latestQuiz.recommended_product] ?? lead.latestQuiz.recommended_product;
    const matchTxt = match > 0 ? ` (${Math.round(match)}% התאמה)` : "";
    reasons.push(`קוויז: ${productHe}${matchTxt}`);
  }

  // ── PAGE_VIEW on high-ticket pages — count + recency ─────────────────────
  const highTicketVisits = lead.recentEvents.filter(
    e => e.type === "PAGE_VIEW" &&
         typeof (e.metadata as { page?: string }).page === "string" &&
         HIGH_TICKET_PAGES.has((e.metadata as { page: string }).page)
  );

  if (highTicketVisits.length > 0) {
    // Score the most recent visit + a small bonus for repeated visits
    const mostRecent = highTicketVisits[0]!;
    const recency = recencyMultiplier(mostRecent.created_at);
    score += 30 * recency;
    if (highTicketVisits.length >= 3) score += 10;

    const pages = Array.from(new Set(highTicketVisits.map(
      e => (e.metadata as { page: string }).page
    ))).slice(0, 2);
    reasons.push(`ביקור${highTicketVisits.length > 1 ? `ים (${highTicketVisits.length})` : ""} ב-${pages.join(" + ")}`);
  }

  // ── PREMIUM_LEAD / PARTNERSHIP_LEAD events ───────────────────────────────
  const leadFormEvents = lead.recentEvents.filter(
    e => e.type === "PREMIUM_LEAD" || e.type === "PARTNERSHIP_LEAD"
  );
  if (leadFormEvents.length > 0) {
    const e = leadFormEvents[0]!;
    score += 35 * recencyMultiplier(e.created_at);
    const what = e.type === "PREMIUM_LEAD" ? "פרמיום" : "שותפות";
    reasons.push(`מילא טופס ליד ${what} ${formatHoursAgo(hoursAgo(e.created_at))}`);
  }

  // ── CHECKOUT_STARTED on high-ticket (event, not pending purchase) ────────
  // Catches cases where checkout was started but pending row was cancelled.
  const checkoutEvents = lead.recentEvents.filter(
    e => e.type === "CHECKOUT_STARTED" &&
         HIGH_TICKET_CHECKOUT_PRODUCTS.has((e.metadata as { product?: string }).product ?? "")
  );
  if (checkoutEvents.length > 0 && !lead.pendingHighTicketCheckout) {
    const e = checkoutEvents[0]!;
    score += 25 * recencyMultiplier(e.created_at);
    const product = (e.metadata as { product: string }).product;
    const productHe = PRODUCT_HE[product] ?? product;
    reasons.push(`התחיל/ה checkout: ${productHe} ${formatHoursAgo(hoursAgo(e.created_at))}`);
  }

  // ── Awakened: dormant >30d, returned in last 72h ─────────────────────────
  if (lead.isAwakened) {
    score += 25;
    const daysDormant = lead.lastActivityAt
      ? Math.round((Date.now() - new Date(lead.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    reasons.push(`חזר/ה לאחר ${daysDormant} ימי שתיקה`);
  }

  // ── Engagement: total events in last 7d ──────────────────────────────────
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const events7d = lead.recentEvents.filter(
    e => Date.now() - new Date(e.created_at).getTime() < sevenDaysMs
  );
  if (events7d.length >= 5) {
    score += Math.min(15, events7d.length); // soft cap
    reasons.push(`${events7d.length} פעולות בשבוע האחרון`);
  }

  // ── Penalty: no marketing consent (still callable, but flag) ─────────────
  if (!lead.marketingConsent) {
    score -= 5;
  }

  return { ...lead, score, reasons };
}

const MIN_SCORE_THRESHOLD = 30;
const MAX_LEADS_PER_DAY   = 10;
const MIN_LEADS_PER_DAY   = 5;

/**
 * Pick the final list to call today.
 * - All leads scoring above MIN_SCORE_THRESHOLD are eligible
 * - If fewer than MIN_LEADS_PER_DAY pass, lower the bar to fill
 * - Cap at MAX_LEADS_PER_DAY
 */
export function pickTopLeads(scored: ScoredLead[]): ScoredLead[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const aboveThreshold = sorted.filter(l => l.score >= MIN_SCORE_THRESHOLD);

  if (aboveThreshold.length >= MIN_LEADS_PER_DAY) {
    return aboveThreshold.slice(0, MAX_LEADS_PER_DAY);
  }
  // Backfill from below-threshold to reach minimum
  return sorted.slice(0, MAX_LEADS_PER_DAY);
}

/**
 * Apply yesterday-dedup with hot-signal override.
 *
 * Drops leads that were on yesterday's list UNLESS they have a fresh hot
 * signal (CHECKOUT_STARTED, /strategy/book visit, or quiz completion) in
 * the last 24h — those are too important to skip.
 */
export function applyDedup(
  scored: ScoredLead[],
  yesterdayUserIds: Set<string>
): ScoredLead[] {
  const dayMs = 24 * 60 * 60 * 1000;
  return scored.filter(lead => {
    if (!yesterdayUserIds.has(lead.id)) return true;

    const hasHotSignal24h = lead.recentEvents.some(e => {
      const ageMs = Date.now() - new Date(e.created_at).getTime();
      if (ageMs > dayMs) return false;
      if (e.type === "CHECKOUT_STARTED") return true;
      if (e.type === "PAGE_VIEW" && (e.metadata as { page?: string }).page === "/strategy/book") return true;
      return false;
    });

    const freshQuiz = lead.latestQuiz &&
      Date.now() - new Date(lead.latestQuiz.created_at).getTime() < dayMs;

    return hasHotSignal24h || !!freshQuiz;
  });
}
