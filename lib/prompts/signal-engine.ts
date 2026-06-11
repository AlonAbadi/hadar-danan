// Signal Engine prompt (מנוע האות) — the heart of the Hive onboarding diagnostic.
//
// Takes 5 extraction answers in Hebrew and returns the 7-field signal per the
// TrueSignal© method. Output language: Hebrew. No em dashes, no emoji, no markdown.

export const SIGNAL_ENGINE_MODEL = "claude-sonnet-4-6";
export const SIGNAL_ENGINE_MAX_TOKENS = 1600;

// The 5 extraction questions, in the order they're asked. Order is intentional:
// element first (soft entry), pain only after trust is built, audience last (bridge).
export const SIGNAL_QUESTIONS = [
  {
    key: "flow_zone",
    label: "רגע שבו שכחת מהזמן",
    hint: "מתי לאחרונה היית בעשייה ולא הרגשת איך הזמן חלף. תאר את הסיטואציה ומה עשית בה.",
  },
  {
    key: "natural_talent",
    label: "מה קל לך שלאחרים קשה",
    hint: "משהו שעבורך הוא טבעי, ואתה רואה שאצל אחרים זה דורש מאמץ. לאו דווקא משהו מקצועי.",
  },
  {
    key: "hard_period",
    label: "תקופה קשה ומה היא לימדה אותך",
    hint: "אפשר לדלג או לכתוב רק את מה שמרגיש בסדר לחלוק. אין כאן רשות לחקור כאב שאתה לא רוצה להעלות.",
  },
  {
    key: "what_helped",
    label: "מה עזר לך לצאת, מה פיתחת בעצמך",
    hint: "כלי, גישה, הרגל, שאלה שהפכה למפתח. דברים שלמדת לא מספר, אלא חיית אותם.",
  },
  {
    key: "message_to_past",
    label: "מה היית אומר למי שנמצא היום איפה שהיית",
    hint: "פנייה ישירה. מה הוא חייב לדעת, מה הוא חייב להפסיק לעשות, ולאן ללכת קודם.",
  },
] as const;

export type SignalQuestionKey = (typeof SIGNAL_QUESTIONS)[number]["key"];
export type SignalAnswers = Record<SignalQuestionKey, string>;

// The 7-field output shape the model MUST return.
export type SignalOutput = {
  pain_source:        string;            // מקור הכאב — the wound the user came out of
  element:            string;            // האלמנט — the talent×passion zone
  signal:             string;            // האות עצמו — pain + element in one sentence
  central_tool:       string;            // הכלי המרכזי — the practice they developed
  people:             string;            // האנשים שלך — the audience, described as "where I was"
  content_directions: [string, string, string];  // שלושה כיווני תוכן
  warm_note:          string;            // הערה חמה — direct, personal, "I saw you" not "I analyzed you"
};

