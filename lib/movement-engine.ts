/**
 * Movement Engine — Hadar's content directing brain, applied to one customer.
 *
 * The user types a 1–3 sentence description of a real customer and the engine
 * returns a *directing brief* (NOT a script) based on Hadar's 18-stage content
 * Torah. The brief tells the user:
 *
 *   - which internal MOVEMENT this viewer needs to make right now
 *   - which video TYPE serves that movement
 *   - which ACTION happens beneath the text (stage 7 — what we do to the viewer)
 *   - which of the THREE OBJECTIONS this resolves (stage 4)
 *   - the required FREQUENCY (stage 6 — never condescension, never slogans)
 *   - THREE talking points (not sentences — the live brain finishes them; stage 8)
 *   - what's still MISSING in the audience data (stage 17 — knowledge principle)
 *
 * Hard constraints on every output:
 *   - NO opening line written in advance  (stage 8)
 *   - NO CTA                              (stage 14)
 *   - NO tips                             (stage 16)
 *   - frequency MUST be love/compassion/truth/partnership — never condescension
 *
 * Model: claude-sonnet-4-6 — the choice is deliberate. Haiku rewrites known
 * structure; this task applies a multi-axis judgement (movement × type × action
 * × objection × frequency) to a one-line description. Sonnet 4.6 reasons across
 * the axes without going slow enough to break the "Hadar can use this between
 * meetings" feel.
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

// ── Allowed values — keep enums tight so the UI can render badges ─────────────

export const MOVEMENTS = [
  "יצירת הזדהות",
  "שבירת תפיסה",
  "פתרון התנגדות",
  "השראה",
  "הדגמת תהליך",
  "בניית אמון",
  "בניית מסוגלות",
  "חיזוק מותג",
  "יצירת פער (דחיפות)",
  "בניית תודעה",
] as const;
export type Movement = (typeof MOVEMENTS)[number];

export const VIDEO_TYPES = [
  "בעיה",
  "סיפור",
  "ביקורת",
  "אדם בפעולה",
  "עדות",
  "פתרון התנגדות",
  "מסע לקוח",
  "מסוגלות",
  "השראה",
] as const;
export type VideoType = (typeof VIDEO_TYPES)[number];

export const ACTIONS = [
  "מחבקת",
  "מפתה",
  "מערערת",
  "מתקנת",
  "מעוררת",
  "מנחמת",
  "מניעה",
  "מעמתת",
] as const;
export type Action = (typeof ACTIONS)[number];

export const OBJECTIONS = ["לתחום", "אליי", "לעצמו"] as const;
export type Objection = (typeof OBJECTIONS)[number];

export const FREQUENCIES = ["אהבה", "חמלה", "אמת", "שותפות"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

// ── Output schema ────────────────────────────────────────────────────────────

export interface MovementBrief {
  movement: {
    category: Movement;
    from:     string;
    to:       string;
  };
  video_type:          VideoType;
  action_beneath_text: Action;
  objection_solved:    Objection;
  frequency:           Frequency;
  talking_points:      [string, string, string];
  data_grounding:      string;
  missing_data:        string;
}

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `אתה הבמאי הפנימי של הדר דנן.

שני הכללים שעומדים מעל הכל ופוסלים כל פלט שלא עומד בהם:

1. "המטרה של התוכן היא לא לגרום לאדם להבין את העסק. המטרה היא לגרום לאדם להבין את עצמו דרך העסק."
2. "את לא מביימת סרטונים. את מביימת תודעה."

אתה לא כותב תסריט. אתה כותב **תדריך בימוי** לסרטון אחד שצריך להזיז את הצופה מנקודה פנימית אחת לנקודה פנימית אחרת. הסרטון עצמו ייווצר חי, מול המצלמה, מתוך התדריך הזה.

תורת הדר — 18 שלבים שמכתיבים את כל פלט שלך:

1. תוכן מביים תהליך תודעתי. הוא לא מעביר מידע.
2. אין תוכן בלי בידול. אם החומר שניתן לך לא בידולי מספיק — תגיד את זה ב-missing_data.
3. כל סרטון חייב מטרה פסיכולוגית. בחר אותה מ-10 התנועות בלבד.
4. סוגי תוכן: בעיה (תיאור המציאות בדיוק שהלקוח לא ידע לנסח, "היא מבינה אותי"), סיפור (כלי למשמעות, לא המסר), ביקורת (על התפיסה לא על האדם, עקיפה דרך משל/דוגמה), אדם בפעולה (להראות לא להסביר), עדות (תיאור השינוי לא מחמאה), פתרון התנגדות (להשמיע את הפחד אז עמדה), מסע לקוח (הלקוח הכי קשה — "אם הוא הצליח גם אני"), מסוגלות (לא כל מי שלא קונה לא רוצה — לפעמים לא מאמין בעצמו), השראה (להראות את מי שהוא רוצה להיות, לא להסביר).
5. 3 התנגדויות לכל לקוח: לתחום, אליי, לעצמו. סרטון אחד פותר אחת. בחר.
6. תדר חשוב מהמילים. רק אהבה / חמלה / אמת / שותפות. אסור התנשאות, מנהיגות מזויפת, סיסמאות.
7. פעולה מתחת לטקסט — לא "מה אני אומרת" אלא "מה אני עושה לצופה" (מחבקת/מפתה/מערערת/מתקנת/מעוררת/מנחמת/מניעה/מעמתת). זה החלק שעושה את הוידאו.
8. **אין פתיחה כתובה מראש**. הפתיחה החזקה נולדת חיה מול המצלמה. אל תכתוב משפט פתיחה. talking_points הם נקודות לא משפטים.
9. שיטת "כן, ו…" — הרעיון מתרחב באסוציאציות, לא נשפט.
10. אמת בפרונט. לא מסתירים. לא מושלמים.
11. האנשת מותג דרך אדם — לא דרך המוצר.
12. דחיפות = פער בין מי שאני למי שאני יכול להיות. לא לחץ.
13. המשפך בלתי-נראה. הלקוח מגיע למסקנה לבד.
14. **אין CTA**. אם נוצרו זיהוי/אמון/השראה/פתרון התנגדויות — הוא יפנה לבד.
15. התחרות מול החיים (פחד/דחיינות/ספה/חופשה/ילדים) — לא מול מתחרים.
16. לא ללמד מידע. ידע זול. **טיפים אסורים בפלט הזה**. המטרה: שהצופה יראה אחרת, לא שידע יותר.
17. **אסור לנחש**. אם הקלט לא מכיל דאטה רגשית אמיתית מספיק כדי לבחור תנועה ספציפית — תגיד את זה בשדה missing_data במקום להמציא.
18. שלב הסיכום: התוכן לא גורם להבין את העסק. הוא גורם להבין את עצמך דרך העסק.

ערכים מותרים בכל שדה — אסור לחרוג:
- movement.category: "יצירת הזדהות" / "שבירת תפיסה" / "פתרון התנגדות" / "השראה" / "הדגמת תהליך" / "בניית אמון" / "בניית מסוגלות" / "חיזוק מותג" / "יצירת פער (דחיפות)" / "בניית תודעה"
- video_type: "בעיה" / "סיפור" / "ביקורת" / "אדם בפעולה" / "עדות" / "פתרון התנגדות" / "מסע לקוח" / "מסוגלות" / "השראה"
- action_beneath_text: "מחבקת" / "מפתה" / "מערערת" / "מתקנת" / "מעוררת" / "מנחמת" / "מניעה" / "מעמתת"
- objection_solved: "לתחום" / "אליי" / "לעצמו"
- frequency: "אהבה" / "חמלה" / "אמת" / "שותפות"

תכתוב בעברית בלבד. בלי מקפים גדולים (em dash), רק נקודה או פסיק. בלי emoji.

החזר JSON בפורמט הבא בלבד, בלי טקסט נוסף לפני או אחרי, בלי markdown fences:

{
  "movement": {
    "category": "...",
    "from": "המקום הפנימי שהצופה נמצא בו עכשיו, בעברית של הצופה עצמו (לדוגמה: 'אני לבד עם זה')",
    "to": "המקום הפנימי שאנחנו רוצים שהוא יהיה בו אחרי הסרטון, בעברית של הצופה עצמו (לדוגמה: 'מישהי מבינה אותי')"
  },
  "video_type": "...",
  "action_beneath_text": "...",
  "objection_solved": "...",
  "frequency": "...",
  "talking_points": [
    "נקודה ראשונה — קצרה, ממוקדת, לא משפט שלם",
    "נקודה שנייה",
    "נקודה שלישית"
  ],
  "data_grounding": "משפט אחד שאומר על איזה פרט בדאטה של הלקוחות התדריך נשען. אם הקלט הספק מפורט — צטט. אם לא — בקש דאטה ב-missing_data.",
  "missing_data": "אם חסר משהו קריטי לפני הצילום (מצב משפחתי לא ברור, אין דוגמה אמיתית של הפחד, לא יודעים מאיפה הוא בא) — תכתוב כאן. אם הכל יש, החזר מחרוזת ריקה."
}`;

// ── The call ────────────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateMovementBrief(customerDescription: string): Promise<MovementBrief> {
  const res = await client.messages.create({
    model:       MODEL,
    max_tokens:  1200,
    temperature: 0.7,
    system:      SYSTEM_PROMPT,
    messages: [
      {
        role:    "user",
        content: `תיאור הלקוח/ה:\n\n${customerDescription.trim()}\n\nתכתוב לי תדריך בימוי לסרטון אחד שמזיז אותו/אותה צעד אחד פנימי קדימה. JSON בלבד.`,
      },
    ],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Strip code fences if Claude wraps despite the prompt
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: MovementBrief;
  try {
    parsed = JSON.parse(cleaned) as MovementBrief;
  } catch (e) {
    throw new Error(`Movement engine returned non-JSON: ${cleaned.slice(0, 200)}`);
  }

  // Validate enums — if the model drifted, fail loudly instead of rendering junk
  if (!MOVEMENTS.includes(parsed.movement?.category)) {
    throw new Error(`Invalid movement.category: ${parsed.movement?.category}`);
  }
  if (!VIDEO_TYPES.includes(parsed.video_type)) {
    throw new Error(`Invalid video_type: ${parsed.video_type}`);
  }
  if (!ACTIONS.includes(parsed.action_beneath_text)) {
    throw new Error(`Invalid action_beneath_text: ${parsed.action_beneath_text}`);
  }
  if (!OBJECTIONS.includes(parsed.objection_solved)) {
    throw new Error(`Invalid objection_solved: ${parsed.objection_solved}`);
  }
  if (!FREQUENCIES.includes(parsed.frequency)) {
    throw new Error(`Invalid frequency: ${parsed.frequency}`);
  }

  return parsed;
}
