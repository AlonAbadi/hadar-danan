"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  type Answer,
  PRODUCT_IMAGE,
  PRODUCT_META,
  PRODUCT_DESC,
  CTA_TEXT,
  getPersonalizedReasons,
} from "@/lib/quiz-config";

// ── Types ─────────────────────────────────────────────────────
interface QuizResult {
  answers: Record<string, string>;
  scores: Record<string, number>;
  recommended_product: string;
  second_product: string | null;
  match_percent: number | null;
  created_at: string;
}

interface Purchase {
  id: string;
  product: string;
  amount: number;
  status: string;
  created_at: string;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  hive_status: string | null;
  hive_tier: string | null;
  hive_next_billing_date: string | null;
  marketing_consent: boolean;
}

interface Props {
  authUser: { id: string; email: string };
  userData: UserData | null;
  completedPurchases: Purchase[];
  pendingPurchases: Purchase[];
  credit: number;
  isGoogleUser: boolean;
  quizResult: QuizResult | null;
}

// ── Constants ─────────────────────────────────────────────────
const PRODUCT_LABELS: Record<string, string> = {
  challenge_197:    "אתגר 7 ימים",
  workshop_1080:    "סדנה יום אחד",
  course_1800:      "קורס דיגיטלי",
  strategy_4000:    "אסטרטגיה",
  premium_14000:    "פרימיום",
  test_1:           "תשלום בדיקה",
  hive_starter_160: "כוורת Starter",
  hive_pro_280:     "כוורת Pro",
  hive_elite_480:   "כוורת Elite",
};

const HIVE_TIER_MAP: Record<string, { label: string; color: string }> = {
  discounted_29: { label: "Starter", color: "#378ADD" },
  basic_97:      { label: "Pro",     color: "#E8B94A" },
  elite:         { label: "Elite",   color: "#7F77DD" },
};

const CONTENT_LINKS: Record<string, string> = {
  challenge_197: "/challenge/content",
  course_1800:   "/course/content",
  workshop_1080: "",
  strategy_4000: "",
  premium_14000: "",
};

const WA = "https://wa.me/972539566961";

type ContentCTA = { ctaType: "enter" | "whatsapp" | "book"; badge: string; ctaHref: string; ctaLabel: string };
const PRODUCT_CTA: Record<string, ContentCTA> = {
  challenge_197: { ctaType: "enter",    badge: "",                   ctaHref: "/challenge/content",  ctaLabel: "כנס" },
  course_1800:   { ctaType: "enter",    badge: "",                   ctaHref: "/course/content",     ctaLabel: "כנס" },
  workshop_1080: { ctaType: "whatsapp", badge: "פרטים נשלחו במייל", ctaHref: WA,                    ctaLabel: "וואטסאפ" },
  strategy_4000: { ctaType: "book",     badge: "תואם בוואטסאפ",     ctaHref: "/strategy/book",      ctaLabel: "לוח זמנים" },
  premium_14000: { ctaType: "whatsapp", badge: "נקבע בנפרד",        ctaHref: WA,                    ctaLabel: "וואטסאפ" },
};

// Maps completed purchase product → content route (null = no content, show badge instead)
function getContentRoute(product: string): string | null {
  const map: Record<string, string> = {
    challenge_197:    "/challenge/content",
    course_1800:      "/course/content",
    hive_starter_160: "/hive/members",
    hive_pro_280:     "/hive/members",
    hive_elite_480:   "/hive/members",
  };
  return map[product] ?? null;
}

// Badge label for completed purchases that have no content URL
function getCompletedBadge(product: string): string {
  if (product === "test_1") return "רכישת בדיקה";
  // workshop, strategy, premium — one-time events
  return "בוצעה";
}

const QUIZ_PRODUCT_NAMES: Record<string, string> = {
  free_training: "הדרכה חינמית",
  challenge:     "אתגר 7 הימים",
  workshop:      "סדנה יום אחד",
  course:        "קורס דיגיטלי",
  strategy:      "פגישת אסטרטגיה",
  premium:       "יום צילום פרמיום",
  partnership:   "שותפות אסטרטגית",
};

const QUIZ_PRODUCT_HREF: Record<string, string> = {
  free_training: "/training",
  challenge:     "/challenge",
  workshop:      "/workshop",
  course:        "/course",
  strategy:      "/strategy",
  premium:       "/premium",
  partnership:   "/partnership",
};

