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

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function storyScore(story: string): { score: number; label: string; color: string } {
  const words = story.trim().split(/\s+/).length;
  const hasNumbers = /\d/.test(story);
  const hasSelling = /מוכר|מכר|לקוח|עסק|מותג|פרילנס|תחום/.test(story);
  const hasAudience = /עוקב|קהל|קהילה|אינסטגרם|קורס|סדנה|הדרכ/.test(story);
  let score = 0;
  if (words > 30) score += 2;
  else if (words > 15) score += 1;
  if (hasNumbers) score += 1;
  if (hasSelling) score += 2;
  if (hasAudience) score += 2;
  if (score >= 5) return { score, label: "מתאים מאוד", color: "#34A853" };
  if (score >= 3) return { score, label: "מעניין", color: "#E8B94A" };
  return { score, label: "לא ברור", color: "#9E9990" };
}

export default function AtelierAdminPage() {
  const [applications, setApplications] = useState<AtelierApplication[]>([]);
  const [loading, setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
    <div dir="rtl" style={{ fontFamily: "var(--font-assistant), Assistant, sans-serif", minHeight: "100vh", background: "#0D1018", padding: 32 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#EDE9E1" }}>beegood atelier</div>
          <div style={{ fontSize: 14, color: "#9E9990", marginTop: 4 }}>לידים להצטרפות לפלטפורמה</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 10, padding: "14px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#E8B94A" }}>{applications.length}</div>
            <div style={{ fontSize: 11, color: "#9E9990", marginTop: 2 }}>סה"כ לידים</div>
          </div>
          <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 10, padding: "14px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#34A853" }}>{applications.filter(a => a.status === "accepted").length}</div>
            <div style={{ fontSize: 11, color: "#9E9990", marginTop: 2 }}>התקבלו</div>
          </div>
          <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 10, padding: "14px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4285F4" }}>{applications.filter(a => a.status === "new").length}</div>
            <div style={{ fontSize: 11, color: "#9E9990", marginTop: 2 }}>חדשים</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {["all", ...Object.keys(STATUS_LABELS)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "6px 16px", borderRadius: 9999, fontFamily: "inherit",
            border: `1px solid ${filterStatus === s ? "#C9964A" : "#2C323E"}`,
            background: filterStatus === s ? "rgba(201,150,74,0.12)" : "transparent",
            color: filterStatus === s ? "#C9964A" : "#9E9990",
            fontSize: 13, fontWeight: filterStatus === s ? 700 : 400, cursor: "pointer",
          }}>
            {s === "all" ? `הכל (${applications.length})` : `${STATUS_LABELS[s]} (${applications.filter(a => a.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ color: "#9E9990", fontSize: 14 }}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#9E9990", fontSize: 14, padding: 40, textAlign: "center" }}>אין לידים בסטטוס זה</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
          {filtered.map(app => {
            const fit = storyScore(app.story);
            return (
              <button
                key={app.id}
                onClick={() => window.location.href = `/admin/atelier/${app.id}`}
                style={{
                  background: "#141820", border: "1px solid #2C323E", borderRadius: 14,
                  padding: 24, cursor: "pointer", textAlign: "right", fontFamily: "inherit",
                  transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 16,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9964A44"; e.currentTarget.style.background = "#1A1F2B"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2C323E"; e.currentTarget.style.background = "#141820"; }}
              >
                {/* Top row: avatar + name + status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    {/* Avatar */}
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #C9964A, #9E7C3A)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800, color: "#0D1018",
                    }}>
                      {initials(app.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#EDE9E1" }}>{app.name}</div>
                      <div style={{ fontSize: 12, color: "#C9964A", marginTop: 2 }}>
                        {app.instagram.replace("https://www.instagram.com/", "@").replace("https://instagram.com/", "@").replace(/\/$/, "")}
                      </div>
                      <div style={{ fontSize: 12, color: "#9E9990", marginTop: 1, direction: "ltr", textAlign: "right" }}>{app.phone}</div>
                    </div>
                  </div>
                  {/* Status */}
                  <span style={{
                    padding: "3px 12px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                    background: (STATUS_COLORS[app.status] ?? "#9E9990") + "22",
                    color: STATUS_COLORS[app.status] ?? "#9E9990",
                    border: `1px solid ${(STATUS_COLORS[app.status] ?? "#9E9990")}44`,
                    whiteSpace: "nowrap",
                  }}>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </div>

                {/* Story preview */}
                <div style={{
                  background: "#1D2430", borderRadius: 8, padding: "12px 14px",
                  fontSize: 13, color: "#9E9990", lineHeight: 1.65,
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }}>
                  {app.story}
                </div>

                {/* Bottom row: fit score + time */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", background: fit.color,
                      boxShadow: `0 0 6px ${fit.color}`,
                    }} />
                    <span style={{ fontSize: 12, color: fit.color, fontWeight: 700 }}>{fit.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "#9E9990" }}>{relativeTime(app.created_at)}</span>
                    <span style={{ fontSize: 12, color: "#C9964A", fontWeight: 600 }}>פתח ←</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
