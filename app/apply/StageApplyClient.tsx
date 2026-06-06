"use client";

import { useState, useEffect } from "react";

// Santosha palette - matches CLAUDE.md design system tokens.
const C = {
  bg:       "#080C14",
  card:     "#141820",
  gold:     "#E8B94A",
  goldMid:  "#C9964A",
  goldDeep: "#9E7C3A",
  fg:       "#EDE9E1",
  muted:    "#9E9990",
  line:     "rgba(232,185,74,0.14)",
};

type StepType = "text" | "textarea" | "email" | "tel";

interface Step {
  key:         string;
  label:       string;
  hint:        string;
  type:        StepType;
  placeholder: string;
  min?:        number;
}

// 6 steps. Five open-ended questions force depth (the scorer rewards it),
// plus the contact field at the end.
const STEPS: Step[] = [
  {
    key:         "name",
    label:       "איך קוראים לך?",
    hint:        "השם שלך, או שם העסק",
    type:        "text",
    placeholder: "שם מלא",
  },
  {
    key:         "idea",
    label:       "ספר לנו על העסק או הרעיון. מה הוא, ובמה אתה עוסק?",
    hint:        "אל תקצר. אם אנחנו רוצים להבין לאן אתה רוצה להגיע, צריך לדעת מאיפה מתחילים.",
    type:        "textarea",
    placeholder: "העסק שלי נולד... אני עוסק ב... המוצר שאני מוכר הוא...",
    min:         120,
  },
  {
    key:         "stage",
    label:       "איפה אתה נמצא היום, ולאן אתה רוצה להגיע?",
    hint:        "מצב נוכחי, ויעד ברור ככל האפשר. בלי כותרות, בלי להתחכם.",
    type:        "textarea",
    placeholder: "היום אני... בעוד שנה אני רוצה ש...",
    min:         120,
  },
  {
    key:         "stuck",
    label:       "מה גורם לך להיתקע עכשיו יותר מהכל, ולמה דווקא זה תקוע?",
    hint:        "תשובה שאתה לא רוצה לכתוב, זו שכבר יוצאת חופשי. תהיה כן, פה אנחנו עובדים.",
    type:        "textarea",
    placeholder: "האמת שאני לא יודע... אני חושב שאני לא טוב מספיק ב...",
    min:         140,
  },
  {
    key:         "give",
    label:       "מה אתה מוכן לתת מעצמך כדי שזה יקרה?",
    hint:        "זה לא רק כסף או מחויבות, גם זמן ועיקר. תכתוב כאן את מה שאתה באמת מוכן להשקיע.",
    type:        "textarea",
    placeholder: "אני מוכן ל...",
    min:         120,
  },
  {
    key:         "why",
    label:       "למה דווקא עכשיו, ולמה דווקא איתנו?",
    hint:        "אל תשקר. כתוב מה שבאמת מניע אותך עכשיו. אנחנו זוכרים שיש בני אדם מאחורי הטופס.",
    type:        "textarea",
    placeholder: "עכשיו כי... איתכם כי...",
    min:         140,
  },
  {
    key:         "contact",
    label:       "איך נחזיר אליך תשובה?",
    hint:        "אימייל וטלפון. תוך כמה ימים נחזור לכל מי שעבר את הסף.",
    type:        "email",
    placeholder: "",
  },
];

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function readUtm(): Record<string, string> {
  const keys = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","utm_adset","utm_ad","fbclid","gclid"];
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = getCookie(k);
    if (v) out[k] = v;
  }
  return out;
}