const RECOMMENDED = [
  { label: "אתגר 7 ימים - ₪197",          href: "/challenge" },
  { label: "סדנה יום אחד - ₪1,080",        href: "/workshop" },
  { label: "קורס דיגיטלי - ₪1,800",       href: "/course" },
  { label: "הכוורת - 160₪ לחודש",          href: "/hive" }, // TODO: read from PRODUCT_MAP once hive_starter_160 is added there
];

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#080C14",
    padding: "32px 16px 64px",
    fontFamily: "Assistant, sans-serif",
    direction: "rtl" as const,
  } as React.CSSProperties,
  container: {
    maxWidth: 720,
    margin: "0 auto",
  },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
    background: "#141820",
    border: "1px solid #2C323E",
    borderRadius: 10,
    padding: 4,
  },
  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    borderRadius: 8,
    border: "none",
    background: active ? "linear-gradient(135deg, #E8B94A, #9E7C3A)" : "transparent",
    color: active ? "#080C14" : "#9E9990",
    fontSize: 14,
    fontWeight: active ? 800 : 600,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
    transition: "all 0.15s",
  }),
  card: {
    background: "#141820",
    border: "1px solid #2C323E",
    borderRadius: 12,
    padding: "24px",
    marginBottom: 16,
  } as React.CSSProperties,
  avatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 800,
    color: "#080C14",
    flexShrink: 0,
  } as React.CSSProperties,
  name: {
    fontSize: 18,
    fontWeight: 800,
    color: "#EDE9E1",
    margin: 0,
  },
  email: {
    fontSize: 13,
    color: "#9E9990",
    margin: "2px 0 0",
  },
  creditBox: {
    background: "rgba(232,185,74,0.08)",
    border: "1px solid rgba(232,185,74,0.25)",
    borderRadius: 10,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,
  creditAmount: {
    fontSize: 28,
    fontWeight: 800,
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  creditLabel: {
    fontSize: 13,
    color: "#9E9990",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#EDE9E1",
    marginBottom: 16,
    marginTop: 0,
  },
  contentItem: {
    background: "#0D1219",
    border: "1px solid #2C323E",
    borderRadius: 8,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  } as React.CSSProperties,
  contentLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#EDE9E1",
  },
  progressWrap: {
    height: 4,
    background: "#2C323E",
    borderRadius: 2,
    marginTop: 6,
    width: 160,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    width: "100%",
  },
  enterBtn: {
    padding: "8px 18px",
    borderRadius: 7,
    border: "none",
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    color: "#080C14",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
    textDecoration: "none",
    display: "inline-block",
  } as React.CSSProperties,
  // Purchases tab
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  },
  th: {
    color: "#9E9990",
    fontWeight: 600,
    fontSize: 12,
    padding: "0 0 12px",
    textAlign: "right" as const,
    borderBottom: "1px solid #2C323E",
  },
  td: {
    padding: "14px 0",
    color: "#EDE9E1",
    borderBottom: "1px solid #1D2430",
    verticalAlign: "middle" as const,
  },
  badge: (status: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    background:
      status === "completed" ? "rgba(52,168,83,0.15)" :
      status === "pending"   ? "rgba(232,185,74,0.15)" :
      "rgba(224,85,85,0.15)",
    color:
      status === "completed" ? "#34A853" :
      status === "pending"   ? "#E8B94A" :
      "#E05555",
  }),
  badgeLabel: (status: string) =>
    status === "completed" ? "הושלם" :
    status === "pending"   ? "ממתין" :
    "בוטל",
  // Profile tab
  label: {
    display: "block",
    fontSize: 13,
    color: "#9E9990",
    marginBottom: 6,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    background: "#0D1219",
    border: "1px solid #2C323E",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#EDE9E1",
    fontSize: 14,
    fontFamily: "Assistant, sans-serif",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  } as React.CSSProperties,
  inputReadOnly: {
    width: "100%",
    background: "#0A0F18",
    border: "1px solid #1D2430",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#9E9990",
    fontSize: 14,
    fontFamily: "Assistant, sans-serif",
    outline: "none",
    boxSizing: "border-box" as const,
    cursor: "not-allowed",
  } as React.CSSProperties,
  saveBtn: {
    padding: "11px 28px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    color: "#080C14",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
    transition: "opacity 0.15s",
  } as React.CSSProperties,
  logoutBtn: {
    padding: "11px 28px",
    borderRadius: 8,
    border: "1px solid rgba(224,85,85,0.4)",
    background: "transparent",
    color: "#E05555",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
  } as React.CSSProperties,
  googleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 20,
    background: "#1D2430",
    border: "1px solid #2C323E",
    fontSize: 13,
    color: "#9E9990",
    fontWeight: 600,
  } as React.CSSProperties,
  infoMsg: {
    fontSize: 12,
    color: "#9E9990",
    marginTop: 4,
  },
  successMsg: {
    fontSize: 13,
    color: "#34A853",
    marginTop: 8,
  },
  errorMsg: {
    fontSize: 13,
    color: "#E05555",
    marginTop: 8,
  },
};

