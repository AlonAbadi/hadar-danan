/**
 * Candidate-lead query for the daily call-list.
 *
 * Strategy: cheap pre-filter via 4 parallel SQL queries on indexed columns to
 * collect candidate user IDs, then hydrate full context (events, quiz, purchases)
 * for that small set only. Avoids scanning the full users + events product.
 *
 * The signals collected here are deliberately broad — the scoring stage decides
 * which ones cross the threshold for a call.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { CandidateLead } from "./types";
import { cleanEvents, selectBestQuiz, isJunkPageView } from "./junk-filter";

// High-ticket products. Buyers of any of these are excluded (already converted).
// Anyone else with a signal toward these is a candidate.
const HIGH_TICKET_PRODUCTS = new Set([
  "strategy_4000",
  "premium_14000",
  "partnership",       // not a Cardcom product — internal status only
  "strategy",          // quiz reco short-form
  "premium",           // quiz reco short-form
]);

// Pages that signal high-ticket intent when visited.
const HIGH_TICKET_PAGES = new Set([
  "/strategy",
  "/strategy/book",
  "/premium",
  "/partnership",
]);

// Statuses that exclude a lead entirely from the candidate set.
// `booked` is excluded because the user already booked a session as a result of
// the previous call — admin clicked "סגירה" on /admin/call-list.
const EXCLUDED_STATUSES = new Set(["handled", "not_relevant", "booked"]);

const HOT_EVENT_TYPES = [
  "CHECKOUT_STARTED",
  "PREMIUM_LEAD",
  "PARTNERSHIP_LEAD",
  "CALL_BOOKED",
];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export async function fetchCandidates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<Database> | any
): Promise<CandidateLead[]> {
  const t72h = isoDaysAgo(3);
  const t7d  = isoDaysAgo(7);
  const t30d = isoDaysAgo(30);

  // ── 1) Hot-signal events in last 72h ──────────────────────────────────────
  const hotPromise = supabase
    .from("events")
    .select("user_id")
    .in("type", HOT_EVENT_TYPES)
    .gte("created_at", t72h)
    .not("user_id", "is", null);

  // ── 2) PAGE_VIEW on high-ticket pages in last 7d ──────────────────────────
  // We over-fetch (filter metadata->>'page' in JS) because JSON filters in
  // Supabase queries are awkward to chain; volume is small.
  const pageViewPromise = supabase
    .from("events")
    .select("user_id, metadata")
    .eq("type", "PAGE_VIEW")
    .gte("created_at", t7d)
    .not("user_id", "is", null)
    .limit(5000);

  // ── 3) Quiz recommends high-ticket in last 30d ────────────────────────────
  const quizPromise = supabase
    .from("quiz_results")
    .select("user_id")
    .in("recommended_product", ["strategy", "premium", "partnership"])
    .gte("created_at", t30d)
    .not("user_id", "is", null);

  // ── 4) Users currently at high-intent / premium_lead / partnership_lead ──
  const statusPromise = supabase
    .from("users")
    .select("id")
    .in("status", ["high_intent", "premium_lead", "partnership_lead"]);

  // ── 5) Awakened: dormant >30d then activity in last 72h ──────────────────
  // Two-step: find dormant users, then intersect with recent event firers.
  const dormantPromise = supabase
    .from("users")
    .select("id")
    .lt("last_activity_at", t30d)
    .not("status", "in", "(buyer,booked,handled,not_relevant)");

  const recentlyActivePromise = supabase
    .from("events")
    .select("user_id")
    .gte("created_at", t72h)
    .not("user_id", "is", null);

  const [hotRes, pageRes, quizRes, statusRes, dormantRes, activeRes] = await Promise.all([
    hotPromise, pageViewPromise, quizPromise, statusPromise, dormantPromise, recentlyActivePromise,
  ]);

  // HOT_EVENT_TYPES are already high-intent action types — no junk filter needed.
  const hotIds = (hotRes.data ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean);

  // PAGE_VIEW: keep only real product paths (drop /api, /_next, /fonts, assets).
  const pageViewIds = (pageRes.data ?? [])
    .filter((r: { metadata: Record<string, unknown> | null }) => {
      if (!r.metadata || isJunkPageView(r.metadata)) return false;
      const page = (r.metadata as { page?: string }).page;
      return page && HIGH_TICKET_PAGES.has(page);
    })
    .map((r: { user_id: string }) => r.user_id)
    .filter(Boolean);

  const quizIds   = (quizRes.data   ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean);
  const statusIds = (statusRes.data ?? []).map((r: { id: string })      => r.id).filter(Boolean);

  const dormantSet = new Set((dormantRes.data ?? []).map((r: { id: string }) => r.id).filter(Boolean));
  const recentActiveIds = (activeRes.data ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean);
  const awakenedIds = recentActiveIds.filter((id: string) => dormantSet.has(id));

  const candidateIds = unique([...hotIds, ...pageViewIds, ...quizIds, ...statusIds, ...awakenedIds]);
  if (candidateIds.length === 0) return [];

  // ── Hydrate ───────────────────────────────────────────────────────────────
  const insightCutoff = isoDaysAgo(7);
  const [usersRes, eventsRes, quizzesRes, purchasesRes, insightsRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, phone, status, last_activity_at, created_at, utm_source, utm_campaign, marketing_consent")
      .in("id", candidateIds),
    supabase
      .from("events")
      .select("user_id, type, metadata, created_at")
      .in("user_id", candidateIds)
      .gte("created_at", t30d)
      .order("created_at", { ascending: false }),
    supabase
      .from("quiz_results")
      .select("user_id, recommended_product, second_product, match_percent, answers, created_at")
      .in("user_id", candidateIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("purchases")
      .select("user_id, product, amount, status, created_at")
      .in("user_id", candidateIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("user_insights")
      .select("user_id, synthesis, generated_at")
      .in("user_id", candidateIds)
      .gte("generated_at", insightCutoff)
      .order("generated_at", { ascending: false }),
  ]);

  type EventRow    = { user_id: string; type: string; metadata: Record<string, unknown>; created_at: string };
  type QuizRow     = { user_id: string; recommended_product: string; second_product: string | null; match_percent: number | null; answers: Record<string, unknown>; created_at: string };
  type PurchaseRow = { user_id: string; product: string; amount: number; status: string; created_at: string };

  // Raw events bucketed by user — junk filter is applied per-user below.
  const rawEventsByUser: Record<string, EventRow[]> = {};
  (eventsRes.data ?? []).forEach((e: EventRow) => {
    if (!rawEventsByUser[e.user_id]) rawEventsByUser[e.user_id] = [];
    rawEventsByUser[e.user_id]!.push(e);
  });

  // All recent quiz rows bucketed by user — selectBestQuiz picks the best
  // non-junk one and flags multi-submission noise.
  const quizzesByUser: Record<string, QuizRow[]> = {};
  (quizzesRes.data ?? []).forEach((q: QuizRow) => {
    if (!quizzesByUser[q.user_id]) quizzesByUser[q.user_id] = [];
    quizzesByUser[q.user_id]!.push(q);
  });

  const purchasesByUser: Record<string, PurchaseRow[]> = {};
  (purchasesRes.data ?? []).forEach((p: PurchaseRow) => {
    if (!purchasesByUser[p.user_id]) purchasesByUser[p.user_id] = [];
    purchasesByUser[p.user_id]!.push(p);
  });

  type InsightRow = { user_id: string; synthesis: string; generated_at: string };
  const insightByUser: Record<string, InsightRow> = {};
  ((insightsRes.data ?? []) as InsightRow[]).forEach((r) => {
    if (!insightByUser[r.user_id]) insightByUser[r.user_id] = r; // newest first
  });

  const t7dDate = new Date(t7d).getTime();

  type UserRow = {
    id: string; name: string | null; email: string; phone: string | null; status: string;
    last_activity_at: string | null; created_at: string;
    utm_source: string | null; utm_campaign: string | null; marketing_consent: boolean | null;
  };

  const leads: CandidateLead[] = [];

  for (const u of (usersRes.data ?? []) as UserRow[]) {
    // Hard exclusions
    if (!u.phone || u.phone.trim() === "") continue;
    if (EXCLUDED_STATUSES.has(u.status)) continue;

    const purchases = purchasesByUser[u.id] ?? [];
    const hasCompletedHighTicket = purchases.some(
      p => p.status === "completed" && HIGH_TICKET_PRODUCTS.has(p.product)
    );
    if (hasCompletedHighTicket) continue;

    const pendingHigh = purchases
      .filter(p => p.status === "pending" && HIGH_TICKET_PRODUCTS.has(p.product) && new Date(p.created_at).getTime() >= t7dDate)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    // Apply junk filters per user
    const { cleaned: cleanedEvents, junkCount: junkEventCount } = cleanEvents(rawEventsByUser[u.id] ?? []);
    const { quiz: bestQuiz, multipleSubmissionsFlag } = selectBestQuiz(quizzesByUser[u.id] ?? []);

    const isDormant = !!u.last_activity_at && new Date(u.last_activity_at).getTime() < new Date(t30d).getTime();
    const hadRecentActivity = cleanedEvents.some(
      e => new Date(e.created_at).getTime() >= new Date(t72h).getTime()
    );

    const insightRow = insightByUser[u.id];

    leads.push({
      id:               u.id,
      name:             u.name,
      email:            u.email,
      phone:            u.phone,
      status:           u.status,
      lastActivityAt:   u.last_activity_at,
      createdAt:        u.created_at,
      utmSource:        u.utm_source,
      utmCampaign:      u.utm_campaign,
      marketingConsent: u.marketing_consent ?? false,
      latestQuiz:       bestQuiz,
      recentEvents:     cleanedEvents,
      hasCompletedHighTicket,
      pendingHighTicketCheckout: pendingHigh
        ? { product: pendingHigh.product, amount: pendingHigh.amount, created_at: pendingHigh.created_at }
        : null,
      isAwakened: isDormant && hadRecentActivity,
      multipleQuizSubmissions: multipleSubmissionsFlag,
      junkEventCount,
      insight: insightRow ? { synthesis: insightRow.synthesis, generated_at: insightRow.generated_at } : null,
    });
  }

  return leads;
}

// Exported for the awakened-event detection in scoring.
export { HIGH_TICKET_PAGES, HIGH_TICKET_PRODUCTS };
