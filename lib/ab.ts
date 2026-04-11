export type AbVariant = "A" | "B";

export interface VariantContent {
  headline: string;
  description: string;
  cta: string;
}

// Homepage hero A/B test: "landing_headline"
// Variant A: contrarian / problem-focused hook (current control)
// Variant B: outcome / social-proof hook
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
};

export function parseVariant(value: string | undefined): AbVariant {
  if (value === "A" || value === "B") return value;
  return "A";
}
