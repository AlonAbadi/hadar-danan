"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ShootDayPlan, Video, Pillar } from "@/lib/prompts/shoot-day-engine";
import { playHadarVoice } from "@/lib/hadar-voice";

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
  const [tab, setTab] = useState<"text" | "visual" | "strategy" | "shoot_day" | "monthly" | "review">("text");

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
          {(["text", "visual", "strategy", "shoot_day", "monthly", "review"] as const).map((t) => (
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
        {tab === "text"      && <TextTab kit={kit} loading={kitLoading} error={kitError} />}
        {tab === "visual"    && <VisualTab extractionId={extraction.id} />}
        {tab === "strategy"  && <StrategyTab kit={kit} loading={kitLoading} />}
        {tab === "shoot_day" && <ShootDayTab extractionId={extraction.id} />}
        {tab === "monthly"   && <MonthlyTab extraction={extraction} />}
        {tab === "review"    && <PostReviewTab extractionId={extraction.id} />}
      </div>
    </div>
  );
}

const TAB_LABELS: Record<string, string> = {
  text:      "טקסטים",
  visual:    "ויזואלי",
  strategy:  "אסטרטגיה",
  shoot_day: "יום הצילום",
  monthly:   "החודש",
  review:    "ביקורת פוסטים",
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
      <Section title="כותרת ללינקדאין" hint="עד 120 תווים, מתחת לשם בלינקדאין">
        <CopyBlock text={kit.linkedin_headline} />
      </Section>
      <Section title="אודות לפייסבוק" hint="עד 300 תווים, 2-3 משפטים">
        <CopyBlock text={kit.bio_medium} />
      </Section>
      <Section title="טקסט לדף 'אודות' באתר" hint="150-220 מילים · טיוטה ראשונית">
        <CopyBlock text={kit.bio_long} longForm />
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10, padding: "10px 12px", background: "rgba(232,185,74,0.06)", border: `1px solid ${C.lineGold}`, borderRadius: 8, lineHeight: 1.6 }}>
          זו טיוטה ראשונית שנגזרה מהאות שלכם. עברו עליה, דייקו ושנו לקול שלכם לפני שמפרסמים.
        </div>
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

// Seven posts, all the same size (1080×1350, classic Instagram feed). No story,
// no banner — one format, less choice, less cost.
const VISUAL_ASSETS: VisualAsset[] = [
  { type: "share-card-default", label: "המשפט הציבורי שלך", desc: "מתאים לפיד אינסטגרם", ratio: "4:5" },
  { type: "quote-signal",       label: "האות שלך",          desc: "המשפט המבדל שלך", ratio: "4:5" },
  { type: "quote-promise",      label: "ההבטחה",            desc: "מה שהאות שלך מבטיח", ratio: "4:5" },
  { type: "quote-people",       label: "הקהל שלך",          desc: "האנשים שלך", ratio: "4:5" },
  { type: "quote-content-1",    label: "כיוון תוכן #1",     desc: "כיוון התוכן הראשון", ratio: "4:5" },
  { type: "quote-content-2",    label: "כיוון תוכן #2",     desc: "כיוון התוכן השני", ratio: "4:5" },
  { type: "quote-content-3",    label: "כיוון תוכן #3",     desc: "כיוון התוכן השלישי", ratio: "4:5" },
];

// Single design language now; the only choice is flat color vs a high-quality
// image. Style drives the overlay/palette look; "editorial" is the house style.
const VISUAL_STYLE = "editorial";
// Bump together with the route cache-key version (card_bg_url_vN / asset_bg_url_vN)
// to bust the browser + CDN cache after a visual-prompter change.
const ASSET_CACHE_V = 6;

