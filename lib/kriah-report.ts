/**
 * kriah daily morning report — metrics snapshot + written conclusions.
 *
 * Generated lazily: the first /admin/kriah load after 06:00 Israel time
 * creates the row for today (analyzing YESTERDAY's full day against the
 * trailing week). Idempotent via the report_date unique constraint.
 */
import Anthropic from "@anthropic-ai/sdk";

// Must match app/admin/kriah — counting starts at the reset moment.
const REPORT_EPOCH = "2026-07-05T21:45:00Z";
import type { createServerClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export interface DailyReport {
  report_date: string;
  conclusions: string;
  metrics:     Record<string, unknown>;
  created_at:  string;
}

/** Israel-local date string (YYYY-MM-DD) for a given instant. */
export function ilDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d);
}

function ilHour(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", hour12: false }).format(d));
}

const STEP_KEYS: { label: string; keys: string[] }[] = [
  { label: "כניסה",       keys: ["s1"] },
  { label: "מצב עסק",     keys: ["s2_state"] },
  { label: "חסם",         keys: ["s3_blocker"] },
  { label: "מה ישתנה",    keys: ["s4_change"] },
  { label: "התמונה",      keys: ["s6_reading"] },
  { label: "המזלג",       keys: ["s7_fork"] },
  { label: "גשר",         keys: ["s8_bridge"] },
  { label: "שאלה 1",      keys: ["q1_flow_zone"] },
  { label: "שאלה 6",      keys: ["q6_message_to_past"] },
  { label: "שער טלפון",   keys: ["s15_phone_gate"] },
  { label: "מסך המשלוח",  keys: ["sendgate"] },
  { label: "האות",        keys: ["s16_full_reading"] },
];

