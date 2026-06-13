/**
 * Content Kit Engine — the Hive-tier output of the Signal Engine.
 *
 * Takes the 9 signal fields plus occupation context and returns a full
 * branding starter pack: bios for every channel, a manifesto, a positioning
 * statement, an ideal-client persona, lead magnet ideas, a first-product
 * roadmap, 5 speaking topics, and 30 concrete content ideas.
 *
 * The kit is generated as THREE parallel Claude calls (rather than one
 * monolithic call) so each fits comfortably within Vercel's 60s function
 * timeout. Total wall time ~25s instead of ~60s.
 *
 * Strict rules carry over from the Signal Engine prompt:
 *   - Hebrew only, no English, no transliterations
 *   - No em-dashes (project-wide style rule)
 *   - No marketing clichés ("המקצוען", "המוביל", "השואף לחדשנות")
 *   - 2nd-person voice for anything addressed to the user (bios are 1st-person
 *     because they're written FOR the user to publish)
 *   - Built on the personal differentiation already extracted in the signal,
 *     never generic content that could apply to anyone in the field
 */

// Sonnet 4.6 is the right tool for these structured JSON outputs — Haiku
// truncates mid-string when output approaches max_tokens, producing invalid
// JSON. With four small parallel packs (rather than one big one) Sonnet
// fits comfortably under Vercel's 60s function timeout: wall time ~25s.
export const CONTENT_KIT_MODEL = "claude-sonnet-4-6";

export type ContentKit = {
  bio_short:                   string;
  bio_medium:                  string;
  bio_long:                    string;
  linkedin_headline:           string;
  manifesto:                   string;
  positioning_statement:       string;
  persona_description:         string;
  lead_magnet_ideas:           [string, string, string];
  first_product_recommendation: string;
  speaking_topics:             [string, string, string, string, string];
  content_ideas_30:            string[];
};

// ── Shared rules baked into every sub-prompt ──────────────────────────
const SHARED_RULES = `כללי כתיבה גלובליים (אסור להפר):
- עברית בלבד.
- בלי מקפים ארוכים (em dash). רק נקודה או פסיק.
- בלי קלישאות שיווקיות: "המקצוען", "המוביל", "פורץ הדרך", "השואף", "המבטיח".
- בלי emoji, בלי markdown, בלי סימני קריאה לשיווק.
- כל מה שאתה כותב חייב להיות נגזר מהבידול האישי שכבר חולץ באות. לא תוכן גנרי.`;

// ── Pack 1: Voice pack (bios + LinkedIn headline) ────────────────────
export const VOICE_PACK_MAX_TOKENS = 1500;
export const VOICE_PACK_SYSTEM = `אתה מנהל מותגים אישי ב-beegood. אתה מקבל אות מותגי של אדם, ומחזיר חבילת בייוז וכותרת לינקדאין.

${SHARED_RULES}

קולות:
- bio_short, bio_medium, bio_long, linkedin_headline: גוף ראשון של האדם המפרסם, או פנייה לקורא. אסור גוף שני אל האדם עצמו.

תיאור 4 השדות:

1. bio_short — בייו לאינסטגרם. עד 150 תווים. משפט אחד או שניים בגוף ראשון. דוגמה למבנה: "מנחה זוגות שמגיעים אחרי שכל המומחים אמרו שהם לא מתאימים." חד וקליל.

2. bio_medium — אבאוט קצר ללינקדאין. עד 300 תווים. 2-3 משפטים. מתחיל בפעולה ("עוזרת ל...", "בונה...") וגומר באמירה אישית קטנה.

3. bio_long — אבאוט לדף "אודות" באתר. 130-180 מילים בלבד. מבנה: פתיחה אישית קצרה, מה אני עושה, למי, איך זה שונה ממה שמקובל בתחום, סיום עם אמירה רגשית קצרה.

4. linkedin_headline — הכותרת מתחת לשם בלינקדאין. עד 120 תווים. מבנה: [פעולה ספציפית] | [קהל מדויק] | [ייחוד]. דוגמה: "בונה מערכות שיווק לעסקים שאף מומחה לא האמין בהם | TrueSignal". בלי תארים גנריים.

החזר JSON תקין בלבד, ללא markdown, ללא הסברים:
{"bio_short":"...","bio_medium":"...","bio_long":"...","linkedin_headline":"..."}`;

