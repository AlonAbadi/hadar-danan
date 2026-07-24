/**
 * /first — prompts adapted for the 20-30 second acquisition first-video.
 *
 * Reuses the lab's Hadar-brain machinery (20 signature moves + structural
 * templates + voice mechanics + critique loop). Two adaptations:
 *   1. No episode metadata — a single "acquisition first-video" context
 *      with tighter framing
 *   2. Hard length constraint: 4-5 sentences, 45-70 words. Enforced in
 *      both the draft prompt and the critique.
 */

import {
  APPROVED_MOVE_NAMES,
  SIGNATURE_MOVES_CATALOG,
  VOICE_MECHANICS_BRIEF,
  MOVE_STRUCTURAL_TEMPLATES,
  KEYWORD_MOVE_RULES,
  type SignatureMoveName,
} from "@/lib/lab/hadar-brain";
import type { LabQuestion, LabMoveChoice, LabScript, LabCritique, LabSignal } from "@/lib/lab/prompts";
import {
  FIRST_EPISODE,
  FIRST_TARGET_WORDS_MIN,
  FIRST_TARGET_WORDS_MAX,
  FIRST_TARGET_SENTENCES,
} from "./config";

export const FIRST_MODEL = "claude-sonnet-4-6";

export type FirstAnswers = {
  story:   string;
  stance:  string;
  payoff:  string; // may be ""
};

/** Compact signal snapshot rendered for prompt injection.
 *  Signal is guaranteed non-null per /first's hard contract (Alon
 *  2026-07-24: no first-video without a signal extraction). */
function renderSignalContext(signal: LabSignal): string {
  const parts: string[] = [];
  if (signal.signal)         parts.push(`- משפט האות: ${signal.signal}`);
  if (signal.signal_promise) parts.push(`- ההבטחה: ${signal.signal_promise}`);
  if (signal.pain_source)    parts.push(`- מקור הכאב: ${signal.pain_source}`);
  if (signal.element)        parts.push(`- האלמנט: ${signal.element}`);
  if (signal.central_tool)   parts.push(`- הכלי המרכזי: ${signal.central_tool}`);
  if (signal.people)         parts.push(`- הקהל: ${signal.people}`);
  if (signal.warm_note)      parts.push(`- הערה חמה: ${signal.warm_note}`);
  return `\n\n**האות של הלקוח (רקע בלבד — הזהות שממנה הוא מדבר; לא לצטט מכאן, המילים לתסריט באות רק מהתשובות):**\n${parts.join("\n")}\n`;
}

// ── Move selection ─────────────────────────────────────────────────────

export const FIRST_MOVE_SELECT_MAX_TOKENS = 900;

export function buildFirstMoveSystem(signal: LabSignal): string {
  const kwRules = KEYWORD_MOVE_RULES
    .map((r) => `  · אם באות או בתשובות מופיעה אחת מהמילים: ${r.keywords.map((k) => `"${k}"`).join(" / ")} → מהלך "${r.move}" ${r.note ? "(" + r.note + ")" : ""}`)
    .join("\n");
  const keywordBlock = `\n\n**חוקי מילות־מפתח מהאות (חובה קשיחה — קודמים לכל שיקול אחר):**\n${kwRules}\n\nהבידול בין לקוחות באותה קטגוריה חייב לבוא מהמילים שבאות ובתשובות, לא ממיפוי אוטומטי לפי מקצוע.\n`;
  // signal parameter is required for API consistency, referenced via renderSignalContext elsewhere.
  void signal;

  return `אתה הדר דנן. קיבלת אות של לקוח + סיפור אחד + עמדה + פאיוף (אופציונלי) — זה כל החומר. תפקידך: לבחור **מהלך חתימה אחד** מתוך 20 המהלכים שיסגנן את הסרטון הקצר.

זה הסרטון הראשון של הלקוח, סרטון של 20-30 שניות שאמור לגרום לו לקנות את המוצר המלא. חד, מדויק, בקול שלו. תבחר את המהלך שהחומר הגולמי + האות שסיפק יגרמו לו לפרוץ הכי חד.

הקשר:
- כותרת: ${FIRST_EPISODE.title}
- מוקד: ${FIRST_EPISODE.focus}

${SIGNATURE_MOVES_CATALOG}
${keywordBlock}
**איך לבחור לסרטון קצר של 30 שניות:**

- בסרטון בן 4-5 משפטים אין מקום לפרישת מהלכים אבסטרקטיים. **תעדף מהלכים עם חתימת שפה קנונית ברורה** — Service Reframe ("זה לא X, זה Y"), Category-Rename ("אל תעשו X"), Self-as-example ("תחשוב עליי"), Full-Disclosure Reveal ("אני רוצה לעשות איתכם גילוי נאות"), Chain-Collapse ("אין X, אין Y") — המהלכים שיכולים לחתום ברור בפחות מ־6 משפטים.
- מהלכים אבסטרקטיים (Silent Authority Positioning, Sacred-Path Protection, Proxy Embodiment) עובדים בסרטון קצר רק אם ה־hook הקנוני שלהם מובחן מבחינת שפה.
- בחר לפי החומר שסיפק, לא לפי מה שנשמע נחמד. אם הסיפור הוא "לקוח נתקע ואני שיניתי כיוון" → Service Reframe. אם הוא "עשיתי משהו שכולם עושים אחרת" → Category-Rename. אם הוא "מסלול אישי שלי הפך למה שאני מוכר" → Self-as-example.
- אם קיים אות: הבחירה חייבת להיות כזאת שהאות של הלקוח מקבל ביטוי ברור ב־30 שניות. לא רק הסיפור.

**רשימת השמות המאושרים (רשימה סגורה, אסור להמציא):**
${APPROVED_MOVE_NAMES.map((n) => `· "${n}"`).join("\n")}

פורמט (JSON בלבד, בלי markdown):
{
  "name":  "…",
  "why":   "…",
  "frame": "…"
}`;
}

