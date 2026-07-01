/**
 * לידים לטיפול מיידי — Hadar's daily worklist.
 *
 * Merges the two sources of "worth a personal WhatsApp from Hadar" leads into a
 * single, per-person, deduped list with one shared handoff state machine
 * (stored on users, migration 057):
 *
 *   1. Signal engine — latest extraction with bucket = 'strategy'.
 *   2. Quiz — latest result recommending a high-value product
 *      (strategy / premium / partnership).
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
  buildQuizHandoffMessage,
  waPhoneOf,
} from "@/lib/signal/handoff-message";

export type HandoffStage = "queue" | "whatsapp_sent" | "meeting_booked";

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
  answerSnippet:      string | null; // short verbatim from the strongest answer, so we hear their voice
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
}

const HIGH_VALUE_QUIZ = ["strategy", "premium", "partnership"];

const QUIZ_REASON: Record<string, string> = {
  strategy:    "הקוויז המליץ: פגישת אסטרטגיה",
  premium:     "הקוויז המליץ: יום צילום פרמיום",
  partnership: "הקוויז המליץ: שותפות אסטרטגית",
};

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
    const [sigRes, quizRes, paidRes, purchasesRes] = await Promise.all([
      safeFrom(supabase, "signal_extractions")
        .select(`id, user_id, signal, answers, bucket, generated_at, users(${USER_COLS})`)
        .eq("bucket", "strategy")
        .order("generated_at", { ascending: false })
        .limit(300),
      safeFrom(supabase, "quiz_results")
        .select(`user_id, recommended_product, match_percent, created_at, users(${USER_COLS})`)
        .in("recommended_product", HIGH_VALUE_QUIZ)
        .order("created_at", { ascending: false })
        .limit(300),
      safeFrom(supabase, "purchases")
        .select("user_id")
        .eq("status", "completed"),
      safeFrom(supabase, "purchases")
        .select("user_id, amount, amount_paid, status")
        .eq("status", "completed"),
    ]);

    const paidUsers = new Set<string>(
      ((paidRes.data ?? []) as { user_id: string | null }[])
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
      if (rawStage === "dismissed") return; // hidden — Hadar said no
      if (rawStage === "meeting_booked" && paidUsers.has(lead.userId)) return; // done + paid → drop
      leads.push(lead);
    };

    const contextOf = (
      u: UserJoin,
      opts: {
        routingSignal?: Record<string, unknown> | null;
        answers?:       Record<string, unknown> | null;
      } = {},
    ): LeadContext => {
      const totals = u?.id ? purchaseTotals.get(u.id) : undefined;
      const rs = opts.routingSignal ?? null;
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
        answerSnippet:    pickAnswerSnippet(opts.answers),
      };
    };

    // Signal strategy leads first (richest reason + full routing signal).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (sigRes.data ?? []) as any[]) {
      const u = row.users as UserJoin;
      const uid = (u?.id ?? row.user_id) as string | null;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      const name = u?.name?.trim() || "—";
      const rawStage = stageOf(u);
      const ctx = contextOf(u, {
        routingSignal: (row.signal?.routing_signal as Record<string, unknown> | null) ?? null,
        answers:       (row.answers as Record<string, unknown> | null) ?? null,
      });
      push(
        {
          userId:     uid,
          name,
          occupation: u?.occupation?.trim() || null,
          source:     "signal",
          reason:     (row.signal?.signal as string) ?? "",
          at:         row.generated_at as string,
          stage:      rawStage === "dismissed" ? "queue" : rawStage,
          waPhone:    waPhoneOf(u?.phone),
          waText:     buildHandoffMessage({
            name,
            gender:  u?.gender ?? null,
            signal:  row.signal,
            answers: (row.answers as Record<string, unknown> | null) ?? null,
          }),
          userHref:   `/admin/users/${uid}`,
          context:    ctx,
        },
        rawStage,
      );
    }

    // Then quiz high-value leads (only if not already surfaced via signal).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (quizRes.data ?? []) as any[]) {
      const u = row.users as UserJoin;
      const uid = (u?.id ?? row.user_id) as string | null;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      const name = u?.name?.trim() || "—";
      const product = row.recommended_product as string;
      const pct = typeof row.match_percent === "number" ? ` · ${row.match_percent}% התאמה` : "";
      const rawStage = stageOf(u);
      const ctx = contextOf(u); // quiz path has no routing_signal/answers
      push(
        {
          userId:     uid,
          name,
          occupation: u?.occupation?.trim() || null,
          source:     "quiz",
          reason:     (QUIZ_REASON[product] ?? "הקוויז המליץ על מוצר פרימיום") + pct,
          at:         row.created_at as string,
          stage:      rawStage === "dismissed" ? "queue" : rawStage,
          waPhone:    waPhoneOf(u?.phone),
          waText:     buildQuizHandoffMessage({
            name,
            gender:             u?.gender ?? null,
            recommendedProduct: product,
          }),
          userHref:   `/admin/users/${uid}`,
          context:    ctx,
        },
        rawStage,
      );
    }

    // Newest first across both sources.
    leads.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return leads;
  } catch {
    return [];
  }
}
