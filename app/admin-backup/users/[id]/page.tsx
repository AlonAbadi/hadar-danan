import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { AdminUserActions } from "./AdminUserActions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  lead: "ליד", engaged: "מעורב", high_intent: "כוונה גבוהה", buyer: "קנה",
  booked: "הזמין שיחה", premium_lead: "ליד פרמיום", partnership_lead: "ליד שותפות",
};

const STATUS_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700", engaged: "bg-blue-100 text-blue-700",
  high_intent: "bg-yellow-100 text-yellow-800", buyer: "bg-green-100 text-green-700",
  booked: "bg-purple-100 text-purple-700", premium_lead: "bg-yellow-200 text-yellow-900",
  partnership_lead: "bg-amber-100 text-amber-800",
};

const SCORE: Record<string, number> = {
  lead: 10, engaged: 30, high_intent: 55, buyer: 80, booked: 100, premium_lead: 90, partnership_lead: 95,
};

const EVENT_ICONS: Record<string, string> = {
  USER_SIGNED_UP: "✍️", EMAIL_OPENED: "📧", LINK_CLICKED: "🔗",
  CHECKOUT_STARTED: "🛒", PURCHASE_COMPLETED: "💰", CALL_BOOKED: "📅",
  INACTIVE_3_DAYS: "😴", PAGE_VIEW: "👁️",
};

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197: "צ׳אלנג׳ 7 הימים - ₪197",
  workshop_1080: "סדנה יום אחד - ₪1,080",
  strategy_4000: "פגישת אסטרטגיה - ₪4,000",
};

const TEMPLATE_LABELS: Record<string, string> = {
  welcome: "ברוכ/ה הבא/ה", followup_24h: "פולואפ 24h", followup_72h: "פולואפ 72h",
  challenge_access: "גישה לצ׳אלנג׳", challenge_upsell_workshop: "אפסל סדנה",
  workshop_confirmation: "אישור סדנה", workshop_upsell_strategy: "אפסל אסטרטגיה",
  cart_abandon_1h: "עגלה נטושה 1h", cart_abandon_24h: "עגלה נטושה 24h",
  reengagement: "החזרת גולש", booking_confirmation: "אישור פגישה",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שע׳`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString("he-IL");
}

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { id }   = params;

  // Fetch everything in parallel
  const [userRes, eventsRes, emailLogsRes, purchasesRes, bookingsRes, seqsRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).single(),
    supabase.from("events").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("email_logs").select("id, sequence_id, status, sent_at").eq("user_id", id).order("sent_at", { ascending: false }),
    supabase.from("purchases").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("*").eq("user_id", id).order("slot_date", { ascending: false }).limit(10),
    supabase.from("email_sequences").select("id, template_key, subject"),
  ]);

  const user = userRes.data;
  if (!user) notFound();

  const events    = eventsRes.data    ?? [];
  const emailLogs = emailLogsRes.data ?? [];
  const purchases = purchasesRes.data ?? [];
  const bookings  = (bookingsRes.data ?? []) as Array<{
    id: string; slot_date: string; slot_time: string; status: string; created_at: string;
  }>;
  const seqMap = Object.fromEntries(
    (seqsRes.data ?? []).map((s) => [s.id, { template_key: s.template_key, subject: s.subject }])
  );

  const score = SCORE[user.status] ?? 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-assistant">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-700 transition">
            ← חזור ל-Admin
          </Link>
          <span className="text-gray-200">|</span>
          <h1 className="font-black text-lg text-gray-900">{user.name ?? user.email}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-600"}`}>
            {STATUS_LABELS[user.status] ?? user.status}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            score >= 80 ? "bg-green-100 text-green-700"
            : score >= 50 ? "bg-yellow-100 text-yellow-700"
            : "bg-gray-100 text-gray-500"
          }`}>
            ציון {score}/100
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* User info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">פרטים אישיים</h2>
            <div className="flex flex-col gap-2 text-sm">
              {[
                { label: "שם",        value: user.name ?? "-" },
                { label: "אימייל",    value: user.email, dir: "ltr" },
                { label: "טלפון",     value: user.phone ?? "-", dir: "ltr" },
                { label: "נרשם",      value: relativeTime(user.created_at) },
                { label: "נראה לאחרונה", value: relativeTime(user.last_seen_at) },
              ].map((r) => (
                <div key={r.label} className="flex gap-2">
                  <span className="text-gray-400 w-36 flex-shrink-0">{r.label}</span>
                  <span className={`text-gray-900 font-medium ${r.dir === "ltr" ? "dir-ltr text-left" : ""}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">שיווק / מקור</h2>
            <div className="flex flex-col gap-2 text-sm">
              {[
                { label: "utm_source",   value: user.utm_source ?? "direct" },
                { label: "utm_campaign", value: user.utm_campaign ?? "-" },
                { label: "utm_adset",    value: user.utm_adset ?? "-" },
                { label: "A/B גרסה",    value: user.ab_variant ?? "-" },
                { label: "click_id",     value: user.click_id ? user.click_id.slice(0, 16) + "…" : "-", dir: "ltr" },
              ].map((r) => (
                <div key={r.label} className="flex gap-2">
                  <span className="text-gray-400 w-36 flex-shrink-0 font-mono text-xs">{r.label}</span>
                  <span className={`text-gray-900 font-medium text-xs ${r.dir === "ltr" ? "dir-ltr text-left" : ""}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin actions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">פעולות</h2>
          <AdminUserActions userId={id} currentStatus={user.status} />
        </section>

        {/* Purchases */}
        {purchases.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              רכישות ({purchases.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-right">
                    {["מוצר", "סכום", "סטטוס", "תאריך"].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {PRODUCT_LABELS[p.product as string] ?? p.product}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-700">₪{p.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "completed" ? "bg-green-100 text-green-700"
                          : p.status === "failed" ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Bookings */}
        {bookings.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              פגישות ({bookings.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-right">
                    {["תאריך", "שעה", "סטטוס", "נקבע"].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {new Date(b.slot_date + "T12:00:00").toLocaleDateString("he-IL", { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-medium">{b.slot_time}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {b.status === "confirmed" ? "מאושר" : b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Email history */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            היסטוריית אימיילים ({emailLogs.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {emailLogs.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">לא נשלחו אימיילים עדיין</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {emailLogs.map((log) => {
                  const seq = log.sequence_id ? seqMap[log.sequence_id] : null;
                  return (
                    <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {log.status === "clicked" ? "🔗" : log.status === "opened" ? "👀" : "📤"}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {seq ? (TEMPLATE_LABELS[seq.template_key] ?? seq.template_key) : "-"}
                          </p>
                          {seq?.subject && (
                            <p className="text-xs text-gray-400">{seq.subject}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.status === "clicked" ? "bg-green-100 text-green-700"
                          : log.status === "opened" ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                        }`}>
                          {log.status === "clicked" ? "קלק" : log.status === "opened" ? "נפתח" : "נשלח"}
                        </span>
                        <span className="text-xs text-gray-400">{relativeTime(log.sent_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Event timeline */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            ציר זמן - {events.length} אירועים
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {events.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">אין אירועים עדיין</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {events.map((ev) => (
                  <div key={ev.id} className="px-5 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg flex-shrink-0">
                        {EVENT_ICONS[ev.type as string] ?? "•"}
                      </span>
                      <div>
                        <span className="inline-flex rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-mono font-medium">
                          {ev.type}
                        </span>
                        {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono dir-ltr text-left">
                            {JSON.stringify(ev.metadata)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {relativeTime(ev.created_at)}
                    </span>
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