function VisualTab({ extractionId }: { extractionId: string }) {
  const [mode, setMode] = useState<"color" | "image">("color");
  const [clean, setClean] = useState(true);

  function urlFor(asset: VisualAsset): string {
    const q = `style=${VISUAL_STYLE}&bg=${mode}&v=${ASSET_CACHE_V}${clean ? "&clean=1" : ""}`;
    if (asset.type === "share-card-default") {
      return `/api/signal/${extractionId}/share-card?${q}`;
    }
    return `/api/signal/${extractionId}/asset?type=${asset.type}&${q}`;
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 22, padding: "16px 18px", background: C.cardSoft, borderRadius: 12, border: `1px solid ${C.line}` }}>
        <div style={{ flex: "1 0 auto", minWidth: 200 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>עיצוב</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMode("color")} style={pillStyle(mode === "color")}>צבע נקי</button>
            <button onClick={() => setMode("image")} style={pillStyle(mode === "image")}>תמונה ברמה גבוהה</button>
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
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  // When the url changes (mode switch / version bump) the image regenerates —
  // reset to the loading state so the user always gets feedback.
  useEffect(() => { setLoaded(false); setErrored(false); }, [url]);
  return (
    <>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => loaded && setOpen(true)}
          aria-label={`פתח ${asset.label}`}
          style={{
            background: C.cardSoft, borderRadius: 8, aspectRatio: asset.ratio.replace(":", " / "),
            overflow: "hidden", position: "relative", border: "none", padding: 0,
            cursor: loaded ? "zoom-in" : "default", fontFamily: "inherit",
          }}
        >
          <img
            src={url}
            loading="lazy"
            alt={asset.label}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease" }}
          />
          {!loaded && !errored && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 16, textAlign: "center" }}>
              <div style={{
                width: 30, height: 30,
                border: "3px solid rgba(232,185,74,0.18)", borderTopColor: C.gold,
                borderRadius: "50%", animation: "spin 0.9s linear infinite",
              }} />
              <div style={{ fontSize: 12.5, color: C.fg, fontWeight: 600 }}>מייצרים את התמונה…</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>בפעם הראשונה זה לוקח כמה שניות. אחר כך מיידי.</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {errored && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 12.5, color: C.fg, fontWeight: 600 }}>לא הצלחנו לייצר עכשיו</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>רעננו את העמוד בעוד רגע ונסו שוב.</div>
            </div>
          )}
        </button>
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
      {open && <Lightbox asset={asset} url={url} onClose={() => setOpen(false)} />}
    </>
  );
}

function Lightbox({ asset, url, onClose }: { asset: VisualAsset; url: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-label={asset.label}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(8,12,20,0.88)",
        backdropFilter: "blur(8px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", gap: 20,
      }}
    >
      <button
        onClick={onClose}
        aria-label="סגור"
        style={{
          position: "absolute", top: 20, right: 20,
          background: "rgba(237,233,225,0.08)", color: C.fg,
          border: `1px solid ${C.line}`, borderRadius: 999,
          width: 44, height: 44, fontSize: 22,
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ×
      </button>

      <img
        src={url}
        alt={asset.label}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth:  "min(94vw, 1080px)",
          maxHeight: "78vh",
          width:     "auto",
          height:    "auto",
          objectFit: "contain",
          borderRadius: 10,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          cursor: "default",
        }}
      />

      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ color: C.fg, fontSize: 15, fontWeight: 700 }}>{asset.label}</div>
        <a
          href={url}
          download
          style={{
            background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
            color: "#2a1d05", fontWeight: 700, fontSize: 15,
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontFamily: "inherit",
            display: "inline-block",
          }}
        >
          הורד PNG ↓
        </a>
      </div>
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
      <Section title="הלקוח האידיאלי שלך" hint="פרסונה. לעיניכם בלבד.">
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
    <div style={{
      background: "rgba(255,136,136,0.05)", border: "1px solid rgba(255,136,136,0.25)",
      borderRadius: 12, padding: 18, color: "#FF8888", fontSize: 14,
      whiteSpace: "pre-wrap", wordBreak: "break-word",
    }}>
      {text}
    </div>
  );
}

// ── Shoot Day tab ──────────────────────────────────────────
// The flagship product output — Mode E (Strategic Architect) of Hadar's
// Director Engine. Renders the 12-video shoot day plan with visual
// direction, schedule, decisions, and gift sentences.
//
// Magic Layer #2 (Methodology Visibility) — each video card has a "למה זה?"
// button that opens a tooltip with Hadar's quote explaining the pattern.
//
// Magic Layer #7 (5-tier affirmation system) — placeholder hooks wired up;
// voice clips swap in V2 after Hadar recording day.

