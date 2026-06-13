"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
    meta: "The thing so natural to you that you stopped seeing it as a talent — you just do it.",
    skippable: false,
  },
  {
    key: "hard_period",
    label: "Name a hard chapter that changed the way you see things.",
    meta: "This one can be skipped — share only what you want to.",
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

type Phase = "form" | "gate" | "loading" | "error";
type Answers = Record<string, string>;

const C = {
  paper:    "#F4EFE4",
  paperDeep: "#EBE3D2",
  card:     "#FCFAF3",
  ink:      "#211B12",
  inkSoft:  "#594F41",
  inkFaint: "#988D7B",
  gold:     "#9A7526",
  goldDeep: "#6F521A",
  goldLeaf: "#BE9540",
  line:     "rgba(33,27,18,0.12)",
  lineSoft: "rgba(33,27,18,0.08)",
  ctaBg:    "#211B12",
  ctaFg:    "#F4EFE4",
};

export function SignalEnClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lead-gate fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  const [occupation, setOccupation] = useState("");

  const taRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from localStorage — draft + Q1 from landing card
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

  // Persist draft on every change
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers })); } catch {}
  }, [answers]);

  // Autosize textarea when value changes
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [step, answers, phase]);

  const current = QUESTIONS[step];
  const value = answers[current.key] ?? "";
  const lastStep = step === QUESTIONS.length - 1;
  const canAdvance = current.skippable || value.trim().length >= 8;

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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background:    C.paper,
        color:         C.ink,
        minHeight:     "100vh",
        display:       "flex",
        flexDirection: "column",
        fontFamily:    "var(--font-spectral), Georgia, serif",
      }}
    >
      <Header />

      <main
        style={{
          flex:           1,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "clamp(40px, 7vh, 90px) clamp(22px, 5vw, 40px)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 640 }}>
          {phase === "form" && (
            <FormStep
              step={step}
              total={QUESTIONS.length}
              label={current.label}
              meta={current.meta}
              skippable={!!current.skippable}
              value={value}
              setValue={setValue}
              taRef={taRef}
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

      <Footer phase={phase} />
    </div>
  );
}

function Header() {
  return (
    <header
      style={{
        maxWidth:       1120,
        width:          "100%",
        margin:         "0 auto",
        padding:        "30px clamp(22px, 5vw, 40px) 0",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            14,
        flexWrap:       "wrap",
      }}
    >
      <a
        href="/en"
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            11,
          textDecoration: "none",
          color:          C.ink,
        }}
      >
        <div
          style={{
            width:          32,
            height:         32,
            borderRadius:   9,
            background:     "#111113",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          <img src="/beegood_logo.png" alt="beegood" width={20} height={20} style={{ width: "64%", height: "auto", display: "block" }} />
        </div>
        <span
          style={{
            fontFamily:    "var(--font-spectral), Georgia, serif",
            fontSize:      21,
            fontWeight:    500,
            letterSpacing: "-0.01em",
          }}
        >
          beegood
        </span>
      </a>
    </header>
  );
}

function Footer({ phase }: { phase: Phase }) {
  if (phase === "loading") return null;
  return (
    <footer
      style={{
        maxWidth:    1120,
        width:       "100%",
        margin:      "0 auto",
        padding:     "0 clamp(22px, 5vw, 40px) 30px",
        textAlign:   "center",
      }}
    >
      <p
        style={{
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      10.5,
          letterSpacing: "0.1em",
          color:         C.inkFaint,
          margin:        0,
        }}
      >
        Your answers are saved as you write · nothing is shared until you choose
      </p>
    </footer>
  );
}

interface FormStepProps {
  step:       number;
  total:      number;
  label:      string;
  meta:       string;
  skippable:  boolean;
  value:      string;
  setValue:   (v: string) => void;
  taRef:      React.RefObject<HTMLTextAreaElement | null>;
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
  const indexLabel = n < 10 ? `0${n}` : `${n}`;
  const totalLabel = p.total < 10 ? `0${p.total}` : `${p.total}`;

  const [mode, setMode] = useState<"type" | "speak">("type");
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const startedAtRef = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!(w.SpeechRecognition || w.webkitSpeechRecognition)) {
      setSpeechSupported(false);
    }
  }, []);

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
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
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
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      12,
          letterSpacing: "0.35em",
          color:         C.gold,
          marginBottom:  "clamp(36px, 6vh, 56px)",
        }}
      >
        {dots}
      </div>

      <div>
        <div
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      11.5,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color:         C.goldDeep,
            marginBottom:  20,
          }}
        >
          Question {indexLabel} <span style={{ color: C.goldLeaf }}>— {totalLabel}</span>
        </div>

        <label
          htmlFor="bg-en-answer"
          style={{
            display:       "block",
            fontFamily:    "var(--font-spectral), Georgia, serif",
            fontWeight:    400,
            fontSize:      "clamp(28px, 4vw, 42px)",
            lineHeight:    1.2,
            letterSpacing: "-0.022em",
            color:         C.ink,
            marginBottom:  28,
          }}
        >
          {p.label}
        </label>

        <textarea
          ref={p.taRef}
          id="bg-en-answer"
          rows={2}
          placeholder="Take your time. There are no wrong answers here."
          value={p.value}
          onChange={(e) => p.setValue(e.target.value)}
          style={{
            width:          "100%",
            background:     "transparent",
            border:         "none",
            borderBottom:   `1px solid ${C.line}`,
            fontFamily:     "var(--font-hanken-grotesk), sans-serif",
            fontSize:       16,
            lineHeight:     1.7,
            color:          C.ink,
            padding:        "10px 0 14px",
            resize:         "none",
            outline:        "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = C.gold; }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = C.line; }}
        />

        <p
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      11.5,
            lineHeight:    1.6,
            letterSpacing: "0.03em",
            color:         C.inkFaint,
            margin:        "16px 0 0",
          }}
        >
          {p.meta}
        </p>

        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", border: `1px solid ${C.line}`, borderRadius: 999, padding: 3 }}>
            <button
              type="button"
              onClick={() => setMode("type")}
              style={{
                fontFamily:    "var(--font-hanken-grotesk), sans-serif",
                fontSize:      10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                border:        "none",
                borderRadius:  999,
                padding:       "7px 15px",
                cursor:        "pointer",
                background:    mode === "type" ? C.ink : "transparent",
                color:         mode === "type" ? C.paper : C.inkSoft,
                transition:    "background .2s ease, color .2s ease",
              }}
            >
              Type
            </button>
            <button
              type="button"
              onClick={() => setMode("speak")}
              style={{
                fontFamily:    "var(--font-hanken-grotesk), sans-serif",
                fontSize:      10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                border:        "none",
                borderRadius:  999,
                padding:       "7px 15px",
                cursor:        "pointer",
                background:    mode === "speak" ? C.ink : "transparent",
                color:         mode === "speak" ? C.paper : C.inkSoft,
                transition:    "background .2s ease, color .2s ease",
              }}
            >
              Speak
            </button>
          </div>
          <span style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 11, letterSpacing: "0.03em", color: C.inkFaint }}>
            or say it aloud — we'll write it down
          </span>
        </div>

        {mode === "speak" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 28 }}>
            <button
              type="button"
              onClick={toggleMic}
              disabled={!speechSupported}
              aria-label={listening ? "Stop recording" : "Tap to speak"}
              style={{
                width:          72,
                height:         72,
                borderRadius:   "50%",
                border:         `1px solid ${listening ? "#B5654A" : C.gold}`,
                background:     C.card,
                cursor:         speechSupported ? "pointer" : "not-allowed",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                animation:      listening ? "bg-en-pulse 1.6s infinite" : "none",
                opacity:        speechSupported ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  width:        listening ? 16 : 20,
                  height:       listening ? 16 : 20,
                  borderRadius: listening ? 4 : "50%",
                  background:   listening ? "#B5654A" : C.gold,
                  transition:   "all .2s ease",
                  display:      "block",
                }}
              />
            </button>
            <div
              style={{
                fontFamily:    "var(--font-hanken-grotesk), sans-serif",
                fontSize:      11.5,
                letterSpacing: "0.05em",
                color:         C.inkFaint,
                textAlign:     "center",
              }}
            >
              {!speechSupported
                ? "Voice input isn't supported in this browser — please type instead."
                : listening
                ? `Listening… ${formatTime(elapsed)} — tap to stop`
                : "Tap to speak — we'll write it down as you go"}
            </div>
            <style>{`@keyframes bg-en-pulse {
              0% { box-shadow: 0 0 0 0 rgba(181,101,74,0.30); }
              70% { box-shadow: 0 0 0 16px rgba(181,101,74,0); }
              100% { box-shadow: 0 0 0 0 rgba(181,101,74,0); }
            }`}</style>
          </div>
        )}

        {p.errorMsg && (
          <p role="alert" style={{ color: "#B5654A", fontSize: 14, margin: "16px 0 0", fontFamily: "var(--font-hanken-grotesk), sans-serif" }}>
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
                fontFamily:    "var(--font-hanken-grotesk), sans-serif",
                fontSize:      12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color:         C.inkSoft,
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
                fontFamily:    "var(--font-hanken-grotesk), sans-serif",
                fontSize:      12,
                letterSpacing: "0.06em",
                color:         C.inkFaint,
                background:    "none",
                border:        "none",
                cursor:        "pointer",
                borderBottom:  `1px solid ${C.line}`,
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
              fontFamily:    "var(--font-hanken-grotesk), sans-serif",
              fontSize:      12.5,
              fontWeight:    500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color:         C.ctaFg,
              background:    p.canAdvance ? C.ctaBg : "rgba(33,27,18,0.3)",
              border:        "none",
              borderRadius:  4,
              padding:       "15px 28px",
              cursor:        p.canAdvance ? "pointer" : "not-allowed",
              display:       "inline-flex",
              alignItems:    "center",
              gap:           10,
              transition:    "background .25s ease",
            }}
          >
            {p.isLast ? "Reveal my signal" : "Continue"} <span style={{ fontSize: 15 }}>→</span>
          </button>
        </div>
      </div>
    </>
  );
}

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
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 20,
        padding:      "40px 32px",
      }}
    >
      <div
        style={{
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      11.5,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color:         C.goldDeep,
          marginBottom:  14,
        }}
      >
        Almost there
      </div>
      <h2
        style={{
          fontFamily:    "var(--font-spectral), Georgia, serif",
          fontWeight:    400,
          fontSize:      "clamp(28px, 4vw, 38px)",
          lineHeight:    1.2,
          letterSpacing: "-0.02em",
          color:         C.ink,
          margin:        "0 0 14px",
        }}
      >
        Where should we send your signal?
      </h2>
      <p
        style={{
          fontFamily: "var(--font-hanken-grotesk), sans-serif",
          fontSize:   15,
          lineHeight: 1.6,
          color:      C.inkSoft,
          margin:     "0 0 28px",
        }}
      >
        Leave a name and an email. Your signal is yours for life, and you can return to it any time.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field
          label="First name"
          value={p.firstName}
          onChange={p.setFirstName}
          placeholder="What we should call you"
          autoComplete="given-name"
          autoFocus
        />
        <Field
          label="Last name"
          value={p.lastName}
          onChange={p.setLastName}
          placeholder="Optional"
          autoComplete="family-name"
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <Field
          label="Email"
          value={p.emailAddr}
          onChange={p.setEmailAddr}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <Field
          label="What do you do today?"
          hint="(optional) A short line about your work, so the signal can sharpen against the field you're in."
          value={p.occupation}
          onChange={p.setOccupation}
          placeholder="Coach, founder, designer, podcaster…"
          maxLength={200}
        />
      </div>

      {p.errorMsg && (
        <p role="alert" style={{ color: "#B5654A", fontSize: 14, margin: "16px 0 0", fontFamily: "var(--font-hanken-grotesk), sans-serif" }}>
          {p.errorMsg}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={p.onBack}
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color:         C.inkSoft,
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
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      12.5,
            fontWeight:    500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color:         C.ctaFg,
            background:    canSubmit ? C.ctaBg : "rgba(33,27,18,0.3)",
            border:        "none",
            borderRadius:  4,
            padding:       "15px 28px",
            cursor:        canSubmit ? "pointer" : "not-allowed",
            display:       "inline-flex",
            alignItems:    "center",
            gap:           10,
          }}
        >
          Reveal my signal <span style={{ fontSize: 15 }}>→</span>
        </button>
      </div>

      <p
        style={{
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      11.5,
          color:         C.inkFaint,
          textAlign:     "center",
          margin:        "20px 0 0",
          lineHeight:    1.55,
        }}
      >
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
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      11.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:         C.inkSoft,
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
          background:   "#F5F5F2",
          color:        C.ink,
          border:       `1px solid ${C.lineSoft}`,
          borderRadius: 12,
          padding:      "12px 14px",
          fontFamily:   "var(--font-hanken-grotesk), sans-serif",
          fontSize:     15,
          lineHeight:   1.6,
          outline:      "none",
        }}
      />
      {p.hint && (
        <div
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize:   11.5,
            color:      C.inkFaint,
            marginTop:  6,
            lineHeight: 1.55,
          }}
        >
          {p.hint}
        </div>
      )}
    </label>
  );
}

