/**
 * Single source of truth for product config, prices, and scheduled dates.
 * All product pages import from here — never hardcode prices or dates.
 */

export const CHALLENGE_DATES = ["2026-04-16", "2026-05-20", "2026-06-11"] as const;

/** Returns the first date in the array that hasn't passed yet (YYYY-MM-DD). */
function localDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function getNextDate(dates: readonly string[]): string | null {
  const today = localDateStr();
  return dates.find((d) => d >= today) ?? null;
}

// ── Workshop dates — auto-computed: last Thursday of each month ───────────

/** Returns YYYY-MM-DD of the last Thursday of the given month. */
function lastThursdayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0); // day 0 of next month = last day of this month
  const daysBack = (lastDay.getDay() + 3) % 7; // days to subtract to reach Thursday
  lastDay.setDate(lastDay.getDate() - daysBack);
  // Use local date parts — toISOString() converts to UTC and shifts the date in UTC+X timezones
  const y = lastDay.getFullYear();
  const m = String(lastDay.getMonth() + 1).padStart(2, "0");
  const d = String(lastDay.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Optional floor for the workshop schedule. Months whose last-Thursday
 * falls before this date are skipped. Set this when the team needs to
 * cancel/postpone a specific month without rewriting the whole calendar.
 *
 * Last updated 2026-06-19: skip June (25.6) and start from July (30.7.2026).
 */
const MIN_WORKSHOP_DATE = "2026-07-01";

/** Returns the next `count` workshop dates (last Thursday of each month) from today. */
export function getWorkshopDates(count = 12): string[] {
  const today = localDateStr();
  const floor = today > MIN_WORKSHOP_DATE ? today : MIN_WORKSHOP_DATE;
  const dates: string[] = [];
  const now = new Date();
  let year  = now.getFullYear();
  let month = now.getMonth() + 1; // 1–12

  // Safety stop: at most 36 months ahead so we never spin forever if floor
  // is mis-typed or count is unreachable.
  let safety = 36;
  while (dates.length < count && safety-- > 0) {
    const date = lastThursdayOfMonth(year, month);
    if (date >= floor) dates.push(date);
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

// Display-only original prices (for strikethrough/discount UI). The actual
// charged amount lives in the `price` field of PRODUCT_MAP and in Cardcom
// + Pixel/CAPI events — these constants are for product cards / nav /
// landing pages only.
export const CHALLENGE_PRICE = 197;          // actual charged
export const CHALLENGE_ORIGINAL_PRICE = 297; // display strikethrough

export const PRODUCT_MAP = {
  challenge_197:  { name: "צ׳אלנג׳ 7 הימים",   price: 197   },
  signal_hive_590:{ name: "כוורת האות",          price: 590   },
  workshop_1080:  { name: "סדנה יום אחד",        price: 1080  },
  course_1800:    { name: "קורס דיגיטלי",         price: 1800  },
  strategy_4000:  { name: "פגישת אסטרטגיה",      price: 4000  },
  premium_14000:  { name: "יום צילום פרמיום",    price: 14000 },
} as const;

export type ProductKey = keyof typeof PRODUCT_MAP;
