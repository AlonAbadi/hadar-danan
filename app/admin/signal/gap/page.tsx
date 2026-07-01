import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { GAP_ENGINE_ENABLED, GAP_ENGINE_VERSION } from "@/lib/prompts/gap-engine";
import GapReviewClient, { type GapRow } from "./GapReviewClient";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const C = { bg: "#0D1018", card: "#141820", fg: "#EDE9E1", muted: "#AAB0BD", gold: "#E8B94A", goldM: "#C9964A", line: "#2C323E", green: "#7FD49B", red: "#E67373" };

interface Row {
  id: string; gap_present: string | null; gap_seam: string | null; gap_safety: string | null;
  gap_confidence: number | null; gap_reading: string | null; gap_crossing: string | null;
  gap_evidence: unknown; gap_signals: unknown; gap_review_verdict: string | null; gap_computed_at: string | null;
  answers: Record<string, string> | null; users: { name: string | null } | null;
}

export default async function AdminGapPage() {
  const supabase = createServerClient();
  const { data, error } = await safeFrom(supabase, "signal_extractions")
    .select("id, gap_present, gap_seam, gap_safety, gap_confidence, gap_reading, gap_crossing, gap_evidence, gap_signals, gap_review_verdict, gap_computed_at, answers, users(name)")
    .not("gap_computed_at", "is", null)
    .order("gap_computed_at", { ascending: false })
    .limit(200);

  const rows: Row[] = (data ?? []) as Row[];
  const view: GapRow[] = rows.map((r) => ({
    id: r.id,
    name: r.users?.name?.trim() || "—",
    q3: r.answers?.hard_period ?? "",
    q5: r.answers?.message_to_past ?? "",
    present: r.gap_present, seam: r.gap_seam, safety: r.gap_safety, confidence: r.gap_confidence,
    reading: r.gap_reading, crossing: r.gap_crossing,
    evidence: Array.isArray(r.gap_evidence) ? (r.gap_evidence as GapRow["evidence"]) : [],
    signals: (r.gap_signals as Record<string, unknown>) ?? null,
    verdict: r.gap_review_verdict, computedAt: r.gap_computed_at,
  }));

  // Aggregate the validation gate metrics.
  const reviewed = rows.filter((r) => r.gap_review_verdict);
  const harmful  = reviewed.filter((r) => r.gap_review_verdict === "harmful").length;
  const precise  = reviewed.filter((r) => r.gap_review_verdict === "precise").length;
  const close    = reviewed.filter((r) => r.gap_review_verdict === "close").length;
  const emitted  = rows.filter((r) => r.gap_present === "yes" || r.gap_present === "partial").length;
  const abstain  = rows.filter((r) => r.gap_present === "abstain").length;
  const crisis   = rows.filter((r) => r.gap_safety === "do_not_name").length;

  return (
    <div dir="rtl" style={{ fontFamily: "var(--font-assistant), Assistant, sans-serif", minHeight: "100vh", background: C.bg, padding: 32, color: C.fg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>מנוע הפער — סקירה פנימית</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4, maxWidth: 680, lineHeight: 1.6 }}>
            קריאות הפער של המנוע, לאימות אנושי בלבד. <b>לא מוצג לאף משתמש.</b> סמנו כל קריאה: מדויק / קרוב / פספס / מזיק. "מזיק" הוא שער קשיח — אירוע אחד חוסם השקה. גרסה: {GAP_ENGINE_VERSION}.
          </div>
        </div>
        <Link href="/admin/signal" style={{ fontSize: 13, color: C.goldM, textDecoration: "none", padding: "8px 14px", borderRadius: 9, border: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>← אבחונים</Link>
      </div>

      {!GAP_ENGINE_ENABLED && (
        <div style={{ background: "rgba(232,185,74,0.08)", border: "1px solid rgba(232,185,74,0.3)", borderRadius: 10, padding: "10px 14px", color: C.goldM, marginBottom: 16, fontSize: 13 }}>
          המנוע כבוי (GAP_ENGINE_ENABLED=false). מוצגות קריאות שכבר חושבו. חישוב חדש לא ירוץ עד שמדליקים את הדגל — וזה מכוון, עד אימות.
        </div>
      )}

      {/* Validation gate dashboard */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <Stat label="חושבו" value={rows.length} c={C.gold} />
        <Stat label="נמנע" value={abstain} c={C.muted} />
        <Stat label="רצפת מצוקה" value={crisis} c={C.red} />
        <Stat label="נאמר פער" value={emitted} c={C.goldM} />
        <Stat label="נסקרו" value={reviewed.length} c={C.gold} />
        <Stat label="מדויק+קרוב" value={precise + close} c={C.green} />
        <Stat label="מזיק (שער)" value={harmful} c={harmful > 0 ? C.red : C.green} />
      </div>

      {error && <div style={{ color: C.red, marginBottom: 12 }}>שגיאה: {String(error.message ?? error)}</div>}

      {view.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 14, padding: 50, textAlign: "center", border: `1px dashed ${C.line}`, borderRadius: 12 }}>
          עדיין לא חושבו קריאות פער. הרץ את הצינור על אבחונים (POST /api/signal/[id]/gap) אחרי הדלקת הדגל.
        </div>
      ) : (
        <GapReviewClient rows={view} />
      )}
    </div>
  );
}

function Stat({ label, value, c }: { label: string; value: number; c: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 16px", minWidth: 92, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: c, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{label}</div>
    </div>
  );
}