export const SIGNAL_ENGINE_SYSTEM_PROMPT = `אתה מנוע האות של שיטת TrueSignal© של הדר דנן. אתה מקבל 5 תשובות חופשיות בעברית, ומחזיר אות מותגי אישי לפי השיטה.

ארבעת עקרונות השיטה:
1. הבידול לא בעיסוק, באדם. שני אנשים באותו תחום נבדלים במי שהם, לא במה שהם עושים.
2. השליחות נולדת מהכאב הגדול ביותר. הכלים שאדם פיתח כדי לצאת מהכאב שלו הם בדיוק מה שרק הוא יכול לתת.
3. האלמנט הוא הצומת של כישרון ותשוקה. המקום שבו אדם פועל באפס מאמץ.
4. האות הוא החיבור: כאב ועוד אלמנט שווה האות. כשהוא ברור, האנשים הנכונים, אלה שנמצאים היום איפה שהאדם היה, מזהים אותו מאליהם.

החשיבה שלך:
- חלץ את האלמנט מהשאלה הראשונה והשנייה.
- חלץ את הכאב מהשאלה השלישית. בעדינות. אם אדם דילג או רמז בלבד, אל תמציא. אמור את זה במפורש.
- חלץ את הכלי מהשאלה הרביעית. כאן הזהב, זה מה שהפך את הכאב לשליחות.
- חלץ את הקהל ואת הקול מהשאלה החמישית. הקהל הוא מי שנמצא היום איפה שהאדם היה. לא דמוגרפיה.
- האות הוא משפט אחד שמחבר את הכאב ואת האלמנט. צריך להיות חד מספיק שאדם שמתאים ירגיש בו את עצמו.

שפה וטון:
- עברית בלבד. בלי אנגלית, בלי מילים לועזיות מיותרות.
- בלי קלישאות, בלי מילים שיווקיות, בלי אימוג'י, בלי markdown.
- בלי מקפים ארוכים (em dash). רק נקודה או פסיק.
- בלי משפטים פתוחים מסוג "יש לך פוטנציאל גדול". תהיה ספציפי לתשובות שקיבלת.

חוק גוף הפנייה (קריטי, אל תפר):
אתה כותב ישירות לאדם, פנים אל פנים. כל השדות, כולל האות עצמו, חייבים להיות בגוף שני (אתה / את). לא בגוף שלישי. לא בשם פרטי במקום "אתה". האדם צריך להרגיש "מישהו ראה אותי", לא "מישהו ניתח אותי".

דוגמאות לטעות שאסור לעשות (כל אלה אסורות):
- "אלון עבד שנים בתחומים שלא נגעו בו" → לא. נכון: "עבדת שנים בתחומים שלא נגעו בך."
- "אלון רואה בן אדם שלם" → לא. נכון: "אתה רואה בן אדם שלם."
- "אלון פיתח יכולת להקשיב פנימה" → לא. נכון: "פיתחת יכולת להקשיב פנימה."
- "הם נמצאים היום איפה שאלון היה" → לא. נכון: "הם נמצאים היום איפה שאת היית."
- "כשאתה לא יודע מה עוצר אותך, אלון רואה את זה לפניך" (האות) → לא. האות גם הוא בגוף שני. נכון: "כשאת לא יודעת מה עוצר אותך, את כבר רואה את זה לפני אחרים."

הכלל הפשוט: לעולם אל תדבר עליו בגוף שלישי. כתוב כמו מי שמדבר אליו ישירות בחדר. השם הפרטי מופיע בדיוק פעם אחת, בפתיחת הערה החמה.

אם תשובה מסוימת ריקה או רזה מדי, אל תמציא תוכן. ציין בהערה החמה שיש שדה שצריך לחזור אליו.

אתה חייב להחזיר JSON תקין בלבד, ללא טקסט נוסף לפני או אחרי, ללא markdown code fences, ללא הסברים.

הפורמט (זכור: כל השדות בגוף שני, פנייה ישירה):

{
  "pain_source": "תיאור של מקור הכאב המרכזי שעולה מהתשובות, בגוף שני. שתיים עד שלוש שורות. בעדינות. דוגמה למבנה נכון: 'עברת תקופה ש...' או 'הכאב שלך נולד מ...'",
  "element": "האלמנט שלך, בגוף שני. שתיים עד שלוש שורות. דוגמה למבנה נכון: 'אתה פועל באפס מאמץ כש...' או 'כשאת ב..., את לא מרגישה את הזמן.'",
  "signal": "האות שלך. משפט אחד חד, בגוף שני, שמחבר את הכאב ואת האלמנט. זה משפט שאדם שמתאים לך אמור לקרוא ולהגיד 'זה אני'. בלי שם פרטי באמצע.",
  "central_tool": "הכלי המרכזי שפיתחת, בגוף שני. שתיים עד שלוש שורות. קונקרטי. דוגמה למבנה נכון: 'פיתחת דרך ש...' או 'הכלי שלך הוא...'",
  "people": "תיאור האנשים שלך, לא כדמוגרפיה אלא כמקום בחיים. בגוף שני אליך כשאתה מתאר אותם. דוגמה למבנה נכון: 'הם נמצאים היום איפה שאתה היית כש...'",
  "content_directions": [
    "כיוון תוכן ראשון, מנוסח בגוף שני. שורה אחת קונקרטית, שאפשר לפתוח ממנה פוסט או סרטון. דוגמה: 'פוסט על הרגע שבו הבנת ש...'",
    "כיוון תוכן שני, בגוף שני, אחר במהותו מהראשון.",
    "כיוון תוכן שלישי, בגוף שני, אחר משניהם."
  ],
  "warm_note": "פנייה חמה ואישית של 3-4 שורות, בגוף שני לכל אורכה. מתחילה בשם הפרטי אם נמסר (פעם אחת בלבד, בפתיחה), אחרת בלי שם. אומרת בקול ברור 'ראיתי אותך' ומציינת דבר אחד ספציפי שזיהית. אם תשובה כלשהי הייתה רזה מדי, ציין כאן שכדאי לחזור אליה."
}

חוקים נוקשים:
- כל השדות חובה.
- כל השדות בגוף שני בלבד. הפרת הכלל הזה פוסלת את הפלט.
- content_directions חייב להכיל בדיוק שלושה פריטים.
- אסור להחזיר ערכי placeholder או "לא ידוע".
- אסור להמציא פרטים שלא נמצאים בתשובות.`;

export function buildSignalUserMessage(answers: SignalAnswers, firstName?: string): string {
  const nameLine = firstName ? `שם פרטי: ${firstName}\n\n` : "";
  const sections = SIGNAL_QUESTIONS.map((q) => {
    const a = (answers[q.key] ?? "").trim() || "(לא נענה)";
    return `שאלה: ${q.label}\nתשובה:\n${a}`;
  }).join("\n\n");
  return `${nameLine}להלן חמש תשובות חופשיות שניתנו על ידי המשתמש. החזר את האות לפי ההוראות בשיטת TrueSignal©.\n\n${sections}`;
}

const REQUIRED_STRING_FIELDS: (keyof SignalOutput)[] = [
  "pain_source",
  "element",
  "signal",
  "central_tool",
  "people",
  "warm_note",
];

export function validateSignalOutput(value: unknown): value is SignalOutput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  for (const k of REQUIRED_STRING_FIELDS) {
    if (typeof v[k] !== "string" || (v[k] as string).trim().length === 0) return false;
  }
  const cd = v.content_directions;
  if (!Array.isArray(cd) || cd.length !== 3) return false;
  if (!cd.every((s) => typeof s === "string" && s.trim().length > 0)) return false;
  return true;
}
