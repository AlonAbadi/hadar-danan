import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { AdminUserActions } from "./AdminUserActions";
import { NotesSection } from "./NotesSection";

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

const PAGE_LABELS: Record<string, string> = {
  "/": "עמוד הבית",
  "/challenge": "אתגר 7 ימים",
  "/course": "קורס דיגיטלי",
  "/strategy": "פגישת אסטרטגיה",
  "/premium": "יום צילום פרמיום",
  "/training": "הדרכה חינמית",
  "/training/watch": "צפה בהדרכה",
  "/workshop": "סדנה",
  "/partnership": "שותפות",
  "/hive": "הכוורת",
  "/quiz": "קוויז",
};

function getInternalPath(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("hadar-danan") || parsed.hostname === "localhost") {
      return parsed.pathname;
    }
  } catch { /* ignore */ }
  return null;
}

function describeEvent(type: string, metadata: Record<string, unknown> | null): {
  icon: string; title: string; detail: string | null; highlight: "gold" | "green" | null;
} {
  const m = metadata ?? {};
  switch (type) {
    case "PAGE_VIEW": {
      const page = m.page as string | undefined;
      const pageName = page ? (PAGE_LABELS[page] ?? page) : "";
      const refPath = getInternalPath(m.referrer as string | undefined);
      const fromName = refPath ? (PAGE_LABELS[refPath] ?? null) : null;
      return {
        icon: "👁️",
        title: pageName ? `צפה/ת בעמוד: ${pageName}` : "צפה/ת בעמוד",
        detail: fromName ? `הגיע/ה מ: ${fromName}` : null,
        highlight: null,
      };
    }
    case "USER_SIGNED_UP": {
      const source = m.utm_source as string | undefined;
      return { icon: "🎉", title: "נרשם/ה לאתר", detail: source ? `מקור: ${source}` : null, highlight: null };
    }
    case "QUIZ_STARTED":
      return { icon: "📝", title: "התחיל/ה קוויז", detail: null, highlight: null };
    case "QUIZ_COMPLETED": {
      const rec = m.recommended_product as string | undefined;
      return {
        icon: "✅", title: "השלים/ה קוויז",
        detail: rec ? `מומלץ: ${PRODUCT_LABELS[rec] ?? rec}` : null, highlight: null,
      };
    }
    case "QUIZ_STEP": {
      const step = m.step as number | undefined;
      return { icon: "📝", title: step ? `ענה/תה על שאלה ${step}` : "ענה/תה על שאלת קוויז", detail: null, highlight: null };
    }
    case "CHECKOUT_STARTED":
      return { icon: "🛒", title: "התחיל/ה תהליך רכישה", detail: null, highlight: null };
    case "PURCHASE_COMPLETED": {
      const product = m.product as string | undefined;
      const amount = m.amount as number | undefined;
      return {
        icon: "💰",
        title: `רכש/ה ${product ? (PRODUCT_LABELS[product] ?? product) : ""}`.trim(),
        detail: amount ? `סכום: ₪${amount.toLocaleString("he-IL")}` : null,
        highlight: "green",
      };
    }
    case "CALL_BOOKED": {
      const date = m.slot_date as string | undefined;
      const time = m.slot_time as string | undefined;
      return {
        icon: "📅", title: "קבע/ה פגישה",
        detail: date && time ? `יום ${date} בשעה ${time}` : date ? `יום ${date}` : null,
        highlight: "gold",
      };
    }
    case "EMAIL_OPENED":
      return { icon: "📧", title: "פתח/ה אימייל", detail: null, highlight: null };
    case "LINK_CLICKED":
      return { icon: "🔗", title: "לחץ/ה על לינק", detail: null, highlight: null };
    case "HIVE_JOINED":
      return { icon: "🐝", title: "הצטרף/ה לכוורת", detail: null, highlight: null };
    case "HIVE_CANCELLED":
      return { icon: "❌", title: "ביטל/ה מנוי כוורת", detail: null, highlight: null };
    case "PREMIUM_LEAD":
      return { icon: "⭐", title: "ליד פרמיום חדש", detail: null, highlight: null };
    case "PARTNERSHIP_LEAD":
      return { icon: "🤝", title: "ליד שותפות חדש", detail: null, highlight: null };
    case "INACTIVE_3_DAYS":
      return { icon: "😴", title: "לא פעיל/ה 3 ימים", detail: null, highlight: null };
    default:
      return { icon: "•", title: type, detail: null, highlight: null };
  }
}

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197: "אתגר 7 ימים - ₪197",
  workshop_1080: "סדנה יום אחד - ₪1,080",
  course_1800: "קורס דיגיטלי - ₪1,800",
  strategy_4000: "פגישת אסטרטגיה - ₪4,000",
  premium_14000: "יום צילום פרמיום - ₪14,000",
};