export function StageApplyClient() {
  const [phase, setPhase]           = useState<"intro" | "form" | "done">("intro");
  const [step, setStep]             = useState(0);
  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Load draft from localStorage so a reload doesn't wipe the form.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("stage_draft");
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.answers) setAnswers(draft.answers);
        if (draft.email)   setEmail(draft.email);
        if (draft.phone)   setPhone(draft.phone);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("stage_draft", JSON.stringify({ answers, email, phone }));
    } catch {}
  }, [answers, email, phone]);

  const current  = STEPS[step];
  const isContact = current.type === "email";
  const value    = isContact ? "" : (answers[current.key] ?? "");
  const progress = ((step + 1) / STEPS.length) * 100;

  const setValue = (v: string) => setAnswers((a) => ({ ...a, [current.key]: v }));

  const canAdvance = (): boolean => {
    if (isContact) {
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      const okPhone = phone.trim().length === 0 || /^[0-9+\-\s()]{7,20}$/.test(phone.trim());
      return okEmail && okPhone;
    }
    const len = String(value).trim().length;
    if (current.min) return len >= current.min;
    return len > 1;
  };

  const next = async () => {
    setError(null);

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stage/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:       answers.name,
          email:      email.trim(),
          phone:      phone.trim(),
          answers,
          source_utm: readUtm(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "שגיאה בשליחה, נסה שוב");
        return;
      }
      try { localStorage.removeItem("stage_draft"); } catch {}
      setPhase("done");
    } catch {
      setError("שגיאת רשת, נסה שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div
      dir="rtl"
      className="font-assistant"
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.fg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient gold glow */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "120vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse at center, rgba(232,185,74,0.07), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 560, position: "relative", zIndex: 1 }}>
        {phase === "intro" && <Intro onStart={() => setPhase("form")} />}

        {phase === "form" && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 20,
              padding: "36px 32px",
            }}
          >
            <div
              style={{
                height: 3,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 99,
                marginBottom: 28,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`,
                  transition: "width 0.35s ease",
                }}
              />
            </div>

            <div style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>
              שלב {step + 1} מתוך {STEPS.length}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 6px", lineHeight: 1.3 }}>
              {current.label}
            </h2>
            <p style={{ color: C.muted, fontSize: 15, margin: "0 0 22px", lineHeight: 1.5 }}>
              {current.hint}
            </p>

            <Field
              step={current}
              value={value}
              email={email}
              phone={phone}
              setValue={setValue}
              setEmail={setEmail}
              setPhone={setPhone}
            />

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(234,67,53,0.10)",
                  border: "1px solid rgba(234,67,53,0.35)",
                  color: "#EA8B82",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 28, flexDirection: "row-reverse" }}>
              <button
                onClick={next}
                disabled={!canAdvance() || submitting}
                style={{
                  flex: 1,
                  background: canAdvance()
                    ? `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`
                    : "rgba(255,255,255,0.06)",
                  color: canAdvance() ? C.bg : C.muted,
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: canAdvance() && !submitting ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {submitting
                  ? "שולח..."
                  : step === STEPS.length - 1
                  ? "שליחת המועמדות"
                  : "המשך"}
              </button>
              {step > 0 && (
                <button
                  onClick={back}
                  disabled={submitting}
                  style={{
                    background: "transparent",
                    color: C.muted,
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: "14px 20px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  חזרה
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "done" && <Done />}
      </div>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: C.gold,
          fontSize: 13,
          letterSpacing: 4,
          marginBottom: 18,
          fontWeight: 600,
        }}
      >
        beegood × הדר דנן
      </div>
      <h1 style={{ fontSize: 44, fontWeight: 700, margin: "0 0 20px", lineHeight: 1.1 }}>
        3 ימים פתוחים
      </h1>
      <p
        style={{
          color: C.fg,
          fontSize: 19,
          lineHeight: 1.6,
          margin: "0 0 14px",
          maxWidth: 460,
          marginInline: "auto",
        }}
      >
        אנחנו לא מחפשים מושלמים. אנחנו מחפשים עסקים שמוכנים להעז את הצעד הבא באמת.
      </p>
      <p
        style={{
          color: C.muted,
          fontSize: 16,
          lineHeight: 1.6,
          margin: "0 0 34px",
          maxWidth: 460,
          marginInline: "auto",
        }}
      >
        כניסה יש פעם בצמיחה. השאלות הבאות יגלו אם יש רצון והתחייבות אמיתית. ספר לנו מי
        אתה, ואם נראה לנו נכון נחזור עם המשך.
      </p>
      <button
        onClick={onStart}
        style={{
          background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`,
          color: C.bg,
          border: "none",
          borderRadius: 12,
          padding: "16px 44px",
          fontSize: 17,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        התחלת המועמדות
      </button>
      <div style={{ color: C.muted, fontSize: 13, marginTop: 16 }}>
        6 שאלות, בערך עשר דקות. בלי חיוב, בלי תוצרים.
      </div>
    </div>
  );
}

interface FieldProps {
  step:     Step;
  value:    string;
  email:    string;
  phone:    string;
  setValue: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
}

function Field({ step, value, email, phone, setValue, setEmail, setPhone }: FieldProps) {
  if (step.type === "email") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="האימייל שלך"
          autoComplete="email"
          style={inputStyle}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="טלפון (לא חובה)"
          autoComplete="tel"
          dir="ltr"
          style={{ ...inputStyle, textAlign: "right" }}
        />
      </div>
    );
  }

  if (step.type === "textarea") {
    const len = String(value).trim().length;
    const min = step.min || 0;
    const met = len >= min;
    return (
      <div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={step.placeholder}
          rows={5}
          style={inputStyle}
        />
        {min > 0 && (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: met ? C.gold : C.muted,
              textAlign: "left",
            }}
          >
            {met ? "מספיק. אפשר להמשיך." : `עוד ${min - len} תווים נוספים`}
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      type={step.type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={step.placeholder}
      style={inputStyle}
    />
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  color: C.fg,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
  padding: "14px 16px",
  fontSize: 16,
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

function Done() {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: `2px solid ${C.gold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          color: C.gold,
          fontSize: 30,
        }}
      >
        ✓
      </div>
      <h2 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 14px" }}>
        קיבלנו אותך.
      </h2>
      <p
        style={{
          color: C.muted,
          fontSize: 17,
          lineHeight: 1.6,
          maxWidth: 420,
          marginInline: "auto",
        }}
      >
        כל מועמדות נקראת. אנחנו רואים אותך, נחזור אליך תוך כמה ימים. עד אז, התשובה
        שלך כבר התחילה עבודה בפנים, שלחת אותה ברצינות.
      </p>
    </div>
  );
}
