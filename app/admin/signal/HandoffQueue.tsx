"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * תור האות — Hadar's manual WhatsApp handoff worklist.
 *
 * Two tabs:
 *   1. "תור"          — strategy leads not yet contacted. Button "שלח ווטסאפ"
 *                       opens wa.me with a message pre-composed from their signal,
 *                       and stamps stage=whatsapp_sent (moves them to tab 2).
 *   2. "נשלח ווטסאפ"  — leads Hadar already messaged. Button "סגר פגישה" stamps
 *                       stage=meeting_booked. Once they also PAY (completed
 *                       purchase, computed server-side) they drop off the list.
 *
 * All tracking is manual by design — the system only removes paid+booked leads.
 */

export type HandoffStage = "queue" | "whatsapp_sent" | "meeting_booked";

export interface HandoffLeadView {
  id:         string;
  name:       string;
  occupation: string | null;
  signal:     string;
  generatedAt: string;
  stage:      HandoffStage;
  waPhone:    string | null;
  waText:     string;
  userHref:   string | null;
}

const C = {
  bg: "#0D1018", card: "#141820", cardSoft: "#1D2430",
  fg: "#EDE9E1", muted: "#AAB0BD", gold: "#E8B94A", goldM: "#C9964A",
  line: "#2C323E", lineGold: "rgba(232,185,74,0.30)",
  wa: "#25D366", green: "#7FD49B",
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

async function postStage(id: string, stage: "whatsapp_sent" | "meeting_booked"): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/signal/handoff", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, stage }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function HandoffQueue({ leads }: { leads: HandoffLeadView[] }) {
  const [rows, setRows] = useState<HandoffLeadView[]>(leads);
  const [tab, setTab]   = useState<"queue" | "sent">("queue");
  const [busy, setBusy] = useState<string | null>(null);

  const queue = useMemo(() => rows.filter((r) => r.stage === "queue"), [rows]);
  const sent  = useMemo(
    () => rows.filter((r) => r.stage === "whatsapp_sent" || r.stage === "meeting_booked"),
    [rows],
  );

  const setStage = (id: string, stage: HandoffStage) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, stage } : r)));

  const onSendWhatsApp = async (lead: HandoffLeadView) => {
    // Open WhatsApp first (must be inside the click gesture so the popup isn't blocked).
    if (lead.waPhone) {
      window.open(`https://wa.me/${lead.waPhone}?text=${encodeURIComponent(lead.waText)}`, "_blank", "noopener");
    }
    setBusy(lead.id);
    setStage(lead.id, "whatsapp_sent"); // optimistic
    const ok = await postStage(lead.id, "whatsapp_sent");
    if (!ok) setStage(lead.id, "queue"); // revert on failure
    setBusy(null);
  };

  const onBooked = async (lead: HandoffLeadView) => {
    setBusy(lead.id);
    setStage(lead.id, "meeting_booked"); // optimistic
    const ok = await postStage(lead.id, "meeting_booked");
    if (!ok) setStage(lead.id, "whatsapp_sent"); // revert on failure
    setBusy(null);
  };

  const list = tab === "queue" ? queue : sent;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.lineGold}`, borderRadius: 16,
      padding: "18px 18px 20px", marginBottom: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.gold }}>תור האות — לידים לשיחה</div>
      </div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
        לידים שהמנוע סימן כשווי-פגישה. לחיצה על "שלח ווטסאפ" מנסחת הודעה אישית מהדר ומעבירה ל"נשלח ווטסאפ".
        מי שסגר פגישה ושילם — יורד מהרשימה אוטומטית.
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {([["queue", "תור", queue.length], ["sent", "נשלח ווטסאפ", sent.length]] as const).map(([key, label, count]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                cursor: "pointer", fontSize: 13.5, fontWeight: 700,
                padding: "7px 16px", borderRadius: 999,
                border: `1px solid ${active ? C.lineGold : C.line}`,
                background: active ? "rgba(232,185,74,0.10)" : "transparent",
                color: active ? C.gold : C.muted,
              }}
            >
              {label} · {count}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13.5, padding: "28px 0", textAlign: "center", border: `1px dashed ${C.line}`, borderRadius: 12 }}>
          {tab === "queue" ? "אין לידים בתור כרגע." : "עדיין לא נשלחו הודעות ווטסאפ."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((lead) => (
            <div key={lead.id} style={{
              background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 15px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15.5, fontWeight: 700, color: C.fg }}>{lead.name}</span>
                    {lead.occupation && (
                      <span style={{
                        fontSize: 11, color: C.goldM, background: "rgba(232,185,74,0.08)",
                        border: `1px solid ${C.lineGold}`, borderRadius: 999, padding: "2px 9px",
                      }}>{lead.occupation}</span>
                    )}
                    <span style={{ fontSize: 12, color: C.muted }}>{relativeTime(lead.generatedAt)}</span>
                    {lead.stage === "meeting_booked" && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: C.green,
                        background: "rgba(127,212,155,0.10)", border: "1px solid rgba(127,212,155,0.30)",
                        borderRadius: 999, padding: "2px 9px",
                      }}>סגר פגישה · ממתין לתשלום</span>
                    )}
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: C.fg }}>{lead.signal}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "stretch", minWidth: 150 }}>
                  {tab === "queue" && (
                    <button
                      onClick={() => onSendWhatsApp(lead)}
                      disabled={busy === lead.id || !lead.waPhone}
                      title={lead.waPhone ? "פתיחת ווטסאפ עם הודעה מוכנה" : "אין מספר טלפון"}
                      style={{
                        cursor: lead.waPhone ? "pointer" : "not-allowed", opacity: lead.waPhone ? 1 : 0.5,
                        background: C.wa, color: "#0b141a", fontWeight: 800, fontSize: 13,
                        padding: "9px 14px", borderRadius: 9, border: "none",
                      }}
                    >
                      {busy === lead.id ? "…" : "שלח ווטסאפ ←"}
                    </button>
                  )}
                  {tab === "sent" && lead.stage === "whatsapp_sent" && (
                    <button
                      onClick={() => onBooked(lead)}
                      disabled={busy === lead.id}
                      style={{
                        cursor: "pointer", background: "rgba(127,212,155,0.12)", color: C.green,
                        fontWeight: 800, fontSize: 13, padding: "9px 14px", borderRadius: 9,
                        border: "1px solid rgba(127,212,155,0.35)",
                      }}
                    >
                      {busy === lead.id ? "…" : "סגר פגישה ✓"}
                    </button>
                  )}
                  {lead.userHref && (
                    <Link href={lead.userHref} style={{
                      fontSize: 12.5, color: C.goldM, textDecoration: "none", textAlign: "center",
                      padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.line}`,
                    }}>פתח פרופיל ←</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
