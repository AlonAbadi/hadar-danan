"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { ShareButtons } from "@/components/signal/ShareButtons";

// ─────────────────────────────────────────────────────────────────────────────
// /kriah — unified funnel v2, wave 1.
// Copy source of truth: KRIAH_V2_COPY_DECK.md (verbatim, never paraphrased).
// Architecture: BUILD_SPEC_KRIAH_V2.md §4-5. Question set: SIGNAL_QUESTIONS_V2_SPEC §1
// (deck overrides on Q2 text, Q6 hint, Q5-conditional).
// ─────────────────────────────────────────────────────────────────────────────

type StateKey   = "A" | "B" | "C" | "D";
type BlockerKey = "message" | "content" | "price" | "time";

type Screen =
  | "s1" | "s2" | "s3" | "s4" | "s6" | "s7" | "s8"
  | "q" | "probe" | "s15" | "loading" | "sendgate" | "s16" | "exit" | "error";

type SignalOutput = {
  occupation?:        string | null;   // inferred by the engine (change 3)
  pain_source:        string;
  element:            string;
  signal:             string;
  signal_promise:     string;
  central_tool:       string;
  people:             string;
  content_directions: string[];
  warm_note:          string;
};

// Santosha palette — visually consistent with SignalClient.
const C = {
  bg:       "#0D1018",
  card:     "#141820",
  cardSoft: "#1D2430",
  gold:     "#E8B94A",
  goldMid:  "#C9964A",
  fg:       "#EDE9E1",
  muted:    "#AAB0BD",
  line:     "rgba(232,185,74,0.14)",
};

const GOLD_GRAD   = "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)";
const GOLD_SHADOW =
  "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)";

const MIN_CHARS = 40;                    // soft nudge, like SignalClient
const DRAFT_KEY = "kriah_v2_draft";

// ── S2/S3 choices (deck) ─────────────────────────────────────────────────────

const STATE_OPTIONS: { key: StateKey; label: string }[] = [
  { key: "A", label: "עוד אין עסק, יש רעיון" },
  { key: "B", label: "יש לקוחות ראשונים, ההכנסה עוד לא יציבה" },
  { key: "C", label: "יש הכנסה קבועה, אבל הכול עובר דרכי" },
  { key: "D", label: "עסק ותיק שמחפש את הקפיצה הבאה" },
];

const BLOCKER_OPTIONS: { key: BlockerKey; label: string }[] = [
  { key: "message", label: "המסר" },
  { key: "content", label: "התוכן" },
  { key: "price",   label: "התמחור" },
  { key: "time",    label: "הזמן" },
];

// ── S6 matrix — 16 cells, verbatim from the deck ─────────────────────────────

const MATRIX: Record<string, string> = {
  A_message:
    "עוד אין עסק, והמסר הוא מה שעוצר. כלומר אתם מחכים לניסוח הנכון לפני שיוצאים. אבל זה הפוך ממה שזה מרגיש: מסר לא נכתב ליד שולחן, הוא מתגלה ברגע שמישהו אמיתי אומר לכם למה הוא בא דווקא אליכם. הלקוח הראשון לא מחכה למסר מושלם. המסר מחכה ללקוח הראשון.",
  A_content:
    "מעניין שבחרתם דווקא בתוכן. עסק עוד אין, אבל מה שמעיק זה הפרסום. בדרך כלל זה סימן שהתוכן הפך למבחן: כל פוסט מרגיש כמו הצהרה על מי שאתם, ולכן קל יותר לא לפרסם. הבעיה היא לא היכולת לייצר תוכן. זו ההכרעה מה אתם מוכנים שייאמר עליכם.",
  A_price:
    "עוד לא ביקשתם ממישהו כסף, והתמחור כבר עוצר. זה פחות מוזר ממה שזה נשמע: כשאין עדיין משפט שאומר מה אתם נותנים שאחרים לא, כל מספר מרגיש שרירותי, גבוה מדי או נמוך מדי בו-זמנית. המחיר לא מחכה לתעריף הנכון. הוא מחכה שתדעו על מה הוא.",
  A_time:
    "דווקא בהתחלה, כשעוד אין לקוחות שמושכים בשרוול, הזמן אמור להיות הנכס הכי גדול שלכם. אם הוא בכל זאת מה שעוצר, זה כמעט אף פעם לא לוח הזמנים. כשאין משפט אחד שמכריע מה שווה את הזמן, כל משימה נראית דחופה באותה מידה. הבהירות הזאת לא תגיע מעוד שעה פנויה ביומן.",
  B_message:
    "יש כבר אנשים שמשלמים לכם. זו הוכחה שהערך אמיתי. אבל סימנתם שהמסר עוד לא ברור: כשהערך קיים והמסר מטושטש, אתם נמכרים למרות המסר, לא בזכותו. מה שחסר זה לא עוד שכנוע, אלא משפט אחד שיגיד את מה שכבר עובד בשקט.",
  B_content:
    "הלקוחות הראשונים שלכם הגיעו בלי מכונת תוכן. מישהו שמע, מישהו המליץ, משהו עבד פנים מול פנים. ועכשיו דווקא התוכן מרגיש כמו החסם. שווה לעצור על זה: מה שמכר עד עכשיו הוא משהו שאתם אומרים באופן טבעי בשיחה. התוכן נתקע לא כי חסרה יכולת, אלא כי הוא עוד לא אומר את הדבר הזה.",
  B_price:
    "כמה אנשים כבר שילמו לכם, ובכל זאת התמחור הוא מה שעוצר. תשאלו את עצמכם איך נסגרו העסקאות האלה: אם כל מכירה דרשה שכנוע, הנחה או מאמץ אישי, הבעיה לא במספר. משלמים בקלות רק כשברור על מה משלמים. עד אז כל מחיר, גם נמוך, ירגיש יקר.",
  B_time:
    "הכנסה לא יציבה וזמן שנגמר זה צירוף שכדאי לעצור עליו. כשעוד לא ברור מאיפה תגיע ההכנסה הבאה, אומרים כן כמעט לכל דבר, והיומן מתמלא בעבודה שלא מייצבת כלום. הזמן לא אוזל כי יש יותר מדי עבודה. הוא אוזל כי אין משפט שמכריע לאיזו עבודה מותר להגיד לא.",
  C_message:
    "ההכנסה קבועה, אז מסר קיים, מישהו הרי מבין למה לבחור בכם. אבל שימו לב איפה הוא גר: אצלכם בפה, בשיחות שרק אתם יודעים לנהל. זו בדיוק הסיבה שהכול עובר דרככם. מסר שלא נוסח אי אפשר למסור הלאה, לא לעובד, לא לדף מכירה, לא להמלצה.",
  C_content:
    "העסק עובד, הלקוחות חוזרים, ובכל זאת התוכן מרגיש כמו חזית שאף פעם לא נסגרת. זה לא מקרה: כשהכול עובר דרככם, גם התוכן עובר דרככם, ובלי משפט שמכריע מה הוא בא להגיד, כל פוסט נפתח מאפס. עוד תוכן לא יסגור את החזית. משפט אחד שכל הפוסטים חוזרים אליו כן.",
  C_price:
    "יש הכנסה קבועה, והכול עובר דרככם. ואז התמחור עוצר. חברו את שני אלה: כשהמוצר האמיתי הוא השעות שלכם, כל העלאת מחיר מרגישה כמו הבטחה שתצטרכו לעמוד בה אישית. לא המספר מפחיד אתכם, אלא ההתחייבות שהוא מייצג. מחיר עולה בקלות כשברור מה הוא קונה חוץ מכם.",
  C_time:
    "זה נראה מובן מאליו: הכול עובר דרככם, ברור שאין זמן. אבל השאלה היא למה זה חייב לעבור דרככם. בדרך כלל לא בגלל שאין למי למסור, אלא כי רק אתם יודעים להגיד את הדבר הנכון ברגע הנכון. זו לא בעיית זמן. זו ידיעה שעוד לא הפכה למשפט שאחרים יכולים להגיד.",
  D_message:
    "עסק לא שורד שנים בלי מסר שעובד. אז אם אחרי כל הדרך הזאת סימנתם את המסר, כנראה שהוא לא נעלם, הוא התיישן. המשפט שבנה את מה שיש כוון למי שהייתם כשהתחלתם. הקפיצה הבאה לא דורשת מסר חדש יש מאין. היא דורשת את הגרסה שכבר גדלתם אליה.",
  D_content:
    "הגעתם עד לכאן, עסק ותיק ויציב, כנראה בלי להיות תלויים בתוכן. ועכשיו נדמה שהקפיצה הבאה תגיע ממנו. יכול להיות. אבל תוכן הוא מגבר, לא מנוע: הוא מגדיל את מה שכבר ברור, ומטשטש עוד יותר את מה שלא. לפני ששואלים כמה לפרסם, כדאי לדעת מה המשפט שכל זה אמור להגביר.",
  D_price:
    "אתם כבר מוכרים אבל תקועים, וסימנתם את התמחור. הפער עדין: כשמדברים על מחיר, בדרך כלל המסר עוד לא עשה את העבודה של להסביר למה דווקא אתם. מחיר מרגיש גבוה רק כשהייחוד לא נשמע.",
  D_time:
    "אחרי שנים בעסק, זמן הוא בדרך כלל לא מה שחסר, אלא מה שנבלע. השוטף שבניתם עובד כל כך טוב שהוא ממלא כל שעה, והקפיצה הבאה נדחית לרבעון הבא, שוב. זה לא ייפתר בעוד סדר ביומן. קפיצה מקבלת זמן רק כשיש משפט שמגדיר אותה מספיק חד כדי להתחייב אליו.",
};

