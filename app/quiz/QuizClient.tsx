"use client";

import { useState, useEffect, useRef } from "react";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { saveQuizSession } from "@/lib/quiz-session";
import {
  type Answer,
  type BulletRule,
  PRODUCT_IMAGE,
  PRODUCT_META,
  PRODUCT_DESC,
  CTA_TEXT,
  BULLET_RULES,
  getPersonalizedReasons,
} from "@/lib/quiz-config";

// ── Types ────────────────────────────────────────────────────────

// Answer and BulletRule are imported from @/lib/quiz-config
type AnimPhase = "idle" | "out" | "in-start" | "in";
type SlideDir = "forward" | "back";

type Product = {
  id: string;
  href: string;
  name: string;
  price: string;
};

// ── Questions ────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "q1",
    title: "איפה העסק שלך עכשיו?",
    subtitle: "ענה בכנות - זה יעזור לנו למצוא את הצעד הנכון",
    options: [
      { id: "A", text: "רק מתחיל - עדיין בונה את הבסיס" },
      { id: "B", text: "יש לי עסק פעיל - רוצה יותר לקוחות" },
      { id: "C", text: "יש לי עסק מבוסס - רוצה לצמוח בגדול" },
      { id: "D", text: "חברה / מותג - מחפשים שותף אסטרטגי" },
    ],
  },
  {
    id: "q2",
    title: "מה הכי עוצר אותך בשיווק?",
    subtitle: null,
    options: [
      { id: "A", text: "לא יודע מה לומר מול המצלמה" },
      { id: "B", text: "מייצר תוכן אבל לא רואה תוצאות" },
      { id: "C", text: "אין לי זמן לעשות הכל לבד" },
      { id: "D", text: "השיווק לא משקף את האיכות האמיתית שלי" },
    ],
  },
  {
    id: "q3",
    title: "מה הקשר שלך לתוכן כרגע?",
    subtitle: null,
    options: [
      { id: "A", text: "לא מייצר תוכן בכלל" },
      { id: "B", text: "מנסה לפה ולשם, לא עקבי" },
      { id: "C", text: "מייצר תוכן אבל לא מרוצה מהאיכות" },
      { id: "D", text: "רוצה ליצור תוכן ברמה מקצועית גבוהה" },
    ],
  },
  {
    id: "q4",
    title: "איך אתה לומד הכי טוב?",
    subtitle: null,
    options: [
      { id: "A", text: "סרטון קצר + מיידי לפעולה" },
      { id: "B", text: "קורס מובנה שאוכל לעבור בקצב שלי" },
      { id: "C", text: "ליווי אישי עם פידבק אמיתי" },
      { id: "D", text: "מישהו שפשוט עושה את זה בשבילי" },
    ],
  },
  {
    id: "q5",
    title: "מה רמת הדחיפות שלך?",
    subtitle: null,
    options: [
      { id: "A", text: "רוצה להבין לפני שאני מחליט" },
      { id: "B", text: "מוכן להתחיל בקרוב - שבוע-שבועיים" },
      { id: "C", text: "דחוף - רוצה תוצאות עכשיו" },
      { id: "D", text: "יש לי פרויקט ספציפי שצריך פתרון מהיר" },
    ],
  },
  {
    id: "q6",
    title: "מה ההשקעה שנוחה לך?",
    subtitle: null,
    options: [
      { id: "A", text: "מעדיף להתחיל חינם ולראות" },
      { id: "B", text: "עד 2,000 ש\"ח - השקעה נוחה" },
      { id: "C", text: "2,000-15,000 ש\"ח - מוכן להשקיע ברצינות" },
      { id: "D", text: "מעל 15,000 ש\"ח - תוצאות חשובות יותר מעלות" },
    ],
  },
];

