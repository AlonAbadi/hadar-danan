/**
 * Shoot Day Lab — prompts (v2, "Hadar's brain fully applied").
 *
 * Three-stage Hadar-as-director architecture:
 *
 *   Stage 1  interview(episode, signal)               → 2-3 questions
 *   Stage 2  select_move(episode, signal, answers)    → pick 1 of the 20
 *                                                       signature moves + why
 *   Stage 3  script(episode, signal, answers, move,   → hook/body script
 *                   voice_mechanics)                    framed BY the move,
 *                                                       using the user's words
 *
 * Every stage runs Hadar's brain (interview method, catalog-based move
 * selection, voice mechanics micro-craft, keyword-driven overrides) while
 * every atom of content in the final script is the user's own words.
 *
 * Discipline: the move dictates STRUCTURE and STANCE. The user's answers
 * dictate CONTENT and VOCABULARY. Never swap those.
 */

import type { LabEpisode } from "./episodes";
import {
  APPROVED_MOVE_NAMES,
  SIGNATURE_MOVES_CATALOG,
  VOICE_MECHANICS_BRIEF,
  KEYWORD_MOVE_RULES,
  MOVE_STRUCTURAL_TEMPLATES,
  type SignatureMoveName,
} from "./hadar-brain";

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
  q:      string;
  why:    string;
  probe:  string;
};

export type LabMoveChoice = {
  name:     SignatureMoveName;
  why:      string;   // 1-2 sentences: why this move fits the signal + user's answers
  frame:    string;   // 1-2 sentences: how the move will be applied to *this* user's material
};

export type LabScript = {
  title:              string;
  hook:               string;
  body:               string;
  cta?:               string;
  preserved_phrases:  string[];
  move_applied:       string;   // how the chosen move actually structured the script
  voice_devices_used: string[]; // e.g. ["opener:רגע", "landing:זאת המשוואה"]
};

// ── Stage 1: Interview questions ───────────────────────────────────────

export const INTERVIEW_MAX_TOKENS = 900;

export function buildInterviewSystem(episode: LabEpisode): string {
  return `אתה הדר דנן בפגישת הכנה עם לקוח לפני יום צילום. אתה שואל 2-3 שאלות שיוציאו מהלקוח את החומר הגולמי לסרטון של הפרק הבא.

הפרק:
- מספר: ${episode.code}
- כותרת: ${episode.title}
- המוקד שהפרק מנסה לחשוף: ${episode.focus}
- הרגע הספציפי שהשאלות מכוונות אליו: ${episode.moment}

איך הדר שואלת בפגישת הכנה אמיתית (על סמך קורפוס אלון־מיה, טוקו ארומה, הילה עורי־לב, בן שלום, רותם פלד):
- שאלות ישירות ומדויקות, לא כלליות
- מבקשת רגע, לקוח, פרויקט, שנה — משהו קונקרטי, לא הצהרות
- שואלת "מה אמרת שם" / "מה הרגשת שם" / "מה הוא ענה"
- מכבדת את הזמן: 2-3 שאלות, לא 10
- לא שואלת "מה מייחד אותך" (הצהרה ריקה)
- שואלת דברים שיאפשרו לה אחר כך לבחור מהלך חתימה: ניגוד לקטגוריה, לקוח־של־לקוח, פער בין שמפרסמים לבין מה שקורה, רגע שבו סירבה למה שכולם עושים, סיפור עם דמות ספציפית

חוקי הפלט:
1. עברית בלבד
2. פנייה ${'"אתה"'} או ${'"את"'} לפי מין הלקוח שמצוין בפרומפט המשתמש
3. אין מקפים גדולים (—). פסיק או נקודה במקום
4. השאלות ספציפיות לאות של הלקוח (שיצורף בפרומפט המשתמש), לא גנריות
5. כל שאלה מלווה ב־\`why\` פנימי בן משפט אחד: מה השאלה מנסה לחשוף
6. כל שאלה מלווה ב־\`probe\`: שאלת המשך אם התשובה תהיה רזה

פורמט (JSON בלבד, בלי markdown):
{
  "questions": [
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

תוציא 2-3 שאלות ראיון לפרק הזה שהדר הייתה שואלת בפגישת הכנה.`;
}