function ShootDayTab({ extractionId }: { extractionId: string }) {
  const [plan, setPlan]         = useState<ShootDayPlan | null>(null);
  const [loading, setLoading]   = useState(true);
  const [phase, setPhase]       = useState<"phase1" | "phase2">("phase1");
  const [error, setError]       = useState<string | null>(null);
  const [stored, setStored]     = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // ── Phase 1: identity + pillars ────────────────────────────────
        setPhase("phase1");
        const res1  = await fetch(`/api/signal/${extractionId}/shoot-day`);
        const txt1  = await res1.text();
        let data1: { phase?: string; plan?: ShootDayPlan; identity_statement?: string; pillars?: Pillar[]; error?: string; progress?: { stored?: number[] } };
        try {
          data1 = JSON.parse(txt1);
        } catch {
          if (!cancelled) setError(`Phase 1 (HTTP ${res1.status}, ${res1.statusText}): ${txt1.slice(0, 300)}`);
          return;
        }
        if (!res1.ok) {
          if (!cancelled) setError(data1?.error ?? `Phase 1 failed (HTTP ${res1.status})`);
          return;
        }

        // Complete plan already cached (full or partial)? skip phase 2
        if (data1.phase === "complete" && data1.plan) {
          if (!cancelled) {
            setPlan(data1.plan);
            setStored(data1.progress?.stored ?? []);
          }
          return;
        }

        if (!data1.identity_statement || !data1.pillars) {
          if (!cancelled) setError("Phase 1 returned no identity/pillars");
          return;
        }

        // ── Phase 2: videos + strategy + gift_sentences ────────────────
        if (cancelled) return;
        setPhase("phase2");
        const res2 = await fetch(`/api/signal/${extractionId}/shoot-day/finish`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            identity_statement: data1.identity_statement,
            pillars:            data1.pillars,
          }),
        });
        const txt2 = await res2.text();
        let data2: { plan?: ShootDayPlan; error?: string; details?: string; raw?: string };
        try {
          data2 = JSON.parse(txt2);
        } catch {
          if (!cancelled) setError(`Phase 2 (HTTP ${res2.status}, ${res2.statusText}): ${txt2.slice(0, 300)}`);
          return;
        }
        if (!res2.ok || !data2.plan) {
          const msg = [
            data2?.error ?? `Phase 2 failed (HTTP ${res2.status})`,
            data2?.details ? `· ${data2.details}` : null,
            data2?.raw     ? `· raw: ${data2.raw}`  : null,
          ].filter(Boolean).join("\n");
          if (!cancelled) setError(msg);
          return;
        }
        if (!cancelled) setPlan(data2.plan);
      } catch (e) {
        if (!cancelled) setError(`Client error: ${String(e)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [extractionId]);

  if (loading) {
    return (
      <Loading
        text={phase === "phase1"
          ? "מחלץ את משפט הזהות ו-4 העמודים שלך…"
          : "בונה את הסרטון הראשון שלך…"}
      />
    );
  }
  if (error)   return <ErrorBox text={error} />;
  if (!plan)   return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hadar voice intro — replaces planned video. Uses her actual signature
          lines from the corpus, typeset as a 3-line manifesto. */}
      <ShootDayVoiceIntro />

      {/* Identity statement card */}
      <ShootDayHero identity={plan.identity_statement} />

      {/* 4 Pillars overview */}
      <PillarsOverview pillars={plan.pillars} />

      {/* Videos in 3 acts (Lever #3: Act Structure 4+4+4). V1 ships only
          Video #1 (IDENTITY). V2+ unlocks the rest via per-card CTAs. */}
      <VideosByAct videos={plan.videos} />
      {(plan.videos.length < 12 || !plan.visual_direction || !plan.gift_sentences || !plan.director) && (
        <ShootDayBuilder extractionId={extractionId} plan={plan} setPlan={setPlan} stored={stored} />
      )}

      {/* Hadar's personal direction (script layer for the AI-Hadar video) */}
      {plan.director && <DirectorCard director={plan.director} videos={plan.videos} />}

      {/* Visual Direction (Lever #5 via "הפוך מהקטגוריה") — optional in V1 */}
      {plan.visual_direction && <VisualDirectionCard visual={plan.visual_direction} />}

      {/* Schedule — optional in V1 */}
      {plan.schedule && <ScheduleCard schedule={plan.schedule} />}

      {/* 5 Gift Sentences (Magic #6: Gift Sentence Lab) — optional in V1 */}
      {plan.gift_sentences && <GiftSentencesCard sentences={plan.gift_sentences} />}

      {/* 3 Closing Decisions (Lever #4: Urgency-Loaded CTA) — optional in V1 */}
      {plan.decisions && <DecisionsCard decisions={plan.decisions} />}

      {/* Hadar's signoff */}
      <HadarSignoff />
    </div>
  );
}

// Hadar voice intro — replaces the planned hero video with text in her voice.
// Three signature lines from the corpus, sequenced as a manifesto. All quotes
// are real Hadar lines (Hadar-lesson-1 + michael-kadosh canonical sources).
// V2: drop in actual video footage on top, keep this as the fallback / poster.
function ShootDayVoiceIntro() {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(145deg, #14110D 0%, #1D2430 100%)",
      border: `1px solid ${C.lineGold}`,
      borderRadius: 16,
      padding: "44px 32px 38px",
      overflow: "hidden",
    }}>
      {/* Subtle gold corner accent */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 120, height: 120,
        background: "radial-gradient(circle at top right, rgba(232,185,74,0.10), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Tiny header */}
      <div style={{
        fontSize: 10, letterSpacing: 2.4, color: C.goldMid,
        fontWeight: 700, textTransform: "uppercase", marginBottom: 28,
        opacity: 0.85,
      }}>
        מהדר אלייך
      </div>

      {/* The three manifesto lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, position: "relative" }}>

        {/* Line 1 — the iconic opener from Hadar-lesson-1 */}
        <div style={{
          fontSize: 22, lineHeight: 1.5, color: C.fg, fontWeight: 600,
          fontFamily: "'Frank Ruhl Libre', Georgia, serif",
          animation: "fadeUp 0.7s ease-out 0.1s both",
        }}>
          אם השיווק שלכם לא עובד היום, זה לא בגלל שאתם גרועים.
        </div>

        {/* Line 2 — the paradigm shift */}
        <div style={{
          fontSize: 22, lineHeight: 1.5, color: C.fg, fontWeight: 600,
          fontFamily: "'Frank Ruhl Libre', Georgia, serif",
          animation: "fadeUp 0.7s ease-out 0.5s both",
        }}>
          זה כי אתם משחקים משחק שכבר לא מתקיים.
        </div>

        {/* Gold separator line */}
        <div style={{
          height: 1,
          background: `linear-gradient(to right, transparent, ${C.lineGold}, transparent)`,
          margin: "8px 0",
          animation: "fadeIn 0.7s ease-out 0.9s both",
        }} />

        {/* Line 3 — the gift sentence / promise (BeeGood positioning) */}
        <div style={{
          fontSize: 24, lineHeight: 1.45, color: C.gold, fontWeight: 700,
          fontFamily: "'Frank Ruhl Libre', Georgia, serif",
          animation: "fadeUp 0.7s ease-out 1.0s both",
        }}>
          בואו נבנה לכם יום אחד שבו אתם משחקים משחק חדש.
        </div>

        {/* Hadar signature */}
        <div style={{
          marginTop: 12, display: "flex", alignItems: "center", gap: 10,
          animation: "fadeIn 0.7s ease-out 1.4s both",
        }}>
          <div style={{
            width: 32, height: 1, background: C.goldMid,
          }} />
          <div style={{
            fontSize: 13, color: C.goldMid, fontWeight: 600, letterSpacing: 0.4,
          }}>
            הדר
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Strip em-dashes from any Hebrew text the engine produced before we caught
// the rule in the prompt. Replaces " — " with ", " and bare "—" with "."
function sanitizeHebrew(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s+,\s+/g, ", ")
    .replace(/,\s*$/, ".");
}

function ShootDayHero({ identity }: { identity: string }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #1D2430, #111620)",
      border: `1px solid ${C.lineGold}`,
      borderRadius: 16, padding: "28px 24px",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 1.6, color: C.goldMid, fontWeight: 700, textTransform: "uppercase" }}>
        משפט הזהות שלכם
      </div>
      <div style={{
        fontSize: 24, fontWeight: 700, color: C.fg, lineHeight: 1.4,
      }}>
        {sanitizeHebrew(identity)}
      </div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 4 }}>
        זה לא תיאור שירות. זה הצהרת אופי. המשפט שצריך לפתוח כל סרטון, כל עמוד, כל שיחה ראשונה.
      </div>
    </div>
  );
}

function PillarsOverview({ pillars }: { pillars: Pillar[] }) {
  return (
    <Section title="4 עמודי המסר שלכם" hint="כל פיסת תוכן שתוציאו השנה תשב על אחד מהם">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {pillars.map((p) => (
          <div key={p.number} style={{
            background: C.cardSoft, borderRadius: 10, padding: "14px 16px",
            border: `1px solid ${C.line}`,
          }}>
            <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>
              עמוד {p.number}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.fg, marginBottom: 8, lineHeight: 1.4 }}>
              {p.title}
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              {p.message}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function VideosByAct({ videos }: { videos: Video[] }) {
  const act1 = videos.filter((v) => v.act === 1);
  const act2 = videos.filter((v) => v.act === 2);
  const act3 = videos.filter((v) => v.act === 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ActBlock title="ACT 1 · זהות" subtitle="מי אתם לעצמכם" videos={act1} />
      <ActBlock title="ACT 2 · סיפור" subtitle="הסיפורים שמוכיחים את זה" videos={act2} />
      <ActBlock title="ACT 3 · סמכות" subtitle="איך אתם חושבים, לא איך אתם עובדים" videos={act3} />
    </div>
  );
}

// Builds the rest of the shoot day on demand: 3 acts (4 videos each) + visual
// direction/schedule/decisions + 5 gift sentences. Each is one sub-60s API
// call; results stream into the plan as they arrive. The endpoints cache every
// slice, so a refresh or re-open resumes where it left off.
type SetPlan = (updater: (prev: ShootDayPlan | null) => ShootDayPlan | null) => void;

function ShootDayBuilder({
  extractionId, plan, setPlan, stored,
}: { extractionId: string; plan: ShootDayPlan; setPlan: SetPlan; stored: number[] }) {
  const [building, setBuilding] = useState(false);
  const [step, setStep]         = useState<string>("");
  const [error, setError]       = useState<string | null>(null);
  // Video numbers already generated server-side. Seeded from the GET progress;
  // grows as we generate, so a retry after a failure resumes where it stopped.
  const [done, setDone]         = useState<number[]>(stored);

  const body = JSON.stringify({
    identity_statement: plan.identity_statement,
    pillars:            plan.pillars,
  });

  async function post(path: string, payload?: string) {
    const res = await fetch(`/api/signal/${extractionId}/shoot-day/${path}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    payload ?? body,
    });
    const txt = await res.text();
    let data: Record<string, unknown>;
    try { data = JSON.parse(txt); } catch { throw new Error(`${path}: ${txt.slice(0, 200)}`); }
    if (!res.ok) throw new Error(String(data?.error ?? `${path} failed`));
    return data;
  }

  function mergeVideos(newVideos: Video[]) {
    setPlan((prev) => {
      if (!prev) return prev;
      const map = new Map(prev.videos.map((v) => [v.number, v]));
      for (const v of newVideos) map.set(v.number, v);
      return { ...prev, videos: [...map.values()].sort((a, b) => a.number - b.number) };
    });
  }

  async function buildAll() {
    setBuilding(true);
    setError(null);
    try {
      // One video per call — proven sub-60s on Vercel. Skip any already stored.
      const titles: Record<number, string> = {
        1: "סרטון הזהות", 2: "הוק עמוד 1", 3: "הוק עמוד 2", 4: "הוק עמוד 3",
        5: "הוק עמוד 4", 6: "סיפור 1", 7: "סיפור 2", 8: "סיפור 3",
        9: "פריימוורק 1", 10: "פריימוורק 2", 11: "ניפוץ מיתוס", 12: "הזמנה (CTA)",
      };
      // Accumulate the full video set locally so the director step (which needs
      // all 12 titles) sees them even though `plan` is a render snapshot.
      const collected = new Map<number, Video>(plan.videos.map((v) => [v.number, v]));
      for (let n = 1; n <= 12; n++) {
        if (done.includes(n)) continue;
        setStep(`בונה סרטון ${n} מתוך 12 · ${titles[n]}…`);
        const data = await post("videos", JSON.stringify({
          identity_statement: plan.identity_statement,
          pillars:            plan.pillars,
          numbers:            [n],
        }));
        const vids = (data.videos as Video[]) ?? [];
        vids.forEach((v) => collected.set(v.number, v));
        mergeVideos(vids);
        setDone((prev) => prev.includes(n) ? prev : [...prev, n]);
      }

      if (!plan.visual_direction || !plan.schedule || !plan.decisions) {
        setStep("בונה ויזואל, לו\"ז ו-3 החלטות…");
        const s = await post("strategy");
        setPlan((prev) => prev ? {
          ...prev,
          visual_direction: s.visual_direction as ShootDayPlan["visual_direction"],
          schedule:         s.schedule as ShootDayPlan["schedule"],
          decisions:        s.decisions as ShootDayPlan["decisions"],
        } : prev);
      }

      if (!plan.gift_sentences) {
        setStep("בונה 5 משפטי מתנה…");
        const g = await post("gifts");
        setPlan((prev) => prev ? { ...prev, gift_sentences: g.gift_sentences as string[] } : prev);
      }

      if (!plan.director) {
        setStep("כותב את הבימוי האישי של הדר…");
        const videoRefs = [...collected.values()]
          .sort((a, b) => a.number - b.number)
          .map((v) => ({ number: v.number, title: v.title, type: v.type }));
        const d = await post("director", JSON.stringify({
          identity_statement: plan.identity_statement,
          pillars:            plan.pillars,
          videos:             videoRefs,
        }));
        setPlan((prev) => prev ? { ...prev, director: d.director as ShootDayPlan["director"] } : prev);
      }

      setStep("");
      playHadarVoice("completed_shoot_day");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBuilding(false);
    }
  }

  const remaining = 12 - plan.videos.length;

  return (
    <div style={{
      background: C.card, border: `1px dashed ${C.lineGold}`, borderRadius: 12,
      padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ fontSize: 12, color: C.goldMid, fontWeight: 700, letterSpacing: 1.4 }}>
        ✦ השלמת יום הצילום
      </div>
      <div style={{ fontSize: 14, color: C.fg, lineHeight: 1.6 }}>
        {remaining > 0
          ? `בנינו את הסרטון הראשון. עוד ${remaining} סרטונים, הויזואל, הלו"ז, 3 ההחלטות ו-5 משפטי המתנה מחכים לכם.`
          : `הסרטונים מוכנים. נשארו הויזואל, הלו"ז ומשפטי המתנה.`}
      </div>

      {building && (
        <div style={{ fontSize: 13, color: C.goldMid, lineHeight: 1.5 }}>
          {step || "בונה…"}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 13, color: "#E58A8A", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      <button
        onClick={buildAll}
        disabled={building}
        style={{
          alignSelf: "flex-start", marginTop: 4,
          background: building ? C.cardSoft : C.gold,
          color: building ? C.muted : "#1A1206",
          border: "none", borderRadius: 8, padding: "10px 18px",
          fontSize: 14, fontWeight: 700, cursor: building ? "default" : "pointer",
        }}
      >
        {building ? "בונה את יום הצילום…" : "בנו את יום הצילום המלא"}
      </button>
    </div>
  );
}

function DirectorCard({ director, videos }: { director: NonNullable<ShootDayPlan["director"]>; videos: Video[] }) {
  const titleByNum = new Map(videos.map((v) => [v.number, v.title]));
  return (
    <div style={{
      background: "linear-gradient(145deg,#1b2740,#10141f)", border: "1px solid #2f3b54",
      borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div>
        <div style={{ fontSize: 12, color: "#B9A3F0", fontWeight: 700, letterSpacing: 1.4 }}>✦ הבימוי האישי של הדר</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          זה הטקסט שהדר אומרת כדי לביים אותך. בקרוב כסרטון בקול ובפנים שלה.
        </div>
      </div>

      <div style={{
        background: C.bg, borderRight: "3px solid #B9A3F0", borderRadius: 8,
        padding: "12px 14px", fontSize: 15, color: "#E8E4DC", lineHeight: 1.8, whiteSpace: "pre-wrap",
      }}>
        {director.monologue}
      </div>

      <div>
        <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 6 }}>הערות בימוי, סרטון-סרטון</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {director.notes.slice().sort((a, b) => a.number - b.number).map((n) => (
            <div key={n.number} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ flex: "0 0 auto", fontSize: 12, color: "#B9A3F0", fontWeight: 700, minWidth: 64 }}>
                סרטון {n.number}
              </span>
              <span style={{ fontSize: 14, color: C.fg, lineHeight: 1.6 }}>
                {titleByNum.get(n.number) ? <b style={{ color: C.muted }}>{titleByNum.get(n.number)}. </b> : null}
                {n.line}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActBlock({ title, subtitle, videos }: { title: string; subtitle: string; videos: Video[] }) {
  if (videos.length === 0) return null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: C.gold, letterSpacing: 1.4,
        }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>{subtitle}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {videos.map((v) => <VideoCard key={v.number} video={v} />)}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  const [open, setOpen]           = useState(false);
  const [whyOpen, setWhyOpen]     = useState(false);

  function handleExpand() {
    setOpen(!open);
    if (!open) playHadarVoice("expanded_video_card");
  }

  function handleWhy() {
    setWhyOpen(!whyOpen);
    if (!whyOpen) playHadarVoice("clicked_why_button");
  }

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
      padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>
            #{video.number} · {video.type} · {video.duration}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.fg, lineHeight: 1.4 }}>
            {video.title}
          </div>
        </div>
        <button
          onClick={handleWhy}
          aria-label="למה זה?"
          style={{
            background: "transparent", color: C.goldMid, border: `1px solid ${C.lineGold}`,
            borderRadius: 999, padding: "4px 10px", fontSize: 11, cursor: "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap",
          }}
        >
          {whyOpen ? "סגור" : "למה זה?"}
        </button>
      </div>

      {/* Magic #2: Methodology Visibility tooltip */}
      {whyOpen && (
        <div style={{
          background: C.cardSoft, borderRadius: 8, padding: "10px 12px",
          fontSize: 12, color: C.fg, lineHeight: 1.6,
          border: `1px solid ${C.line}`,
        }}>
          <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
            Mode {video.mode} · {video.signature_move.name}
          </div>
          <div style={{ marginBottom: 8 }}>
            {sanitizeHebrew(video.signature_move.explanation)}
          </div>
          <div style={{
            borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 6,
            fontStyle: "italic", color: C.muted,
          }}>
            &ldquo;{sanitizeHebrew(video.hadar_quote.text)}&rdquo;
            <div style={{ fontSize: 10, marginTop: 2 }}>· {video.hadar_quote.source}</div>
          </div>
        </div>
      )}

      <button
        onClick={handleExpand}
        style={{
          background: open ? "rgba(232,185,74,0.08)" : "transparent",
          color: C.gold, border: `1px solid ${C.lineGold}`,
          borderRadius: 8, padding: "8px 12px", fontSize: 12, cursor: "pointer",
          fontFamily: "inherit", textAlign: "right",
        }}
      >
        {open ? "סגור פירוט ↑" : "ראה תסריט + בימוי ↓"}
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Script */}
          <div style={{ background: C.cardSoft, padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 4 }}>הוק</div>
            <div style={{ fontSize: 13, color: C.fg, lineHeight: 1.6, marginBottom: 10 }}>
              {sanitizeHebrew(video.script.hook)}
            </div>
            <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 4 }}>גוף</div>
            <div style={{ fontSize: 13, color: C.fg, lineHeight: 1.6 }}>
              {sanitizeHebrew(video.script.body)}
            </div>
            {video.script.cta && (
              <>
                <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 4, marginTop: 10 }}>CTA</div>
                <div style={{ fontSize: 13, color: C.fg, lineHeight: 1.6 }}>{sanitizeHebrew(video.script.cta)}</div>
              </>
            )}
          </div>

          {/* Direction */}
          <div style={{ background: C.cardSoft, padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 6 }}>הוראות בימוי</div>
            <div style={{ fontSize: 12, color: C.fg, lineHeight: 1.8 }}>
              <div><strong>ויזואלי:</strong> {sanitizeHebrew(video.direction.visual)}</div>
              <div><strong>גוף:</strong> {sanitizeHebrew(video.direction.body_language)}</div>
              <div><strong>טון:</strong> {sanitizeHebrew(video.direction.tone)}</div>
              <div><strong>קשר עין:</strong> {sanitizeHebrew(video.direction.eye_contact)}</div>
            </div>
          </div>

          {/* Anti-category cue */}
          <div style={{
            background: "rgba(232,185,74,0.04)", padding: 12, borderRadius: 8,
            border: `1px solid ${C.lineGold}`,
          }}>
            <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 6 }}>
              הפוך מהקטגוריה
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 4 }}>
              <strong style={{ color: C.fg }}>הם:</strong> {sanitizeHebrew(video.anti_category.competitor_norm)}
            </div>
            <div style={{ fontSize: 12, color: C.fg, lineHeight: 1.6 }}>
              <strong style={{ color: C.gold }}>אתם:</strong> {sanitizeHebrew(video.anti_category.your_inversion)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VisualDirectionCard({ visual }: { visual: NonNullable<ShootDayPlan["visual_direction"]> }) {
  return (
    <Section title="הקטגוריה הויזואלית החדשה שלך" hint="הפוך מהקטגוריה הקיימת">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 8 }}>פלטה</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ColorChip hex={visual.palette.primary} label="ראשי" />
            <ColorChip hex={visual.palette.text} label="טקסט" />
            <ColorChip hex={visual.palette.accent} label="מבטא" />
          </div>
          {visual.palette.forbidden && visual.palette.forbidden.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              אסור: {visual.palette.forbidden.join(", ")}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 8 }}>טיפוגרפיה</div>
          <div style={{ fontSize: 12, color: C.fg, lineHeight: 1.7 }}>
            <div>כותרות: {visual.typography.headlines}</div>
            <div>גוף: {visual.typography.body}</div>
            <div>טכני: {visual.typography.technical}</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 8 }}>צילום</div>
          <div style={{ fontSize: 12, color: C.fg, lineHeight: 1.7 }}>
            <div>עדשה: {visual.cinematography.lens}</div>
            <div>פוקוס: {visual.cinematography.focus}</div>
            <div>אור: {visual.cinematography.light}</div>
            <div>מסגור: {visual.cinematography.framing}</div>
          </div>
        </div>
      </div>
      {visual.references && visual.references.length > 0 && (
        <div style={{ marginTop: 16, padding: "12px 14px", background: C.cardSoft, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, marginBottom: 8 }}>הנחיות לצלם/ת</div>
          {visual.references.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: C.fg, lineHeight: 1.7, marginBottom: 4 }}>· {r}</div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ColorChip({ hex, label }: { hex: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 36, height: 36, background: hex, borderRadius: 8, border: `1px solid ${C.line}` }} />
      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>{hex}</div>
    </div>
  );
}