const TEMPLATE_LABELS: Record<string, string> = {
  welcome: "ברוכ/ה הבא/ה", followup_24h: "פולואפ 24h", followup_72h: "פולואפ 72h",
  challenge_access: "גישה לאתגר", challenge_upsell_workshop: "אפסל סדנה",
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
  if (days === 1) return "אתמול";
  if (days < 30) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString("he-IL");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id }   = await params;   // ← awaited (Next.js 15+)

  const [userRes, eventsRes, emailLogsRes, purchasesRes, bookingsRes, seqsRes, notesRes, quizRes] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", id).single(),
      supabase.from("events").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("email_logs").select("id, sequence_id, status, sent_at").eq("user_id", id).order("sent_at", { ascending: false }),
      supabase.from("purchases").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").eq("user_id", id).order("slot_date", { ascending: false }).limit(10),
      supabase.from("email_sequences").select("id, template_key, subject"),
      safeFrom(supabase, "notes").select("id, author, content, created_at").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("quiz_results").select("recommended_product, second_product, match_percent, scores, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(1),
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
  const notes     = notesRes.data ?? [];
  const quizResult = (quizRes.data ?? [])[0] ?? null;

  const score = SCORE[user.status] ?? 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-assistant">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-4">
          <Link href="/admin/crm" className="text-sm text-gray-400 hover:text-gray-700 transition">
            ← חזור ל-CRM
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
                { label: "שם",           value: user.name ?? "-" },
                { label: "אימייל",       value: user.email, dir: "ltr" },
                { label: "טלפון",        value: user.phone ?? "-", dir: "ltr" },
                { label: "סטטוס",        value: STATUS_LABELS[user.status] ?? user.status },
                { label: "כוורת",        value: user.hive_status ?? "-" },
                { label: "tier כוורת",   value: (user as Record<string,unknown>).hive_tier as string ?? "-" },
                { label: "נרשם",         value: relativeTime(user.created_at) },
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

        {/* Quiz result */}
        {quizResult && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">תוצאת קוויז</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-400 w-36 flex-shrink-0">מוצר מומלץ</span>
                <span className="font-bold text-amber-600">{PRODUCT_LABELS[quizResult.recommended_product] ?? quizResult.recommended_product}</span>
              </div>
              {quizResult.second_product && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-36 flex-shrink-0">מוצר שני</span>
                  <span>{PRODUCT_LABELS[quizResult.second_product] ?? quizResult.second_product}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-400 w-36 flex-shrink-0">התאמה</span>
                <span className="font-semibold text-green-600">{quizResult.match_percent}%</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-36 flex-shrink-0">תאריך</span>
                <span>{relativeTime(quizResult.created_at)}</span>
              </div>
              {quizResult.scores && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-36 flex-shrink-0">ציונים</span>
                  <span className="font-mono text-xs text-gray-500">{JSON.stringify(quizResult.scores)}</span>
                </div>
              )}
            </div>
          </section>
        )}

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

        {/* Notes */}
        <NotesSection userId={id} initialNotes={notes} />

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
                          {seq?.subject && <p className="text-xs text-gray-400">{seq.subject}</p>}
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
            ציר זמן — {events.length} אירועים
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {events.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">אין אירועים עדיין</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {events.map((ev) => {
                  const { icon, title, detail, highlight } = describeEvent(
                    ev.type as string,
                    ev.metadata as Record<string, unknown> | null,
                  );
                  return (
                    <div
                      key={ev.id}
                      className="px-5 py-3 flex items-start justify-between gap-3"
                      style={
                        highlight === "gold"
                          ? { background: "rgba(201,150,74,0.08)" }
                          : highlight === "green"
                          ? { background: "rgba(34,197,94,0.07)" }
                          : undefined
                      }
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${
                            highlight === "gold" ? "text-amber-700"
                            : highlight === "green" ? "text-green-700"
                            : "text-gray-800"
                          }`}>
                            {title}
                          </p>
                          {detail && (
                            <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-1">
                        {relativeTime(ev.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
