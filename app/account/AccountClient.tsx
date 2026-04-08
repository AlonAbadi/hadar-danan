"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser";

// ── Types ─────────────────────────────────────────────────────
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
}

interface Props {
  authUser: { id: string; email: string };
  userData: UserData | null;
  purchases: Purchase[];
  credit: number;
  isGoogleUser: boolean;
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
};

const RECOMMENDED = [
  { label: "אתגר 7 ימים - ₪197",          href: "/challenge" },
  { label: "סדנה יום אחד - ₪1,080",        href: "/workshop" },
  { label: "קורס דיגיטלי - ₪1,800",       href: "/course" },
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

// ── Component ─────────────────────────────────────────────────
type Tab = "main" | "purchases" | "profile";

export default function AccountClient({ authUser, userData, purchases, credit, isGoogleUser }: Props) {
  const router  = useRouter();
  const supabase = createBrowserClient();

  const [tab, setTab]           = useState<Tab>("main");
  const [profName, setProfName] = useState(userData?.name ?? "");
  const [profPhone, setProfPhone] = useState(userData?.phone ?? "");
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwSent, setPwSent]     = useState(false);

  const displayName = userData?.name || authUser.email;

  // Active content: completed purchases that have a content URL, oldest first
  const contentItems: { label: string; href: string }[] = [];
  const seen = new Set<string>();
  for (const p of [...purchases].reverse()) {
    if (p.status === "completed" && CONTENT_LINKS[p.product] && !seen.has(p.product)) {
      seen.add(p.product);
      contentItems.push({ label: PRODUCT_LABELS[p.product] ?? p.product, href: CONTENT_LINKS[p.product] });
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
        body: JSON.stringify({ name: profName, phone: profPhone }),
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
              מימש קרדיט
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={S.card}>
        <p style={S.sectionTitle}>התוכן שלי</p>

        {/* Regular content items */}
        {contentItems.length > 0 ? (
          contentItems.map((item) => (
            <div key={item.href} style={S.contentItem}>
              <div>
                <div style={S.contentLabel}>{item.label}</div>
                <div style={S.progressWrap}>
                  <div style={S.progressBar} />
                </div>
              </div>
              <Link href={item.href} style={S.enterBtn}>כנס</Link>
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
      <p style={S.sectionTitle}>היסטוריית רכישות</p>
      {purchases.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9E9990", margin: 0 }}>לא נמצאו רכישות.</p>
      ) : (
        <>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>מוצר</th>
                <th style={{ ...S.th, textAlign: "center" }}>סכום</th>
                <th style={{ ...S.th, textAlign: "center" }}>סטטוס</th>
                <th style={{ ...S.th, textAlign: "left" }}>תאריך</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td style={S.td}>{PRODUCT_LABELS[p.product] ?? p.product}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    ₪{p.amount.toLocaleString("he-IL")}
                  </td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    <span style={S.badge(p.status)}>{S.badgeLabel(p.status)}</span>
                  </td>
                  <td style={{ ...S.td, textAlign: "left", color: "#9E9990", fontSize: 13 }}>
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {credit > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #2C323E", fontSize: 13 }}>
              <span style={{ color: "#9E9990" }}>סה"כ קרדיט זמין: </span>
              <span style={{ fontWeight: 800, color: "#E8B94A" }}>₪{credit.toLocaleString("he-IL")}</span>
            </div>
          )}
        </>
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
          <div>
            <label style={S.label}>טלפון</label>
            <input
              type="tel"
              value={profPhone}
              onChange={(e) => setProfPhone(e.target.value)}
              placeholder="05X-XXXXXXX"
              dir="ltr"
              style={S.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
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
