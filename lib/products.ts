/**
 * Single source of truth for product config, prices, and scheduled dates.
 * All product pages import from here — never hardcode prices or dates.
 */

export const CHALLENGE_DATES = ["2026-04-16", "2026-05-14", "2026-06-11"] as const;
export const WORKSHOP_DATES  = ["2026-04-30", "2026-05-28", "2026-06-25"] as const;

/** Returns the first date in the array that hasn't passed yet (YYYY-MM-DD). */
export function getNextDate(dates: readonly string[]): string | null {
  const today = new Date().toISOString().split("T")[0];
  return dates.find((d) => d >= today) ?? null;
}

/** "2026-04-16" → "16.4" */
export function formatShort(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(day)}.${Number(m)}`;
}

/** "2026-04-16" → "16 באפריל" */
export function formatHebrew(d: string): string {
  const MONTHS = ["", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
                       "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  const [, m, day] = d.split("-");
  return `${Number(day)} ב${MONTHS[Number(m)]}`;
}

export const PRODUCT_MAP = {
  challenge_197:  { name: "צ׳אלנג׳ 7 הימים",   price: 197   },
  workshop_1080:  { name: "סדנה יום אחד",        price: 1080  },
  course_1800:    { name: "קורס דיגיטלי",         price: 1800  },
  strategy_4000:  { name: "פגישת אסטרטגיה",      price: 4000  },
  premium_14000:  { name: "יום צילום פרמיום",    price: 14000 },
} as const;

export type ProductKey = keyof typeof PRODUCT_MAP;