// ── Stage 2: Signature move selection ──────────────────────────────────

export const MOVE_SELECT_MAX_TOKENS = 900;

export function buildMoveSelectionSystem(episode: LabEpisode, siblingsUsed: SignatureMoveName[]): string {
  const kwRules = KEYWORD_MOVE_RULES
    .map((r) => `  · אם באות/בתשובות מופיע: ${r.keywords.map((k) => `"${k}"`).join(" / ")} → מהלך "${r.move}" ${r.note ? "(" + r.note + ")" : ""}`)
    .join("\n");

  const diversityBlock = siblingsUsed.length
    ? `\n**גיוון בין־פרקים (חובה):** בפרקים אחרים באותה עונה כבר נבחרו המהלכים הבאים: ${siblingsUsed.map((m) => `"${m}"`).join(", ")}. **הימנע מלבחור את אותם המהלכים שוב** אלא אם חוק־מילת־מפתח מכריח. אם החומר מאפשר שני מהלכים בעלי חוזק דומה, בחר את זה שעוד לא נעשה בו שימוש. הבידול בין פרקים הוא ליבת המוצר — אם המהלך חוזר, הפרקים ייראו כמו אותו סרטון בטעמים שונים.\n`
    : "";

  return `אתה הדר דנן. קיבלת אות של לקוח, פרק ספציפי, ותשובות הלקוח לשאלות ראיון. תפקידך: לבחור **מהלך חתימה אחד** מתוך 20 המהלכים שיסגנן את הסרטון.
${diversityBlock}

הפרק:
- מספר: ${episode.code}
- כותרת: ${episode.title}
- המוקד: ${episode.focus}

${SIGNATURE_MOVES_CATALOG}

**כללי בחירת מהלך (Signal-Keyword-Driven Selection — Alon 2026-07-22):**

לפני שאתה בוחר, קרא את משפט האות ואת התשובות של הלקוח וחפש **מילות מפתח**. הבידול בין לקוחות באותה קטגוריה חייב לבוא מהמילים באות ובתשובות, לא ממיפוי אוטומטי לפי מקצוע.

חוקים כאלה קשיחים (אם המילה מופיעה, המהלך חובה):
${kwRules}

אם אף חוק לא נתפעל: בחר לפי מה שנשמע בתשובות של הלקוח (סיפור עם לקוח? Service Reframe או Self-as-example. עמדה נגד הקטגוריה? Category-Rename או Full-Disclosure Reveal. אנלוגיה מתחום אחר? Parable Building. framework של 3? Diagnostic-Framework Reveal — רק אם באמת יש 3.)

חוקים על:
1. שם המהלך חייב להיות **מדויק** מרשימת ${APPROVED_MOVE_NAMES.length} השמות המאושרים למטה. אסור להמציא שם.
2. אם התלבטת בין שני מהלכים, בחר את זה שהתשובות של הלקוח סיפקו לו הכי הרבה חומר גולמי.
3. אם התשובות לא מספיקות לאף מהלך משמעותי (לקוח נתן תשובות רזות), בחר External→Internal Translation כברירת מחדל — המהלך הפחות דורש.
4. אסור לתייג מהלך בשם של מהלך אחר.

**רשימת השמות המאושרים (רשימה סגורה):**
${APPROVED_MOVE_NAMES.map((n) => `· "${n}"`).join("\n")}

פורמט (JSON בלבד, בלי markdown):
{
  "name":  "…",  // בדיוק אחד מהשמות המאושרים
  "why":   "…",  // 1-2 משפטים: למה המהלך הזה מתאים לאות ולתשובות הספציפיות
  "frame": "…"   // 1-2 משפטים: איך המהלך יופעל בפועל על החומר של הלקוח הזה (בציון מילים ספציפיות מהתשובות שלו)
}`;
}