function ScheduleCard({ schedule }: { schedule: NonNullable<ShootDayPlan["schedule"]> }) {
  return (
    <Section title="לו״ז יום הצילום" hint="08:30 → 17:00. שני סטים, 12 סרטונים. הפסקה חובה ב-13:00.">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {schedule.map((block, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "100px 1fr", gap: 14,
            padding: "10px 12px", background: C.cardSoft, borderRadius: 8,
            border: `1px solid ${C.line}`,
          }}>
            <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, fontFamily: "monospace" }}>
              {block.time}
            </div>
            <div>
              <div style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 2 }}>
                {block.activity}
                {block.videos.length > 0 && (
                  <span style={{ fontSize: 11, color: C.goldMid, fontWeight: 500, marginRight: 8 }}>
                    · סרטונים {block.videos.join(", ")}
                  </span>
                )}
              </div>
              {block.hint && (
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, fontStyle: "italic" }}>
                  &ldquo;{block.hint}&rdquo;
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function GiftSentencesCard({ sentences }: { sentences: string[] }) {
  return (
    <Section title="5 משפטי-מתנה ספציפיים לך" hint="השתמש בהם בסרטונים, בקפשנים, באתר, בהתחלות שיחות. הם שלך.">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sentences.map((s, i) => (
          <CopyBlock key={i} text={s} />
        ))}
      </div>
    </Section>
  );
}