function Loading() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div
        style={{
          width:          46,
          height:         46,
          margin:         "0 auto 22px",
          border:         `2px solid rgba(154,117,38,0.22)`,
          borderTopColor: C.gold,
          borderRadius:   "50%",
          animation:      "bg-en-spin 0.9s linear infinite",
        }}
      />
      <p style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontStyle: "italic", fontSize: 18, color: C.ink, margin: 0 }}>
        Reading your answers…
      </p>
      <p style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 13, color: C.inkFaint, margin: "10px 0 0" }}>
        This usually takes ten to twenty seconds.
      </p>
      <style>{`@keyframes bg-en-spin { to { transform: rotate(360deg); } }`}</style>
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
      <h2 style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontSize: 24, margin: "0 0 12px", color: C.ink }}>
        Something didn't land.
      </h2>
      <p style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", color: C.inkSoft, fontSize: 15, margin: "0 0 24px", lineHeight: 1.6 }}>
        {message ?? "The engine didn't return a signal. Let's try once more."}
      </p>
      <button
        onClick={onRetry}
        style={{
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      12.5,
          fontWeight:    500,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color:         C.ctaFg,
          background:    C.ctaBg,
          border:        "none",
          borderRadius:  4,
          padding:       "13px 26px",
          cursor:        "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
