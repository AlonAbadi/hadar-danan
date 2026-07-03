/**
 * /admin/kriah/tests — every v2 (kriah) extraction, test and real, newest
 * first. This is where team test runs land (Alon's decision: no secret on
 * /kriah while hidden — the visibility of this list is the anti-abuse
 * counterweight to accepting is_test claims without a secret).
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

const ENDING_HE: Record<string, string> = {
  concierge: "קונסיירז'", hive: "כוורת", pre_revenue: "טרום-הכנסה", crisis_soft: "סוף רך",
};

export default async function KriahTestsPage() {
  const supabase = createServerClient();

  const { data } = await safeFrom(supabase, "signal_extractions")
    .select("id, generated_at, is_test, key1_declared, evidence_score, truth_cell, routed_ending, phone_given, signal, answers, users(name, email)")
    .eq("instrument_version", "v2_funnel")
    .order("generated_at", { ascending: false })
    .limit(100);

  type Row = {
    id: string; generated_at: string; is_test: boolean;
    key1_declared: string | null; evidence_score: number | null;
    truth_cell: string | null; routed_ending: string | null; phone_given: boolean | null;
    signal: { signal?: string; warm_note?: string } | null;
    answers: Record<string, string> | null;
    users: { name: string | null; email: string | null } | null;
  };
  const rows = (data ?? []) as Row[];

  return (
    <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg, color: C.fg, padding: "40px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.gold, margin: 0 }}>קריאת האות v2 · אבחונים ובדיקות</h1>
          <a href="/admin/kriah" style={{ color: C.goldMid, fontSize: 13.5 }}>← ללוח הבקרה</a>
        </div>
        <p style={{ color: C.muted, fontSize: 13.5, marginBottom: 24 }}>
          כל האבחונים של /kriah, החדש למעלה. שורות בדיקה מסומנות. {rows.length} אחרונים.
        </p>

        {rows.length === 0 && <p style={{ color: C.muted }}>אין אבחוני v2 עדיין.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map((r) => (
            <details key={r.id} style={{ background: C.card, border: `1px solid ${r.is_test ? C.line : "rgba(232,185,74,0.45)"}`, borderRadius: 14, padding: "14px 18px" }}>
              <summary style={{ cursor: "pointer", display: "flex", flexWrap: "wrap", gap: "6px 14px", alignItems: "baseline", fontSize: 14, listStyle: "none" }}>
                <span style={{ color: C.muted, fontSize: 12.5 }}>
                  {new Date(r.generated_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                <b>{r.users?.name ?? "—"}</b>
                <span style={{ color: C.muted, direction: "ltr" }}>{r.users?.email ?? ""}</span>
                <span style={{
                  background: r.routed_ending === "concierge" ? "rgba(224,85,85,0.18)" : "rgba(232,185,74,0.12)",
                  color: r.routed_ending === "concierge" ? "#FF9B9B" : C.gold,
                  borderRadius: 999, padding: "2px 10px", fontSize: 12.5, fontWeight: 700,
                }}>
                  {ENDING_HE[r.routed_ending ?? ""] ?? r.routed_ending ?? "—"}
                </span>
                <span style={{ color: C.muted, fontSize: 12.5 }}>
                  מפתח-1: {r.key1_declared ?? "—"} · ראיות: {typeof r.evidence_score === "number" ? r.evidence_score.toFixed(2) : "—"} · תא: {r.truth_cell ?? "—"} · טלפון: {r.phone_given ? "כן" : "לא"}
                </span>
                {r.is_test && (
                  <span style={{ background: "rgba(90,160,255,0.15)", color: "#8FBFFF", borderRadius: 999, padding: "2px 10px", fontSize: 11.5, fontWeight: 700 }}>בדיקה</span>
                )}
              </summary>
              <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 14, fontSize: 14, lineHeight: 1.75 }}>
                {r.signal?.signal && (
                  <p style={{ margin: "0 0 10px" }}><b style={{ color: C.goldMid }}>האות:</b> {r.signal.signal}</p>
                )}
                {r.signal?.warm_note && (
                  <p style={{ margin: "0 0 14px", color: C.muted }}><b style={{ color: C.goldMid }}>ההשתקפות:</b> {r.signal.warm_note}</p>
                )}
                {r.answers && Object.entries(r.answers).filter(([, v]) => v?.trim()).map(([k, v]) => (
                  <p key={k} style={{ margin: "0 0 8px", fontSize: 13 }}>
                    <b style={{ color: C.muted }}>{k}:</b> {v}
                  </p>
                ))}
                <a href={`/api/signal/${r.id}/share-card`} target="_blank" style={{ color: C.goldMid, fontSize: 13 }}>לתזכורת (הקלף) ←</a>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
