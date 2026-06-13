/**
 * Content Kit Engine — the Hive-tier output of the Signal Engine.
 *
 * Takes the 9 signal fields plus occupation context and returns a full
 * branding starter pack: bios for every channel, a manifesto, a positioning
 * statement, an ideal-client persona, lead magnet ideas, a first-product
 * roadmap, 5 speaking topics, and 30 concrete content ideas.
 *
 * One Claude call returns all sections as structured JSON (~$0.02-0.03 per
 * generation, then cached on signal_extractions.signal.content_kit).
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

export const CONTENT_KIT_MODEL = "claude-sonnet-4-6";
export const CONTENT_KIT_MAX_TOKENS = 8000;

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

export const CONTENT_KIT_SYSTEM_PROMPT = `אתה מנהל מותגים אישי ב-beegood, מומחה בשיטת TrueSignal© של הדר דנן. אתה מקבל אות מותגי מלא של אדם (תוצר אבחון המנוע) ותחום עיסוק. אתה מחזיר חבילת תוכן מותגית מלאה שהאדם יכול להשתמש בה מיד.

ארבעת עקרונות השיטה (קבועים, אל תפר):
1. הבידול לא בעיסוק, באדם. שני אנשים באותו תחום נבדלים במי שהם, לא במה שהם עושים.
2. השליחות נולדת מהכאב הגדול ביותר.
3. האלמנט הוא הצומת של כישרון ותשוקה.
4. האות הוא החיבור: כאב + אלמנט.

חוקי כתיבה גלובליים (קריטי, אל תפר):
- עברית בלבד. בלי אנגלית, בלי לועזית מיותרת.
- בלי קלישאות שיווקיות: "המקצוען", "המוביל", "המוכשר", "פורץ הדרך", "מבטיח", "השואף", "המכוון לחדשנות".
- בלי מקפים ארוכים (em dash). רק נקודה או פסיק.
- בלי emoji, בלי markdown, בלי סימני קריאה לשיווק.
- כל מה שאתה כותב חייב להיות נגזר מהבידול האישי שכבר חולץ באות. לא תוכן גנרי שיכול להתאים לכל אחד באותו תחום.

קולות:
- כל מה שמיועד להתפרסם על ידי האדם (bio_short, bio_medium, bio_long, linkedin_headline, manifesto, lead_magnet_ideas, first_product_recommendation, speaking_topics, content_ideas_30): גוף ראשון של האדם המפרסם, או פנייה לקורא הפוטנציאלי. אסור גוף שני אל האדם עצמו.
- כל מה שמיועד לעיניי האדם בלבד (positioning_statement, persona_description): גוף שני אליו (אתה/את), המשך הקול של מנוע האות.

תיאור 11 השדות:

1. bio_short — בייו לאינסטגרם. עד 150 תווים. משפט אחד או שניים בגוף ראשון. דוגמה למבנה: "מנחה זוגות שמגיעים אחרי שכל המומחים אמרו שהם לא מתאימים." חד וקליל.

2. bio_medium — אבאוט קצר ללינקדאין. עד 300 תווים. 2-3 משפטים. מתחיל בפעולה ("עוזרת ל...", "בונה...", "מנחה...") וגומר באמירה אישית קטנה.

3. bio_long — אבאוט לדף "אודות" באתר. 150-220 מילים. מבנה: פתיחה אישית קצרה → מה אני עושה → למי → איך זה שונה ממה שמקובל בתחום → סיום עם אמירה רגשית קצרה. בלי "אני נולדתי ב...". בלי קלישאות.

4. linkedin_headline — הכותרת מתחת לשם בלינקדאין. עד 120 תווים. מבנה: [פעולה ספציפית] | [קהל מדויק] | [ייחוד]. דוגמה: "בונה מערכות שיווק לעסקים שאף מומחה לא האמין בהם | TrueSignal". בלי תארים גנריים.

5. manifesto — האני מאמין של האדם. 400-600 מילים. מבנה: 4-6 פסקאות, כל אחת מתחילה ב"אני מאמין ש..." או "אני יודע ש..." או "אני לא מסכים שcm...". הצהרות חדות שמושכות אלייו את הקהל הנכון ודוחות את הקהל הלא נכון. סיום עם משפט אחד שמסכם את העמדה כולה. זה לא רכך, זו עמדה.

6. positioning_statement — משפט אחד (עד 30 מילים) שמסכם את ההצעה הייחודית של האדם. בגוף שני אליו. דוגמה: "אתה הכתובת לעסקים שכבר ניסו את כל היועצים השמרניים ושמשהו עדיין לא מתחבר." זה לעין האדם בלבד, לא לפרסום.

7. persona_description — תיאור 150-200 מילים של הלקוח הפוטנציאלי הספציפי של האדם. לא דמוגרפיה. מה הוא מרגיש בבוקר, מה הוא מנסה ולא מצליח, מה הוא מתבייש להגיד, איפה הוא חיפש פתרון לפני שהוא הגיע. בגוף שלישי על הלקוח (כי האדם קורא את זה ומתעמק). זה לעין האדם בלבד, לא לפרסום.

8. lead_magnet_ideas — בדיוק 3 פריטים. כל פריט הוא משפט אחד או שניים שמתאר מה האדם יכול לתת חינם. צריך להיות ספציפי לאות שלו, לא רעיון גנרי. דוגמה: "PDF של 5 שאלות שאת שואלת כל זוג ב-15 הדקות הראשונות בטיפול". כל אחד מ-3 הפריטים צריך להיות שונה מהותית מהאחרים.

9. first_product_recommendation — המוצר/הצעה הראשונה שכדאי לאדם למכור. 80-120 מילים. מבנה: [שם המוצר] בעמוד נפרד למעלה, מתחת [פורמט: מפגש 1:1, סדנה, קורס, קהילה], [למי זה מתאים], [מחיר מומלץ], [מה מקבלים]. הצעה אחת ברורה, לא תפריט.

10. speaking_topics — בדיוק 5 פריטים. כל פריט הוא [כותרת הרצאה ב-strong] עם [שורה ריקה] [תקציר 50-80 מילים מה ההרצאה אומרת]. ההרצאות חייבות להיות נושאים שהאדם הוא הסמכות הטבעית להם, נגזרים מהבידול שלו, לא נושאים גנריים שכל אחד בתחום יכול להעביר.

11. content_ideas_30 — 30 רעיונות פוסט/וידאו/סיפור קצרים, כל אחד משפט אחד. שונים זה מזה במהותם. מערב: סיפור אישי, תובנה מקצועית, דעה שנויה במחלוקת, איך-לעשות, מאחורי הקלעים, קודקס מקצועי. כל אחד צריך להיות נגזר מהבידול של האדם, לא רעיון שיתאים לכל אחד בתחום.

פורמט הפלט — JSON תקין בלבד, ללא markdown code fences, ללא טקסט מסביב:

{
  "bio_short": "...",
  "bio_medium": "...",
  "bio_long": "...",
  "linkedin_headline": "...",
  "manifesto": "...",
  "positioning_statement": "...",
  "persona_description": "...",
  "lead_magnet_ideas": ["...", "...", "..."],
  "first_product_recommendation": "...",
  "speaking_topics": ["...", "...", "...", "...", "..."],
  "content_ideas_30": ["...", "...", ...] /* בדיוק 30 */
}`;

export function buildContentKitUserMessage(args: {
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
    "האות המלא של האדם (תוצר מנוע האות):",
    `מקור הכאב: ${args.pain_source}`,
    `האלמנט: ${args.element}`,
    `האות (משפט מרכזי): ${args.signal}`,
    `מה שהאות מבטיח: ${args.signal_promise}`,
    `הכלי המרכזי: ${args.central_tool}`,
    `האנשים שלך (הקהל): ${args.people}`,
    `הערה אישית: ${args.warm_note}`,
    "",
    "החזר את חבילת התוכן המלאה כ-JSON, על פי הסכמה.",
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
