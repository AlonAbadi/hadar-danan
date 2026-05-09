"use client";

import { useState, useEffect, useRef } from "react";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { saveQuizSession, getQuizSession, getSessionUser } from "@/lib/quiz-session";
import { trackProductLead, trackQuizRecommended, trackViewContent, trackInitiateCheckout, productLeadEventName, LEAD_VALUE_ILS } from "@/lib/analytics";
import { buildNarrative } from "@/lib/quiz-narrative";
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
  checkoutHref: string;
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
  { id: "free_training", href: "/training",    checkoutHref: "/training",        name: "הדרכה חינמית",      price: "חינם" },
  { id: "challenge",     href: "/challenge",   checkoutHref: "/challenge#cta",   name: "אתגר 7 הימים",      price: "197 ש\"ח" },
  { id: "workshop",      href: "/workshop",    checkoutHref: "/workshop#cta",    name: "סדנה יום אחד",      price: "1,080 ש\"ח" },
  { id: "course",        href: "/course",      checkoutHref: "/course#cta",      name: "קורס דיגיטלי",      price: "1,800 ש\"ח" },
  { id: "strategy",      href: "/strategy",    checkoutHref: "/strategy/book",   name: "פגישת אסטרטגיה",    price: "4,000 ש\"ח" },
  { id: "premium",       href: "/premium",     checkoutHref: "/premium#cta",     name: "יום צילום פרמיום",  price: "14,000 ש\"ח" },
  { id: "partnership",   href: "/partnership", checkoutHref: "/partnership#cta", name: "שותפות אסטרטגית",   price: "10,000-30,000 ש\"ח" },
];

const PRODUCT_VIMEO: Record<string, string> = {
  free_training: "1184732776",
  challenge:     "1184733084",
  workshop:      "1186650827",
  strategy:      "1184732846",
  premium:       "1184560999",
  partnership:   "1184810808",
};

const PRODUCT_VALUE: Record<string, number> = {
  free_training: 0,
  challenge:     197,
  workshop:      1080,
  course:        1800,
  strategy:      4000,
  premium:       14000,
  partnership:   0,
};

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

// ── Types ─────────────────────────────────────────────────────────

type InitialUser = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string;
  marketing_consent: boolean;
} | null;

type InitialQuizResult = {
  answers: Record<string, string>;
  recommendedProduct: string;
  matchPercent: number;
} | null;

// ── Component ─────────────────────────────────────────────────────
// Steps: -1 = checking session, 0-5 = questions, 6 = lead gate, 7 = result

