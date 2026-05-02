/**
 * Single source of truth for product config, prices, and scheduled dates.
 * All product pages import from here — never hardcode prices or dates.
 */

export const CHALLENGE_DATES = ["2026-04-16", "2026-05-20", "2026-06-11"] as const;

/** Returns the first date in the array that hasn't passed yet (YYYY-MM-DD). */
export function getNextDate(dates: readonly string[]): string | null {
  const today = new Date().toISOString().split("T")[0];
  return dates.find((d) => d >= today) ?? null;
}

// ── Workshop dates — auto-computed: last Thursday of each month ───────────

/** Returns YYYY-MM-DD of the last Thursday of the given month. */
function lastThursdayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0); // day 0 of next month = last day of this month
  const daysBack = (lastDay.getDay() + 3) % 7; // days to subtract to reach Thursday
  lastDay.setDate(lastDay.getDate() - daysBack);
  return lastDay.toISOString().slice(0, 10);
}

/** Returns the next `count` workshop dates (last Thursday of each month) from today. */
export function getWorkshopDates(count = 12): string[] {
  const today = new Date().toISOString().slice(0, 10);
  const dates: string[] = [];
  const now = new Date();
  let year  = now.getFullYear();
  let month = now.getMonth() + 1; // 1–12

  while (dates.length < count) {
    const date = lastThursdayOfMonth(year, month);
    if (date >= today) dates.push(date);
    month++;
    if (month > 12) { month = 1; year++; }
  }
  return dates;
}

/** Returns the next upcoming workshop date, or null if none computed. */
export function getNextWorkshopDate(): string | null {
  return getWorkshopDates(1)[0] ?? null;
}

/** Backward-compat: static-looking export that is actually dynamic. */
export const WORKSHOP_DATES = getWorkshopDates(12);

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
