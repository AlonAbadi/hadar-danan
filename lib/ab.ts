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
