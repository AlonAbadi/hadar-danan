import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { SIGNAL_QUESTIONS } from "@/lib/prompts/signal-engine";

// Typed escape hatch — signal_extractions isn't in the generated DB types.
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
  user_id:      string;
  signal:       SignalOutput;
  answers:      Record<string, string>;
  generated_at: string;
  users: {
    id:    string;
    name:  string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

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

const C = {
  bg:    "#0D1018",
  card:  "#141820",
  cardSoft: "#1D2430",
  fg:    "#EDE9E1",
  muted: "#AAB0BD",
  gold:  "#E8B94A",
  goldM: "#C9964A",
  line:  "#2C323E",
  lineGold: "rgba(232,185,74,0.30)",
};

export default async function AdminSignalPage() {
  const supabase = createServerClient();

  // Fetch extractions joined with user info. Newest first.
  const { data: rows, error } = await safeFrom(supabase, "signal_extractions")
    .select("id, user_id, signal, answers, generated_at, users(id, name, email, phone)")
    .order("generated_at", { ascending: false })
    .limit(200);

  const extractions: ExtractionRow[] = (rows ?? []) as ExtractionRow[];

  // Window counts for the headline stats
  const now = Date.now();
  const dayMs   = 24 * 60 * 60 * 1000;
  const week    = extractions.filter((e) => now - new Date(e.generated_at).getTime() < 7 * dayMs).length;
  const month   = extractions.filter((e) => now - new Date(e.generated_at).getTime() < 30 * dayMs).length;
  const today   = extractions.filter((e) => now - new Date(e.generated_at).getTime() < dayMs).length;

  return (
    <div dir="rtl" style={{ fontFamily: "var(--font-assistant), Assistant, sans-serif", minHeight: "100vh", background: C.bg, padding: 32, color: C.fg }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>מנוע האות — אבחונים</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
            מי עבר את אבחון <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span> ומה האות שיצא לו. מסודר מהאחרון לישן.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Stat label="סה״כ"   value={extractions.length} color={C.gold} />
          <Stat label="החודש"  value={month}              color={C.gold} />
          <Stat label="השבוע"  value={week}               color={C.goldM} />
          <Stat label="היום"   value={today}              color={C.muted} />
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 16px", color: "#FCA5A5", marginBottom: 18 }}>
          שגיאה בשליפה: {String(error.message ?? error)}
        </div>
      )}

      {extractions.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 14, padding: 60, textAlign: "center", border: `1px dashed ${C.line}`, borderRadius: 14 }}>
          עדיין אין אבחונים. כשמשתמש ישלים את <Link href="/signal" style={{ color: C.goldM }}>/signal</Link> הוא יופיע כאן.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {extractions.map((row) => (
            <ExtractionCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 10,
      padding: "10px 16px", minWidth: 90, textAlign: "center",
    }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function ExtractionCard({ row }: { row: ExtractionRow }) {
  const name      = row.users?.name?.trim() || "—";
  const email     = row.users?.email ?? null;
  const phone     = row.users?.phone ?? null;
  const userHref  = row.users?.id ? `/admin/users/${row.users.id}` : null;
  const waPhone   = phone ? phone.replace(/\D/g, "").replace(/^0/, "972") : null;
  const signal    = row.signal;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20,
    }}>
      {/* Header row: name + meta + open profile */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {email && <span dir="ltr">{email}</span>}
            {email && phone && <span>·</span>}
            {phone && <span dir="ltr">{phone}</span>}
            {(email || phone) && <span>·</span>}
            <span>{relativeTime(row.generated_at)}</span>
          </div>
          {waPhone && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12, color: "#25D366", textDecoration: "none",
                  padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(37,211,102,0.30)",
                }}
              >
                WhatsApp ←
              </a>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  style={{
                    fontSize: 12, color: "#4285F4", textDecoration: "none",
                    padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(66,133,244,0.30)",
                  }}
                >
                  התקשר ←
                </a>
              )}
            </div>
          )}
        </div>
        {userHref && (
          <Link
            href={userHref}
            style={{
              fontSize: 13, color: C.goldM, textDecoration: "none",
              padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.line}`,
            }}
          >
            פתח פרופיל ←
          </Link>
        )}
      </div>

      {/* The signal sentence — featured */}
      <div style={{
        background:    `linear-gradient(145deg, ${C.cardSoft}, ${C.card})`,
        border:        `1px solid ${C.lineGold}`,
        borderRadius:  12,
        padding:       "16px 18px",
        marginBottom:  14,
      }}>
        <div style={{ fontSize: 11, color: C.goldM, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
          האות
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, color: C.fg, fontWeight: 500 }}>
          {signal.signal}
        </p>
      </div>

      {/* What the signal promises — quiet card directly under the signal */}
      {signal.signal_promise && (
        <div style={{
          background:   C.cardSoft,
          border:       `1px solid ${C.line}`,
          borderRadius: 10,
          padding:      "12px 16px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: C.goldM, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
            מה שהאות שלך מבטיח
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: C.fg }}>{signal.signal_promise}</p>
        </div>
      )}

      {/* Expandable — native details/summary, no JS needed */}
      <details>
        <summary style={{
          cursor: "pointer", fontSize: 13, color: C.muted, padding: "6px 0",
          listStyle: "none",
        }}>
          הצג שבעה שדות + תשובות גולמיות ←
        </summary>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Field title="הערה אישית"      body={signal.warm_note} tone="warm" />
          <Field title="מקור הכאב"       body={signal.pain_source} />
          <Field title="האלמנט"          body={signal.element} />
          <Field title="הכלי המרכזי"     body={signal.central_tool} />
          <Field title="האנשים שלו/שלה"  body={signal.people} />
          <Field title="שלושה כיווני תוכן">
            <ol style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.7 }}>
              {(signal.content_directions ?? []).map((d, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{d}</li>
              ))}
            </ol>
          </Field>

          <div style={{
            background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px", marginTop: 6,
          }}>
            <div style={{ fontSize: 11, color: C.goldM, letterSpacing: 0.6, marginBottom: 10, textTransform: "uppercase" as const }}>
              תשובות גולמיות
            </div>
            {SIGNAL_QUESTIONS.map((q) => {
              const ans = (row.answers ?? {})[q.key];
              const text = typeof ans === "string" && ans.trim().length > 0 ? ans : "(לא נענה)";
              return (
                <div key={q.key} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{q.label}</div>
                  <div style={{ fontSize: 13, color: C.fg, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}

function Field({
  title,
  body,
  children,
  tone = "normal",
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
  tone?: "normal" | "warm";
}) {
  const isWarm = tone === "warm";
  return (
    <div style={{
      background:   isWarm ? "linear-gradient(145deg, rgba(232,185,74,0.06), #141820)" : C.cardSoft,
      border:       `1px solid ${isWarm ? C.lineGold : C.line}`,
      borderRadius: 10,
      padding:      "12px 16px",
    }}>
      <div style={{ fontSize: 11, color: C.goldM, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
        {title}
      </div>
      {children ?? <p style={{ margin: 0, lineHeight: 1.65, fontSize: 13, color: C.fg }}>{body}</p>}
    </div>
  );
}
