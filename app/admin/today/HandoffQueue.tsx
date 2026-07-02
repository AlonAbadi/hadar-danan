"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * לידים לטיפול מיידי — Hadar's daily WhatsApp worklist (source-agnostic).
 *
 * Two tabs:
 *   1. "תור"          — leads not yet contacted. Actions:
 *                       • "שלח ווטסאפ" opens wa.me with a pre-composed message
 *                         and stamps whatsapp_sent (moves to tab 2).
 *                       • "לא רלבנטי" stamps handoff_stage='dismissed' +
 *                         users.status='not_relevant' and removes from list.
 *   2. "נשלח ווטסאפ"  — leads Hadar already messaged. "סגר פגישה" stamps
 *                       meeting_booked. Once they also pay they drop off.
 *
 * Each card carries a context strip so Hadar can decide whether to reach out
 * BEFORE she clicks — contact, source, engagement recency, spend history, LLM
 * fit read, and a verbatim snippet from their strongest answer.
 */

export type HandoffStage = "queue" | "whatsapp_sent" | "meeting_booked" | "dismissed";

export interface LeadContext {
  email:              string | null;
  phone:              string | null;
  utmSource:          string | null;
  utmCampaign:        string | null;
  marketingConsent:   boolean;
  status:             string | null;
  lastActivityAt:     string | null;
  signupAt:           string | null;
  purchaseCount:      number;
  totalSpent:         number;
  routingConfidence:  number | null;
  commercialFit:      string | null;
  founderStage:       string | null;
  answerSnippet:      string | null;
  answers:            { q: string; a: string }[];
  signalPromise:      string | null;
  element:            string | null;
  people:             string | null;
  painSource:         string | null;
}

export interface LeadDecision {
  tone:   "strong" | "medium" | "weak";
  label:  string;
  points: string[];
}

export interface HandoffLeadView {
  userId:     string;
  name:       string;
  occupation: string | null;
  source:     "signal" | "quiz";
  reason:     string;
  at:         string;
  stage:      HandoffStage;
  waPhone:    string | null;
  waText:     string;
  userHref:   string;
  context:    LeadContext;
  decision:   LeadDecision;
}

const C = {
  bg: "#0D1018", card: "#141820", cardSoft: "#1D2430",
  fg: "#EDE9E1", muted: "#AAB0BD", gold: "#E8B94A", goldM: "#C9964A",
  line: "#2C323E", lineGold: "rgba(232,185,74,0.30)",
  wa: "#25D366", green: "#7FD49B", blue: "#7FB2F2", red: "#E67373",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
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

function formatMoney(n: number): string {
  return "₪" + n.toLocaleString("he-IL");
}

async function postStage(
  userId: string,
  stage: "whatsapp_sent" | "meeting_booked" | "dismissed",
): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/handoff", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: userId, stage }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function postMarkPaid(userId: string, amount: number): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/mark-paid", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: userId, amount }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Context strip ────────────────────────────────────────────────
// The compact info row rendered under each lead's name/reason. Every chip
// speaks a distinct decision-signal: can I reach them (contact), where they
// came from (utm), how warm they are (engagement + past spend), how much the
// engine trusts the fit (routing confidence + commercial fit), and their own
// voice (verbatim snippet).

