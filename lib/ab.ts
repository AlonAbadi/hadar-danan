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
    headline: "השיווק שלך לא נכשל בגלל הסרטונים",
    description:
      "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת - ולבנות מהמקום הזה שיווק שמרגיש טבעי ומביא תוצאות",
    cta: "איפה אתה נמצא עכשיו? ←",
  },
  B: {
    headline: "תוכן שמוכר מגיע מבהירות - לא מעוד סרטונים",
    description:
      "ענו על כמה שאלות קצרות ונראה לכם מה הכי נכון לכם עכשיו - התאמה אישית לפי השלב של העסק שלכם",
    cta: "גלה את הבהירות שלך ←",
  },
};

export function parseVariant(value: string | undefined): AbVariant {
  if (value === "A" || value === "B") return value;
  return "A";
}
