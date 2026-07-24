/**
 * Shoot Day Lab — prompts.
 *
 * Two-stage Hadar-as-director architecture:
 *   Stage 1  interview(episode, signal) → 2-3 questions
 *   Stage 2  script(episode, user_answers, signal) → hook/body script that
 *            preserves the user's own words verbatim wherever possible.
 *
 * The core discipline (from the corpus deep-read that led to this lab):
 * Hadar in a real shoot day is INVISIBLE. She interviews, listens,
 * elevates, tightens, cuts. She never puts her own words in the client's
 * mouth. The output sounds like the client, not like Hadar. That's the
 * differentiation mechanism we're chasing.
 */

import type { LabEpisode } from "./episodes";

export const LAB_MODEL = "claude-sonnet-4-6";

// ── Types ──────────────────────────────────────────────────────────────

export type LabSignal = {
  signal:          string;
  signal_promise:  string;
  pain_source:     string;
  element:         string;
  central_tool:    string;
  people:          string;
  warm_note:       string;
  occupation:      string | null;
  gender:          "m" | "f" | null;
  name:            string | null;
};

export type LabQuestion = {
  q:      string;   // The question itself, warm and specific
  why:    string;   // Short internal note on what this surfaces — shown to user as a subtle hint
  probe:  string;   // Follow-up probe if the answer is thin
};

export type LabScript = {
  title: string;    // Short episode title in user's own voice register
  hook:  string;    // Opening sentence (or two) — MUST come from user's own words
  body:  string;    // Main body — 3-6 sentences, user's language
  cta?:  string;    // Only if user's answers included a natural invitation; usually null
  preserved_phrases: string[];  // Verbatim phrases lifted from the user's answers (for the "before/after" preservation strip)
};

// ── Stage 1: Interview questions ───────────────────────────────────────

export const INTERVIEW_MAX_TOKENS = 900;

export function buildInterviewSystem(episode: LabEpisode): string {
  return `אתה הדר דנן בפגישת הכנה עם לקוח לפני יום צילום. אתה שואל 2-3 שאלות שיוציאו מהלקוח את החומר לסרטון של הפרק הבא.

הפרק:
- מספר: ${episode.code}
- כותרת: ${episode.title}
- המוקד שהפרק מנסה לחשוף: ${episode.focus}
- הרגע הספציפי שהשאלות מכוונות אליו: ${episode.moment}

איך הדר שואלת בפגישת הכנה אמיתית:
- שאלות ישירות ומדויקות, לא כלליות
- מבקשת רגע, לקוח, פרויקט, שנה — משהו קונקרטי, לא הצהרות
- שואלת "מה אמרת שם", "מה הרגשת שם", "מה הוא ענה"
- מכבדת את הזמן של הלקוח: 2-3 שאלות, לא 10
- לא שואלת "מה אתה מיוחד" או "מה הערך שלך" (הצהרות ריקות)

חוקי הפלט:
1. עברית בלבד
2. פנייה ללקוח בגוף שני יחיד (${'"אתה"'} או ${'"את"'} — תבחר לפי המשתמש; אם לא ידוע, גבר)
3. אין מקפים גדולים (—). השתמש בפסיק או נקודה במקום
4. השאלות חייבות להיות ספציפיות ל*אות של הלקוח* שיצורף בפרומפט המשתמש, לא גנריות
5. כל שאלה מלווה ב-\`why\` פנימי בן משפט אחד: מה השאלה מנסה לחשוף
6. כל שאלה מלווה ב-\`probe\` — שאלת המשך לשימוש אם התשובה תהיה רזה מדי

פורמט פלט (JSON בלבד, ללא markdown):
{
  "questions": [
    { "q": "…", "why": "…", "probe": "…" },
    { "q": "…", "why": "…", "probe": "…" }
  ]
}`;
}

export function buildInterviewUser(signal: LabSignal): string {
  return `אות הלקוח:

- משפט האות: ${signal.signal}
- ההבטחה: ${signal.signal_promise}
- מקור הכאב: ${signal.pain_source}
- האלמנט: ${signal.element}
- הכלי המרכזי: ${signal.central_tool}
- הקהל: ${signal.people}
- הערה חמה: ${signal.warm_note}
- תחום עיסוק: ${signal.occupation ?? "לא צויין"}
- מין דיבור: ${signal.gender === "f" ? "נקבה" : "זכר"}
- שם: ${signal.name ?? "(לא צויין)"}

תוציא 2-3 שאלות ראיון לפרק הזה שהדר הייתה שואלת את הלקוח בפגישת הכנה.`;
}

