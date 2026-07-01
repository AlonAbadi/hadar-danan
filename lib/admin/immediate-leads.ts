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
 * Read-time filtering removes leads who booked a meeting AND paid (a completed
 * purchase), so the list only ever shows people who still need a touch.
 *
 * Fully non-fatal: any query error (e.g. migration 057 not yet applied) returns
 * an empty list so the admin home banner never breaks.
 */
import type { createServerClient } from "@/lib/supabase/server";
import {
  buildHandoffMessage,
  buildQuizHandoffMessage,
  waPhoneOf,
} from "@/lib/signal/handoff-message";

export type HandoffStage = "queue" | "whatsapp_sent" | "meeting_booked";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserJoin = {
  id:            string;
  name:          string | null;
  phone:         string | null;
  occupation:    string | null;
  handoff_stage: string | null;
} | null;

function stageOf(u: UserJoin): HandoffStage {
  if (u?.handoff_stage === "whatsapp_sent")  return "whatsapp_sent";
  if (u?.handoff_stage === "meeting_booked") return "meeting_booked";
  return "queue";
}

export async function getImmediateLeads(
  supabase: ReturnType<typeof createServerClient>,
): Promise<ImmediateLead[]> {
  try {
    const userCols = "id, name, phone, occupation, handoff_stage";

    const [sigRes, quizRes, paidRes] = await Promise.all([
      safeFrom(supabase, "signal_extractions")
        .select(`id, user_id, signal, bucket, generated_at, users(${userCols})`)
        .eq("bucket", "strategy")
        .order("generated_at", { ascending: false })
        .limit(300),
      safeFrom(supabase, "quiz_results")
        .select(`user_id, recommended_product, match_percent, created_at, users(${userCols})`)
        .in("recommended_product", HIGH_VALUE_QUIZ)
        .order("created_at", { ascending: false })
        .limit(300),
      safeFrom(supabase, "purchases")
        .select("user_id")
        .eq("status", "completed"),
    ]);

    const paidUsers = new Set<string>(
      ((paidRes.data ?? []) as { user_id: string | null }[])
        .map((p) => p.user_id)
        .filter((v): v is string => !!v),
    );

    const seen = new Set<string>();
    const leads: ImmediateLead[] = [];

    const push = (lead: ImmediateLead) => {
      // Booked + paid → done, drop from the worklist.
      if (lead.stage === "meeting_booked" && paidUsers.has(lead.userId)) return;
      leads.push(lead);
    };

    // Signal strategy leads first (richest reason).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (sigRes.data ?? []) as any[]) {
      const u = row.users as UserJoin;
      const uid = (u?.id ?? row.user_id) as string | null;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      const name = u?.name?.trim() || "—";
      push({
        userId:     uid,
        name,
        occupation: u?.occupation?.trim() || null,
        source:     "signal",
        reason:     (row.signal?.signal as string) ?? "",
        at:         row.generated_at as string,
        stage:      stageOf(u),
        waPhone:    waPhoneOf(u?.phone),
        waText:     buildHandoffMessage({ name, signal: row.signal }),
        userHref:   `/admin/users/${uid}`,
      });
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
      push({
        userId:     uid,
        name,
        occupation: u?.occupation?.trim() || null,
        source:     "quiz",
        reason:     (QUIZ_REASON[product] ?? "הקוויז המליץ על מוצר פרימיום") + pct,
        at:         row.created_at as string,
        stage:      stageOf(u),
        waPhone:    waPhoneOf(u?.phone),
        waText:     buildQuizHandoffMessage({ name, recommendedProduct: product }),
        userHref:   `/admin/users/${uid}`,
      });
    }

    // Newest first across both sources.
    leads.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return leads;
  } catch {
    return [];
  }
}
