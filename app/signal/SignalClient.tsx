"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SIGNAL_QUESTIONS } from "@/lib/prompts/signal-engine";
import { VoiceInput } from "@/components/signal/VoiceInput";
import { CopyButton } from "@/components/signal/CopyButton";
import { PrintButton } from "@/components/signal/PrintButton";

type SignalAnswers = Record<string, string>;

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
}

type Phase = "intro" | "form" | "gate" | "loading" | "result" | "error";

export function SignalClient({ firstName, isAuthenticated = false, prefillEmail }: Props) {
  const [phase, setPhase]         = useState<Phase>("intro");
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState<SignalAnswers>({});
  const [signal, setSignal]       = useState<SignalOutput | null>(null);
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [cacheChecked, setCacheChecked] = useState(false);

  // Lead-gate fields (anonymous only)
  const [leadName, setLeadName]   = useState(firstName ?? "");
  const [leadEmail, setLeadEmail] = useState(prefillEmail ?? "");
  const [leadPhone, setLeadPhone] = useState("");

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
      const payload: Record<string, unknown> = {
        answers,
        first_name: firstName ?? leadName.split(" ")[0],
      };
      if (!isAuthenticated) {
        payload.email = leadEmail.trim().toLowerCase();
        payload.name  = leadName.trim();
        payload.phone = leadPhone.trim();
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
        justifyContent: phase === "result" ? "flex-start" : "center",
        padding:        phase === "result" ? "48px 24px 80px" : 24,
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
            name={leadName}
            email={leadEmail}
            phone={leadPhone}
            setName={setLeadName}
            setEmail={setLeadEmail}
            setPhone={setLeadPhone}
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
            generatedAt={generatedAt}
            onRestart={restart}
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
        background:    C.card,
        border:        `1px solid ${C.line}`,
        borderRadius:  20,
        padding:       "44px 32px",
        textAlign:     "center",
      }}
    >
      <div
        style={{
          display:    "inline-block",
          fontSize:   12,
          letterSpacing: 1.6,
          color:      C.goldMid,
          marginBottom: 16,
          textTransform: "uppercase",
        }}
      >
        <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.25 }}>
        {firstName ? `${firstName}, ` : ""}מנוע האות
      </h1>
      <p style={{ color: C.fg, opacity: 0.92, fontSize: 17, margin: "0 0 22px", lineHeight: 1.65 }}>
        חמש שאלות. אות מותגי אחד.
        <br />
        לא מה שאתה מוכר, אלא מה שרק אתה יכול לתת.
      </p>
      <ul style={{
        listStyle: "none",
        padding:   0,
        margin:    "0 auto 28px",
        maxWidth:  420,
        textAlign: "right",
        color:     C.muted,
        fontSize:  15,
        lineHeight: 1.85,
      }}>
        <li>· נמשך כעשר דקות. אפשר לעצור באמצע, הטיוטה נשמרת.</li>
        <li>· אחרי השאלה השלישית יש בקשה לדבר על תקופה קשה. מותר לדלג.</li>
        <li>· התשובה חוזרת אליך כשבעה שדות, בעברית, בלי שיווק.</li>
      </ul>
      <button
        onClick={onStart}
        style={{
          background:   "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
          color:        "#2a1d05",
          fontWeight:   700,
          fontSize:     16,
          border:       "none",
          borderRadius: 12,
          padding:      "14px 32px",
          cursor:       "pointer",
          boxShadow:    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
        }}
      >
        להתחיל
      </button>
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
        placeholder="או הקלד כאן — בלי לערוך, כפי שאתה מדבר."
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

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: C.muted }}>
        <span>{len < MIN_CHARS ? `עוד ${MIN_CHARS - len} תווים לפחות` : "מספיק. אפשר להמשיך."}</span>
        <span>{len} / {MIN_CHARS}+</span>
      </div>

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

