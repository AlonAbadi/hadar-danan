export type AbVariant = "A" | "B" | "C";

export interface VariantContent {
  headline: string;
  description: string;
  cta: string;
}

// Homepage hero A/B test: "landing_headline"
// Phase 2 (2026-06-12): Hero CTA now leads to /signal (TrueSignal© engine),
// not /quiz. CTA copy on all three variants pivoted to Signal-extraction
// framing. Three framings being tested:
//   A — action ("חלץ"):     proprietary verb, claims a tangible output
//   B — identity (question): self-question, deeper hook
//   C — process ("התחל"):    soft, consistent with /hive CTA
// Headlines + descriptions kept as-is — they still describe the broader
// positioning. If conversions stay flat we'll rewrite them next.
// After deploying, reset counters in Supabase:
//   UPDATE experiments SET visitors_a=0, visitors_b=0, conversions_a=0,
//   conversions_b=0 WHERE name='landing_headline';
export const AB_CONTENT: Record<AbVariant, VariantContent> = {
  A: {
    headline: "אתה יכול למכור רק את מה שאתה.\nהשאלה אם השיווק שלך משדר את זה.",
    description:
      "אנחנו מזהים את הפער - והופכים אותו לאסטרטגיה ולתוכן שמביא תוצאות ביום צילום אחד.",
    cta: "לחלץ את האות שלך ←",
  },
  B: {
    headline: "לא כל תוכן עובד.\nרק תוכן שנבנה נכון.",
    description:
      "אנחנו מתחילים באסטרטגיה - ומסיימים ביום צילום שמייצר תוכן שבאמת עובד.",
    cta: "מה רק אתה יכול לתת? ←",
  },
  C: {
    headline: "המצלמה דולקת. התוכן עולה. הלקוחות לא מגיעים.\nיש סיבה לזה. ואנחנו יודעים מה היא.",
    description:
      "3,500+ עסקים עברו אבחון מדויק עם שיטת TrueSignal© וגילו בדיוק מה עצר אותם. 6 שאלות. 2 דקות. המלצה אישית.",
    cta: "להתחיל מהאות שלך ←",
  },
};

export function parseVariant(value: string | undefined): AbVariant {
  if (value === "A" || value === "B" || value === "C") return value;
  return "A";
}

// ── Quiz Q1 A/B test: "quiz_q1_framing" — COMPLETED ──────────────
// Winner: variant B (10.18% CVR vs 6.99%, +44.6% uplift, 97% confidence).
// Variant B is now hard-coded as the Q1 default in QuizClient.tsx.
// These constants are kept ONLY so /admin/abtesting can render the
// historical winner card with the original variant labels.
export const QUIZ_Q1_AB: Record<AbVariant, { title: string; subtitle: string }> = {
  A: {
    title: "איפה העסק שלך עכשיו?",
    subtitle: "ענה בכנות - זה יעזור לנו למצוא את הצעד הנכון",
  },
  B: {
    title: "מה עוצר אותך מלצמוח בשיווק?",
    subtitle: "6 שאלות. 2 דקות. תשובה מדויקת לעסק שלך.",
  },
  C: {
    title: "איפה העסק שלך עכשיו?",
    subtitle: "ענה בכנות - זה יעזור לנו למצוא את הצעד הנכון",
  },
};

export const QUIZ_Q1_EXPERIMENT = "quiz_q1_framing";

// ── Challenge hero A/B test: video vs designed text block ──────────
// Variant A (control): current Vimeo VSL at the top of /challenge
// Variant B (test):    designed text block in place of the video
// Primary metric (challenge_hero_format): PURCHASE of challenge_197
// Secondary metric (challenge_hero_format_checkout): CHECKOUT_STARTED for challenge_197
export const CHALLENGE_HERO_EXPERIMENT          = "challenge_hero_format";
export const CHALLENGE_HERO_CHECKOUT_EXPERIMENT = "challenge_hero_format_checkout";

export interface ChallengeHeroVariant {
  type: "video" | "text";
  // For variant A:
  vimeoId?: string;
  // For variant B:
  headline?: string;
  body?: string;
  bullets?: string[];
  quoteText?: string;
  quoteAuthor?: string;
}

export const CHALLENGE_HERO_AB: Record<AbVariant, ChallengeHeroVariant> = {
  A: {
    type: "video",
    vimeoId: "1184733084",
  },
  B: {
    type: "text",
    headline: "האתגר הוא לא סדרת הרצאות.\nהוא תוכנית פעולה יומית עם תרגול.",
    body: "",
    bullets: [
      "שיעור פתיחה מעמיק על מה השתנה בשיווק ב-2026 ומה צריך לעשות",
      "7 ימים — כל יום סוג סרטון אחר עם משימת צילום ברורה",
      "מפגש סיום חי בזום עם הדר",
    ],
    quoteText: "אתגר סופר משמעותי שהייתי בו בחיי. הצלחת להכניס בי ביטחון שעוד לא היה לי.",
    quoteAuthor: "משתתפת באתגר",
  },
  C: { type: "video", vimeoId: "1184733084" }, // C falls back to A
};