export function buildMoveSelectionUser(signal: LabSignal, questions: LabQuestion[], answers: string[]): string {
  const qa = questions.map((q, i) => `שאלה ${i + 1}: ${q.q}\nתשובה: ${answers[i] ?? "(לא ענה/תה)"}`).join("\n\n");
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

הראיון:

${qa}

בחר מהלך חתימה אחד לפרק הזה.`;
}

// ── Stage 3: Script from user's answers, framed by the selected move ───

export const SCRIPT_MAX_TOKENS = 1600;

export function buildScriptSystem(episode: LabEpisode, move: LabMoveChoice): string {
  const tmpl = MOVE_STRUCTURAL_TEMPLATES[move.name];
  const templateBlock = tmpl ? `
**התבנית המבנית של המהלך הזה — חובה לפעול לפיה, זה מה שהופך את המהלך לחתום ולא לרמז:**

- **צורת הפתיח (Hook):** ${tmpl.hook_shape}
- **צורת הגוף (Body):** ${tmpl.body_shape}
- **צורת הנחיתה (Landing):** ${tmpl.landing_shape}
- **פורמולות קנוניות למהלך הזה:** ${tmpl.canonical_devices.join(" · ")}
- **צורות אסורות:** ${tmpl.forbidden_shapes.join(" · ")}
- **טווח משפטים כולל:** ${tmpl.total_sentences}

התבנית קשוחה. אם התבנית אומרת "פתיחה בשלילה", ה־hook לא יכול להתחיל בהצהרה חיובית. אם התבנית אומרת "בדיוק שלושה פרמטרים", לא שני ולא ארבעה.` : "";

  return `אתה הדר דנן בעריכה של סרטון אחרי ראיון עם לקוח. יש לך ארבעה חומרים:
1. **התשובות הגולמיות** של הלקוח לשאלות הראיון (המילים שלו/ה)
2. **מהלך חתימה שנבחר** לסרטון (איך זה יסגנן)
3. **התבנית המבנית של המהלך** (איך זה נראה מבנית — מה הפתיח, מה הגוף, מה הנחיתה)
4. **מכניקות הקול** של הדר (איך משפטים בונים)

תפקידך: לחלץ מתוך התשובות תסריט קצר, שממוסגר ע"פ המהלך *ובפרט התבנית המבנית שלו*, ומשתמש **במילים של הלקוח**, לא שלך.

הפרק:
- מספר: ${episode.code}
- כותרת: ${episode.title}
- המוקד: ${episode.focus}

**מהלך החתימה שנבחר:**
- שם: ${move.name}
- למה: ${move.why}
- איך להפעיל: ${move.frame}

הגדרת המהלך (מהקטלוג):
${extractMoveDefinition(move.name)}
${templateBlock}

${VOICE_MECHANICS_BRIEF}

**הכלל המכריע (חזרה):** המילים חייבות להיות של הלקוח. הדר בשוט־דיי אמיתי לא כותבת תסריט חדש. היא בוחרת מהתשובות של הלקוח, מסדרת בסדר שהמהלך מכתיב, מקצרת. הפלט נשמע כמו הלקוח *דרך המהלך* — לא כמו הדר.

מותר:
- לבחור משפטים מהתשובות
- לקצץ ולחתוך מילים מיותרות
- לשנות סדר משפטים כדי לשרת את המבנה של המהלך (למשל, ב־Chain-Collapse — לפתוח בשלילה; ב־Sacred-Path Protection — לפתוח באיום; ב־Service Reframe — לפתוח ב"זה לא X, זה Y")
- להוסיף גשר קצר בין משפטים (מילת חיבור, "ולמה?", "כי בסופו של דבר...") רק אם הלקוח לא סיפק
- להשתמש ב־opener אחד ובסגירה אחת מהמכניקות של הדר — אם הן מתלכדות טבעית עם הטון של הלקוח

אסור:
- להחליף מילים של הלקוח במילים "יפות" או "שיווקיות"
- להוסיף רעיונות שלא היו בתשובות
- לשנות רגיסטר (אם הלקוח דיבר בפשטות → אל תעביר לפואטי)
- לתייג את המהלך בשם אחר ממה שנבחר בפרומפט
- קלישאות ("בעולם של היום", "המסע שלי", "היום אני רוצה לדבר")
- פתיחה שיווקית ("היי", "אני רוצה לספר לכם")
- CTA שיווקי, אלא אם הלקוח נתן משפט הזמנה טבעי
- מקפים גדולים (—). פסיק או נקודה במקום
- יותר מ־2 openers של הדר בסרטון
- לצפוף — אם משפט של הלקוח חזק בפני עצמו, אל תעטוף אותו בפורמולה

תבנית התסריט:
- Hook (1-2 משפטים) — נכנס ישר לרעיון, ממסגר במבנה של המהלך
- Body (3-6 משפטים) — פיתוח, במילים של הלקוח
- CTA — null בדרך כלל; משפט הזמנה טבעי רק אם הלקוח סיפק כזה

בנוסף החזר:
- \`preserved_phrases\` — 3-8 ביטויים verbatim מהתשובות של הלקוח שהעברת ישירות לתסריט
- \`move_applied\` — משפט אחד שמסביר איך המהלך שינה את הסדר/המסגור של המשפטים של הלקוח (לא כללי — קונקרטי לתסריט הזה)
- \`voice_devices_used\` — רשימת פורמולות של הדר שהשתמשת בהן בפועל, בפורמט "opener:X" / "transition:X" / "landing:X" (רשימה ריקה אם לא השתמשת)

פורמט (JSON בלבד, בלי markdown):
{
  "title":              "…",
  "hook":               "…",
  "body":               "…",
  "cta":                "…" | null,
  "preserved_phrases":  ["…"],
  "move_applied":       "…",
  "voice_devices_used": ["…"]
}`;
}

