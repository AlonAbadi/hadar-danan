"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const C = {
  bg:       "#080C14",
  card:     "#141820",
  cardSoft: "#1D2430",
  gold:     "#E8B94A",
  goldMid:  "#C9964A",
  goldDeep: "#9E7C3A",
  fg:       "#EDE9E1",
  muted:    "#9E9990",
  line:     "rgba(232,185,74,0.14)",
  lineGold: "rgba(232,185,74,0.30)",
};

type ContentKit = {
  bio_short:                   string;
  bio_medium:                  string;
  bio_long:                    string;
  linkedin_headline:           string;
  manifesto:                   string;
  positioning_statement:       string;
  persona_description:         string;
  lead_magnet_ideas:           string[];
  first_product_recommendation: string;
  speaking_topics:             string[];
  content_ideas_30:            string[];
};

interface Extraction {
  id:           string;
  signal:       {
    signal: string;
    signal_promise: string;
    monthly_drops?: Record<string, { ideas: string[]; created_at: string }>;
  };
  generated_at: string;
}

interface Props {
  firstName:  string;
  occupation: string | null;
  tier:       string | null;
  extraction: Extraction | null;
}

export function SignalKitClient({ firstName, occupation, tier: _tier, extraction }: Props) {
  // No extraction yet — push the member to /signal to take the diagnostic
  if (!extraction) {
    return (
      <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg, color: C.fg, padding: "60px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 16 }}>
            {firstName ? `${firstName}, ` : ""}חבילת התוכן שלך
          </h1>
          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
            לפני שאנחנו מייצרים את חבילת התוכן המותאמת אישית שלך,
            צריך שתעבור/י את אבחון האות.
            5 שאלות פתוחות, כעשר דקות, ואז כל ההמשך נבנה ממנה.
          </p>
          <Link href="/signal" style={ctaStyle}>לאבחון האות שלי ←</Link>
        </div>
      </div>
    );
  }

  return <SignalKitView firstName={firstName} occupation={occupation} extraction={extraction} />;
}

function SignalKitView({ firstName, occupation, extraction }: { firstName: string; occupation: string | null; extraction: Extraction }) {
  const [kit, setKit] = useState<ContentKit | null>(null);
  const [kitLoading, setKitLoading] = useState(true);
  const [kitError, setKitError] = useState<string | null>(null);
  const [tab, setTab] = useState<"text" | "visual" | "strategy" | "monthly" | "review">("text");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/signal/${extraction.id}/content-kit`);
        const data = await res.json();
        if (!res.ok || !data?.kit) {
          setKitError(data?.error ?? "Content Kit generation failed.");
          return;
        }
        setKit(data.kit);
      } catch (e) {
        setKitError(String(e));
      } finally {
        setKitLoading(false);
      }
    })();
  }, [extraction.id]);

  return (
    <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg, color: C.fg }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-block", fontSize: 11, letterSpacing: 1.6,
            color: C.goldMid, marginBottom: 14, textTransform: "uppercase", fontWeight: 700,
          }}>
            הכוורת · חבילת התוכן שלך
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.25 }}>
            {firstName ? `${firstName}, ` : ""}האות שלך, ארוז לפעולה
          </h1>
          {occupation && (
            <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
              תחום עיסוק: <span style={{ color: C.goldMid }}>{occupation}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.line}`, marginBottom: 28, overflowX: "auto" }}>
          {(["text", "visual", "strategy", "monthly", "review"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "transparent",
                color: tab === t ? C.gold : C.muted,
                border: "none",
                borderBottom: tab === t ? `2px solid ${C.gold}` : "2px solid transparent",
                padding: "12px 18px",
                fontSize: 14,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Tab body */}
        {tab === "text"     && <TextTab kit={kit} loading={kitLoading} error={kitError} />}
        {tab === "visual"   && <VisualTab extractionId={extraction.id} />}
        {tab === "strategy" && <StrategyTab kit={kit} loading={kitLoading} />}
        {tab === "monthly"  && <MonthlyTab extraction={extraction} />}
        {tab === "review"   && <PostReviewTab extractionId={extraction.id} />}
      </div>
    </div>
  );
}

