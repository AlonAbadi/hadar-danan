import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { AdminUserActions } from "./AdminUserActions";
import { NotesSection } from "./NotesSection";
import { TrueSignalCard } from "./TrueSignalCard";

export const dynamic = "force-dynamic";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  lead:             "ליד",
  engaged:          "מעורב",
  high_intent:      "כוונה גבוהה",
  buyer:            "קנה",
  booked:           "הזמין שיחה",
  premium_lead:     "ליד פרמיום",
  partnership_lead: "ליד שותפות",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  lead:             { bg: "rgba(158,153,144,0.15)", color: "#9E9990" },
  engaged:          { bg: "rgba(55,138,221,0.15)",  color: "#378ADD" },
  high_intent:      { bg: "rgba(239,159,39,0.15)",  color: "#EF9F27" },
  buyer:            { bg: "rgba(76,175,130,0.15)",  color: "#4CAF82" },
  booked:           { bg: "rgba(127,119,221,0.15)", color: "#7F77DD" },
  premium_lead:     { bg: "rgba(232,185,74,0.15)",  color: "#E8B94A" },
  partnership_lead: { bg: "rgba(127,119,221,0.15)", color: "#7F77DD" },
};

const LEAD_SCORE: Record<string, number> = {
  lead: 20, engaged: 40, high_intent: 75,
  buyer: 90, booked: 100, premium_lead: 85, partnership_lead: 90,
};

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197:  "אתגר 7 ימים",
  workshop_1080:  "סדנה יום אחד",
  course_1800:    "קורס דיגיטלי",
  strategy_4000:  "פגישת אסטרטגיה",
  premium_14000:  "יום צילום פרמיום",
  test_1:         "מוצר בדיקה",
};

const PRODUCT_PRICES: Record<string, string> = {
  challenge_197:  "197",
  workshop_1080:  "1,080",
  course_1800:    "1,800",
  strategy_4000:  "4,000",
  premium_14000:  "14,000",
};

const QUIZ_LABELS: Record<string, string> = {
  course:        "קורס",
  premium:       "פרימיום",
  strategy:      "אסטרטגיה",
  workshop:      "סדנה",
  challenge:     "אתגר",
  partnership:   "שותפות",
  free_training: "הדרכה חינמית",
};

const PAGE_LABELS: Record<string, string> = {
  "/":               "עמוד הבית",
  "/challenge":      "אתגר 7 ימים",
  "/course":         "קורס דיגיטלי",
  "/strategy":       "פגישת אסטרטגיה",
  "/premium":        "יום צילום פרמיום",
  "/training":       "הדרכה חינמית",
  "/training/watch": "צפה בהדרכה",
  "/workshop":       "סדנה",
  "/partnership":    "שותפות",
  "/hive":           "הכוורת",
  "/quiz":           "קוויז",
};

const VIDEO_TITLE: Record<string, string> = {
  "1178865564": "הדרכה חינמית",
};

const SKIP_EVENTS = new Set(["QUIZ_ANSWER", "QUIZ_CTA_CLICK"]);

// ── Types ─────────────────────────────────────────────────────────────────────

type RawEvent = {
  id:         string;
  created_at: string;
  type:       unknown;
  metadata:   unknown;
};

type VideoEventRow = {
  id:              string;
  video_id:        string;
  event_type:      string;
  percent_watched: number | null;
  created_at:      string;
};

// Unified event for the timeline (regular events + video milestones)
type TimelineEvent = {
  uid:        string;
  created_at: string;
  evType:     string;                          // "VIDEO_MILESTONE" or raw event type
  metadata:   Record<string, unknown> | null;
};

