"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BEE = "/beegood_logo.png";

const QUESTIONS = [
  {
    key: "flow_zone",
    label: "Describe a moment you lost all track of time.",
    meta: "≈ 2 minutes · saved as you write",
    skippable: false,
  },
  {
    key: "effortless_mastery",
    label: "What comes so easily to you that you can't explain how you do it?",
    meta: "The thing so natural to you that you stopped seeing it as a talent, you just do it.",
    skippable: false,
  },
  {
    key: "hard_period",
    label: "Name a hard chapter that changed the way you see things.",
    meta: "This one can be skipped, share only what you want to.",
    skippable: true,
  },
  {
    key: "what_helped",
    label: "What did you build, learn, or decide in order to get through it?",
    meta: "The tool, the belief, or the small practice that held you up.",
    skippable: false,
  },
  {
    key: "message_to_past",
    label: "What would you say to someone standing today where you once stood?",
    meta: "Speak to them directly. What must they know, what must they stop doing, and where should they go first.",
    skippable: false,
  },
] as const;

const DRAFT_KEY = "bg_en_signal_draft_v1";
const LANDING_Q1_KEY = "bg_ts_q1";
const MIN_CHARS = 8;

type Phase = "intro" | "form" | "gate" | "loading" | "error";
type Answers = Record<string, string>;

// Business OS palette (matches /en homepage)
const C = {
  bg:        "#0D0C0A",
  panel:     "#111009",
  card:      "#161410",
  border:    "rgba(242,237,228,0.10)",
  borderHi:  "rgba(194,151,63,0.55)",
  gold:      "#C2973F",
  goldDeep:  "#9A7526",
  text:      "#F2EDE4",
  textMute:  "rgba(242,237,228,0.55)",
  textFaint: "rgba(242,237,228,0.36)",
  textDim:   "rgba(242,237,228,0.28)",
  ctaFg:     "#0D0C0A",
  ctaBg:     "#C2973F",
  recRed:    "#C2973F", // gold for recording (per mockup)
};