const FALLBACK_CELL =
  "הצירוף שבחרתם הוא מהנדירים כאן, וזו לא תקלה, זה מידע: העסק שלכם לא יושב בקטגוריה מוכנה. ודבר אחד נכון כמעט תמיד, גם בלי להכיר אתכם עוד: המסר, התוכן, התמחור והזמן הם ארבעה שמות לאותה שאלה אחת, מה הדבר שרק אתם נותנים. כשיש לזה משפט, ארבעתם מתחילים להסתדר סביבו.";

const LIMITATION_LINE =
  "שלוש תשובות זה מתאר, לא דיוקן. את המשפט שמבדל אתכם אפשר לבנות רק ממה שבאמת קרה לכם.";

// ── S9-S14 — the six questions ───────────────────────────────────────────────
// Text + hints from SIGNAL_QUESTIONS_V2_SPEC §1; deck overrides Q2 text,
// Q6 hint, and the Q5 conditional variant.

interface Question {
  key:        string;
  label:      string;
  hint:       string;
  extraHint?: string;   // Q3 width line for people without clients yet
}

const QUESTIONS: Question[] = [
  {
    key:   "flow_zone",
    label: "רגע שבו שכחת מהזמן",
    hint:  "מתי זה קרה בפעם האחרונה? איפה היית, מה עשית שם, ואיך פתאום גילית כמה זמן עבר.",
  },
  {
    key:   "effortless_mastery",
    label: "מה הדבר שאנשים עוצרים לידו ואומרים לך \"רגע, מאיפה היכולת הזאת?\"",
    hint:  "מתי לאחרונה מישהו שאל אותך את זה, ומה עשית שם? ואם אין לך תשובה מסודרת, זה בדיוק הסימן.",
  },
  {
    key:   "gratitude_mirror",
    label: "על מה אנשים מודים לך הכי הרבה?",
    hint:  "לא מה שכתוב באתר. משפט תודה אחד שקיבלת באמת: מי אמר אותו, מה בדיוק נאמר, ומה השתנה אצלו. אפשר לצטט מילה במילה.",
    extraHint: "תודה אמיתית נחשבת גם מחבר, קולגה, או אדם שעזרת לו בדרך.",
  },
  {
    key:   "hard_period",
    label: "תקופה קשה שעברת. לא צריך את כל הסיפור, רק רגע אחד מתוכה.",
    hint:  "אפשר לדלג, או לכתוב רק מה שמרגיש בסדר לחלוק. אין כאן רשות לחקור כאב שלא בחרת להעלות. אם כן, רגע אחד: איפה היית, מה קרה.",
  },
  {
    key:   "what_helped",
    label: "מה עזר לך לצאת מזה, מה פיתחת בעצמך",
    hint:  "כלי, הרגל, או שאלה שהפכה למפתח. לא משהו שלמדת מספר, משהו שחיית. במילים שלך, כאילו חבר שואל אותך בטלפון.",
  },
  {
    key:   "message_to_past",
    label: "משפט אחד למי שנמצא היום בדיוק איפה שהיית",
    hint:  "לא עצה ולא צעד. הדבר האחד שהיית רוצה שמישהו יראה לך, שיחסוך לך שנה.",
  },
];

// Deck override — Q5 conditional variant, shown when Q4 was skipped.
const Q5_CONDITIONAL_LABEL =
  "מה הכלי, ההרגל או השאלה שפיתחת בעצמך, הדבר שהכי מחזיק אותך היום?";

// Q4 breath intro (spec §5 of BUILD_SPEC — the breath line before the question).
const Q4_BREATH_LINE =
  "רגע נשימה. השאלה נוגעת במקום פחות נוח, והיא לגמרי בבחירה שלך.";

// ── Probe copy (deck; one probe max, primary Q6, fallback Q2, never Q4) ──────

