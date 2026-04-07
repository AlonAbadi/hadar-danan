import { createServerClient } from "@/lib/supabase/server";
import { RoasWidget } from "./RoasWidget";
import { CronButton } from "./CronButton";
import { ClearErrorsButton } from "./ClearErrorsButton";

export const dynamic = "force-dynamic";

// ── Data fetchers ─────────────────────────────────────────────

async function getFunnelStats() {
  const supabase = createServerClient();
  const { data } = await supabase.from("v_funnel_stats").select("*").single();
  return data;
}

async function getAbResults() {
  const supabase = createServerClient();
  const { data } = await supabase.from("v_ab_results").select("*");
  return data ?? [];
}

async function getRecentEvents() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("events")
    .select("id, type, user_id, anonymous_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function getRecentErrors() {
  const supabase = createServerClient();
  const { data } = await supabase.from("v_recent_errors").select("*").limit(20);
  return data ?? [];
}

async function getRecentSignups() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, email, phone, status, ab_variant, utm_source, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

async function getPendingJobs() {
  const supabase = createServerClient();
  const { count } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("failed_permanently", false);
  return count ?? 0;
}

async function getRevenueData() {
  const supabase = createServerClient();

  const { data: purchases } = await supabase
    .from("purchases")
    .select("product, amount, created_at")
    .eq("status", "completed");

  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  const now       = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
  const all        = purchases ?? [];

  const totalRevenue  = all.reduce((s, p) => s + (p.amount ?? 0), 0);
  const monthRevenue  = all.filter((p) => p.created_at >= monthStart).reduce((s, p) => s + (p.amount ?? 0), 0);
  const buyerCount    = all.length;           // each row = one purchase
  const ltv           = buyerCount > 0 ? totalRevenue / buyerCount : 0;
  const rpu           = (totalUsers ?? 0) > 0 ? totalRevenue / (totalUsers ?? 1) : 0;

  // Product breakdown
  const byProduct: Record<string, { count: number; revenue: number }> = {};
  for (const p of all) {
    const key = p.product as string;
    if (!byProduct[key]) byProduct[key] = { count: 0, revenue: 0 };
    byProduct[key].count++;
    byProduct[key].revenue += p.amount ?? 0;
  }

  return { totalRevenue, monthRevenue, buyerCount, ltv, rpu, byProduct, totalUsers: totalUsers ?? 0 };
}

async function getEmailPerformance() {
  const supabase = createServerClient();

  const { data: seqs } = await supabase
    .from("email_sequences")
    .select("id, template_key, trigger_event, subject")
    .eq("active", true);

  const { data: logs } = await supabase
    .from("email_logs")
    .select("sequence_id, status");

  const allLogs = logs ?? [];
  return (seqs ?? []).map((seq) => {
    const sl      = allLogs.filter((l) => l.sequence_id === seq.id);
    const sent    = sl.length;
    const opened  = sl.filter((l) => l.status === "opened" || l.status === "clicked").length;
    const clicked = sl.filter((l) => l.status === "clicked").length;
    return { ...seq, sent, opened, clicked };
  }).sort((a, b) => b.sent - a.sent);
}

async function getPremiumLeads() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, email, phone, utm_source, created_at")
    .eq("status", "premium_lead")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

async function getQuizResults() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("events")
    .select("id, metadata, anonymous_id, created_at")
    .eq("type", "QUIZ_COMPLETED")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

async function getPartnershipLeads() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, email, phone, utm_source, created_at")
    .eq("status", "partnership_lead")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