const TAB_LABELS: Record<string, string> = {
  text:     "טקסטים",
  visual:   "ויזואלי",
  strategy: "אסטרטגיה",
  monthly:  "החודש",
  review:   "ביקורת פוסטים",
};

// ── Text tab ───────────────────────────────────────────────
function TextTab({ kit, loading, error }: { kit: ContentKit | null; loading: boolean; error: string | null }) {
  if (loading) return <Loading text="מכין לך את כל הטקסטים…" />;
  if (error)   return <ErrorBox text={error} />;
  if (!kit)    return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="בייו לאינסטגרם" hint="עד 150 תווים, חד וקליל">
        <CopyBlock text={kit.bio_short} />
      </Section>
      <Section title="אבאוט קצר ללינקדאין" hint="עד 300 תווים, 2-3 משפטים">
        <CopyBlock text={kit.bio_medium} />
      </Section>
      <Section title="כותרת ללינקדאין (Headline)" hint="עד 120 תווים, מתחת לשם בלינקדאין">
        <CopyBlock text={kit.linkedin_headline} />
      </Section>
      <Section title="אבאוט ארוך לדף 'אודות'" hint="150-220 מילים">
        <CopyBlock text={kit.bio_long} longForm />
      </Section>
      <Section title="מניפסט אישי" hint="400-600 מילים, האני מאמין שלך">
        <CopyBlock text={kit.manifesto} longForm />
      </Section>
    </div>
  );
}

// ── Visual tab ─────────────────────────────────────────────
type VisualAsset = {
  type: string;
  label: string;
  desc: string;
  ratio: string;
};

const VISUAL_ASSETS: VisualAsset[] = [
  { type: "share-card-default", label: "כרטיס ראשי (1080×1080)", desc: "המשפט הציבורי שלך, מתאים לפיד אינסטגרם", ratio: "1:1" },
  { type: "instagram-story",    label: "סטורי 9:16 (1080×1920)", desc: "פורמט סטוריז + WhatsApp Status", ratio: "9:16" },
  { type: "linkedin-banner",    label: "באנר LinkedIn (1584×396)", desc: "תמונת הרקע של הפרופיל שלך", ratio: "4:1" },
  { type: "quote-promise",      label: "כרטיס הבטחה", desc: "מבוסס על 'מה שהאות שלך מבטיח'", ratio: "1:1" },
  { type: "quote-people",       label: "כרטיס קהל", desc: "מבוסס על 'האנשים שלך'", ratio: "1:1" },
  { type: "quote-content-1",    label: "כרטיס תוכן #1", desc: "מבוסס על כיוון התוכן הראשון", ratio: "1:1" },
  { type: "quote-content-2",    label: "כרטיס תוכן #2", desc: "מבוסס על כיוון התוכן השני", ratio: "1:1" },
  { type: "quote-content-3",    label: "כרטיס תוכן #3", desc: "מבוסס על כיוון התוכן השלישי", ratio: "1:1" },
];

function VisualTab({ extractionId }: { extractionId: string }) {
  const [style, setStyle] = useState<"editorial" | "warm" | "minimal" | "luminous">("editorial");
  const [clean, setClean] = useState(true);

  function urlFor(asset: VisualAsset): string {
    if (asset.type === "share-card-default") {
      return `/api/signal/${extractionId}/share-card?style=${style}${clean ? "&clean=1" : ""}`;
    }
    return `/api/signal/${extractionId}/asset?type=${asset.type}&style=${style}${clean ? "&clean=1" : ""}`;
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 22, padding: "16px 18px", background: C.cardSoft, borderRadius: 12, border: `1px solid ${C.line}` }}>
        <div style={{ flex: "1 0 auto", minWidth: 160 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>סגנון</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["editorial", "warm", "minimal", "luminous"] as const).map((s) => (
              <button key={s} onClick={() => setStyle(s)} style={pillStyle(style === s)}>
                {STYLE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>ברנדינג</div>
          <button onClick={() => setClean(!clean)} style={pillStyle(clean)}>
            {clean ? "ללא לוגו beegood" : "עם לוגו beegood"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {VISUAL_ASSETS.map((asset) => (
          <AssetCard key={asset.type} asset={asset} url={urlFor(asset)} />
        ))}
      </div>
    </div>
  );
}

const STYLE_LABEL: Record<string, string> = {
  editorial: "Editorial",
  warm:      "Warm",
  minimal:   "Minimal",
  luminous:  "זוהר",
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)" : "transparent",
    color:      active ? "#2a1d05" : C.muted,
    border:     active ? "none" : `1px solid ${C.line}`,
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: active ? 700 : 500,
  };
}

function AssetCard({ asset, url }: { asset: VisualAsset; url: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#000", borderRadius: 8, aspectRatio: asset.ratio.replace(":", " / "), overflow: "hidden", position: "relative" }}>
        <img
          src={url}
          loading="lazy"
          alt={asset.label}
          style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
        />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.fg }}>{asset.label}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{asset.desc}</div>
      </div>
      <a href={url} download style={{
        background: "rgba(232,185,74,0.08)", color: C.gold, textAlign: "center",
        padding: "10px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        textDecoration: "none", border: `1px solid ${C.lineGold}`,
      }}>
        הורד PNG ↓
      </a>
    </div>
  );
}

