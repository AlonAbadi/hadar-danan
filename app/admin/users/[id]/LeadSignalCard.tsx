import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

// signal_extractions isn't in the generated DB types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

type SignalOutput = {
  pain_source:        string;
  element:            string;
  signal:             string;
  signal_promise:     string;
  central_tool:       string;
  people:             string;
  content_directions: string[];
  warm_note:          string;
};

interface ExtractionRow {
  id:           string;
  signal:       SignalOutput;
  answers:      Record<string, string> | null;
  generated_at: string;
}

const C = {
  card:     "#141820",
  cardSoft: "#1D2430",
  fg:       "#EDE9E1",
  muted:    "#AAB0BD",
  goldM:    "#C9964A",
  line:     "#2C323E",
  lineGold: "rgba(232,185,74,0.30)",
};

function dateHe(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

export async function LeadSignalCard({ userId }: { userId: string }) {
  const supabase = createServerClient();

  const { data: latest } = await safeFrom(supabase, "signal_extractions")
    .select("id, signal, answers, generated_at")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Silent when no extraction — keeps the profile clean for the majority of
  // leads who never took the diagnostic. Hadar will see the card only when
  // there's something useful to read.
  if (!latest) return null;

  const row = latest as ExtractionRow;
  const sig = row.signal;

  return (
    <div
      dir="rtl"
      style={{
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 14,
        padding:      "20px 22px",
        color:        C.fg,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: 1.4, color: C.goldM, textTransform: "uppercase" as const, fontWeight: 700 }}>
            <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span> · האות של הליד
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>נחלץ ב-{dateHe(row.generated_at)}</span>
        </div>
        <Link
          href="/admin/signal"
          style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}
        >
          כל האבחונים ←
        </Link>
      </div>

      {/* The signal itself — featured */}
      <div
        style={{
          background:   `linear-gradient(145deg, ${C.cardSoft}, ${C.card})`,
          border:       `1px solid ${C.lineGold}`,
          borderRadius: 12,
          padding:      "16px 18px",
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 10, color: C.goldM, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
          האות
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
          {sig.signal}
        </p>
      </div>

      {/* What the signal promises — quiet card directly under the signal */}
      {sig.signal_promise && (
        <div
          style={{
            background:   C.cardSoft,
            border:       `1px solid ${C.line}`,
            borderRadius: 10,
            padding:      "12px 16px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 10, color: C.goldM, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
            מה שהאות שלך מבטיח
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65 }}>{sig.signal_promise}</p>
        </div>
      )}

      {/* Warm note — useful for opening a sales conversation */}
      <div
        style={{
          background:   "linear-gradient(145deg, rgba(232,185,74,0.06), #141820)",
          border:       `1px solid ${C.lineGold}`,
          borderRadius: 10,
          padding:      "12px 16px",
          marginBottom: 6,
        }}
      >
        <div style={{ fontSize: 10, color: C.goldM, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
          הערה אישית
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65 }}>{sig.warm_note}</p>
      </div>

      {/* Expandable — keeps the profile compact when she's just scanning */}
      <details style={{ marginTop: 10 }}>
        <summary style={{
          cursor: "pointer", fontSize: 12, color: C.muted, padding: "6px 0",
          listStyle: "none",
        }}>
          הצג שאר השדות + כיווני תוכן ←
        </summary>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <Field title="מקור הכאב"      body={sig.pain_source} />
          <Field title="האלמנט"         body={sig.element} />
          <Field title="הכלי המרכזי"    body={sig.central_tool} />
          <Field title="האנשים שלו/שלה" body={sig.people} />
          <Field title="שלושה כיווני תוכן">
            <ol style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7, fontSize: 13 }}>
              {(sig.content_directions ?? []).map((d, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{d}</li>
              ))}
            </ol>
          </Field>
        </div>
      </details>
    </div>
  );
}

function Field({
  title,
  body,
  children,
}: {
  title:     string;
  body?:     string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px",
    }}>
      <div style={{ fontSize: 10, color: C.goldM, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
        {title}
      </div>
      {children ?? <p style={{ margin: 0, lineHeight: 1.65, fontSize: 13 }}>{body}</p>}
    </div>
  );
}
