"use client";

import { useState } from "react";

/**
 * Internal gap-read review row. Shows the engine's read on one extraction and
 * lets a human reviewer (Hadar / rav / Yemima teacher) mark a verdict. NEVER
 * user-facing. "harmful" is the hard gate.
 */

export interface GapRow {
  id:          string;
  name:        string;
  q3:          string;
  q5:          string;
  present:     string | null;
  seam:        string | null;
  safety:      string | null;
  confidence:  number | null;
  reading:     string | null;
  crossing:    string | null;
  evidence:    { claim: string; span: string; source: string }[];
  signals:     Record<string, unknown> | null;
  verdict:     string | null;
  computedAt:  string | null;
}

const C = {
  bg: "#0D1018", card: "#141820", soft: "#1D2430", fg: "#EDE9E1", muted: "#AAB0BD",
  gold: "#E8B94A", goldM: "#C9964A", line: "#2C323E", green: "#7FD49B", red: "#E67373", blue: "#7FB2F2",
};

const PRESENT_LABEL: Record<string, { t: string; c: string }> = {
  yes:     { t: "פער · yes",     c: C.gold },
  partial: { t: "פער · partial", c: C.goldM },
  no:      { t: "אין פער",       c: C.green },
  abstain: { t: "נמנע",          c: C.muted },
};
const SAFETY_LABEL: Record<string, { t: string; c: string }> = {
  ok:          { t: "בטוח",      c: C.green },
  caution:     { t: "זהירות",    c: C.goldM },
  do_not_name: { t: "לא לנקוב",  c: C.red },
};

async function postVerdict(id: string, verdict: string, note: string): Promise<boolean> {
  try {
    const r = await fetch("/api/admin/signal/gap-review", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verdict, note }),
    });
    return r.ok;
  } catch { return false; }
}

export default function GapReviewClient({ rows }: { rows: GapRow[] }) {
  const [state, setState] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.id, r.verdict ?? ""])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const mark = async (id: string, verdict: string) => {
    setBusy(id);
    const ok = await postVerdict(id, verdict, notes[id] ?? "");
    if (ok) setState((s) => ({ ...s, [id]: verdict }));
    setBusy(null);
  };

  const verdicts: [string, string, string][] = [
    ["precise", "מדויק", C.green],
    ["close", "קרוב", C.goldM],
    ["missed", "פספס", C.muted],
    ["harmful", "מזיק ⚠", C.red],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r) => {
        const p = r.present ? PRESENT_LABEL[r.present] : null;
        const s = r.safety ? SAFETY_LABEL[r.safety] : null;
        const cur = state[r.id];
        return (
          <div key={r.id} style={{ background: C.card, border: `1px solid ${cur === "harmful" ? "rgba(230,115,115,0.5)" : C.line}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
                {p && <Chip t={p.t} c={p.c} />}
                {r.seam && <Chip t={r.seam} c={C.blue} />}
                {s && <Chip t={s.t} c={s.c} />}
                {typeof r.confidence === "number" && <Chip t={`ביטחון ${r.confidence.toFixed(2)}`} c={C.muted} />}
              </div>
              {cur && <span style={{ fontSize: 12, color: verdicts.find((v) => v[0] === cur)?.[2] ?? C.muted, fontWeight: 700 }}>סומן: {verdicts.find((v) => v[0] === cur)?.[1]}</span>}
            </div>

            {/* The read */}
            {r.reading ? (
              <div style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{r.reading}</p>
                {r.crossing && <p style={{ margin: "6px 0 0", fontSize: 13, color: C.goldM }}>המעבר: {r.crossing}</p>}
                {r.evidence?.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
                    עוגן: {r.evidence.map((e, i) => <span key={i}>“{e.span}” </span>)}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontStyle: "italic" }}>
                {r.present === "no" ? "אין פער — לאשר את המתנה." : r.safety === "do_not_name" ? "רצפת מצוקה — לא לנקוב." : "המנוע נמנע (אין די אות ברור)."}
                {r.signals && <span style={{ opacity: 0.7 }}> · {JSON.stringify(r.signals)}</span>}
              </div>
            )}

            {/* The raw answers for the reviewer to judge against */}
            <details style={{ marginBottom: 8 }}>
              <summary style={{ cursor: "pointer", fontSize: 12.5, color: C.muted, listStyle: "none" }}>הצג תשובות 3 + 5 ←</summary>
              <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: C.fg }}>
                <b style={{ color: C.goldM }}>ש3:</b> {r.q3}<br />
                <b style={{ color: C.goldM }}>ש5:</b> {r.q5}
              </div>
            </details>

            {/* Review controls */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {verdicts.map(([v, label, color]) => (
                <button key={v} onClick={() => mark(r.id, v)} disabled={busy === r.id}
                  style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: cur === v ? "#0D1018" : color,
                    background: cur === v ? color : "transparent", border: `1px solid ${color}`, borderRadius: 8, padding: "5px 12px" }}>
                  {label}
                </button>
              ))}
              <input value={notes[r.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                placeholder="הערה (למה)…" style={{ flex: 1, minWidth: 160, fontSize: 12.5, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.soft, color: C.fg }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chip({ t, c }: { t: string; c: string }) {
  return <span style={{ fontSize: 11.5, fontWeight: 700, color: c, border: `1px solid ${c}55`, background: `${c}18`, borderRadius: 999, padding: "2px 9px" }}>{t}</span>;
}