const PROBE_COPY: Record<"message_to_past" | "effortless_mastery", string> = {
  message_to_past:
    "זה נכון, אבל זה עדיין יכול להיות של כל אחד: ומה המשפט שלך לאדם אחד ספציפי, שיושב עכשיו בדיוק איפה שישבת אז?",
  effortless_mastery:
    "יש שם משהו, שווה עוד רגע אחד: מתי לאחרונה מישהו באמת עצר, ומה בדיוק הוא ראה באותו רגע?",
};

// ── S7 dynamic callback (headline references the S3 blocker) ─────────────────

const S7_CALLBACK: Record<BlockerKey, string> = {
  message: "אמרתם שהמסר הוא מה שעוצר אתכם עכשיו.",
  content: "אמרתם שהתוכן הוא מה שעוצר אתכם עכשיו.",
  price:   "אמרתם שהתמחור הוא מה שעוצר אתכם עכשיו.",
  time:    "אמרתם שהזמן הוא מה שעוצר אתכם עכשיו.",
};

// ── Cookies / tracking helpers ───────────────────────────────────────────────

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "utm_term", "utm_adset", "utm_ad", "fbclid", "gclid",
] as const;

function readUtmCookies(): Record<string, string> {
  const data: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const val = getCookie(key);
    if (val) data[key === "fbclid" || key === "gclid" ? "click_id" : key] = val;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  previewKey: string;
  isTest:     boolean;
}

interface Draft {
  screen?:     Screen;
  qIdx?:       number;
  stateKey?:   StateKey | null;
  blocker?:    BlockerKey | null;
  changeWish?: string;
  answers?:    Record<string, string>;
  q4Skipped?:  boolean;
  probeShown?: boolean;
  name?:       string;
  email?:      string;
  phone?:      string;
  occupation?: string;
  signal?:     SignalOutput | null;
}