export function SignalEnClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lead-gate fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  const [occupation, setOccupation] = useState("");

  // Hydrate draft + Q1 from landing
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.answers && typeof draft.answers === "object") {
          setAnswers(draft.answers);
          return;
        }
      }
    } catch {}
    try {
      const q1 = localStorage.getItem(LANDING_Q1_KEY);
      if (q1) setAnswers({ flow_zone: q1 });
    } catch {}
  }, []);

  // Persist draft on change
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers })); } catch {}
  }, [answers]);

  const current = QUESTIONS[step];
  const value = answers[current.key] ?? "";
  const lastStep = step === QUESTIONS.length - 1;
  const canAdvance = current.skippable || value.trim().length >= MIN_CHARS;

  function setValue(v: string) {
    setAnswers((a) => ({ ...a, [current.key]: v }));
  }

  function next() {
    setErrorMsg(null);
    if (lastStep) {
      setPhase("gate");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setErrorMsg(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function skip() {
    setAnswers((a) => ({ ...a, [current.key]: "" }));
    next();
  }

  async function submit() {
    setPhase("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/en/signal/extract", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          answers,
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          email:      emailAddr.trim().toLowerCase(),
          occupation: occupation.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.signal || !data?.id) {
        setErrorMsg(typeof data?.error === "string" ? data.error : "Something went wrong. Try again in a moment.");
        setPhase("error");
        return;
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      try { localStorage.removeItem(LANDING_Q1_KEY); } catch {}
      router.push(`/en/signal/result/${encodeURIComponent(data.id)}`);
    } catch {
      setErrorMsg("Network error. Try again.");
      setPhase("error");
    }
  }

  return (
    <div
      style={{
        minHeight:     "100vh",
        background:    C.bg,
        color:         C.text,
        display:       "flex",
        flexDirection: "column",
        fontFamily:    "var(--font-jakarta), -apple-system, system-ui, sans-serif",
      }}
    >
      <TopBar step={step} total={QUESTIONS.length} phase={phase} />

      <main
        style={{
          flex:           1,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "clamp(36px, 6vh, 80px) clamp(20px, 4vw, 48px)",
        }}
      >
        <div style={{ width: "100%", maxWidth: phase === "intro" ? 720 : 660 }}>
          {phase === "intro" && <Intro onStart={() => setPhase("form")} />}
          {phase === "form" && (
            <FormStep
              step={step}
              total={QUESTIONS.length}
              label={current.label}
              meta={current.meta}
              skippable={!!current.skippable}
              value={value}
              setValue={setValue}
              canAdvance={canAdvance}
              isLast={lastStep}
              onNext={next}
              onBack={back}
              onSkip={skip}
              errorMsg={errorMsg}
            />
          )}
          {phase === "gate" && (
            <LeadGate
              firstName={firstName}
              lastName={lastName}
              emailAddr={emailAddr}
              occupation={occupation}
              setFirstName={setFirstName}
              setLastName={setLastName}
              setEmailAddr={setEmailAddr}
              setOccupation={setOccupation}
              onSubmit={() => void submit()}
              onBack={() => setPhase("form")}
              errorMsg={errorMsg}
            />
          )}
          {phase === "loading" && <Loading />}
          {phase === "error" && (
            <ErrorCard message={errorMsg} onRetry={() => setPhase("gate")} />
          )}
        </div>
      </main>

      <BottomBar phase={phase} />
    </div>
  );
}

// ── Top + bottom chrome ───────────────────────────────────────────────

function TopBar({ step, total, phase }: { step: number; total: number; phase: Phase }) {
  const n = step + 1;
  const pad = n < 10 ? `0${n}` : `${n}`;
  const padTotal = total < 10 ? `0${total}` : `${total}`;
  const showCounter = phase === "form";

  return (
    <header
      style={{
        maxWidth:       1200,
        width:          "100%",
        margin:         "0 auto",
        padding:        "24px clamp(20px, 4vw, 48px) 0",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            16,
      }}
    >
      <Link
        href="/en"
        style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: C.text }}
      >
        <Image
          src={BEE}
          alt="beegood"
          width={50}
          height={40}
          style={{ width: "auto", height: 40, display: "block" }}
        />
        <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: C.text }}>
          beegood
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.textFaint }}>
          TrueSignal© · Layer 01
        </span>
        {showCounter && (
          <span style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>
            {pad} / {padTotal}
          </span>
        )}
      </div>
    </header>
  );
}

