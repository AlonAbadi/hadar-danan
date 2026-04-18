"use client";

import { useState, useEffect } from "react";

interface AtelierApplication {
  id: string;
  name: string;
  phone: string;
  instagram: string;
  story: string;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new:            "חדש",
  reviewing:      "בבדיקה",
  call_scheduled: "שיחה נקבעה",
  accepted:       "התקבל",
  rejected:       "נדחה",
  not_a_fit:      "לא מתאים",
};

const STATUS_COLORS: Record<string, string> = {
  new:            "#4285F4",
  reviewing:      "#C9964A",
  call_scheduled: "#E8B94A",
  accepted:       "#34A853",
  rejected:       "#EA4335",
  not_a_fit:      "#9E9990",
};

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return "עכשיו";
  if (mins  < 60) return `לפני ${mins} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days  < 30) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString("he-IL");
}

const cardStyle: React.CSSProperties = {
  background: "#141820",
  border: "1px solid #2C323E",
  borderRadius: 12,
  padding: 20,
};

export default function AtelierAdminPage() {
  const [applications, setApplications] = useState<AtelierApplication[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected,     setSelected]     = useState<AtelierApplication | null>(null);

  useEffect(() => {
    fetch("/api/admin/atelier/applications")
      .then(r => r.json())
      .then(d => setApplications(d.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterStatus === "all"
    ? applications
    : applications.filter(a => a.status === filterStatus);

  return (
    <div dir="rtl" style={{
      fontFamily: "var(--font-assistant), Assistant, sans-serif",
      minHeight: "100vh",
      background: "#0D1018",
      padding: 24,
    }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#EDE9E1" }}>beegood atelier</div>
        <div style={{ fontSize: 13, color: "#9E9990", marginTop: 2 }}>בקשות להצטרפות</div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["all", ...Object.keys(STATUS_LABELS)].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "6px 16px",
              borderRadius: 9999,
              border: `1px solid ${filterStatus === s ? "#C9964A" : "#2C323E"}`,
              background: filterStatus === s ? "rgba(201,150,74,0.12)" : "transparent",
              color: filterStatus === s ? "#C9964A" : "#9E9990",
              fontSize: 13,
              fontWeight: filterStatus === s ? 700 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {s === "all" ? "הכל" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: "#9E9990", marginBottom: 16 }}>
        {loading ? "טוען..." : `${filtered.length} בקשות`}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#9E9990", fontSize: 14 }}>
            אין בקשות
          </div>
        )}

        {filtered.map((app, i) => (
          <button
            key={app.id}
            onClick={() => window.location.href = `/admin/atelier/${app.id}`}
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 120px 140px 100px 110px",
              alignItems: "center",
              gap: 16,
              padding: "14px 20px",
              background: "none",
              border: "none",
              borderBottom: i < filtered.length - 1 ? "1px solid #2C323E" : "none",
              cursor: "pointer",
              textAlign: "right",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            {/* Name + preview */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE9E1" }}>{app.name}</div>
              <div style={{ fontSize: 12, color: "#9E9990", marginTop: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 260 }}>
                {app.story}
              </div>
            </div>

            {/* Phone */}
            <div style={{ fontSize: 13, color: "#9E9990", direction: "ltr", textAlign: "left" }}>
              {app.phone}
            </div>

            {/* Instagram */}
            <div style={{ fontSize: 13, color: "#C9964A" }}>
              {app.instagram}
            </div>

            {/* Status */}
            <div>
              <span style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                background: (STATUS_COLORS[app.status] ?? "#9E9990") + "22",
                color: STATUS_COLORS[app.status] ?? "#9E9990",
                border: `1px solid ${(STATUS_COLORS[app.status] ?? "#9E9990")}44`,
              }}>
                {STATUS_LABELS[app.status] ?? app.status}
              </span>
            </div>

            {/* Date */}
            <div style={{ fontSize: 12, color: "#9E9990", textAlign: "left" }}>
              {relativeTime(app.created_at)}
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#141820",
              border: "1px solid #2C323E",
              borderRadius: 16,
              padding: 32,
              maxWidth: 560,
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              style={{
                position: "absolute", top: 16, left: 16,
                background: "none", border: "none", cursor: "pointer",
                color: "#9E9990", fontSize: 20, lineHeight: 1,
                fontFamily: "inherit",
              }}
            >
              ✕
            </button>

            {/* Status badge */}
            <span style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              background: (STATUS_COLORS[selected.status] ?? "#9E9990") + "22",
              color: STATUS_COLORS[selected.status] ?? "#9E9990",
              border: `1px solid ${(STATUS_COLORS[selected.status] ?? "#9E9990")}44`,
              marginBottom: 16,
            }}>
              {STATUS_LABELS[selected.status] ?? selected.status}
            </span>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#EDE9E1", marginBottom: 4 }}>
              {selected.name}
            </h2>
            <div style={{ fontSize: 13, color: "#9E9990", marginBottom: 20 }}>
              {new Date(selected.created_at).toLocaleString("he-IL")}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>טלפון</div>
                <div style={{ fontSize: 15, color: "#EDE9E1", direction: "ltr", textAlign: "right" }}>{selected.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>אינסטגרם</div>
                <div style={{ fontSize: 15, color: "#C9964A" }}>{selected.instagram}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>הסיפור</div>
              <div style={{
                fontSize: 15,
                color: "#EDE9E1",
                lineHeight: 1.75,
                background: "#1D2430",
                border: "1px solid #2C323E",
                borderRadius: 10,
                padding: 16,
                whiteSpace: "pre-wrap",
              }}>
                {selected.story}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
