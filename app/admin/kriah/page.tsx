/**
 * /admin/kriah — the live performance report of the kriah funnel.
 *
 * Rebuilt 2026-07-05 (Alon): a learning tool, not an isolation console.
 * Internal test rows are excluded everywhere (tiny footnote only).
 * Answers: how much traffic, where from, where it drops, what it produces
 * (leads, endings, hot leads), and whether the mail engine is moving.
 */
import { createServerClient } from "@/lib/supabase/server";
import { getOrCreateDailyReport, ilDate, type DailyReport } from "@/lib/kriah-report";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const C = {
  bg: "#0D1018", card: "#141820", gold: "#E8B94A", goldMid: "#C9964A",
  fg: "#EDE9E1", muted: "#9E9990", line: "#2C323E", green: "#7FD49B", red: "#FF9B9B",
};

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

const ENDING_LABELS: Record<string, { label: string; color: string }> = {
  concierge:   { label: "קונסיירז' (רותח)", color: C.red },
  hive:        { label: "כוורת (מייל יום-2)", color: C.gold },
  pre_revenue: { label: "טרום-הכנסה", color: "#8FBFFF" },
  crisis_soft: { label: "סוף רך (משבר)", color: C.muted },
};

export default async function AdminKriahPage() {
  const supabase = createServerClient();
  const now = Date.now();
  const dayAgo   = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeks = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  const reportPromise = getOrCreateDailyReport(supabase);
  const [extRes, stepRes, offerJobsRes, welcomeLogsRes, testCountRes] = await Promise.all([
    safeFrom(supabase, "signal_extractions")
      .select("id, user_id, routed_ending, evidence_score, key1_declared, truth_cell, source_utm, phone_given, generated_at")
      .eq("instrument_version", "v2_funnel")
      .neq("is_test", true)
      .gte("generated_at", twoWeeks)
      .order("generated_at", { ascending: false })
      .limit(1000),
    safeFrom(supabase, "events")
      .select("metadata, created_at")
      .eq("type", "FUNNEL_STEP")
      .neq("is_test", true)
      .gte("created_at", twoWeeks)
      .limit(10000),
    safeFrom(supabase, "jobs")
      .select("status, payload")
      .eq("payload->>template_key", "kriah_hive_offer"),
    safeFrom(supabase, "email_logs")
      .select("id", { count: "exact", head: true })
      .gte("sent_at", twoWeeks),
    safeFrom(supabase, "signal_extractions")
      .select("id", { count: "exact", head: true })
      .eq("instrument_version", "v2_funnel")
      .eq("is_test", true),
  ]);

  type Ext = {
    routed_ending: string | null; evidence_score: number | null; phone_given: boolean | null;
    source_utm: Record<string, string> | null; generated_at: string; truth_cell: string | null;
  };
  type Ev = { metadata: { step?: string; is_test?: boolean } | null; created_at: string };

  const exts  = (extRes.data ?? []) as Ext[];
  const steps = ((stepRes.data ?? []) as Ev[]).filter((e) => e.metadata?.is_test !== true);

  // ── windows ──
  const inWindow = <T extends { [k: string]: unknown }>(rows: T[], field: string, since: string) =>
    rows.filter((r) => String(r[field]) >= since);

  const stepCount = (keys: string[], since?: string) =>
    steps.filter((e) => keys.includes(e.metadata?.step ?? "") && (!since || e.created_at >= since)).length;

  const entries14 = stepCount(["s1"]);
  const entries7  = stepCount(["s1"], weekAgo);
  const entries1  = stepCount(["s1"], dayAgo);
  const exts14 = exts.length;
  const exts7  = inWindow(exts, "generated_at", weekAgo).length;
  const exts1  = inWindow(exts, "generated_at", dayAgo).length;
  const completion = (e: number, x: number) => (e > 0 ? `${Math.round((x / e) * 100)}%` : "—");

  // ── endings + hot leads ──
  const endings: Record<string, number> = {};
  for (const e of exts) endings[e.routed_ending ?? "—"] = (endings[e.routed_ending ?? "—"] ?? 0) + 1;
  const hot7 = inWindow(exts, "generated_at", weekAgo).filter((e) => e.routed_ending === "concierge").length;
  const phoneRate = exts14 > 0 ? Math.round((exts.filter((e) => e.phone_given).length / exts14) * 100) : null;

  // ── traffic sources ──
  const sources: Record<string, number> = {};
  for (const e of exts) {
    const src = e.source_utm?.utm_source
      ? `${e.source_utm.utm_source}${e.source_utm.utm_campaign ? ` · ${e.source_utm.utm_campaign}` : ""}`
      : "ישיר / לא מזוהה";
    sources[src] = (sources[src] ?? 0) + 1;
  }
  const topSources = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // ── mail engine ──
  type Job = { status: string };
  const offerJobs = (offerJobsRes.data ?? []) as Job[];
  const offersPending = offerJobs.filter((j) => j.status === "pending").length;
  const offersSent    = offerJobs.filter((j) => j.status === "done").length;
  const emailsSent14  = welcomeLogsRes.count ?? 0;
  const testCount     = testCountRes.count ?? 0;

  // ── funnel rows with rates ──
  const rows = STEP_ROWS.map((r) => ({ label: r.label, n: stepCount(r.keys) }));
  const maxN = Math.max(...rows.map((r) => r.n), 1);

  const { today: todayReport, history: reportHistory } = await reportPromise;

  // 7-day daily trend (entries / completions / hot) — Israel dates
  const trendDays: { date: string; entries: number; completions: number; hot: number }[] = [];
  for (let i = 0; i <= 6; i++) {
    const d = ilDate(new Date(now - i * 24 * 60 * 60 * 1000));
    trendDays.push({
      date: d,
      entries:     steps.filter((e) => e.metadata?.step === "s1" && ilDate(new Date(e.created_at)) === d).length,
      completions: exts.filter((e) => ilDate(new Date(e.generated_at)) === d).length,
      hot:         exts.filter((e) => e.routed_ending === "concierge" && ilDate(new Date(e.generated_at)) === d).length,
    });
  }

  const Stat = ({ label, v1, v7, v14 }: { label: string; v1: string | number; v7: string | number; v14: string | number }) => (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 16px" }}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", gap: 18 }}>
        {[["היום", v1], ["7 ימים", v7], ["14 יום", v14]].map(([t, v]) => (
          <div key={String(t)}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{v}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg, color: C.fg, padding: "40px 20px" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.gold, marginBottom: 4 }}>קריאת האות · דוח ביצועים</h1>
          <span style={{ display: "flex", gap: 18 }}>
            <a href="/admin/today" style={{ color: C.red, fontSize: 13.5, fontWeight: 700 }}>🔥 עמוד הלידים ←</a>
            <a href="/admin/kriah/tests" style={{ color: C.goldMid, fontSize: 13.5 }}>כל האבחונים ←</a>
          </span>
        </div>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 26 }}>
          תנועה אמיתית בלבד. חלון: 14 הימים האחרונים.
        </p>

        {/* morning conclusions — generated once a day, dated */}
        <div style={{
          background: "rgba(232,185,74,0.05)", border: `1.5px solid rgba(232,185,74,0.35)`,
          borderRadius: 16, padding: "22px 24px", marginBottom: 26,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: C.gold, margin: 0 }}>☕ מסקנות הבוקר</h2>
            <span style={{ fontSize: 12.5, color: C.muted }}>
              {todayReport
                ? `דוח ליום ${new Date(String(todayReport.report_date) + "T12:00:00").toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric" })} (מנתח את אתמול)`
                : "הדוח של היום ייווצר בפתיחה הראשונה אחרי 06:00"}
            </span>
          </div>
          {todayReport ? (
            <div style={{ fontSize: 14.5, lineHeight: 1.85, whiteSpace: "pre-wrap", color: C.fg }}>
              {todayReport.conclusions}
            </div>
          ) : (
            <p style={{ color: C.muted, fontSize: 13.5, margin: 0 }}>
              {reportHistory.length > 0 ? "בינתיים, הדוח האחרון בהיסטוריה למטה." : "אין דוחות עדיין."}
            </p>
          )}
          {reportHistory.length > 0 && (
            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", fontSize: 13, color: C.goldMid }}>
                דוחות קודמים ({reportHistory.length})
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                {reportHistory.map((r: DailyReport) => (
                  <div key={String(r.report_date)} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                    <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 6 }}>
                      {new Date(String(r.report_date) + "T12:00:00").toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: "pre-wrap", color: C.muted }}>{r.conclusions}</div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* headline stats in time windows */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 14 }}>
          <Stat label="כניסות לשאלון" v1={entries1} v7={entries7} v14={entries14} />
          <Stat label="אבחונים שהושלמו" v1={exts1} v7={exts7} v14={exts14} />
          <Stat label="שיעור השלמה (כניסה ← אות)" v1={completion(entries1, exts1)} v7={completion(entries7, exts7)} v14={completion(entries14, exts14)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 26 }}>
          {[
            { label: "לידים רותחים (7 ימים)", value: hot7, hint: "צפי בריא: 4-5 בשבוע" },
            { label: "השאירו טלפון", value: phoneRate !== null ? `${phoneRate}%` : "—" },
            { label: "מיילי הצעה בתור / נשלחו", value: `${offersPending} / ${offersSent}` },
            { label: "מיילים שנשלחו (14 יום, כלל האתר)", value: emailsSent14 },
          ].map((s) => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
              {"hint" in s && s.hint && <div style={{ fontSize: 10.5, color: C.muted, opacity: 0.7, marginTop: 2 }}>{s.hint}</div>}
            </div>
          ))}
        </div>

        {/* funnel with drop rates */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.goldMid, margin: "0 0 4px" }}>המשפך, שלב אחרי שלב · 14 יום</h2>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px" }}>
            אחוז ירוק = כמה מהשלב הקודם המשיכו. אחוז אפור = כמה מסך הכניסות הגיעו לכאן.
          </p>
          {rows.every((r) => r.n === 0) ? (
            <p style={{ color: C.muted, fontSize: 14 }}>אין תנועה עדיין.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rows.map((r, i) => {
                const prev = i > 0 ? rows[i - 1].n : r.n;
                const stepRate  = i > 0 && prev > 0 ? Math.round((r.n / prev) * 100) : null;
                const totalRate = rows[0].n > 0 ? Math.round((r.n / rows[0].n) * 100) : null;
                return (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 118, fontSize: 12.5, color: C.muted, flexShrink: 0 }}>{r.label}</span>
                    <div style={{ flex: 1, background: "#0A0E16", borderRadius: 6, height: 18, overflow: "hidden" }}>
                      <div style={{ width: `${(r.n / maxN) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.goldMid}, ${C.gold})`, opacity: 0.85 }} />
                    </div>
                    <span style={{ width: 34, fontSize: 13, fontWeight: 700, textAlign: "left", flexShrink: 0 }}>{r.n}</span>
                    <span style={{ width: 44, fontSize: 11.5, textAlign: "left", flexShrink: 0, color: stepRate !== null && stepRate < 60 ? C.red : C.green }}>
                      {stepRate !== null ? `${stepRate}%` : ""}
                    </span>
                    <span style={{ width: 40, fontSize: 11, textAlign: "left", flexShrink: 0, color: C.muted }}>
                      {totalRate !== null && i > 0 ? `${totalRate}%` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* daily trend */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.goldMid, margin: "0 0 14px" }}>יום-יום · 7 ימים</h2>
          <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: C.muted, textAlign: "right" }}>
                <th style={{ padding: "6px 4px" }}>יום</th>
                <th style={{ padding: "6px 4px" }}>כניסות</th>
                <th style={{ padding: "6px 4px" }}>אבחונים</th>
                <th style={{ padding: "6px 4px" }}>השלמה</th>
                <th style={{ padding: "6px 4px" }}>רותחים</th>
              </tr>
            </thead>
            <tbody>
              {trendDays.map((d, i) => (
                <tr key={d.date} style={{ borderTop: `1px solid ${C.line}`, opacity: i === 0 ? 1 : 0.85 }}>
                  <td style={{ padding: "8px 4px", fontWeight: i === 0 ? 700 : 400 }}>
                    {new Date(d.date + "T12:00:00").toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem", weekday: "short", day: "2-digit", month: "2-digit" })}
                    {i === 0 ? " (היום)" : ""}
                  </td>
                  <td style={{ padding: "8px 4px" }}>{d.entries}</td>
                  <td style={{ padding: "8px 4px" }}>{d.completions}</td>
                  <td style={{ padding: "8px 4px", color: C.green }}>{d.entries > 0 ? `${Math.round((d.completions / d.entries) * 100)}%` : "—"}</td>
                  <td style={{ padding: "8px 4px", color: d.hot > 0 ? C.red : C.muted }}>{d.hot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {/* endings */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.goldMid, margin: "0 0 14px" }}>לאן נותבו · 14 יום</h2>
            {exts14 === 0 ? <p style={{ color: C.muted, fontSize: 14 }}>אין אבחונים עדיין.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.keys(ENDING_LABELS).map((k) => {
                  const n = endings[k] ?? 0;
                  const pct = exts14 > 0 ? Math.round((n / exts14) * 100) : 0;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                      <span style={{ width: 140, color: ENDING_LABELS[k].color, fontWeight: 700 }}>{ENDING_LABELS[k].label}</span>
                      <div style={{ flex: 1, background: "#0A0E16", borderRadius: 6, height: 14, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: ENDING_LABELS[k].color, opacity: 0.7 }} />
                      </div>
                      <span style={{ width: 60, textAlign: "left" }}>{n} · {pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* traffic sources */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.goldMid, margin: "0 0 14px" }}>מאיפה הגיעו (אבחונים) · 14 יום</h2>
            {topSources.length === 0 ? <p style={{ color: C.muted, fontSize: 14 }}>אין דאטה עדיין.</p> : (
              <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
                <tbody>
                  {topSources.map(([src, n]) => (
                    <tr key={src} style={{ borderTop: `1px solid ${C.line}` }}>
                      <td style={{ padding: "8px 4px" }}>{src}</td>
                      <td style={{ padding: "8px 4px", fontWeight: 700, textAlign: "left" }}>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.muted, opacity: 0.6, marginTop: 22 }}>
          {testCount > 0 ? `${testCount} אבחוני בדיקה פנימיים מוסתרים מהדוח. ` : ""}נטישה מחושבת מאירועי FUNNEL_STEP; אבחונים מטבלת החילוץ.
        </p>
      </div>
    </div>
  );
}
