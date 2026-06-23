"use client";

import { useMemo, useState } from "react";

interface Row {
  id:            string;
  name:          string | null;
  email:         string | null;
  phone:         string | null;
  purchased_at:  string | null;
  amount:        number | null;
  current_day:   number;
  completed:     boolean;
  last_activity: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtPhone(p: string | null): string {
  if (!p) return "—";
  return p;
}

function fmtMeetingTitle(iso: string): string {
  const d = new Date(iso);
  const datePart = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day:      "numeric",
    month:    "long",
    year:     "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   false,
  }).format(d);
  return `${datePart}, ${timePart}`;
}

export default function ChallengeZoomClient({ rows, meetingDateIso }: { rows: Row[]; meetingDateIso: string }) {
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (onlyActive && r.completed) return false;
      if (!q) return true;
      const hay = `${r.name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [rows, q, onlyActive]);

  function exportCsv() {
    const headers = ["שם", "אימייל", "טלפון", "תאריך רכישה", "יום נוכחי", "סטטוס"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const fields = [
        r.name ?? "",
        r.email ?? "",
        r.phone ?? "",
        r.purchased_at ?? "",
        r.current_day,
        r.completed ? "השלים" : "בתהליך",
      ];
      lines.push(fields.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `challenge-zoom-2026-06-23.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        padding: 24,
        color: "#EDE9E1",
        direction: "rtl",
        fontFamily: "var(--font-assistant), Assistant, sans-serif",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px", color: "#EDE9E1" }}>
          זום אתגר — {fmtMeetingTitle(meetingDateIso)}
        </h1>
        <p style={{ color: "#AAB0BD", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          כל רוכשי האתגר שזכאים להשתתף במפגש הזום הקרוב.
          ביום הנוכחי מציין את התקדמותם בתוכן (0 = טרם נכנסו).
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#AAB0BD" }}>סה״כ:</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#E8B94A" }}>{filtered.length}</span>
            <span style={{ fontSize: 12, color: "#AAB0BD" }}>/ {rows.length}</span>
          </div>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#AAB0BD",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              style={{ accentColor: "#E8B94A" }}
            />
            רק שעדיין לא השלימו
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש שם / אימייל / טלפון"
            style={{
              background: "#141820",
              border: "1px solid #2C323E",
              borderRadius: 8,
              padding: "8px 14px",
              color: "#EDE9E1",
              fontSize: 13,
              minWidth: 260,
              outline: "none",
              fontFamily: "inherit",
              direction: "rtl",
            }}
          />
          <button
            onClick={exportCsv}
            style={{
              background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
              color: "#2a1d05",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 1px 0 rgba(255,255,255,0.35) inset, 0 4px 10px -4px rgba(0,0,0,0.45)",
            }}
          >
            ↓ ייצוא CSV
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#141820",
          border: "1px solid #2C323E",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", direction: "rtl" }}>
          <thead>
            <tr style={{ background: "#1D2430", borderBottom: "1px solid #2C323E" }}>
              <th style={th}>שם</th>
              <th style={th}>אימייל</th>
              <th style={th}>טלפון</th>
              <th style={th}>תאריך רכישה</th>
              <th style={th}>יום נוכחי</th>
              <th style={th}>סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #1D2430" }}>
                <td style={td}>{r.name ?? "—"}</td>
                <td style={{ ...td, color: "#AAB0BD" }}>{r.email ?? "—"}</td>
                <td
                  style={{
                    ...td,
                    color: "#E8B94A",
                    fontWeight: 700,
                    direction: "ltr",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtPhone(r.phone)}
                </td>
                <td style={{ ...td, color: "#AAB0BD" }}>{fmtDate(r.purchased_at)}</td>
                <td style={td}>{r.current_day === 0 ? "—" : `יום ${r.current_day}`}</td>
                <td style={td}>
                  {r.completed ? (
                    <span style={{ color: "#7FD49B", fontWeight: 700 }}>השלים את האתגר</span>
                  ) : (
                    <span style={{ color: "#AAB0BD" }}>בתהליך</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: "center", padding: 32, color: "#AAB0BD" }}>
                  אין רשומות שתואמות לסינון.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "right",
  padding: "12px 16px",
  fontSize: 12,
  fontWeight: 700,
  color: "#E8B94A",
  letterSpacing: ".06em",
};

const td: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "#EDE9E1",
  verticalAlign: "middle",
};
