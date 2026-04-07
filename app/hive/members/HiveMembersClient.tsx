"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { HiveContent } from "./page";

// ── Tier config ────────────────────────────────────────────
const TIER_MAP: Record<string, { label: string; color: string; price: number; rank: number }> = {
  discounted_29: { label: "Starter", color: "#378ADD", price: 29,  rank: 0 },
  basic_97:      { label: "Pro",     color: "#E8B94A", price: 97,  rank: 1 },
  elite:         { label: "Elite",   color: "#7F77DD", price: 197, rank: 2 },
};

const TIER_ORDER = ["starter", "pro", "elite"];

function tierRank(tier: string | null): number {
  return TIER_MAP[tier ?? ""]?.rank ?? 0;
}

function tierLabel(tier: string | null): string {
  return TIER_MAP[tier ?? ""]?.label ?? "Starter";
}

function tierColor(tier: string | null): string {
  return TIER_MAP[tier ?? ""]?.color ?? "#378ADD";
}

function tierPrice(tier: string | null): number {
  return TIER_MAP[tier ?? ""]?.price ?? 29;
}

function isContentLocked(content: HiveContent, userTier: string | null): boolean {
  const contentRank = TIER_ORDER.indexOf(content.tier_required);
  const userRankVal = tierRank(userTier);
  return contentRank > userRankVal;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "לא ידוע";
  return new Date(dateStr).toLocaleDateString("he-IL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Props ──────────────────────────────────────────────────
interface Props {
  userEmail: string;
  userName: string | null;
  hiveTier: string | null;
  hiveNextBilling: string | null;
  hiveStartedAt: string | null;
  credit: number;
  hiveContent: HiveContent[];
  whatsappUrl: string | null;
  zoomNextDate: string | null;
}

// ── Content type label ─────────────────────────────────────
function contentTypeLabel(type: string): string {
  if (type === "pdf")   return "PDF";
  if (type === "video") return "וידאו";
  return "מאמר";
}

export default function HiveMembersClient({
  userEmail,
  userName,
  hiveTier,
  hiveNextBilling,
  hiveStartedAt,
  credit,
  hiveContent,
  whatsappUrl,
  zoomNextDate,
}: Props) {
  const router = useRouter();
  const [tab, setTab]           = useState<"home" | "content" | "community" | "account">("home");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const color  = tierColor(hiveTier);
  const label  = tierLabel(hiveTier);
  const price  = tierPrice(hiveTier);
  const latest = hiveContent[0] ?? null;

  // ── Cancel handler ─────────────────────────────────────
  async function handleCancel() {
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch("/api/hive/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "שגיאה בביטול המנוי");
      }
      setCancelDone(true);
      setTimeout(() => router.push("/hive"), 2500);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "שגיאה בביטול המנוי");
    } finally {
      setCancelling(false);
    }
  }

  // ── Shared styles ──────────────────────────────────────
  const card: React.CSSProperties = {
    background: "#141820",
    border: "1px solid #2C323E",
    borderRadius: 12,
    padding: "20px 20px",
    marginBottom: 16,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: "#9E9990",
    textAlign: "right",
    marginBottom: 12,
    marginTop: 4,
  };

  const goldBtn: React.CSSProperties = {
    padding: "11px 20px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    color: "#080C14",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
    width: "100%",
  };

  const ghostBtn: React.CSSProperties = {
    padding: "11px 20px",
    borderRadius: 8,
    border: "1px solid #2C323E",
    background: "transparent",
    color: "#EDE9E1",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
    width: "100%",
  };

  // ── TAB: בית ─────────────────────────────────────────
  const TabHome = () => (
    <>
      {/* Hive header card */}
      <div style={{ ...card, textAlign: "center", padding: "28px 20px" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: `${color}22`,
          border: `2px solid ${color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          fontSize: 24,
        }}>
          <span dir="ltr">H</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#EDE9E1", marginBottom: 6 }}>
          הכוורת
        </div>
        <span style={{
          display: "inline-block",
          padding: "4px 14px", borderRadius: 20,
          background: `${color}1A`,
          border: `1px solid ${color}55`,
          color, fontSize: 13, fontWeight: 700,
        }}>
          {label}
        </span>
        {userName && (
          <div style={{ fontSize: 14, color: "#9E9990", marginTop: 10 }}>
            שלום, {userName}
          </div>
        )}
      </div>

      {/* Latest content */}
      <div style={sectionTitle}>השבוע בכוורת</div>
      {latest ? (
        <div style={{ ...card, cursor: "pointer" }} onClick={() => setTab("content")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{
              fontSize: 11, color: "#9E9990",
              padding: "2px 8px", borderRadius: 10,
              background: "#1D2430",
            }}>
              {contentTypeLabel(latest.content_type)}
            </span>
            <div style={{ textAlign: "right", flex: 1, marginRight: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1", marginBottom: 4 }}>
                {latest.title}
              </div>
              {latest.body && (
                <div style={{
                  fontSize: 13, color: "#9E9990", lineHeight: 1.6,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                }}>
                  {latest.body}
                </div>
              )}
              <div style={{ fontSize: 11, color: "#4A5060", marginTop: 6 }}>
                {fmtDate(latest.created_at)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...card, textAlign: "center", padding: "28px 20px" }}>
          <div style={{ fontSize: 14, color: "#9E9990" }}>תוכן חדש יתווסף בקרוב</div>
        </div>
      )}

      {/* Quick access */}
      <div style={sectionTitle}>גישה מהירה</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
            flex: 1, padding: "11px 16px", borderRadius: 8, border: "none",
            background: "#25D366", color: "#fff",
            fontSize: 14, fontWeight: 800,
            cursor: "pointer", fontFamily: "Assistant, sans-serif",
            textDecoration: "none", textAlign: "center",
            display: "block",
          }}>
            קבוצת WhatsApp
          </a>
        ) : (
          <button style={{ ...ghostBtn, flex: 1, opacity: 0.5, cursor: "not-allowed" }} disabled>
            קבוצת WhatsApp
          </button>
        )}
        <button
          onClick={() => setTab("community")}
          style={{ ...ghostBtn, flex: 1 }}
        >
          Zoom הבא
        </button>
      </div>

      {/* Billing row */}
      <div style={{
        ...card,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#E8B94A" }}>
          {price} &#8362;/חודש
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#9E9990" }}>חידוש הבא</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#EDE9E1" }}>
            {fmtDate(hiveNextBilling)}
          </div>
        </div>
      </div>
    </>
  );

  // ── TAB: תוכן ─────────────────────────────────────────
  const TabContent = () => (
    <>
      <div style={sectionTitle}>תוכן הכוורת</div>
      {hiveContent.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 15, color: "#9E9990" }}>תוכן חדש יתווסף בקרוב</div>
        </div>
      ) : (
        hiveContent.map((item) => {
          const locked = isContentLocked(item, hiveTier);
          return (
            <div key={item.id} style={{
              ...card,
              opacity: locked ? 0.7 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  {locked ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 10,
                      background: "rgba(127,119,221,0.12)", color: "#7F77DD",
                    }}>
                      {item.tier_required === "pro" ? "Pro" : "Elite"} בלבד
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11, color: "#9E9990",
                      padding: "2px 8px", borderRadius: 10,
                      background: "#1D2430",
                    }}>
                      {contentTypeLabel(item.content_type)}
                    </span>
                  )}
                  <div style={{ fontSize: 11, color: "#4A5060" }}>{fmtDate(item.created_at)}</div>
                </div>
                <div style={{ textAlign: "right", flex: 1, marginRight: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1", marginBottom: 6 }}>
                    {item.title}
                  </div>
                  {item.body && !locked && (
                    <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.6, marginBottom: 10 }}>
                      {item.body}
                    </div>
                  )}
                  {locked ? (
                    <button
                      onClick={() => { setTab("account"); setShowUpgrade(true); }}
                      style={{
                        padding: "7px 16px", borderRadius: 8, border: "none",
                        background: "rgba(127,119,221,0.15)",
                        color: "#7F77DD", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "Assistant, sans-serif",
                        marginTop: 8,
                      }}
                    >
                      שדרג לגישה
                    </button>
                  ) : item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-block", padding: "7px 16px", borderRadius: 8,
                      background: "rgba(201,150,74,0.12)",
                      color: "#E8B94A", fontSize: 13, fontWeight: 700,
                      textDecoration: "none", marginTop: 8,
                    }}>
                      קרא עוד
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );

  // ── TAB: קהילה ────────────────────────────────────────
  const TabCommunity = () => (
    <>
      <div style={sectionTitle}>ערוצי קהילה</div>

      {/* WhatsApp */}
      <div style={{ ...card }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1", marginBottom: 6, textAlign: "right" }}>
          קבוצת WhatsApp
        </div>
        <div style={{ fontSize: 13, color: "#9E9990", textAlign: "right", marginBottom: 14 }}>
          קבוצה פרטית לחברי הכוורת - שאלות, שיתופים ותמיכה הדדית
        </div>
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
            display: "block", padding: "11px 20px", borderRadius: 8, border: "none",
            background: "#25D366", color: "#fff",
            fontSize: 14, fontWeight: 800,
            textDecoration: "none", textAlign: "center",
            fontFamily: "Assistant, sans-serif",
          }}>
            הצטרף לקבוצה
          </a>
        ) : (
          <div style={{ padding: "11px 20px", borderRadius: 8, background: "#1D2430", textAlign: "center", fontSize: 14, color: "#4A5060" }}>
            הקישור יעודכן בקרוב
          </div>
        )}
      </div>

      {/* Zoom */}
      <div style={sectionTitle}>מפגשי Zoom חודשיים</div>
      <div style={{ ...card }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1", marginBottom: 4, textAlign: "right" }}>
          מפגש חודשי קרוב
        </div>
        {zoomNextDate ? (
          <>
            <div style={{ fontSize: 14, color: "#C9964A", fontWeight: 700, textAlign: "right", marginBottom: 12 }}>
              {zoomNextDate}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#9E9990", textAlign: "right", marginBottom: 12 }}>
            התאריך יפורסם בקבוצת WhatsApp
          </div>
        )}
        <button style={{ ...ghostBtn }}>
          הצטרף ל-Zoom
        </button>
      </div>

      {/* Resources */}
      <div style={sectionTitle}>משאבים</div>
      {[
        "מדריך: בניית מסר שיווקי",
        "תבנית: תוכן חודשי",
        "צ'קליסט: שיחת מכירה",
      ].map((title) => (
        <div key={title} style={{
          ...card, padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{
            fontSize: 12, color: "#9E9990",
            padding: "2px 8px", borderRadius: 10, background: "#1D2430",
          }}>
            PDF
          </span>
          <div style={{ textAlign: "right", flex: 1, marginRight: 12, fontSize: 14, fontWeight: 700, color: "#EDE9E1" }}>
            {title}
          </div>
        </div>
      ))}
      <div style={{ textAlign: "center", fontSize: 13, color: "#4A5060", marginTop: 4 }}>
        קבצים נוספים יועלו בקרוב
      </div>
    </>
  );

  // ── TAB: חשבון ────────────────────────────────────────
  const TabAccount = () => (
    <>
      {/* Tier card */}
      <div style={{
        ...card,
        background: `linear-gradient(145deg, ${color}18, #141820)`,
        border: `1px solid ${color}33`,
        textAlign: "center", padding: "24px 20px",
      }}>
        <div style={{ fontSize: 13, color: "#9E9990", marginBottom: 6 }}>המנוי שלך</div>
        <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#EDE9E1" }}>
          {price} &#8362;/חודש
        </div>
      </div>

      {/* Billing details */}
      <div style={sectionTitle}>פרטי חיוב</div>
      <div style={{ ...card }}>
        {[
          { label: "חידוש הבא",   value: fmtDate(hiveNextBilling) },
          { label: "חבר מאז",     value: fmtDate(hiveStartedAt) },
          { label: "סכום חיוב",   value: `${price} ₪` },
        ].map(({ label: lbl, value }) => (
          <div key={lbl} style={{
            display: "flex", justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid #1D2430",
          }}>
            <div style={{ fontSize: 14, color: "#EDE9E1", fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 13, color: "#9E9990" }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Credit */}
      <div style={sectionTitle}>קרדיט שנצבר</div>
      <div style={{
        ...card,
        background: "rgba(232,185,74,0.06)",
        border: "1px solid rgba(232,185,74,0.2)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px",
      }}>
        <div style={{
          fontSize: 28, fontWeight: 800,
          background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          {credit.toLocaleString("he-IL")} &#8362;
        </div>
        <div style={{ fontSize: 13, color: "#9E9990", textAlign: "right" }}>
          סה"כ השקעה<br />בתכנים
        </div>
      </div>

      {/* Upgrade */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setShowUpgrade(!showUpgrade)} style={goldBtn}>
          שדרג מנוי
        </button>
      </div>

      {showUpgrade && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#EDE9E1", textAlign: "right", marginBottom: 14 }}>
            בחר רמת מנוי
          </div>
          {Object.entries(TIER_MAP)
            .filter(([key]) => TIER_MAP[key].rank > tierRank(hiveTier))
            .map(([key, tier]) => (
              <div key={key} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0", borderBottom: "1px solid #1D2430",
              }}>
                <a
                  href={whatsappUrl ?? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "972539566961"}?text=${encodeURIComponent(`שלום, אני חבר הכוורת ורוצה לשדרג ל-${tier.label}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none",
                    background: `${tier.color}1A`,
                    color: tier.color, fontSize: 13, fontWeight: 700,
                    textDecoration: "none", cursor: "pointer",
                  }}
                >
                  שדרג
                </a>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: tier.color }}>{tier.label}</div>
                  <div style={{ fontSize: 13, color: "#9E9990" }}>{tier.price} ₪/חודש</div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Cancel */}
      <button
        onClick={() => setShowCancel(true)}
        style={{
          ...ghostBtn,
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#EF4444",
        }}
      >
        בטל מנוי
      </button>
    </>
  );

  // ── Cancel modal ───────────────────────────────────────
  const CancelModal = () => (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#141820", border: "1px solid #2C323E",
        borderRadius: 16, padding: "28px 24px",
        maxWidth: 400, width: "100%", textAlign: "right",
      }}>
        {cancelDone ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#34A853", marginBottom: 8 }}>
              המנוי בוטל
            </div>
            <div style={{ fontSize: 13, color: "#9E9990" }}>
              הגישה שלך נשמרת עד תאריך החיוב הבא. מעביר...
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#EDE9E1", marginBottom: 8 }}>
              לבטל את המנוי?
            </div>
            <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.7, marginBottom: 20 }}>
              הגישה שלך לתכני הכוורת תישמר עד לתאריך החיוב הבא ({fmtDate(hiveNextBilling)}).
              לאחר מכן המנוי יפוג.
            </div>
            {cancelError && (
              <div style={{
                fontSize: 13, color: "#EF4444",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16, textAlign: "right",
              }}>
                {cancelError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#EF4444", fontSize: 14, fontWeight: 700,
                  cursor: cancelling ? "not-allowed" : "pointer",
                  fontFamily: "Assistant, sans-serif",
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? "מבטל..." : "כן, בטל מנוי"}
              </button>
              <button
                onClick={() => { setShowCancel(false); setCancelError(""); }}
                disabled={cancelling}
                style={{ flex: 1, ...ghostBtn }}
              >
                חזרה
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────
  const TABS = [
    { key: "home",      label: "בית" },
    { key: "content",   label: "תוכן" },
    { key: "community", label: "קהילה" },
    { key: "account",   label: "חשבון" },
  ] as const;

  return (
    <div dir="rtl" lang="he" style={{
      minHeight: "100vh",
      background: "#080C14",
      color: "#EDE9E1",
      fontFamily: "Assistant, sans-serif",
      padding: "32px 16px 64px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Back link */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/account" style={{ fontSize: 13, color: "#9E9990", textDecoration: "none", fontWeight: 700 }}>
            חזור לחשבון שלי
          </Link>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 24,
          background: "#141820", border: "1px solid #2C323E",
          borderRadius: 10, padding: 4,
        }}>
          {TABS.map(({ key, label: lbl }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                background: tab === key ? "linear-gradient(135deg, #E8B94A, #9E7C3A)" : "transparent",
                color: tab === key ? "#080C14" : "#9E9990",
                fontSize: 13, fontWeight: tab === key ? 800 : 600,
                cursor: "pointer", fontFamily: "Assistant, sans-serif",
                transition: "all 0.15s",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "home"      && <TabHome />}
        {tab === "content"   && <TabContent />}
        {tab === "community" && <TabCommunity />}
        {tab === "account"   && <TabAccount />}

      </div>

      {showCancel && <CancelModal />}
    </div>
  );
}
