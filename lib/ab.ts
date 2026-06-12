export type AbVariant = "A" | "B" | "C";

export interface VariantContent {
  headline: string;
  description: string;
  cta: string;
}

// Homepage hero A/B test: "landing_headline"
// Phase 3 (2026-06-12): Full rewrite of all three variants to speak the
// Signal-engine voice. Hero now leads to /signal (TrueSignal© engine).
// Three distinct angles being tested as a coherent stack (headline +
// description + CTA together):
//   A — anti-content rebellion: "די לייצר תוכן. תתחיל לשדר את עצמך."
//       Action verb, contrarian, shortest. For the exhausted owner who
//       has tried every content course.
//   B — identity-first question: "מה רק אתה יכול לתת?"
//       Soft, reflective, aligned with brand line. Pushes inward
//       reflection before a click.
//   C — diagnosis + permission: "זה לא בגלל שאתה לא טוב מספיק."
//       Longest, most narrative. Externalizes blame from the customer
//       to the marketing system they were taught.
// After deploying, reset counters in Supabase:
//   UPDATE experiments SET visitors_a=0, visitors_b=0, conversions_a=0,
//   conversions_b=0 WHERE name='landing_headline';
export const AB_CONTENT: Record<AbVariant, VariantContent> = {
  A: {
    headline: "די לייצר תוכן.\nתתחילו לשדר את עצמכם.",
    description:
      "מנוע האות של שיטת TrueSignal© מחלץ ב-5 שאלות את הבידול האמיתי שלכם - לא מה שאתם מוכרים, אלא מה שרק אתם יכולים לתת.",
    cta: "לחלץ את האות שלכם ←",
  },
  B: {
    headline: "השאלה היא לא מה אתם מוכרים.\nהשאלה היא מה רק אתם יכולים לתת.",
    description:
      "מנוע האות שואל אתכם חמש שאלות שאף יועץ לא יעז לשאול - ומחזיר לכם את האות הקנייני שלכם. החלק שאחרים מנסים לחקות אבל לא מצליחים.",
    cta: "מה רק אתם יכולים לתת? ←",
  },
  C: {
    headline: "הקורסים, היועצים, התוכן -\nובכל זאת הלקוחות לא מגיעים.\nזה לא בגלל שאתם לא טובים מספיק.",
    description:
      "זה בגלל שהאות שלכם עוד לא ברור. חמש שאלות עם מנוע האות מחזירות לכם את הבידול שעצרו מכם כשניסו ללמד אתכם לדבר כמו כולם.",
    cta: "להתחיל מהאות שלכם ←",
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