export function buildFirstMoveUser(answers: FirstAnswers, signal: LabSignal): string {
  return `${renderSignalContext(signal)}

החומר הגולמי מהלקוח:

**הסיפור:**
${answers.story}

**העמדה:**
${answers.stance}

${answers.payoff ? `**מה קרה בסוף:**\n${answers.payoff}` : ""}

בחר מהלך חתימה אחד לסרטון של 30 שניות. אם יש אות — השתמש בו לחיזוק הבחירה (מילות מפתח, זהות, קהל).`;
}

// ── Script generation (short) ──────────────────────────────────────────

export const FIRST_SCRIPT_MAX_TOKENS = 1200;

export function buildFirstScriptSystem(move: LabMoveChoice, signal: LabSignal): string {
  const signalContext = renderSignalContext(signal);
  const tmpl = MOVE_STRUCTURAL_TEMPLATES[move.name];
  const templateBlock = tmpl ? `
**התבנית המבנית של המהלך:**
- Hook: ${tmpl.hook_shape}
- Body: ${tmpl.body_shape}
- Landing: ${tmpl.landing_shape}
- פורמולות קנוניות: ${tmpl.canonical_devices.join(" · ")}
- צורות אסורות: ${tmpl.forbidden_shapes.join(" · ")}` : "";

  return `אתה הדר דנן בעריכה של הסרטון־הראשון של לקוח פוטנציאלי. יש לך: (א) סיפור + עמדה + פאיוף גולמיים, (ב) מהלך חתימה שנבחר, (ג) התבנית המבנית שלו, (ד) מכניקות הקול.

תפקידך: לחלץ מהחומר סרטון של **${FIRST_TARGET_SENTENCES} משפטים, ${FIRST_TARGET_WORDS_MIN}-${FIRST_TARGET_WORDS_MAX} מילים בסך הכל, 20-30 שניות דיבור.** במילים של הלקוח, לא שלך.

**מהלך חתימה:** ${move.name}
**למה:** ${move.why}
**איך:** ${move.frame}
${templateBlock}
${signalContext}
${VOICE_MECHANICS_BRIEF}

**כללי אורך קשוחים (בסרטון־ראשון אין רזרבה):**
- Hook: 1-2 משפטים
- Body: 2-3 משפטים
- Landing: משפט אחד קצר, לעיתים חלק מהגוף
- CTA: תמיד null בסרטון־ראשון. אין CTA.
- סה"כ: ${FIRST_TARGET_WORDS_MIN}-${FIRST_TARGET_WORDS_MAX} מילים

**כללי הליבה (זהים ללב):**
- המילים חייבות להיות של הלקוח. **חובה לשמור לפחות 3 ביטויים verbatim** מהחומר הגולמי (3 התשובות), מוחזרים בשדה preserved_phrases
- **האות הוא רקע לזהות ולטון — לא מקור לתוכן ולא לשפה.** אסור לצטט משדות האות (משפט האות, ההבטחה, וכו') לתסריט. התוכן והמילים באים אך ורק מ־3 התשובות
- מותר לגזור, לסדר מחדש, לשלב פתיח קנוני של המהלך, לחבר בין משפטים במילת גשר (ולא, אבל, כי)
- אסור להחליף מילים של הלקוח בפרפרזה "יפה"
- אסור להוסיף רעיונות שלא היו בחומר
- אסור מקפים גדולים (—). פסיק או נקודה במקום
- אסור פתיחה שיווקית ("היי", "אני רוצה לספר לכם")

זה הסרטון שיקנה למשתמש את המוצר. אין רזרבה — כל משפט חייב להצדיק את מקומו.

פורמט (JSON בלבד):
{
  "title":              "…",
  "hook":               "…",
  "body":               "…",
  "cta":                null,
  "preserved_phrases":  ["…"],
  "move_applied":       "…",
  "voice_devices_used": ["…"]
}`;
}