async function getVideoStats() {
  const supabase = createServerClient();

  const { data: videoRows } = await supabase
    .from("video_events")
    .select("event_type, percent_watched, drop_off_second")
    .eq("video_id", "1178865564");

  const { count: checkoutStarts } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("type", "CHECKOUT_STARTED")
    .contains("metadata", { product: "challenge_197" });

  const { count: challengeBuyers } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("product", "challenge_197")
    .eq("status", "completed");

  const rows = videoRows ?? [];

  const progressRows = rows.filter((r) => r.event_type === "watch_progress" && r.percent_watched != null);
  const avgPercent = progressRows.length > 0
    ? Math.round(progressRows.reduce((s, r) => s + (r.percent_watched ?? 0), 0) / progressRows.length)
    : 0;

  const completedCount = rows.filter((r) => r.event_type === "completed").length;

  // Mode of drop_off_second - group into 30-second buckets
  const dropOffRows = rows.filter((r) => r.event_type === "drop_off" && r.drop_off_second != null);
  let commonDropOff: number | null = null;
  if (dropOffRows.length > 0) {
    const freq: Record<number, number> = {};
    for (const r of dropOffRows) {
      const bucket = Math.floor((r.drop_off_second ?? 0) / 30) * 30;
      freq[bucket] = (freq[bucket] ?? 0) + 1;
    }
    commonDropOff = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
  }

  function toMMSS(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  return {
    avgPercent,
    completedCount,
    commonDropOff: commonDropOff !== null ? toMMSS(commonDropOff) : null,
    checkoutStarts: checkoutStarts ?? 0,
    challengeBuyers: challengeBuyers ?? 0,
  };
}

async function getHiveStats() {
  const supabase = createServerClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
  const next7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: members } = await supabase
    .from("users")
    .select("hive_tier, hive_status, hive_started_at, hive_cancelled_at, hive_next_billing_date, email, name")
    .eq("hive_status", "active");

  const { data: cancelled } = await supabase
    .from("users")
    .select("hive_tier, hive_status, hive_started_at, hive_cancelled_at, email, name")
    .eq("hive_status", "cancelled")
    .gte("hive_cancelled_at", monthStart);

  const all = members ?? [];
  const cancelledThisMonth = cancelled ?? [];

  const basic29Count = all.filter(m => m.hive_tier === "discounted_29").length;
  const premium97Count = all.filter(m => m.hive_tier === "basic_97").length;
  const mrr = (basic29Count * 29) + (premium97Count * 97);

  const newThisMonth = all.filter(m => m.hive_started_at && m.hive_started_at >= monthStart).length;

  // Early cancellations (within 14 days) - refund alerts
  const earlyCancel = cancelledThisMonth.filter(m =>
    m.hive_started_at && m.hive_cancelled_at &&
    new Date(m.hive_cancelled_at).getTime() - new Date(m.hive_started_at).getTime() < 14 * 24 * 60 * 60 * 1000
  );

  // Upcoming billing dates in next 7 days
  const upcomingBilling = all.filter(m =>
    m.hive_next_billing_date &&
    m.hive_next_billing_date >= now.toISOString() &&
    m.hive_next_billing_date <= next7days
  );

  return {
    totalActive: all.length,
    basic29Count,
    premium97Count,
    mrr,
    newThisMonth,
    cancelledThisMonth: cancelledThisMonth.length,
    earlyCancel: earlyCancel.length,
    earlyCancelDetails: earlyCancel,
    upcomingBilling: upcomingBilling.length,
    upcomingBillingDetails: upcomingBilling,
  };
}

async function getAllBookings() {
  const supabase = createServerClient();
  const today      = new Date().toISOString().split("T")[0];
  const monthStart = new Date(
    Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)
  ).toISOString().split("T")[0];

  const { data } = await supabase
    .from("bookings")
    .select("id, name, email, phone, slot_date, slot_time, status, created_at")
    .order("slot_date", { ascending: false })
    .order("slot_time", { ascending: false })
    .limit(50);

  const all = data ?? [];

  const upcomingCount = all.filter(
    (b) => b.status === "confirmed" && b.slot_date >= today
  ).length;

  const { count: monthCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed")
    .gte("slot_date", monthStart);

  return { bookings: all, upcomingCount, monthCount: monthCount ?? 0, today };
}

// ── Statistical significance (two-proportion z-test) ─────────

function erf(x: number): number {
  const t   = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const r   = 1 - poly * Math.exp(-x * x);
  return x >= 0 ? r : -r;
}

function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function abConfidence(vA: number, cA: number, vB: number, cB: number): number {
  if (vA < 5 || vB < 5) return 0;
  const pA    = cA / vA;
  const pB    = cB / vB;
  const pPool = (cA + cB) / (vA + vB);
  if (!pPool || pPool === 1) return 0;
  const se    = Math.sqrt(pPool * (1 - pPool) * (1 / vA + 1 / vB));
  if (!se) return 0;
  const z     = Math.abs(pA - pB) / se;
  return (2 * normalCDF(z) - 1) * 100;
}

// ── Helpers ───────────────────────────────────────────────────

function pct(num: number, den: number): string {
  if (!den) return "-";
  return ((num / den) * 100).toFixed(1) + "%";
}

