"use client";

import { useState } from "react";
import type { MovementBrief } from "@/lib/movement-engine";

const EXAMPLE = "אישה דתייה בת 38. דלילות שיער שמתחילה כבר שנתיים. מאשימה את עצמה. לא מספרת לאיש, אפילו לא לבעלה. מסתכלת במראה ובוכה לפעמים. שוקלת פאה אבל מפחדת שהפאה תיפול לה ואז כולם ידעו.";

function FieldRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: accent ? 700 : 500, color: accent ? "#E8B94A" : "#EDE9E1" }}>
        {value}
      </span>
    </div>
  );
}

export default function MovementClient() {
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [brief, setBrief]             = useState<MovementBrief | null>(null);
  const [error, setError]             = useState<string | null>(null);

  async function generate() {
    if (description.trim().length < 10) {
      setError("צריך לפחות משפט תיאורי אחד.");
      return;
    }
    setLoading(true);
    setError(null);
    setBrief(null);
    try {
      const res = await fetch("/api/admin/movement", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "נכשל");
      } else {
        setBrief(data.brief);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "calc(100vh - 50px)",
        padding: "32px 24px 80px",
        fontFamily: "var(--font-assistant), Assistant, sans-serif",
        color: "#EDE9E1",
      }}
    >
      <div style={{ maxWidth: 760, marginInline: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>מנוע התנועה</h1>
          <p style={{ fontSize: 14, color: "#9E9990", lineHeight: 1.6 }}>
            תיאור של לקוח/ה אמיתי/ת — מקום פנימי, פחד, התנגדות. המנוע מחזיר תדריך בימוי לסרטון אחד שמזיז אותו/ה צעד פנימי קדימה. לא תסריט. לא פתיחה. לא CTA.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={EXAMPLE}
            rows={6}
            style={{
              width: "100%",
              background: "#141820",
              border: "1px solid #2C323E",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 15,
              lineHeight: 1.7,
              color: "#EDE9E1",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={generate}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                color: "#080C14",
                border: "none",
                padding: "12px 24px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 14,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "מביים..." : "תן לי תדריך"}
            </button>
            {!description && (
              <button
                type="button"
                onClick={() => setDescription(EXAMPLE)}
                style={{
                  background: "transparent",
                  color: "#9E9990",
                  border: "1px solid #2C323E",
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                טען דוגמה
              </button>
            )}
          </div>
          {error && (
            <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>
          )}
        </div>

        {brief && (
          <div
            style={{
              background: "linear-gradient(145deg, #141820, #0D1018)",
              border: "1px solid rgba(201,150,74,0.20)",
              borderRadius: 16,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* Movement headline */}
            <div style={{ borderBottom: "1px solid #2C323E", paddingBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.05em", marginBottom: 8 }}>
                התנועה הפנימית
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{
                  background: "rgba(232,185,74,0.10)",
                  border: "1px solid rgba(232,185,74,0.35)",
                  color: "#E8B94A",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 999,
                }}>
                  {brief.movement.category}
                </span>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 15, color: "#9E9990" }}>
                  <span style={{ fontWeight: 700, color: "#EDE9E1" }}>מ:</span> {brief.movement.from}
                </div>
                <div style={{ fontSize: 15, color: "#9E9990" }}>
                  <span style={{ fontWeight: 700, color: "#EDE9E1" }}>ל:</span> {brief.movement.to}
                </div>
              </div>
            </div>

            {/* Four axes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <FieldRow label="סוג סרטון" value={brief.video_type} accent />
              <FieldRow label="פעולה מתחת לטקסט" value={brief.action_beneath_text} accent />
              <FieldRow label="התנגדות שנפתרת" value={brief.objection_solved} />
              <FieldRow label="תדר" value={brief.frequency} />
            </div>

            {/* Talking points */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.05em", marginBottom: 10 }}>
                3 נקודות דיבור (לא משפטים — הפתיחה תיוולד חיה)
              </div>
              <ol style={{ display: "flex", flexDirection: "column", gap: 10, paddingInlineStart: 20 }}>
                {brief.talking_points.map((p, i) => (
                  <li key={i} style={{ fontSize: 15, color: "#EDE9E1", lineHeight: 1.6 }}>{p}</li>
                ))}
              </ol>
            </div>

            {/* Data grounding */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #2C323E",
              borderRadius: 10,
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", marginBottom: 4 }}>
                על מה זה נשען
              </div>
              <div style={{ fontSize: 14, color: "#EDE9E1", lineHeight: 1.6 }}>
                {brief.data_grounding}
              </div>
            </div>

            {/* Missing data warning — only render when present */}
            {brief.missing_data && brief.missing_data.trim() && (
              <div style={{
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.30)",
                borderRadius: 10,
                padding: "12px 14px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
                  חסר לפני הצילום
                </div>
                <div style={{ fontSize: 14, color: "#EDE9E1", lineHeight: 1.6 }}>
                  {brief.missing_data}
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, color: "#6b6358", textAlign: "center", lineHeight: 1.6, paddingTop: 8 }}>
              בלי פתיחה כתובה. בלי CTA. הפתיחה נולדת חיה.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
