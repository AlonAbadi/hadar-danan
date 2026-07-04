/**
 * /admin/kriah — the v2 funnel control panel (wave 5).
 *
 * North-star metrics per BUILD_SPEC §11:
 *   - S7 commit rate (the fork → six-questions transition)
 *   - Ending distribution (concierge volume vs the expected 4-5/week)
 *   - Per-screen drop-off from FUNNEL_STEP events
 *   - couldnt_pay_rate placeholder (fills as premium_outcomes accumulates)
 *
 * Test traffic (is_test) is counted SEPARATELY and clearly labeled — during
 * the hidden phase, most traffic here will be test runs.
 */
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const C = {
  bg: "#0D1018", card: "#141820", gold: "#E8B94A", goldMid: "#C9964A",
  fg: "#EDE9E1", muted: "#9E9990", line: "#2C323E",
};

// The 2026-07-04 flow (gate moved before the letter): each row aggregates
// the FUNNEL_STEP names that mean "reached/completed this stage".
const STEP_ROWS: { label: string; keys: string[] }[] = [
  { label: "כניסה",            keys: ["s1"] },
  { label: "מצב עסק",          keys: ["s2_state"] },
  { label: "חסם",              keys: ["s3_blocker"] },
  { label: "מה ישתנה",         keys: ["s4_change"] },
  { label: "התמונה",           keys: ["s6_reading"] },
  { label: "המזלג",            keys: ["s7_fork"] },
  { label: "גשר + שמירת מייל", keys: ["s8_bridge"] },
  { label: "שאלה 1",           keys: ["q1_flow_zone"] },
  { label: "שאלה 2",           keys: ["q2_effortless_mastery"] },
  { label: "שאלה 3",           keys: ["q3_gratitude_mirror"] },
  { label: "שאלה 4",           keys: ["q4_hard_period", "q4_hard_period_skipped"] },
  { label: "שאלה 5",           keys: ["q5_what_helped"] },
  { label: "שאלה 6",           keys: ["q6_message_to_past"] },
  { label: "שער טלפון",        keys: ["s15_phone_gate"] },
  { label: "מסך המשלוח",       keys: ["sendgate"] },
  { label: "האות (סיום)",      keys: ["s16_full_reading"] },
];

const ENDING_LABELS: Record<string, string> = {
  concierge:   "קונסיירז' (רותח)",
  hive:        "כוורת (מייל יום-2)",
  pre_revenue: "טרום-הכנסה",
  crisis_soft: "סוף רך (משבר)",
};