function DecisionsCard({ decisions }: { decisions: NonNullable<ShootDayPlan["decisions"]> }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(num: number) {
    const next = new Set(checked);
    if (next.has(num)) {
      next.delete(num);
    } else {
      next.add(num);
      // Magic #7 — fire tier-appropriate voice on each decision marked
      if (num === 1)                         playHadarVoice("marked_decision_1");
      else if (num === 2)                    playHadarVoice("marked_decision_2");
      else if (num === 3)                    playHadarVoice("marked_decision_3");
      if (next.size === 3)                   playHadarVoice("completed_shoot_day");
    }
    setChecked(next);
  }

  return (
    <Section title="3 החלטות שאתה לוקח עכשיו" hint="לא בקרוב. עכשיו.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {decisions.map((d) => {
          const isChecked = checked.has(d.number);
          return (
            <button
              key={d.number}
              onClick={() => toggle(d.number)}
              style={{
                background: isChecked ? "rgba(232,185,74,0.06)" : C.cardSoft,
                borderRadius: 10, padding: "14px 16px",
                border: `1px solid ${isChecked ? C.lineGold : C.line}`,
                textAlign: "right", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6, marginTop: 2,
                border: `2px solid ${isChecked ? C.gold : C.lineGold}`,
                background: isChecked ? C.gold : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#2a1d05", fontWeight: 700, fontSize: 14,
                flexShrink: 0,
              }}>
                {isChecked ? "✓" : ""}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.goldMid, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>
                  החלטה {d.number} · {d.type}
                </div>
                <div style={{
                  fontSize: 14, color: C.fg, lineHeight: 1.6, marginBottom: 6,
                  textDecoration: isChecked ? "line-through" : "none",
                  opacity: isChecked ? 0.7 : 1,
                }}>
                  {d.text}
                </div>
                <div style={{
                  display: "inline-block", fontSize: 11, color: C.gold, fontWeight: 700,
                  background: "rgba(232,185,74,0.10)", padding: "3px 10px", borderRadius: 999,
                }}>
                  {d.urgency}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function HadarSignoff() {
  return (
    <div style={{
      textAlign: "center", padding: "24px 20px",
      background: "linear-gradient(145deg, #1D2430, #111620)",
      borderRadius: 12, border: `1px solid ${C.lineGold}`,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.gold, marginBottom: 6 }}>
        תהיו טובים.
      </div>
      <div style={{ fontSize: 12, color: C.muted }}>
        הדר
      </div>
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