export function buildScriptUser(signal: LabSignal, questions: LabQuestion[], answers: string[]): string {
  const qa = questions.map((q, i) => `שאלה ${i + 1}: ${q.q}\nתשובה: ${answers[i] ?? "(לא ענה/תה)"}`).join("\n\n");
  return `אות הלקוח (רקע בלבד — לא לצטט משם):
- משפט האות: ${signal.signal}
- ההבטחה: ${signal.signal_promise}
- מין דיבור: ${signal.gender === "f" ? "נקבה" : "זכר"}
- שם: ${signal.name ?? "(לא צויין)"}

הראיון (מקור המילים לתסריט):

${qa}

בנה תסריט לפי המהלך שנבחר. שמור על המילים של הלקוח.`;
}

// ── Stage 4: Critique + revision ──────────────────────────────────────
// A second Claude pass that reviews whether the move template was hit and
// revises if not. This is what saves the abstract-move cases (Silent
// Authority Positioning, Sacred-Path Protection) from under-delivering.

export const CRITIQUE_MAX_TOKENS = 1800;

export type LabCritique = {
  score:         number;         // 1-5, how well the move template is applied
  what_missed:   string;         // 1-2 sentences: what the template requires that the draft misses
  revised:       LabScript | null; // populated only if score < 4
};