function Loading() {
  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 20,
        padding:      "60px 32px",
        textAlign:    "center",
      }}
    >
      <div
        style={{
          width:        46,
          height:       46,
          margin:       "0 auto 22px",
          border:       `3px solid rgba(232,185,74,0.18)`,
          borderTopColor: C.gold,
          borderRadius: "50%",
          animation:    "spin 0.9s linear infinite",
        }}
      />
      <p style={{ fontSize: 17, color: C.fg, margin: 0 }}>מחלץ את האות שלך…</p>
      <p style={{ fontSize: 14, color: C.muted, margin: "8px 0 0" }}>זה יכול לקחת בין עשר לעשרים שניות.</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface LeadGateProps {
  name:     string;
  email:    string;
  phone:    string;
  setName:  (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  onSubmit: () => void;
  onBack:   () => void;
  errorMsg: string | null;
}

function LeadGate({ name, email, phone, setName, setEmail, setPhone, onSubmit, onBack, errorMsg }: LeadGateProps) {
  const trimmedName  = name.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const validEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  // Israeli mobile pattern is loose on purpose — accept 05X-XXXXXXX, with or
  // without dashes / spaces / international prefix. Server re-validates.
  const validPhone   = /^[0-9+\-\s()]{9,20}$/.test(trimmedPhone);
  const canSubmit    = trimmedName.length >= 2 && validEmail && validPhone;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
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
          השאר שם ואימייל, האות שלך נשמר אצלך לחיים ואפשר לחזור אליו בכל רגע.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>שם פרטי</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="איך לקרוא לך"
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
  generatedAt:   string | null;
  onRestart:     () => void;
}

function Result({ firstName, signal, extractionId, generatedAt, onRestart }: ResultProps) {
  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
        <div
          style={{
            display:       "inline-block",
            fontSize:      12,
            letterSpacing: 1.6,
            color:         C.goldMid,
            marginBottom:  10,
            textTransform: "uppercase",
          }}
        >
          <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.25 }}>
          {firstName ? `${firstName}, האות שלך` : "האות שלך"}
        </h1>
        {dateStr && (
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>נחלץ ב-{dateStr}</p>
        )}
      </div>

      {/* The signal itself — center stage */}
      <div
        className="signal-hero"
        style={{
          background:   `linear-gradient(145deg, ${C.cardSoft}, ${C.card})`,
          border:       `1px solid ${C.gold}`,
          borderRadius: 22,
          padding:      "32px 28px",
          textAlign:    "center",
          boxShadow:    "0 12px 32px rgba(232,185,74,0.12)",
        }}
      >
        <div style={{ color: C.goldMid, fontSize: 13, marginBottom: 12, letterSpacing: 0.6 }}>
          האות
        </div>
        <p style={{ fontSize: 22, lineHeight: 1.5, margin: "0 0 18px", color: C.fg, fontWeight: 500 }}>
          {signal.signal}
        </p>
        <div className="result-actions" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <CopyButton text={signal.signal} label="העתק את האות" />
        </div>
      </div>

      {/* What the signal promises — forward-leaning card, visually distinct */}
      {signal.signal_promise && (
        <div
          style={{
            background:   "linear-gradient(180deg, rgba(232,185,74,0.05) 0%, transparent 100%)",
            border:       "1px solid rgba(232,185,74,0.22)",
            borderRadius: 16,
            padding:      "20px 22px",
            position:     "relative",
          }}
        >
          {/* Upward-pointing accent — signals "next direction" */}
          <div
            aria-hidden
            style={{
              position:   "absolute",
              top:        -1,
              right:      22,
              width:      0,
              height:     0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "8px solid rgba(232,185,74,0.55)",
            }}
          />
          <div style={{
            color:         C.goldMid,
            fontSize:      11,
            letterSpacing: 0.6,
            marginBottom:  8,
            textTransform: "uppercase" as const,
            display:       "flex",
            alignItems:    "center",
            gap:           6,
          }}>
            <span style={{ fontSize: 13 }}>↗</span> מה שהאות שלך מבטיח
          </div>
          <p style={{ margin: 0, lineHeight: 1.7, color: C.fg }}>{signal.signal_promise}</p>
        </div>
      )}

      {/* Warm note */}
      <Card title="הערה אישית" tone="warm">
        <p style={{ margin: 0, lineHeight: 1.7 }}>{signal.warm_note}</p>
      </Card>

      {/* Pain + element grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="מקור הכאב">
          <p style={{ margin: 0, lineHeight: 1.7 }}>{signal.pain_source}</p>
        </Card>
        <Card title="האלמנט">
          <p style={{ margin: 0, lineHeight: 1.7 }}>{signal.element}</p>
        </Card>
      </div>

      <Card title="הכלי המרכזי">
        <p style={{ margin: 0, lineHeight: 1.7 }}>{signal.central_tool}</p>
      </Card>

      <Card title="האנשים שלך">
        <p style={{ margin: 0, lineHeight: 1.7 }}>{signal.people}</p>
      </Card>

      <Card title="שלושה כיווני תוכן להתחיל מהם">
        <ol style={{ margin: 0, paddingInlineStart: 22, lineHeight: 1.75 }}>
          {signal.content_directions.map((d, i) => (
            <li key={i} style={{ marginBottom: 8 }}>{d}</li>
          ))}
        </ol>
      </Card>

      {/* Hive CTA — the natural next step after seeing your signal */}
      <div
        className="hive-cta-card"
        style={{
          background:   `linear-gradient(145deg, ${C.cardSoft}, ${C.card})`,
          border:       `1px solid ${C.line}`,
          borderRadius: 18,
          padding:      "26px 24px",
          textAlign:    "center",
          marginTop:    12,
        }}
      >
        <p style={{ fontSize: 16, lineHeight: 1.65, color: C.fg, margin: "0 0 6px" }}>
          האות שלך נוצר. עכשיו אפשר להפוך אותו לתוכן.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: C.muted, margin: "0 0 20px" }}>
          חברי הכוורת מקבלים כל חודש שני רעיונות תוכן מותאמים אישית לאות שלהם.
        </p>
        <Link
          href="/hive"
          style={{
            display:      "inline-block",
            background:   "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
            color:        "#2a1d05",
            fontWeight:   800,
            fontSize:     15,
            border:       "none",
            borderRadius: 999,
            padding:      "12px 28px",
            cursor:       "pointer",
            textDecoration: "none",
            boxShadow:    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
          }}
        >
          לראות את מסלולי הכוורת ←
        </Link>
      </div>

      {/* Footer — utility actions: print + restart */}
      <div className="result-footer" style={{ textAlign: "center", paddingTop: 4, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <PrintButton />
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
          להתחיל מחדש
        </button>
      </div>

      {/* Print-friendly styles. Hide nav/CTAs/footer chrome and reflow cards for paper. */}
      <style>{`
        @media print {
          @page { margin: 18mm 14mm; }
          /* Hide everything that's not the diagnostic itself */
          nav, header, footer,
          .result-actions,
          .result-footer,
          .hive-cta-card { display: none !important; }
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
        }
      `}</style>
    </div>
  );
}

function Card({
  title,
  children,
  tone = "normal",
}: {
  title:    string;
  children: React.ReactNode;
  tone?:    "normal" | "warm";
}) {
  return (
    <div
      style={{
        background:   tone === "warm"
          ? `linear-gradient(145deg, rgba(232,185,74,0.08), ${C.card})`
          : C.card,
        border:       `1px solid ${tone === "warm" ? "rgba(232,185,74,0.25)" : C.line}`,
        borderRadius: 16,
        padding:      "22px 22px",
        color:        C.fg,
      }}
    >
      <div
        style={{
          color:         C.goldMid,
          fontSize:      12,
          letterSpacing: 0.6,
          marginBottom:  10,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 16 }}>{children}</div>
    </div>
  );
}
