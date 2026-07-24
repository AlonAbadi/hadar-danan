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
  type SignatureMoveName,
} from "@/lib/lab/hadar-brain";
import type { LabQuestion, LabMoveChoice, LabScript, LabCritique } from "@/lib/lab/prompts";
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

// ── Move selection ─────────────────────────────────────────────────────

export const FIRST_MOVE_SELECT_MAX_TOKENS = 900;

export function buildFirstMoveSystem(): string {
  return `אתה הדר דנן. קיבלת סיפור אחד + עמדה + פאיוף (אופציונלי) מלקוח פוטנציאלי — זה החומר היחיד שיש. תפקידך: לבחור **מהלך חתימה אחד** מתוך 20 המהלכים שיסגנן את הסרטון הקצר.

זה הסרטון הראשון של הלקוח, סרטון של 20-30 שניות שאמור לגרום לו לקנות את המוצר המלא. חד, מדויק, בקול שלו. תבחר את המהלך שהחומר הגולמי שסיפק יגרום לו לפרוץ הכי חד.

הקשר:
- כותרת: ${FIRST_EPISODE.title}
- מוקד: ${FIRST_EPISODE.focus}

${SIGNATURE_MOVES_CATALOG}

**איך לבחור לסרטון קצר של 30 שניות:**

- בסרטון בן 4-5 משפטים אין מקום לפרישת מהלכים אבסטרקטיים. **תעדף מהלכים עם חתימת שפה קנונית ברורה** — Service Reframe ("זה לא X, זה Y"), Category-Rename ("אל תעשו X"), Self-as-example ("תחשוב עליי"), Full-Disclosure Reveal ("אני רוצה לעשות איתכם גילוי נאות"), Chain-Collapse ("אין X, אין Y") — המהלכים שיכולים לחתום ברור בפחות מ־6 משפטים.
- מהלכים אבסטרקטיים (Silent Authority Positioning, Sacred-Path Protection, Proxy Embodiment) עובדים בסרטון קצר רק אם ה־hook הקנוני שלהם מובחן מבחינת שפה.
- בחר לפי החומר שסיפק, לא לפי מה שנשמע נחמד. אם הסיפור הוא "לקוח נתקע ואני שיניתי כיוון" → Service Reframe. אם הוא "עשיתי משהו שכולם עושים אחרת" → Category-Rename. אם הוא "מסלול אישי שלי הפך למה שאני מוכר" → Self-as-example.

**רשימת השמות המאושרים (רשימה סגורה, אסור להמציא):**
${APPROVED_MOVE_NAMES.map((n) => `· "${n}"`).join("\n")}

פורמט (JSON בלבד, בלי markdown):
{
  "name":  "…",
  "why":   "…",
  "frame": "…"
}`;
}

export function buildFirstMoveUser(answers: FirstAnswers): string {
  return `החומר הגולמי מהלקוח:

**הסיפור:**
${answers.story}

**העמדה:**
${answers.stance}

${answers.payoff ? `**מה קרה בסוף:**\n${answers.payoff}` : ""}

בחר מהלך חתימה אחד לסרטון של 30 שניות.`;
}

// ── Script generation (short) ──────────────────────────────────────────

export const FIRST_SCRIPT_MAX_TOKENS = 1200;

export function buildFirstScriptSystem(move: LabMoveChoice): string {
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

${VOICE_MECHANICS_BRIEF}

**כללי אורך קשוחים (בסרטון־ראשון אין רזרבה):**
- Hook: 1-2 משפטים
- Body: 2-3 משפטים
- Landing: משפט אחד קצר, לעיתים חלק מהגוף
- CTA: תמיד null בסרטון־ראשון. אין CTA.
- סה"כ: ${FIRST_TARGET_WORDS_MIN}-${FIRST_TARGET_WORDS_MAX} מילים

**כללי הליבה (זהים ללב):**
- המילים חייבות להיות של הלקוח. **חובה לשמור לפחות 3 ביטויים verbatim** מהחומר הגולמי, מוחזרים בשדה preserved_phrases
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

export function buildFirstScriptUser(answers: FirstAnswers): string {
  return `החומר הגולמי:

**הסיפור:**
${answers.story}

**העמדה:**
${answers.stance}

${answers.payoff ? `**מה קרה בסוף:**\n${answers.payoff}` : ""}

בנה סרטון של 20-30 שניות לפי המהלך שנבחר. שמור את המילים של הלקוח.`;
}

// ── Critique + revision (short-video variant) ──────────────────────────

export const FIRST_CRITIQUE_MAX_TOKENS = 1400;

export function buildFirstCritiqueSystem(move: LabMoveChoice): string {
  const tmpl = MOVE_STRUCTURAL_TEMPLATES[move.name];
  const tmplStr = tmpl
    ? `- Hook: ${tmpl.hook_shape}\n- Body: ${tmpl.body_shape}\n- Landing: ${tmpl.landing_shape}\n- פורמולות קנוניות: ${tmpl.canonical_devices.join(" · ")}\n- צורות אסורות: ${tmpl.forbidden_shapes.join(" · ")}`
    : "(אין תבנית קונקרטית — סמוך על ההגדרה הכללית)";

  return `אתה הדר בעריכת פוסט־טיוטה של סרטון־ראשון (30 שניות). קיבלת טיוטה שנכתבה מהחומר של הלקוח + המהלך שנבחר. תפקידך: לוודא שהטיוטה תשיג את מטרתה — לקנות את הלקוח.

**מטרה כפולה — בסרטון־ראשון שני הדברים חובה:**
1. המבנה של המהלך מומש בבירור (לא רק מוזכר)
2. אורך מדויק: ${FIRST_TARGET_WORDS_MIN}-${FIRST_TARGET_WORDS_MAX} מילים, ${FIRST_TARGET_SENTENCES} משפטים

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

export function buildFirstCritiqueUser(answers: FirstAnswers, draft: LabScript): string {
  const words = (draft.hook + " " + draft.body).trim().split(/\s+/).length;
  return `החומר הגולמי (מקור המילים לשמר):

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
