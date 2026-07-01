/**
 * Personalized WhatsApp opener from Hadar to a signal / quiz lead.
 *
 * Used by /admin/today handoff queue: when Hadar clicks "שלח ווטסאפ", we open
 * wa.me with this message pre-filled so she sends in one tap (she can edit
 * a word before hitting send).
 *
 * Voice rules (locked in SIGNAL_BUILD_PLAN.md):
 *   - First person, Hadar herself — not "צוות beegood".
 *   - Curiosity, not a sales pitch. No price, no "קנה/הזמן", no scarcity.
 *   - Built from the lead's OWN signal + answers, never invented.
 *
 * Personalization layers:
 *   1. First name in the greeting.
 *   2. The extracted signal sentence quoted back to them.
 *   3. A verbatim snippet from Q4 (what_helped) — hearing their own
 *      language back is the single strongest "she actually read this" signal.
 *   4. Gender-matched pronouns/verbs where unpointed Hebrew actually
 *      distinguishes m/f (את vs אתה, מגיע vs מגיעה). Suffixes like
 *      לך / אתך / עבורך are identical unpointed so we don't fork them.
 */

type Gender = "m" | "f" | null | undefined;

export interface HandoffLead {
  name?:    string | null;
  gender?:  Gender;
  signal?:  { signal?: string | null } | null;
  answers?: Record<string, unknown> | null;
}

/** Trim a Hebrew string to a WhatsApp-friendly length on a sentence or word
 *  boundary. Never mid-word, never mid-comma-clause when possible. */
function shortHebrew(text: string, max = 130): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  // Prefer breaking at a Hebrew sentence-final punctuation inside the window.
  const window = clean.slice(0, max);
  const lastStop = Math.max(window.lastIndexOf("."), window.lastIndexOf("?"), window.lastIndexOf("!"));
  if (lastStop > 60) return window.slice(0, lastStop + 1);

  // Otherwise a comma break…
  const lastComma = window.lastIndexOf(",");
  if (lastComma > 60) return window.slice(0, lastComma) + "…";

  // …then a word boundary as last resort.
  const lastSpace = window.lastIndexOf(" ");
  return (lastSpace > 40 ? window.slice(0, lastSpace) : window).trim() + "…";
}

/**
 * Pull a short, quotable sentence from Q4 (what_helped) — where leads usually
 * name the internal shift that got them out of a hard period. Falls back to
 * Q2 (effortless_mastery) if Q4 is thin. Returns null when neither carries
 * enough substance to quote back meaningfully.
 */
function pickQ4Quote(answers: Record<string, unknown> | null | undefined): string | null {
  if (!answers) return null;
  const candidates = ["what_helped", "effortless_mastery"] as const;
  for (const key of candidates) {
    const v = answers[key];
    if (typeof v === "string" && v.trim().length >= 40) {
      return shortHebrew(v, 140);
    }
  }
  return null;
}

/** Return the second-person "you" that matches this lead's gender. */
function you(g: Gender): string {
  return g === "m" ? "אתה" : g === "f" ? "את" : "את/ה";
}

/** Present-tense "coming/arriving from" — gender-matched. */
function coming(g: Gender): string {
  return g === "m" ? "מגיע" : g === "f" ? "מגיעה" : "מגיע/ה";
}

/**
 * Build the Hebrew WhatsApp message for a signal-source lead.
 * Falls back gracefully when signal or Q4 quote are missing.
 */
export function buildHandoffMessage(lead: HandoffLead): string {
  const firstName = (lead.name ?? "").trim().split(/\s+/)[0] || "";
  const greeting  = firstName ? `היי ${firstName}, כאן הדר.` : "היי, כאן הדר.";
  const sig       = lead.signal?.signal?.trim();
  const quote     = pickQ4Quote(lead.answers);
  const g         = lead.gender ?? null;

  const parts: string[] = [greeting, ""];

  if (sig) {
    parts.push(`עברתי על האות שיצא לך באבחון — "${shortHebrew(sig, 130)}"`);
    parts.push("");
    if (quote) {
      // The strongest personalization move: quote their OWN words back to
      // them. Signals "she actually read this," not "she blasted a template."
      parts.push(`מה שעצר אותי במיוחד זה שכתבת "${quote}".`);
      parts.push("");
      parts.push("רציתי להבין אתך מאיפה זה מגיע ולאן אפשר לקחת את זה הלאה.");
    } else {
      parts.push("משהו בו תפס אותי, ובא לי להבין אתך מאיפה זה מגיע ולאן אפשר לקחת אותו הלאה.");
    }
    parts.push("");
    parts.push("מתי נוח לך לדבר רגע בימים הקרובים?");
    return parts.join("\n");
  }

  // No signal sentence — still a warm opener.
  parts.push("עברתי על האות שיצא לך באבחון ומשהו בו תפס אותי.");
  parts.push("");
  parts.push("בא לי להבין אתך מאיפה זה מגיע ולאן אפשר לקחת אותו הלאה. מתי נוח לך לדבר רגע בימים הקרובים?");
  return parts.join("\n");
}

/** Hebrew label for a high-value quiz recommendation. */
const QUIZ_PRODUCT_LABEL: Record<string, string> = {
  strategy:    "פגישת אסטרטגיה",
  premium:     "יום צילום פרמיום",
  partnership: "שותפות אסטרטגית",
};

/**
 * WhatsApp opener for a lead that came through the quiz (not the signal
 * engine). References their result instead of a signal sentence. Same voice
 * rules — curiosity, no pitch, no price. Gender-adapted on the two spots
 * where unpointed Hebrew actually differs (את vs אתה, מגיע vs מגיעה).
 */
export function buildQuizHandoffMessage(lead: {
  name?:               string | null;
  gender?:             Gender;
  recommendedProduct?: string | null;
}): string {
  const firstName = (lead.name ?? "").trim().split(/\s+/)[0] || "";
  const greeting  = firstName ? `היי ${firstName}, כאן הדר.` : "היי, כאן הדר.";
  const label     = QUIZ_PRODUCT_LABEL[lead.recommendedProduct ?? ""] ?? null;
  const g         = lead.gender ?? null;

  if (label) {
    return [
      greeting,
      "",
      `ראיתי שעברת אצלנו את האבחון הקצר, והכיוון שהכי התאים לך יצא ${label}.`,
      "",
      `בא לי להבין אתך רגע מאיפה ${you(g)} ${coming(g)} ולראות אם זה באמת הכיוון הנכון עבורך.`,
      "",
      "מתי נוח לך לדבר רגע בימים הקרובים?",
    ].join("\n");
  }

  return [
    greeting,
    "",
    "ראיתי שעברת אצלנו את האבחון הקצר ומשהו בתשובות שלך תפס אותי.",
    "",
    "בא לי להבין אתך רגע לאן נכון לקחת את זה. מתי נוח לך לדבר בימים הקרובים?",
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