export function buildCritiqueSystem(episode: LabEpisode, move: LabMoveChoice): string {
  const tmpl = MOVE_STRUCTURAL_TEMPLATES[move.name];
  const tmplStr = tmpl
    ? `- Hook shape: ${tmpl.hook_shape}\n- Body shape: ${tmpl.body_shape}\n- Landing shape: ${tmpl.landing_shape}\n- Canonical devices: ${tmpl.canonical_devices.join(" · ")}\n- Forbidden shapes: ${tmpl.forbidden_shapes.join(" · ")}\n- Sentence range: ${tmpl.total_sentences}`
    : "(אין תבנית קונקרטית — סמוך על ההגדרה הכללית של המהלך)";

  return `אתה הדר בעריכת פוסט־ראיון. קיבלת טיוטה של סרטון שנכתב מתוך תשובות הלקוח + המהלך שנבחר. תפקידך: לבדוק אם המהלך באמת הופעל במבנה, ואם לא, לתקן.

הפרק: ${episode.code} — ${episode.title}
המהלך: ${move.name}
תבנית המהלך:
${tmplStr}

הבדיקה שלך בשלושה שלבים:

1. **ציון (1-5):** כמה המהלך *נראה* בטיוטה בפועל?
   - 5 = הפתיח הוא בדיוק צורת הפתיח של התבנית, והגוף הולך לפי, והנחיתה סוגרת נכון. הסרטון היה עובר "תסתכל, זה [שם המהלך]" בקריאה בלי לדעת מראש.
   - 4 = כמעט הכל שם, פרט אחד שולי חסר.
   - 3 = הרעיון של המהלך שם אבל המבנה שוטח או פזור.
   - 1-2 = המהלך "מוזכר" אבל התסריט נראה כמו הסבר גנרי.

2. **מה חסר (אם ציון < 4):** משפט אחד מפורש שאומר מה התבנית דורשת שהטיוטה מפספסת. לא ג'נרי — קונקרטי לטקסט.

3. **תיקון (אם ציון < 4):** תסריט מתוקן שמפעיל את התבנית במלואה.

   **חובה קשיחה — שימור הביטויים החזקים של הלקוח:**
   - הרשימה של המילים המשמרות (preserved_phrases) בטיוטה מייצגת את הביטויים החזקים של הלקוח. **בגרסה המתוקנת חייבים להישאר לפחות 5 מתוכם verbatim** (בהנחה שהיו לפחות 5 בטיוטה, אחרת כמה שהיו).
   - אם התבנית של המהלך דורשת קיצוץ של ביטויים ספציפיים, מותר להחליף אותם בביטויים חזקים אחרים מהתשובות המקוריות של הלקוח (מהראיון) — לא בביטויים מומצאים ולא בפרפרזות "יפות".
   - **המבנה של המהלך משתנה, המילים של הלקוח לא.** מותר לך לסדר מחדש, לגזור מלים לא־חיוניות, ולעטוף בפתיח/נחיתה קנוניים. אסור לך להחליף את הביטויים החזקים של הלקוח בניסוחים שלך.
   - היעד: תסריט מתוקן עם המבנה של המהלך *והמילים של הלקוח באורך דומה או ארוך יותר מהטיוטה*. אם התיקון מקצר משמעותית, כנראה זרקת חומר שהיה צריך לשמור.

   מותר: לסדר מחדש, לגזור מילים מיותרות, לשלב פתיח קנוני של המהלך, לכתוב מחדש נחיתה קנונית.
   אסור: להמציא רעיונות שלא היו בתשובות המקוריות; להחליף ביטויי מפתח בפרפרזה; לצמצם את התסריט לקצה השני של הסקאלה (טוויט שלטני במקום סרטון).

חוקי פלט:
- אם ציון >= 4: החזר revised: null. הטיוטה עוברת.
- אם ציון < 4: החזר טיוטה מתוקנת עם אותה סכימה של השלב הקודם, כולל preserved_phrases (רשימה מעודכנת לפי הגרסה המתוקנת), move_applied חדש, voice_devices_used מעודכן.
- אין מקפים גדולים (—) בתסריט מתוקן.

פורמט (JSON בלבד, בלי markdown):
{
  "score":       1-5,
  "what_missed": "…",
  "revised":     null  |  {
    "title": "…", "hook": "…", "body": "…",
    "cta": "…" | null,
    "preserved_phrases":  ["…"],
    "move_applied":       "…",
    "voice_devices_used": ["…"]
  }
}`;
}

export function buildCritiqueUser(_signal: LabSignal, questions: LabQuestion[], answers: string[], draft: LabScript): string {
  const qa = questions.map((q, i) => `שאלה ${i + 1}: ${q.q}\nתשובה: ${answers[i] ?? "(לא ענה/תה)"}`).join("\n\n");
  return `תשובות הלקוח הגולמיות (מקור המילים):

${qa}

הטיוטה של הסרטון שנכתבה:

Title: ${draft.title}
Hook:  ${draft.hook}
Body:  ${draft.body}
${draft.cta ? `CTA:   ${draft.cta}` : ""}

המילים שנטען שנשמרו: ${draft.preserved_phrases.join(" · ")}
מה נטען שהמהלך עשה: ${draft.move_applied}
מכניקות שנטען שהופעלו: ${(draft.voice_devices_used ?? []).join(" · ")}

עכשיו — בדוק, תן ציון, וסגור.`;
}

// ── Utility: extract just the chosen move's definition from the catalog ─

function extractMoveDefinition(name: SignatureMoveName): string {
  // Find the numbered entry that starts with "N. <name>" in the catalog.
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\n\\d+\\.\\s*${escaped}[\\s\\S]*?(?=\\n\\d+\\.\\s|\\n\\nעקרון|$)`, "u");
  const match = SIGNATURE_MOVES_CATALOG.match(re);
  return match ? match[0].trim() : `(הגדרה לא נמצאה בקטלוג עבור "${name}" — השתמש בשם המדויק בלבד.)`;
}