function BottomBar({ phase }: { phase: Phase }) {
  if (phase === "loading") return null;
  return (
    <footer
      style={{
        maxWidth: 1200,
        width:    "100%",
        margin:   "0 auto",
        padding:  "0 clamp(20px, 4vw, 48px) 28px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 11, letterSpacing: "0.08em", color: C.textDim, margin: 0 }}>
        Saved as you write · nothing is shared until you choose
      </p>
    </footer>
  );
}

// ── Intro ─────────────────────────────────────────────────────────────

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        background:   C.panel,
        border:       `1px solid ${C.border}`,
        borderRadius: 20,
        padding:      "clamp(40px, 6vw, 64px) clamp(28px, 5vw, 48px)",
        textAlign:    "left",
      }}
    >
      <div
        style={{
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color:         C.gold,
          marginBottom:  20,
        }}
      >
        TrueSignal© · Layer 01 · Free
      </div>
      <h1
        style={{
          fontSize:      "clamp(34px, 5.4vw, 64px)",
          fontWeight:    800,
          lineHeight:    0.98,
          letterSpacing: "-0.04em",
          margin:        "0 0 24px",
          color:         C.text,
        }}
      >
        The signal engine.
      </h1>
      <p
        style={{
          fontSize:    "clamp(17px, 2vw, 21px)",
          fontWeight:  500,
          lineHeight:  1.45,
          color:       C.text,
          margin:      "0 0 8px",
        }}
      >
        Five questions. One brand signal.
      </p>
      <p
        style={{
          fontSize:    "clamp(17px, 2vw, 21px)",
          fontWeight:  500,
          lineHeight:  1.45,
          color:       C.textMute,
          margin:      "0 0 36px",
        }}
      >
        Not what you sell, but what only you can give.
      </p>

      <div style={{ height: 1, background: C.border, margin: "0 0 28px" }} />

      <p
        style={{
          fontSize:    14.5,
          lineHeight:  1.65,
          color:       C.textMute,
          margin:      "0 0 18px",
        }}
      >
        About ten minutes. Type or speak. Question 3 (about a hard chapter) can be skipped. Your draft saves as you write.
      </p>
      <p
        style={{
          fontSize:    15,
          lineHeight:  1.7,
          color:       C.text,
          opacity:     0.85,
          margin:      "0 0 36px",
        }}
      >
        At the end, you walk away with one sentence to say out loud, the audience already looking for you, and three content directions to begin from this week.
      </p>

      <button
        onClick={onStart}
        style={{
          fontFamily:    "var(--font-jakarta), sans-serif",
          fontSize:      15,
          fontWeight:    700,
          color:         C.ctaFg,
          background:    C.ctaBg,
          border:        "none",
          borderRadius:  12,
          padding:       "16px 34px",
          cursor:        "pointer",
          display:       "inline-flex",
          alignItems:    "center",
          gap:           10,
        }}
      >
        Begin <span style={{ fontSize: 17 }}>→</span>
      </button>
    </div>
  );
}

// ── FormStep with voice ───────────────────────────────────────────────

interface FormStepProps {
  step:       number;
  total:      number;
  label:      string;
  meta:       string;
  skippable:  boolean;
  value:      string;
  setValue:   (v: string) => void;
  canAdvance: boolean;
  isLast:     boolean;
  onNext:     () => void;
  onBack:     () => void;
  onSkip:     () => void;
  errorMsg:   string | null;
}

