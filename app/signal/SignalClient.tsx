"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SIGNAL_QUESTIONS } from "@/lib/prompts/signal-engine";
import { detectGender } from "@/lib/gender/detect";
import { VoiceInput } from "@/components/signal/VoiceInput";
import { CopyButton } from "@/components/signal/CopyButton";
import { EmailMeButton } from "@/components/signal/EmailMeButton";
import { ShareButton } from "@/components/signal/ShareButton";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";

type SignalAnswers = Record<string, string>;
type Gender = "m" | "f";
type Bucket = "challenge" | "strategy" | "hive" | "nurture" | "none";

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

// Santosha tokens — match CLAUDE.md design system.
const C = {
  bg:       "#080C14",
  card:     "#141820",
  cardSoft: "#1D2430",
  gold:     "#E8B94A",
  goldMid:  "#C9964A",
  goldDeep: "#9E7C3A",
  fg:       "#EDE9E1",
  muted:    "#AAB0BD",
  line:     "rgba(232,185,74,0.14)",
};

const MIN_CHARS = 40;          // per-question minimum (soft — server requires 3 answers × 8 chars)
const DRAFT_KEY = "signal_draft_v1";

interface Props {
  firstName?:       string;
  isAuthenticated?: boolean;
  prefillEmail?:    string;
  hiveActive?:      boolean;
}

type Phase = "intro" | "form" | "gate" | "loading" | "result" | "error";

