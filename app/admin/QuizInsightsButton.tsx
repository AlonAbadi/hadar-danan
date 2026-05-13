"use client";

import { useState } from "react";

interface ProductStat { product: string; count: number; pct: number; }

interface Analysis {
  headline: string;
  audience_profile: string;
  top_pains: string[];
  product_fit: string;
  opportunities: string[];
  content_angle: string;
  watch_out: string;
}

interface ApiResponse {
  analysis: Analysis;
  meta: { total: number; period: string; avgMatchPct: number; productSummary: ProductStat[] };
}

export function QuizInsightsButton() {
  const [loading, setLoading]   = useState(false);
  const [data,    setData]      = useState<ApiResponse | null>(null);
  const [error,   setError]     = useState("");
  const [open,    setOpen]      = useState(false);

  async function run() {
    setLoading(true); setError(""); setOpen(true);
    try {
      const res = await fetch("/api/admin/quiz-analysis", { method: "POST" });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "שגיאה"); setLoading(false); return; }
      setData(json);
    } catch {
      setError("שגיאת רשת");
    }
    setLoading(false);
  }

  const card: React.CSSProperties = {
    background: "linear-gradient(145deg,#1a2030,#141820)",
    border: "1px solid rgba(201,150,74,0.25)",
    borderRadius: 14,
    padding: "24px 28px",
    marginBottom: 32,
  };

  const tag: React.CSSProperties = {
    display: "inline-block",
    background: "rgba(201,150,74,0.12)",
    border: "1px solid rgba(201,150,74,0.22)",
    borderRadius: 20,
    padding: "3px 12px",
    fontSize: 11,
    color: "#C9964A",
    fontWeight: 700,
    letterSpacing: "0.06em",
  };

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: open ? 16 : 0 }}>
        <button
          onClick={run}
          disabled={loading}
          style={{
            background: loading ? "rgba(201,150,74,0.15)" : "linear-gradient(135deg,#E8B94A,#9E7C3A)",
            color: loading ? "#C9964A" : "#1A1206",
            fontWeight: 800, fontSize: 13,
            padding: "10px 22px", borderRadius: 9999,
            border: loading ? "1px solid rgba(201,150,74,0.3)" : "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit", letterSpacing: "0.02em",
            transition: "all 0.18s",
          }}
        >
          {loading ? "מנתח..." : "ניתוח תוצאות קוויז"}
        </button>
        {data && !loading && (
          <span style={{ fontSize: 12, color: "#9E9990" }}>
            {data.meta.total} תוצאות · {data.meta.period}
          </span>
        )}
        {data && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9E9990", fontSize: 12 }}
          >
            {open ? "הסתר ▲" : "הצג ▼"}
          </button>
        )}
      </div>

      {/* Error */}
      {error && <p style={{ color: "#E8B94A", fontSize: 13, marginTop: 8 }}>{error}</p>}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ ...card, opacity: 0.6 }}>
          <div style={{ height: 18, width: "60%", background: "#2C323E", borderRadius: 6, marginBottom: 12 }} />
          <div style={{ height: 13, width: "90%", background: "#2C323E", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 13, width: "75%", background: "#2C323E", borderRadius: 6 }} />
        </div>
      )}

      {/* Results */}
      {data && open && !loading && (
        <div style={card}>
          {/* Headline */}
          <p style={{ fontSize: 18, fontWeight: 800, color: "#E8B94A", marginBottom: 20, lineHeight: 1.4 }}>
            {data.analysis.headline}
          </p>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
            <span style={tag}>{data.meta.total} קוויזים</span>
            <span style={tag}>{data.meta.avgMatchPct}% התאמה ממוצעת</span>
            {data.meta.productSummary.slice(0, 3).map(p => (
              <span key={p.product} style={tag}>{p.product} — {p.pct}%</span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Audience profile */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9E7C3A", letterSpacing: "0.12em", marginBottom: 8 }}>פרופיל הקהל</div>
              <p style={{ fontSize: 13, color: "rgba(237,233,225,0.85)", lineHeight: 1.7, margin: 0 }}>
                {data.analysis.audience_profile}
              </p>
            </div>

            {/* Product fit */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9E7C3A", letterSpacing: "0.12em", marginBottom: 8 }}>התאמת מוצרים</div>
              <p style={{ fontSize: 13, color: "rgba(237,233,225,0.85)", lineHeight: 1.7, margin: 0 }}>
                {data.analysis.product_fit}
              </p>
            </div>

            {/* Top pains */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9E7C3A", letterSpacing: "0.12em", marginBottom: 8 }}>כאבים מרכזיים</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {data.analysis.top_pains.map((p, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "rgba(237,233,225,0.85)" }}>
                    <span style={{ color: "#C9964A", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9E7C3A", letterSpacing: "0.12em", marginBottom: 8 }}>הזדמנויות</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {data.analysis.opportunities.map((o, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "rgba(237,233,225,0.85)" }}>
                    <span style={{ color: "#34A853", fontWeight: 700, flexShrink: 0 }}>→</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content angle */}
          <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(232,185,74,0.06)", border: "1px solid rgba(232,185,74,0.15)", borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9E7C3A", letterSpacing: "0.12em", marginBottom: 6 }}>זווית תוכן מומלצת</div>
            <p style={{ fontSize: 13, color: "#EDE9E1", margin: 0, lineHeight: 1.6 }}>{data.analysis.content_angle}</p>
          </div>

          {/* Watch out */}
          <div style={{ marginTop: 12, padding: "14px 18px", background: "rgba(234,67,53,0.06)", border: "1px solid rgba(234,67,53,0.18)", borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#EA4335", letterSpacing: "0.12em", marginBottom: 6 }}>שים לב</div>
            <p style={{ fontSize: 13, color: "rgba(237,233,225,0.85)", margin: 0, lineHeight: 1.6 }}>{data.analysis.watch_out}</p>
          </div>
        </div>
      )}
    </div>
  );
}