// ── Strategy tab ───────────────────────────────────────────
function StrategyTab({ kit, loading }: { kit: ContentKit | null; loading: boolean }) {
  if (loading) return <Loading text="מכין לך את חבילת האסטרטגיה…" />;
  if (!kit)    return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="הצהרת המיקום שלך" hint="לעיניך בלבד, לא לפרסום">
        <CopyBlock text={kit.positioning_statement} />
      </Section>
      <Section title="הלקוח האידיאלי שלך" hint="פרסונה — לעיניך בלבד">
        <CopyBlock text={kit.persona_description} longForm />
      </Section>
      <Section title="3 רעיונות למגנט לידים" hint="מה לתת חינם כדי לבנות רשימה">
        <ol style={{ paddingInlineStart: 24, margin: 0, color: C.fg, lineHeight: 1.8, fontSize: 14 }}>
          {kit.lead_magnet_ideas.map((it, i) => (<li key={i} style={{ marginBottom: 8 }}>{it}</li>))}
        </ol>
      </Section>
      <Section title="המוצר הראשון שלך" hint="הצעה ספציפית עם פורמט ומחיר">
        <CopyBlock text={kit.first_product_recommendation} longForm />
      </Section>
      <Section title="5 הרצאות שאת/ה הסמכות אליהן" hint="לפניות לפודקאסטים / כנסים">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {kit.speaking_topics.map((s, i) => (
            <div key={i} style={{ background: C.cardSoft, padding: "12px 14px", borderRadius: 8, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s}</div>
          ))}
        </div>
      </Section>
      <Section title="30 רעיונות תוכן (התחלה לחודשי תוכן)" hint="שונים זה מזה, כולם נגזרים מהאות שלך">
        <ol style={{ paddingInlineStart: 24, margin: 0, color: C.fg, lineHeight: 1.85, fontSize: 14 }}>
          {kit.content_ideas_30.map((it, i) => (<li key={i} style={{ marginBottom: 6 }}>{it}</li>))}
        </ol>
      </Section>
    </div>
  );
}

// ── Monthly tab ────────────────────────────────────────────
function MonthlyTab({ extraction }: { extraction: Extraction }) {
  const drops = extraction.signal.monthly_drops ?? {};
  const months = Object.keys(drops).sort().reverse();

  if (months.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 24, textAlign: "center", color: C.muted }}>
        <p style={{ margin: "0 0 6px", fontSize: 16, color: C.fg }}>עוד אין לך מסירת תוכן חודשית.</p>
        <p style={{ margin: 0, fontSize: 14 }}>בכל 1 בחודש 10 רעיונות חדשים נכנסים אוטומטית. הם נשמרים כאן.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {months.map((key) => (
        <Section key={key} title={`חודש ${key}`} hint={`${drops[key].ideas.length} רעיונות`}>
          <ol style={{ paddingInlineStart: 24, margin: 0, color: C.fg, lineHeight: 1.85, fontSize: 14 }}>
            {drops[key].ideas.map((it, i) => (<li key={i} style={{ marginBottom: 6 }}>{it}</li>))}
          </ol>
        </Section>
      ))}
    </div>
  );
}

