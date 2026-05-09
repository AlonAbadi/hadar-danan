"use client";

import { useState } from "react";

const C = {
  bg:       "#080C14",
  card:     "#141820",
  cardSoft: "#1D2430",
  border:   "#2C323E",
  gold:     "#C9964A",
  goldL:    "#E8B94A",
  fg:       "#EDE9E1",
  muted:    "#9E9990",
  green:    "#34A853",
  red:      "#EF4444",
  purple:   "#A78BFA",
};

interface Settings {
  id:                     string;
  next_live_meeting_date: string | null;
  live_meeting_zoom_url:  string | null;
}

interface EnrollmentRow {
  id:               string;
  enrolled_at:      string;
  current_day:      number;
  completed_at:     string | null;
  last_activity_at: string;
  users:            { name: string | null; email: string; phone: string | null };
  challenge_day_completions: { day_number: number }[];
}

interface LogRow {
  enrollment_id: string;
  day_number:    number;
  sent_at:       string;
  status:        string;
  challenge_enrollments: {
    users: { name: string | null; phone: string | null };
  };
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysSince(d: string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default function ChallengeAdminClient({
  settings,
  enrollments,
  logs,
}: {
  settings:    Settings | null;
  enrollments: EnrollmentRow[];
  logs:        LogRow[];
}) {
  const [meetingDate, setMeetingDate] = useState(
    settings?.next_live_meeting_date
      ? new Date(settings.next_live_meeting_date).toISOString().slice(0, 16)
      : ""
  );
  const [zoomUrl, setZoomUrl]   = useState(settings?.live_meeting_zoom_url ?? "");
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "done" | "stuck">("all");

  async function saveSettings() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/admin/challenge-settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          next_live_meeting_date: meetingDate || null,
          live_meeting_zoom_url:  zoomUrl || null,
          settings_id:            settings?.id,
        }),
      });
      setSaveMsg(res.ok ? "נשמר ✓" : "שגיאה בשמירה");
    } catch {
      setSaveMsg("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  function enrollmentStatus(e: EnrollmentRow): "done" | "active" | "stuck" {
    if (e.completed_at) return "done";
    const inactive = daysSince(e.last_activity_at);
    if (inactive >= 14) return "stuck";
    return "active";
  }

  const filtered = enrollments.filter((e) => {
    if (statusFilter === "all") return true;
    return enrollmentStatus(e) === statusFilter;
  });

  const activeCount = enrollments.filter((e) => enrollmentStatus(e) === "active").length;
  const doneCount   = enrollments.filter((e) => enrollmentStatus(e) === "done").length;
  const stuckCount  = enrollments.filter((e) => enrollmentStatus(e) === "stuck").length;

  const cell: React.CSSProperties = {
    padding: "10px 12px", fontSize: 13, color: C.fg,
    borderBottom: `1px solid ${C.border}`, textAlign: "right",
  };

  return (
    <div dir="rtl" style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto", fontFamily: "Assistant, sans-serif", color: C.fg }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, color: C.goldL }}>אתגר 7 הימים — ניהול</h1>

      {/* ── Stats strip ─────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "סה״כ רשומים", val: enrollments.length, color: C.gold },
          { label: "פעילים",      val: activeCount,         color: C.green },
          { label: "סיימו",       val: doneCount,           color: C.purple },
          { label: "תקועים",      val: stuckCount,          color: C.red },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 20px", minWidth: 120,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Block 1: Settings ────────────────────────── */}
      <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, marginTop: 0 }}>הגדרות מפגש סיום</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>תאריך ושעת המפגש הבא</label>
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              style={{
                width: "100%", background: C.cardSoft, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "9px 12px", color: C.fg,
                fontSize: 14, fontFamily: "Assistant, sans-serif",
              }}
            />
          </div>
          <div style={{ flex: "2 1 300px" }}>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>קישור Zoom</label>
            <input
              type="url"
              value={zoomUrl}
              onChange={(e) => setZoomUrl(e.target.value)}
              placeholder="https://zoom.us/j/..."
              dir="ltr"
              style={{
                width: "100%", background: C.cardSoft, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "9px 12px", color: C.fg,
                fontSize: 14, fontFamily: "Assistant, sans-serif",
              }}
            />
          </div>
          <div>
            <button
              onClick={saveSettings}
              disabled={saving}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: saving ? C.cardSoft : `linear-gradient(135deg, ${C.goldL}, ${C.gold})`,
                color: saving ? C.muted : "#080C14",
                fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "Assistant, sans-serif",
              }}
            >
              {saving ? "שומר..." : "שמור"}
            </button>
            {saveMsg && <span style={{ marginRight: 10, fontSize: 13, color: saveMsg.includes("✓") ? C.green : C.red }}>{saveMsg}</span>}
          </div>
        </div>
      </section>

      {/* ── Block 2: Enrollments table ───────────────── */}
      <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>משתתפים</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "active", "done", "stuck"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "5px 14px", borderRadius: 20, border: "none",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "Assistant, sans-serif",
                  background: statusFilter === s ? C.gold : C.cardSoft,
                  color: statusFilter === s ? "#080C14" : C.muted,
                }}
              >
                {{ all: "הכל", active: "פעילים", done: "סיימו", stuck: "תקועים" }[s]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.cardSoft }}>
                {["שם", "אימייל", "נרשם", "יום נוכחי", "הושלמו", "פעילות אחרונה", "סטטוס"].map((h) => (
                  <th key={h} style={{ ...cell, fontWeight: 700, fontSize: 12, color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ ...cell, textAlign: "center", color: C.muted }}>אין תוצאות</td></tr>
              )}
              {filtered.map((e) => {
                const status  = enrollmentStatus(e);
                const daysCompleted = e.challenge_day_completions?.length ?? 0;
                const statusLabel = { done: "סיים", active: "פעיל", stuck: "תקוע" }[status];
                const statusColor = { done: C.purple, active: C.green, stuck: C.red }[status];
                return (
                  <tr key={e.id} style={{ background: "transparent" }}>
                    <td style={cell}>{e.users?.name ?? "—"}</td>
                    <td style={{ ...cell, direction: "ltr", fontSize: 12, color: C.muted }}>{e.users?.email}</td>
                    <td style={{ ...cell, fontSize: 12, color: C.muted }}>{fmtDate(e.enrolled_at)}</td>
                    <td style={{ ...cell, fontWeight: 800, color: C.gold }}>{e.current_day}</td>
                    <td style={cell}>{daysCompleted} / 9</td>
                    <td style={{ ...cell, fontSize: 12, color: daysSince(e.last_activity_at) >= 7 ? C.red : C.muted }}>
                      לפני {daysSince(e.last_activity_at)} ימים
                    </td>
                    <td style={{ ...cell }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                        background: `${statusColor}20`, color: statusColor,
                      }}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Block 3: WhatsApp log ─────────────────────── */}
      <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>לוג ווצאפ יומי — 50 אחרונים</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.cardSoft }}>
                {["שם", "טלפון", "יום", "נשלח", "סטטוס"].map((h) => (
                  <th key={h} style={{ ...cell, fontWeight: 700, fontSize: 12, color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={5} style={{ ...cell, textAlign: "center", color: C.muted }}>אין שליחות עדיין</td></tr>
              )}
              {logs.map((l, i) => {
                const u = l.challenge_enrollments?.users;
                const isSent = l.status === "sent";
                return (
                  <tr key={i} style={{ background: "transparent" }}>
                    <td style={cell}>{u?.name ?? "—"}</td>
                    <td style={{ ...cell, direction: "ltr", fontSize: 12, color: C.muted }}>{u?.phone ?? "—"}</td>
                    <td style={{ ...cell, fontWeight: 800, color: C.gold }}>יום {l.day_number}</td>
                    <td style={{ ...cell, fontSize: 12, color: C.muted }}>{fmtDate(l.sent_at)}</td>
                    <td style={cell}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                        background: isSent ? `${C.green}20` : `${C.red}20`,
                        color: isSent ? C.green : C.red,
                      }}>
                        {isSent ? "נשלח" : "נכשל"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