function FormStep(p: FormStepProps) {
  const dots = Array.from({ length: p.total }, (_, i) => (i <= p.step ? "●" : "○")).join("");
  const n = p.step + 1;
  const padN = n < 10 ? `0${n}` : `${n}`;
  const padT = p.total < 10 ? `0${p.total}` : `${p.total}`;

  const [mode, setMode] = useState<"type" | "speak">("type");
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const startedAtRef = useRef(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!(w.SpeechRecognition || w.webkitSpeechRecognition)) {
      setSpeechSupported(false);
    }
  }, []);

  // Autosize textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [p.value, p.step]);

  // Stop recording when leaving speak mode, switching question, or unmounting
  useEffect(() => {
    if (mode !== "speak") stopRec();
    return () => stopRec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, p.step]);

  // Timer
  useEffect(() => {
    if (!listening) return;
    startedAtRef.current = Date.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [listening]);

  function startRec() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    baseTextRef.current = p.value.trim() ? p.value.trim() + " " : "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let fin = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + " ";
        else interim += t;
      }
      if (fin) baseTextRef.current = (baseTextRef.current + fin).replace(/\s+/g, " ");
      p.setValue((baseTextRef.current + interim).replace(/\s+/g, " ").trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }

  function stopRec() {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }
    setListening(false);
  }

  function toggleMic() {
    if (listening) stopRec();
    else startRec();
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss < 10 ? "0" : ""}${ss}`;
  }

  return (
    <>
      <div
        style={{
          fontSize:      13,
          fontWeight:    600,
          letterSpacing: "0.3em",
          color:         C.gold,
          marginBottom:  "clamp(32px, 5vh, 52px)",
        }}
      >
        {dots}
      </div>

      <div style={{ transition: "opacity .32s ease", opacity: 1 }}>
        <div
          style={{
            fontSize:      12,
            fontWeight:    700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:         C.textFaint,
            marginBottom:  22,
          }}
        >
          Question {padN} <span style={{ color: C.gold }}>, {padT}</span>
        </div>

        <label
          htmlFor="signal-answer"
          style={{
            display:       "block",
            fontSize:      "clamp(28px, 4.2vw, 46px)",
            fontWeight:    700,
            lineHeight:    1.12,
            letterSpacing: "-0.035em",
            color:         C.text,
            marginBottom:  30,
          }}
        >
          {p.label}
        </label>

        <textarea
          ref={taRef}
          id="signal-answer"
          rows={2}
          placeholder="Take your time. There are no wrong answers here."
          value={p.value}
          onChange={(e) => p.setValue(e.target.value)}
          style={{
            width:         "100%",
            background:    C.card,
            border:        `1px solid ${C.border}`,
            borderRadius:  14,
            fontFamily:    "var(--font-jakarta), sans-serif",
            fontSize:      16,
            lineHeight:    1.65,
            color:         C.text,
            padding:       18,
            resize:        "none",
            outline:       "none",
            transition:    "border-color .2s ease",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.borderHi; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
        />

        <p style={{ fontSize: 13, lineHeight: 1.6, color: C.textMute, opacity: 0.7, margin: "16px 0 0" }}>
          {p.meta}
        </p>

        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div
            style={{
              display:      "inline-flex",
              background:   C.card,
              border:       `1px solid ${C.border}`,
              borderRadius: 999,
              padding:      3,
            }}
          >
            <ModeBtn active={mode === "type"} onClick={() => setMode("type")}>Type</ModeBtn>
            <ModeBtn active={mode === "speak"} onClick={() => setMode("speak")}>Speak</ModeBtn>
          </div>
          <span style={{ fontSize: 13, color: C.textFaint }}>
            or say it aloud, we&apos;ll write it down
          </span>
        </div>

        {mode === "speak" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 30 }}>
            <button
              type="button"
              onClick={toggleMic}
              disabled={!speechSupported}
              aria-label={listening ? "Stop recording" : "Tap to speak"}
              style={{
                width:          72,
                height:         72,
                borderRadius:   "50%",
                border:         `1px solid ${listening ? C.gold : "rgba(194,151,63,0.55)"}`,
                background:     C.card,
                cursor:         speechSupported ? "pointer" : "not-allowed",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                animation:      listening ? "bgPulseEn 1.6s infinite" : "none",
                opacity:        speechSupported ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  width:        listening ? 16 : 20,
                  height:       listening ? 16 : 20,
                  borderRadius: listening ? 4 : "50%",
                  background:   listening ? "#E0B45A" : C.gold,
                  transition:   "all .2s ease",
                  display:      "block",
                }}
              />
            </button>
            <div style={{ fontSize: 13, color: C.textMute, opacity: 0.7, textAlign: "center" }}>
              {!speechSupported
                ? "Voice input isn't supported in this browser, please type instead."
                : listening
                ? `Listening… ${formatTime(elapsed)}, tap to stop`
                : "Tap to speak, we'll write it down as you go"}
            </div>
            <style>{`@keyframes bgPulseEn {
              0% { box-shadow: 0 0 0 0 rgba(194,151,63,0.34); }
              70% { box-shadow: 0 0 0 16px rgba(194,151,63,0); }
              100% { box-shadow: 0 0 0 0 rgba(194,151,63,0); }
            }`}</style>
          </div>
        )}

        {p.errorMsg && (
          <p role="alert" style={{ marginTop: 16, color: "#E0916A", fontSize: 14 }}>
            {p.errorMsg}
          </p>
        )}
      </div>

      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            16,
          marginTop:      "clamp(36px, 6vh, 52px)",
          flexWrap:       "wrap",
        }}
      >
        <div style={{ minWidth: 60 }}>
          {p.step > 0 && (
            <button
              type="button"
              onClick={p.onBack}
              style={{
                fontSize:      12,
                fontWeight:    600,
                letterSpacing: "0.06em",
                color:         C.textMute,
                background:    "none",
                border:        "none",
                cursor:        "pointer",
                display:       "inline-flex",
                alignItems:    "center",
                gap:           8,
                padding:       "6px 0",
              }}
            >
              <span style={{ fontSize: 14 }}>←</span> Back
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          {p.skippable && (
            <button
              type="button"
              onClick={p.onSkip}
              style={{
                fontSize:      12,
                fontWeight:    600,
                letterSpacing: "0.04em",
                color:         C.textFaint,
                background:    "none",
                border:        "none",
                cursor:        "pointer",
                borderBottom:  `1px solid ${C.border}`,
                padding:       "0 0 2px",
              }}
            >
              Skip this one
            </button>
          )}
          <button
            type="button"
            onClick={p.onNext}
            disabled={!p.canAdvance}
            style={{
              fontFamily:    "var(--font-jakarta), sans-serif",
              fontSize:      14,
              fontWeight:    700,
              letterSpacing: "-0.01em",
              color:         p.canAdvance ? C.ctaFg : "rgba(13,12,10,0.5)",
              background:    p.canAdvance ? C.ctaBg : "rgba(194,151,63,0.35)",
              border:        "none",
              borderRadius:  12,
              padding:       "15px 30px",
              cursor:        p.canAdvance ? "pointer" : "not-allowed",
              display:       "inline-flex",
              alignItems:    "center",
              gap:           10,
            }}
          >
            {p.isLast ? "Reveal my signal" : "Continue"} <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>
      </div>
    </>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily:    "var(--font-jakarta), sans-serif",
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        border:        "none",
        borderRadius:  999,
        padding:       "8px 16px",
        cursor:        "pointer",
        background:    active ? C.gold : "transparent",
        color:         active ? C.ctaFg : C.textMute,
        transition:    "background .2s ease, color .2s ease",
      }}
    >
      {children}
    </button>
  );
}

// ── LeadGate ─────────────────────────────────────────────────────────

interface LeadGateProps {
  firstName:     string;
  lastName:      string;
  emailAddr:     string;
  occupation:    string;
  setFirstName:  (v: string) => void;
  setLastName:   (v: string) => void;
  setEmailAddr:  (v: string) => void;
  setOccupation: (v: string) => void;
  onSubmit:      () => void;
  onBack:        () => void;
  errorMsg:      string | null;
}

function LeadGate(p: LeadGateProps) {
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.emailAddr.trim());
  const canSubmit  = p.firstName.trim().length >= 2 && validEmail;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) p.onSubmit(); }}
      style={{
        background:   C.panel,
        border:       `1px solid ${C.border}`,
        borderRadius: 20,
        padding:      "clamp(36px, 5vw, 56px) clamp(24px, 4vw, 44px)",
      }}
    >
      <div
        style={{
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color:         C.gold,
          marginBottom:  16,
        }}
      >
        Almost there
      </div>
      <h2
        style={{
          fontSize:      "clamp(28px, 4vw, 40px)",
          fontWeight:    700,
          lineHeight:    1.1,
          letterSpacing: "-0.035em",
          color:         C.text,
          margin:        "0 0 14px",
        }}
      >
        Where should we send your signal?
      </h2>
      <p
        style={{
          fontSize:    15,
          lineHeight:  1.6,
          color:       C.textMute,
          margin:      "0 0 32px",
        }}
      >
        Leave a name and an email. Your signal is yours for life, returnable any time.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="First name" value={p.firstName} onChange={p.setFirstName} placeholder="How to call you" autoComplete="given-name" autoFocus />
        <Field label="Last name" value={p.lastName} onChange={p.setLastName} placeholder="Optional" autoComplete="family-name" />
      </div>
      <div style={{ marginTop: 14 }}>
        <Field label="Email" value={p.emailAddr} onChange={p.setEmailAddr} placeholder="you@example.com" type="email" autoComplete="email" />
      </div>
      <div style={{ marginTop: 14 }}>
        <Field
          label="What do you do today?"
          hint="Optional. A short line about your work so the signal can sharpen against the field you're in."
          value={p.occupation}
          onChange={p.setOccupation}
          placeholder="Coach, founder, designer, podcaster…"
          maxLength={200}
        />
      </div>

      {p.errorMsg && (
        <p role="alert" style={{ color: "#E0916A", fontSize: 14, margin: "16px 0 0" }}>
          {p.errorMsg}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={p.onBack}
          style={{
            fontSize:      12,
            fontWeight:    600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color:         C.textMute,
            background:    "none",
            border:        "none",
            cursor:        "pointer",
          }}
        >
          ← Back to questions
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            fontFamily:    "var(--font-jakarta), sans-serif",
            fontSize:      14,
            fontWeight:    700,
            letterSpacing: "-0.01em",
            color:         canSubmit ? C.ctaFg : "rgba(13,12,10,0.5)",
            background:    canSubmit ? C.ctaBg : "rgba(194,151,63,0.35)",
            border:        "none",
            borderRadius:  12,
            padding:       "15px 30px",
            cursor:        canSubmit ? "pointer" : "not-allowed",
            display:       "inline-flex",
            alignItems:    "center",
            gap:           10,
          }}
        >
          Reveal my signal <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>

      <p style={{ fontSize: 11.5, color: C.textFaint, textAlign: "center", margin: "22px 0 0", lineHeight: 1.55 }}>
        We keep your details private. You can remove yourself at any time.
      </p>
    </form>
  );
}

interface FieldProps {
  label:        string;
  hint?:        string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  type?:        string;
  autoComplete?: string;
  autoFocus?:   boolean;
  maxLength?:   number;
}

function Field(p: FieldProps) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:         C.textMute,
          marginBottom:  8,
        }}
      >
        {p.label}
      </div>
      <input
        type={p.type ?? "text"}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        placeholder={p.placeholder}
        autoComplete={p.autoComplete}
        autoFocus={p.autoFocus}
        maxLength={p.maxLength}
        style={{
          width:        "100%",
          background:   C.card,
          color:        C.text,
          border:       `1px solid ${C.border}`,
          borderRadius: 12,
          padding:      "13px 14px",
          fontFamily:   "var(--font-jakarta), sans-serif",
          fontSize:     15,
          lineHeight:   1.6,
          outline:      "none",
        }}
      />
      {p.hint && (
        <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 6, lineHeight: 1.55 }}>
          {p.hint}
        </div>
      )}
    </label>
  );
}

// ── Loading + Error ──────────────────────────────────────────────────

function Loading() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div
        style={{
          width:          46,
          height:         46,
          margin:         "0 auto 22px",
          border:         "2px solid rgba(194,151,63,0.22)",
          borderTopColor: C.gold,
          borderRadius:   "50%",
          animation:      "spinEn 0.9s linear infinite",
        }}
      />
      <p style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>
        Reading your answers…
      </p>
      <p style={{ fontSize: 13, color: C.textMute, opacity: 0.7, margin: "10px 0 0" }}>
        This usually takes ten to twenty seconds.
      </p>
      <style>{`@keyframes spinEn { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div
      style={{
        background:   C.panel,
        border:       `1px solid ${C.border}`,
        borderRadius: 20,
        padding:      "44px 32px",
        textAlign:    "center",
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: C.text }}>
        Something didn&apos;t land.
      </h2>
      <p style={{ color: C.textMute, fontSize: 15, margin: "0 0 24px", lineHeight: 1.6 }}>
        {message ?? "The engine didn't return a signal. Let's try once more."}
      </p>
      <button
        onClick={onRetry}
        style={{
          fontFamily:    "var(--font-jakarta), sans-serif",
          fontSize:      14,
          fontWeight:    700,
          color:         C.ctaFg,
          background:    C.ctaBg,
          border:        "none",
          borderRadius:  12,
          padding:       "14px 28px",
          cursor:        "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