export function QuizClient({ initialUser = null, initialQuizResult = null }: { initialUser?: InitialUser; initialQuizResult?: InitialQuizResult }) {
  const hasServerResult = !!initialQuizResult;
  const serverAnswers: Answer[] = hasServerResult
    ? ["q1","q2","q3","q4","q5","q6"].map(k => (initialQuizResult!.answers[k] as Answer) ?? "A")
    : [];

  const [step, setStep] = useState(hasServerResult ? 7 : -1);
  const [answers, setAnswers] = useState<Answer[]>(serverAnswers);
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");
  const [slideDir, setSlideDir] = useState<SlideDir>("forward");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Logged-in user flags (computed from prop, stable for lifetime of component)
  const isLoggedIn  = !!initialUser;
  const hasName     = !!(initialUser?.name?.trim());
  const hasPhone    = !!(initialUser?.phone?.trim());
  const hasConsent  = !!initialUser?.marketing_consent;
  const [localUserDetails, setLocalUserDetails] = useState<{ name: string; email: string; phone: string; userId: string } | null>(null);
  const canSkipForm = (isLoggedIn && hasName && hasPhone) || !!(localUserDetails?.name && localUserDetails?.email && localUserDetails?.phone);

  // Lead gate
  const [leadForm, setLeadForm] = useState({
    name:  initialUser?.name  ?? "",
    email: initialUser?.email ?? "",
    phone: initialUser?.phone ?? "",
  });
  const [leadState, setLeadState] = useState<"idle" | "loading" | "error">("idle");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  // Soft consent banner (result page, logged-in users who haven't consented)
  const [consentDismissed,  setConsentDismissed]  = useState(false);
  const [consentSubmitting, setConsentSubmitting] = useState(false);
  const [consentDone,       setConsentDone]       = useState(false);

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
  const narrative = step === 7 && answers.length === 6 ? buildNarrative(answers) : null;

  const startedRef  = useRef(hasServerResult); // don't re-fire QUIZ_STARTED when resuming
  const completedRef = useRef(hasServerResult); // don't re-fire QUIZ_COMPLETED when resuming
  const cameFromLeadRef = useRef(false); // suppress simultaneous ViewContent after Lead

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    postEvent({ type: "QUIZ_STARTED" });
    if (typeof window !== "undefined") window.fbq?.("trackCustom", "QuizStart");
  }, []);

  // Detect prior quiz session in localStorage (anonymous users / new device)
  useEffect(() => {
    if (hasServerResult) return; // already handled by server-provided result
    const session = getQuizSession();
    if (session) {
      const restored = ["q1","q2","q3","q4","q5","q6"].map(k => (session.answers[k] as Answer) ?? "A");
      setAnswers(restored);
      setLeadForm({ name: session.name, email: session.email, phone: session.phone });
      startedRef.current   = true;
      completedRef.current = true;
      setStep(7);
    } else {
      // Pre-fill lead form from any prior signup (e.g. training page SignupForm)
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setLeadForm({ name: sessionUser.name, email: sessionUser.email, phone: sessionUser.phone });
        if (sessionUser.name && sessionUser.email && sessionUser.phone) {
          setLocalUserDetails(sessionUser);
        }
      }
      setStep(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Result: scroll to top + stagger animations + counter + ViewContent + QuizRecommended pixel
  useEffect(() => {
    if (step !== 7 || !winner) return;
    window.scrollTo(0, 0);
    setResultReady(false);
    setDisplayPct(0);
    // QuizRecommended — fires when user sees their result (stronger signal than QuizComplete)
    // Used to build product-segmented lookalike audiences from quiz behaviour
    trackQuizRecommended(winner.id, matchPct);
    // Delay ViewContent when following a Lead event to avoid simultaneous burst
    if (cameFromLeadRef.current) {
      cameFromLeadRef.current = false;
      setTimeout(() => trackViewContent(winner.id, PRODUCT_VALUE[winner.id] ?? 0), 3000);
    } else {
      trackViewContent(winner.id, PRODUCT_VALUE[winner.id] ?? 0);
    }

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
    if (typeof window !== "undefined") window.fbq?.("trackCustom", "QuizStep", { question: step + 1, answer: id });
    setTimeout(() => {
      animateTransition("forward", () => {
        const newAnswers = [...answers, id];
        setAnswers(newAnswers);
        setSelectedId(null);
        if (newAnswers.length === QUESTIONS.length) {
          const scoresNow = computeScores(newAnswers);
          const winIdx = getWinnerIndex(scoresNow);
          if (typeof window !== "undefined") window.fbq?.("trackCustom", "QuizComplete", { recommended_product: PRODUCTS[winIdx].id, match_percent: scalePrimary(scoresNow[winIdx]) });
        }
        if (newAnswers.length === QUESTIONS.length && canSkipForm) {
          // User with complete profile (logged-in or from localStorage) - skip lead gate
          const scoresNow  = computeScores(newAnswers);
          const winIdx     = getWinnerIndex(scoresNow);
          const secondProd = PRODUCTS.find((_, i) => i !== winIdx && scoresNow[i] >= ALSO_CONSIDER_THRESHOLD);
          const pct        = scalePrimary(scoresNow[winIdx]);
          const sessionName  = initialUser?.name  ?? localUserDetails?.name  ?? "";
          const sessionEmail = initialUser?.email ?? localUserDetails?.email ?? "";
          const sessionPhone = initialUser?.phone ?? localUserDetails?.phone ?? "";
          const sessionId    = initialUser?.id    ?? localUserDetails?.userId ?? "";
          saveQuizSession({
            name:               sessionName,
            email:              sessionEmail,
            phone:              sessionPhone,
            userId:             sessionId,
            recommendedProduct: PRODUCTS[winIdx].id,
            secondProduct:      secondProd?.id,
            matchPercent:       pct,
            answers:            newAnswers.reduce<Record<string, string>>((acc, a, i) => { acc[`q${i+1}`] = a; return acc; }, {}),
            completedAt:        new Date().toISOString(),
          });
          fetch("/api/quiz-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id:             sessionId || undefined,
              anonymous_id:        getCookie("anon_id"),
              answers:             newAnswers.reduce<Record<string,string>>((acc, a, i) => { acc[`q${i+1}`] = a; return acc; }, {}),
              scores:              scoresNow.reduce<Record<string,number>>((acc, s, i) => { acc[PRODUCTS[i].id] = s; return acc; }, {}),
              recommended_product: PRODUCTS[winIdx].id,
              second_product:      secondProd?.id ?? null,
              match_percent:       pct,
            }),
          }).catch(() => {});
          setStep(7);
        } else {
          setStep(newAnswers.length === QUESTIONS.length ? 6 : newAnswers.length);
        }
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
    // Consent required for anonymous users only; logged-in users get the soft ask on the result page
    if (!isLoggedIn && !consent) { setConsentErr(true); return; }
    if (!leadForm.name.trim() || !leadForm.email.trim() || !leadForm.phone.trim()) return;
    setLeadState("loading");
    setLeadError(null);

    // Read UTM attribution from cookies — truncate to avoid schema max-length failures
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_adset", "utm_ad", "fbclid", "gclid"];
    const utmData: Record<string, string> = {};
    for (const key of utmKeys) {
      const val = getCookie(key);
      if (val) {
        const destKey = key === "fbclid" || key === "gclid" ? "click_id" : key;
        const maxLen  = destKey === "click_id" ? 200 : 100;
        utmData[destKey] = val.slice(0, maxLen);
      }
    }

    // Only send ab_variant if it's a known value
    const abVariant = getCookie("ab_variant");
    const safeAbVariant = (abVariant === "A" || abVariant === "B" || abVariant === "C") ? abVariant : undefined;

    // Only send anonymous_id if it looks like a UUID
    const anonId = getCookie("anon_id");
    const safeAnonId = anonId && /^[0-9a-f-]{36}$/.test(anonId) ? anonId : undefined;

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:              leadForm.name.trim(),
          email:             leadForm.email.trim(),
          phone:             leadForm.phone.trim(),
          anonymous_id:      safeAnonId,
          ab_variant:        safeAbVariant,
          marketing_consent: isLoggedIn ? (initialUser?.marketing_consent ?? false) : consent,
          ...utmData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const userId = (data as Record<string, unknown>).user_id as string | undefined;
        postEvent({ type: "QUIZ_LEAD", user_id: userId, metadata: { email: leadForm.email } });
        const leadEventId = typeof crypto !== "undefined" ? crypto.randomUUID() : undefined;
        const nameParts = leadForm.name.trim().split(" ");
        const scoresNow = computeScores(answers);
        const recommendedProduct = PRODUCTS[getWinnerIndex(scoresNow)].id;
        trackProductLead(recommendedProduct, leadEventId);
        fetch("/api/meta-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName:        "Lead",
            eventId:          leadEventId,
            email:            leadForm.email.trim(),
            phone:            leadForm.phone.trim(),
            firstName:        nameParts[0],
            lastName:         nameParts.slice(1).join(" ") || undefined,
            userId,
            contentName:      recommendedProduct,
            productEventName: productLeadEventName(recommendedProduct),
            value:            LEAD_VALUE_ILS[recommendedProduct] ?? 0,
            currency:         "ILS",
          }),
        }).catch(() => {});

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
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;
        const msg = (body.error as string | undefined)
          ?? (body.errors ? JSON.stringify(body.errors) : null)
          ?? `שגיאה ${res.status}, נסה שוב`;
        setLeadError(msg);
        setLeadState("error");
      }
    } catch {
      setLeadError("שגיאת רשת, נסה שוב");
      setLeadState("error");
    }
  }

  function goToResult(userId?: string) {
    cameFromLeadRef.current = true;
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
    trackInitiateCheckout(productId, PRODUCT_VALUE[productId] ?? 0);
    window.location.href = href;
  }

  function handleRestart() {
    animateTransition("back", () => {
      setStep(0);
      setAnswers([]);
      setSelectedId(null);
      setLeadForm({ name: initialUser?.name ?? "", email: initialUser?.email ?? "", phone: initialUser?.phone ?? "" });
      setLeadState("idle");
      setLeadError(null);
      setConsent(false);
      setConsentErr(false);
      setConsentDismissed(false);
      setConsentDone(false);
      completedRef.current = false;
      setResultReady(false);
      setDisplayPct(0);
    });
  }

  async function handleConsentYes() {
    if (!initialUser) return;
    setConsentSubmitting(true);
    try {
      const name  = initialUser.name?.trim()  || leadForm.name.trim();
      const phone = initialUser.phone?.trim() || leadForm.phone.trim();
      if (name && phone) {
        await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email:             initialUser.email,
            phone,
            marketing_consent: true,
          }),
        });
      }
      setConsentDone(true);
    } catch {
      setConsentDone(true); // dismiss on error - don't disrupt UX
    }
    setConsentSubmitting(false);
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

  // ── Brief blank state while checking localStorage ─────────────────
  if (step === -1) return null;

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
                    {isLoggedIn
                      ? "כדי לקבל גישה לקבוצת הוואטסאפ והעדכונים, נשאר רק לשתף עוד פרט אחד"
                      : "מלא פרטים כדי לקבל את ההמלצה האישית שלך"}
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3 text-right">
                  {[
                    { id: "name",  show: !isLoggedIn || !hasName,  label: "שם פרטי",    type: "text",  placeholder: "ישראל",              dir: "rtl" },
                    { id: "email", show: !isLoggedIn,               label: "אימייל",      type: "email", placeholder: "israel@example.com", dir: "ltr" },
                    { id: "phone", show: !isLoggedIn || !hasPhone,  label: "טלפון נייד",  type: "tel",   placeholder: "0501234567",         dir: "ltr" },
                  ].filter((f) => f.show).map(({ id, label, type, placeholder, dir }) => (
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

                  {/* Consent checkbox only for anonymous users - logged-in users get soft ask on result page */}
                  {!isLoggedIn && (
                    <ConsentCheckbox
                      checked={consent}
                      onChange={(v) => { setConsent(v); if (v) setConsentErr(false); }}
                      error={consentErr}
                      dark
                    />
                  )}

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

 // ── Result page (Netflix style + Narrative Engine) ───────────────
  if (!winner || !scores || !narrative) return null;

  const heroImage = PRODUCT_IMAGE[winner.id] ?? "/hadar.jpg";
  const ctaText = CTA_TEXT[winner.id] ?? "להתחיל עכשיו";
  const metaText = PRODUCT_META[winner.id] ?? "";
  const firstName = leadForm.name.trim().split(" ")[0];

  return (
    <div
      dir="rtl"
      className="min-h-screen font-assistant"
      style={{ background: C.bg, color: C.textPrim, overflowX: "hidden", width: "100%", maxWidth: "100vw" }}
    >
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "0 0 48px", overflow: "hidden", boxSizing: "border-box" }}>

        {/* 1. Badge */}
        <div style={{ padding: "20px 16px 0", ...fadeIn(0.1, resultReady) }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: `linear-gradient(135deg, ${C.gold}, #9E7C3A)`,
              color: "#0a0a0a",
              padding: "8px 16px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            האבחון שלכם מוכן
          </span>
        </div>

        {/* 2. Headline from narrative engine */}
        <div style={{ padding: "16px 16px 0", ...fadeUp(0.2, resultReady) }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, margin: 0, color: C.textPrim }}>
            {narrative.headline.main}{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${C.gold}, #9E7C3A)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {narrative.headline.highlight}
            </span>
          </h1>
          <p style={{ fontSize: 15, color: C.textSec, marginTop: 8, lineHeight: 1.5 }}>
            {narrative.subline}
          </p>
        </div>

        {/* 3. Diagnosis card */}
        <div
          style={{
            margin: "20px 16px 0",
            background: C.card,
            borderRadius: 16,
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.06)",
            ...fadeUp(0.4, resultReady),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              fontWeight: 700,
              color: C.gold,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: `linear-gradient(135deg, ${C.gold}, #9E7C3A)`,
                borderRadius: "50%",
              }}
            />
            מה גילינו
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.textPrim, margin: 0 }}>
            <strong style={{ color: C.gold, fontWeight: 600 }}>{narrative.diagnosis.problem}</strong>
          </p>

          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.textPrim, margin: "12px 0 0" }}>
            {narrative.diagnosis.consequence}
          </p>

          <p
            style={{
              fontSize: 14,
              color: C.textSec,
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontStyle: "italic",
            }}
          >
            {narrative.diagnosis.socialProof}
          </p>
        </div>

        {/* 4. Confidence bar */}
        <div
          style={{
            margin: "16px 16px 0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: narrative.confidence.level >= 4 ? "rgba(74, 222, 128, 0.08)" : "rgba(232, 185, 74, 0.08)",
            borderRadius: 12,
            ...fadeIn(0.5, resultReady),
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i <= narrative.confidence.level
                    ? (narrative.confidence.level >= 4 ? "#4ade80" : C.gold)
                    : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: narrative.confidence.level >= 4 ? "#4ade80" : C.gold,
            }}
          >
            {narrative.confidence.text} ({displayPct}%)
          </span>
        </div>

        {/* 5. Incoherence warning */}
        {narrative.incoherenceWarning && (
          <div
            style={{
              margin: "12px 16px 0",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 16,
              background: "rgba(251, 191, 36, 0.08)",
              border: "1px solid rgba(251, 191, 36, 0.2)",
              borderRadius: 12,
              ...fadeIn(0.55, resultReady),
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p style={{ fontSize: 14, color: C.textPrim, lineHeight: 1.5, margin: 0 }}>
              {narrative.incoherenceWarning}
            </p>
          </div>
        )}

        {/* 6. Bridge text */}
        <p style={{ padding: "20px 16px 0", fontSize: 14, color: C.textSec, ...fadeIn(0.6, resultReady) }}>
          {narrative.bridge}
        </p>

        {/* 7. Recommendation label */}
        <div style={{ padding: "16px 16px 0", ...fadeUp(0.65, resultReady) }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px" }}>
            ההמלצה שלנו
          </span>
        </div>

        {/* 8. Hero card */}
        <div style={{ margin: "12px 16px 0", ...fadeUp(0.7, resultReady) }}>
          {PRODUCT_VIMEO[winner.id] ? (
            <div style={{ maxWidth: 220, margin: "0 auto" }}>
              <div style={{ marginBottom: 10, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{winner.name}</div>
                <div style={{ fontSize: 14, color: C.gold, fontWeight: 700, marginTop: 4 }}>{winner.price}</div>
              </div>
              <div style={{ position: "relative", paddingTop: "177.78%", borderRadius: 14, overflow: "hidden", background: "#141820" }}>
                <iframe
                  src={`https://player.vimeo.com/video/${PRODUCT_VIMEO[winner.id]}?badge=0&autopause=0&loop=0&player_id=0&app_id=58479&cc=0`}
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                  title={winner.name}
                />
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: 14, overflow: "hidden", position: "relative", height: 280, border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 0 40px rgba(232,185,74,0.08)" }}>
              <img src={heroImage} alt={winner.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, padding: 16 }}>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 8 }}>{winner.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>{winner.price}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{metaText}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 9. Action buttons */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 0", ...fadeUp(0.85, resultReady) }}>
          <button
            onClick={() => handleCTAClick(winner.id, winner.checkoutHref)}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: C.gold, color: "#0a0a0a", fontWeight: 700, fontSize: 15,
              border: "none", borderRadius: 8, padding: "14px 16px", minHeight: 52, cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2.5l10 5.5-10 5.5V2.5z"/></svg>
            {ctaText}
          </button>
          <button
            onClick={() => handleCTAClick(winner.id, winner.href)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent", color: C.textPrim, fontWeight: 600, fontSize: 14,
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "14px 18px", minHeight: 52, cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
            </svg>
            פרטים
          </button>
        </div>

        {/* 10. CTA microcopy */}
        <p style={{ textAlign: "center", fontSize: 13, color: C.textMuted, padding: "8px 16px 0", ...fadeIn(0.9, resultReady) }}>
          {winner.id === "course" && "אפשר לשלם עד 4 תשלומים ללא ריבית"}
          {winner.id === "free_training" && "בלי כרטיס אשראי, בלי התחייבות"}
          {winner.id === "strategy" && "4 מקומות בחודש בלבד"}
        </p>

        {/* Soft consent ask */}
        {isLoggedIn && !hasConsent && !consentDismissed && (
          <div style={{ margin: "12px 16px 0", background: "rgba(232,185,74,0.06)", border: "1px solid rgba(232,185,74,0.2)", borderRadius: 8, padding: 14, ...fadeIn(0.95, resultReady) }}>
            {consentDone ? (
              <p style={{ fontSize: 13, color: C.gold, textAlign: "center" }}>תודה! ניצור איתך קשר בקרוב</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: C.textSec, marginBottom: 10, lineHeight: 1.5 }}>רוצה לקבל עדכונים על תכנים חדשים, מבצעים, וטיפים שיווקיים?</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button onClick={handleConsentYes} disabled={consentSubmitting} style={{ background: C.gold, color: "#0a0a0a", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: consentSubmitting ? 0.6 : 1 }}>
                    {consentSubmitting ? "..." : "כן, אשמח"}
                  </button>
                  <button onClick={() => setConsentDismissed(true)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", padding: "8px 12px" }}>
                    אולי בפעם אחרת
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 11. Why it fits */}
        <div style={{ padding: "24px 16px 0" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.textPrim, marginBottom: 14, ...fadeUp(1.0, resultReady) }}>למה זה מתאים לכם:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {personalizedReasons.map((reason, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, ...fadeIn(1.1 + i * 0.1, resultReady) }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, flexShrink: 0, marginTop: 7 }} />
                <span style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6 }}>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 12. Social proof */}
        <div style={{ margin: "24px 16px 0", padding: "16px 0", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, ...fadeIn(1.4, resultReady) }}>
          <span style={{ color: C.gold, fontSize: 14, letterSpacing: 2 }}>★★★★★</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>94 בעלות עסקים כבר השתתפו</span>
        </div>

        {/* 13. More like this */}
        {alsoConsider.length > 0 && (
          <div style={{ padding: "8px 16px 0", ...fadeUp(1.5, resultReady) }}>
            <p style={{ fontSize: 14, color: C.textSec, marginBottom: 12 }}>
              {PRODUCTS.indexOf(alsoConsider[0]) > winnerIdx ? "רוצים ללכת על משהו יותר מקיף?" : "אם זה גדול מדי כרגע - אפשר להתחיל כאן:"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, overflow: "hidden" }}>
              {alsoConsider.map((p) => {
                const pScore = scores[PRODUCTS.findIndex((pr) => pr.id === p.id)];
                const pMatch = scaleSecondary(pScore);
                return (
                  <button key={p.id} onClick={() => handleCTAClick(p.id, p.href)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", textAlign: "right" }}>
                    <div style={{ height: 120, overflow: "hidden" }}>
                      <img src={PRODUCT_IMAGE[p.id] ?? "/hadar.jpg"} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                    </div>
                    <div style={{ padding: "10px 10px 12px" }}>
                      <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 4 }}>התאמה {pMatch}%</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrim, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>{PRODUCT_DESC[p.id]}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 14. Bottom CTA */}
        <div style={{ padding: "32px 16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, ...fadeIn(1.8, resultReady) }}>
          <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.12)" }} />
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#25D366", flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            מתלבטים? דברו איתנו
          </a>
          <button onClick={handleRestart} style={{ color: C.textMuted, fontSize: 12, background: "none", border: "none", cursor: "pointer", minHeight: 44 }}>
            ← ענו שוב מההתחלה
          </button>
        </div>

      </div>
    </div>
  );
}