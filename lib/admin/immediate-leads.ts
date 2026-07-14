/**
 * לידים לטיפול מיידי — Hadar's daily worklist.
 *
 * The per-person, deduped list of "worth a personal WhatsApp from Hadar" leads,
 * with one shared handoff state machine (stored on users, migration 057).
 *
 * Source: v2 signal extractions routed to 'concierge' — an established business
 * (self-declared key1 C/D) that left a phone. The legacy bucket=strategy and the
 * retired quiz feeders were removed 2026-07-14: they flooded the list with stale,
 * often-unreachable leads. concierge is the single meeting-worthy definition.
 *
 * Read-time filtering removes:
 *   - Leads Hadar dismissed via "לא רלבנטי" (handoff_stage = 'dismissed', migration 058).
 *   - Leads who booked a meeting AND paid (completed purchase).
 *
 * Each row is enriched with a "context strip" — the 6 signals Hadar wants to
 * see BEFORE she opens WhatsApp: contact info, acquisition source, engagement
 * recency, spend history, marketing-consent state, and the LLM's routing
 * confidence + fit read. All computed in one server round-trip so the
 * /admin/today page stays fast.
 *
 * Fully non-fatal: any query error returns an empty list so the admin home
 * banner never breaks.
 */
import type { createServerClient } from "@/lib/supabase/server";
import {
  buildHandoffMessage,
  waPhoneOf,
} from "@/lib/signal/handoff-message";

export type HandoffStage = "queue" | "whatsapp_sent" | "meeting_booked" | "dismissed";

// The context strip is what Hadar reads before she decides whether to reach out.
// Keep it stable + small — every field must earn its slot.
export interface LeadContext {
  email:              string | null;
  phone:              string | null; // raw phone for tel: links
  utmSource:          string | null;
  utmCampaign:        string | null;
  marketingConsent:   boolean;
  status:             string | null; // CRM status: lead / engaged / high_intent / buyer / booked / ...
  lastActivityAt:     string | null;
  signupAt:           string | null;
  purchaseCount:      number;
  totalSpent:         number;
  routingConfidence:  number | null; // 0.0–1.0 from signal.routing_signal
  commercialFit:      string | null; // "high" / "medium" / "low" / "unclear"
  founderStage:       string | null; // exploring / practicing / scaling / established / unclear
  quizMatch:          number | null;  // quiz recommendation match % (quiz leads) — a real buy signal
  answerSnippet:      string | null; // short verbatim from the strongest answer, so we hear their voice
  // Full decision context (revealed on demand) — everything Hadar wants to read
  // BEFORE she decides whether this lead is worth a personal message.
  answers:            { q: string; a: string }[]; // all signal answers, label + verbatim
  signalPromise:      string | null; // what the signal promises
  element:            string | null; // their talent/element
  people:             string | null; // their audience
  painSource:         string | null; // where they came from
}

// Signal question keys → short Hebrew labels (mirrors lib/signal/gap-detect).
const QUESTION_LABELS: Record<string, string> = {
  flow_zone:          "רגע שבו שכחת מהזמן",
  effortless_mastery: "מה קל לך עד שקשה להסביר איך",
  hard_period:        "תקופה קשה ומה היא לימדה",
  what_helped:        "מה עזר לך לצאת מזה / מה פיתחת",
};

// One synthesized read that collapses all the signals into a single decision:
// is this lead worth a personal message? Heuristic (no LLM) so it's instant + free.
export interface LeadDecision {
  tone:   "strong" | "medium" | "weak";
  label:  string;   // "שווה הודעה" / "כדאי לבדוק" / "שקלו לדלג"
  points: string[]; // the strongest supporting reasons, in plain Hebrew
}

export interface ImmediateLead {
  userId:     string;
  name:       string;
  occupation: string | null;
  source:     "signal" | "quiz";
  reason:     string;
  at:         string;
  stage:      HandoffStage;
  waPhone:    string | null;
  waText:     string;
  userHref:   string;
  context:    LeadContext;
  decision:   LeadDecision;
}