// ── Pack 2: Identity pack (manifesto + positioning + persona) ────────
export const IDENTITY_PACK_MAX_TOKENS = 2500;
export const IDENTITY_PACK_SYSTEM = `אתה מנהל מותגים אישי ב-beegood. אתה מקבל אות מותגי, ומחזיר שלוש הצהרות זהות עמוקות.

${SHARED_RULES}

קולות:
- manifesto: גוף ראשון של המפרסם. פנייה לקהל שלו לפעמים.
- positioning_statement: גוף שני אל האדם (אתה/את). זה לעיניו בלבד, לא לפרסום.
- persona_description: גוף שלישי על הלקוח שלו. זה לעיניו בלבד.

תיאור 3 השדות:

1. manifesto — האני מאמין של האדם. 300-450 מילים בלבד (לא יותר). מבנה: 4-5 פסקאות, כל אחת מתחילה ב"אני מאמין ש..." או "אני יודע ש..." או "אני לא מסכים ש...". הצהרות חדות שמושכות את הקהל הנכון ודוחות את הקהל הלא נכון. סיום עם משפט אחד שמסכם את העמדה. זה לא רכך, זו עמדה.

2. positioning_statement — משפט אחד (עד 30 מילים) שמסכם את ההצעה הייחודית של האדם. בגוף שני אליו. דוגמה: "אתה הכתובת לעסקים שכבר ניסו את כל היועצים השמרניים ושמשהו עדיין לא מתחבר."

3. persona_description — תיאור 150-200 מילים של הלקוח הפוטנציאלי הספציפי. לא דמוגרפיה. מה הוא מרגיש בבוקר, מה הוא מנסה ולא מצליח, מה הוא מתבייש להגיד, איפה הוא חיפש פתרון לפני שהגיע. גוף שלישי על הלקוח.

החזר JSON תקין בלבד, ללא markdown:
{"manifesto":"...","positioning_statement":"...","persona_description":"..."}`;

// ── Pack 3: Strategy basics (lead magnets + first product + speaking) ─
export const STRATEGY_PACK_MAX_TOKENS = 1500;
export const STRATEGY_PACK_SYSTEM = `אתה יועץ אסטרטגי ב-beegood. אתה מקבל אות מותגי, ומחזיר חבילת אסטרטגיה: מגנטי לידים, מוצר ראשון, נושאי הרצאה.

${SHARED_RULES}

קולות:
- כל השדות בגוף ראשון של המפרסם או פנייה לקהל. אסור גוף שני אל האדם עצמו.

תיאור 3 השדות:

1. lead_magnet_ideas — בדיוק 3 פריטים. כל פריט הוא משפט אחד או שניים שמתאר מה האדם יכול לתת חינם. ספציפי לאות שלו, לא רעיון גנרי. דוגמה: "PDF של 5 שאלות שאת שואלת כל זוג ב-15 הדקות הראשונות בטיפול". 3 פריטים שונים מהותית.

2. first_product_recommendation — המוצר/הצעה הראשונה שכדאי לאדם למכור. 80-120 מילים. מבנה: [שם המוצר], [פורמט: מפגש 1:1, סדנה, קורס, קהילה], [למי זה מתאים], [מחיר מומלץ בש"ח], [מה מקבלים]. הצעה אחת ברורה, לא תפריט.

3. speaking_topics — בדיוק 5 פריטים. כל פריט: [כותרת ההרצאה] שורה ריווח [תקציר 35-55 מילים]. ההרצאות חייבות להיות נושאים שהאדם הוא הסמכות הטבעית להם, נגזרים מהבידול, לא נושאים גנריים.

החזר JSON תקין בלבד, ללא markdown:
{"lead_magnet_ideas":["...","...","..."],"first_product_recommendation":"...","speaking_topics":["...","...","...","...","..."]}`;