export function SignalClient({ firstName, isAuthenticated = false, prefillEmail, hiveActive = false }: Props) {
  const [phase, setPhase]         = useState<Phase>("intro");
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState<SignalAnswers>({});
  const [signal, setSignal]       = useState<SignalOutput | null>(null);
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [gender, setGender]       = useState<Gender>("f");
  const [bucket, setBucket]       = useState<Bucket>("challenge");
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [cacheChecked, setCacheChecked] = useState(false);

  // Lead-gate fields (anonymous only). First + last name are captured separately
  // so we can store the full name and still personalize emails with the first name.
  const [leadFirstName, setLeadFirstName] = useState(firstName ?? "");
  const [leadLastName,  setLeadLastName]  = useState("");
  const [leadEmail,     setLeadEmail]     = useState(prefillEmail ?? "");
  const [leadPhone,     setLeadPhone]     = useState("");
  const [leadOccupation, setLeadOccupation] = useState("");
  const [leadConsent,   setLeadConsent]   = useState(false);
  const [leadConsentErr, setLeadConsentErr] = useState(false);
  // Gender of address — defaults to detection from first name. Tracked
  // separately so the explicit radio always reflects either the user's
  // override or our current best guess. Once the user clicks a radio,
  // leadGenderTouched=true stops the auto-sync from typing.
  const [leadGender, setLeadGender] = useState<Gender>(() => detectGender(firstName ?? ""));
  const [leadGenderTouched, setLeadGenderTouched] = useState(false);

  // Re-detect from first name as the user types, until they manually pick.
  useEffect(() => {
    if (leadGenderTouched) return;
    if (leadFirstName.trim().length < 2) return;
    setLeadGender(detectGender(leadFirstName));
  }, [leadFirstName, leadGenderTouched]);

  // Load any draft + check for an existing cached signal on mount.
  // GET only returns a signal for authenticated users — anonymous starts fresh.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.answers && typeof draft.answers === "object") {
          setAnswers(draft.answers);
        }
      }
    } catch {}

    if (!isAuthenticated) {
      setCacheChecked(true);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/signal/extract", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data?.signal) {
            setSignal(data.signal);
            setExtractionId(data.id ?? null);
            setGeneratedAt(data.generated_at ?? null);
            if (data.gender === "m" || data.gender === "f") setGender(data.gender);
            if (data.bucket === "challenge" || data.bucket === "strategy" || data.bucket === "hive" || data.bucket === "nurture" || data.bucket === "none") {
              setBucket(data.bucket);
            }
            setPhase("result");
          }
        }
      } catch {}
      setCacheChecked(true);
    })();
  }, [isAuthenticated]);

  // Persist draft so a reload doesn't wipe answers.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers }));
    } catch {}
  }, [answers]);

  const current  = SIGNAL_QUESTIONS[step];
  const value    = answers[current.key] ?? "";
  const progress = ((step + 1) / SIGNAL_QUESTIONS.length) * 100;
  const lastStep = step === SIGNAL_QUESTIONS.length - 1;

  const canAdvance = (): boolean => {
    if (current.key === "hard_period") {
      // The pain question — explicitly allowed to skip per the spec.
      return true;
    }
    return value.trim().length >= MIN_CHARS;
  };

  const setValue = (v: string) => setAnswers((a) => ({ ...a, [current.key]: v }));

  const submit = async () => {
    setPhase("loading");
    setErrorMsg(null);
    try {
      const trimmedFirst = leadFirstName.trim();
      const trimmedLast  = leadLastName.trim();
      const fullName     = [trimmedFirst, trimmedLast].filter(Boolean).join(" ");
      const payload: Record<string, unknown> = {
        answers,
        first_name: firstName ?? trimmedFirst,
      };
      if (!isAuthenticated) {
        payload.email = leadEmail.trim().toLowerCase();
        payload.name  = fullName;
        payload.phone = leadPhone.trim();
        payload.occupation = leadOccupation.trim();
        payload.marketing_consent = leadConsent;
        payload.gender = leadGender;
      }

      const res = await fetch("/api/signal/extract", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.signal) {
        setErrorMsg(data?.error ?? "שגיאת רשת. נסה שוב בעוד רגע.");
        setPhase("error");
        return;
      }
      setSignal(data.signal as SignalOutput);
      setExtractionId((data.id as string | null) ?? null);
      setGeneratedAt(data.generated_at ?? null);
      if (data.gender === "m" || data.gender === "f") setGender(data.gender);
      if (data.bucket === "challenge" || data.bucket === "strategy" || data.bucket === "hive" || data.bucket === "nurture" || data.bucket === "none") {
        setBucket(data.bucket);
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setPhase("result");
    } catch {
      setErrorMsg("שגיאת רשת. נסה שוב בעוד רגע.");
      setPhase("error");
    }
  };

  const next = () => {
    setErrorMsg(null);
    if (lastStep) {
      // Anonymous users see the lead gate before the result; authenticated users
      // jump straight into extraction.
      if (isAuthenticated) {
        void submit();
      } else {
        setPhase("gate");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setErrorMsg(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const restart = () => {
    setSignal(null);
    setExtractionId(null);
    setGeneratedAt(null);
    setAnswers({});
    setStep(0);
    setErrorMsg(null);
    setPhase("form");
  };

  // Show nothing until we've checked for a cached result — avoids the form
  // flashing for a returning user.
  if (!cacheChecked) {
    return (
      <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg }} />
    );
  }

  return (
    <div
      dir="rtl"
      className="font-assistant"
      style={{
        minHeight:      "100vh",
        background:     C.bg,
        color:          C.fg,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "flex-start",
        padding:        "40px 20px 80px",
        position:       "relative",
        overflow:       "hidden",
      }}
    >
      {/* Ambient gold glow */}
      <div
        style={{
          position:      "absolute",
          top:           "-30%",
          left:          "50%",
          transform:     "translateX(-50%)",
          width:         "120vw",
          height:        "60vh",
          background:    "radial-gradient(ellipse at center, rgba(232,185,74,0.07), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 680, position: "relative", zIndex: 1 }}>
        {phase === "intro"  && <Intro firstName={firstName} onStart={() => setPhase("form")} />}
        {phase === "form"   && (
          <FormCard
            step={step}
            total={SIGNAL_QUESTIONS.length}
            progress={progress}
            label={current.label}
            hint={current.hint}
            value={value}
            setValue={setValue}
            onNext={next}
            onBack={back}
            canAdvance={canAdvance()}
            isLast={lastStep}
            errorMsg={errorMsg}
          />
        )}
        {phase === "gate"    && (
          <LeadGate
            firstName={leadFirstName}
            lastName={leadLastName}
            email={leadEmail}
            phone={leadPhone}
            occupation={leadOccupation}
            gender={leadGender}
            consent={leadConsent}
            consentErr={leadConsentErr}
            setFirstName={setLeadFirstName}
            setLastName={setLeadLastName}
            setEmail={setLeadEmail}
            setPhone={setLeadPhone}
            setOccupation={setLeadOccupation}
            setGender={(g) => { setLeadGender(g); setLeadGenderTouched(true); }}
            setConsent={(v) => { setLeadConsent(v); if (v) setLeadConsentErr(false); }}
            setConsentErr={setLeadConsentErr}
            onSubmit={() => void submit()}
            onBack={() => setPhase("form")}
            errorMsg={errorMsg}
          />
        )}
        {phase === "loading" && <Loading />}
        {phase === "error"   && (
          <ErrorCard
            message={errorMsg}
            onRetry={() => setPhase(isAuthenticated ? "form" : "gate")}
          />
        )}
        {phase === "result"  && signal && (
          <Result
            firstName={firstName}
            signal={signal}
            extractionId={extractionId}
            ownerEmail={(isAuthenticated ? prefillEmail : leadEmail.trim().toLowerCase()) || ""}
            generatedAt={generatedAt}
            onRestart={restart}
            hiveActive={hiveActive}
            gender={gender}
            bucket={bucket}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Intro({ firstName, onStart }: { firstName?: string; onStart: () => void }) {
  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 20,
        padding:      "36px 28px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display:       "inline-block",
            fontSize:      12,
            letterSpacing: 1.6,
            color:         C.goldMid,
            marginBottom:  14,
            textTransform: "uppercase",
          }}
        >
          <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 14px", lineHeight: 1.25 }}>
          {firstName ? `${firstName}, ` : ""}מנוע האות
        </h1>
        <p style={{ color: C.fg, opacity: 0.92, fontSize: 17, margin: "0 0 4px", lineHeight: 1.6 }}>
          חמש שאלות. אות מותגי אחד.
        </p>
        <p style={{ color: C.fg, opacity: 0.92, fontSize: 17, margin: "0 0 28px", lineHeight: 1.6 }}>
          לא מה שאתם מוכרים, אלא מה שרק אתם יכולים לתת.
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, margin: "0 0 20px" }} />

      {/* Meta line — voice first (the simpler-modality teaching), then time +
          draft. Q3 skip permission moved out of the intro (was double-permission
          with the in-question skip; was inflating Q3 skip rate). */}
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, margin: "0 0 22px", textAlign: "right" }}>
        <p style={{ margin: "0 0 4px" }}>בכתיבה או בהקלטה בקול.</p>
        <p style={{ margin: "0 0 4px" }}>בקול הדברים יוצאים פשוטים יותר. בלי לערוך תוך כדי.</p>
        <p style={{ margin: 0 }}>כעשר דקות. הטיוטה נשמרת.</p>
      </div>

      {/* Outcome promise — broken into beats for ARS lift on mobile.
          Three blocks:
            1. Artifacts (what you'll keep)
            2. Mechanic + consequence (truth → sharp signal → no selling)
            3. Optional next step (the commercial hook, conditioned on fit) */}
      <div style={{ fontSize: 16, color: C.fg, opacity: 0.94, lineHeight: 1.75, margin: "0 0 30px", textAlign: "right" }}>
        <p style={{ margin: "0 0 6px" }}>בסוף יישאר אצלך משפט אחד להגיד בקול בלי להתנצל.</p>
        <p style={{ margin: "0 0 6px" }}>הקהל שמחפש בדיוק אותך.</p>
        <p style={{ margin: "0 0 16px" }}>שלושה כיווני תוכן להתחיל מהם בלי לחכות.</p>

        <p style={{ margin: "0 0 6px" }}>האות עשוי מהתשובות שלך. כשהן אמת, הוא חד.</p>
        <p style={{ margin: "0 0 16px" }}>כשהאות מדויק, אין מכירה. האנשים הנכונים פשוט קונים.</p>

        <p style={{ margin: 0 }}>ואם יתאים, גם הצעד הבא הנכון לך מכאן.</p>
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={onStart}
          style={{
            background:   "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
            color:        "#2a1d05",
            fontWeight:   700,
            fontSize:     16,
            border:       "none",
            borderRadius: 12,
            padding:      "14px 36px",
            cursor:       "pointer",
            boxShadow:    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
          }}
        >
          לפתוח את השאלה הראשונה
        </button>
      </div>
    </div>
  );
}

interface FormCardProps {
  step:       number;
  total:      number;
  progress:   number;
  label:      string;
  hint:       string;
  value:      string;
  setValue:   (v: string) => void;
  onNext:     () => void;
  onBack:     () => void;
  canAdvance: boolean;
  isLast:     boolean;
  errorMsg:   string | null;
}

function FormCard(props: FormCardProps) {
  const len = props.value.trim().length;
  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 20,
        padding:      "36px 32px",
      }}
    >
      {/* Progress */}
      <div
        style={{
          height:       3,
          background:   "rgba(255,255,255,0.06)",
          borderRadius: 99,
          marginBottom: 28,
          overflow:     "hidden",
        }}
      >
        <div
          style={{
            width:      `${props.progress}%`,
            height:     "100%",
            background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`,
            transition: "width 0.35s ease",
          }}
        />
      </div>

      <div style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>
        שאלה {props.step + 1} מתוך {props.total}
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 6px", lineHeight: 1.3 }}>
        {props.label}
      </h2>
      <p style={{ color: C.muted, fontSize: 15, margin: "0 0 22px", lineHeight: 1.55 }}>
        {props.hint}
      </p>

      <VoiceInput
        hasExistingText={props.value.trim().length > 0}
        onTranscript={(text) => {
          const current = props.value.trim();
          const next = current ? `${current}\n\n${text}` : text;
          props.setValue(next);
        }}
      />

      <textarea
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
        rows={6}
        placeholder="או הקלד/י כאן — בלי לערוך, כפי שאתה/את מדבר/ת."
        style={{
          width:        "100%",
          background:   C.cardSoft,
          color:        C.fg,
          border:       `1px solid ${C.line}`,
          borderRadius: 12,
          padding:      "14px 16px",
          fontSize:     16,
          lineHeight:   1.6,
          fontFamily:   "inherit",
          resize:       "vertical",
          minHeight:    150,
          outline:      "none",
        }}
      />

      {len < MIN_CHARS && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: C.muted }}>
          <span>{`עוד ${MIN_CHARS - len} תווים לפחות`}</span>
          <span>{len} / {MIN_CHARS}+</span>
        </div>
      )}

      {props.errorMsg && (
        <div role="alert" style={{ marginTop: 16, color: "#FF8888", fontSize: 14 }}>
          {props.errorMsg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 12 }}>
        <button
          onClick={props.onBack}
          disabled={props.step === 0}
          style={{
            background:   "transparent",
            color:        props.step === 0 ? "rgba(158,153,144,0.4)" : C.muted,
            border:       `1px solid ${C.line}`,
            borderRadius: 12,
            padding:      "12px 22px",
            cursor:       props.step === 0 ? "not-allowed" : "pointer",
            fontSize:     15,
          }}
        >
          חזרה
        </button>
        <button
          onClick={props.onNext}
          disabled={!props.canAdvance}
          style={{
            background:   props.canAdvance
              ? "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)"
              : "rgba(232,185,74,0.18)",
            color:        props.canAdvance ? "#2a1d05" : "rgba(237,233,225,0.4)",
            fontWeight:   700,
            border:       "none",
            borderRadius: 12,
            padding:      "12px 28px",
            cursor:       props.canAdvance ? "pointer" : "not-allowed",
            fontSize:     15,
            boxShadow:    props.canAdvance ? "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)" : "none",
          }}
        >
          {props.isLast ? "חלץ את האות" : "הלאה"}
        </button>
      </div>
    </div>
  );
}

// Static fallback facts — used if the AI fact endpoint is slow or fails.
const STATIC_BEE_FACTS = [
  "דבורת הדבש מבקרת בין 50 ל-100 פרחים במהלך טיסה אחת לאיסוף צוף",
  "כדי לייצר כף מלאה אחת של דבש, דבורה אחת צריכה לטוס מרחק ששווה לפעמיים סיבוב כדור הארץ",
  "דבורים מתקשרות זו עם זו דרך ריקוד מיוחד שמראה לחברות לכוון לפרחים",
  "המלכה יכולה להטיל עד 2,000 ביצים ביום אחד - יותר ממשקלה שלה",
  "דבורים זוכרות פרצופים אנושיים ומסוגלות לזהות את אותו האדם שוב לאחר ימים",
  "כוורת בריאה מכילה בין 50,000 ל-80,000 דבורות, כמעט כולן נקבות",
  "דבורים ישנות כ-5 עד 8 שעות ביממה, לפעמים בתוך פרחים",
  "כנפי הדבורה מרפרפות 200 פעם בשנייה - זה מה שיוצר את הזמזום המוכר",
  "דבורים יכולות לזהות צבעים שאנחנו לא רואים בכלל, כולל אולטרה-סגול",
  "הדבש לא מתקלקל - נמצא דבש בן 3,000 שנה בקברי פרעונים שעדיין היה אכיל",
  "דבורה אחת מייצרת בכל חייה רק שתים-עשרה כפיות קטנות של דבש",
  "דבורים שומרות על טמפרטורת 35 מעלות בתוך הכוורת גם בקור עז, על ידי רעידות שרירים",
];

function pickRandomFacts(n: number): string[] {
  const shuffled = [...STATIC_BEE_FACTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const SIGNAL_STEPS = [
  "קורא את התשובות שלך",
  "מחלץ את האלמנט",
  "מזהה את הקרקע שצמחת ממנה",
  "מנסח את האות שלך",
] as const;

function Loading() {
  const [progress, setProgress]         = useState(0);
  const [stepIdx, setStepIdx]           = useState(0);
  const [facts, setFacts]               = useState<string[]>(() => pickRandomFacts(6));
  const [factIdx, setFactIdx]           = useState(0);

  // Try to refresh facts with AI-generated ones; fall back silently to static.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/bee-facts")
      .then((r) => r.json())
      .then(({ facts }: { facts?: string[] }) => {
        if (cancelled || !Array.isArray(facts) || facts.length === 0) return;
        setFacts(facts);
        setFactIdx(0);
      })
      .catch(() => { /* keep static facts */ });
    return () => { cancelled = true; };
  }, []);

  // Progress bar: asymptotic approach toward ~97%. Each tick adds a fraction
  // of the remaining gap, so early progress is fast and visible while the
  // later stretch slows naturally. The bar always inches forward — it never
  // sticks at a single number, which would read as a bug.
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        const target = 97;
        const gap    = target - p;
        return p + Math.max(0.08, gap * 0.025);
      });
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Step pulse cycle — synced loosely to the same window the engine takes.
  useEffect(() => {
    const t1 = setTimeout(() => setStepIdx(1), 1400);
    const t2 = setTimeout(() => setStepIdx(2), 3200);
    const t3 = setTimeout(() => setStepIdx(3), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Rotate facts every 4s.
  useEffect(() => {
    if (facts.length === 0) return;
    const id = setInterval(() => setFactIdx((i) => (i + 1) % facts.length), 4000);
    return () => clearInterval(id);
  }, [facts]);

  const clampedProgress = Math.min(progress, 96);

  return (
    <div
      style={{
        background:    C.card,
        border:        `1px solid ${C.line}`,
        borderRadius:  20,
        padding:       "40px 28px 36px",
        textAlign:     "center",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           24,
      }}
    >
      {/* Bee facts rotator */}
      {facts.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            background: C.cardSoft,
            borderRadius: 12,
            padding: "14px 18px",
            border: `1px solid ${C.line}`,
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 700, color: C.goldMid,
              letterSpacing: ".14em", marginBottom: 6,
            }}
          >
            ידעת על הדבורים?
          </div>
          <div
            key={factIdx}
            style={{
              fontSize: 15, color: C.fg, lineHeight: 1.65,
              animation: "vi-fadeMsg 4s ease infinite",
            }}
          >
            {facts[factIdx]}
          </div>
        </div>
      )}

      <div style={{ fontSize: 19, fontWeight: 800, color: C.goldMid, lineHeight: 1.3 }}>
        מחלצים את האות שלך
      </div>

      {/* Progress bar with flying bee logo on top */}
      <div style={{ width: "100%", maxWidth: 360, position: "relative", paddingTop: 48 }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            insetInlineStart: `calc(${clampedProgress}% - 22px)`,
            transition: "inset-inline-start 0.6s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/beegood_logo.png"
            alt=""
            width={44}
            height={44}
            style={{
              objectFit: "contain",
              display: "block",
              animation: "vi-beeFly 1.2s ease-in-out infinite",
            }}
          />
        </div>
        <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 20 }}>
          <div
            style={{
              height: 6,
              borderRadius: 20,
              background: `linear-gradient(90deg, ${C.goldDeep}, ${C.goldMid}, ${C.gold})`,
              width: `${progress}%`,
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 12, color: C.muted }}>0%</span>
          <span style={{ fontSize: 13, color: C.goldMid, fontWeight: 700 }}>{Math.round(progress)}%</span>
          <span style={{ fontSize: 12, color: C.muted }}>100%</span>
        </div>
      </div>

      {/* 4 sequential stages */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360, textAlign: "right" }}>
        {SIGNAL_STEPS.map((label, i) => {
          const done   = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, direction: "rtl" }}>
              <div
                style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: done ? "none" : active ? `2px solid ${C.goldMid}` : `2px solid ${C.line}`,
                  background: done ? C.goldMid : "transparent",
                  animation: active ? "vi-stepPulse 1s infinite" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {done && (
                  <div
                    style={{
                      width: 7, height: 5,
                      borderLeft: "2px solid #0D1018",
                      borderBottom: "2px solid #0D1018",
                      transform: "rotate(-45deg)",
                      marginTop: -2,
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 14,
                  color: done ? C.fg : active ? C.goldMid : C.muted,
                  animation: active ? "vi-stepPulse 1s infinite" : "none",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes vi-beeFly {
          0%   { transform: translateY(0px) rotate(-8deg); }
          25%  { transform: translateY(-8px) rotate(2deg); }
          50%  { transform: translateY(-2px) rotate(8deg); }
          75%  { transform: translateY(-10px) rotate(0deg); }
          100% { transform: translateY(0px) rotate(-8deg); }
        }
        @keyframes vi-stepPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        @keyframes vi-fadeMsg {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

interface LeadGateProps {
  firstName:     string;
  lastName:      string;
  email:         string;
  phone:         string;
  occupation:    string;
  gender:        Gender;
  consent:       boolean;
  consentErr:    boolean;
  setFirstName:  (v: string) => void;
  setLastName:   (v: string) => void;
  setEmail:      (v: string) => void;
  setPhone:      (v: string) => void;
  setOccupation: (v: string) => void;
  setGender:     (v: Gender) => void;
  setConsent:    (v: boolean) => void;
  setConsentErr: (v: boolean) => void;
  onSubmit:      () => void;
  onBack:        () => void;
  errorMsg:      string | null;
}

function LeadGate({
  firstName, lastName, email, phone, occupation, gender, consent, consentErr,
  setFirstName, setLastName, setEmail, setPhone, setOccupation, setGender, setConsent, setConsentErr,
  onSubmit, onBack, errorMsg,
}: LeadGateProps) {
  const trimmedFirst = firstName.trim();
  const trimmedLast  = lastName.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const trimmedOcc   = occupation.trim();
  const validEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  // Israeli mobile pattern is loose on purpose — accept 05X-XXXXXXX, with or
  // without dashes / spaces / international prefix. Server re-validates.
  const validPhone   = /^[0-9+\-\s()]{9,20}$/.test(trimmedPhone);
  const canSubmit    = trimmedFirst.length >= 2
                    && trimmedLast.length >= 2
                    && validEmail
                    && validPhone
                    && trimmedOcc.length >= 2;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (!consent) { setConsentErr(true); return; }
    onSubmit();
  }

  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 20,
        padding:      "36px 32px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display:       "inline-block",
            fontSize:      12,
            letterSpacing: 1.6,
            color:         C.goldMid,
            marginBottom:  12,
            textTransform: "uppercase",
          }}
        >
          <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.3 }}>
          כמעט שם
        </h2>
        <p style={{ color: C.muted, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
          השאר/י שם ואימייל, האות שלך נשמר אצלך לחיים ואפשר לחזור אליו בכל רגע.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "block" }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>שם פרטי</div>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              autoFocus
              style={{
                width:        "100%",
                background:   C.cardSoft,
                color:        C.fg,
                border:       `1px solid ${C.line}`,
                borderRadius: 12,
                padding:      "12px 16px",
                fontSize:     16,
                fontFamily:   "inherit",
                outline:      "none",
              }}
            />
          </label>
          <label style={{ display: "block" }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>שם משפחה</div>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              style={{
                width:        "100%",
                background:   C.cardSoft,
                color:        C.fg,
                border:       `1px solid ${C.line}`,
                borderRadius: 12,
                padding:      "12px 16px",
                fontSize:     16,
                fontFamily:   "inherit",
                outline:      "none",
              }}
            />
          </label>
        </div>

        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>אימייל</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            style={{
              width:        "100%",
              background:   C.cardSoft,
              color:        C.fg,
              border:       `1px solid ${C.line}`,
              borderRadius: 12,
              padding:      "12px 16px",
              fontSize:     16,
              fontFamily:   "inherit",
              outline:      "none",
              textAlign:    "left",
            }}
          />
        </label>

        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>טלפון נייד</div>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-0000000"
            dir="ltr"
            style={{
              width:        "100%",
              background:   C.cardSoft,
              color:        C.fg,
              border:       `1px solid ${C.line}`,
              borderRadius: 12,
              padding:      "12px 16px",
              fontSize:     16,
              fontFamily:   "inherit",
              outline:      "none",
              textAlign:    "left",
            }}
          />
        </label>

        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>תאר/י את תחום העיסוק</div>
          <input
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            maxLength={200}
            style={{
              width:        "100%",
              background:   C.cardSoft,
              color:        C.fg,
              border:       `1px solid ${C.line}`,
              borderRadius: 12,
              padding:      "12px 16px",
              fontSize:     16,
              fontFamily:   "inherit",
              outline:      "none",
            }}
          />
        </label>

        {/* Gender of address — pre-filled from first-name detection. Users
            see two pronoun choices (intentionally not "מין" — the question is
            "how should we speak to you," not "what are you"). The default
            value is whatever detectGender() returned, so 90% of users just
            confirm without thinking. */}
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>איך נכון לפנות אליך?</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([
              { value: "f" as Gender, label: "את" },
              { value: "m" as Gender, label: "אתה" },
            ]).map((opt) => {
              const selected = gender === opt.value;
              return (
                <label
                  key={opt.value}
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    gap:            8,
                    padding:        "12px 14px",
                    background:     selected ? "rgba(232,185,74,0.10)" : C.cardSoft,
                    border:         `1px solid ${selected ? C.goldMid : C.line}`,
                    borderRadius:   12,
                    cursor:         "pointer",
                    fontSize:       15,
                    fontWeight:     selected ? 700 : 500,
                    color:          selected ? C.fg : C.muted,
                    transition:     "background 0.15s, border-color 0.15s, color 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={selected}
                    onChange={() => setGender(opt.value)}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div style={{ marginTop: 4 }}>
          <ConsentCheckbox
            checked={consent}
            onChange={setConsent}
            error={consentErr}
            dark
          />
        </div>

        {errorMsg && (
          <div role="alert" style={{ color: "#FF8888", fontSize: 14, marginTop: 4 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 12 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background:   "transparent",
              color:        C.muted,
              border:       `1px solid ${C.line}`,
              borderRadius: 12,
              padding:      "12px 22px",
              cursor:       "pointer",
              fontSize:     15,
            }}
          >
            חזרה
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              background:   canSubmit
                ? "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)"
                : "rgba(232,185,74,0.18)",
              color:        canSubmit ? "#2a1d05" : "rgba(237,233,225,0.4)",
              fontWeight:   700,
              border:       "none",
              borderRadius: 12,
              padding:      "12px 28px",
              cursor:       canSubmit ? "pointer" : "not-allowed",
              fontSize:     15,
              boxShadow:    canSubmit ? "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)" : "none",
            }}
          >
            לחילוץ האות שלי ←
          </button>
        </div>

        <p style={{ fontSize: 12, color: C.muted, textAlign: "center", margin: "8px 0 0", lineHeight: 1.6 }}>
          הפרטים נשמרים אצלנו ולא משותפים עם אף אחד. ניתן להסיר את עצמך בכל רגע.
        </p>
      </form>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 20,
        padding:      "44px 32px",
        textAlign:    "center",
      }}
    >
      <h2 style={{ fontSize: 22, margin: "0 0 12px" }}>קרתה תקלה קטנה</h2>
      <p style={{ color: C.muted, fontSize: 15, margin: "0 0 24px" }}>
        {message ?? "המנוע לא חזר עם תשובה. ננסה שוב?"}
      </p>
      <button
        onClick={onRetry}
        style={{
          background:   "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
          color:        "#2a1d05",
          fontWeight:   700,
          border:       "none",
          borderRadius: 12,
          padding:      "12px 28px",
          cursor:       "pointer",
          fontSize:     15,
          boxShadow:    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
        }}
      >
        חזרה לטופס
      </button>
    </div>
  );
}

interface ResultProps {
  firstName?:    string;
  signal:        SignalOutput;
  extractionId:  string | null;
  ownerEmail:    string;
  generatedAt:   string | null;
  onRestart:     () => void;
  hiveActive?:   boolean;
  gender:        Gender;
  bucket:        Bucket;
}

// Gender-aware static labels. Most pronouns in unvowelled Hebrew are written
// identically across masc/fem (שלך, עבורך, לך), so only the imperatives diverge.
const labelsByGender = {
  m: {
    copy:      "העתק את האות",
    share:     "שתף בקישור",
    moreEmail: "שלח אליי את האות במייל",
    restart:   "להתחיל מחדש",
  },
  f: {
    copy:      "העתיקי את האות",
    share:     "שתפי בקישור",
    moreEmail: "שלחי אליי את האות במייל",
    restart:   "להתחיל מחדש",
  },
} as const;

function Result({
  firstName, signal, extractionId, ownerEmail, generatedAt, onRestart,
  hiveActive = false, gender, bucket,
}: ResultProps) {
  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const t = labelsByGender[gender];

  // Hive members always get the signal-kit path regardless of bucket — that
  // hub is the rest-of-membership experience and is the natural home for the
  // signal. We treat hiveActive as the strongest override.
  const inviteBucket: Bucket = hiveActive ? "hive" : bucket;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Header — soft, personal, no brand kicker */}
      <div style={{ textAlign: "center", padding: "8px 0 2px" }}>
        <h1 style={{
          fontSize:     30,
          fontWeight:   700,
          margin:       "0 0 6px",
          lineHeight:   1.25,
          letterSpacing: "-0.3px",
        }}>
          {firstName ? `${firstName}, האות שלך` : "האות שלך"}
        </h1>
        {dateStr && (
          <p style={{ color: C.muted, fontSize: 13, margin: 0, fontStyle: "italic" }}>
            חולץ עבורך ב-{dateStr}
          </p>
        )}
      </div>

      {/* The signal itself — center stage. Buttons moved below the letter so
          the peak moment is uninterrupted. */}
      <div
        className="signal-hero"
        style={{
          position:     "relative",
          background:   `linear-gradient(145deg, ${C.cardSoft}, ${C.card})`,
          border:       `1px solid ${C.goldMid}`,
          borderRadius: 24,
          padding:      "42px 32px 38px",
          textAlign:    "center",
          boxShadow:    "0 16px 40px rgba(232,185,74,0.14), 0 1px 0 rgba(255,255,255,0.04) inset",
        }}
      >
        {/* Decorative gold line above the kicker */}
        <div
          aria-hidden
          style={{
            position:   "absolute",
            top:        14,
            right:      "50%",
            transform:  "translateX(50%)",
            width:      42,
            height:     1,
            background: "linear-gradient(90deg, transparent, #C9964A, transparent)",
          }}
        />
        <div style={{
          color:         C.goldMid,
          fontSize:      11.5,
          letterSpacing: 2,
          marginBottom:  18,
          textTransform: "uppercase",
          fontWeight:    600,
        }}>
          האות
        </div>
        <p style={{
          fontSize:     23,
          lineHeight:   1.5,
          margin:       0,
          color:        C.fg,
          fontWeight:   500,
          letterSpacing: "-0.2px",
        }}>
          {signal.signal}
        </p>
      </div>

      {/* The letter — signal_promise + element + warm_note as one flowing block,
          signed "הדר". This is the heart of the result page. */}
      <div
        className="signal-letter"
        style={{
          background:   "linear-gradient(180deg, rgba(232,185,74,0.045) 0%, transparent 100%)",
          border:       "1px solid rgba(232,185,74,0.22)",
          borderRadius: 18,
          padding:      "36px 32px 28px",
        }}
      >
        <div style={{
          color:         C.goldMid,
          fontSize:      11,
          letterSpacing: 1.6,
          marginBottom:  18,
          textTransform: "uppercase",
          textAlign:     "right",
          fontWeight:    600,
        }}>
          מהדר
        </div>

        {signal.signal_promise && (
          <p style={{ margin: "0 0 18px", lineHeight: 1.85, fontSize: 16, color: C.fg }}>
            {signal.signal_promise}
          </p>
        )}

        {signal.element && (
          <p style={{
            margin:       "0 0 18px",
            lineHeight:   1.85,
            fontSize:     16,
            color:        C.fg,
            paddingRight: 12,
            borderRight:  "2px solid rgba(232,185,74,0.4)",
          }}>
            {signal.element}
          </p>
        )}

        {signal.warm_note && (
          <p style={{ margin: "0 0 0", lineHeight: 1.85, fontSize: 16, color: C.fg }}>
            {signal.warm_note}
          </p>
        )}

        <p style={{
          fontFamily:    "'Frank Ruhl Libre', Georgia, serif",
          fontSize:      24,
          color:         C.gold,
          fontWeight:    500,
          margin:        "22px 0 0",
          letterSpacing: "-0.3px",
        }}>
          הדר
        </p>
      </div>

      {/* Content directions block — the 3 starting angles the LLM extracted.
          Visible inline so the user keeps them, not buried in shared cards. */}
      {Array.isArray(signal.content_directions) && signal.content_directions.length === 3 && (
        <ContentDirectionsBlock directions={signal.content_directions} />
      )}

      {/* Card preview + share + contest. The card is rendered inline via the
          existing /api/signal/[id]/share-card PNG endpoint, wrapped in a gold
          frame so it doesn't blend with the dark Santosha page. Below: share
          actions and the compact monthly-contest box pointing to /contest. */}
      {extractionId ? (
        <CardPreviewBlock
          extractionId={extractionId}
          firstName={firstName}
          signalText={signal.signal}
          copyLabel={t.copy}
        />
      ) : (
        <div className="result-actions" style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <CopyButton
            text={`${signal.signal}\n\nTrueSignal© · beegood.online`}
            label={t.copy}
          />
        </div>
      )}

      {/* Bridge — connects the personal moment to the offer below. Skipped
          for bucket=none, where no offer follows. */}
      <ResultBridge gender={gender} bucket={inviteBucket} />

      {/* Conditional invite block — drives the funnel. Bucket comes from
          determineBucket() server-side. Signal is passed so per-bucket cards
          can personalize copy from the user's just-extracted soul fields. */}
      <InviteCard bucket={inviteBucket} signal={signal} />

      {/* Quiet footer — utility actions kept small and out of the way */}
      <div className="result-footer" style={{ textAlign: "center", paddingTop: 4, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {extractionId && ownerEmail && (
          <EmailMeButton extractionId={extractionId} ownerEmail={ownerEmail} />
        )}
        <button
          onClick={onRestart}
          style={{
            background:   "transparent",
            color:        C.muted,
            border:       `1px solid ${C.line}`,
            borderRadius: 999,
            padding:      "10px 22px",
            cursor:       "pointer",
            fontSize:     13,
            fontWeight:   600,
          }}
        >
          {t.restart}
        </button>
      </div>

      {/* Print-friendly styles. Hide nav/CTAs/footer chrome and reflow for paper. */}
      <style>{`
        @media print {
          @page { margin: 18mm 14mm; }
          nav, header, footer,
          .result-actions,
          .result-footer,
          .invite-card { display: none !important; }
          body {
            background: #ffffff !important;
            color: #1a1a1a !important;
          }
          .signal-hero {
            background: #ffffff !important;
            border: 1px solid #C9964A !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          .signal-hero p { color: #1a1a1a !important; }
          .signal-letter {
            background: #ffffff !important;
            border: 1px solid #C9964A !important;
            page-break-inside: avoid;
          }
          .signal-letter p { color: #1a1a1a !important; }
        }
      `}</style>
    </div>
  );
}

// ── Bridge · connects the letter to the offer ──────────────────────────────
// Visitor just had a personal moment. Pivoting straight to a product card
// is jarring. The bridge holds her there for one more breath and points at
// what naturally follows for her bucket. Skipped when bucket=none (no offer
// to bridge to).

const BRIDGE_TAILS: Record<Exclude<Bucket, "none">, string> = {
  challenge: "שבעה ימים, וזה הופך לתוכן.",
  strategy:  "פנים אל פנים, על העסק שלך.",
  hive:      "מקום שממשיכים לעבוד בו עליו.",
  nurture:   "ההמשך מתחיל מההדרכה. חינמית, עשרים דקות.",
};

// ── Content directions block ───────────────────────────────────────────────
// Renders the 3 content directions the LLM extracted, as a numbered list. The
// user keeps these visibly on-page (not only inside the share card), so they
// have actionable starting points the moment they finish the signal.
function ContentDirectionsBlock({ directions }: { directions: readonly string[] }) {
  return (
    <div style={{
      background:   C.cardSoft,
      border:       `1px solid ${C.line}`,
      borderRadius: 16,
      padding:      "26px 26px 22px",
    }}>
      <div style={{
        color:         C.goldMid,
        fontSize:      11,
        letterSpacing: 1.6,
        marginBottom:  6,
        textTransform: "uppercase",
        textAlign:     "right",
        fontWeight:    600,
      }}>
        כיווני תוכן
      </div>
      <h4 style={{
        fontSize:     17,
        fontWeight:   700,
        color:        C.fg,
        marginBottom: 16,
        textAlign:    "right",
        margin:       "0 0 16px",
      }}>
        שלושה כיוונים להתחיל מהם
      </h4>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {directions.map((d, i) => (
          <li
            key={i}
            style={{
              padding:           "13px 0",
              paddingInlineStart: 38,
              position:          "relative",
              fontSize:          14.5,
              lineHeight:        1.75,
              color:             C.fg,
              borderBottom:      i < directions.length - 1 ? `1px solid ${C.line}` : "none",
              textAlign:         "right",
            }}
          >
            <span style={{
              position:      "absolute",
              insetInlineStart: 0,
              top:           13,
              width:         24,
              height:        24,
              borderRadius:  "50%",
              background:    C.gold,
              color:         C.bg,
              fontSize:      12,
              fontWeight:    800,
              display:       "grid",
              placeItems:    "center",
            }}>
              {i + 1}
            </span>
            {d}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Card preview + share + contest block ──────────────────────────────────
// The 1080×1080 share-card PNG is rendered inline as <img>, wrapped in a
// gold-tinted frame so it doesn't blend with the dark Santosha page. Below
// the card: share + copy buttons + the compact monthly-contest box.
function CardPreviewBlock({
  extractionId,
  firstName,
  signalText,
  copyLabel,
}: {
  extractionId: string;
  firstName?:   string;
  signalText:   string;
  copyLabel:    string;
}) {
  return (
    <div style={{
      background:   C.cardSoft,
      border:       `1px solid ${C.line}`,
      borderRadius: 16,
      padding:      "26px 22px 22px",
      textAlign:    "center",
    }}>
      <div style={{
        color:         C.goldMid,
        fontSize:      11,
        letterSpacing: 1.6,
        marginBottom:  18,
        textTransform: "uppercase",
        fontWeight:    600,
      }}>
        הכרטיס שלך
      </div>

      {/* Gold-tinted frame — makes the card pop against the dark page */}
      <div style={{
        display:      "inline-block",
        padding:      10,
        background:   "rgba(232,185,74,0.03)",
        border:       "1px solid rgba(201,150,74,0.40)",
        borderRadius: 16,
        boxShadow:    "0 0 36px rgba(201,150,74,0.15), 0 0 0 3px rgba(0,0,0,0.35), 0 20px 50px rgba(0,0,0,0.55)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/signal/${extractionId}/share-card`}
          alt="הכרטיס שלך"
          width={300}
          height={300}
          style={{
            display:      "block",
            width:        300,
            height:       300,
            maxWidth:     "100%",
            borderRadius: 8,
          }}
        />
      </div>

      {/* Share + copy actions */}
      <div className="result-actions" style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
        <ShareButton extractionId={extractionId} firstName={firstName} />
        <CopyButton
          text={`${signalText}\n\nTrueSignal© · beegood.online`}
          label={copyLabel}
        />
      </div>

      {/* Monthly contest — compact, doesn't dominate the page. Links to /contest. */}
      <ContestBox />
    </div>
  );
}

// ── Monthly contest box ───────────────────────────────────────────────────
// Compact attention element under the share buttons. Encourages tagging
// @hadar_danan on Instagram/Facebook/TikTok/LinkedIn. Full terms at /contest.
function ContestBox() {
  return (
    <div style={{
      marginTop:    14,
      padding:      "12px 16px",
      background:   "rgba(232,185,74,0.04)",
      border:       "1px solid rgba(232,185,74,0.18)",
      borderRadius: 10,
      textAlign:    "center",
    }}>
      <div style={{
        fontSize:      9.5,
        fontWeight:    800,
        color:         C.goldMid,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        marginBottom:  6,
      }}>
        כנסו לתחרות
      </div>
      <div style={{
        fontSize:     13.5,
        fontWeight:   700,
        color:        C.gold,
        marginBottom: 6,
      }}>
        כל חודש זוכה אחד. שלושה סרטונים.
      </div>
      <div style={{
        fontSize:     11.5,
        lineHeight:   1.65,
        color:        C.muted,
        marginBottom: 6,
      }}>
        שתפו את הכרטיס באינסטגרם, פייסבוק, טיקטוק או לינקדאין, תייגו{" "}
        <span style={{
          fontFamily: "Monaco, monospace",
          color:      C.goldMid,
          fontWeight: 700,
        }}>
          @hadar_danan
        </span>
        . מי שעורר הכי הרבה שיחה החודש (תגובות ולייקים) מקבל תהליך הפקת תוכן עם הדר. שלושה סרטונים שלמים, בשווי אלפי שקלים.
      </div>
      <Link
        href="/contest"
        style={{
          display:             "inline-block",
          fontSize:            10.5,
          color:               C.goldMid,
          textDecoration:      "underline",
          textUnderlineOffset: 3,
          opacity:             0.85,
        }}
      >
        תקנון מלא ←
      </Link>
    </div>
  );
}

function ResultBridge({ gender, bucket }: { gender: Gender; bucket: Bucket }) {
  if (bucket === "none") return null;
  const opener = gender === "m"
    ? "אתה חילצת את האות שלך. עכשיו צריך לתת לו צורה."
    : "את חילצת את האות שלך. עכשיו צריך לתת לו צורה.";
  // Middle line — names the principle that earns the offer reveal:
  // signal → outcome needs a working partner, not just an artifact.
  // Gender-neutral (לך works for m/f unvowelled; עזרה agrees with Hadar f).
  const principle = "הדרך הקצרה ביותר מאות לתוצאה היא לעבוד עליו עם מי שעזרה לך לחלץ אותו.";
  const tail = BRIDGE_TAILS[bucket];

  return (
    <div style={{
      textAlign:  "center",
      padding:    "8px 12px 0",
      maxWidth:   480,
      marginInline: "auto",
    }}>
      <p style={{
        margin:        "0 0 6px",
        fontSize:      15.5,
        lineHeight:    1.65,
        color:         C.fg,
        fontStyle:     "italic",
      }}>
        {opener}
      </p>
      <p style={{
        margin:        "0 0 6px",
        fontSize:      14,
        lineHeight:    1.65,
        color:         C.muted,
      }}>
        {principle}
      </p>
      <p style={{
        margin:        0,
        fontSize:      14,
        lineHeight:    1.55,
        color:         C.goldMid,
        letterSpacing: 0.2,
      }}>
        {tail}
      </p>
    </div>
  );
}

// ── Invite cards · one per bucket ───────────────────────────────────────────
// Visual design intentionally mirrors /test: gradient card, header row with
// product name + price, dividers between sections.

const INVITE_STYLES = {
  card:        "linear-gradient(145deg, #1D2430, #111620)",
  borderSoft:  "rgba(201,150,74,0.16)",
  borderHot:   "rgba(201,150,74,0.45)",
  text:        "#EDE9E1",
  muted:       "#AAB0BD",
  border:      "#2C323E",
  gold:        "#E8B94A",
  goldDeep:    "#C9964A",
  success:     "#7FD49B",
} as const;

function InviteCard({ bucket, signal }: { bucket: Bucket; signal: SignalOutput }) {
  if (bucket === "none") {
    // Truly thin answers (<40 chars total). Don't push commerce. Save +
    // invite to retry. Honest framing — not "we rejected you" but "this
    // didn't ripen yet". One CTA: come back when you have 10 quiet minutes.
    return (
      <div className="invite-card" style={{
        background:   "#1D2430",
        border:       `1px solid ${INVITE_STYLES.border}`,
        borderRadius: 14,
        padding:      "28px 24px",
        textAlign:    "center",
      }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 18, lineHeight: 1.4, color: INVITE_STYLES.text, fontWeight: 700 }}>
          האות שלכם עוד לא הבשיל.
        </h3>
        <p style={{ margin: "0 0 22px", fontSize: 14.5, lineHeight: 1.7, color: INVITE_STYLES.muted }}>
          התשובות היו קצרות מדי בשביל לחלץ אות חד. זה לא אומר שאין אות, זה אומר שצריך עוד רגע אחד.
          כשיש לכם עשר דקות שקטות, חזרו לשאלות. השאלות נשמרו.
        </p>
        <Link
          href="/signal?retry=1"
          style={{
            display:        "inline-block",
            padding:        "11px 22px",
            background:     `linear-gradient(135deg, ${INVITE_STYLES.gold}, ${INVITE_STYLES.goldDeep})`,
            color:          "#1A1A1A",
            fontSize:       14,
            fontWeight:     700,
            borderRadius:   8,
            textDecoration: "none",
          }}
        >
          לחזור לשאלות ←
        </Link>
      </div>
    );
  }

  if (bucket === "nurture") return <NurtureInvite />;
  if (bucket === "strategy") return <StrategyInvite />;
  if (bucket === "hive")     return <HiveInvite />;
  return <ChallengeInvite signal={signal} />;
}