// Weigh the signals we already have into one verdict + the reasons behind it.
// Works for BOTH sources: signal leads lean on the LLM read (fit/confidence/
// founder/depth); quiz leads lean on the match % + CRM engagement — so a strong
// quiz lead (e.g. 93% strategy, engaged) is no longer scored as "skip".
function computeDecision(ctx: LeadContext): LeadDecision {
  let score = 0;
  const points: string[] = [];
  // CRM engagement — real interaction on the site (opened/clicked/checkout).
  if (ctx.status === "high_intent" || ctx.status === "premium_lead" || ctx.status === "partnership_lead" || ctx.status === "buyer" || ctx.status === "booked") {
    score += 2; points.push("כוונת-רכישה גבוהה");
  } else if (ctx.status === "engaged") {
    score += 1; points.push("מעורב/ת — קרא/ה ולחץ/ה");
  }
  // Quiz match — a direct recommendation strength signal.
  if (typeof ctx.quizMatch === "number" && ctx.quizMatch >= 85) { score += 2; points.push(`${ctx.quizMatch}% התאמה בקוויז`); }
  else if (typeof ctx.quizMatch === "number" && ctx.quizMatch >= 70) { score += 1; }
  if (ctx.commercialFit === "high")   { score += 2; points.push("התאמה מסחרית גבוהה"); }
  else if (ctx.commercialFit === "medium") { score += 1; }
  else if (ctx.commercialFit === "low")    { score -= 1; points.push("התאמה נמוכה"); }
  if (typeof ctx.routingConfidence === "number" && ctx.routingConfidence >= 0.7) { score += 1; points.push("ביטחון גבוה בקריאה"); }
  if (ctx.founderStage === "scaling" || ctx.founderStage === "established") { score += 1; points.push("עסק מבוסס"); }
  else if (ctx.founderStage === "exploring") { score -= 1; points.push("בתחילת הדרך"); }
  const depth = ctx.answers.reduce((n, a) => n + a.a.length, 0);
  if (depth >= 400) { score += 1; points.push("כתב/ה בעומק"); }
  else if (depth > 0 && depth < 130) { score -= 1; points.push("תשובות קצרות"); }
  if (ctx.purchaseCount > 0) { score += 1; points.push("לקוח/ה קיים/ת"); }
  if (ctx.lastActivityAt) {
    const days = (Date.now() - new Date(ctx.lastActivityAt).getTime()) / 86400000;
    if (days <= 3) { score += 1; points.push("פעיל/ה לאחרונה"); }
  }
  if (!ctx.marketingConsent) points.push("ללא הסכמה לדיוור");
  const tone: LeadDecision["tone"] = score >= 3 ? "strong" : score >= 1 ? "medium" : "weak";
  const label = tone === "strong" ? "שווה הודעה" : tone === "medium" ? "כדאי לבדוק" : "שקלו לדלג";
  return { tone, label, points: points.slice(0, 4) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// Expanded user-join columns — includes everything the context strip needs
// AND the fields the WhatsApp opener personalizes on (gender for pronoun
// selection, answers via the extraction row for the Q4 verbatim quote).
type UserJoin = {
  id:                 string;
  name:               string | null;
  email:              string | null;
  phone:              string | null;
  occupation:         string | null;
  status:             string | null;
  gender:             "m" | "f" | null;
  utm_source:         string | null;
  utm_campaign:       string | null;
  marketing_consent:  boolean | null;
  last_activity_at:   string | null;
  created_at:         string | null;
  handoff_stage:      string | null;
} | null;

const USER_COLS =
  "id, name, email, phone, occupation, status, gender, utm_source, utm_campaign, " +
  "marketing_consent, last_activity_at, created_at, handoff_stage";

function stageOf(u: UserJoin): HandoffStage | "dismissed" {
  if (u?.handoff_stage === "whatsapp_sent")  return "whatsapp_sent";
  if (u?.handoff_stage === "meeting_booked") return "meeting_booked";
  if (u?.handoff_stage === "dismissed")      return "dismissed";
  return "queue";
}

// Pick a short, meaningful verbatim from the answers. Priority:
//   what_helped (Q4) → effortless_mastery (Q2) → hard_period (Q3)
// Truncated to ~160 chars so it fits under the name row without dominating.
function pickAnswerSnippet(answers: Record<string, unknown> | null | undefined): string | null {
  if (!answers) return null;
  const order = ["what_helped", "effortless_mastery", "hard_period", "flow_zone"];
  for (const key of order) {
    const v = answers[key];
    if (typeof v === "string" && v.trim().length > 20) {
      const clean = v.trim().replace(/\s+/g, " ");
      return clean.length > 160 ? clean.slice(0, 157) + "…" : clean;
    }
  }
  return null;
}

export async function getImmediateLeads(
  supabase: ReturnType<typeof createServerClient>,
): Promise<ImmediateLead[]> {
  try {
    const [sigRes, paidRes, purchasesRes] = await Promise.all([
      safeFrom(supabase, "signal_extractions")
        .select(`id, user_id, signal, answers, bucket, generated_at, users(${USER_COLS})`)
        .neq("is_test", true)   // v2 isolation: test runs never reach Hadar's queue
        // Meeting-worthy = v2 concierge only (established business + phone).
        // Legacy bucket=strategy and the retired quiz feeder dropped 2026-07-14.
        .eq("routed_ending", "concierge")
        .order("generated_at", { ascending: false })
        .limit(300),
      safeFrom(supabase, "purchases")
        .select("user_id, product")
        .neq("is_test", true)
        .eq("status", "completed"),
      safeFrom(supabase, "purchases")
        .select("user_id, amount, amount_paid, status")
        .neq("is_test", true)
        .eq("status", "completed"),
    ]);

    const paidUsers = new Set<string>(
      ((paidRes.data ?? []) as { user_id: string | null }[])
        .map((p) => p.user_id)
        .filter((v): v is string => !!v),
    );

    // Existing high-ticket customers — already closed the top tier, so they are
    // NOT "book a meeting" leads. Drop them from Hadar's WhatsApp list.
    // (Only catches RECORDED purchases; offline/premium sales that were never
    // entered still leak through — see the CRM data-integrity note.)
    const highTicketCustomers = new Set<string>(
      ((paidRes.data ?? []) as { user_id: string | null; product: string | null }[])
        .filter((p) => p.product === "strategy_4000" || p.product === "premium_14000")
        .map((p) => p.user_id)
        .filter((v): v is string => !!v),
    );

    // Roll up purchase totals per user so each card can show
    // "3 רכישות · ₪1,477" without an extra fetch.
    const purchaseTotals = new Map<string, { count: number; total: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of ((purchasesRes.data ?? []) as any[])) {
      const uid = p.user_id as string | null;
      if (!uid) continue;
      const cur = purchaseTotals.get(uid) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(p.amount_paid ?? p.amount ?? 0);
      purchaseTotals.set(uid, cur);
    }

    const seen = new Set<string>();
    const leads: ImmediateLead[] = [];

    const push = (lead: ImmediateLead, rawStage: HandoffStage | "dismissed") => {
      // Dismissed leads are NOT dropped — they move to the "לא רלבנטי" folder in
      // the UI (stage carried through as 'dismissed'). Only booked+paid is dropped.
      if (rawStage === "meeting_booked" && paidUsers.has(lead.userId)) return; // done + paid → drop
      leads.push(lead);
    };

    const contextOf = (
      u: UserJoin,
      opts: {
        routingSignal?: Record<string, unknown> | null;
        answers?:       Record<string, unknown> | null;
        signal?:        Record<string, unknown> | null;
        quizMatch?:     number | null;
      } = {},
    ): LeadContext => {
      const totals = u?.id ? purchaseTotals.get(u.id) : undefined;
      const rs = opts.routingSignal ?? null;
      const sig = opts.signal ?? null;
      const str = (v: unknown): string | null =>
        typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
      // All non-empty answers, in question order, mapped to their Hebrew label.
      const answers: { q: string; a: string }[] = [];
      if (opts.answers) {
        for (const key of ["flow_zone", "effortless_mastery", "hard_period", "what_helped"]) {
          const v = opts.answers[key];
          if (typeof v === "string" && v.trim().length > 0) {
            answers.push({ q: QUESTION_LABELS[key] ?? key, a: v.trim() });
          }
        }
      }
      return {
        email:            u?.email?.trim() || null,
        phone:            u?.phone?.trim() || null,
        utmSource:        u?.utm_source?.trim() || null,
        utmCampaign:      u?.utm_campaign?.trim() || null,
        marketingConsent: u?.marketing_consent === true,
        status:           u?.status ?? null,
        lastActivityAt:   u?.last_activity_at ?? null,
        signupAt:         u?.created_at ?? null,
        purchaseCount:    totals?.count ?? 0,
        totalSpent:       totals?.total ?? 0,
        routingConfidence: typeof rs?.confidence === "number" ? (rs.confidence as number) : null,
        commercialFit:    typeof rs?.commercial_fit === "string" ? (rs.commercial_fit as string) : null,
        founderStage:     typeof rs?.founder_stage === "string" ? (rs.founder_stage as string) : null,
        quizMatch:        typeof opts.quizMatch === "number" ? opts.quizMatch : null,
        answerSnippet:    pickAnswerSnippet(opts.answers),
        answers,
        signalPromise:    str(sig?.signal_promise),
        element:          str(sig?.element),
        people:           str(sig?.people),
        painSource:       str(sig?.pain_source),
      };
    };

    // Signal strategy leads first (richest reason + full routing signal).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (sigRes.data ?? []) as any[]) {
      const u = row.users as UserJoin;
      const uid = (u?.id ?? row.user_id) as string | null;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      // Existing high-ticket customer (booked a meeting, or bought strategy/
      // premium) → not a lead to close. Skip.
      if (u?.status === "booked" || highTicketCustomers.has(uid)) continue;
      const name = u?.name?.trim() || "—";
      const rawStage = stageOf(u);
      const ctx = contextOf(u, {
        routingSignal: (row.signal?.routing_signal as Record<string, unknown> | null) ?? null,
        answers:       (row.answers as Record<string, unknown> | null) ?? null,
        signal:        (row.signal as Record<string, unknown> | null) ?? null,
      });
      push(
        {
          userId:     uid,
          name,
          occupation: u?.occupation?.trim()
            || (typeof (row.signal as Record<string, unknown> | null)?.occupation === "string"
                ? String((row.signal as Record<string, unknown>).occupation).trim() || null
                : null),
          source:     "signal",
          reason:     (row.signal?.signal as string) ?? "",
          at:         row.generated_at as string,
          stage:      rawStage,
          waPhone:    waPhoneOf(u?.phone),
          waText:     buildHandoffMessage({
            name,
            gender:  u?.gender ?? null,
            signal:  row.signal,
            answers: (row.answers as Record<string, unknown> | null) ?? null,
          }),
          userHref:   `/admin/users/${uid}`,
          context:    ctx,
          decision:   computeDecision(ctx),
        },
        rawStage,
      );
    }

    // Newest first.
    leads.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return leads;
  } catch {
    return [];
  }
}