// ── Pack 4: 30 content ideas only ─────────────────────────────────────
// 2500 tokens gives ~80 tokens per idea — plenty for the 25-word target
// (~30 tokens each) plus JSON overhead. Previous 1800 was getting truncated.
export const CONTENT_PACK_MAX_TOKENS = 2500;
export const CONTENT_PACK_SYSTEM = `אתה יועץ תוכן ב-beegood. אתה מקבל אות מותגי, ומחזיר 30 רעיונות תוכן ספציפיים.

${SHARED_RULES}

הקול: גוף ראשון של המפרסם או פנייה לקהל.

content_ideas_30 — 30 רעיונות פוסט/וידאו/סיפור קצרים. כל אחד משפט אחד, עד 25 מילים. שונים זה מזה במהותם. מערב את הסוגים האלה: סיפור אישי, תובנה מקצועית, דעה שנויה במחלוקת, איך-לעשות, מאחורי הקלעים, רשימה, השוואה, פנייה לקהל ספציפי. כל רעיון חייב להיות נגזר מהבידול האישי שכבר חולץ. לא רעיון גנרי שיתאים לכל אחד בתחום.

החזר JSON תקין בלבד, ללא markdown:
{"content_ideas_30":[/* 30 פריטים, כל אחד מחרוזת אחת */]}`;

// ── Builder for the user-message context (same for all 3 packs) ──────
export function buildContextMessage(args: {
  signal:          string;
  signal_promise:  string;
  pain_source:     string;
  element:         string;
  central_tool:    string;
  people:          string;
  warm_note:       string;
  occupation?:     string | null;
  firstName?:      string | null;
}): string {
  const occupationLine = args.occupation && args.occupation.trim().length > 0
    ? `תחום עיסוק: ${args.occupation.trim()}`
    : "תחום עיסוק: לא נמסר. הסק את התחום מהכלי המרכזי + הקהל.";

  return [
    args.firstName ? `שם פרטי: ${args.firstName}` : "",
    occupationLine,
    "",
    "האות המלא של האדם:",
    `מקור הכאב: ${args.pain_source}`,
    `האלמנט: ${args.element}`,
    `האות (משפט מרכזי): ${args.signal}`,
    `מה שהאות מבטיח: ${args.signal_promise}`,
    `הכלי המרכזי: ${args.central_tool}`,
    `הקהל: ${args.people}`,
    `הערה אישית: ${args.warm_note}`,
    "",
    "החזר JSON על פי הסכמה במערכת.",
  ].filter(Boolean).join("\n");
}

export function validateContentKit(value: unknown): value is ContentKit {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  const requiredStrings: (keyof ContentKit)[] = [
    "bio_short", "bio_medium", "bio_long", "linkedin_headline",
    "manifesto", "positioning_statement", "persona_description",
    "first_product_recommendation",
  ];
  for (const k of requiredStrings) {
    if (typeof v[k] !== "string" || (v[k] as string).trim().length === 0) return false;
  }

  const ideas = v.lead_magnet_ideas;
  if (!Array.isArray(ideas) || ideas.length !== 3) return false;
  if (!ideas.every(s => typeof s === "string" && s.trim().length > 0)) return false;

  const topics = v.speaking_topics;
  if (!Array.isArray(topics) || topics.length !== 5) return false;
  if (!topics.every(s => typeof s === "string" && s.trim().length > 0)) return false;

  const content = v.content_ideas_30;
  if (!Array.isArray(content) || content.length < 25 || content.length > 35) return false;
  if (!content.every(s => typeof s === "string" && s.trim().length > 0)) return false;

  return true;
}
