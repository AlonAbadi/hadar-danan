/**
 * Signal Card Writer
 *
 * The signal-engine returns several fields meant as INTERNAL DESCRIPTIONS for
 * the signal owner ("your audience is X", "your signal promises Y", "post
 * about Z"). Those are analytical, third-person, and full of phrases like
 * "האות שלך מצביע" or "פוסט על". When we stamped those directly onto social
 * cards, every quote-* card read like a description of itself instead of
 * the message it should carry.
 *
 * This module takes each meta field plus the user's signal + occupation and
 * asks Claude Haiku to rewrite it as a finished audience-facing card line —
 * the actual copy that should appear on the 1080×1080 PNG. Output is cached
 * on the signal JSONB so each (extraction, card-type) pair pays for one
 * Haiku call exactly once.
 *
 * Per-type voice:
 *   quote-promise   → first-person offer to the audience ("אני עובד עם...")
 *   quote-people    → second-person recognition of the reader ("אם אתה...")
 *   quote-content-N → first-person post hook in the brand's own voice
 */

import Anthropic from "@anthropic-ai/sdk";

export type CardType =
  | "quote-promise"
  | "quote-people"
  | "quote-content-1"
  | "quote-content-2"
  | "quote-content-3";

export function needsCardWriter(assetType: string): assetType is CardType {
  return (
    assetType === "quote-promise" ||
    assetType === "quote-people" ||
    assetType === "quote-content-1" ||
    assetType === "quote-content-2" ||
    assetType === "quote-content-3"
  );
}

const PURPOSE: Record<CardType, string> = {
  "quote-promise":
    "הצהרת ה-offer של בעל המותג בגוף ראשון: 'אני עוזר ל___ ל___' או 'אני עובד עם ___'. " +
    "המשפט מסביר לקהל מה הוא מקבל מהאדם הזה — כמו tagline של מותג. " +
    "מקסימום 18 מילים. אסור 'האות שלך', אסור 'הכיוון שנפתח'.",
  "quote-people":
    "משפט שמזהה את הקורא ישירות בגוף שני: 'אם אתה ___', 'כשאתה ___', 'יש מקום שבו ___'. " +
    "הקורא חייב להרגיש שמדברים אליו, לא שמתארים אנשים-כמוהו לבעל המותג. " +
    "מקסימום 18 מילים. אסור גוף שלישי על 'הם'.",
  "quote-content-1":
    "Hook פותח של פוסט סושיאל בגוף ראשון של בעל המותג, כפי שהוא היה פותח פוסט אמיתי. " +
    "סיפור קצר, רגע ספציפי, או תובנה חדה — דבר שעוצר גלילה. " +
    "מקסימום 24 מילים. אסור 'פוסט על', אסור 'תוכן על', אסור 'דעה:'.",
  "quote-content-2":
    "Hook פותח של פוסט סושיאל בגוף ראשון של בעל המותג. " +
    "סיפור, רגע, או תובנה חדה. שונה בקול ובזווית מ-content-1 ו-content-3. " +
    "מקסימום 24 מילים. אסור 'פוסט על', אסור 'דעה:'.",
  "quote-content-3":
    "Hook פותח של פוסט סושיאל בגוף ראשון של בעל המותג. " +
    "סיפור, רגע, או תובנה חדה. שונה בקול ובזווית מ-content-1 ו-content-2. " +
    "מקסימום 24 מילים. אסור 'פוסט על', אסור 'דעה:'.",
};

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT_BASE = `אתה copywriter ישראלי שכותב טקסט לכרטיסי סושיאל בעברית עבור מותג אישי פרימיום.

המטרה: לקחת תיאור-מטא (איך בעל-המותג חושב על האות שלו) ולהפוך אותו לטקסט מוכן לפרסום על כרטיס 1080×1080.

חוקים מחייבים:

1. קצר. כרטיס שלא נקלט בקריאה אחת הוא כרטיס מת. שאף ל-8-22 מילים בסך הכל.
2. כל מילה מדברת אל הקהל, לא אל בעל-המותג. אם המקור אומר "האות שלך מצביע אל..." → הכרטיס אומר "אני עוזר ל...".
3. אסור "פוסט על", "תוכן על", "דעה:", "האות שלך מצביע", "הכיוון שנפתח", "תהליך של". אלה תיאורים, לא תוכן.
4. קול אנושי טבעי, כאילו האדם בעצמו פוסט את זה ברשת. בלי שיווקיות לבנה כמו "המסע שלך", "השינוי שלך הגיע", "הזמן שלך עכשיו".
5. בלי emoji, בלי גרשיים פותחות/סוגרות סביב הציטוט (הכרטיס עצמו הוא הציטוט), בלי קווים אופקיים, בלי hashtags.
6. אם המקור באנגלית, התוצאה בעברית.

`;

export async function writeCardText(args: {
  type:        CardType;
  sourceText:  string;
  signal:      string;
  occupation:  string | null;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const system = SYSTEM_PROMPT_BASE +
      `תפקיד הכרטיס שאתה כותב עכשיו:\n${PURPOSE[args.type]}`;

    const user = [
      "הקשר על האדם:",
      `- האות שלו: "${args.signal}"`,
      args.occupation && args.occupation.trim().length > 0
        ? `- תחום עיסוק: ${args.occupation.trim()}`
        : "- תחום עיסוק: לא נמסר",
      "",
      "המקור שאתה ממיר לטקסט הכרטיס:",
      `"${args.sourceText}"`,
      "",
      "כתוב רק את הטקסט שיופיע על הכרטיס. בלי הקדמה, בלי הסבר, בלי גרשיים מסביב.",
    ].join("\n");

    const client = new Anthropic();
    const res = await client.messages.create({
      model:      MODEL,
      max_tokens: 300,
      system,
      messages:   [{ role: "user", content: user }],
    });

    const block = res.content[0];
    if (!block || block.type !== "text") {
      return { ok: false, error: "Claude returned non-text block" };
    }

    // Strip leading/trailing quote marks if Claude added them despite the rule
    let text = block.text.trim();
    text = text.replace(/^[״"'„«]+/, "").replace(/[״"'"»]+$/, "").trim();

    if (text.length < 10) {
      return { ok: false, error: `Text too short: ${text.length} chars` };
    }
    if (text.length > 320) {
      return { ok: false, error: `Text too long: ${text.length} chars` };
    }

    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}