// ── Products ─────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  { id: "free_training", href: "/training",    name: "הדרכה חינמית",      price: "חינם" },
  { id: "challenge",     href: "/challenge",   name: "אתגר 7 הימים",      price: "197 ש\"ח" },
  { id: "workshop",      href: "/workshop",    name: "סדנה יום אחד",      price: "1,080 ש\"ח" },
  { id: "course",        href: "/course",      name: "קורס דיגיטלי",      price: "1,800 ש\"ח" },
  { id: "strategy",      href: "/strategy",    name: "פגישת אסטרטגיה",    price: "4,000 ש\"ח" },
  { id: "premium",       href: "/premium",     name: "יום צילום פרמיום",  price: "14,000 ש\"ח" },
  { id: "partnership",   href: "/partnership", name: "שותפות אסטרטגית",   price: "10,000-30,000 ש\"ח" },
];

// ── Match score scaling ───────────────────────────────────────────

function scalePrimary(rawScore: number): number {
  const rawPercent = (rawScore / MAX_SCORE) * 100;
  return Math.round(86 + (rawPercent / 100) * 11);
}

function scaleSecondary(rawScore: number): number {
  const rawPercent = (rawScore / MAX_SCORE) * 100;
  return Math.round(78 + (rawPercent / 100) * 14);
}

// ── Scoring ───────────────────────────────────────────────────────

const SCORES: Record<string, Record<Answer, number[]>> = {
  q1: { A: [3,3,1,0,0,0,0], B: [1,2,3,2,1,0,0], C: [0,0,1,3,3,2,1], D: [0,0,0,0,2,3,3] },
  q2: { A: [3,3,2,1,0,0,0], B: [1,2,3,2,1,0,0], C: [0,0,1,1,2,3,2], D: [0,1,2,2,3,2,1] },
  q3: { A: [3,2,1,0,0,0,0], B: [1,3,2,1,0,0,0], C: [0,1,2,3,2,1,0], D: [0,0,0,1,2,3,3] },
  q4: { A: [2,2,1,3,0,0,0], B: [1,3,3,1,0,0,0], C: [0,0,1,1,3,2,1], D: [0,0,0,0,1,3,3] },
  q5: { A: [3,2,1,1,0,0,0], B: [1,3,2,2,1,0,0], C: [0,1,3,2,2,1,0], D: [0,0,1,1,2,3,2] },
  q6: { A: [3,2,0,0,0,0,0], B: [0,2,3,3,1,0,0], C: [0,0,1,2,3,3,1], D: [0,0,0,1,2,3,3] },
};

const MAX_SCORE = 18;
const ALSO_CONSIDER_THRESHOLD = 11;

function computeScores(answers: Answer[]): number[] {
  const totals = new Array(PRODUCTS.length).fill(0);
  ["q1","q2","q3","q4","q5","q6"].forEach((key, i) => {
    if (i >= answers.length) return;
    SCORES[key][answers[i]].forEach((s, pi) => { totals[pi] += s; });
  });
  return totals;
}

function getWinnerIndex(scores: number[]): number {
  const max = Math.max(...scores);
  for (let i = scores.length - 1; i >= 0; i--) {
    if (scores[i] === max) return i;
  }
  return 0;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

function postEvent(payload: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, anonymous_id: getCookie("anon_id") }),
  }).catch(() => {});
}

// ── Stagger animation helper ──────────────────────────────────────