// Nurture invite — for users whose answers were thin-but-engaged (40-79 chars)
// or whose LLM routing_signal said "nurture" (soulful but commercially not
// ready). Goal: convert this segment from a dead-end into a list-build.
// Primary CTA: free training (₪0). Secondary: retry. The "save+share" option
// is implicit via the share card already rendered elsewhere on the page.
function NurtureInvite() {
  return (
    <div className="invite-card" style={{
      background:   INVITE_STYLES.card,
      border:       `1px solid ${INVITE_STYLES.borderSoft}`,
      borderRadius: 14,
      padding:      "26px 24px 22px",
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: INVITE_STYLES.success, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>
          חינם · ההמשך הנכון לכם
        </div>
        <h3 style={{ margin: 0, fontSize: 19, lineHeight: 1.4, color: INVITE_STYLES.text, fontWeight: 700 }}>
          האות שלכם בפנים, וזו רק ההתחלה.
        </h3>
      </div>

      <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.7, color: INVITE_STYLES.muted }}>
        מה שיצא היום הוא כיוון, לא תוצר סופי. לפני שמשקיעים בקורס או בפגישה, ההדרכה החינמית של הדר על שיווק ב-2026 היא המקום להתחיל בו.
      </p>

      <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          "עשרים דקות. ללא תשלום, ללא כרטיס אשראי.",
          "השיעור הפתיחה של הדר על מה שעובד היום בשיווק.",
          "תרגיל מעשי לחידוד האות שכבר חילצתם.",
        ].map((b, i) => (
          <li key={i} style={{ fontSize: 13.5, color: INVITE_STYLES.text, lineHeight: 1.55, paddingInlineStart: 16, position: "relative" }}>
            <span style={{ position: "absolute", insetInlineStart: 0, top: 1, color: INVITE_STYLES.success, fontWeight: 800 }}>✓</span>
            {b}
          </li>
        ))}
      </ul>

      <Link
        href="/training"
        style={{
          display:        "block",
          padding:        "14px 22px",
          background:     `linear-gradient(135deg, ${INVITE_STYLES.gold}, ${INVITE_STYLES.goldDeep})`,
          color:          "#1A1A1A",
          fontSize:       15,
          fontWeight:     800,
          borderRadius:   10,
          textDecoration: "none",
          textAlign:      "center",
          marginBottom:   10,
        }}
      >
        אני רוצה לראות את ההדרכה ←
      </Link>

      <Link
        href="/signal?retry=1"
        style={{
          display:        "block",
          fontSize:       12.5,
          color:          INVITE_STYLES.muted,
          textAlign:      "center",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        או חזרו לשאלות לחדד את האות
      </Link>
    </div>
  );
}

