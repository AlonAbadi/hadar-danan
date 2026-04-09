"use client";

import { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type ProductKey = "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000";
type Recommendation = "yes" | "maybe_later" | "no";
type CallDecision  = "call_now" | "prepare_more" | "nurture" | "not_fit";
type FlagSeverity  = "high" | "medium" | "low";

type ProductMatch = {
  product_key:    ProductKey;
  match_pct:      number;
  recommendation: Recommendation;
  reason:         string;
};

type Flag = {
  severity: FlagSeverity;
  title:    string;
  detail:   string;
};

type ActionStep = {
  step:         number;
  timing:       string;
  title:        string;
  description:  string;
  branches?:    { if_yes: string; if_no: string };
};

type DiagnosisResult = {
  call_recommendation: { decision: CallDecision; reason: string; urgency: string };
  synthesis:           string;
  strongest_signal:    { headline: string; evidence: string };
  readiness:           { score: number; label: string; explanation: string };
  product_matches:     ProductMatch[];
  flags:               Flag[];
  action_plan:         ActionStep[];
  suggested_whatsapp:  string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const PRODUCT_NAMES: Record<ProductKey, string> = {
  challenge_197:  "צ׳אלנג׳ 7 הימים",
  workshop_1080:  "סדנה יום אחד",
  course_1800:    "קורס דיגיטלי",
  strategy_4000:  "פגישת אסטרטגיה",
  premium_14000:  "יום צילום פרמיום",
};

const PRODUCT_PRICES: Record<ProductKey, string> = {
  challenge_197:  "₪197",
  workshop_1080:  "₪1,080",
  course_1800:    "₪1,800",
  strategy_4000:  "₪4,000",
  premium_14000:  "₪14,000",
};

const CALL_DECISION_STYLE: Record<CallDecision, {
  bg: string; border: string; color: string; badge: string; badgeBg: string; label: string;
}> = {
  call_now:     { bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.35)",  color: "#4ade80", badge: "#4ade80",  badgeBg: "rgba(74,222,128,0.12)",  label: "התקשר עכשיו"   },
  prepare_more: { bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.35)",  color: "#fbbf24", badge: "#fbbf24",  badgeBg: "rgba(251,191,36,0.12)",  label: "הכן לפני שיחה" },
  nurture:      { bg: "rgba(147,197,253,0.05)", border: "rgba(147,197,253,0.25)", color: "#93c5fd", badge: "#93c5fd",  badgeBg: "rgba(147,197,253,0.10)", label: "טפח עוד"        },
  not_fit:      { bg: "rgba(156,163,175,0.04)", border: "rgba(156,163,175,0.18)", color: "#9ca3af", badge: "#9ca3af",  badgeBg: "rgba(156,163,175,0.08)", label: "לא מתאים כרגע"  },
};

const REC_STYLE: Record<Recommendation, { color: string; bg: string; border: string; icon: string; rgba: string }> = {
  yes:         { color: "#4ade80", bg: "linear-gradient(90deg, rgba(74,222,128,0.05), transparent)", border: "rgba(74,222,128,0.3)",  icon: "✓", rgba: "74,222,128"  },
  maybe_later: { color: "#fbbf24", bg: "transparent",                                               border: "transparent",            icon: "~", rgba: "251,191,36" },
  no:          { color: "#f87171", bg: "transparent",                                               border: "transparent",            icon: "✗", rgba: "248,113,113" },
};

const FLAG_STYLE: Record<FlagSeverity, { color: string; bg: string; border: string; icon: string }> = {
  high:   { color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.25)", icon: "▲" },
  medium: { color: "#fbbf24", bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.25)",  icon: "◆" },
  low:    { color: "#9E9990", bg: "rgba(158,153,144,0.06)", border: "rgba(158,153,144,0.2)",  icon: "●" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diffMs    = Date.now() - new Date(iso).getTime();
  const diffMin   = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);
  if (diffMin  < 1)  return "נותח ברגע זה";
  if (diffMin  < 60) return `נותח לפני ${diffMin} דקות`;
  if (diffHours < 24) return `נותח לפני ${diffHours} שעות`;
  if (diffDays === 1) return "נותח אתמול";
  return `נותח לפני ${diffDays} ימים`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TrueSignalCard({ userId }: { userId: string }) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [diagnosis,      setDiagnosis]      = useState<DiagnosisResult | null>(null);
  const [generatedAt,    setGeneratedAt]    = useState<string | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [copied,         setCopied]         = useState(false);

  // ── Load cached diagnosis on mount ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/truesignal-diagnosis?userId=${userId}`);
        if (!res.ok) throw new Error("cache load failed");
        const data = await res.json();
        if (cancelled) return;
        if (data.cached) {
          setDiagnosis({
            call_recommendation: data.call_recommendation,
            synthesis:           data.synthesis,
            strongest_signal:    data.strongest_signal,
            readiness:           data.readiness,
            product_matches:     data.product_matches,
            flags:               data.flags        ?? [],
            action_plan:         data.action_plan  ?? [],
            suggested_whatsapp:  data.suggested_whatsapp,
          });
          setGeneratedAt(data.generated_at);
        }
      } catch (e) {
        console.warn("[TrueSignal] initial cache load failed:", e);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Run / refresh diagnosis ──────────────────────────────────────────────
  async function runDiagnosis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/truesignal-diagnosis", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "הניתוח נכשל");
      setDiagnosis({
        call_recommendation: data.call_recommendation,
        synthesis:           data.synthesis,
        strongest_signal:    data.strongest_signal,
        readiness:           data.readiness,
        product_matches:     data.product_matches,
        flags:               data.flags       ?? [],
        action_plan:         data.action_plan ?? [],
        suggested_whatsapp:  data.suggested_whatsapp,
      });
      setGeneratedAt(data.generated_at);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
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

  // ── 1. Initial skeleton ──────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div dir="rtl" style={{
        background: "#141820", border: "1px solid #252b38",
        borderRadius: 14, padding: "24px", marginBottom: 16,
      }}>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position:  400px 0; }
          }
          .ts-shimmer {
            background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%);
            background-size: 400px 100%;
            animation: shimmer 1.6s ease-in-out infinite;
            border-radius: 4px;
          }
        `}</style>

        {/* Header skeleton */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div className="ts-shimmer" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
          <div className="ts-shimmer" style={{ width: 160, height: 16 }} />
        </div>

        {/* Banner skeleton */}
        <div className="ts-shimmer" style={{ height: 68, borderRadius: 10, marginBottom: 20 }} />

        {/* Synthesis skeleton */}
        <div style={{ marginBottom: 20 }}>
          <div className="ts-shimmer" style={{ width: 80, height: 11, marginBottom: 12 }} />
          <div style={{ borderRight: "2px solid rgba(232,185,74,0.15)", paddingRight: 14, display: "flex", flexDirection: "column", gap: 7 }}>
            {[100, 90, 75, 60].map((w, i) => (
              <div key={i} className="ts-shimmer" style={{ width: `${w}%`, height: 13 }} />
            ))}
          </div>
        </div>

        {/* Readiness bar skeleton */}
        <div style={{ marginBottom: 20 }}>
          <div className="ts-shimmer" style={{ width: 100, height: 11, marginBottom: 12 }} />
          <div className="ts-shimmer" style={{ height: 8, borderRadius: 999 }} />
        </div>

        {/* Product rows skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              border: "1px solid #1c212c", borderRadius: 9, padding: "10px 14px",
            }}>
              <div className="ts-shimmer" style={{ width: 46, height: 24, borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <div className="ts-shimmer" style={{ width: "50%", height: 13 }} />
                <div className="ts-shimmer" style={{ width: "80%", height: 11 }} />
              </div>
              <div className="ts-shimmer" style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 2. Empty (no cache) ──────────────────────────────────────────────────
  if (!diagnosis) {
    return (
      <div dir="rtl" style={{
        background: "#141820", border: "1px solid #252b38",
        borderRadius: 14, padding: "24px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CardIcon />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E8B94A" }}>
                תיק אבחון <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
              </div>
              <div style={{ fontSize: 12, color: "#9E9990", marginTop: 2 }}>
                ניתוח AI של הליד — המלצת שיחה, דחיפות, התאמת מוצר, תכנית פעולה
              </div>
            </div>
          </div>
          <button
            onClick={runDiagnosis}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
              color: "#080C14", border: "none", borderRadius: 8,
              padding: "9px 20px", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap", flexShrink: 0, opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "מנתח..." : "הפעל אבחון"}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 8,
            background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)",
            fontSize: 12, color: "#f87171",
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── 3 & 4. Results (with optional refresh overlay) ───────────────────────
  const callStyle = CALL_DECISION_STYLE[diagnosis.call_recommendation?.decision ?? "nurture"];

  return (
    <div dir="rtl" style={{
      background: "#141820", border: "1px solid #252b38",
      borderRadius: 14, padding: "24px", marginBottom: 16,
      display: "flex", flexDirection: "column", gap: 24,
      position: "relative",
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .ts-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%);
          background-size: 400px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
          border-radius: 4px;
        }
        .ts-refresh-btn:hover { border-color: rgba(232,185,74,0.5) !important; color: #E8B94A !important; }
        .ts-action-branch { display: flex; flex-direction: column; gap: 6px; }
        .ts-copy-btn:hover { background: rgba(44,50,62,1) !important; color: #EDE9E1 !important; }
      `}</style>

      {/* Refresh overlay */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10, background: "rgba(20,24,32,0.7)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#141820", border: "1px solid rgba(232,185,74,0.12)",
            borderRadius: 12, padding: "18px 28px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: "2px solid rgba(232,185,74,0.2)", borderTopColor: "#E8B94A",
              animation: "spin 0.8s linear infinite", flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: "#9E9990" }}>מנתח מחדש...</span>
          </div>
        </div>
      )}

      {/* Body — dimmed during refresh */}
      <div style={{ opacity: loading ? 0.35 : 1, pointerEvents: loading ? "none" : "auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CardIcon />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E8B94A" }}>
              תיק אבחון <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {generatedAt && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 9px", borderRadius: 999,
                background: "rgba(255,255,255,0.02)", border: "1px solid #1c212c",
                fontSize: 11, color: "#6B7280",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                {formatRelativeTime(generatedAt)}
              </div>
            )}
            <button
              className="ts-refresh-btn"
              onClick={runDiagnosis}
              style={{
                background: "transparent", color: "#9E9990",
                border: "1px solid #252b38", borderRadius: 7,
                padding: "5px 11px", fontSize: 12, cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
            >
              ↻ רענן
            </button>
          </div>
        </div>

        {/* Error banner on refresh failure */}
        {error && (
          <div style={{
            padding: "8px 12px", borderRadius: 8,
            background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)",
            fontSize: 12, color: "#f87171",
          }}>
            רענון נכשל: {error}
          </div>
        )}

        {/* ── BANNER: Call Recommendation ─────────────────────────────────── */}
        {diagnosis.call_recommendation && (
          <div style={{
            background: callStyle.bg,
            border: `1px solid ${callStyle.border}`,
            borderRadius: 12, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {/* Top row: badge + urgency */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  background: callStyle.badgeBg,
                  color: callStyle.color,
                  border: `1px solid ${callStyle.border}`,
                  borderRadius: 6, padding: "3px 10px",
                  fontSize: 12, fontWeight: 800, letterSpacing: "0.03em",
                }}>
                  {callStyle.label}
                </div>
                <span style={{ fontSize: 11, color: "#9E9990" }}>המלצת שיחה</span>
              </div>
              {diagnosis.call_recommendation.urgency && (
                <span style={{
                  fontSize: 11, color: callStyle.color, opacity: 0.8,
                  background: "rgba(255,255,255,0.03)", padding: "2px 8px",
                  borderRadius: 4, border: `1px solid ${callStyle.border}`,
                }}>
                  {diagnosis.call_recommendation.urgency}
                </span>
              )}
            </div>
            {/* Reason */}
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#EDE9E1" }}>
              {diagnosis.call_recommendation.reason}
            </p>
          </div>
        )}

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

        {/* Block 2 — Strongest Signal */}
        {diagnosis.strongest_signal && (
          <div>
            <SectionLabel index={2} label="האות החזק ביותר" />
            <div style={{
              marginTop: 10, borderRadius: 10,
              background: "rgba(232,185,74,0.04)",
              border: "1px solid rgba(232,185,74,0.15)",
              padding: "14px 16px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E8B94A", marginBottom: 6 }}>
                {diagnosis.strongest_signal.headline}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#9E9990", lineHeight: 1.5 }}>
                {diagnosis.strongest_signal.evidence}
              </p>
            </div>
          </div>
        )}

        {/* Block 3 — Readiness */}
        {diagnosis.readiness && (
          <div>
            <SectionLabel index={3} label="מוכנות לרכישה" />
            <div style={{ marginTop: 10 }}>
              {/* Score row */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#E8B94A", lineHeight: 1 }}>
                    {diagnosis.readiness.score}
                  </span>
                  <span style={{ fontSize: 12, color: "#9E7C3A" }}>/100</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: "#EDE9E1",
                  background: "rgba(232,185,74,0.1)", border: "1px solid rgba(232,185,74,0.2)",
                  borderRadius: 4, padding: "2px 8px",
                }}>
                  {diagnosis.readiness.label}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{
                height: 7, borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                overflow: "hidden", marginBottom: 10,
              }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${Math.min(100, Math.max(0, diagnosis.readiness.score))}%`,
                  background: diagnosis.readiness.score >= 70
                    ? "linear-gradient(90deg, #9E7C3A, #E8B94A)"
                    : diagnosis.readiness.score >= 40
                    ? "linear-gradient(90deg, #9E7C3A, #C9964A)"
                    : "rgba(158,153,144,0.5)",
                  transition: "width 0.6s ease",
                }} />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#9E9990", lineHeight: 1.5 }}>
                {diagnosis.readiness.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Block 4 — Product matches */}
        <div>
          <SectionLabel index={4} label="התאמת מוצר" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {diagnosis.product_matches.map((pm) => {
              const s = REC_STYLE[pm.recommendation];
              return (
                <div
                  key={pm.product_key}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: s.bg,
                    border: `1px solid ${s.border || "#2C323E"}`,
                    borderRadius: 9, padding: "10px 14px",
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color, width: 46, flexShrink: 0, textAlign: "center" }}>
                    {pm.match_pct}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#EDE9E1" }}>
                        {PRODUCT_NAMES[pm.product_key]}
                      </span>
                      <span style={{ fontSize: 11, color: "#9E7C3A", fontWeight: 600 }}>
                        {PRODUCT_PRICES[pm.product_key]}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#9E9990", marginTop: 2, lineHeight: 1.4 }}>
                      {pm.reason}
                    </div>
                  </div>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                    background: `rgba(${s.rgba},0.12)`,
                    color: s.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900,
                  }}>
                    {s.icon}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Block 5 — Flags */}
        {diagnosis.flags && diagnosis.flags.length > 0 && (
          <div>
            <SectionLabel index={5} label="דגלים לצוות המכירות" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {diagnosis.flags.map((flag, i) => {
                const fs = FLAG_STYLE[flag.severity];
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    background: fs.bg, border: `1px solid ${fs.border}`,
                    borderRadius: 9, padding: "10px 14px",
                  }}>
                    <div style={{ fontSize: 11, color: fs.color, marginTop: 2, flexShrink: 0 }}>
                      {fs.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: fs.color, marginBottom: 3 }}>
                        {flag.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#9E9990", lineHeight: 1.4 }}>
                        {flag.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Block 6 — Action Plan */}
        {diagnosis.action_plan && diagnosis.action_plan.length > 0 && (
          <div>
            <SectionLabel index={6} label="תכנית פעולה" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {diagnosis.action_plan.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {/* Step connector */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "rgba(232,185,74,0.12)",
                      border: "1px solid rgba(232,185,74,0.3)",
                      color: "#E8B94A", fontSize: 12, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {step.step}
                    </div>
                    {i < diagnosis.action_plan.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "rgba(232,185,74,0.1)", minHeight: 12, marginTop: 4 }} />
                    )}
                  </div>
                  {/* Step content */}
                  <div style={{ flex: 1, paddingBottom: i < diagnosis.action_plan.length - 1 ? 8 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#EDE9E1" }}>
                        {step.title}
                      </span>
                      <span style={{
                        fontSize: 11, color: "#9E7C3A",
                        background: "rgba(158,124,58,0.1)", border: "1px solid rgba(158,124,58,0.2)",
                        borderRadius: 4, padding: "1px 7px",
                      }}>
                        {step.timing}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#9E9990", lineHeight: 1.5 }}>
                      {step.description}
                    </p>
                    {step.branches && (
                      <div className="ts-action-branch" style={{
                        marginTop: 8, padding: "10px 12px", borderRadius: 7,
                        background: "rgba(0,0,0,0.2)", border: "1px solid #1c212c",
                      }}>
                        <div style={{ fontSize: 11, color: "#4ade80" }}>
                          <span style={{ fontWeight: 700 }}>✓ אם כן: </span>
                          {step.branches.if_yes}
                        </div>
                        <div style={{ fontSize: 11, color: "#f87171" }}>
                          <span style={{ fontWeight: 700 }}>✗ אם לא: </span>
                          {step.branches.if_no}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block 7 — WhatsApp opener */}
        <div>
          <SectionLabel index={7} label="פתיחת שיחה בוואטסאפ" />
          <div style={{
            background: "rgba(0,0,0,0.3)", borderRadius: 10,
            border: "1px solid #2C323E", padding: "14px 16px",
            marginTop: 10, position: "relative",
          }}>
            <button
              className="ts-copy-btn"
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

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, paddingTop: 4,
          borderTop: "1px solid rgba(44,50,62,0.5)",
        }}>
          <span style={{ fontSize: 10, color: "#3D434F" }}>Claude Sonnet 4.6</span>
          <span style={{ fontSize: 10, color: "#2C323E" }}>·</span>
          <span dir="ltr" style={{ fontSize: 10, color: "#3D434F", unicodeBidi: "embed" }}>TrueSignal© v2</span>
          <span style={{ fontSize: 10, color: "#2C323E" }}>·</span>
          <span style={{ fontSize: 10, color: "#3D434F" }}>תוקף 6 שעות</span>
        </div>

      </div>{/* end dimmed body */}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CardIcon() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, flexShrink: 0,
    }}>
      ✦
    </div>
  );
}

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