function cvr(c: number | null, v: number | null): string {
  if (!v) return "-";
  return (((c ?? 0) / v) * 100).toFixed(2) + "%";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שע׳`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

function shekel(n: number): string {
  return "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("he-IL", {
    weekday: "short", month: "short", day: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  lead: "ליד", engaged: "מעורב", high_intent: "כוונה גבוהה", buyer: "קנה",
  booked: "הזמין שיחה", premium_lead: "ליד פרמיום", partnership_lead: "ליד שותפות",
};

const STATUS_COLORS: Record<string, string> = {
  lead: "bg-gray-700 text-gray-200", engaged: "bg-blue-900 text-blue-200",
  high_intent: "bg-yellow-900 text-yellow-200", buyer: "bg-green-900 text-green-200",
  booked: "bg-purple-900 text-purple-200", premium_lead: "bg-yellow-800 text-yellow-100",
  partnership_lead: "bg-amber-900 text-amber-200",
};

const LEAD_SCORE: Record<string, number> = {
  lead: 10, engaged: 30, high_intent: 55, buyer: 80, booked: 100, premium_lead: 90, partnership_lead: 95,
};

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197: "צ׳אלנג׳ 7 הימים", workshop_1080: "סדנה יום אחד",
  course_1800: "קורס דיגיטלי", strategy_4000: "פגישת אסטרטגיה",
  premium_14000: "יום צילום פרמיום",
};

const TEMPLATE_LABELS: Record<string, string> = {
  welcome: "ברוך הבא",
  followup_24h: "פולואפ 24 שעות",
  followup_72h: "פולואפ 72 שעות",
  challenge_access: "גישה לצ׳אלנג׳",
  challenge_upsell_workshop: "אפסל סדנה (יום 7)",
  workshop_confirmation: "אישור סדנה",
  workshop_upsell_course: "אפסל קורס (שבוע 1)",
  course_access: "גישה לקורס",
  course_upsell_strategy: "אפסל אסטרטגיה (שבוע 1)",
  cart_abandon_1h: "עגלה נטושה (1h)",
  cart_abandon_24h: "עגלה נטושה + קופון (24h)",
  reengagement: "החזרת גולש לא פעיל",
  booking_confirmation:        "אישור פגישה",
  premium_lead_confirmation:   "אישור ליד פרמיום",
  partnership_confirmation:    "אישור ליד שותפות",
};

function confidenceBadge(conf: number) {
  if (conf < 70)  return { label: "נתונים לא מספיקים", cls: "bg-gray-700 text-gray-300" };
  if (conf < 90)  return { label: `${conf.toFixed(0)}% מגמה`, cls: "bg-yellow-900 text-yellow-300" };
  if (conf < 95)  return { label: `${conf.toFixed(0)}% כמעט מובהק`, cls: "bg-orange-900 text-orange-300" };
  if (conf < 99)  return { label: `${conf.toFixed(0)}% מובהק ✓`, cls: "bg-green-900 text-green-300" };
  return { label: `${conf.toFixed(0)}% מובהק מאוד ✓✓`, cls: "bg-green-800 text-green-200" };
}

// ── Page ──────────────────────────────────────────────────────

export default async function AdminPage() {
  const [funnel, abResults, events, errors, signups, pendingJobs, revenue, emailPerf, bookingsData, premiumLeads, partnershipLeads, quizResults, hiveStats, videoStats] =
    await Promise.all([
      getFunnelStats(),
      getAbResults(),
      getRecentEvents(),
      getRecentErrors(),
      getRecentSignups(),
      getPendingJobs(),
      getRevenueData(),
      getEmailPerformance(),
      getAllBookings(),
      getPremiumLeads(),
      getPartnershipLeads(),
      getQuizResults(),
      getHiveStats(),
      getVideoStats(),
    ]);

  const ab = abResults[0];

  // ── Funnel steps + drop-off ───────────────────────────────
  const funnelSteps = [
    { key: "leads",       label: "נרשמו",         count: funnel?.leads       ?? 0, color: "bg-gray-500" },
    { key: "engaged",     label: "מעורבים",        count: funnel?.engaged     ?? 0, color: "bg-blue-600" },
    { key: "high_intent", label: "כוונה גבוהה",   count: funnel?.high_intent ?? 0, color: "bg-yellow-500" },
    { key: "buyers",      label: "קנו",            count: funnel?.buyers      ?? 0, color: "bg-green-600" },
    { key: "booked",      label: "הזמינו שיחה",   count: funnel?.booked      ?? 0, color: "bg-purple-600" },
  ];

  const topCount = funnelSteps[0].count || 1;

  // Find biggest drop-off (index 1-4)
  let biggestDropIdx = 1;
  let biggestDropRate = 0;
  for (let i = 1; i < funnelSteps.length; i++) {
    const prev = funnelSteps[i - 1].count || 0;
    const curr = funnelSteps[i].count || 0;
    const rate = prev > 0 ? (prev - curr) / prev : 0;
    if (rate > biggestDropRate) { biggestDropRate = rate; biggestDropIdx = i; }
  }

  // ── A/B confidence ────────────────────────────────────────
  const conf = ab
    ? abConfidence(
        ab.visitors_a ?? 0, ab.conversions_a ?? 0,
        ab.visitors_b ?? 0, ab.conversions_b ?? 0
      )
    : 0;
  const badge = confidenceBadge(conf);
  const leadingVariant = ab
    ? ((ab.cvr_a ?? 0) >= (ab.cvr_b ?? 0) ? "A" : "B")
    : null;
  const autoWinner = conf >= 95 ? leadingVariant : null;

  // ── Product breakdown ────────────────────────────────────
  const PRODUCTS = ["challenge_197", "workshop_1080", "course_1800", "strategy_4000", "premium_14000"] as const;
  const PRODUCT_COLORS: Record<string, string> = {
    challenge_197:  "text-green-400 border-green-700",
    workshop_1080:  "text-purple-400 border-purple-700",
    course_1800:    "text-blue-400 border-blue-700",
    strategy_4000:  "text-amber-400 border-amber-700",
    premium_14000:  "text-yellow-400 border-yellow-700",
  };

  // ── Email best performer ─────────────────────────────────
  const bestEmail = emailPerf
    .filter((e) => e.sent > 0)
    .sort((a, b) => (b.opened / (b.sent || 1)) - (a.opened / (a.sent || 1)))[0];

  return (
    <div dir="rtl" className="min-h-screen font-assistant" style={{ background: "#101520", color: "#EDE9E1" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ background: "#191F2B", borderBottom: "1px solid #2C323E" }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#C9964A" }}>
            <svg className="w-4 h-4" fill="none" stroke="#101520" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-black text-lg" style={{ color: "#EDE9E1" }}>Marketing OS - Admin</h1>
            <p className="text-xs" style={{ color: "#9E9990" }}>הדר דנן בע״מ</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {pendingJobs > 0 && (
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 font-medium" style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: "#F0C564" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#C9964A" }} />
              {pendingJobs} jobs ממתינים
            </span>
          )}
          <CronButton />
          <span className="text-xs" style={{ color: "#9E9990" }}>
            {new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-10">

        {/* ══ 1. REVENUE ══════════════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>הכנסות</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "סה״כ הכנסות",  value: shekel(revenue.totalRevenue) },
              { label: "הכנסה החודש",   value: shekel(revenue.monthRevenue) },
              { label: "רכישות",        value: String(revenue.buyerCount) },
              { label: "LTV ממוצע",     value: shekel(revenue.ltv) },
              { label: "RPU",           value: shekel(revenue.rpu) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
                <span className="text-3xl font-black" style={{ color: "#EDE9E1" }}>{s.value}</span>
                <span className="text-sm" style={{ color: "#9E9990" }}>{s.label}</span>
              </div>
            ))}
            <RoasWidget revenueMonth={revenue.monthRevenue} />
          </div>
        </section>

        {/* ══ 2. PRODUCT BREAKDOWN ════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>פירוט לפי מוצר</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {PRODUCTS.map((prod) => {
              const d    = revenue.byProduct[prod] ?? { count: 0, revenue: 0 };
              const pctOfTotal = revenue.totalRevenue > 0
                ? ((d.revenue / revenue.totalRevenue) * 100).toFixed(0)
                : "0";
              return (
                <div key={prod} className={`rounded-2xl border p-6 flex flex-col gap-4 ${PRODUCT_COLORS[prod]}`} style={{ background: "#191F2B" }}>
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm">{PRODUCT_LABELS[prod]}</p>
                    <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ background: "rgba(255,255,255,0.08)", color: "#9E9990" }}>
                      {pctOfTotal}% מסה״כ
                    </span>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-black">{shekel(d.revenue)}</p>
                      <p className="text-xs opacity-70">הכנסה</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black">{d.count}</p>
                      <p className="text-xs opacity-70">רכישות</p>
                    </div>
                  </div>
                  {/* Revenue bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div
                      className="h-full bg-current rounded-full opacity-40"
                      style={{ width: `${pctOfTotal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══ 2b. VIDEO ANALYTICS ═════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>אנליטיקת סרטון - שיעור במתנה 🎬</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "צפייה ממוצעת", value: videoStats.avgPercent > 0 ? `${videoStats.avgPercent}%` : "-" },
              { label: "נשירה נפוצה",  value: videoStats.commonDropOff ?? "-" },
              { label: "סיימו לצפות", value: String(videoStats.completedCount) },
              { label: "התחילו checkout", value: String(videoStats.checkoutStarts) },
              { label: "קנו צ׳אלנג׳",  value: String(videoStats.challengeBuyers) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
                <span className="text-3xl font-black" style={{ color: "#EDE9E1" }}>{s.value}</span>
                <span className="text-sm" style={{ color: "#9E9990" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 3. FUNNEL + DROP-OFF ════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>פאנל מכירות - נשירה בין שלבים</h2>
          <div className="rounded-2xl p-6" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "היום",    value: funnel?.signups_today  ?? 0 },
                { label: "שבוע",    value: funnel?.signups_week   ?? 0 },
                { label: "חודש",    value: funnel?.signups_month  ?? 0 },
                {
                  label: "סה״כ משתמשים",
                  value: (funnel?.leads ?? 0) + (funnel?.engaged ?? 0) + (funnel?.high_intent ?? 0) + (funnel?.buyers ?? 0) + (funnel?.booked ?? 0),
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#101520" }}>
                  <p className="text-xl font-black" style={{ color: "#EDE9E1" }}>{s.value.toLocaleString("he-IL")}</p>
                  <p className="text-xs" style={{ color: "#9E9990" }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {funnelSteps.map((step, i) => {
                const prevCount  = i > 0 ? (funnelSteps[i - 1].count || 0) : null;
                const barWidth   = Math.max(3, (step.count / topCount) * 100);
                const dropRate   = prevCount != null && prevCount > 0
                  ? ((prevCount - step.count) / prevCount) * 100
                  : null;
                const isBigDrop  = i === biggestDropIdx && biggestDropRate > 0.05;

                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 transition`}
                    style={isBigDrop ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" } : {}}
                  >
                    <span className="text-sm font-medium w-28 text-right flex-shrink-0" style={{ color: "#9E9990" }}>
                      {step.label}
                      {isBigDrop && (
                        <span className="mr-1 text-xs text-red-400 font-bold">← נשירה גדולה</span>
                      )}
                    </span>
                    <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: "#2C323E" }}>
                      <div
                        className={`h-full ${step.color} rounded-lg flex items-center px-3 transition-all`}
                        style={{ width: `${barWidth}%` }}
                      >
                        <span className="text-white text-sm font-bold whitespace-nowrap">
                          {step.count.toLocaleString("he-IL")}
                        </span>
                      </div>
                    </div>
                    <div className="w-28 flex-shrink-0 text-left flex flex-col gap-0">
                      {dropRate !== null ? (
                        <>
                          <span className={`text-xs font-bold ${isBigDrop ? "text-red-400" : "text-[#9E9990]"}`}>
                            {pct(step.count, prevCount ?? 1)} המרה
                          </span>
                          <span className={`text-xs ${isBigDrop ? "text-red-500" : "text-[#9E9990]"}`}>
                            −{dropRate.toFixed(0)}% נשרו
                          </span>
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: "#9E9990" }}>כניסה</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ 4. A/B TEST ═════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#9E9990" }}>
              A/B בדיקת כותרת - {ab?.status === "running" ? "פעיל" : ab?.status ?? "-"}
            </h2>
            {ab && (
              <span className={`text-xs font-bold rounded-full px-3 py-1 ${badge.cls}`}>
                {badge.label}
              </span>
            )}
            {autoWinner && (
              <span className="text-xs font-bold rounded-full px-3 py-1 bg-green-800 text-green-200">
                🏆 גרסה {autoWinner} מנצחת (מובהק סטטיסטית)
              </span>
            )}
          </div>

          {ab ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["A", "B"] as const).map((v) => {
                const isWinner       = ab.winner === v || autoWinner === v;
                const isLeading      = leadingVariant === v && autoWinner !== (v === "A" ? "B" : "A");
                const visitors       = v === "A" ? ab.visitors_a    : ab.visitors_b;
                const conversions    = v === "A" ? ab.conversions_a : ab.conversions_b;
                const label          = v === "A" ? ab.variant_a_label : ab.variant_b_label;
                const cvrVal         = v === "A" ? ab.cvr_a         : ab.cvr_b;
                const otherCvr       = v === "A" ? ab.cvr_b         : ab.cvr_a;
                const uplift         = (cvrVal ?? 0) > 0 && (otherCvr ?? 0) > 0
                  ? (((cvrVal ?? 0) - (otherCvr ?? 0)) / (otherCvr ?? 1)) * 100
                  : 0;

                return (
                  <div
                    key={v}
                    className="rounded-2xl border-2 p-6 flex flex-col gap-4"
                    style={{
                      background: "#191F2B",
                      borderColor: isWinner ? "#22c55e" : isLeading ? "#C9964A" : "#2C323E",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase" style={{ color: "#9E9990" }}>גרסה {v}</span>
                        <p className="font-bold leading-snug" style={{ color: "#EDE9E1" }}>{label}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {isWinner && (
                          <span className="rounded-full bg-green-900 text-green-300 text-xs font-bold px-2.5 py-1">
                            🏆 מנצח
                          </span>
                        )}
                        {isLeading && !isWinner && (
                          <span className="rounded-full text-xs font-bold px-2.5 py-1" style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: "#F0C564" }}>
                            מוביל
                          </span>
                        )}
                        {Math.abs(uplift) > 0.1 && isLeading && (
                          <span className={`text-xs font-bold ${uplift > 0 ? "text-green-400" : "text-red-400"}`}>
                            {uplift > 0 ? "+" : ""}{uplift.toFixed(1)}% uplift
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "מבקרים",  value: (visitors    ?? 0).toLocaleString("he-IL") },
                        { label: "המרות",   value: (conversions ?? 0).toLocaleString("he-IL") },
                        { label: "CVR",      value: cvrVal != null ? `${cvrVal}%` : "-" },
                      ].map((m) => (
                        <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: "#101520" }}>
                          <p className="text-xl font-black" style={{ color: "#EDE9E1" }}>{m.value}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#9E9990" }}>{m.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2C323E" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (cvrVal ?? 0) * 10)}%`,
                          background: isWinner ? "#22c55e" : "#C9964A",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#9E9990" }}>אין נתוני A/B עדיין.</p>
          )}
        </section>

        {/* ══ 5. EMAIL PERFORMANCE ════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#9E9990" }}>ביצועי אימיילים</h2>
            {bestEmail && (
              <span className="text-xs" style={{ color: "#9E9990" }}>
                🏆 הכי פתוח: {TEMPLATE_LABELS[bestEmail.template_key] ?? bestEmail.template_key}
              </span>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right" style={{ borderBottom: "1px solid #2C323E", background: "#101520" }}>
                    {["אימייל", "נשלח", "נפתח", "קליק", "Open Rate", "CTR"].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "#9E9990" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emailPerf.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: "#9E9990" }}>אין נתוני אימייל עדיין</td></tr>
                  ) : (
                    emailPerf.map((e) => {
                      const openRate  = e.sent > 0 ? ((e.opened / e.sent) * 100).toFixed(1) : "-";
                      const ctrRate   = e.sent > 0 ? ((e.clicked / e.sent) * 100).toFixed(1) : "-";
                      const isTop     = bestEmail?.template_key === e.template_key;
                      return (
                        <tr key={e.id} className="transition" style={isTop ? { background: "rgba(201,150,74,0.07)", borderBottom: "1px solid #2C323E" } : { borderBottom: "1px solid #2C323E" }}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium" style={{ color: "#EDE9E1" }}>
                                {TEMPLATE_LABELS[e.template_key] ?? e.template_key}
                                {isTop && <span className="mr-1 text-xs" style={{ color: "#C9964A" }}>★</span>}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "#9E9990" }}>{e.trigger_event}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: "#EDE9E1" }}>{e.sent}</td>
                          <td className="px-4 py-3" style={{ color: "#9E9990" }}>{e.opened}</td>
                          <td className="px-4 py-3" style={{ color: "#9E9990" }}>{e.clicked}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${
                              typeof openRate === "string" && parseFloat(openRate) >= 30
                                ? "text-green-400"
                                : typeof openRate === "string" && parseFloat(openRate) >= 15
                                ? "text-yellow-400"
                                : "text-[#9E9990]"
                            }`}>
                              {openRate !== "-" ? `${openRate}%` : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${
                              typeof ctrRate === "string" && parseFloat(ctrRate) >= 5
                                ? "text-green-400" : "text-[#9E9990]"
                            }`}>
                              {ctrRate !== "-" ? `${ctrRate}%` : "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══ 6. SALES MEETINGS ═══════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#9E9990" }}>פגישות מכירה</h2>
            <span className="rounded-full bg-purple-900 text-purple-300 text-xs font-bold px-2.5 py-1">
              {bookingsData.upcomingCount} קרובות
            </span>
            <span className="rounded-full text-xs font-medium px-2.5 py-1" style={{ background: "#2C323E", color: "#9E9990" }}>
              {bookingsData.monthCount} החודש
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            {bookingsData.bookings.length === 0 ? (
              <div className="px-6 py-10 text-center" style={{ color: "#9E9990" }}>אין פגישות</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right" style={{ borderBottom: "1px solid #2C323E", background: "#101520" }}>
                      {["סטטוס", "תאריך", "שעה", "שם", "אימייל", "טלפון", "נקבע"].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "#9E9990" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsData.bookings.map((b) => {
                      const isPast      = b.slot_date < bookingsData.today;
                      const isCancelled = b.status === "cancelled";
                      return (
                        <tr key={b.id} className="transition" style={{ borderBottom: "1px solid #2C323E", opacity: isPast ? 0.5 : 1 }}>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              isCancelled ? "bg-red-900 text-red-300"
                              : isPast     ? "bg-gray-700 text-gray-400"
                              : "bg-purple-900 text-purple-300"
                            }`}>
                              {isCancelled ? "בוטל" : isPast ? "עבר" : "קבוע"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: "#EDE9E1" }}>
                            {formatDate(b.slot_date)}
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: "#EDE9E1" }}>{b.slot_time}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: "#EDE9E1" }}>{b.name}</td>
                          <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{b.email}</td>
                          <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{b.phone}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>
                            {relativeTime(b.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ══ 7. PREMIUM LEADS ════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#9E9990" }}>לידים פרמיום</h2>
            <span className="rounded-full text-xs font-bold px-2.5 py-1" style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: "#F0C564" }}>
              ₪14,000 + מע״מ
            </span>
            <span className="rounded-full text-xs font-medium px-2.5 py-1" style={{ background: "#2C323E", color: "#9E9990" }}>
              {premiumLeads.length} לידים
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            {premiumLeads.length === 0 ? (
              <div className="px-6 py-10 text-center" style={{ color: "#9E9990" }}>אין לידים פרמיום עדיין</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right" style={{ borderBottom: "1px solid #2C323E", background: "rgba(201,150,74,0.06)" }}>
                      {["שם", "אימייל", "טלפון", "מקור", "נרשם", ""].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "#9E9990" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {premiumLeads.map((u) => (
                      <tr key={u.id} className="transition" style={{ borderBottom: "1px solid #2C323E" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#EDE9E1" }}>{u.name ?? "-"}</td>
                        <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{u.email}</td>
                        <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{u.phone ?? "-"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#9E9990" }}>{u.utm_source ?? "direct"}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>{relativeTime(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <a href={`/admin/users/${u.id}`} className="text-xs hover:underline whitespace-nowrap" style={{ color: "#C9964A" }}>
                            פרופיל →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ══ 8. PARTNERSHIP LEADS ════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#9E9990" }}>לידים שותפות</h2>
            <span className="rounded-full text-xs font-bold px-2.5 py-1" style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: "#F0C564" }}>
              ₪10,000-30,000 / חודש
            </span>
            <span className="rounded-full text-xs font-medium px-2.5 py-1" style={{ background: "#2C323E", color: "#9E9990" }}>
              {partnershipLeads.length} לידים
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            {partnershipLeads.length === 0 ? (
              <div className="px-6 py-10 text-center" style={{ color: "#9E9990" }}>אין לידים שותפות עדיין</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right" style={{ borderBottom: "1px solid #2C323E", background: "rgba(201,150,74,0.06)" }}>
                      {["שם", "אימייל", "טלפון", "מקור", "נרשם", ""].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "#9E9990" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partnershipLeads.map((u) => (
                      <tr key={u.id} className="transition" style={{ borderBottom: "1px solid #2C323E" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#EDE9E1" }}>{u.name ?? "-"}</td>
                        <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{u.email}</td>
                        <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{u.phone ?? "-"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#9E9990" }}>{u.utm_source ?? "direct"}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>{relativeTime(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <a href={`/admin/users/${u.id}`} className="text-xs hover:underline whitespace-nowrap" style={{ color: "#C9964A" }}>
                            פרופיל →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ══ 9. QUIZ RESULTS ══════════════════════════════════ */}
        {(() => {
          const QUIZ_PRODUCT_LABELS: Record<string, string> = {
            challenge:   "אתגר 7 הימים · ₪197",
            workshop:    "סדנה יום אחד · ₪1,080",
            course:      "קורס דיגיטלי · ₪1,800",
            strategy:    "פגישת אסטרטגיה · ₪4,000",
            premium:     "יום צילום פרמיום · ₪14,000",
            partnership: "שותפות אסטרטגית",
          };
          const QUIZ_Q_LABELS: Record<string, string> = {
            A: "א", B: "ב", C: "ג", D: "ד",
          };
          const byProduct: Record<string, number> = {};
          for (const r of quizResults) {
            const p = String((r.metadata as Record<string, unknown>)?.result_product ?? "unknown");
            byProduct[p] = (byProduct[p] ?? 0) + 1;
          }
          const sortedProducts = Object.entries(byProduct).sort((a, b) => b[1] - a[1]);
          return (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#9E9990" }}>קוויז</h2>
                <span className="rounded-full text-xs font-bold px-2.5 py-1" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                  {quizResults.length} השלמות
                </span>
              </div>

              {quizResults.length === 0 ? (
                <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "#191F2B", border: "1px solid #2C323E", color: "#9E9990" }}>
                  אין נתוני קוויז עדיין
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Product distribution */}
                  {sortedProducts.length > 0 && (
                    <div className="rounded-2xl px-6 py-5" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>התפלגות לפי מוצר</p>
                      <div className="flex flex-col gap-2">
                        {sortedProducts.map(([prod, count]) => (
                          <div key={prod} className="flex items-center gap-3">
                            <span className="text-sm w-48 shrink-0" style={{ color: "#EDE9E1" }}>
                              {QUIZ_PRODUCT_LABELS[prod] ?? prod}
                            </span>
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#2C323E" }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(count / quizResults.length) * 100}%`,
                                  background: "#C9964A",
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold w-8 text-left" style={{ color: "#9E9990" }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent entries table */}
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-right" style={{ borderBottom: "1px solid #2C323E", background: "rgba(99,102,241,0.08)" }}>
                            {["ש1", "ש2", "ש3", "מוצר מומלץ", "anonymous_id", "זמן"].map((h) => (
                              <th key={h} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "#9E9990" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {quizResults.map((r) => {
                            const m = r.metadata as Record<string, string>;
                            return (
                              <tr key={r.id} className="transition" style={{ borderBottom: "1px solid #2C323E" }}>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                                    {QUIZ_Q_LABELS[m?.q1] ?? m?.q1 ?? "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                                    {QUIZ_Q_LABELS[m?.q2] ?? m?.q2 ?? "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                                    {QUIZ_Q_LABELS[m?.q3] ?? m?.q3 ?? "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-xs" style={{ color: "#EDE9E1" }}>
                                  {QUIZ_PRODUCT_LABELS[m?.result_product] ?? m?.result_product ?? "-"}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs dir-ltr text-left" style={{ color: "#9E9990" }}>
                                  {r.anonymous_id ? r.anonymous_id.slice(0, 8) + "…" : "-"}
                                </td>
                                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>
                                  {relativeTime(r.created_at)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {/* ══ 10. RECENT SIGNUPS (all statuses) ════════════════ */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>נרשמים אחרונים</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right" style={{ borderBottom: "1px solid #2C323E", background: "#101520" }}>
                    {["שם", "אימייל", "טלפון", "סטטוס", "ציון", "גרסה", "מקור", "הצטרף", ""].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "#9E9990" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signups.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: "#9E9990" }}>אין נרשמים עדיין</td></tr>
                  ) : (
                    signups.map((u) => {
                      const score = LEAD_SCORE[u.status] ?? 0;
                      return (
                        <tr key={u.id} className="transition" style={{ borderBottom: "1px solid #2C323E" }}>
                          <td className="px-4 py-3 font-medium" style={{ color: "#EDE9E1" }}>{u.name ?? "-"}</td>
                          <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{u.email}</td>
                          <td className="px-4 py-3 dir-ltr text-left" style={{ color: "#9E9990" }}>{u.phone ?? "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[u.status] ?? "bg-gray-700 text-gray-300"}`}>
                              {STATUS_LABELS[u.status] ?? u.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center rounded-full w-10 h-6 text-xs font-bold ${
                              score >= 80 ? "bg-green-900 text-green-300"
                              : score >= 50 ? "bg-yellow-900 text-yellow-300"
                              : score >= 25 ? "bg-blue-900 text-blue-300"
                              : "bg-gray-700 text-gray-400"
                            }`}>
                              {score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.ab_variant ? (
                              <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${u.ab_variant === "A" ? "bg-blue-900 text-blue-300" : "bg-orange-900 text-orange-300"}`}>
                                {u.ab_variant}
                              </span>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#9E9990" }}>{u.utm_source ?? "direct"}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>{relativeTime(u.created_at)}</td>
                          <td className="px-4 py-3">
                            <a
                              href={`/admin/users/${u.id}`}
                              className="text-xs hover:underline whitespace-nowrap"
                              style={{ color: "#C9964A" }}
                            >
                              פרופיל →
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══ 11. RECENT EVENTS ════════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>20 אירועים אחרונים</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right" style={{ borderBottom: "1px solid #2C323E", background: "#101520" }}>
                    {["סוג", "user_id", "anonymous_id", "metadata", "זמן"].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "#9E9990" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: "#9E9990" }}>אין אירועים עדיין</td></tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id} className="transition" style={{ borderBottom: "1px solid #2C323E" }}>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-mono font-medium" style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: "#F0C564" }}>
                            {e.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs dir-ltr text-left" style={{ color: "#9E9990" }}>
                          {e.user_id ? e.user_id.slice(0, 8) + "…" : "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs dir-ltr text-left" style={{ color: "#9E9990" }}>
                          {e.anonymous_id ? e.anonymous_id.slice(0, 8) + "…" : "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs max-w-xs truncate dir-ltr text-left" style={{ color: "#9E9990" }}>
                          {JSON.stringify(e.metadata)}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>{relativeTime(e.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══ HIVE MEMBERSHIP ═════════════════════════════════ */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#9E9990" }}>כוורת 🐝</h2>
          <div className="flex flex-col gap-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "סה״כ חברים פעילים", value: String(hiveStats.totalActive) },
                { label: "₪29 (מסלול לקוחות)", value: String(hiveStats.basic29Count) },
                { label: "₪97 (מסלול פתוח)", value: String(hiveStats.premium97Count) },
                { label: "הכנסה חוזרת חודשית", value: shekel(hiveStats.mrr) },
                { label: "חברים חדשים החודש", value: String(hiveStats.newThisMonth) },
                { label: "ביטולים החודש", value: String(hiveStats.cancelledThisMonth) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
                  <span className="text-3xl font-black" style={{ color: "#C9964A" }}>{s.value}</span>
                  <span className="text-sm" style={{ color: "#9E9990" }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Early cancellation alert */}
            {hiveStats.earlyCancel > 0 && (
              <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <p className="font-bold text-sm" style={{ color: "#f87171" }}>
                  🔴 {hiveStats.earlyCancel} ביטולים תוך 14 יום - החזר נדרש
                </p>
                <div className="flex flex-col gap-1">
                  {hiveStats.earlyCancelDetails.map((m, i) => (
                    <div key={i} className="text-xs flex gap-3" style={{ color: "#9E9990" }}>
                      <span className="font-medium" style={{ color: "#EDE9E1" }}>{m.name ?? "-"}</span>
                      <span dir="ltr">{m.email}</span>
                      <span>הצטרף: {m.hive_started_at ? new Date(m.hive_started_at).toLocaleDateString("he-IL") : "-"}</span>
                      <span>ביטל: {m.hive_cancelled_at ? new Date(m.hive_cancelled_at).toLocaleDateString("he-IL") : "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming billing */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
              <p className="text-sm font-semibold" style={{ color: "#EDE9E1" }}>
                תאריכי חיוב קרובים (7 ימים הבאים): {hiveStats.upcomingBilling}
              </p>
              {hiveStats.upcomingBillingDetails.length > 0 && (
                <div className="flex flex-col gap-1">
                  {hiveStats.upcomingBillingDetails.map((m, i) => (
                    <div key={i} className="text-xs flex gap-3" style={{ color: "#9E9990" }}>
                      <span className="font-medium" style={{ color: "#EDE9E1" }}>{m.name ?? "-"}</span>
                      <span dir="ltr">{m.email}</span>
                      <span className="font-bold" style={{ color: "#C9964A" }}>
                        {m.hive_tier === "discounted_29" ? "₪29" : "₪97"}
                      </span>
                      <span>חיוב: {m.hive_next_billing_date ? new Date(m.hive_next_billing_date).toLocaleDateString("he-IL") : "-"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ 12. ERROR LOG ════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: "#9E9990" }}>
              שגיאות אחרונות
              {errors.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-900 px-2 py-0.5 text-xs font-bold text-red-300">
                  {errors.length}
                </span>
              )}
            </h2>
            {errors.length > 0 && <ClearErrorsButton />}
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
            {errors.length === 0 ? (
              <div className="px-6 py-10 text-center flex flex-col items-center gap-2" style={{ color: "#9E9990" }}>
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>אין שגיאות - הכל עובד 🎉</span>
              </div>
            ) : (
              <div>
                {errors.map((err, i) => (
                  <div key={err.id ?? i} className="px-5 py-4 flex flex-col gap-1" style={{ borderBottom: "1px solid #2C323E" }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>{err.context}</span>
                      <span className="text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>{relativeTime(err.created_at ?? null)}</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#EDE9E1" }}>{err.error}</p>
                    {err.payload && Object.keys(err.payload).length > 0 && (
                      <pre className="text-xs font-mono rounded px-3 py-2 overflow-x-auto dir-ltr text-left mt-1" style={{ background: "#101520", color: "#9E9990" }}>
                        {JSON.stringify(err.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

// silence unused-import for cvr until needed
void cvr;