function PriceBlock({
  amount, anchor, suffix,
}: { amount: string; anchor?: string; suffix?: string }) {
  return (
    <div style={{ textAlign: "left" }}>
      {anchor && (
        <span style={{
          fontSize:      13,
          color:         INVITE_STYLES.muted,
          textDecoration: "line-through",
          marginBottom:  2,
          display:       "block",
        }}>{anchor}</span>
      )}
      <p style={{
        fontSize:   24,
        fontWeight: 900,
        color:      INVITE_STYLES.text,
        margin:     0,
        lineHeight: 1.1,
      }}>
        <small style={{ fontSize: 18, fontWeight: 700, marginLeft: 2, color: INVITE_STYLES.muted }}>₪</small>
        {amount}
        {suffix && <small style={{ fontSize: 14, fontWeight: 600, color: INVITE_STYLES.muted }}>{suffix}</small>}
      </p>
      <p style={{ fontSize: 11, color: INVITE_STYLES.muted, margin: "2px 0 0" }}>כולל מע״מ</p>
    </div>
  );
}

function InviteHeader({ name, price }: { name: string; price: React.ReactNode }) {
  return (
    <div style={{
      display:        "flex",
      justifyContent: "space-between",
      alignItems:     "center",
      paddingBottom:  16,
      borderBottom:   `1px solid ${INVITE_STYLES.border}`,
    }}>
      <span style={{ color: INVITE_STYLES.muted, fontSize: 15 }}>{name}</span>
      {price}
    </div>
  );
}