export function KriahClient({ previewKey, isTest }: Props) {
  // Entry beacon — the funnel denominator (fires once per mount).
  const entryFired = useRef(false);
  useEffect(() => {
    if (entryFired.current) return;
    entryFired.current = true;
    track("s1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plant the tester cookie so the next visit works without ?key= (90 days).
  useEffect(() => {
    if (previewKey) {
      document.cookie = `kriah_preview=${encodeURIComponent(previewKey)}; path=/; max-age=${90 * 24 * 3600}; SameSite=Lax; Secure`;
    }
  }, [previewKey]);

  const [ready, setReady]         = useState(false);
  const [screen, setScreen] = useState<Screen>("s2");
  const [qIdx, setQIdx]           = useState(0);

  // Three choices
  const [stateKey, setStateKey]   = useState<StateKey | null>(null);
  const [blocker, setBlocker]     = useState<BlockerKey | null>(null);
  const [changeWish, setChangeWish] = useState("");

  // Six answers
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [q4Skipped, setQ4Skipped] = useState(false);

  // Probe (one max, never Q4)
  const [probeShown, setProbeShown]   = useState(false);
  const [probeTarget, setProbeTarget] = useState<"message_to_past" | "effortless_mastery" | null>(null);
  const [probeEditing, setProbeEditing] = useState(false);

  // Lead fields
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [consent, setConsent]     = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [gateErr, setGateErr]     = useState<string | null>(null);
  const [phoneErr, setPhoneErr]   = useState<string | null>(null);

  // Result
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [ending, setEnding] = useState<"concierge" | "hive" | "pre_revenue" | "crisis_soft">("hive");
  const [occupation, setOccupation] = useState("");
  const [softCaptured, setSoftCaptured] = useState(false);   // email given at the S8 soft gate
  const [finalizing, setFinalizing]     = useState(false);
  const [signal, setSignal]       = useState<SignalOutput | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  const restoredRef = useRef(false);

  // ── FUNNEL_STEP tracking (no ab_variant, no PageTracker) ──────────────────
  const track = useCallback((step: string) => {
    try {
      const anonymousId = getCookie("anon_id");
      const body = JSON.stringify({
        type: "FUNNEL_STEP",
        ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        metadata: { step, instrument: "v2_funnel", is_test: isTest },
      });
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon("/api/events", blob)) {
        void fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* tracking must never break the funnel */
    }
  }, [isTest]);

  const goTo = useCallback((next: Screen, stepId: string) => {
    setScreen(next);
    track(stepId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [track]);

  // ── Restore draft (sessionStorage) ─────────────────────────────────────────
  useEffect(() => {
    let initialStep = "s1_entry";
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        if (d.stateKey)   setStateKey(d.stateKey);
        if (d.blocker)    setBlocker(d.blocker);
        if (typeof d.occupation === "string") setOccupation(d.occupation);
        if (typeof d.changeWish === "string") setChangeWish(d.changeWish);
        if (d.answers && typeof d.answers === "object") setAnswers(d.answers);
        if (d.q4Skipped)  setQ4Skipped(true);
        if (d.probeShown) setProbeShown(true);
        if (typeof d.name === "string")  setName(d.name);
        if (typeof d.email === "string") setEmail(d.email);
        if (typeof d.phone === "string") setPhone(d.phone);
        if (d.signal)     setSignal(d.signal);
        if (typeof d.qIdx === "number" && d.qIdx >= 0 && d.qIdx < QUESTIONS.length) setQIdx(d.qIdx);
        if (d.screen) {
          // Never restore into transient screens.
          let s: Screen = d.screen;
          if (s === "loading" || s === "error" || s === "probe") s = "s15";
          if (s === "s16" && !d.signal) s = "s15";
          setScreen(s);
          initialStep = `restore_${s}`;
        }
      }
    } catch {}
    restoredRef.current = true;
    setReady(true);
    track(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      const draft: Draft = {
        screen, qIdx, stateKey, blocker, changeWish, answers, occupation,
        q4Skipped, probeShown, name, email, phone, signal,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [screen, qIdx, stateKey, blocker, changeWish, answers, q4Skipped, probeShown, name, email, phone, signal]);

  // ── S5 email gate → POST /api/signup (non-blocking) ────────────────────────
  // ── S8 soft capture (change 2): one light email field, never blocking ──────
  // Consent here is by the inline legal line (not a checkbox) — the field's
  // whole purpose is saving progress + contact; the letter email itself is
  // requested explicitly at the send gate.
  const submitSoftCapture = () => {
    const em = email.trim().toLowerCase();
    if (!em.includes("@") || !em.includes(".")) { setGateErr("כתובת אימייל לא תקינה"); return; }
    setGateErr(null);
    const anonymousId = getCookie("anon_id");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (previewKey) headers["x-kriah-preview"] = previewKey;
    // Note: ab_variant deliberately NOT sent — sending it would increment the
    // live landing_headline experiment conversion counters.
    void fetch("/api/signup", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: name.trim() || "",
        email: em,
        marketing_consent: true,
        is_test: isTest,
        instrument_version: "v2_funnel", // phone-less + name-less lead allowed
        ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        ...readUtmCookies(),
      }),
    }).catch((err) => console.warn("[kriah] soft capture failed", err));
    setSoftCaptured(true);
    setConsent(true);
    startQuestions();
  };

  const startQuestions = () => {
    track("q1_flow_zone_shown");
    setScreen("q");
    setQIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Partial-answer beacon (change 2): abandonment mid-questions still leaves
  // the answers recoverable next to the soft-captured contact.
  const beaconPartialAnswer = (key: string) => {
    try {
      const text = (answers[key] ?? "").trim().slice(0, 1500);
      if (!text) return;
      const anonymousId = getCookie("anon_id");
      navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify({
        type: "KRIAH_PARTIAL_ANSWER",
        ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        metadata: { key, text, instrument: "v2_funnel", is_test: isTest },
      })], { type: "application/json" }));
    } catch { /* tracking only */ }
  };

  // ── Send gate (change 1): gates the LETTER, not the snapshot ────────────────
  const submitSendGate = async () => {
    const nm = name.trim();
    const em = email.trim().toLowerCase();
    if (nm.length < 2) { setGateErr("שם חייב להכיל לפחות 2 תווים"); return; }
    if (!em.includes("@") || !em.includes(".")) { setGateErr("כתובת אימייל לא תקינה"); return; }
    if (!consent) { setConsentErr(true); return; }
    setGateErr(null);
    setFinalizing(true);
    try {
      if (extractionId) {
        // Reading already generated (soft-capture path) — patch the lead
        // with the confirmed values + deliver the letter by email.
        await finalizeAndSend(extractionId);
        goTo("s16", "s16_full_reading");
      } else {
        // Skipper path — extraction runs now with everything in hand.
        await runExtract("finalize");
      }
    } finally {
      setFinalizing(false);
    }
  };

  const finalizeAndSend = async (extId: string) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (previewKey) headers["x-kriah-preview"] = previewKey;
      await fetch("/api/kriah/finalize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          extraction_id: extId,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          occupation: occupation.trim(),
        }),
      });
    } catch (err) {
      // The letter still renders on screen — email delivery is best-effort here.
      console.warn("[kriah] finalize failed", err);
    }
  };

  // ── After Q6: decide probe / continue ─────────────────────────────────────
  const afterQ6 = () => {
    const q6 = (answers["message_to_past"] ?? "").trim();
    const q2 = (answers["effortless_mastery"] ?? "").trim();
    if (!probeShown && q6.length < 120) {
      setProbeTarget("message_to_past");
      setProbeShown(true);
      setProbeEditing(false);
      goTo("probe", "probe_q6");
      return;
    }
    if (!probeShown && q2.length < 60) {
      setProbeTarget("effortless_mastery");
      setProbeShown(true);
      setProbeEditing(false);
      goTo("probe", "probe_q2");
      return;
    }
    goTo("s15", "s15_phone_gate");
  };

  const advanceQuestion = () => {
    const q = QUESTIONS[qIdx];
    track(`q${qIdx + 1}_${q.key}`);
    beaconPartialAnswer(q.key);
    if (qIdx === QUESTIONS.length - 1) { afterQ6(); return; }
    setQIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const skipQ4 = () => {
    setQ4Skipped(true);
    setAnswers((a) => ({ ...a, hard_period: "" }));
    track("q4_hard_period_skipped");
    setQIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Extraction ─────────────────────────────────────────────────────────────
  // dest="sendgate": soft-capture path — reading generates BEFORE the gate so
  // the inferred occupation can prefill it. dest="finalize": skipper path —
  // gate came first; deliver the letter email right after extraction.
  const lastExtractDest = useRef<"sendgate" | "finalize">("finalize");
  const runExtract = async (dest: "sendgate" | "finalize" = "finalize") => {
    lastExtractDest.current = dest;
    goTo("loading", "loading");
    setErrorMsg(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (previewKey) headers["x-kriah-preview"] = previewKey;
      const nm = name.trim();
      const payload: Record<string, unknown> = {
        answers,
        email: email.trim().toLowerCase(),
        name: nm,
        first_name: nm.split(" ")[0],
        marketing_consent: true,
        is_test: isTest,
        instrument_version: "v2_funnel",
        key1: stateKey,
      };
      const occ = occupation.trim();
      if (occ) payload.occupation = occ;
      const ph = phone.trim();
      if (ph) payload.phone = ph;

      const res = await fetch("/api/signal/extract", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.signal) {
        setErrorMsg(typeof data?.error === "string" ? data.error : "שגיאת רשת. נסו שוב בעוד רגע.");
        goTo("error", "extract_error");
        return;
      }
      setSignal(data.signal as SignalOutput);
      const extId = typeof data.id === "string" ? data.id : null;
      if (extId) setExtractionId(extId);
      if (data.v2_ending === "concierge" || data.v2_ending === "hive" ||
          data.v2_ending === "pre_revenue" || data.v2_ending === "crisis_soft") {
        setEnding(data.v2_ending);
      }
      // Change 3: the engine's inferred occupation prefills the send gate
      // (confirmation, not data entry). Never overwrites what the user typed.
      const inferredOcc = (data.signal as SignalOutput)?.occupation;
      if (inferredOcc && !occupation.trim()) setOccupation(inferredOcc);

      if (dest === "sendgate") {
        goTo("sendgate", "sendgate");
      } else {
        if (extId) await finalizeAndSend(extId);
        goTo("s16", "s16_full_reading");
      }
    } catch {
      setErrorMsg("שגיאת רשת. נסו שוב בעוד רגע.");
      goTo("error", "extract_error");
    }
  };

  const submitPhoneGate = (withPhone: boolean) => {
    if (withPhone) {
      const ph = phone.trim();
      if (ph && !/^[0-9+\-\s()]{9,20}$/.test(ph)) {
        setPhoneErr("מספר טלפון לא תקין");
        return;
      }
    } else {
      setPhone("");
    }
    setPhoneErr(null);
    // Soft-captured leads have an email → the reading can generate now, and
    // the send gate opens with the inferred occupation prefilled. Skippers
    // see the gate first; extraction runs on submit.
    if (softCaptured && email.trim()) {
      void runExtract("sendgate");
    } else {
      goTo("sendgate", "sendgate");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!ready) {
    return <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg }} />;
  }

  const cell =
    stateKey && blocker
      ? (MATRIX[`${stateKey}_${blocker}`] ?? FALLBACK_CELL)
      : FALLBACK_CELL;

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
        padding: "40px 20px 80px",
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
          background: "radial-gradient(ellipse at center, rgba(232,185,74,0.07), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 620, position: "relative", zIndex: 1 }}>

        {/* ── S2 · business state ── */}
        {screen === "s2" && (
          <Card>
            {/* Landing framing — compact, above the first question. The v1
                lesson: a blocking intro screen lost ~33% before Q1; the
                promise lives here instead. */}
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.22em", color: C.goldMid, marginBottom: 12 }}>
                <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
              </div>
              <h1 style={{ fontSize: 27, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.3 }}>
                השיווק לא עובד?
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.fg, opacity: 0.92, margin: "0 0 8px" }}>
                עוד סרטון, עוד פוסט, עוד שיטה. כשאין תשובה ברורה לשאלה למה דווקא אתם, שום תוכן לא יחזיק.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.fg, opacity: 0.92, margin: "0 0 8px" }}>
                לזה יש פתרון, והוא לא עוד תוכן. בדקות הקרובות מגיעים יחד לשורש: <b style={{ color: C.gold }}>הסיבה שלקוחות בוחרים דווקא בכם.</b> ברגע שהיא ברורה, השיווק מפסיק להילחם, והלקוחות הנכונים מזהים אתכם לבד.
              </p>
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.muted, margin: 0 }}>
                בסוף הדרך הקצרה הזאת יש לכם את הבסיס שממנו נגזר כל השיווק: המסר, התוכן, והסיבה שפונים דווקא אליכם. מתחילים בשלוש שאלות. חינם.
              </p>
              <div style={{ borderTop: `1px solid ${C.line}`, margin: "22px auto 0", width: 56 }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", lineHeight: 1.35 }}>
              איפה העסק עומד היום?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {STATE_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.key}
                  selected={stateKey === opt.key}
                  onClick={() => { setStateKey(opt.key); goTo("s3", "s3_blocker"); }}
                >
                  {opt.label}
                </ChoiceButton>
              ))}
            </div>
          </Card>
        )}

        {/* ── S3 · blocker ── */}
        {screen === "s3" && (
          <Card>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 22px", lineHeight: 1.35 }}>
              מה הכי עוצר אתכם עכשיו?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {BLOCKER_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.key}
                  selected={blocker === opt.key}
                  onClick={() => { setBlocker(opt.key); goTo("s4", "s4_change"); }}
                >
                  {opt.label}
                </ChoiceButton>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <QuietLink onClick={() => setScreen("s2")}>← חזרה</QuietLink>
            </div>
          </Card>
        )}

        {/* ── S4 · short free text ── */}
        {screen === "s4" && (
          <Card>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 22px", lineHeight: 1.35 }}>
              מה הכי חשוב שישתנה אצלכם בחודשיים הקרובים?
            </h2>
            <textarea
              value={changeWish}
              onChange={(e) => setChangeWish(e.target.value)}
              rows={3}
              style={textareaStyle(90)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <QuietLink onClick={() => setScreen("s3")}>← חזרה</QuietLink>
              <GoldButton
                disabled={changeWish.trim().length < 2}
                onClick={() => goTo("s6", "s6_reading")}
              >
                להמשיך
              </GoldButton>
            </div>
          </Card>
        )}

        {/* ── S6 · the initial reading (before the email gate — deliberate inversion) ── */}
        {screen === "s6" && (
          <Card>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 22px", lineHeight: 1.3, color: C.gold }}>
              התמונה שלכם
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.8, margin: "0 0 22px", color: C.fg }}>
              {cell}
            </p>
            <p style={{
              fontSize: 14.5, lineHeight: 1.7, color: C.muted, margin: "0 0 28px",
              paddingTop: 18, borderTop: `1px solid ${C.line}`,
            }}>
              {LIMITATION_LINE}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <QuietLink onClick={() => setScreen("s4")}>← חזרה</QuietLink>
              <GoldButton onClick={() => goTo("s7", "s7_fork")}>להמשיך לפתרון ←</GoldButton>
            </div>
          </Card>
        )}

        {/* ── Send gate · before the letter (the gated asset is the letter) ── */}
        {screen === "sendgate" && (
          <Card>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.45 }}>
              האות האישי שלכם מוכן. לאן לשלוח אותו?
            </h2>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
              נראה לכם אותו כאן, וגם נשלח למייל כדי שיישאר איתכם.
            </p>
            {gateErr && (
              <div role="alert" style={{ marginBottom: 16, color: "#FF8888", fontSize: 14 }}>{gateErr}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label htmlFor="kriah-name" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
                  שם פרטי
                </label>
                <input
                  id="kriah-name"
                  type="text"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle()}
                />
              </div>
              <div>
                <label htmlFor="kriah-email" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
                  אימייל
                </label>
                <input
                  id="kriah-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...inputStyle(), textAlign: "left" }}
                />
              </div>
              <div>
                <label htmlFor="kriah-occupation" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
                  תחום עיסוק (לא חובה)
                </label>
                <input
                  id="kriah-occupation"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  style={inputStyle()}
                />
              </div>
              {!softCaptured && (
                <ConsentCheckbox
                  checked={consent}
                  onChange={(v) => { setConsent(v); if (v) setConsentErr(false); }}
                  error={consentErr}
                  dark
                />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <QuietLink onClick={() => setScreen("s15")}>← חזרה</QuietLink>
                <GoldButton onClick={() => void submitSendGate()} disabled={finalizing}>
                  {finalizing ? "שולחים..." : "שלחו לי את האות ←"}
                </GoldButton>
              </div>
            </div>
          </Card>
        )}

        {/* ── S7 · the fork ── */}
        {screen === "s7" && (
          <Card>
            <h2 style={{ fontSize: 23, fontWeight: 800, margin: "0 0 14px", lineHeight: 1.4 }}>
              {blocker ? S7_CALLBACK[blocker] : S7_CALLBACK.message}
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 16px", color: C.fg, opacity: 0.92 }}>
              שלוש תשובות, וכבר יש תמונה. אבל בואו נגיד את האמת: תמונה של הבעיה היא עדיין לא פתרון. בשביל פתרון צריך להגיע לשורש שלה.
            </p>
            <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 16px", color: C.fg, opacity: 0.92 }}>
              והשורש הוא שאלה אחת שרוב בעלי העסקים לא מצליחים לענות עליה במשפט: <b>למה שלקוח יבחר דווקא בכם?</b> לא כי אין תשובה. היא קיימת. הלקוחות הטובים שלכם מרגישים אותה בכל פעם שהם פוגשים אתכם. היא פשוט אף פעם לא נוסחה במילים. <b style={{ color: C.gold }}>לתשובה הזאת, כשהיא סוף סוף כתובה כך שאפשר לעבוד איתה, אנחנו קוראים האות שלכם.</b>
            </p>
            <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 16px", color: C.fg, opacity: 0.92 }}>
              כל השוק ינסה לפתור לכם את זה עם עוד תוכן: רעיונות להוקים, טכניקות צילום, נוסחאות. זה לא עובד, כי תוכן בלי בידול נשמע כמו כולם. אבל כשהאות ביד, כל מה שהיום נתקע מתחיל להסתדר סביבו: <b style={{ color: C.gold }}>יודעים מה להגיד בכל סרטון בלי להמציא מאפס, המסר נשמע אחד בכל מקום, והפניות מגיעות מאנשים שכבר יודעים למה דווקא אתם.</b>
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, margin: "0 0 18px", color: C.fg }}>
              ולמה עכשיו? כי שלוש התשובות שנתתם אמרו לנו איפה העסק עומד. מה שהן לא יכולות להגיד זה מי אתם, והאות נמצא בדיוק שם. בשביל זה יש עוד שש שאלות פתוחות. לא מבחן ולא טופס: המקום שבו האות שלכם כבר כתוב, במילים שלכם. <b>הן דורשות כנות, לא זמן.</b>
            </p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <GoldButton onClick={() => goTo("s8", "s8_bridge")}>למצוא את האות שלי ←</GoldButton>
              <QuietLink onClick={() => goTo("exit", "exit")}>
                אפשר לעצור כאן
              </QuietLink>
              <QuietLink onClick={() => setScreen("s6")}>← חזרה</QuietLink>
            </div>
          </Card>
        )}

        {/* ── S8 · bridge + soft capture (change 2) ── */}
        {screen === "s8" && (
          <Card>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.4, textAlign: "center" }}>
              עד כאן שאלנו על העסק. עכשיו זה עובר אליכם.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: C.muted, margin: "0 0 26px", textAlign: "center" }}>
              שש שאלות. אין תשובות נכונות. כל מה שתכתבו כאן הופך לבסיס שממנו ייגזרו המסר, התוכן והפניות שלכם.
            </p>
            {!softCaptured && (
              <div style={{ marginBottom: 22 }}>
                <label htmlFor="kriah-soft-email" style={{ display: "block", fontSize: 14.5, color: C.fg, marginBottom: 8, textAlign: "center" }}>
                  לפני שמתחילים, לאן לשמור את ההתקדמות שלכם?
                </label>
                {gateErr && (
                  <div role="alert" style={{ marginBottom: 10, color: "#FF8888", fontSize: 13, textAlign: "center" }}>{gateErr}</div>
                )}
                <input
                  id="kriah-soft-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...inputStyle(), textAlign: "left" }}
                />
                <p style={{ fontSize: 11.5, color: C.muted, margin: "8px 0 0", textAlign: "center", opacity: 0.8 }}>
                  בהזנת המייל אתם מאשרים קבלת עדכונים. אפשר להסיר הרשמה בכל רגע.
                </p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <GoldButton onClick={() => {
                if (softCaptured || !email.trim()) { startQuestions(); return; }
                submitSoftCapture();
              }}>
                להמשיך
              </GoldButton>
              {!softCaptured && email.trim().length === 0 && (
                <QuietLink onClick={startQuestions}>להמשיך בלי</QuietLink>
              )}
              <QuietLink onClick={() => setScreen("s7")}>← חזרה</QuietLink>
            </div>
          </Card>
        )}

        {/* ── Q1-Q6 ── */}
        {screen === "q" && (() => {
          const q = QUESTIONS[qIdx];
          const isQ4 = q.key === "hard_period";
          const isQ5 = q.key === "what_helped";
          const label = isQ5 && q4Skipped ? Q5_CONDITIONAL_LABEL : q.label;
          const value = answers[q.key] ?? "";
          const len = value.trim().length;
          const canAdvance = isQ4 ? true : len >= MIN_CHARS;
          return (
            <Card>
              {/* Progress */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginBottom: 24, overflow: "hidden" }}>
                <div style={{
                  width: `${((qIdx + 1) / QUESTIONS.length) * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, #9E7C3A, ${C.gold})`,
                  transition: "width 0.35s ease",
                }} />
              </div>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 10 }}>
                שאלה {qIdx + 1} מתוך {QUESTIONS.length}
              </div>

              {isQ4 && (
                <p style={{ fontSize: 15, color: C.goldMid, margin: "0 0 12px", lineHeight: 1.6 }}>
                  {Q4_BREATH_LINE}
                </p>
              )}

              <h2 style={{ fontSize: 23, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.4 }}>
                {label}
              </h2>
              <p style={{ color: C.muted, fontSize: 15, margin: q.extraHint ? "0 0 6px" : "0 0 20px", lineHeight: 1.6 }}>
                {q.hint}
              </p>
              {q.extraHint && (
                <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 20px", lineHeight: 1.6, opacity: 0.8 }}>
                  {q.extraHint}
                </p>
              )}

              <textarea
                value={value}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                rows={6}
                placeholder="🎙️ אפשר פשוט לדבר: לחצו על המיקרופון במקלדת"
                style={textareaStyle(150)}
              />

              {!isQ4 && len < MIN_CHARS && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: C.muted }}>
                  <span>{`עוד ${MIN_CHARS - len} תווים לפחות`}</span>
                  <span>{len} / {MIN_CHARS}+</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, gap: 12 }}>
                <button
                  onClick={() => {
                    if (qIdx === 0) { setScreen("s8"); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
                    setQIdx((i) => i - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    background: "transparent",
                    color: C.muted,
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: "12px 22px",
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  חזרה
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {isQ4 && (
                    <QuietLink onClick={skipQ4}>אפשר לדלג</QuietLink>
                  )}
                  <GoldButton disabled={!canAdvance} onClick={advanceQuestion} small>
                    הלאה
                  </GoldButton>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* ── Probe (once max; Q6 primary, Q2 fallback, never Q4) ── */}
        {screen === "probe" && probeTarget && (
          <Card>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: C.gold, fontWeight: 600, margin: "0 0 22px" }}>
              {PROBE_COPY[probeTarget]}
            </p>

            {probeEditing ? (
              <>
                <textarea
                  value={answers[probeTarget] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [probeTarget]: e.target.value }))}
                  rows={5}
                  style={textareaStyle(120)}
                />
                <div style={{ textAlign: "left", marginTop: 20 }}>
                  <GoldButton onClick={() => goTo("s15", "s15_phone_gate")}>להמשיך</GoldButton>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <GoldButton onClick={() => setProbeEditing(true)}>לדייק את התשובה</GoldButton>
                <QuietLink onClick={() => goTo("s15", "s15_phone_gate")}>להשאיר כמו שהיא</QuietLink>
              </div>
            )}
          </Card>
        )}

        {/* ── S15 · phone gate ── */}
        {screen === "s15" && (
          <Card>
            <h2 style={{ fontSize: 23, fontWeight: 800, margin: "0 0 14px", lineHeight: 1.4 }}>
              זהו. החומר נאסף, והאות שלכם נבנה ממנו ממש עכשיו.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: C.fg, opacity: 0.9, margin: "0 0 18px" }}>
              ממנו נגזר ההמשך: המסר, כיווני התוכן, והדרך שהלקוחות הנכונים מוצאים אתכם. שלב אחרי שלב, ואנחנו איתכם לכל אורכה.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.muted, margin: "0 0 24px" }}>
              פרט אחד לבחירתכם: אם ממה שכתבתם יעלה משהו שהדר תרצה להרחיב עליו אישית, בשיחה ולא במייל, בלי מספר פשוט לא נוכל לקיים את זה.
            </p>
            <label htmlFor="kriah-phone" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
              טלפון (רשות)
            </label>
            <input
              id="kriah-phone"
              type="tel"
              dir="ltr"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ ...inputStyle(), textAlign: "left" }}
            />
            {phoneErr && (
              <p role="alert" style={{ marginTop: 8, color: "#FF8888", fontSize: 13 }}>{phoneErr}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 28 }}>
              <GoldButton onClick={() => submitPhoneGate(true)}>המשיכו</GoldButton>
              <QuietLink onClick={() => submitPhoneGate(false)}>להמשיך בלי טלפון</QuietLink>
              <QuietLink onClick={() => { setQIdx(QUESTIONS.length - 1); setScreen("q"); }}>← חזרה לשאלות</QuietLink>
            </div>
          </Card>
        )}

        {/* ── Loading ── */}
        {screen === "loading" && (
          <Card center>
            <div
              style={{
                width: 42, height: 42, margin: "0 auto 22px",
                border: `3px solid ${C.line}`,
                borderTopColor: C.gold,
                borderRadius: "50%",
                animation: "kriah-spin 1s linear infinite",
              }}
            />
            <p style={{ fontSize: 18, fontWeight: 600, color: C.fg, margin: 0, lineHeight: 1.6 }}>
              קוראים את מה שכתבתם...
            </p>
            <style>{`@keyframes kriah-spin { to { transform: rotate(360deg); } }`}</style>
          </Card>
        )}

        {/* ── Error + retry ── */}
        {screen === "error" && (
          <Card center>
            <p style={{ fontSize: 16, color: "#FF8888", margin: "0 0 22px", lineHeight: 1.6 }}>
              {errorMsg ?? "משהו השתבש. נסו שוב."}
            </p>
            <GoldButton onClick={() => void runExtract(lastExtractDest.current)}>לנסות שוב</GoldButton>
          </Card>
        )}

        {/* ── S16 · the full reading + reminder + seam + ending B ── */}
        {screen === "s16" && signal && (
          <FullReading
            signal={signal}
            answers={answers}
            track={track}
            extractionId={extractionId}
            firstName={name.split(" ")[0] ?? ""}
            ending={ending}
          />
        )}

        {/* ── Exit screen (quiet exit from S7) ── */}
        {screen === "exit" && (
          <Card center>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 18px", lineHeight: 1.4 }}>
              {softCaptured ? "ההתקדמות שלכם שמורה" : "אפשר לחזור מתי שתרצו"}
            </h2>
            <p style={{ fontSize: 17, color: C.gold, fontWeight: 600, margin: 0 }}>
              תהיו טובים.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── S16 — the full reading, paragraph fade-in ────────────────────────────────

function FullReading({
  signal,
  answers,
  track,
  extractionId,
  firstName,
  ending,
}: {
  signal:       SignalOutput;
  answers:      Record<string, string>;
  track:        (step: string) => void;
  extractionId: string | null;
  firstName:    string;
  ending:       "concierge" | "hive" | "pre_revenue" | "crisis_soft";
}) {
  // P1 quote priority per the deck: Q6 (message_to_past), then Q3 (gratitude_mirror).
  const quoteSource =
    (answers["message_to_past"] ?? "").trim() ||
    (answers["gratitude_mirror"] ?? "").trim();

  // Staggered paragraph reveal (~700ms apart): P1..P4 + signature = 5 beats,
  // then the blocks below the reading frame.
  const TOTAL_BEATS = 7;
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    if (visible >= TOTAL_BEATS) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 700);
    return () => clearTimeout(t);
  }, [visible]);

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const share = async () => {
    track("s16_share_clicked");
    const text = `"${signal.signal}"`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      throw new Error("no navigator.share");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareFeedback("המשפט הועתק");
        setTimeout(() => setShareFeedback(null), 2500);
      } catch {}
    }
  };

  const saveReminder = () => {
    track("s16_save_reminder_clicked");
    // Wave 1 stub — the rendered reminder card ships in a later wave.
    alert("התזכורת כבר אצלכם במייל.");
  };

  const beat = (i: number): React.CSSProperties => ({
    opacity: visible > i ? 1 : 0,
    transition: "opacity 0.7s ease",
  });

  return (
    <div>
      {/* The reading frame */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: 20,
          padding: "36px 28px",
        }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 26px", lineHeight: 1.3, color: C.gold }}>
          האות שלכם
        </h2>

        {/* P1 — opening with the verbatim quote */}
        <div style={beat(0)}>
          {quoteSource && (
            <blockquote
              style={{
                margin: "0 0 14px",
                padding: "14px 18px",
                borderRight: `3px solid ${C.goldMid}`,
                background: C.cardSoft,
                borderRadius: 10,
                fontSize: 17,
                lineHeight: 1.75,
                color: C.fg,
              }}
            >
              &quot;{quoteSource}&quot;
            </blockquote>
          )}
          <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 26px", color: C.fg }}>
            במילים האלה בדיוק. לא שינינו אות אחת. כל מה שיש לנו להגיד מתחיל שם.
          </p>
        </div>

        {/* P2 — the reflection (warm_note from the engine) */}
        <p style={{ ...beat(1), fontSize: 16.5, lineHeight: 1.8, margin: "0 0 26px", color: C.fg }}>
          {signal.warm_note}
        </p>

        {/* P3 — the sentence + defining "האות" */}
        <div style={beat(2)}>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
            מתוך כל מה שכתבתם עולה משפט אחד:
          </p>
          <p style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.7, margin: "0 0 14px", color: C.gold }}>
            &quot;{signal.signal}&quot;
          </p>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 26px", color: C.fg }}>
            למשפט כזה אנחנו קוראים האות. זה הדבר שאנשים כבר מרגישים כשהם פוגשים אתכם, עוד לפני שאמרתם מילה על העסק. הוא לא נכתב עכשיו. הוא רק נאמר עכשיו בפעם הראשונה בקול. ככה נקראו כאן יותר מ-3,500 עסקים, בשיטה שהדר בנתה, וזה תמיד עובד באותו כיוון: המשפט לא מגיע מבחוץ. הוא מחכה בפנים.
          </p>
        </div>

        {/* P4 — what now */}
        <p style={{ ...beat(3), fontSize: 16.5, lineHeight: 1.8, margin: "0 0 30px", color: C.fg }}>
          תנו לו לחזור. משפט שחוזר מפסיק להישמע כמו רעיון, ומתחיל להישמע כמוכם.
        </p>

        {/* Signature — the brand stamp */}
        <div style={beat(4)}>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: 0, color: C.fg }}>תהיו טובים.</p>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: "4px 0 0", fontWeight: 800, color: C.fg }}>
            צוות beegood
          </p>
        </div>
      </div>

      {/* Reminder block — system voice, visually separated from the reading */}
      <div
        style={{
          ...beat(5),
          marginTop: 26,
          background: C.cardSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: "24px 22px",
        }}
      >
        <p style={{ fontSize: 16.5, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.6, color: C.fg }}>
          המשפט הזה מחזיק גם מחוץ למסך הזה.
        </p>
        <p style={{ fontSize: 15.5, lineHeight: 1.7, margin: "0 0 20px", color: C.fg, opacity: 0.9 }}>
          הכנו לכם אותו כתזכורת: שמרו אותה איפה שתראו אותה, ואם יש מישהו שיזהה אתכם בה, שלחו לו אותה.
        </p>
        {extractionId ? (
          <>
            {/* The production share-card (1080×1080, AI background, 12 color
                worlds) — same asset v1 ships. v2 reuses the pipeline verbatim. */}
            <div
              style={{
                border: "1.5px solid rgba(232,185,74,0.5)",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 16,
                boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/signal/${extractionId}/share-card`}
                alt="התזכורת שלכם"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </div>
            <ShareButtons extractionId={extractionId} firstName={firstName} />
          </>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <GoldButton small onClick={saveReminder}>לשמור את התזכורת</GoldButton>
          </div>
        )}
      </div>

      {/* Seam line + ending B (wave 1: always B — the clean gift, no price) */}
      <div style={beat(6)}>
        <p style={{
          textAlign: "center", fontSize: 17, fontWeight: 800, color: C.gold,
          margin: "34px 0 26px", letterSpacing: 0.2,
        }}>
          זה שלכם. בלי תנאי.
        </p>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 20,
            padding: "30px 26px",
          }}
        >
          {ending === "concierge" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                יש אותות שלא נכנסים לתבנית. את שלכם קראנו, והוא אחד מהם.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                אות כזה הדר קוראת בעצמה. לא מערכת, לא צוות. היא.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                היא תיצור איתכם קשר אישית בתוך יום עסקים.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 20px", color: C.fg }}>
                אין פה כפתור וגם לא טופס. רק להשאיר את זה פתוח.
              </p>
            </>
          )}
          {ending === "hive" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                קיבלתם עכשיו את האות שלכם. הוא שלכם, בלי תמורה.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                המשפט לא הולך לשום מקום. מה שמתפוגג הוא ההד שלו: אות בלי חזרה נשכח. תנו לו שבוע של חזרות, ותראו מה הוא עושה.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 20px", color: C.fg }}>
                האות והתזכורת כבר אצלכם במייל. בעוד יום-יומיים נשלח לשם גם את הצעד הבא, למי שירצה להמשיך.
              </p>
            </>
          )}
          {ending === "pre_revenue" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                אתם עוד בהתחלה, וזה בדיוק הרגע לקרוא את האות, לפני שהוא נקבר תחת עוד ועוד תוכן.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                קחו את מה שקיבלתם, נסחו מזה משפט אחד, ותנו לו לחזור. זה לבד יזיז אתכם קדימה, בלי לשלם שקל.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 20px", color: C.fg }}>
                בעוד כמה חודשים אפשר לחזור ולקרוא שוב. עסק משתנה, והאות מתחדד איתו.
              </p>
            </>
          )}
          {ending === "crisis_soft" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 14px", color: C.fg }}>
                האות שלכם אצלכם, והוא שלכם בלי שום תנאי.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.8, margin: "0 0 20px", color: C.fg }}>
                נראה שאתם בתקופה שמבקשת קודם כול נשימה, לא תוכנית. קחו את הזמן. אם תרצו מישהו לדבר איתו, הדר כאן, בקצב שלכם.
              </p>
            </>
          )}
          <p style={{ fontSize: 16.5, fontWeight: 700, margin: 0, color: C.gold }}>
            תהיו טובים.
          </p>
        </div>

        {/* Continuation — the ending is a gift, not a dead end. The hive lane
            gets a soft, price-less bridge for hot-now intent (the full offer
            still arrives by the day-2 email); everyone gets a way home. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 30 }}>
          {ending === "hive" && (
            <>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.muted, margin: 0, textAlign: "center", maxWidth: 420 }}>
                האות הוא הבסיס. מכאן בונים עליו את כל השאר: המסר, התוכן, והדרך שהלקוחות מגיעים.
              </p>
              <a
                href="/signal-hive"
                style={{
                  display: "inline-block", color: C.gold, fontWeight: 700, fontSize: 15.5,
                  border: `1.5px solid rgba(232,185,74,0.5)`, borderRadius: 999,
                  padding: "12px 34px", textDecoration: "none",
                }}
              >
                רוצים להמשיך כבר עכשיו? הצעד הבא ←
              </a>
            </>
          )}
          <a href="/" style={{ color: C.muted, fontSize: 13.5, textDecoration: "underline" }}>
            לעמוד הבית ←
          </a>
        </div>
      </div>
    </div>
  );
}

// ── UI primitives ────────────────────────────────────────────────────────────

function Card({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        padding: "34px 26px",
        ...(center ? { textAlign: "center" as const } : {}),
      }}
    >
      {children}
    </div>
  );
}

function GoldButton({
  children,
  onClick,
  disabled = false,
  small = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "rgba(232,185,74,0.18)" : GOLD_GRAD,
        color: disabled ? "rgba(237,233,225,0.4)" : "#2a1d05",
        fontWeight: 700,
        fontSize: small ? 15 : 16,
        border: "none",
        borderRadius: small ? 12 : 999,
        padding: small ? "12px 28px" : "14px 44px",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : GOLD_SHADOW,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function QuietLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: C.muted,
        fontSize: 14,
        textDecoration: "underline",
        textUnderlineOffset: 4,
        cursor: "pointer",
        padding: 4,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function ChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      style={{
        width: "100%",
        textAlign: "right",
        background: selected ? "rgba(232,185,74,0.1)" : C.cardSoft,
        color: C.fg,
        border: selected ? `1px solid ${C.gold}` : `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "18px 18px",
        fontSize: 16.5,
        lineHeight: 1.5,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.15s ease, background 0.15s ease",
        minHeight: 58,
      }}
    >
      {children}
    </button>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: C.cardSoft,
    color: C.fg,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 16,
    outline: "none",
    fontFamily: "inherit",
  };
}

function textareaStyle(minHeight: number): React.CSSProperties {
  return {
    width: "100%",
    background: C.cardSoft,
    color: C.fg,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: "inherit",
    resize: "vertical",
    minHeight,
    outline: "none",
  };
}
