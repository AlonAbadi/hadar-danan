"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  status:      string;
  source_utm:  Record<string, string> | null;
  ip_address:  string | null;
  user_agent:  string | null;
  notes:       string | null;
  reviewed_at: string | null;
  created_at:  string;
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
  idea:  "העסק / הרעיון",
  stage: "מצב נוכחי ויעד",
  stuck: "נקודת התקיעה",
  give:  "מה מוכן לתת",
  why:   "למה עכשיו, למה איתנו",
};

const ANSWER_ORDER = ["idea", "stage", "stuck", "give", "why"];

function scoreColor(score: number): string {
  if (score >= 70) return "#34A853";
  if (score >= 45) return "#E8B94A";
  return "#9E9990";
}

function dateLong(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function whatsappLink(phone: string): string {
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "972");
  return `https://wa.me/${normalized}`;
}

export default function StageAppDetailPage() {
  const params  = useParams<{ id: string }>();
  const router  = useRouter();
  const id      = params?.id;

  const [app, setApp]               = useState<StageApp | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [notes, setNotes]           = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState<number | null>(null);

  const fetchApp = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stage/applications?id=${encodeURIComponent(id || "")}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const { application } = await res.json();
    setApp(application);
    setNotes(application?.notes ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchApp();
  }, [id, fetchApp]);

  const updateStatus = async (status: string) => {
    if (!app) return;
    setApp({ ...app, status });
    await fetch(`/api/admin/stage/applications?id=${app.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
  };

  const saveNotes = async () => {
    if (!app) return;
    setSavingNotes(true);
    await fetch(`/api/admin/stage/applications?id=${app.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ notes }),
    });
    setSavingNotes(false);
    setNotesSavedAt(Date.now());
    setTimeout(() => setNotesSavedAt(null), 2500);
  };

  if (loading) {
    return <Wrap><div style={{ color: "#9E9990" }}>טוען...</div></Wrap>;
  }
  if (notFound || !app) {
    return (
      <Wrap>
        <div style={{ color: "#9E9990", marginBottom: 16 }}>המועמדות לא נמצאה.</div>
        <Link href="/admin/stage" style={backLinkStyle}>← חזרה לרשימה</Link>
      </Wrap>
    );
  }

  const bd = app.score_breakdown;
  const dirty = notes !== (app.notes ?? "");

  return (
    <Wrap>
      <Link href="/admin/stage" style={backLinkStyle}>← חזרה לרשימה</Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${scoreColor(app.score)}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: scoreColor(app.score),
            background: "rgba(0,0,0,0.2)",
          }}>
            {app.score}
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#EDE9E1" }}>{app.name}</div>
            <div style={{ fontSize: 13, color: "#9E9990", marginTop: 4 }}>
              נשלח ב-{dateLong(app.created_at)}
              {app.reviewed_at && <> · עודכן ב-{dateLong(app.reviewed_at)}</>}
            </div>
          </div>
        </div>

        <select
          value={app.status}
          onChange={(e) => updateStatus(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            background: (STATUS_COLORS[app.status] ?? "#9E9990") + "18",
            color: STATUS_COLORS[app.status] ?? "#9E9990",
            border: `1px solid ${(STATUS_COLORS[app.status] ?? "#9E9990")}44`,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>

      {/* Two-column on wide screens, single on narrow */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: 20, marginTop: 28 }}>

        {/* Left: answers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {ANSWER_ORDER.map(k => {
            const v = app.answers[k];
            if (!v) return null;
            return (
              <Card key={k}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C9964A", letterSpacing: 2, marginBottom: 8 }}>
                  {ANSWER_LABELS[k] ?? k}
                </div>
                <div style={{ fontSize: 15, color: "#EDE9E1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {v}
                </div>
              </Card>
            );
          })}

          {/* Notes */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C9964A", letterSpacing: 2 }}>
                הערות פנימיות
              </div>
              {notesSavedAt && <span style={{ fontSize: 12, color: "#34A853" }}>נשמר ✓</span>}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="הערות לצוות (לא נשלח למועמד)"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                color: "#EDE9E1",
                border: "1px solid rgba(232,185,74,0.14)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={saveNotes}
              disabled={!dirty || savingNotes}
              style={{
                marginTop: 10,
                background: dirty ? "linear-gradient(90deg, #9E7C3A, #E8B94A)" : "rgba(255,255,255,0.06)",
                color: dirty ? "#080C14" : "#9E9990",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: dirty && !savingNotes ? "pointer" : "not-allowed",
              }}
            >
              {savingNotes ? "שומר..." : "שמירת הערות"}
            </button>
          </Card>
        </div>

        {/* Right: meta panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* Contact */}
          <Card>
            <SectionLabel>יצירת קשר</SectionLabel>
            {app.email && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#9E9990" }}>אימייל</div>
                <a href={`mailto:${app.email}`} style={linkStyle} dir="ltr">{app.email}</a>
              </div>
            )}
            {app.phone && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "#9E9990" }}>טלפון</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 2 }}>
                  <a href={`tel:${app.phone}`} style={linkStyle} dir="ltr">{app.phone}</a>
                  <a href={whatsappLink(app.phone)} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 12, color: "#25D366", border: "1px solid rgba(37,211,102,0.35)",
                    padding: "2px 10px", borderRadius: 999, textDecoration: "none",
                  }}>
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
            {!app.email && !app.phone && (
              <div style={{ color: "#9E9990", fontSize: 13, marginTop: 8 }}>לא סופקו פרטי קשר</div>
            )}
          </Card>

          {/* Score breakdown */}
          {bd && (
            <Card>
              <SectionLabel>ציון מחויבות</SectionLabel>
              <ScoreBar label="עומק"     value={bd.depth}       max={40} />
              <ScoreBar label="ספציפיות" value={bd.specificity} max={30} />
              <ScoreBar label="מחויבות"  value={bd.commitment}  max={30} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid #2C323E" }}>
                <span style={{ fontSize: 13, color: "#9E9990" }}>סה״כ</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(app.score) }}>{app.score}/100</span>
              </div>
              {(bd.totalLen !== undefined || bd.hits !== undefined) && (
                <div style={{ fontSize: 11, color: "#9E9990", marginTop: 8, lineHeight: 1.6 }}>
                  {bd.totalLen !== undefined && <>סה״כ תווים: {bd.totalLen} </>}
                  {bd.hits !== undefined && <>· מילות מחויבות: {bd.hits}</>}
                </div>
              )}
            </Card>
          )}

          {/* UTM */}
          {app.source_utm && Object.keys(app.source_utm).length > 0 && (
            <Card>
              <SectionLabel>מקור (UTM)</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {Object.entries(app.source_utm).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#9E9990" }}>{k}</span>
                    <span style={{ color: "#EDE9E1", textAlign: "left", direction: "ltr", wordBreak: "break-all" }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Technical */}
          {(app.ip_address || app.user_agent) && (
            <Card>
              <SectionLabel>טכני</SectionLabel>
              {app.ip_address && (
                <div style={{ fontSize: 12, color: "#9E9990", marginTop: 8 }}>
                  IP: <span style={{ color: "#EDE9E1", direction: "ltr" }}>{app.ip_address}</span>
                </div>
              )}
              {app.user_agent && (
                <div style={{ fontSize: 12, color: "#9E9990", marginTop: 6, wordBreak: "break-all" }}>
                  UA: <span style={{ color: "#EDE9E1", direction: "ltr" }}>{app.user_agent}</span>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </Wrap>
  );

  // Suppress unused router lint warning in case of future use
  void router;
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{
      fontFamily: "var(--font-assistant), Assistant, sans-serif",
      minHeight: "100vh",
      background: "#0D1018",
      padding: 32,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#141820",
      border: "1px solid #2C323E",
      borderRadius: 14,
      padding: 20,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#C9964A", letterSpacing: 2 }}>
      {children}
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#EDE9E1" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#9E9990" }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, #9E7C3A, #E8B94A)",
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

const backLinkStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9E9990",
  fontSize: 13,
  textDecoration: "none",
  fontWeight: 600,
};

const linkStyle: React.CSSProperties = {
  color: "#E8B94A",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
  display: "inline-block",
  marginTop: 2,
};
