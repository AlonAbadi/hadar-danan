export type AbVariant = "A" | "B" | "C";

export interface VariantContent {
  headline: string;
  description: string;
  cta: string;
}

// Homepage hero A/B test: "landing_headline"
// Variant A: contrarian / problem-focused hook (current control)
// Variant B: outcome / social-proof hook
// Variant C: camera-on / content-up / no-clients hook
export const AB_CONTENT: Record<AbVariant, VariantContent> = {
  A: {
    headline: "אתה יכול למכור רק את מה שאתה.\nהשאלה אם השיווק שלך משדר את זה.",
    description:
      "אנחנו מזהים את הפער - והופכים אותו לאסטרטגיה ולתוכן שמביא תוצאות ביום צילום אחד.",
    cta: "בדוק מה באמת חסר בשיווק שלך ←",
  },
  B: {
    headline: "לא כל תוכן עובד.\nרק תוכן שנבנה נכון.",
    description:
      "אנחנו מתחילים באסטרטגיה - ומסיימים ביום צילום שמייצר תוכן שבאמת עובד.",
    cta: "רוצה להבין מה נכון לעסק שלך? ←",
  },
  C: {
    headline: "המצלמה דולקת. התוכן עולה. הלקוחות לא מגיעים.\nיש סיבה לזה. ואנחנו יודעים מה היא.",
    description:
      "3,500+ עסקים עברו אבחון מדויק עם שיטת TrueSignal© וגילו בדיוק מה עצר אותם. 6 שאלות. 2 דקות. המלצה אישית.",
    cta: "גלה מה עוצר אותך ←",
  },
};

export function parseVariant(value: string | undefined): AbVariant {
  if (value === "A" || value === "B" || value === "C") return value;
  return "A";
}

// ── Quiz Q1 A/B test: "quiz_q1_framing" ──────────────────────────
// Reframes the first quiz question from status ("where are you?")
// to pain ("what's stopping you?") for campaign visitors who arrive
// with an existing pain. Variant C falls back to A (2-variant test).
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
