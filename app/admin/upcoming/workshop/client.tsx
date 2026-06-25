"use client";

import { useMemo, useState } from "react";

interface Row {
  id:           string;
  name:         string | null;
  email:        string | null;
  phone:        string | null;
  purchased_at: string;
  amount_paid:  number | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function WorkshopClient({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) =>
      `${r.name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase().includes(t)
    );
  }, [rows, q]);

  function exportCsv() {
    const headers = ["שם", "אימייל", "טלפון", "תאריך רכישה", "סכום ששולם"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const fields = [r.name ?? "", r.email ?? "", r.phone ?? "", r.purchased_at, r.amount_paid ?? ""];
      lines.push(fields.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workshop-2026-06-25.csv`;
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
          סדנה — 30 ביולי 2026
        </h1>
        <p style={{ color: "#AAB0BD", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          רוכשי סדנה ב-90 הימים האחרונים — הקבוצה הצפויה להגיע למועד הקרוב.
          רכישות ישנות יותר נחתכות אוטומטית.
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
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#AAB0BD" }}>סה״כ:</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#E8B94A" }}>{filtered.length}</span>
          <span style={{ fontSize: 12, color: "#AAB0BD" }}>/ {rows.length}</span>
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
              <th style={th}>שולם</th>
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
                  {r.phone ?? "—"}
                </td>
                <td style={{ ...td, color: "#AAB0BD" }}>{fmtDate(r.purchased_at)}</td>
                <td style={{ ...td, fontWeight: 700, color: "#7FD49B" }}>
                  {r.amount_paid != null ? `₪${r.amount_paid.toLocaleString("he-IL")}` : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: "center", padding: 32, color: "#AAB0BD" }}>
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
