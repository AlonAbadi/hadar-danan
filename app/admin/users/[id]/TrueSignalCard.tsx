"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type ProductKey = "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000";
type Recommendation = "yes" | "maybe_later" | "no";

type ProductMatch = {
  product_key: ProductKey;
  match_pct: number;
  recommendation: Recommendation;
  reason: string;
};

type DiagnosisResponse = {
  synthesis: string;
  product_matches: ProductMatch[];
  suggested_whatsapp: string;
};

const PRODUCT_NAMES: Record<ProductKey, string> = {
  challenge_197:  "צ׳אלנג׳ 7 הימים",
  workshop_1080:  "סדנה יום אחד",
  course_1800:    "קורס דיגיטלי",
  strategy_4000:  "פגישת אסטרטגיה",
  premium_14000:  "יום צילום פרמיום",
};

const REC_STYLE: Record<Recommendation, { color: string; bg: string; border: string; icon: string }> = {
  yes:        { color: "#4ade80", bg: "linear-gradient(90deg, rgba(74,222,128,0.05), transparent)", border: "rgba(74,222,128,0.3)", icon: "✓" },
  maybe_later:{ color: "#fbbf24", bg: "transparent", border: "transparent", icon: "~" },
  no:         { color: "#f87171", bg: "transparent", border: "transparent", icon: "✗" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBasicAuth(): string {
  // Read from meta tags injected by the admin middleware, or fall back to
  // prompting the browser. The admin pages are already behind Basic Auth so
  // the browser will have sent the credentials — we just forward them.
  // In practice, the browser stores the credentials and re-sends them, but
  // we need to pass them explicitly from JS. We stash them on window if the
  // admin layout provides them; otherwise we rely on the cookie-less approach
  // of asking the user once via sessionStorage.
  const stored =
    typeof window !== "undefined"
      ? (window as typeof window & { __adminAuth?: string }).__adminAuth
      : undefined;
  return stored ?? "";
}

// ── Component ────────────────────────────────────────────────────────────────

export function TrueSignalCard({ userId }: { userId: string }) {
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [copied,    setCopied]    = useState(false);

  async function run() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/truesignal-diagnosis", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": getBasicAuth(),
        },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });

      if (res.status === 401) {
        // Prompt for credentials if the browser didn't forward them
        const user = prompt("שם משתמש:");
        const pass = prompt("סיסמה:");
        if (user && pass) {
          const auth = "Basic " + btoa(`${user}:${pass}`);
          if (typeof window !== "undefined") {
            (window as typeof window & { __adminAuth?: string }).__adminAuth = auth;
          }
          setLoading(false);
          run();
          return;
        }
        throw new Error("נדרשת הרשאת מנהל");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה לא ידועה");
      setDiagnosis(data as DiagnosisResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  }

  async function copyWhatsApp() {
    if (!diagnosis) return;
    await navigator.clipboard.writeText(diagnosis.suggested_whatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Initial state ──────────────────────────────────────────────────────────
  if (!diagnosis && !loading && !error) {
    return (
      <div dir="rtl" style={{
        background: "#141820", border: "1px solid #252b38",
        borderRadius: 14, padding: "24px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
            }}>
              ✦
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E8B94A" }}>
                תיק אבחון <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
              </div>
              <div style={{ fontSize: 12, color: "#9E9990", marginTop: 2 }}>
                ניתוח AI של הליד - synthesis, התאמת מוצר, פתיחת שיחה
              </div>
            </div>
          </div>
          <button
            onClick={run}
            style={{
              background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
              color: "#080C14", border: "none", borderRadius: 8,
              padding: "9px 20px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            הפעל אבחון
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div dir="rtl" style={{
        background: "#141820", border: "1px solid #252b38",
        borderRadius: 14, padding: "24px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "2px solid #E8B94A", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite", flexShrink: 0,
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 14, color: "#9E9990" }}>מנתח נתונים...</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div dir="rtl" style={{
        background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.25)",
        borderRadius: 14, padding: "20px 24px", marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>
          שגיאה בהפעלת האבחון
        </div>
        <div style={{ fontSize: 12, color: "#9E9990", marginBottom: 14 }}>{error}</div>
        <button
          onClick={run}
          style={{
            background: "rgba(248,113,113,0.1)", color: "#f87171",
            border: "1px solid rgba(248,113,113,0.3)", borderRadius: 7,
            padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          נסה שוב
        </button>
      </div>
    );
  }

  // ── Results state ──────────────────────────────────────────────────────────
  if (!diagnosis) return null;

  return (
    <div dir="rtl" style={{
      background: "#141820", border: "1px solid #252b38",
      borderRadius: 14, padding: "24px", marginBottom: 16,
      display: "flex", flexDirection: "column", gap: 24,
    }}>

      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>
            ✦
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E8B94A" }}>
            תיק אבחון <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
          </div>
        </div>
        <button
          onClick={run}
          style={{
            background: "transparent", color: "#9E9990",
            border: "1px solid #2C323E", borderRadius: 7,
            padding: "5px 12px", fontSize: 12, cursor: "pointer",
          }}
        >
          רענן
        </button>
      </div>

      {/* Block 1 — Synthesis */}
      <div>
        <SectionLabel index={1} label="Synthesis" />
        <p style={{
          fontSize: 14, lineHeight: 1.7, color: "#EDE9E1",
          margin: 0, marginTop: 10,
          borderRight: "2px solid rgba(232,185,74,0.4)",
          paddingRight: 14,
        }}>
          {diagnosis.synthesis}
        </p>
      </div>

      {/* Block 2 — Product matches */}
      <div>
        <SectionLabel index={2} label="התאמת מוצר" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {diagnosis.product_matches.map((pm) => {
            const style = REC_STYLE[pm.recommendation];
            return (
              <div
                key={pm.product_key}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: style.bg,
                  border: `1px solid ${style.border || "#2C323E"}`,
                  borderRadius: 9, padding: "10px 14px",
                }}
              >
                {/* Percentage */}
                <div style={{
                  fontSize: 20, fontWeight: 900, color: style.color,
                  width: 46, flexShrink: 0, textAlign: "center",
                }}>
                  {pm.match_pct}%
                </div>

                {/* Name + reason */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#EDE9E1" }}>
                    {PRODUCT_NAMES[pm.product_key]}
                  </div>
                  <div style={{ fontSize: 12, color: "#9E9990", marginTop: 2, lineHeight: 1.4 }}>
                    {pm.reason}
                  </div>
                </div>

                {/* Icon badge */}
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: `rgba(${style.color === "#4ade80" ? "74,222,128" : style.color === "#fbbf24" ? "251,191,36" : "248,113,113"},0.12)`,
                  color: style.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 900,
                }}>
                  {style.icon}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Block 3 — WhatsApp opener */}
      <div>
        <SectionLabel index={3} label="פתיחת שיחה בוואטסאפ" />
        <div style={{
          background: "rgba(0,0,0,0.3)", borderRadius: 10,
          border: "1px solid #2C323E", padding: "14px 16px",
          marginTop: 10, position: "relative",
        }}>
          <button
            onClick={copyWhatsApp}
            style={{
              position: "absolute", top: 10, left: 12,
              background: copied ? "rgba(74,222,128,0.15)" : "rgba(44,50,62,0.8)",
              color: copied ? "#4ade80" : "#9E9990",
              border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "#2C323E"}`,
              borderRadius: 6, padding: "4px 10px",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? "הועתק ✓" : "העתק"}
          </button>
          <p style={{
            fontSize: 14, lineHeight: 1.8, color: "#EDE9E1",
            margin: 0, paddingLeft: 70, whiteSpace: "pre-wrap",
          }}>
            {diagnosis.suggested_whatsapp}
          </p>
        </div>
      </div>

    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ index, label }: { index: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: "rgba(232,185,74,0.15)", color: "#E8B94A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 900, flexShrink: 0,
      }}>
        {index}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9E7C3A", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </span>
    </div>
  );
}