export function buildFirstScriptUser(answers: FirstAnswers, signal: LabSignal): string {
  return `${renderSignalContext(signal)}

החומר הגולמי (מקור המילים לתסריט):

**הסיפור:**
${answers.story}

**העמדה:**
${answers.stance}

${answers.payoff ? `**מה קרה בסוף:**\n${answers.payoff}` : ""}

בנה סרטון של 20-30 שניות לפי המהלך שנבחר. שמור את המילים של הלקוח מ־3 התשובות. האות רקע בלבד — לא לצטט מהאות.`;
}

// ── Critique + revision (short-video variant) ──────────────────────────

export const FIRST_CRITIQUE_MAX_TOKENS = 1400;

export function buildFirstCritiqueSystem(move: LabMoveChoice, signal: LabSignal): string {
  const signalNote = "\nהאות של הלקוח מופיע בהודעת המשתמש כרקע. בדוק גם: האם התסריט מבטא את הזהות שבאות, גם אם לא מצטט ממנו? אם הזהות לא מורגשת בכלל — זה גורע מהציון.\n";
  void signal;
  const tmpl = MOVE_STRUCTURAL_TEMPLATES[move.name];
  const tmplStr = tmpl
    ? `- Hook: ${tmpl.hook_shape}\n- Body: ${tmpl.body_shape}\n- Landing: ${tmpl.landing_shape}\n- פורמולות קנוניות: ${tmpl.canonical_devices.join(" · ")}\n- צורות אסורות: ${tmpl.forbidden_shapes.join(" · ")}`
    : "(אין תבנית קונקרטית — סמוך על ההגדרה הכללית)";

  return `אתה הדר בעריכת פוסט־טיוטה של סרטון־ראשון (30 שניות). קיבלת טיוטה שנכתבה מהחומר של הלקוח + המהלך שנבחר. תפקידך: לוודא שהטיוטה תשיג את מטרתה — לקנות את הלקוח.

**מטרה כפולה — בסרטון־ראשון שני הדברים חובה:**
1. המבנה של המהלך מומש בבירור (לא רק מוזכר)
2. אורך מדויק: ${FIRST_TARGET_WORDS_MIN}-${FIRST_TARGET_WORDS_MAX} מילים, ${FIRST_TARGET_SENTENCES} משפטים
${signalNote}
תבנית המהלך שנבחר (${move.name}):
${tmplStr}

**הבדיקה:**

1. **ציון 1-5:** כמה טוב המהלך מומש + כמה טוב האורך.
   - 5 = מהלך חתום בבירור + אורך בטווח
   - 4 = כמעט מושלם, פרט אחד שולי
   - 3 = מבנה שם אבל שוטח / אורך חורג
   - 1-2 = מהלך מוזכר בלי מבנה / חריגה משמעותית מהאורך

2. **מה חסר / חורג (אם ציון < 4):** משפט מפורש, קונקרטי.

3. **תיקון (אם ציון < 4):** גרסה מתוקנת. **חובה קשיחה: לפחות 3 ביטויי־מפתח של הלקוח נשארים verbatim** (מהטיוטה או מהחומר המקורי). המבנה של המהלך משתנה, המילים של הלקוח לא. אסור להמציא רעיונות שלא היו בחומר. אסור לחרוג מ־${FIRST_TARGET_WORDS_MAX} מילים.

חוקי פלט:
- אם ציון >= 4: revised: null. הטיוטה עוברת.
- אם ציון < 4: revised מלא באותה סכימה של הטיוטה.
- אין מקפים גדולים (—).

פורמט (JSON בלבד):
{
  "score":       1-5,
  "what_missed": "…",
  "revised":     null | { "title": "…", "hook": "…", "body": "…", "cta": null, "preserved_phrases": ["…"], "move_applied": "…", "voice_devices_used": ["…"] }
}`;
}

export function buildFirstCritiqueUser(answers: FirstAnswers, draft: LabScript, signal: LabSignal): string {
  const words = (draft.hook + " " + draft.body).trim().split(/\s+/).length;
  return `${renderSignalContext(signal)}

החומר הגולמי (מקור המילים לשמר):

**הסיפור:** ${answers.story}
**העמדה:** ${answers.stance}
${answers.payoff ? `**פאיוף:** ${answers.payoff}` : ""}

הטיוטה שנכתבה:

Hook:  ${draft.hook}
Body:  ${draft.body}

ספירת מילים בפועל: ${words} (יעד: ${FIRST_TARGET_WORDS_MIN}-${FIRST_TARGET_WORDS_MAX})
המילים שנטען שנשמרו: ${draft.preserved_phrases.join(" · ")}
מה נטען שהמהלך עשה: ${draft.move_applied}

עכשיו — בדוק, תן ציון, וסגור.`;
}

// Re-export the types the route + client need, so /first callers don't
// need to reach into /lab for them.
export type { LabScript as FirstScript, LabMoveChoice as FirstMoveChoice, LabCritique as FirstCritique, LabQuestion as FirstLabQuestion };
export type { SignatureMoveName };