// ── Helper ────────────────────────────────────────────────────
function initials(name: string | null, email: string): string {
  if (name) return name.trim().charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

function formatHebDate(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

// ── Pending payment callout ───────────────────────────────────
// userId is public.users.id (NOT auth.users.id)
// purchases.user_id has a FK to public.users.id, so we must use the public ID
function PendingPaymentCallout({ pendingPurchases, userId }: { pendingPurchases: Purchase[]; userId: string }) {
  const router = useRouter();
  const [resumeLoading, setResumeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  if (pendingPurchases.length === 0) return null;

  // Show only the most recent pending purchase
  const latest = pendingPurchases[0];
  const extra  = pendingPurchases.length - 1;
  const productName = PRODUCT_LABELS[latest.product] ?? latest.product;

  async function handleResume() {
    setResumeLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: latest.product, user_id: userId }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) { window.location.href = url; return; }
      }
      alert("אירעה שגיאה. אנא נסה שוב או צור קשר בוואטסאפ");
    } catch {
      alert("אירעה שגיאה. אנא נסה שוב או צור קשר בוואטסאפ");
    }
    setResumeLoading(false);
  }

  async function handleCancel() {
    if (!window.confirm("לבטל את הרכישה? זה לא ניתן לביטול")) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/purchases/${latest.id}/cancel`, { method: "POST" });
      if (res.ok) {
        router.refresh();
        return;
      }
      alert("אירעה שגיאה בביטול. אנא צור קשר בוואטסאפ");
    } catch {
      alert("אירעה שגיאה בביטול. אנא צור קשר בוואטסאפ");
    }
    setCancelLoading(false);
  }

  return (
    <div style={{
      background: "rgba(232,185,74,0.08)",
      border: "1px solid rgba(232,185,74,0.4)",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    }}>
      {/* Top row: icon + title + subtitle */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <span style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "rgba(232,185,74,0.15)", border: "1px solid rgba(232,185,74,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#E8B94A" strokeWidth="1.5"/>
            <path d="M7 4v3.5" stroke="#E8B94A" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="7" cy="10" r="0.75" fill="#E8B94A"/>
          </svg>
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#EDE9E1", marginBottom: 4 }}>
            יש לך רכישה שממתינה לתשלום
          </div>
          <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.5 }}>
            התחלת לרכוש את {productName} אבל לא השלמת את התשלום. ההזמנה ממתינה לך.
          </div>
        </div>
      </div>

      {/* Middle row: amount + date */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: 14, borderTop: "1px solid rgba(232,185,74,0.2)", marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#9E9990", marginBottom: 3 }}>סכום לתשלום</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#E8B94A" }}>
            ₪{latest.amount.toLocaleString("he-IL")}
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "#9E9990", marginBottom: 3 }}>נפתח</div>
          <div style={{ fontSize: 13, color: "#EDE9E1" }}>{formatDate(latest.created_at)}</div>
        </div>
      </div>

      {/* Bottom row: buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleResume}
          disabled={resumeLoading || cancelLoading}
          style={{
            flex: 1, textAlign: "center",
            padding: "11px 0", borderRadius: 8, border: "none",
            background: resumeLoading ? "rgba(232,185,74,0.4)" : "linear-gradient(135deg,#E8B94A,#9E7C3A)",
            color: "#080C14", fontSize: 14, fontWeight: 800,
            fontFamily: "Assistant, sans-serif", cursor: resumeLoading ? "not-allowed" : "pointer",
            opacity: cancelLoading ? 0.5 : 1,
          }}
        >
          {resumeLoading ? "ממתין..." : "השלם תשלום"}
        </button>
        <button
          onClick={handleCancel}
          disabled={cancelLoading || resumeLoading}
          style={{
            padding: "11px 20px", borderRadius: 8,
            border: "1px solid #2C323E", background: "transparent",
            color: "#9E9990", fontSize: 14, fontWeight: 700,
            fontFamily: "Assistant, sans-serif",
            cursor: cancelLoading ? "not-allowed" : "pointer",
            opacity: resumeLoading ? 0.5 : 1,
          }}
        >
          {cancelLoading ? "מבטל..." : "בטל"}
        </button>
      </div>

      {/* Extra pending items note */}
      {extra > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#9E9990", textAlign: "center" }}>
          ויש עוד {extra} פעולות פתוחות
        </div>
      )}
    </div>
  );
}

// ── Quiz recommendation card (has result) ─────────────────────
function QuizRecommendationCard({ quizResult }: { quizResult: QuizResult }) {
  const { recommended_product: productId, match_percent, created_at, answers } = quizResult;
  const image   = PRODUCT_IMAGE[productId];
  const name    = QUIZ_PRODUCT_NAMES[productId] ?? productId;
  const href    = QUIZ_PRODUCT_HREF[productId] ?? "/quiz";
  const desc    = PRODUCT_DESC[productId];
  const meta    = PRODUCT_META[productId];
  const cta     = CTA_TEXT[productId] ?? "להתחיל עכשיו";

  // Convert DB answers map {q1:"A",...} to ordered Answer[] for getPersonalizedReasons
  const answersArray: Answer[] = ["q1","q2","q3","q4","q5","q6"].map(
    (k) => (answers[k] ?? "A") as Answer
  );
  const reasons = getPersonalizedReasons(answersArray, productId);

  return (
    <div style={S.card}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ ...S.sectionTitle, marginBottom: 0 }}>
          <span style={{ background: "linear-gradient(135deg,#E8B94A,#9E7C3A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            ההמלצה האישית שלך
          </span>
        </p>
        {match_percent != null && (
          <span style={{
            fontSize: 13, fontWeight: 700,
            background: "rgba(232,185,74,0.12)",
            color: "#E8B94A",
            border: "1px solid rgba(232,185,74,0.3)",
            borderRadius: 999,
            padding: "4px 12px",
          }}>
            {match_percent}% התאמה
          </span>
        )}
      </div>

      {/* Subtitle - date */}
      <p style={{ fontSize: 12, color: "#9E9990", marginTop: -8, marginBottom: 16 }}>
        לפי הקוויז שעשית - {formatHebDate(created_at)}
      </p>

      {/* Product image */}
      {image && (
        <div style={{ borderRadius: 10, overflow: "hidden", position: "relative", height: 160, marginBottom: 16 }}>
          <img
            src={image}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,18,25,0.92) 0%, rgba(13,18,25,0.3) 50%, transparent 100%)" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, padding: "12px 14px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#EDE9E1", lineHeight: 1.2, marginBottom: 4 }}>{name}</div>
            {meta && <div style={{ fontSize: 12, color: "#9E9990" }}>{meta}</div>}
          </div>
        </div>
      )}

      {/* Description */}
      {desc && (
        <p style={{ fontSize: 14, color: "#9E9990", lineHeight: 1.6, marginBottom: 14, marginTop: 0 }}>{desc}</p>
      )}

      {/* Personalized reasons */}
      {reasons.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {reasons.map((reason, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                background: "rgba(232,185,74,0.12)", border: "1px solid rgba(232,185,74,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
              }}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="#E8B94A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.6 }}>{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href={href}
          style={{
            padding: "11px 24px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg,#E8B94A,#9E7C3A)",
            color: "#080C14", fontSize: 14, fontWeight: 800,
            cursor: "pointer", fontFamily: "Assistant, sans-serif",
            textDecoration: "none", display: "inline-block",
          }}
        >
          {cta}
        </Link>
        <Link
          href="/quiz"
          style={{ fontSize: 12, color: "#9E9990", textDecoration: "none" }}
        >
          עשה את הקוויז שוב
        </Link>
      </div>
    </div>
  );
}

// ── Quiz CTA card (no result yet) ─────────────────────────────
function QuizCTACard() {
  return (
    <div style={S.card}>
      <p style={{ ...S.sectionTitle, marginBottom: 8 }}>עוד לא עשית את הקוויז שלנו</p>
      <p style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.6, marginTop: 0, marginBottom: 20 }}>
        3 דקות שיעזרו לנו להבין מה הכי מתאים לך - בלי התחייבות
      </p>
      <Link
        href="/quiz"
        style={{
          padding: "11px 24px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg,#E8B94A,#9E7C3A)",
          color: "#080C14", fontSize: 14, fontWeight: 800,
          cursor: "pointer", fontFamily: "Assistant, sans-serif",
          textDecoration: "none", display: "inline-block",
        }}
      >
        עשה את הקוויז
      </Link>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────
type Tab = "main" | "purchases" | "profile";

export default function AccountClient({ authUser, userData, completedPurchases, pendingPurchases, credit, isGoogleUser, quizResult }: Props) {
  const router  = useRouter();
  const supabase = createBrowserClient();

  const [tab, setTab]           = useState<Tab>("main");
  const [profName, setProfName] = useState(userData?.name ?? "");
  const [profPhone, setProfPhone] = useState(userData?.phone ?? "");
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwSent, setPwSent]     = useState(false);

  // Communication preferences section state
  const [profMarketingConsent, setProfMarketingConsent] = useState(userData?.marketing_consent ?? false);
  const [commSaving,    setCommSaving]    = useState(false);
  const [commSaved,     setCommSaved]     = useState(false);
  const [commErrMsg,    setCommErrMsg]    = useState<string | null>(null);
  const [commPhoneErr,  setCommPhoneErr]  = useState<string | null>(null);

  const commIsDirty =
    profPhone            !== (userData?.phone             ?? "") ||
    profMarketingConsent !== (userData?.marketing_consent ?? false);

  const displayName = userData?.name || authUser.email;

  // ── Link anonymous quiz results to this user (runs once per session) ──────
  // After login, any quiz results taken anonymously (identified by the anon_id
  // cookie set by middleware.ts) are linked to the now-known user_id.
  // Uses sessionStorage flag to avoid duplicate calls on re-renders / tab switches.
  // The anon_id cookie is httpOnly: false so it's readable from document.cookie.
  useEffect(() => {
    if (!userData?.id) return;
    if (sessionStorage.getItem("quiz_link_attempted")) return;

    const anonId = document.cookie
      .split("; ")
      .find((c) => c.startsWith("anon_id="))
      ?.split("=")[1];

    if (!anonId) return;

    sessionStorage.setItem("quiz_link_attempted", "1");

    const controller = new AbortController();

    fetch("/api/quiz-result", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymous_id: anonId, user_id: userData.id }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(() => {})
      .catch((err) => { if (err.name !== "AbortError" && process.env.NODE_ENV === "development") console.warn("Quiz link failed:", err); });

    return () => controller.abort();
  }, [userData?.id]);

  // Active content: all completed purchases that have a known CTA, oldest first
  type ContentItem = { label: string } & ContentCTA;
  const contentItems: ContentItem[] = [];
  const seen = new Set<string>();
  for (const p of [...completedPurchases].reverse()) {
    const cta = PRODUCT_CTA[p.product];
    if (cta && !seen.has(p.product)) {
      seen.add(p.product);
      contentItems.push({ label: PRODUCT_LABELS[p.product] ?? p.product, ...cta });
    }
  }

  const isHiveActive = userData?.hive_status === "active";
  const hiveTierInfo = HIVE_TIER_MAP[userData?.hive_tier ?? ""] ?? { label: "Starter", color: "#378ADD" };

  async function handleSaveProfile() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profName }),
      });
      if (res.ok) {
        setSaveMsg({ type: "ok", text: "הפרופיל עודכן בהצלחה" });
      } else {
        setSaveMsg({ type: "err", text: "שגיאה בשמירה. נסה שוב." });
      }
    } catch {
      setSaveMsg({ type: "err", text: "שגיאת רשת. נסה שוב." });
    }
    setSaving(false);
  }

  async function handleSaveCommPrefs() {
    // Validate phone format if provided
    if (profPhone) {
      const normalized = profPhone.replace(/[\s-]/g, "");
      if (!/^05\d{8}$/.test(normalized)) {
        setCommPhoneErr("מספר טלפון לא תקין");
        return;
      }
    }
    setCommPhoneErr(null);
    setCommSaving(true);
    setCommErrMsg(null);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: profPhone, marketing_consent: profMarketingConsent }),
      });
      if (res.ok) {
        setCommSaved(true);
        router.refresh();
        setTimeout(() => setCommSaved(false), 2000);
      } else {
        setCommErrMsg("אירעה שגיאה. אנא נסה שוב או צור קשר בוואטסאפ");
      }
    } catch {
      setCommErrMsg("אירעה שגיאה. אנא נסה שוב או צור קשר בוואטסאפ");
    }
    setCommSaving(false);
  }

  async function handleSendPasswordReset() {
    await supabase.auth.resetPasswordForEmail(authUser.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPwSent(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // ── ראשי ──────────────────────────────────────────────────
  const MainTab = (
    <>
      {/* User header */}
      <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={S.avatar}>{initials(userData?.name ?? null, authUser.email)}</div>
        <div>
          <p style={S.name}>{displayName}</p>
          <p style={S.email}>{authUser.email}</p>
        </div>
      </div>

      {/* Pending payment callout */}
      <PendingPaymentCallout pendingPurchases={pendingPurchases} userId={userData?.id ?? ""} />

      {/* Credit */}
      <div style={S.card}>
        <div style={S.creditBox}>
          <div>
            <div style={S.creditLabel}>קרדיט לרכישה הבאה</div>
            <div style={S.creditAmount}>
              {credit > 0 ? `₪${credit.toLocaleString("he-IL")}` : "אין קרדיט"}
            </div>
          </div>
          {credit > 0 && (
            <Link
              href="/account/redeem"
              style={{ ...S.enterBtn, fontSize: 12, padding: "7px 14px" }}
            >
              מימוש קרדיט
            </Link>
          )}
        </div>
      </div>

      {/* Quiz recommendation */}
      {quizResult ? (
        <QuizRecommendationCard quizResult={quizResult} />
      ) : (
        <QuizCTACard />
      )}

      {/* Content */}
      <div style={S.card}>
        <p style={S.sectionTitle}>התוכן שלי</p>

        {/* Regular content items */}
        {contentItems.length > 0 ? (
          contentItems.map((item) => (
            <div key={item.label} style={S.contentItem}>
              <div>
                <div style={S.contentLabel}>{item.label}</div>
                {item.ctaType === "enter" && (
                  <div style={S.progressWrap}><div style={S.progressBar} /></div>
                )}
              </div>
              {item.ctaType === "enter" ? (
                <Link href={item.ctaHref} style={S.enterBtn}>כנס</Link>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 20,
                    background: "rgba(201,150,74,0.12)",
                    border: "1px solid rgba(201,150,74,0.25)",
                    color: "#C9964A",
                    whiteSpace: "nowrap",
                  }}>
                    {item.badge}
                  </span>
                  <Link
                    href={item.ctaHref}
                    target={item.ctaType === "whatsapp" ? "_blank" : undefined}
                    rel={item.ctaType === "whatsapp" ? "noopener noreferrer" : undefined}
                    style={{ ...S.enterBtn, background: "transparent", border: "1px solid #2C323E", color: "#E8B94A", fontSize: 12 }}
                  >
                    {item.ctaLabel}
                  </Link>
                </div>
              )}
            </div>
          ))
        ) : !isHiveActive ? (
          <>
            <p style={{ fontSize: 13, color: "#9E9990", marginTop: 0, marginBottom: 16 }}>
              עדיין אין לך גישה לתוכן. בחר מסלול:
            </p>
            {RECOMMENDED.map((r) => (
              <div key={r.href} style={{ ...S.contentItem, justifyContent: "space-between" }}>
                <span style={S.contentLabel}>{r.label}</span>
                <Link href={r.href} style={{ ...S.enterBtn, background: "transparent", border: "1px solid #2C323E", color: "#E8B94A" }}>
                  פרטים
                </Link>
              </div>
            ))}
          </>
        ) : null}

        {/* Hive membership card — shown last */}
        {isHiveActive && (
          <div style={{
            ...S.contentItem,
            background: `${hiveTierInfo.color}0D`,
            border: `1px solid ${hiveTierInfo.color}33`,
            borderRadius: 10,
            marginBottom: 0,
          }}>
            {/* info first in DOM = RIGHT in RTL; button last = LEFT */}
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", marginBottom: 4 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 20,
                  background: `${hiveTierInfo.color}1A`,
                  border: `1px solid ${hiveTierInfo.color}44`,
                  color: hiveTierInfo.color,
                }}>
                  {hiveTierInfo.label}
                </span>
                <span style={{ ...S.contentLabel }}>הכוורת</span>
              </div>
              {userData?.hive_next_billing_date && (
                <div style={{ fontSize: 12, color: "#9E9990", textAlign: "right" }}>
                  חידוש: {formatDate(userData.hive_next_billing_date)}
                </div>
              )}
            </div>
            <Link href="/hive/members" style={S.enterBtn}>כנס</Link>
          </div>
        )}
      </div>
    </>
  );

  // ── רכישות ────────────────────────────────────────────────
  const PurchasesTab = (
    <div style={S.card}>
      <p style={{ ...S.sectionTitle, marginBottom: 4 }}>הרכישות שלי</p>
      <p style={{ fontSize: 12, color: "#9E9990", marginTop: 0, marginBottom: 20 }}>המוצרים שרכשת בהצלחה</p>

      {completedPurchases.length === 0 ? (
        /* ── Empty state ── */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 8px", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", marginBottom: 16,
            background: "rgba(232,185,74,0.08)", border: "1px solid rgba(232,185,74,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 7h18l-2 12H7L5 7z" stroke="#E8B94A" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 4h3.5l.5 3" stroke="#E8B94A" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="23" r="1.5" fill="#E8B94A"/>
              <circle cx="18" cy="23" r="1.5" fill="#E8B94A"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1", margin: "0 0 8px" }}>
            עדיין לא רכשת כלום
          </p>
          <p style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.6, maxWidth: 280, margin: "0 0 24px" }}>
            כשתרכשי מסלול - אתגר, סדנה, קורס או הכוורת - הוא יופיע כאן ותקבלי גישה לתוכן.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
            <Link
              href="/"
              style={{
                display: "block", textAlign: "center", textDecoration: "none",
                padding: "11px 0", borderRadius: 8,
                background: "linear-gradient(135deg,#E8B94A,#9E7C3A)",
                color: "#080C14", fontSize: 14, fontWeight: 800,
                fontFamily: "Assistant, sans-serif",
              }}
            >
              גלה את המסלולים שלי
            </Link>
            <Link
              href="/quiz"
              style={{
                display: "block", textAlign: "center", textDecoration: "none",
                padding: "11px 0", borderRadius: 8,
                border: "1px solid #2C323E", background: "transparent",
                color: "#E8B94A", fontSize: 14, fontWeight: 700,
                fontFamily: "Assistant, sans-serif",
              }}
            >
              עשה את הקוויז שלנו
            </Link>
          </div>
        </div>
      ) : (
        /* ── Purchase cards ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {completedPurchases.map((p) => {
            const contentRoute = getContentRoute(p.product);
            return (
              <div
                key={p.id}
                style={{
                  background: "rgba(232,185,74,0.04)",
                  border: "1px solid rgba(232,185,74,0.15)",
                  borderRadius: 8,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* Info - right side in RTL */}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE9E1", marginBottom: 4 }}>
                    {PRODUCT_LABELS[p.product] ?? p.product}
                  </div>
                  <div style={{ fontSize: 12, color: "#9E9990" }}>
                    {formatDate(p.created_at)} · ₪{p.amount.toLocaleString("he-IL")}
                  </div>
                </div>

                {/* Action - left side */}
                {contentRoute ? (
                  <Link
                    href={contentRoute}
                    style={{
                      flexShrink: 0, textDecoration: "none",
                      padding: "7px 14px", borderRadius: 7,
                      background: "linear-gradient(135deg,#E8B94A,#9E7C3A)",
                      color: "#080C14", fontSize: 13, fontWeight: 800,
                      fontFamily: "Assistant, sans-serif", whiteSpace: "nowrap",
                    }}
                  >
                    גש לתוכן ←
                  </Link>
                ) : (
                  <span style={{
                    flexShrink: 0,
                    padding: "5px 12px", borderRadius: 20,
                    background: "rgba(158,153,144,0.1)", border: "1px solid rgba(158,153,144,0.2)",
                    color: "#9E9990", fontSize: 12, fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}>
                    {getCompletedBadge(p.product)}
                  </span>
                )}
              </div>
            );
          })}

          {credit > 0 && (
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #2C323E", fontSize: 13 }}>
              <span style={{ color: "#9E9990" }}>סה"כ קרדיט זמין: </span>
              <span style={{ fontWeight: 800, color: "#E8B94A" }}>₪{credit.toLocaleString("he-IL")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── פרופיל ────────────────────────────────────────────────
  const ProfileTab = (
    <>
      <div style={S.card}>
        <p style={S.sectionTitle}>פרטים אישיים</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>שם מלא</label>
            <input
              type="text"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
              style={S.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
          </div>
          <div>
            <label style={S.label}>אימייל</label>
            <input type="email" value={authUser.email} readOnly style={S.inputReadOnly} />
            <p style={S.infoMsg}>לשינוי אימייל פנה לתמיכה.</p>
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "שומר..." : "שמור שינויים"}
          </button>
          {saveMsg && (
            <span style={saveMsg.type === "ok" ? S.successMsg : S.errorMsg}>
              {saveMsg.text}
            </span>
          )}
        </div>
      </div>

      {/* Communication Preferences */}
      <div style={S.card}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 14, color: "#9E9990", letterSpacing: "0.05em", fontWeight: 600, whiteSpace: "nowrap" }}>
            העדפות תקשורת
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.2)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Phone field */}
          <div>
            <label style={S.label}>טלפון נייד</label>
            <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 6px", lineHeight: 1.4 }}>
              נשתמש בו לעדכונים בוואטסאפ ותזכורות
            </p>
            <input
              type="tel"
              value={profPhone}
              onChange={(e) => { setProfPhone(e.target.value); setCommPhoneErr(null); }}
              placeholder="0501234567"
              dir="ltr"
              style={S.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
            {commPhoneErr && (
              <p style={{ fontSize: 12, color: "#E05555", marginTop: 4 }}>{commPhoneErr}</p>
            )}
          </div>

          {/* Marketing consent toggle */}
          <div>
            <div
              onClick={() => setProfMarketingConsent((v) => !v)}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
            >
              {/* Toggle track */}
              <div
                role="switch"
                aria-checked={profMarketingConsent}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setProfMarketingConsent((v) => !v); } }}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginTop: 1,
                  background: profMarketingConsent
                    ? "linear-gradient(135deg, #E8B94A, #9E7C3A)"
                    : "#2C323E",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  outline: "none",
                }}
              >
                <span style={{
                  position: "absolute",
                  top: 3,
                  left: profMarketingConsent ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </div>
              {/* Label */}
              <div>
                <div style={{ fontSize: 14, color: "#EDE9E1", fontWeight: 600, lineHeight: 1.4 }}>
                  קבלת עדכונים שיווקיים
                </div>
                <div style={{ fontSize: 12, color: "#9E9990", marginTop: 4, lineHeight: 1.5 }}>
                  מבצעים, תכנים חדשים, וטיפים שיווקיים. ניתן לבטל בכל עת.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          {commSaved ? (
            <span style={{ fontSize: 14, color: "#34A853", fontWeight: 700 }}>נשמר ✓</span>
          ) : (
            <button
              onClick={handleSaveCommPrefs}
              disabled={!commIsDirty || commSaving}
              style={{
                ...S.saveBtn,
                opacity: (!commIsDirty || commSaving) ? 0.4 : 1,
                cursor: (!commIsDirty || commSaving) ? "not-allowed" : "pointer",
              }}
            >
              {commSaving ? "שומר..." : "שמור שינויים"}
            </button>
          )}
          {commErrMsg && (
            <span style={S.errorMsg}>{commErrMsg}</span>
          )}
        </div>
      </div>

      <div style={S.card}>
        <p style={S.sectionTitle}>אבטחה</p>
        {isGoogleUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={S.googleBadge}>
              <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Google
            </span>
            <span style={{ fontSize: 13, color: "#9E9990" }}>הכניסה מנוהלת דרך Google</span>
          </div>
        ) : (
          <div>
            {pwSent ? (
              <p style={{ ...S.successMsg, marginTop: 0 }}>
                קישור לאיפוס סיסמה נשלח לאימייל שלך.
              </p>
            ) : (
              <button
                onClick={handleSendPasswordReset}
                style={{ background: "none", border: "1px solid #2C323E", borderRadius: 8, padding: "9px 18px", color: "#EDE9E1", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Assistant, sans-serif" }}
              >
                שנה סיסמה
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ ...S.card, display: "flex", justifyContent: "flex-start" }}>
        <button onClick={handleLogout} style={S.logoutBtn}>
          התנתקות
        </button>
      </div>
    </>
  );

  return (
    <div style={S.page} lang="he">
      <div style={S.container}>
        <div style={S.tabs}>
          {(["main", "purchases", "profile"] as Tab[]).map((t) => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
              {t === "main" ? "ראשי" : t === "purchases" ? "רכישות" : "פרופיל"}
            </button>
          ))}
        </div>

        {tab === "main"      && MainTab}
        {tab === "purchases" && PurchasesTab}
        {tab === "profile"   && ProfileTab}
      </div>
    </div>
  );
}
