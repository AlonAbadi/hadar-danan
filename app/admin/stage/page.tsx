"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StageApp {
  id:        string;
  name:      string;
  email:     string | null;
  phone:     string | null;
  answers:   Record<string, string>;
  score:     number;
  score_breakdown: {
    depth:       number;
    specificity: number;
    commitment:  number;
    totalLen?:   number;
    hits?:       number;
  } | null;
  status:     string;
  source_utm: Record<string, string> | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new:         "חדש",
  reviewing:   "בבדיקה",
  shortlisted: "מועמדות חזקה",
  accepted:    "התקבל",
  rejected:    "נדחה",
};

const STATUS_COLORS: Record<string, string> = {
  new:         "#4285F4",
  reviewing:   "#C9964A",
  shortlisted: "#E8B94A",
  accepted:    "#34A853",
  rejected:    "#EA4335",
};

const ANSWER_LABELS: Record<string, string> = {
  name:  "שם",
  idea:  "העסק / רעיון",
  stage: "מצב נוכחי ויעד",
  stuck: "נקודת התקיעה",
  give:  "מה מוכן לתת",
  why:   "למה עכשיו, למה איתנו",
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

function scoreColor(score: number): string {
  if (score >= 70) return "#34A853";
  if (score >= 45) return "#E8B94A";
  return "#AAB0BD";
}

export default function StageAdminPage() {
  const [applications, setApplications]   = useState<StageApp[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filterStatus, setFilterStatus]   = useState<string>("all");
  const [expanded, setExpanded]           = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/stage/applications")
      .then(r => r.json())
      .then(d => setApplications(d.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setApplications(apps => apps.map(a => a.id === id ? { ...a, status } : a));
    await fetch(`/api/admin/stage/applications?id=${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    }).catch(() => {});
  };

  const filtered = filterStatus === "all"
    ? applications
    : applications.filter(a => a.status === filterStatus);

  return (
    <div dir="rtl" style={{ fontFamily: "var(--font-assistant), Assistant, sans-serif", minHeight: "100vh", background: "#0D1018", padding: 32 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#EDE9E1" }}>3 ימים פתוחים — מועמדויות</div>
          <div style={{ fontSize: 14, color: "#AAB0BD", marginTop: 4 }}>מסודרות לפי ציון מחויבות</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Stat label="סה״כ" value={applications.length} color="#E8B94A" />
          <Stat label="חדשים" value={applications.filter(a => a.status === "new").length} color="#4285F4" />
          <Stat label="מועמדות חזקה" value={applications.filter(a => a.status === "shortlisted").length} color="#E8B94A" />
          <Stat label="התקבלו" value={applications.filter(a => a.status === "accepted").length} color="#34A853" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {["all", ...Object.keys(STATUS_LABELS)].map(s => {
          const count = s === "all" ? applications.length : applications.filter(a => a.status === s).length;
          const active = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "6px 16px", borderRadius: 9999, fontFamily: "inherit",
              border: `1px solid ${active ? "#C9964A" : "#2C323E"}`,
              background: active ? "rgba(201,150,74,0.12)" : "transparent",
              color: active ? "#E8B94A" : "#AAB0BD",
              fontSize: 13, fontWeight: active ? 700 : 400, cursor: "pointer",
            }}>
              {s === "all" ? `הכל (${count})` : `${STATUS_LABELS[s]} (${count})`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: "#AAB0BD", fontSize: 14 }}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#AAB0BD", fontSize: 14, padding: 40, textAlign: "center" }}>אין מועמדויות בסטטוס זה</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(app => {
            const isOpen = expanded === app.id;
            const bd = app.score_breakdown;
            return (
              <div
                key={app.id}
                style={{
                  background: "#141820",
                  border: `1px solid ${isOpen ? "#C9964A55" : "#2C323E"}`,
                  borderRadius: 14,
                  padding: 20,
                  transition: "border-color 0.15s",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    {/* Score badge */}
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${scoreColor(app.score)}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800, color: scoreColor(app.score),
                      background: "rgba(0,0,0,0.2)",
                    }}>
                      {app.score}
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#EDE9E1" }}>{app.name}</div>
                      <div style={{ fontSize: 13, color: "#AAB0BD", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {app.email && <span dir="ltr">{app.email}</span>}
                        {app.phone && <span dir="ltr">{app.phone}</span>}
                      </div>
                      {bd && (
                        <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 11, color: "#AAB0BD" }}>
                          <span>עומק <span style={{ color: "#EDE9E1" }}>{bd.depth}</span>/40</span>
                          <span>·</span>
                          <span>ספציפיות <span style={{ color: "#EDE9E1" }}>{bd.specificity}</span>/30</span>
                          <span>·</span>
                          <span>מחויבות <span style={{ color: "#EDE9E1" }}>{bd.commitment}</span>/30</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 8,
                        background: (STATUS_COLORS[app.status] ?? "#AAB0BD") + "18",
                        color: STATUS_COLORS[app.status] ?? "#AAB0BD",
                        border: `1px solid ${(STATUS_COLORS[app.status] ?? "#AAB0BD")}44`,
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 11, color: "#AAB0BD" }}>{relativeTime(app.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : app.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid #2C323E",
                      borderRadius: 8,
                      padding: "8px 14px",
                      color: "#E8B94A",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isOpen ? "כיווץ ←" : "תשובות מלאות →"}
                  </button>
                  <Link
                    href={`/admin/stage/${app.id}`}
                    style={{
                      background: "linear-gradient(90deg, #9E7C3A, #E8B94A)",
                      border: "1px solid transparent",
                      borderRadius: 8,
                      padding: "8px 14px",
                      color: "#080C14",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      fontFamily: "inherit",
                    }}
                  >
                    דף מועמד ←
                  </Link>
                </div>

                {/* Expanded answers */}
                {isOpen && (
                  <div style={{ marginTop: 16, borderTop: "1px solid #2C323E", paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                    {Object.entries(app.answers)
                      .filter(([k]) => k !== "name")
                      .map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#E8B94A", letterSpacing: 2, marginBottom: 4 }}>
                          {ANSWER_LABELS[k] ?? k}
                        </div>
                        <div style={{
                          background: "#1D2430", borderRadius: 8, padding: "12px 14px",
                          fontSize: 14, color: "#EDE9E1", lineHeight: 1.7, whiteSpace: "pre-wrap",
                        }}>
                          {v}
                        </div>
                      </div>
                    ))}

                    {app.source_utm && Object.keys(app.source_utm).length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        {Object.entries(app.source_utm).map(([k, v]) => (
                          <span key={k} style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 9999,
                            background: "rgba(201,150,74,0.12)", color: "#E8B94A",
                            border: "1px solid rgba(201,150,74,0.25)",
                          }}>
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 10, padding: "12px 18px", textAlign: "center", minWidth: 100 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#AAB0BD", marginTop: 2 }}>{label}</div>
    </div>
  );
}