async function computeMetrics(supabase: ReturnType<typeof createServerClient>) {
  const now = new Date();
  const raw8d = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const since8d = raw8d > REPORT_EPOCH ? raw8d : REPORT_EPOCH;

  const [extRes, stepRes] = await Promise.all([
    safeFrom(supabase, "signal_extractions")
      .select("routed_ending, phone_given, source_utm, generated_at")
      .eq("instrument_version", "v2_funnel")
      .neq("is_test", true)
      .gte("generated_at", since8d)
      .limit(2000),
    safeFrom(supabase, "events")
      .select("metadata, created_at")
      .eq("type", "FUNNEL_STEP")
      .neq("is_test", true)
      .gte("created_at", since8d)
      .limit(20000),
  ]);

  type Ext = { routed_ending: string | null; phone_given: boolean | null; source_utm: Record<string, string> | null; generated_at: string };
  type Ev  = { metadata: { step?: string; is_test?: boolean } | null; created_at: string };
  const exts  = (extRes.data ?? []) as Ext[];
  const steps = ((stepRes.data ?? []) as Ev[]).filter((e) => e.metadata?.is_test !== true);

  const yesterday = ilDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  // per-day trend (last 7 full days, newest first)
  const days: { date: string; entries: number; completions: number; hot: number }[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = ilDate(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    days.push({
      date: d,
      entries:     steps.filter((e) => e.metadata?.step === "s1" && ilDate(new Date(e.created_at)) === d).length,
      completions: exts.filter((e) => ilDate(new Date(e.generated_at)) === d).length,
      hot:         exts.filter((e) => e.routed_ending === "concierge" && ilDate(new Date(e.generated_at)) === d).length,
    });
  }

  // yesterday's funnel by step
  const funnelYesterday = STEP_KEYS.map((s) => ({
    label: s.label,
    n: steps.filter((e) => s.keys.includes(e.metadata?.step ?? "") && ilDate(new Date(e.created_at)) === yesterday).length,
  }));

  const extsYesterday = exts.filter((e) => ilDate(new Date(e.generated_at)) === yesterday);
  const endings: Record<string, number> = {};
  for (const e of extsYesterday) endings[e.routed_ending ?? "unknown"] = (endings[e.routed_ending ?? "unknown"] ?? 0) + 1;

  const sources: Record<string, number> = {};
  for (const e of extsYesterday) {
    const src = e.source_utm?.utm_source ?? "direct";
    sources[src] = (sources[src] ?? 0) + 1;
  }

  return {
    report_for: yesterday,
    yesterday: {
      funnel:   funnelYesterday,
      readings: extsYesterday.length,
      endings,
      phone_given: extsYesterday.filter((e) => e.phone_given).length,
      sources,
    },
    week_trend: days,
  };
}

const REPORT_SYSTEM = `אתה האנליסט של משפך "קריאת האות" (beegood.online/kriah): שאלון אבחון עברי שמוביל בעלי עסקים דרך 3 בחירות, תמונה ראשונית, 6 שאלות עומק, ומסתיים באות אישי. הסופים: קונסיירז' (ליד רותח, הדר מתקשרת, צפי 4-5 בשבוע), כוורת (הצעת ₪590 במייל יום-2), טרום-הכנסה, סוף רך (משבר).

כתוב "מסקנות בוקר" קצרות בעברית על נתוני אתמול מול מגמת השבוע. כללים:
- 4-6 נקודות ממוספרות, כל אחת שורה-שתיים, עם המספרים עצמם.
- קודם מה קרה (תנועה, השלמות, רותחים), אחר כך איפה הנקודה החלשה ביותר במשפך (הצעד עם הנשירה הגדולה), ואז מסקנה אחת אופרטיבית להיום.
- אם התנועה דלה (פחות מ-20 כניסות) אמור זאת בכנות ואל תסיק מסקנות סטטיסטיות מרעש.
- בלי מקפים ארוכים, בלי קלישאות, בלי המלצות גנריות ("להמשיך לעקוב").
- אם יש אנומליה (יום חריג, מקור תנועה חדש, אפס רותחים למרות תנועה) ציין אותה במפורש.`;

async function writeConclusions(metrics: Record<string, unknown>): Promise<string> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 700,
    system: REPORT_SYSTEM,
    messages: [{ role: "user", content: `נתוני המשפך:\n${JSON.stringify(metrics, null, 1)}\n\nכתוב את מסקנות הבוקר.` }],
  });
  return res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();
}

/**
 * Returns today's report, generating it if missing (only after 06:00 IL so
 * yesterday is a complete day). Always returns the recent history.
 */
export async function getOrCreateDailyReport(
  supabase: ReturnType<typeof createServerClient>,
): Promise<{ today: DailyReport | null; history: DailyReport[] }> {
  const now = new Date();
  const today = ilDate(now);

  const { data: existing } = await safeFrom(supabase, "kriah_daily_reports")
    .select("report_date, conclusions, metrics, created_at")
    .order("report_date", { ascending: false })
    .limit(8);

  const history = (existing ?? []) as DailyReport[];
  const todays = history.find((r) => String(r.report_date) === today) ?? null;
  if (todays) return { today: todays, history: history.filter((r) => r !== todays) };
  if (ilHour(now) < 6) return { today: null, history };

  try {
    const metrics = await computeMetrics(supabase);
    const conclusions = await writeConclusions(metrics as unknown as Record<string, unknown>);
    const { data: inserted } = await safeFrom(supabase, "kriah_daily_reports")
      .insert({ report_date: today, metrics, conclusions })
      .select("report_date, conclusions, metrics, created_at")
      .single();
    return { today: (inserted as DailyReport) ?? null, history };
  } catch (e) {
    // Unique-violation race (two admins at 06:01) or LLM failure — fall back
    // to whatever exists; the next load retries.
    try {
      await supabase.from("error_logs").insert({
        context: "kriah daily report generation",
        error:   String(e),
        payload: {},
      });
    } catch { /* ignore */ }
    return { today: null, history };
  }
}