function InviteBullets({ items }: { items: string[] }) {
  return (
    <ul style={{
      margin:        0,
      padding:       0,
      listStyle:     "none",
      display:       "flex",
      flexDirection: "column",
      gap:           10,
      paddingTop:    4,
    }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display:    "flex",
          alignItems: "flex-start",
          gap:        10,
          fontSize:   14.5,
          lineHeight: 1.6,
          color:      INVITE_STYLES.text,
        }}>
          <span aria-hidden style={{
            width:        6,
            height:       6,
            borderRadius: "50%",
            background:   INVITE_STYLES.goldDeep,
            flexShrink:   0,
            marginTop:    9,
          }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function InviteStats({ stats }: { stats: { v: string; l: string }[] }) {
  return (
    <div style={{
      display:        "flex",
      justifyContent: "space-around",
      gap:            12,
      padding:        "14px 0",
      borderTop:      `1px solid ${INVITE_STYLES.border}`,
      borderBottom:   `1px solid ${INVITE_STYLES.border}`,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{ textAlign: "center", flex: 1 }}>
          <span style={{
            fontSize:   18,
            fontWeight: 800,
            color:      INVITE_STYLES.goldDeep,
            display:    "block",
            lineHeight: 1,
          }}>{s.v}</span>
          <span style={{
            fontSize:      11,
            color:         INVITE_STYLES.muted,
            letterSpacing: 0.3,
            marginTop:     5,
            display:       "block",
          }}>{s.l}</span>
        </div>
      ))}
    </div>
  );
}

