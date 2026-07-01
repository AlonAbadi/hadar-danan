/**
 * Personalized WhatsApp opener from Hadar to a signal lead.
 *
 * Used by the /admin/signal handoff queue: when Hadar clicks "שלח ווטסאפ", we
 * open wa.me with this message pre-filled so she sends in one tap (she can edit
 * a word before hitting send).
 *
 * Voice rules (locked in SIGNAL_BUILD_PLAN.md):
 *   - First person, Hadar herself — not "צוות beegood".
 *   - Curiosity, not a sales pitch. No price, no "קנה/הזמן", no scarcity.
 *   - Built from the lead's OWN signal, never invented.
 */

export interface HandoffLead {
  name?:   string | null;
  signal?: { signal?: string | null } | null;
}

/** Trim the signal sentence to a WhatsApp-friendly length on a word boundary. */
function shortSignal(signal: string, max = 130): string {
  const clean = signal.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/**
 * Build the Hebrew WhatsApp message text. Falls back gracefully when the signal
 * sentence is missing (still a warm, personal opener — just without the quote).
 */
export function buildHandoffMessage(lead: HandoffLead): string {
  const firstName = (lead.name ?? "").trim().split(/\s+/)[0] || "";
  const greeting  = firstName ? `היי ${firstName}, כאן הדר.` : "היי, כאן הדר.";
  const sig       = lead.signal?.signal?.trim();

  if (sig) {
    return [
      greeting,
      "",
      `עברתי על האות שיצא לך באבחון — "${shortSignal(sig)}"`,
      "",
      "משהו בו תפס אותי, ובא לי להבין איתך מאיפה זה מגיע ולאן אפשר לקחת אותו הלאה.",
      "",
      "מתי נוח לך לדבר רגע בימים הקרובים?",
    ].join("\n");
  }

  return [
    greeting,
    "",
    "עברתי על האות שיצא לך באבחון ומשהו בו תפס אותי.",
    "",
    "בא לי להבין איתך מאיפה זה מגיע ולאן אפשר לקחת אותו הלאה. מתי נוח לך לדבר רגע בימים הקרובים?",
  ].join("\n");
}

/** Hebrew label for a high-value quiz recommendation. */
const QUIZ_PRODUCT_LABEL: Record<string, string> = {
  strategy:    "פגישת אסטרטגיה",
  premium:     "יום צילום פרמיום",
  partnership: "שותפות אסטרטגית",
};

/**
 * WhatsApp opener from Hadar for a lead that came through the quiz (not the
 * signal engine). References their result instead of a signal sentence. Same
 * voice rules — curiosity, no pitch, no price.
 */
export function buildQuizHandoffMessage(lead: { name?: string | null; recommendedProduct?: string | null }): string {
  const firstName = (lead.name ?? "").trim().split(/\s+/)[0] || "";
  const greeting  = firstName ? `היי ${firstName}, כאן הדר.` : "היי, כאן הדר.";
  const label     = QUIZ_PRODUCT_LABEL[lead.recommendedProduct ?? ""] ?? null;

  if (label) {
    return [
      greeting,
      "",
      `ראיתי שעברת אצלנו את האבחון הקצר, והכיוון שהכי התאים לך יצא ${label}.`,
      "",
      "בא לי להבין איתך רגע מאיפה את/ה מגיע/ה ולראות אם זה באמת הכיוון הנכון עבורך.",
      "",
      "מתי נוח לך לדבר רגע בימים הקרובים?",
    ].join("\n");
  }

  return [
    greeting,
    "",
    "ראיתי שעברת אצלנו את האבחון הקצר ומשהו בתשובות שלך תפס אותי.",
    "",
    "בא לי להבין איתך רגע לאן נכון לקחת את זה. מתי נוח לך לדבר בימים הקרובים?",
  ].join("\n");
}

/** Normalize an Israeli phone to a wa.me-ready international form (972…). */
export function waPhoneOf(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").replace(/^0/, "972");
  return digits.length >= 11 ? digits : null;
}

/** Full wa.me deep link with the composed message pre-filled. */
export function buildHandoffWaLink(lead: HandoffLead & { phone?: string | null }): string | null {
  const wa = waPhoneOf(lead.phone);
  if (!wa) return null;
  return `https://wa.me/${wa}?text=${encodeURIComponent(buildHandoffMessage(lead))}`;
}