export default async function AdminKriahPage() {
  const supabase = createServerClient();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [extRes, stepRes, outcomeRes] = await Promise.all([
    safeFrom(supabase, "signal_extractions")
      .select("id, routed_ending, evidence_score, key1_declared, is_test, generated_at")
      .eq("instrument_version", "v2_funnel")
      .order("generated_at", { ascending: false })
      .limit(500),
    safeFrom(supabase, "events")
      .select("metadata, is_test, created_at")
      .eq("type", "FUNNEL_STEP")
      .gte("created_at", twoWeeksAgo)
      .limit(5000),
    safeFrom(supabase, "premium_outcomes")
      .select("could_pay, showed_up, purchased, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  type Ext = { routed_ending: string | null; evidence_score: number | null; key1_declared: string | null; is_test: boolean };
  const exts = (extRes.data ?? []) as Ext[];
  const real = exts.filter((e) => !e.is_test);
  const test = exts.filter((e) => e.is_test);

  const endingCounts = (rows: Ext[]) => {
    const m: Record<string, number> = {};
    for (const e of rows) {
      const k = e.routed_ending ?? "—";
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  };

  // FUNNEL_STEP dropoff: count unique-ish step hits (raw counts are fine at
  // this volume; per-visitor dedup comes with real traffic).
  type Ev = { metadata: { step?: string; is_test?: boolean } | null; is_test: boolean };
  const steps = (stepRes.data ?? []) as Ev[];
  const stepCounts: Record<string, { real: number; test: number }> = {};
  for (const ev of steps) {
    const step = ev.metadata?.step ?? "";
    const key = step.startsWith("q") && step.length <= 3 ? step : step;
    if (!key) continue;
    const isT = ev.is_test === true || ev.metadata?.is_test === true;
    stepCounts[key] = stepCounts[key] ?? { real: 0, test: 0 };
    stepCounts[key][isT ? "test" : "real"]++;
  }

  const rowCount = (keys: string[]) => keys.reduce(
    (acc, k) => ({ real: acc.real + (stepCounts[k]?.real ?? 0), test: acc.test + (stepCounts[k]?.test ?? 0) }),
    { real: 0, test: 0 },
  );
  const s7 = rowCount(["s7_fork"]);
  const s8 = rowCount(["s8_bridge"]);
  const commitRate = (n: { real: number }, d: { real: number }) =>
    d.real > 0 ? Math.round((n.real / d.real) * 100) : null;

  type Outcome = { could_pay: boolean | null; showed_up: boolean | null; purchased: boolean | null };
  const outcomes = (outcomeRes.data ?? []) as Outcome[];
  const couldntPay = outcomes.filter((o) => o.could_pay === false).length;

  const realEndings = endingCounts(real);
  const testEndings = endingCounts(test);
  const avgEvidence = (rows: Ext[]) => {
    const vals = rows.map((e) => e.evidence_score).filter((v): v is number => typeof v === "number");
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "—";
  };

  return (
    <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg, color: C.fg, padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.gold, marginBottom: 4 }}>קריאת האות v2 · לוח בקרה</h1>
          <span style={{ display: "flex", gap: 18 }}>
            <a href="/admin/today" style={{ color: "#FF9B9B", fontSize: 13.5, fontWeight: 700 }}>🔥 עמוד הלידים ←</a>
            <a href="/admin/kriah/tests" style={{ color: C.goldMid, fontSize: 13.5 }}>רשימת האבחונים והבדיקות ←</a>
          </span>
        </div>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
          משפך /kriah (מוסתר). תנועת בדיקה נספרת בנפרד. צפי קונסיירז': 4-5 בשבוע. רף: 0.72 (סטטי, שבוע 1).
        </p>

        {/* headline stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 26 }}>
          {[
            { label: "אבחוני v2 אמיתיים", value: real.length },
            { label: "אבחוני בדיקה", value: test.length },
            { label: "S7 → שאלות (אמיתי)", value: commitRate(s8, s7) !== null ? `${commitRate(s8, s7)}%` : "אין דאטה" },
            { label: "ציון ראיות ממוצע", value: avgEvidence(real.length ? real : test) },
            { label: "לא-יכלו-לשלם (מתוך 30 אחרונים)", value: outcomes.length ? `${couldntPay}/${outcomes.length}` : "אין פגישות עדיין" },
          ].map((s) => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.gold }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* endings */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.goldMid, margin: "0 0 14px" }}>התפלגות סופים</h2>
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: C.muted, textAlign: "right" }}>
                <th style={{ padding: "6px 4px" }}>סוף</th>
                <th style={{ padding: "6px 4px" }}>אמיתי</th>
                <th style={{ padding: "6px 4px" }}>בדיקה</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(ENDING_LABELS).map((k) => (
                <tr key={k} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: "8px 4px" }}>{ENDING_LABELS[k]}</td>
                  <td style={{ padding: "8px 4px", fontWeight: 700 }}>{realEndings[k] ?? 0}</td>
                  <td style={{ padding: "8px 4px", color: C.muted }}>{testEndings[k] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* funnel dropoff */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.goldMid, margin: "0 0 14px" }}>
            נטישה פר-מסך · 14 יום (FUNNEL_STEP)
          </h2>
          {STEP_ROWS.every((r) => rowCount(r.keys).real + rowCount(r.keys).test === 0) ? (
            <p style={{ color: C.muted, fontSize: 14 }}>אין אירועים עדיין.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {STEP_ROWS.map((r) => {
                const c = rowCount(r.keys);
                const max = Math.max(...STEP_ROWS.map((x) => { const cc = rowCount(x.keys); return cc.real + cc.test; }), 1);
                const total = c.real + c.test;
                return (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 118, fontSize: 12.5, color: C.muted, flexShrink: 0 }}>{r.label}</span>
                    <div style={{ flex: 1, background: "#0A0E16", borderRadius: 6, height: 18, overflow: "hidden" }}>
                      <div style={{ width: `${(total / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.goldMid}, ${C.gold})`, opacity: 0.85 }} />
                    </div>
                    <span style={{ width: 70, fontSize: 12.5, textAlign: "left", flexShrink: 0 }}>
                      {c.real}{c.test > 0 && <span style={{ color: C.muted }}> +{c.test}ב</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