// ── Post review tab ────────────────────────────────────────
function PostReviewTab({ extractionId }: { extractionId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    alignment_score: number; matches: string; drifts: string; sharper_rewrite: string; suggested_opening: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setBusy(true); setErr(null); setResult(null);
    try {
      const res = await fetch(`/api/signal/${extractionId}/post-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? "Review failed"); return; }
      setResult(data);
    } catch (e) {
      setErr(String(e));
    } finally { setBusy(false); }
  }

  return (
    <div>
      <Section title="בדוק טיוטה" hint="הדבק כאן פוסט שאתה שוקל לפרסם. ה-AI יגיד כמה הוא במדויק האות שלך, ויכין לך גרסה חדה יותר.">
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="הדבק את הטיוטה כאן..."
          rows={8}
          style={{
            width: "100%", background: C.cardSoft, color: C.fg,
            border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px",
            fontSize: 15, lineHeight: 1.65, fontFamily: "inherit", resize: "vertical",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: C.muted }}>{text.trim().length} תווים</span>
          <button
            onClick={go} disabled={busy || text.trim().length < 30}
            style={{
              background: busy || text.trim().length < 30
                ? "rgba(232,185,74,0.18)"
                : "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
              color: busy || text.trim().length < 30 ? "rgba(237,233,225,0.4)" : "#2a1d05",
              border: "none", borderRadius: 10, padding: "10px 22px",
              fontWeight: 700, fontSize: 14, cursor: busy ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {busy ? "בודק…" : "בדוק את הטיוטה ←"}
          </button>
        </div>
      </Section>

      {err && <div style={{ marginTop: 16, color: "#FF8888", fontSize: 14 }}>{err}</div>}

      {result && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <Section title="ציון התאמה לאות" hint="10 = במדויק שלך, 1 = אפס קשר">
            <div style={{ fontSize: 36, fontWeight: 800, color: C.gold }}>{result.alignment_score} / 10</div>
          </Section>
          <Section title="מה עובד טוב">
            <CopyBlock text={result.matches} longForm />
          </Section>
          <Section title="איפה זה נופל">
            <CopyBlock text={result.drifts} longForm />
          </Section>
          <Section title="גרסה חדה יותר">
            <CopyBlock text={result.sharper_rewrite} longForm />
          </Section>
          <Section title="פתיחה חלופית">
            <CopyBlock text={result.suggested_opening} />
          </Section>
        </div>
      )}
    </div>
  );
}

// ── Small atoms ────────────────────────────────────────────
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.2, color: C.goldMid, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.55 }}>{hint}</div>}
      <div>{children}</div>
    </div>
  );
}

function CopyBlock({ text, longForm = false }: { text: string; longForm?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        background: C.cardSoft, padding: "14px 16px", borderRadius: 8,
        whiteSpace: "pre-wrap", lineHeight: longForm ? 1.7 : 1.6,
        fontSize: longForm ? 14 : 15, color: C.fg,
      }}>
        {text}
      </div>
      <button onClick={copy} style={{
        position: "absolute", top: 10, left: 10,
        background: copied ? "rgba(127,212,155,0.18)" : "transparent",
        color: copied ? "#7FD49B" : C.goldMid,
        border: `1px solid ${copied ? "rgba(127,212,155,0.4)" : C.lineGold}`,
        borderRadius: 6, padding: "4px 10px", fontSize: 11,
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {copied ? "✓ הועתק" : "העתק"}
      </button>
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 36, textAlign: "center" }}>
      <div style={{
        width: 32, height: 32, margin: "0 auto 14px",
        border: "3px solid rgba(232,185,74,0.18)",
        borderTopColor: C.gold, borderRadius: "50%",
        animation: "spin 0.9s linear infinite",
      }} />
      <p style={{ color: C.fg, margin: 0, fontSize: 15 }}>{text}</p>
      <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 12 }}>זה יכול לקחת 30-60 שניות בפעם הראשונה. אחרי זה זה מיידי.</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div style={{ background: "rgba(255,136,136,0.05)", border: "1px solid rgba(255,136,136,0.25)", borderRadius: 12, padding: 18, color: "#FF8888", fontSize: 14 }}>
      {text}
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
  color: "#2a1d05", fontWeight: 700, fontSize: 16,
  border: "none", borderRadius: 12, padding: "14px 32px",
  textDecoration: "none",
};
