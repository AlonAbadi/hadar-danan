export type AbVariant = "A" | "B" | "C";

export interface VariantContent {
  headline: string;
  description: string;
  cta: string;
}

// Homepage hero A/B test: "landing_headline"
// Phase 4 (2026-06-23): Reset. Single-question test — does pain framing
// or gain framing drive more clicks on the signal-engine CTA?
//   A — pain frame: "תפסיקו לנחש."
//   B — gain frame: "בהירות משנה הכל."
// Description, CTA, and visual layout are identical across both variants
// so the only testable variable is the headline. Same first-person CTA
// in both ("אני רוצה לגלות את האות שלי") — the reader narrates the click.
// After deploying, reset counters in Supabase:
//   UPDATE experiments SET visitors_a=0, visitors_b=0, conversions_a=0,
//   conversions_b=0 WHERE name='landing_headline';
export const AB_CONTENT: Record<AbVariant, VariantContent> = {
  A: {
    headline: "תפסיקו לנחש.",
    description:
      "5 שאלות, 10 דקות, האות שלכם במשפט אחד. חינם.",
    cta: "אני רוצה לגלות את האות שלי ←",
  },
  B: {
    headline: "בהירות משנה הכל.",
    description:
      "5 שאלות, 10 דקות, האות שלכם במשפט אחד. חינם.",
    cta: "אני רוצה לגלות את האות שלי ←",
  },
  // C is unused in this test but kept in the type to satisfy
  // parseVariant() — falls back to A copy if a stale cookie still hands
  // out 'C' from a previous experiment.
  C: {
    headline: "תפסיקו לנחש.",
    description:
      "5 שאלות, 10 דקות, האות שלכם במשפט אחד. חינם.",
    cta: "אני רוצה לגלות את האות שלי ←",
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

// ── Challenge hero A/B test — CONCLUDED 2026-06-19 ──────────────────
// Winner: variant B (designed text block). Final numbers:
//   A (video): 950 visitors, 8 purchases  = 0.84% CVR
//   B (text):  1,061 visitors, 20 purchases = 1.89% CVR
//   Uplift: +123.8% in favor of B, P(B>A) = 97.4%
//   Checkout-started secondary: +56.5%, P=94.7%
//
// Variant B's content is now hard-coded as CHALLENGE_HERO_WINNER below
// and rendered for all visitors on /challenge. The CHALLENGE_HERO_AB
// map is kept ONLY so /admin/abtesting can render the historical
// winner card; nothing in production reads from it anymore.
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

// The shipped default on /challenge. Same payload as CHALLENGE_HERO_AB.B
// — kept as a separate constant so production reads from a non-AB
// surface and the AB map can be deleted later without touching the page.
export const CHALLENGE_HERO_WINNER: ChallengeHeroVariant = CHALLENGE_HERO_AB.B;

// ── Challenge proof position A/B test ─────────────────────────────
// Launched 2026-06-19. After the hero-format test concluded with the
// designed text block as winner, the deepest unused asset on /challenge
// is ChallengeProofWall (10 real screenshot testimonials) — but it sits
// ~7 mobile screens deep, where only ~10-15% of visitors reach it.
//
// Variant A (control): current layout — proof wall lives below "Who".
// Variant B (test):    proof wall moves to between Problem and Solution,
//                      and a horizontal testimonial strip surfaces 3
//                      cards immediately after the hero.
//
// Primary metric: PURCHASE of challenge_197.
// Same ab_variant cookie as landing_headline — stacked-variant pattern,
// consistent with the previous challenge experiment.
export const CHALLENGE_PROOF_EXPERIMENT = "challenge_proof_position";