function InviteCTA({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display:        "inline-block",
        background:     "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
        color:          "#2a1d05",
        fontWeight:     800,
        fontSize:       15.5,
        borderRadius:   10,
        padding:        "14px 28px",
        textDecoration: "none",
        boxShadow:      "0 1px 0 rgba(255,255,255,0.55) inset, 0 -8px 18px rgba(157,110,12,0.3) inset, 0 12px 24px -10px rgba(214,155,31,0.5), 0 4px 10px -4px rgba(0,0,0,0.5)",
        width:          "100%",
        textAlign:      "center",
        boxSizing:      "border-box",
      }}
    >
      {label}
    </Link>
  );
}

function InviteGuarantee({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display:    "flex",
      alignItems: "flex-start",
      gap:        10,
      paddingTop: 14,
      borderTop:  `1px solid ${INVITE_STYLES.border}`,
      fontSize:   12.5,
      color:      INVITE_STYLES.muted,
      lineHeight: 1.6,
    }}>
      <span aria-hidden style={{
        width:        18,
        height:       18,
        borderRadius: "50%",
        background:   "rgba(127,212,155,0.12)",
        color:        INVITE_STYLES.success,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        fontSize:     11,
        flexShrink:   0,
        marginTop:    2,
        fontWeight:   700,
      }}>✓</span>
      <p style={{ margin: 0 }}>{children}</p>
    </div>
  );
}

