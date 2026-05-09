import { getWorkshopDates } from "../lib/products.js";

function formatHebrew(d: string): string {
  const MONTHS = ["","ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  const [, m, day] = d.split("-");
  return `${Number(day)} ב${MONTHS[Number(m)]}`;
}

const dates = getWorkshopDates(3);
dates.forEach(d => console.log(d, "=", formatHebrew(d)));