function Chip({
  label, value, tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "gold" | "green" | "red" | "blue";
}) {
  const colors: Record<string, { fg: string; bg: string; bd: string }> = {
    neutral: { fg: C.muted,  bg: "rgba(255,255,255,0.03)", bd: C.line             },
    gold:    { fg: C.gold,   bg: "rgba(232,185,74,0.08)",  bd: C.lineGold         },
    green:   { fg: C.green,  bg: "rgba(127,212,155,0.08)", bd: "rgba(127,212,155,0.28)" },
    red:     { fg: C.red,    bg: "rgba(230,115,115,0.08)", bd: "rgba(230,115,115,0.28)" },
    blue:    { fg: C.blue,   bg: "rgba(127,178,242,0.08)", bd: "rgba(127,178,242,0.28)" },
  };
  const t = colors[tone];
  return (
    <span style={{
      display:        "inline-flex", alignItems: "center", gap: 6,
      padding:        "3px 9px", borderRadius: 8,
      background:     t.bg, border: `1px solid ${t.bd}`,
      fontSize:       11.5, lineHeight: 1.35, color: t.fg,
      whiteSpace:     "nowrap",
    }}>
      <span style={{ opacity: 0.68, fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  lead:             "ליד",
  engaged:          "מעורב",
  high_intent:      "כוונה גבוהה",
  buyer:            "קונה",
  booked:           "פגישה",
  premium_lead:     "פרמיום",
  partnership_lead: "שותפות",
  handled:          "טופל",
  not_relevant:     "לא רלוונטי",
};

const FIT_LABEL: Record<string, string> = {
  high:    "גבוהה",
  medium:  "בינונית",
  low:     "נמוכה",
  unclear: "לא ברור",
};

const FIT_TONE: Record<string, "green" | "gold" | "red" | "neutral"> = {
  high:    "green",
  medium:  "gold",
  low:     "red",
  unclear: "neutral",
};

const FOUNDER_LABEL: Record<string, string> = {
  exploring:   "בתחילת הדרך",
  practicing:  "מתרגל/ת",
  scaling:     "בצמיחה",
  established: "מבוסס/ת",
};

function ContextStrip({ ctx }: { ctx: LeadContext }) {
  const waLink = ctx.phone
    ? "https://wa.me/" + ctx.phone.replace(/\D/g, "").replace(/^0/, "972")
    : null;

  const utmDisplay =
    ctx.utmSource
      ? ctx.utmSource + (ctx.utmCampaign ? ` · ${ctx.utmCampaign}` : "")
      : "אורגני";

  const fitTone = ctx.commercialFit ? FIT_TONE[ctx.commercialFit] ?? "neutral" : "neutral";
  const statusTone: "gold" | "green" | "neutral" =
    ctx.status === "buyer" || ctx.status === "booked" ? "green" :
    ctx.status === "high_intent" || ctx.status === "premium_lead" || ctx.status === "partnership_lead" ? "gold" :
    "neutral";

  return (
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {/* Contact */}
      {ctx.phone && (
        <a
          href={`tel:${ctx.phone}`}
          style={{ textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Chip label="טלפון" value={ctx.phone} tone="neutral" />
        </a>
      )}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Chip label="WA" value="פתח" tone="green" />
        </a>
      )}
      {ctx.email && (
        <a
          href={`mailto:${ctx.email}`}
          style={{ textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Chip label="מייל" value={ctx.email} tone="neutral" />
        </a>
      )}

      {/* CRM status */}
      {ctx.status && STATUS_LABEL[ctx.status] && (
        <Chip label="סטטוס" value={STATUS_LABEL[ctx.status]} tone={statusTone} />
      )}

      {/* Acquisition */}
      <Chip label="מקור" value={utmDisplay} tone={ctx.utmSource ? "blue" : "neutral"} />

      {/* Marketing consent */}
      <Chip
        label="הסכמה"
        value={ctx.marketingConsent ? "כן" : "לא"}
        tone={ctx.marketingConsent ? "green" : "red"}
      />

      {/* Engagement recency */}
      {ctx.lastActivityAt && (
        <Chip label="פעילות" value={relativeTime(ctx.lastActivityAt)} tone="neutral" />
      )}

      {/* Signup age */}
      {ctx.signupAt && (
        <Chip label="נרשם" value={relativeTime(ctx.signupAt)} tone="neutral" />
      )}

      {/* Spend history */}
      {ctx.purchaseCount > 0 && (
        <Chip
          label={`${ctx.purchaseCount} רכישות`}
          value={formatMoney(ctx.totalSpent)}
          tone="gold"
        />
      )}

      {/* LLM routing verdict — signal path only */}
      {typeof ctx.routingConfidence === "number" && (
        <Chip
          label="ביטחון LLM"
          value={`${Math.round(ctx.routingConfidence * 100)}%`}
          tone={ctx.routingConfidence >= 0.7 ? "green" : ctx.routingConfidence >= 0.5 ? "gold" : "neutral"}
        />
      )}
      {ctx.commercialFit && FIT_LABEL[ctx.commercialFit] && (
        <Chip label="התאמה" value={FIT_LABEL[ctx.commercialFit]} tone={fitTone} />
      )}
      {ctx.founderStage && FOUNDER_LABEL[ctx.founderStage] && (
        <Chip label="שלב" value={FOUNDER_LABEL[ctx.founderStage]} tone="neutral" />
      )}
    </div>
  );
}

// One-line decision read at the top of the card — the whole picture at a glance.
function DecisionLine({ decision }: { decision: LeadDecision }) {
  const color = decision.tone === "strong" ? C.green : decision.tone === "medium" ? C.gold : C.red;
  const bg    = decision.tone === "strong" ? "rgba(127,212,155,0.10)" : decision.tone === "medium" ? "rgba(232,185,74,0.10)" : "rgba(230,115,115,0.10)";
  const dot   = decision.tone === "strong" ? "🟢" : decision.tone === "medium" ? "🟡" : "🔴";
  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{
        fontSize: 12.5, fontWeight: 800, color,
        background: bg, border: `1px solid ${color}55`, borderRadius: 999, padding: "3px 12px",
      }}>
        {dot} {decision.label}
      </span>
      {decision.points.length > 0 && (
        <span style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{decision.points.join(" · ")}</span>
      )}
    </div>
  );
}

function AnswerSnippet({ snippet }: { snippet: string }) {
  return (
    <div style={{
      marginTop: 10,
      padding: "8px 12px",
      background: "rgba(232,185,74,0.04)",
      border: `1px solid ${C.lineGold}`,
      borderRadius: 8,
      fontSize: 12.5,
      lineHeight: 1.55,
      color: C.muted,
      fontStyle: "italic",
    }}>
      <span style={{ color: C.goldM, fontWeight: 700, fontStyle: "normal" }}>מהתשובות שלו/ה: </span>
      &ldquo;{snippet}&rdquo;
    </div>
  );
}

// Decision context — the engine's CONCISE read (4 short lines) by default, so
// it's scannable, not a wall of text. The raw questionnaire answers are one more
// click away for the rare deep-dive.
function LeadDetail({ ctx }: { ctx: LeadContext }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const signalRows: { label: string; value: string }[] = [];
  if (ctx.painSource)    signalRows.push({ label: "מאיפה הגיע/ה", value: ctx.painSource });
  if (ctx.signalPromise) signalRows.push({ label: "מה האות מבטיח", value: ctx.signalPromise });
  if (ctx.element)       signalRows.push({ label: "האלמנט", value: ctx.element });
  if (ctx.people)        signalRows.push({ label: "הקהל", value: ctx.people });
  return (
    <div style={{
      marginTop: 10, padding: "14px 16px", background: "rgba(8,12,20,0.55)",
      border: `1px solid ${C.line}`, borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      {signalRows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {signalRows.map((r) => (
            <div key={r.label}>
              <div style={{ fontSize: 11.5, color: C.goldM, fontWeight: 700, marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 13, color: C.fg, lineHeight: 1.55 }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}
      {ctx.answers.length > 0 && (
        <div style={{ borderTop: signalRows.length ? `1px solid ${C.line}` : undefined, paddingTop: signalRows.length ? 12 : 0 }}>
          <button
            onClick={() => setShowAnswers((v) => !v)}
            style={{
              cursor: "pointer", background: "transparent", border: "none",
              color: C.muted, fontSize: 12, fontWeight: 700, padding: 0, fontFamily: "inherit",
            }}
          >
            {showAnswers ? "הסתר את התשובות המלאות ↑" : "+ התשובות המלאות בשאלון"}
          </button>
          {showAnswers && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 11 }}>
              {ctx.answers.map((a, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, color: C.goldM, marginBottom: 3 }}>{a.q}</div>
                  <div style={{ fontSize: 13, color: C.fg, lineHeight: 1.6 }}>&ldquo;{a.a}&rdquo;</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function HandoffQueue({ leads }: { leads: HandoffLeadView[] }) {
  const [rows, setRows] = useState<HandoffLeadView[]>(leads);
  const [tab, setTab]   = useState<"queue" | "sent" | "dismissed">("queue");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = (userId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });

  const queue = useMemo(() => rows.filter((r) => r.stage === "queue"), [rows]);
  const sent  = useMemo(
    () => rows.filter((r) => r.stage === "whatsapp_sent" || r.stage === "meeting_booked"),
    [rows],
  );
  const dismissed = useMemo(() => rows.filter((r) => r.stage === "dismissed"), [rows]);

  const setStage = (userId: string, stage: HandoffStage) =>
    setRows((prev) => prev.map((r) => (r.userId === userId ? { ...r, stage } : r)));


  const onSendWhatsApp = async (lead: HandoffLeadView) => {
    if (lead.waPhone) {
      window.open(`https://wa.me/${lead.waPhone}?text=${encodeURIComponent(lead.waText)}`, "_blank", "noopener");
    }
    setBusy(lead.userId);
    setStage(lead.userId, "whatsapp_sent"); // optimistic
    const ok = await postStage(lead.userId, "whatsapp_sent");
    if (!ok) setStage(lead.userId, "queue"); // revert on failure
    setBusy(null);
  };

  const onDismiss = async (lead: HandoffLeadView) => {
    // Two-tap confirm so a mis-click doesn't remove someone. Uses native
    // confirm to keep the code footprint tiny — admin surface only.
    if (!window.confirm(`להסיר את ${lead.name} מהרשימה? הליד יסומן כלא רלוונטי.`)) return;

    setBusy(lead.userId);
    setStage(lead.userId, "dismissed"); // optimistic → moves to the "לא רלבנטי" folder
    const ok = await postStage(lead.userId, "dismissed");
    if (!ok) setStage(lead.userId, "queue"); // revert
    setBusy(null);
  };

  const onBooked = async (lead: HandoffLeadView) => {
    setBusy(lead.userId);
    setStage(lead.userId, "meeting_booked"); // optimistic
    const ok = await postStage(lead.userId, "meeting_booked");
    if (!ok) setStage(lead.userId, "whatsapp_sent"); // revert on failure
    setBusy(null);
  };

  // Paid outside Cardcom (bank transfer). Records a completed purchase + books
  // the lead → drops from the live list (paid + booked).
  const onMarkPaid = async (lead: HandoffLeadView) => {
    const input = window.prompt(`סכום ששולם בהעברה בנקאית עבור ${lead.name} (₪):`, "4000");
    if (input === null) return;
    const amount = Number(input.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) { window.alert("סכום לא תקין"); return; }
    setBusy(lead.userId);
    const prev = rows;
    setRows((p) => p.filter((r) => r.userId !== lead.userId)); // optimistic — paid+booked drops
    const ok = await postMarkPaid(lead.userId, amount);
    if (!ok) setRows(prev);
    setBusy(null);
  };

  const list = tab === "queue" ? queue : tab === "sent" ? sent : dismissed;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {([["queue", "תור", queue.length], ["sent", "נשלח ווטסאפ", sent.length], ["dismissed", "לא רלבנטי", dismissed.length]] as const).map(([key, label, count]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                cursor: "pointer", fontSize: 14, fontWeight: 700,
                padding: "8px 18px", borderRadius: 999,
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
        <div style={{ color: C.muted, fontSize: 14, padding: "40px 0", textAlign: "center", border: `1px dashed ${C.line}`, borderRadius: 12 }}>
          {tab === "queue" ? "אין לידים בתור כרגע." : tab === "sent" ? "עדיין לא נשלחו הודעות ווטסאפ." : "אין לידים שסומנו כלא רלוונטיים."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((lead) => (
            <div key={lead.userId} style={{
              background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.fg }}>{lead.name}</span>
                    {/* source badge */}
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3,
                      color: lead.source === "signal" ? C.gold : C.blue,
                      background: lead.source === "signal" ? "rgba(232,185,74,0.10)" : "rgba(127,178,242,0.10)",
                      border: `1px solid ${lead.source === "signal" ? C.lineGold : "rgba(127,178,242,0.30)"}`,
                      borderRadius: 999, padding: "2px 9px",
                    }}>{lead.source === "signal" ? "אות" : "קוויז"}</span>
                    {lead.occupation && (
                      <span style={{
                        fontSize: 11, color: C.goldM, background: "rgba(232,185,74,0.06)",
                        border: `1px solid ${C.lineGold}`, borderRadius: 999, padding: "2px 9px",
                      }}>{lead.occupation}</span>
                    )}
                    <span style={{ fontSize: 12, color: C.muted }}>{relativeTime(lead.at)}</span>
                    {lead.stage === "meeting_booked" && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: C.green,
                        background: "rgba(127,212,155,0.10)", border: "1px solid rgba(127,212,155,0.30)",
                        borderRadius: 999, padding: "2px 9px",
                      }}>סגר פגישה · ממתין לתשלום</span>
                    )}
                  </div>
                  <DecisionLine decision={lead.decision} />
                  <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: C.fg }}>{lead.reason}</p>

                  {/* Rich decision-support strip */}
                  <ContextStrip ctx={lead.context} />

                  {lead.context.answerSnippet && (
                    <AnswerSnippet snippet={lead.context.answerSnippet} />
                  )}

                  {(lead.context.answers.length > 0 || lead.context.signalPromise || lead.context.people) && (
                    <>
                      <button
                        onClick={() => toggleExpand(lead.userId)}
                        style={{
                          marginTop: 10, cursor: "pointer", background: "transparent",
                          border: `1px solid ${C.line}`, borderRadius: 8,
                          color: C.goldM, fontSize: 12.5, fontWeight: 700,
                          padding: "6px 12px", fontFamily: "inherit",
                        }}
                      >
                        {expanded.has(lead.userId) ? "הסתר ↑" : "האות המלא ↓"}
                      </button>
                      {expanded.has(lead.userId) && <LeadDetail ctx={lead.context} />}
                    </>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "stretch", minWidth: 155 }}>
                  {tab === "queue" && (
                    <>
                      <button
                        onClick={() => onSendWhatsApp(lead)}
                        disabled={busy === lead.userId || !lead.waPhone}
                        title={lead.waPhone ? "פתיחת ווטסאפ עם הודעה מוכנה" : "אין מספר טלפון"}
                        style={{
                          cursor: lead.waPhone ? "pointer" : "not-allowed", opacity: lead.waPhone ? 1 : 0.5,
                          background: C.wa, color: "#0b141a", fontWeight: 800, fontSize: 13.5,
                          padding: "10px 14px", borderRadius: 9, border: "none",
                        }}
                      >
                        {busy === lead.userId ? "…" : "שלח ווטסאפ ←"}
                      </button>
                      <button
                        onClick={() => onDismiss(lead)}
                        disabled={busy === lead.userId}
                        title="הסרה מהרשימה — יסומן כלא רלוונטי"
                        style={{
                          cursor: "pointer",
                          background: "transparent",
                          color: C.red,
                          fontWeight: 700, fontSize: 12.5,
                          padding: "8px 14px", borderRadius: 9,
                          border: `1px solid rgba(230,115,115,0.35)`,
                        }}
                      >
                        לא רלבנטי ✕
                      </button>
                    </>
                  )}
                  {tab === "sent" && lead.stage === "whatsapp_sent" && (
                    <button
                      onClick={() => onBooked(lead)}
                      disabled={busy === lead.userId}
                      style={{
                        cursor: "pointer", background: "rgba(127,212,155,0.12)", color: C.green,
                        fontWeight: 800, fontSize: 13.5, padding: "10px 14px", borderRadius: 9,
                        border: "1px solid rgba(127,212,155,0.35)",
                      }}
                    >
                      {busy === lead.userId ? "…" : "סגר פגישה ✓"}
                    </button>
                  )}
                  {(tab === "queue" || tab === "sent") && (
                    <button
                      onClick={() => onMarkPaid(lead)}
                      disabled={busy === lead.userId}
                      title="שילם/ה מחוץ למערכת (העברה בנקאית) — רישום כתשלום שהתקבל"
                      style={{
                        cursor: "pointer", background: "transparent", color: C.gold,
                        fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 9,
                        border: `1px solid ${C.lineGold}`,
                      }}
                    >
                      שילם/ה בהעברה ✓
                    </button>
                  )}
                  <Link href={lead.userHref} style={{
                    fontSize: 12.5, color: C.goldM, textDecoration: "none", textAlign: "center",
                    padding: "8px 14px", borderRadius: 9, border: `1px solid ${C.line}`,
                  }}>פתח פרופיל ←</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