function InviteLadder({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      textAlign:   "center",
      paddingTop:  14,
      borderTop:   `1px dashed ${INVITE_STYLES.border}`,
      fontSize:    12.5,
      color:       INVITE_STYLES.muted,
    }}>
      {children}
    </div>
  );
}

function ChallengeInvite({ signal }: { signal: SignalOutput }) {
  // Personalization band — uses just-extracted soul fields to anchor the
  // commercial offer to *this user's* signal. Fall back to the static
  // headline when fields are missing or empty.
  const element = signal.element?.trim();
  const firstDirection = signal.content_directions?.[0]?.trim();
  const hasPersonalization = Boolean(element && firstDirection);

  return (
    <div
      className="invite-card"
      style={{
        background:   INVITE_STYLES.card,
        border:       `1px solid ${INVITE_STYLES.borderSoft}`,
        borderRadius: 16,
        padding:      24,
        display:      "flex",
        flexDirection: "column",
        gap:          16,
      }}
    >
      <InviteHeader name="אתגר 7 הימים" price={<PriceBlock amount="197" anchor="₪297" />} />

      <h3 style={{
        margin:       0,
        fontSize:     20,
        lineHeight:   1.4,
        fontWeight:   700,
        color:        INVITE_STYLES.text,
        letterSpacing: "-0.2px",
      }}>
        שבעה ימים לתרגם את האות שלכם לתוכן שמוכר
      </h3>
      <p style={{ margin: 0, color: INVITE_STYLES.muted, fontSize: 14.5, lineHeight: 1.65 }}>
        קורס און דימנד. גישה מיידית לשיעור הפתיחה תוך שניות אחרי התשלום. אין מחזורים, אין המתנה.
      </p>

      {hasPersonalization && (
        <div style={{
          marginTop:    2,
          padding:      "12px 14px",
          background:   "rgba(232,185,74,0.06)",
          border:       `1px solid rgba(232,185,74,0.18)`,
          borderRadius: 10,
        }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: INVITE_STYLES.text, fontStyle: "italic" }}>
            מה שחילצתם היום — <span style={{ color: INVITE_STYLES.gold, fontStyle: "normal", fontWeight: 600 }}>{element}</span> — הוא בדיוק הסוג של אות שהאתגר בנוי סביבו. הסרטון של יום 1 ייפתח מהכיוון: <span style={{ color: INVITE_STYLES.text, fontStyle: "normal" }}>{firstDirection}</span>
          </p>
        </div>
      )}

      <InviteBullets items={[
        "האות שחילצתם היום הופך לקו תוכן אחד שמתחילים לצלם מחר",
        "גישה מיידית לשיעור פתיחה מוקלט על שיווק ב-2026",
        "7 סרטונים יומיים מהדר על סוג תוכן שמקדם מכירות",
        "אתגר יומי לצילום והעלאה לאינסטגרם",
        "מפגש סיום חי בזום, פתוח רק למי שסיימו את כל 7 הימים",
      ]} />

      <InviteStats stats={[
        { v: "3,500+", l: "בעלי עסק עברו" },
        { v: "7",      l: "ימים" },
        { v: "97%",    l: "המליצו" },
      ]} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: INVITE_STYLES.muted, lineHeight: 1.5 }}>
        <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: INVITE_STYLES.success, flexShrink: 0 }} />
        <span><strong style={{ color: INVITE_STYLES.text, fontWeight: 600 }}>גישה מיידית</strong> · מתחילים תוך שניות אחרי התשלום</span>
      </div>

      <InviteCTA href="/challenge" label="להצטרף לאתגר ←" />

      <InviteGuarantee>
        <strong style={{ color: INVITE_STYLES.success, fontWeight: 600 }}>החזר מלא תוך 7 ימים</strong> אם לא הרגשתם שזה עבד. בלי שאלות.
      </InviteGuarantee>

      <InviteLadder>
        השלב הבא לאחר האתגר · <strong style={{ color: INVITE_STYLES.goldDeep, fontWeight: 600 }}>סדנת יום אחד · ₪1,080</strong>
      </InviteLadder>
    </div>
  );
}