type Session = {
  index:    number;
  startIso: string;
  events:   TimelineEvent[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק'`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שע'`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "אתמול";
  if (days < 30) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString("he-IL");
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function scoreColor(n: number): string {
  if (n <= 40) return "#E05555";
  if (n <= 70) return "#EF9F27";
  if (n <= 85) return "#E8B94A";
  return "#4CAF82";
}

function getInitials(name: string | null, email: string): string {
  const str = name ?? email;
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return str.slice(0, 2).toUpperCase();
}

// Convert raw DB events + video milestones into unified timeline items
function toVideoMilestones(videoEvents: VideoEventRow[]): TimelineEvent[] {
  const THRESHOLDS = [25, 50, 75, 90];
  // already sorted ascending by created_at from query
  const reached: Record<string, Set<number>> = {};
  const milestones: TimelineEvent[] = [];

  for (const ev of videoEvents) {
    const vid = ev.video_id;
    if (!reached[vid]) reached[vid] = new Set();
    const pct = ev.percent_watched ?? 0;
    const isCompleted = ev.event_type === "completed";

    for (const threshold of THRESHOLDS) {
      if ((pct >= threshold || (isCompleted && threshold === 90)) && !reached[vid].has(threshold)) {
        reached[vid].add(threshold);
        milestones.push({
          uid:        `vm-${vid}-${threshold}-${ev.id}`,
          created_at: ev.created_at,
          evType:     "VIDEO_MILESTONE",
          metadata:   { video_id: vid, percent: threshold },
        });
      }
    }
  }
  return milestones;
}

function rawToTimeline(events: RawEvent[]): TimelineEvent[] {
  return events.map((ev) => ({
    uid:        ev.id,
    created_at: ev.created_at,
    evType:     String(ev.type ?? ""),
    metadata:   (ev.metadata as Record<string, unknown>) ?? null,
  }));
}

function groupIntoSessions(unified: TimelineEvent[]): Session[] {
  // sort chronologically
  const sorted = [...unified].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const sessions: Session[] = [];
  let cur: Session | null = null;

  for (const ev of sorted) {
    const ts  = new Date(ev.created_at).getTime();
    const last = cur?.events[cur.events.length - 1];
    if (!cur || (last && ts - new Date(last.created_at).getTime() > 30 * 60 * 1000)) {
      cur = { index: sessions.length + 1, startIso: ev.created_at, events: [] };
      sessions.push(cur);
    }
    cur.events.push(ev);
  }

  return sessions.reverse(); // newest first
}

function describeEvent(evType: string, meta: Record<string, unknown> | null): {
  label: string; dot: string; skip: boolean;
} {
  if (SKIP_EVENTS.has(evType)) return { label: "", dot: "", skip: true };
  const m = meta ?? {};

  switch (evType) {
    case "VIDEO_MILESTONE": {
      const vid   = m.video_id as string;
      const pct   = m.percent  as number;
      const title = VIDEO_TITLE[vid] ?? `סרטון ${vid}`;
      if (pct >= 90) return { label: `צפה/תה בסרטון עד הסוף: ${title}`,    dot: "#4CAF82", skip: false };
      return         { label: `צפה/תה ב-${pct}% מהסרטון: ${title}`,        dot: "#7F77DD", skip: false };
    }
    case "PAGE_VIEW": {
      const page  = m.page as string | undefined;
      const label = PAGE_LABELS[page ?? ""] ?? page ?? "עמוד";
      return { label: `צפה/תה בעמוד: ${label}`, dot: "#378ADD", skip: false };
    }
    case "USER_SIGNED_UP":
      return { label: "נרשם/ה לאתר",       dot: "#4CAF82", skip: false };
    case "QUIZ_STARTED":
      return { label: "התחיל/ה קוויז",      dot: "#7F77DD", skip: false };
    case "QUIZ_COMPLETED": {
      const rec  = m.recommended_product as string | undefined;
      const pct  = m.match_percent       as number | undefined;
      const prod = rec ? (QUIZ_LABELS[rec] ?? rec) : "";
      return {
        label: `השלים/ה קוויז${prod ? ` - מומלץ: ${prod}${pct ? ` ${pct}%` : ""}` : ""}`,
        dot:   "#7F77DD", skip: false,
      };
    }
    case "QUIZ_LEAD":
      return { label: "השאיר/ה פרטים",     dot: "#7F77DD", skip: false };
    case "CHECKOUT_STARTED": {
      const product = m.product as string | undefined;
      const amount  = m.amount  as number | undefined;
      const parts   = [
        "התחיל/ה רכישה",
        product ? (PRODUCT_LABELS[product] ?? product) : null,
        amount  ? `\u20AA${amount.toLocaleString("he-IL")}` : null,
      ].filter(Boolean);
      return { label: parts.join(" - "), dot: "#EF9F27", skip: false };
    }
    case "PURCHASE_COMPLETED": {
      const product = m.product as string | undefined;
      const amount  = m.amount  as number | undefined;
      const parts   = [
        "רכש/ה",
        product ? (PRODUCT_LABELS[product] ?? product) : null,
        amount  ? `\u20AA${amount.toLocaleString("he-IL")}` : null,
      ].filter(Boolean);
      return { label: parts.join(" - "), dot: "#4CAF82", skip: false };
    }
    case "CALL_BOOKED":
      return { label: "קבע/ה פגישה",       dot: "#C9964A", skip: false };
    case "EMAIL_OPENED":
      return { label: "פתח/ה אימייל",      dot: "#378ADD", skip: false };
    case "LINK_CLICKED":
      return { label: "לחץ/ה על לינק",     dot: "#378ADD", skip: false };
    case "HIVE_JOINED":
      return { label: "הצטרף/ה לכוורת",   dot: "#C9964A", skip: false };
    case "HIVE_CANCELLED":
      return { label: "ביטל/ה מנוי כוורת", dot: "#E05555", skip: false };
    default:
      return { label: evType, dot: "#9E9990", skip: false };
  }
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function Card({ title, badge, children }: { title?: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 12, padding: "20px 24px" }}>
      {(title || badge) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {title && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#9E9990", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {title}
            </span>
          )}
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

function InfoRow({ label, value, ltr }: { label: string; value?: string | null; ltr?: boolean }) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "7px 0", borderBottom: "1px solid rgba(44,50,62,0.5)",
    }}>
      <span style={{ color: "#9E9990", fontSize: 13, width: 110, flexShrink: 0, lineHeight: 1.5 }}>
        {label}
      </span>
      <span style={{
        color: "#EDE9E1", fontSize: 13, fontWeight: 500, lineHeight: 1.5,
        direction: ltr ? "ltr" : undefined, wordBreak: "break-all",
      }}>
        {value || "-"}
      </span>
    </div>
  );
}

function Chip({ children, bg, color }: { children: ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: "3px 8px", borderRadius: 6, lineHeight: 1.4,
    }}>
      {children}
    </span>
  );
}

// ── safeFrom ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;

  const [userRes, eventsRes, purchasesRes, notesRes, quizRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).single(),
    supabase.from("events").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("purchases").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    safeFrom(supabase, "notes").select("id, author, content, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("quiz_results").select("recommended_product, second_product, match_percent, scores, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(1),
  ]);

  const user = userRes.data;
  if (!user) notFound();

  // Fetch video events by email (separate query — needs user email)
  const videoEventsRes = await safeFrom(supabase, "video_events")
    .select("id, video_id, event_type, percent_watched, created_at")
    .eq("user_email", user.email)
    .order("created_at", { ascending: true });

  const events      = (eventsRes.data     ?? []) as RawEvent[];
  const purchases   = purchasesRes.data   ?? [];
  const notes       = notesRes.data       ?? [];
  const quizResult  = (quizRes.data ?? [])[0] ?? null;
  const videoEvents = (videoEventsRes.data ?? []) as VideoEventRow[];

  // ── Derived ──────────────────────────────────────────────
  const initials  = getInitials(user.name, user.email);
  const leadScore = LEAD_SCORE[user.status] ?? 0;
  const sc        = scoreColor(leadScore);
  const ss        = STATUS_STYLE[user.status] ?? STATUS_STYLE.lead;

  const now48     = Date.now() - 48 * 60 * 60 * 1000;
  const pendingCart = purchases.filter(
    (p) => p.status === "pending" && new Date(p.created_at).getTime() >= now48,
  );
  const hasCart       = pendingCart.length > 0;
  const cartHoursAgo  = hasCart
    ? Math.round((Date.now() - new Date(pendingCart[pendingCart.length - 1].created_at).getTime()) / 3_600_000)
    : 0;

  const quizScores    = quizResult?.scores ? (quizResult.scores as Record<string, number>) : null;
  const premiumScore  = quizScores?.premium     ?? 0;
  const partnerScore  = quizScores?.partnership ?? 0;
  const isPremium     = premiumScore  >= 8;
  const isPartnership = partnerScore  >= 8;

  const sortedScores = quizScores
    ? Object.entries(quizScores).sort(([, a], [, b]) => b - a)
    : null;
  const maxScore = sortedScores ? Math.max(...sortedScores.map(([, v]) => v), 1) : 1;

  const platform = user.click_id?.startsWith("IwY")
    ? "Meta - ככל הנראה DM"
    : (user.utm_source ?? "direct");

  const waPhone = user.phone
    ? "972" + user.phone.replace(/^0/, "").replace(/\D/g, "")
    : null;

  // ── Video processing ─────────────────────────────────────
  // Summary: max percent reached per video
  const videoSummary = Object.entries(
    videoEvents.reduce<Record<string, number>>((acc, ev) => {
      const vid = ev.video_id;
      const pct = ev.event_type === "completed" ? 100 : (ev.percent_watched ?? 0);
      acc[vid]  = Math.max(acc[vid] ?? 0, pct);
      return acc;
    }, {}),
  ).map(([vid, maxPct]) => ({ vid, title: VIDEO_TITLE[vid] ?? `סרטון ${vid}`, maxPct }));

  // Timeline: merge events + video milestones
  const videoMilestones = toVideoMilestones(videoEvents);
  const unified = [...rawToTimeline(events), ...videoMilestones];
  const sessions = groupIntoSessions(unified);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #080C14; color: #EDE9E1; }
        .up-root {
          direction: rtl;
          font-family: 'Assistant', sans-serif;
          background: #080C14;
          min-height: 100vh;
          color: #EDE9E1;
        }
        @media (max-width: 768px) {
          .up-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="up-root">

        {/* ── Header ───────────────────────────────────────────────── */}
        <header style={{
          background: "#0D1219", borderBottom: "1px solid #2C323E",
          padding: "14px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16,
        }}>
          <Link href="/admin/crm" style={{ color: "#9E9990", fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            &larr; חזור ל-CRM
          </Link>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(127,119,221,0.2)", color: "#7F77DD",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, flexShrink: 0,
              }}>
                {initials}
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#EDE9E1" }}>
                {user.name ?? user.email}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              <Chip bg={ss.bg} color={ss.color}>{STATUS_LABELS[user.status] ?? user.status}</Chip>
              {hasCart      && <Chip bg="rgba(239,159,39,0.15)"  color="#EF9F27">נטש עגלה</Chip>}
              {isPremium    && <Chip bg="rgba(232,185,74,0.15)"  color="#E8B94A">ליד פרימיום פוטנציאלי</Chip>}
              {isPartnership && <Chip bg="rgba(127,119,221,0.15)" color="#7F77DD">ליד שותפות פוטנציאלי</Chip>}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: sc, lineHeight: 1 }}>{leadScore}</span>
            <span style={{ fontSize: 12, color: "#9E9990" }}>נרשם/ה {relativeTime(user.created_at)}</span>
          </div>
        </header>

        {/* ── Action bar ────────────────────────────────────────────── */}
        <AdminUserActions userId={id} currentStatus={user.status} phone={waPhone} />

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── TrueSignal diagnosis ──────────────────────────────────── */}
          <TrueSignalCard userId={user.id} />

          {/* ── Alerts ────────────────────────────────────────────────── */}
          {hasCart && (
            <div style={{
              background: "rgba(239,159,39,0.07)", border: "1px solid rgba(239,159,39,0.18)",
              borderRight: "3px solid #EF9F27", borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#EF9F27", marginBottom: 6 }}>
                נטישת עגלה - לפני {cartHoursAgo} שעות
              </div>
              {pendingCart.map((p) => (
                <div key={p.id} style={{ fontSize: 13, color: "#9E9990", marginTop: 3 }}>
                  {PRODUCT_LABELS[p.product as string] ?? p.product}
                  {PRODUCT_PRICES[p.product as string] ? ` - \u20AA${PRODUCT_PRICES[p.product as string]}` : ""}
                </div>
              ))}
            </div>
          )}

          {isPremium && (
            <div style={{
              background: "rgba(127,119,221,0.07)", border: "1px solid rgba(127,119,221,0.2)",
              borderRight: "3px solid #7F77DD", borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#7F77DD", marginBottom: 4 }}>
                ליד פרימיום פוטנציאלי - לידיעת הדר ואלון
              </div>
              <div style={{ fontSize: 13, color: "#9E9990" }}>
                ציון פרימיום גבוה. שווה לבדוק התאמה לפני הצעת מוצר אחר.
              </div>
            </div>
          )}

          {isPartnership && (
            <div style={{
              background: "rgba(127,119,221,0.07)", border: "1px solid rgba(127,119,221,0.2)",
              borderRight: "3px solid #7F77DD", borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#7F77DD", marginBottom: 4 }}>
                ליד שותפות פוטנציאלי - לידיעת הדר ואלון
              </div>
              <div style={{ fontSize: 13, color: "#9E9990" }}>
                ציון שותפות גבוה. שווה לבדוק התאמה לפני הצעת מוצר אחר.
              </div>
            </div>
          )}

          {/* ── Two-column grid ───────────────────────────────────────── */}
          <div className="up-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Left column: personal + marketing */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <Card title="פרטים אישיים">
                <InfoRow label="שם"      value={user.name} />
                <InfoRow label="אימייל"  value={user.email} ltr />
                <InfoRow label="טלפון"   value={user.phone} ltr />
                <InfoRow label="נרשם/ה"  value={fmtDateTime(user.created_at)} />
                <InfoRow label="סטטוס"   value={STATUS_LABELS[user.status] ?? user.status} />
              </Card>

              <Card title="מקור ושיווק">
                <InfoRow label="פלטפורמה" value={platform} />
                <InfoRow label="קמפיין"   value={user.utm_campaign} />
                <InfoRow label="אד-סט"    value={user.utm_adset} />
                <InfoRow label="גרסת A/B" value={user.ab_variant} />
                <InfoRow label="click_id" ltr
                  value={user.click_id
                    ? user.click_id.slice(0, 20) + (user.click_id.length > 20 ? "..." : "")
                    : null}
                />
              </Card>
            </div>

            {/* Right column: quiz + purchases + video summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <Card title="ציוני קוויז">
                {sortedScores ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {sortedScores.map(([product, score], idx) => (
                      <div key={product}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, color: "#EDE9E1" }}>
                              {QUIZ_LABELS[product] ?? product}
                            </span>
                            {idx === 0 && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                background: "rgba(232,185,74,0.15)", color: "#E8B94A",
                              }}>
                                מומלץ
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 12, color: "#9E9990" }}>{score}</span>
                        </div>
                        <div style={{ background: "#0D1219", borderRadius: 4, height: 6, overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.round((score / maxScore) * 100)}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #E8B94A, #9E7C3A)",
                            borderRadius: 4,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#9E9990", fontSize: 13, textAlign: "center", padding: "20px 0", margin: 0 }}>
                    אין תוצאות קוויז
                  </p>
                )}
              </Card>

              {/* ── Completed purchases ───────────────────────────── */}
              <Card title="רכישות">
                {purchases.filter((p) => p.status === "completed").length === 0 ? (
                  <p style={{ color: "#9E9990", fontSize: 13, textAlign: "center", padding: "20px 0", margin: 0 }}>
                    אין רכישות עדיין
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {purchases.filter((p) => p.status === "completed").map((p) => (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 0", borderBottom: "1px solid rgba(44,50,62,0.5)",
                        flexWrap: "wrap",
                      }}>
                        <span style={{ fontSize: 13, color: "#EDE9E1", flex: 1, minWidth: 90 }}>
                          {PRODUCT_LABELS[p.product as string] ?? p.product}
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                          backgroundClip: "text", flexShrink: 0,
                        }}>
                          {"\u20AA"}{Number(p.amount).toLocaleString("he-IL")}
                        </span>
                        <span style={{ fontSize: 11, color: "#4CAF82", fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(76,175,130,0.15)", flexShrink: 0 }}>
                          הושלם
                        </span>
                        <span style={{ fontSize: 11, color: "#9E9990", flexShrink: 0 }}>
                          {fmtDateTime(p.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── Abandoned checkouts (pending / failed) ────────── */}
              {purchases.filter((p) => p.status === "pending" || p.status === "failed").length > 0 && (
                <Card>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      עגלות נטושות
                    </span>
                    <span style={{ fontSize: 11, color: "#6B7280", marginRight: 6 }}>
                      · ניסיונות רכישה שלא הושלמו
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {purchases.filter((p) => p.status === "pending" || p.status === "failed").map((p) => (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 0", borderBottom: "1px solid rgba(44,50,62,0.3)",
                        flexWrap: "wrap",
                        opacity: 0.8,
                      }}>
                        <span style={{ fontSize: 13, color: "#9E9990", flex: 1, minWidth: 90 }}>
                          {PRODUCT_LABELS[p.product as string] ?? p.product}
                        </span>
                        <span style={{ fontSize: 13, color: "#6B7280", flexShrink: 0 }}>
                          {"\u20AA"}{Number(p.amount).toLocaleString("he-IL")}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5, flexShrink: 0,
                          background: p.status === "pending" ? "rgba(239,159,39,0.12)" : "rgba(224,85,85,0.12)",
                          color:      p.status === "pending" ? "#EF9F27"               : "#E05555",
                        }}>
                          {p.status === "pending" ? "ממתין" : "נכשל"}
                        </span>
                        <span style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>
                          {fmtDateTime(p.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Video summary card */}
              <Card title="צפיות בסרטונים">
                {videoSummary.length === 0 ? (
                  <p style={{ color: "#9E9990", fontSize: 13, textAlign: "center", padding: "20px 0", margin: 0 }}>
                    אין צפיות מתועדות
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {videoSummary.map(({ vid, title, maxPct }) => (
                      <div key={vid}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: "#EDE9E1" }}>{title}</span>
                          <span style={{ fontSize: 12, color: maxPct >= 90 ? "#4CAF82" : "#9E9990", fontWeight: 600 }}>
                            {maxPct >= 90 ? "עד הסוף" : `${maxPct}%`}
                          </span>
                        </div>
                        <div style={{ background: "#0D1219", borderRadius: 4, height: 5, overflow: "hidden" }}>
                          <div style={{
                            width: `${maxPct}%`, height: "100%",
                            background: maxPct >= 90
                              ? "linear-gradient(90deg, #4CAF82, #2E8B57)"
                              : "linear-gradient(90deg, #7F77DD, #5B54AA)",
                            borderRadius: 4,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* ── Automations ───────────────────────────────────────────── */}
          <Card
            title="אוטומציות"
            badge={
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                background: "rgba(55,138,221,0.15)", color: "#378ADD",
              }}>
                בפיתוח
              </span>
            }
          >
            {[
              {
                title: "WhatsApp אוטומטי - נטישת עגלה",
                desc:  "נשלח 2 שעות אחרי נטישה",
                badge: hasCart ? { label: "ממתין", bg: "rgba(239,159,39,0.15)", color: "#EF9F27" } : null,
              },
              {
                title: "אימייל פולואו-אפ",
                desc:  "נשלח 24 שעות אחרי אם אין תגובה",
                badge: { label: "מתוזמן", bg: "rgba(55,138,221,0.15)", color: "#378ADD" },
              },
              {
                title: "תזכורת לצוות",
                desc:  "התראה פנימית אם עבר יום ללא טיפול",
                badge: { label: "מתוזמן", bg: "rgba(55,138,221,0.15)", color: "#378ADD" },
              },
            ].map((row) => (
              <div key={row.title} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid rgba(44,50,62,0.4)", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#EDE9E1" }}>{row.title}</div>
                  <div style={{ fontSize: 12, color: "#9E9990", marginTop: 2 }}>{row.desc}</div>
                </div>
                {row.badge && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                    background: row.badge.bg, color: row.badge.color, flexShrink: 0,
                  }}>
                    {row.badge.label}
                  </span>
                )}
              </div>
            ))}
          </Card>

          {/* ── Timeline ──────────────────────────────────────────────── */}
          <Card title="מסלול הביקור">
            {sessions.length === 0 ? (
              <p style={{ color: "#9E9990", fontSize: 13, textAlign: "center", padding: "20px 0", margin: 0 }}>
                אין אירועים עדיין
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {sessions.map((session) => (
                  <div key={session.index}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#9E9990",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      paddingBottom: 8, marginBottom: 10,
                      borderBottom: "1px solid rgba(44,50,62,0.6)",
                    }}>
                      ביקור {session.index} -{" "}
                      {new Date(session.startIso).toLocaleString("he-IL", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {session.events.map((ev) => {
                        const { label, dot, skip } = describeEvent(ev.evType, ev.metadata);
                        if (skip) return null;
                        return (
                          <div key={ev.uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 7, height: 7, borderRadius: "50%",
                              background: dot, flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 12, color: "#9E9990", width: 38, flexShrink: 0 }}>
                              {fmtTime(ev.created_at)}
                            </span>
                            <span style={{ fontSize: 13, color: "#EDE9E1" }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Notes ──────────────────────────────────────────────────── */}
          <NotesSection userId={id} initialNotes={notes} />

        </div>
      </div>
    </>
  );
}