function fadeUp(delayS: number, visible: boolean): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.4s ease ${delayS}s, transform 0.4s ease ${delayS}s`,
  };
}

function fadeIn(delayS: number, visible: boolean): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transition: `opacity 0.4s ease ${delayS}s`,
  };
}

// ── Colors ────────────────────────────────────────────────────────

const C = {
  bg:        "#0a0a0a",
  card:      "#161616",
  textPrim:  "#e8e4dc",
  textSec:   "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.35)",
  gold:      "#c9a84c",
  border:    "rgba(255,255,255,0.06)",
  inputBg:   "#1a1a1a",
  inputBorder: "#2a2a2a",
  quizBg:    "#101520",
  quizCard:  "#191F2B",
  quizBorder: "#2C323E",
  quizText:  "#EDE9E1",
  quizMuted: "#9E9990",
};

// ── Component ─────────────────────────────────────────────────────
// Steps: 0-5 = questions, 6 = lead gate, 7 = result

export function QuizClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");
  const [slideDir, setSlideDir] = useState<SlideDir>("forward");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Lead gate
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [leadState, setLeadState] = useState<"idle" | "loading" | "error">("idle");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  // Result state
  const [resultReady, setResultReady] = useState(false);
  const [displayPct, setDisplayPct] = useState(0);

  // Computed on result screen
  const scores = step === 7 ? computeScores(answers) : null;
  const winnerIdx = scores ? getWinnerIndex(scores) : -1;
  const winner = winnerIdx >= 0 && scores ? PRODUCTS[winnerIdx] : null;
  const alsoConsider = scores
    ? PRODUCTS.filter((_, i) => i !== winnerIdx && scores[i] >= ALSO_CONSIDER_THRESHOLD).slice(0, 2)
    : [];
  const matchPct = scores && winnerIdx >= 0 ? scalePrimary(scores[winnerIdx]) : 86;
  const personalizedReasons = winner ? getPersonalizedReasons(answers, winner.id) : [];

  const startedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    postEvent({ type: "QUIZ_STARTED" });
  }, []);

  // Result: scroll to top + stagger animations + counter
  useEffect(() => {
    if (step !== 7) return;
    window.scrollTo(0, 0);
    setResultReady(false);
    setDisplayPct(0);

    const t1 = setTimeout(() => setResultReady(true), 50);
    const t2 = setTimeout(() => {
      const duration = 1200;
      const target = matchPct;
      const startTime = performance.now();
      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayPct(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 400);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== 7 || completedRef.current || !scores || !winner) return;
    completedRef.current = true;
    postEvent({
      type: "QUIZ_COMPLETED",
      metadata: {
        recommended_product: winner.id,
        match_percent: matchPct,
        answers: answers.reduce<Record<string, string>>((acc, a, i) => { acc[`q${i+1}`] = a; return acc; }, {}),
      },
    });
  }, [step, scores, winner, matchPct, answers]);

  function animateTransition(dir: SlideDir, callback: () => void) {
    setSlideDir(dir);
    setAnimPhase("out");
    setTimeout(() => {
      callback();
      setAnimPhase("in-start");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimPhase("in");
          setTimeout(() => setAnimPhase("idle"), 300);
        });
      });
    }, 200);
  }

  function handleAnswer(id: Answer) {
    if (animPhase === "out") return;
    setSelectedId(id);
    postEvent({ type: "QUIZ_STEP", metadata: { question: step + 1, answer: id } });
    setTimeout(() => {
      animateTransition("forward", () => {
        const newAnswers = [...answers, id];
        setAnswers(newAnswers);
        setSelectedId(null);
        setStep(newAnswers.length === QUESTIONS.length ? 6 : newAnswers.length);
      });
    }, 150);
  }

  function handleBack() {
    animateTransition("back", () => {
      if (step === 6) {
        setStep(QUESTIONS.length - 1);
        setAnswers((prev) => prev.slice(0, -1));
      } else if (step > 0) {
        setStep((s) => s - 1);
        setAnswers((prev) => prev.slice(0, -1));
      }
    });
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setConsentErr(true); return; }
    if (!leadForm.name.trim() || !leadForm.email.trim() || !leadForm.phone.trim()) return;
    setLeadState("loading");
    setLeadError(null);

    // Read UTM attribution from cookies (set by proxy.ts on first landing)
    const utmKeys = ["utm_source", "utm_campaign", "utm_adset", "utm_ad", "fbclid", "gclid"];
    const utmData: Record<string, string> = {};
    for (const key of utmKeys) {
      const val = getCookie(key);
      if (val) utmData[key === "fbclid" || key === "gclid" ? "click_id" : key] = val;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:              leadForm.name.trim(),
          email:             leadForm.email.trim(),
          phone:             leadForm.phone.trim(),
          anonymous_id:      getCookie("anon_id"),
          ab_variant:        getCookie("ab_variant"),
          marketing_consent: consent,
          ...utmData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const userId = (data as Record<string, unknown>).user_id as string | undefined;
        postEvent({ type: "QUIZ_LEAD", user_id: userId, metadata: { email: leadForm.email } });

        // Persist session so product pages skip re-registration
        if (userId) {
          const scoresNow = computeScores(answers);
          const winIdx = getWinnerIndex(scoresNow);
          const secondProd = PRODUCTS.find((_, i) => i !== winIdx && scoresNow[i] >= ALSO_CONSIDER_THRESHOLD);
          saveQuizSession({
            name:               leadForm.name.trim(),
            email:              leadForm.email.trim(),
            phone:              leadForm.phone.trim(),
            userId,
            recommendedProduct: PRODUCTS[winIdx].id,
            secondProduct:      secondProd?.id,
            matchPercent:       scalePrimary(scoresNow[winIdx]),
            answers:            answers.reduce<Record<string, string>>((acc, a, i) => { acc[`q${i+1}`] = a; return acc; }, {}),
            completedAt:        new Date().toISOString(),
          });
        }

        goToResult(userId);
      } else {
        const body = await res.json().catch(() => ({}));
        setLeadError((body as Record<string,string>).error ?? "שגיאה, נסה שוב");
        setLeadState("error");
      }
    } catch {
      setLeadError("שגיאת רשת, נסה שוב");
      setLeadState("error");
    }
  }

  function goToResult(userId?: string) {
    const scoresNow = computeScores(answers);
    const winIdx = getWinnerIndex(scoresNow);
    const prod = PRODUCTS[winIdx];
    const pct = scalePrimary(scoresNow[winIdx]);
    const secondProduct = PRODUCTS.find((_, i) => i !== winIdx && scoresNow[i] >= ALSO_CONSIDER_THRESHOLD);
    fetch("/api/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:             userId ?? null,
        anonymous_id:        getCookie("anon_id"),
        answers:             answers.reduce<Record<string,string>>((acc, a, i) => { acc[`q${i+1}`] = a; return acc; }, {}),
        scores:              scoresNow.reduce<Record<string,number>>((acc, s, i) => { acc[PRODUCTS[i].id] = s; return acc; }, {}),
        recommended_product: prod.id,
        second_product:      secondProduct?.id ?? null,
        match_percent:       pct,
      }),
    }).catch(() => {});
    animateTransition("forward", () => setStep(7));
  }

  function handleCTAClick(productId: string, href: string) {
    postEvent({ type: "QUIZ_CTA_CLICK", metadata: { product_id: productId } });
    window.location.href = href;
  }

  function handleRestart() {
    animateTransition("back", () => {
      setStep(0);
      setAnswers([]);
      setSelectedId(null);
      setLeadForm({ name: "", email: "", phone: "" });
      setLeadState("idle");
      setLeadError(null);
      setConsent(false);
      setConsentErr(false);
      completedRef.current = false;
      setResultReady(false);
      setDisplayPct(0);
    });
  }

  const progress = step >= 6 ? 100 : (step / QUESTIONS.length) * 100;

  function getSlideStyle(): React.CSSProperties {
    const fwd = slideDir === "forward";
    if (animPhase === "out")      return { opacity: 0, transform: `translateX(${fwd ? "-24px" : "24px"})`, transition: "opacity 0.2s ease, transform 0.2s ease" };
    if (animPhase === "in-start") return { opacity: 0, transform: `translateX(${fwd ? "24px" : "-24px"})`, transition: "none" };
    if (animPhase === "in")       return { opacity: 1, transform: "translateX(0)", transition: "opacity 0.25s ease, transform 0.25s ease" };
    return { opacity: 1, transform: "translateX(0)" };
  }

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_PHONE
    ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE}`
    : "/strategy";

  // ── Questions + lead gate wrapper (dark quiz theme) ───────────────
  if (step < 7) {
    return (
      <div
        dir="rtl"
        className="font-assistant"
        style={{ background: C.quizBg, color: C.quizText, overflowX: "hidden" }}
      >
        {step < 6 && (
          <div className="flex justify-end px-4 pt-4 max-w-2xl mx-auto w-full">
            <span className="text-xs font-bold" style={{ color: C.quizMuted }}>
              {step + 1} / {QUESTIONS.length}
            </span>
          </div>
        )}

        <div className="w-full h-0.5" style={{ background: C.quizBorder }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: C.gold }}
          />
        </div>

        <div
          className="flex flex-col items-center px-4 pb-8"
          style={{ paddingTop: "32px" }}
        >
          <div className="w-full" style={{ maxWidth: 520, ...getSlideStyle() }}>

            {/* Questions */}
            {step < 6 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>
                    שאלה {step + 1} מתוך {QUESTIONS.length}
                  </p>
                  <h1 className="font-black leading-snug" style={{ fontSize: "22px" }}>
                    {QUESTIONS[step].title}
                  </h1>
                  {QUESTIONS[step].subtitle && (
                    <p style={{ fontSize: "13px", color: C.quizMuted, lineHeight: 1.6 }}>
                      {QUESTIONS[step].subtitle}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {QUESTIONS[step].options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(opt.id as Answer)}
                      className="w-full text-right rounded-2xl px-5 py-4 transition-all duration-150 font-semibold leading-snug"
                      style={{
                        fontSize: "15px",
                        minHeight: "52px",
                        ...(selectedId === opt.id
                          ? { background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)", color: "#1A1206", border: `1px solid ${C.gold}`, transform: "scale(0.99)" }
                          : { background: C.quizCard, border: `1px solid ${C.quizBorder}`, color: C.quizText }),
                      }}
                      onMouseEnter={(e) => {
                        if (selectedId !== opt.id) {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,150,74,0.12)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,150,74,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedId !== opt.id) {
                          (e.currentTarget as HTMLButtonElement).style.background = C.quizCard;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = C.quizBorder;
                        }
                      }}
                    >
                      <span
                        className="inline-block w-6 h-6 rounded-full text-xs font-black text-center leading-6 ml-3 flex-shrink-0"
                        style={
                          selectedId === opt.id
                            ? { background: "rgba(16,21,32,0.25)", color: "#101520" }
                            : { background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: C.gold }
                        }
                      >
                        {opt.id}
                      </span>
                      {opt.text}
                    </button>
                  ))}
                </div>

                {step > 0 ? (
                  <button
                    onClick={handleBack}
                    className="text-sm text-center transition hover:underline"
                    style={{ color: C.quizMuted, minHeight: "48px" }}
                  >
                    &larr; חזור לשאלה הקודמת
                  </button>
                ) : (
                  <div style={{ minHeight: "48px" }} />
                )}
              </div>
            )}

            {/* Lead gate */}
            {step === 6 && (
              <div className="flex flex-col gap-5 text-center">
                <div className="flex flex-col items-center gap-3">
                  <h1 className="font-black" style={{ fontSize: "22px" }}>התוצאה שלך מוכנה!</h1>
                  <p style={{ fontSize: "13px", color: C.quizMuted, lineHeight: 1.6 }}>
                    מלא פרטים כדי לקבל את ההמלצה האישית שלך
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3 text-right">
                  {[
                    { id: "name",  label: "שם פרטי",    type: "text",  placeholder: "ישראל",              dir: "rtl" },
                    { id: "email", label: "אימייל",      type: "email", placeholder: "israel@example.com", dir: "ltr" },
                    { id: "phone", label: "טלפון נייד",  type: "tel",   placeholder: "0501234567",         dir: "ltr" },
                  ].map(({ id, label, type, placeholder, dir }) => (
                    <div key={id} className="flex flex-col gap-1">
                      <label htmlFor={`lead-${id}`} className="text-sm font-semibold" style={{ color: C.quizMuted }}>
                        {label} <span style={{ color: C.gold }}>*</span>
                      </label>
                      <input
                        id={`lead-${id}`}
                        type={type}
                        placeholder={placeholder}
                        required
                        value={leadForm[id as keyof typeof leadForm]}
                        onChange={(e) => setLeadForm((f) => ({ ...f, [id]: e.target.value }))}
                        dir={dir}
                        style={{ background: C.quizCard, border: `1px solid ${C.quizBorder}`, color: C.quizText, borderRadius: "12px", padding: "14px 16px", fontSize: "15px", minHeight: "52px", width: "100%", outline: "none" }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(201,150,74,0.6)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = C.quizBorder; }}
                      />
                    </div>
                  ))}

                  <ConsentCheckbox
                    checked={consent}
                    onChange={(v) => { setConsent(v); if (v) setConsentErr(false); }}
                    error={consentErr}
                    dark
                  />

                  {leadError && <p className="text-sm text-red-400 text-center">{leadError}</p>}

                  <button
                    type="submit"
                    disabled={leadState === "loading"}
                    className="w-full rounded-full font-bold active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
                    style={{ padding: "16px 24px", fontSize: "15px", minHeight: "52px" }}
                  >
                    {leadState === "loading" ? "שומר..." : "גלה את ההמלצה שלי \u2190"}
                  </button>

                  <p style={{ fontSize: "13px", color: C.quizMuted, textAlign: "center" }}>
                    ללא ספאם. ניתן לבטל בכל עת.
                  </p>
                </form>

                <button
                  onClick={handleBack}
                  className="transition hover:underline"
                  style={{ color: C.quizMuted, fontSize: "13px", minHeight: "48px" }}
                >
                  &larr; חזור לשאלות
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Result page (Netflix style) ───────────────────────────────────
  if (!winner || !scores) return null;

  const heroImage = PRODUCT_IMAGE[winner.id] ?? "/hadar.png";
  const ctaText   = CTA_TEXT[winner.id] ?? "להתחיל עכשיו";
  const metaText  = PRODUCT_META[winner.id] ?? "";
  const firstName = leadForm.name.trim().split(" ")[0];

  return (
    <div
      dir="rtl"
      className="min-h-screen font-assistant"
      style={{ background: C.bg, color: C.textPrim, overflowX: "hidden", width: "100%", maxWidth: "100vw" }}
    >
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "0 0 48px", overflow: "hidden", boxSizing: "border-box" }}>

        {/* 1. Greeting bar */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 16px 12px",
            ...fadeIn(0.2, resultReady),
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600, color: C.textPrim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flexShrink: 1 }}>
            {firstName ? `${firstName}, מצאנו לך התאמה` : "מצאנו לך התאמה"}
          </span>
          <span
            style={{
              fontSize: 14, fontWeight: 700,
              background: "rgba(201,168,76,0.15)",
              color: C.gold,
              border: `1px solid rgba(201,168,76,0.3)`,
              borderRadius: 999,
              padding: "4px 12px",
              fontFamily: "system-ui",
              minWidth: 56,
              textAlign: "center",
            }}
          >
            {displayPct}%
          </span>
        </div>

        {/* 2. Hero card */}
        <div
          style={{
            margin: "0 16px",
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            height: 280,
            ...fadeUp(0.4, resultReady),
          }}
        >
          {/* Product image */}
          <img
            src={heroImage}
            alt={winner.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)",
            }}
          />

          {/* Content over gradient */}
          <div
            style={{
              position: "absolute", bottom: 0, right: 0, left: 0,
              padding: "16px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: C.gold,
                color: "#0a0a0a",
                borderRadius: 4,
                padding: "3px 8px",
                marginBottom: 10,
              }}
            >
              המלצה אישית
            </span>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 8 }}>
              {winner.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <span style={{ color: C.gold, fontWeight: 700 }}>{winner.price}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{metaText}</span>
            </div>
          </div>
        </div>

        {/* 3. Action buttons */}
        <div
          style={{
            display: "flex", gap: 8,
            padding: "12px 16px 0",
            ...fadeUp(0.7, resultReady),
          }}
        >
          <button
            onClick={() => handleCTAClick(winner.id, winner.href)}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: C.gold,
              color: "#0a0a0a",
              fontWeight: 700, fontSize: 15,
              border: "none", borderRadius: 8,
              padding: "14px 16px", minHeight: 52,
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>
            </svg>
            {ctaText}
          </button>
          <button
            onClick={() => handleCTAClick(winner.id, winner.href)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent",
              color: C.textPrim,
              fontWeight: 600, fontSize: 14,
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: 8,
              padding: "14px 18px", minHeight: 52,
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
            </svg>
            פרטים
          </button>
        </div>

        {/* 4. Why it fits */}
        <div style={{ padding: "24px 16px 0" }}>
          <p
            style={{ fontSize: 15, fontWeight: 600, color: C.textPrim, marginBottom: 14, ...fadeUp(0.9, resultReady) }}
          >
            למה זה מתאים לך:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {personalizedReasons.map((reason, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  ...fadeIn(1.0 + i * 0.15, resultReady),
                }}
              >
                <span
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: C.gold,
                    flexShrink: 0, marginTop: 7,
                  }}
                />
                <span style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6 }}>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Social proof strip */}
        <div
          style={{
            margin: "24px 16px 0",
            padding: "16px 0",
            borderTop: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 10,
            ...fadeIn(1.4, resultReady),
          }}
        >
          <span style={{ color: C.gold, fontSize: 14, letterSpacing: 2 }}>★★★★★</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>94 בעלות עסקים כבר השתתפו</span>
        </div>

        {/* 6. More like this */}
        {alsoConsider.length > 0 && (
          <div style={{ padding: "8px 16px 0", ...fadeUp(1.5, resultReady) }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.textPrim, marginBottom: 12 }}>
              גם שווה לבדוק:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, overflow: "hidden" }}>
              {alsoConsider.map((p) => {
                const pScore = scores[PRODUCTS.findIndex((pr) => pr.id === p.id)];
                const pMatch = scaleSecondary(pScore);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleCTAClick(p.id, p.href)}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      overflow: "hidden",
                      cursor: "pointer",
                      textAlign: "right",
                    }}
                  >
                    <div style={{ height: 120, overflow: "hidden" }}>
                      <img
                        src={PRODUCT_IMAGE[p.id] ?? "/hadar.png"}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                      />
                    </div>
                    <div style={{ padding: "10px 10px 12px" }}>
                      <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 4 }}>
                        התאמה {pMatch}%
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrim, marginBottom: 4, lineHeight: 1.3 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>
                        {PRODUCT_DESC[p.id]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Bottom soft CTA */}
        <div
          style={{
            padding: "32px 16px 0",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            ...fadeIn(1.8, resultReady),
          }}
        >
          <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.12)" }} />
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              color: C.textSec,
              fontSize: 14, fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#25D366", flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            מתלבטת? דברי איתנו
          </a>
          <button
            onClick={handleRestart}
            style={{ color: C.textMuted, fontSize: 12, background: "none", border: "none", cursor: "pointer", minHeight: 44 }}
          >
            &larr; ענה שוב מההתחלה
          </button>
        </div>

      </div>
    </div>
  );
}