function StrategyInvite() {
  return (
    <div
      className="invite-card"
      style={{
        background:   INVITE_STYLES.card,
        border:       `1px solid ${INVITE_STYLES.borderHot}`,
        borderRadius: 16,
        padding:      24,
        display:      "flex",
        flexDirection: "column",
        gap:          16,
        boxShadow:    "0 16px 40px rgba(201,150,74,0.08)",
      }}
    >
      <InviteHeader name="פגישת אסטרטגיה" price={<PriceBlock amount="4,000" />} />

      <h3 style={{
        margin:       0,
        fontSize:     20,
        lineHeight:   1.4,
        fontWeight:   700,
        color:        INVITE_STYLES.text,
        letterSpacing: "-0.2px",
      }}>
        90 דקות מולי. בהירות מלאה לאן הולכים.
      </h3>
      <p style={{ margin: 0, color: INVITE_STYLES.muted, fontSize: 14.5, lineHeight: 1.65 }}>
        האות הוא האבחנה. הפגישה היא חשיבה יצירתית בלייב על העסק שלך דווקא. אסטרטגיה עסקית קודמת לאסטרטגיה שיווקית.
      </p>

      <InviteBullets items={[
        "מה אתה רוצה לעומת מה אתה צריך · נפרק את הדחוף, נזהה מה באמת עוצר",
        "אסטרטגיה עסקית לפני שיווק · לאן העסק הולך, מה הבידול, מה המודל",
        "חשיבה יצירתית בלייב · לא המלצות מן המוכן, פתרון ספציפי לעסק שלך",
        "מפת דרכים מדויקת · מה לעשות עכשיו, מה לדחות, מה להפסיק",
        "פגישה שנייה ללא עלות נוספת אם הדר תחליט שצריך",
      ]} />

      <InviteStats stats={[
        { v: "90",   l: "דקות פנים אל פנים" },
        { v: "500+", l: "עסקים" },
        { v: "4",    l: "שנות ניסיון" },
      ]} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: INVITE_STYLES.muted, lineHeight: 1.5 }}>
        <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: INVITE_STYLES.success, flexShrink: 0 }} />
        <span><strong style={{ color: INVITE_STYLES.text, fontWeight: 600 }}>פגישה פרונטלית</strong> · תיאום מועד תוך 24 שעות · 2-3 פגישות זמינות בכל יום</span>
      </div>

      <InviteCTA href="/strategy/book" label="לקבוע פגישת אסטרטגיה ←" />

      <InviteGuarantee>
        <strong style={{ color: INVITE_STYLES.success, fontWeight: 600 }}>לא פיצחנו בפגישה הראשונה? השנייה עלי, ללא עלות נוספת.</strong> ערבות אמיתית, לא כותרת.
      </InviteGuarantee>

      <InviteLadder>
        בהמשך הדרך · <strong style={{ color: INVITE_STYLES.goldDeep, fontWeight: 600 }}>יום צילום פרימיום · ₪14,000</strong>
      </InviteLadder>
    </div>
  );
}

function HiveInvite() {
  return (
    <div
      className="invite-card"
      style={{
        background:   INVITE_STYLES.card,
        border:       `1px solid ${INVITE_STYLES.borderSoft}`,
        borderRadius: 16,
        padding:      24,
        display:      "flex",
        flexDirection: "column",
        gap:          16,
      }}
    >
      <InviteHeader name="הכוורת" price={<PriceBlock amount="97" suffix="/חודש" />} />

      <h3 style={{
        margin:       0,
        fontSize:     20,
        lineHeight:   1.4,
        fontWeight:   700,
        color:        INVITE_STYLES.text,
        letterSpacing: "-0.2px",
      }}>
        האות נשאר חי בקהילה.
      </h3>
      <p style={{ margin: 0, color: INVITE_STYLES.muted, fontSize: 14.5, lineHeight: 1.65 }}>
        ריטיינר חודשי. לא קורס חדש. רק מקום להמשיך לעבוד בו על האות הזה.
      </p>

      <InviteBullets items={[
        "קבוצת ווטסאפ פעילה",
        "זום חודשי איתי",
        "שני רעיונות תוכן בחודש, מותאמים לאות שלך",
        "גישה לספריית בינג'",
      ]} />

      <InviteCTA href="/hive" label="להצטרף לכוורת ←" />
    </div>
  );
}

