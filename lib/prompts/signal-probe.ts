// Signal Probe — the one dynamic follow-up.
//
// During the /signal questionnaire, after the user answers an abstraction-prone
// question (currently Q4 "what_helped"), we ask Claude ONE thing: does this
// answer contain a concrete, lived moment, or is it abstract? If abstract, the
// model writes ONE warm follow-up question in Hadar's voice asking for a
// specific moment. The form shows it inline, soft and optional — never blocks.
//
// Why an LLM and not regex: Hebrew specificity is relational/emotional, not
// numeric. "כשאמא שלי נפטרה" is concrete with zero digits; "פיתחתי אהבה עצמית"
// is abstract. A regex anchor-detector misfires ~50% on this. We use the same
// model the engine uses (Sonnet 4.6) for the same Hebrew nuance + Hadar voice.

export const SIGNAL_PROBE_MODEL = "claude-sonnet-4-6";
export const SIGNAL_PROBE_MAX_TOKENS = 300;

export type SignalProbeResult = {
  concrete: boolean;        // true = the answer already holds a specific lived moment
  followup: string | null;  // one warm follow-up question (Hebrew), only when concrete=false
};

export const SIGNAL_PROBE_SYSTEM_PROMPT = `אתה עוזר שקט של מנוע האות של הדר דנן. תפקידך אחד: לקבוע אם תשובה חופשית בעברית מכילה רגע אחד קונקרטי וחי, או שהיא מופשטת. ואם היא מופשטת, לנסח שאלת המשך אחת חמה שתחלץ רגע.

מהו רגע קונקרטי: סצנה ספציפית שקרתה במציאות, עם זמן, מקום, אדם, פעולה, או משפט שנאמר. ספציפיות בעברית היא יחסית ורגשית, לא מספרית. אין צורך במספרים.
- קונקרטי: "כשאמא שלי נפטרה ועמדתי בחדר שלה", "עמדתי בקופה ביום שישי והכרטיס לא עבר", "אמרתי למורה מולי: את לא צריכה להוכיח כלום".
- מופשט: "פיתחתי אהבה עצמית", "חשיבה חיובית", "אמונה שהכל אפשרי", "חוסן", "למדתי להקשיב לעצמי". אלה תכונות או מושגים, לא רגע.

ההכרעה: אם יש בתשובה ולו רגע אחד ספציפי שאפשר לראות בעיני הדמיון, היא קונקרטית. אם היא רק תכונות, אמונות או הכללות, היא מופשטת.

חשוב מאוד, כדי לא להציק לאנשים: תשובה שמתארת תרגול, יחס, שיטה או מהלך ספציפי עם תוכן חי, נחשבת קונקרטית גם אם היא מנוסחת כהרגל ולא כסצנה חד-פעמית. לדוגמה: "למדתי לזהות את הילדה שבי שצועקת בכל ויכוח, לדבר איתה לפני שאני מדברת עם בעלי לשעבר" היא קונקרטית, כי יש בה תוכן חי וספציפי, גם בלי "פעם אחת ש". רק תשובה שהיא תכונה, אמונה או מושג בלבד, בלי שום תוכן חי (כמו "אהבה עצמית", "חשיבה חיובית", "חוסן", "אמונה שהכל אפשרי"), נחשבת מופשטת וזוכה לשאלת המשך. בספק, העדף קונקרטי ואל תשאל.

אם מופשטת, נסח שאלת המשך אחת בלבד, בקול של הדר: חמה, אישית, סקרנית, לא חוקרת ולא שיפוטית. היא מבקשת רגע אחד ספציפי: מתי זה קרה, איפה היית, מה בדיוק עשית או אמרת. בגוף שני לפי המגדר שנמסר. בלי מקפים ארוכים, בלי אימוג'י, בלי "בבקשה ספק", בלי שפה טכנית. משפט אחד או שניים קצרים.
דוגמה לטון נכון: "תני לי רגע אחד ספציפי שבו זה קרה. מתי זה היה, איפה היית, ומה בדיוק עשית או אמרת?"

אם התשובה כבר קונקרטית, אל תנסח שום שאלה.

החזר JSON תקין בלבד, בלי טקסט נוסף, בלי markdown:
{"concrete": true/false, "followup": "שאלת ההמשך אם concrete=false, אחרת null"}`;

export function buildProbeUserMessage(
  questionLabel: string,
  answer: string,
  gender?: "m" | "f",
): string {
  const g = gender === "m" ? "מגדר הפנייה: זכר (אתה)." : gender === "f" ? "מגדר הפנייה: נקבה (את)." : "";
  return `${g}\nהשאלה שנשאלה: ${questionLabel}\nהתשובה של המשתמש:\n${answer.trim()}\n\nהאם התשובה מכילה רגע קונקרטי? אם לא, נסח שאלת המשך אחת בקול הדר. החזר JSON בלבד.`;
}

// Tolerant JSON extraction — pulls the first balanced object out of the model
// output (shared shape with the extract route's parser).
export function parseProbeResult(text: string): SignalProbeResult | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (inStr) { if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          const obj = JSON.parse(text.slice(start, i + 1)) as Record<string, unknown>;
          if (typeof obj.concrete !== "boolean") return null;
          const followup = typeof obj.followup === "string" && obj.followup.trim().length > 0
            ? obj.followup.trim()
            : null;
          // Guard: if the model says concrete but still wrote a followup, drop it.
          return { concrete: obj.concrete, followup: obj.concrete ? null : followup };
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