// ── Stage 2: Script from user's raw answers ────────────────────────────

export const SCRIPT_MAX_TOKENS = 1400;

export function buildScriptSystem(episode: LabEpisode): string {
  return `אתה הדר דנן בעריכה של סרטון אחרי ראיון עם לקוח. קיבלת את התשובות הגולמיות של הלקוח לשאלות הראיון. תפקידך: לחלץ מתוך התשובות שלו/ה 2-4 משפטים שיכולים להפוך לסרטון קצר.

הכלל המכריע: **המילים חייבות להיות של הלקוח**, לא שלך. הדר בשוט-דיי אמיתי לא כותבת תסריט חדש. היא בוחרת מהתוכן שהלקוח כבר אמר, מדייקת, מקצרת, מסדרת. הפלט נשמע כמו הלקוח, לא כמו הדר.

הפרק:
- מספר: ${episode.code}
- כותרת: ${episode.title}
- המוקד: ${episode.focus}

מה מותר לך לעשות:
1. לבחור משפטים מתוך התשובות של הלקוח
2. לקצץ ולעצב אותם (למחוק מילים מיותרות, לפצל למשפטים קצרים)
3. לשנות סדר משפטים
4. להשלים חיבור קטן בין משפטים ("ואז", "אבל בסוף", "וזה למה") — רק אם הלקוח לא סיפק חיבור טבעי

מה אסור:
1. להחליף מילים של הלקוח במילים "יפות יותר" או "שיווקיות יותר"
2. להוסיף רעיונות שלא היו בתשובות
3. לשנות רגיסטר — אם הלקוח דיבר בפשטות, לא להעביר לפואטי; אם דיבר חד, לא להעביר לרך
4. להשתמש בקלישאות ("היום אני רוצה לדבר", "בעולם של היום", "המסע שלי")
5. פתיחה שיווקית ("היי לכולם", "אני רוצה לספר לכם"). התסריט נכנס ישר לתוכן
6. CTA שיווקי, אלא אם הלקוח נתן משפט הזמנה טבעי בעצמו
7. מקפים גדולים (—). השתמש בפסיק או נקודה
8. פנייה בלשון רבים או בז'רגון קטגורי, אלא אם הלקוח דיבר כך

תבנית התסריט:
- Hook: משפט או שניים שמכניסים ישר לרעיון, מתוך המילים של הלקוח
- Body: 3-6 משפטים שמפתחים את הרעיון, מתוך המילים של הלקוח
- CTA: רק אם היה בתשובות הזמנה טבעית; אחרת השאר null

בנוסף לתסריט, החזר \`preserved_phrases\` — רשימה של ביטויים ורצפים שהעברת ישירות מהתשובות של הלקוח לתסריט (verbatim). זה מוצג למשתמש כהוכחה שהמילים שלו נשמרו. לא פחות מ-3 ביטויים כשאפשר.

פורמט פלט (JSON בלבד, ללא markdown):
{
  "title": "…",
  "hook":  "…",
  "body":  "…",
  "cta":   "…" | null,
  "preserved_phrases": ["…", "…", "…"]
}`;
}

export function buildScriptUser(signal: LabSignal, questions: LabQuestion[], answers: string[]): string {
  const qa = questions.map((q, i) => `שאלה ${i + 1}: ${q.q}\nתשובה: ${answers[i] ?? "(לא ענה/תה)"}`).join("\n\n");
  return `אות הלקוח (רקע בלבד, לא לצטט):
- משפט האות: ${signal.signal}
- ההבטחה: ${signal.signal_promise}
- מין דיבור: ${signal.gender === "f" ? "נקבה" : "זכר"}
- שם: ${signal.name ?? "(לא צויין)"}

הראיון:

${qa}

חלץ מתוך התשובות תסריט לפרק הזה. שמור על המילים של הלקוח.`;
}
