/**
 * Signal Engine v2 — the /kriah (unified funnel) variant.
 *
 * NOT a rewrite: a surgical derivative of the v1 system prompt. Every
 * replacement below is asserted, so if v1 evolves and an anchor string
 * disappears, the build fails loudly instead of silently shipping a
 * half-patched prompt.
 *
 * What changes vs v1:
 *  1. Six questions, referenced BY KEY (v1's ordinal references — "השאלה
 *     השלישית" — silently misread the v2 question order).
 *  2. gratitude_mirror (new Q3) gets its own extraction block: the
 *     voice-of-client quote is differentiation seen from outside.
 *  3. Authorial voice is the beegood TEAM (plural: "זיהינו", "ראינו") —
 *     never Hadar-first-person-singular. Addressee stays second-person
 *     singular gender-derived (unchanged, keeps card + downstream intact).
 *  4. Latin-letter names are never used in the output.
 */

import { SIGNAL_ENGINE_SYSTEM_PROMPT } from "./signal-engine";

export const SIGNAL_QUESTIONS_V2 = [
  { key: "flow_zone",          label: "רגע שבו שכחת מהזמן" },
  { key: "effortless_mastery", label: "מה הדבר שאנשים עוצרים לידו ואומרים לך \"רגע, מאיפה היכולת הזאת?\"" },
  { key: "gratitude_mirror",   label: "על מה אנשים מודים לך הכי הרבה?" },
  { key: "hard_period",        label: "תקופה קשה שעברת. לא צריך את כל הסיפור, רק רגע אחד מתוכה. (דילוג מותר)" },
  { key: "what_helped",        label: "מה עזר לך לצאת מזה, מה פיתחת בעצמך" },
  { key: "message_to_past",    label: "משפט אחד למי שנמצא היום בדיוק איפה שהיית אז" },
] as const;

export type SignalQuestionV2Key = (typeof SIGNAL_QUESTIONS_V2)[number]["key"];

/** v2 answers: the six kriah keys, all optional at the type level (hard_period is skippable). */
export type SignalAnswersV2 = Partial<Record<SignalQuestionV2Key, string>>;

function mustReplace(src: string, from: string, to: string): string {
  if (!src.includes(from)) {
    throw new Error(
      `signal-engine-v2: anchor not found in v1 prompt (v1 changed?): ${from.slice(0, 60)}...`
    );
  }
  return src.replace(from, to);
}

function deriveV2Prompt(): string {
  let p = SIGNAL_ENGINE_SYSTEM_PROMPT;

  // 1. Header: six answers, some possibly empty.
  p = mustReplace(
    p,
    "אתה מקבל 5 תשובות חופשיות בעברית, ומחזיר אות מותגי אישי לפי השיטה.",
    "אתה מקבל שש תשובות חופשיות בעברית (חלקן עשויות להיות ריקות או מדולגות), ומחזיר אות מותגי אישי לפי השיטה. כל תשובה מסומנת במפתח שלה. התייחס לשאלות אך ורק לפי המפתח, לעולם לא לפי מספר סידורי.",
  );

  // 2. The extraction map — by key, with the gratitude block added.
  p = mustReplace(
    p,
    `החשיבה שלך:
- חלץ את האלמנט מהשאלה הראשונה והשנייה.
- שאלה 2 (מה קל לך עד שקשה להסביר איך): מחלצת את הזווית הייחודית של האדם - היכולת שהפכה אצלו לאוטומטית עד שהוא לא מודע לה כנכס. זה לא "במה הוא טוב" (בזה רבים טובים) אלא הדבר שרק הוא עושה בדרך הזו.`,
    `החשיבה שלך (הפניה לפי מפתח בלבד):
- חלץ את האלמנט מ-flow_zone ומ-effortless_mastery.
- effortless_mastery ("רגע, מאיפה היכולת הזאת?"): מחלצת את הזווית הייחודית של האדם דרך עיניים חיצוניות - היכולת שאחרים עוצרים לידה והוא עצמו כבר לא רואה כנכס. זה לא "במה הוא טוב" (בזה רבים טובים) אלא הדבר שרק הוא עושה בדרך הזו.
- gratitude_mirror ("על מה אנשים מודים לך הכי הרבה?"): זה קול-הלקוח. תודה אמיתית שאדם קיבל היא הבידול שלו כפי שהוא נראה מבחוץ, במילים של מי שקיבל. אם יש שם ציטוט או כמעט-ציטוט, הוא זהב: עגן בו את signal או את public_card_statement. תודה מחבר או קולגה שווה בדיוק כמו תודה מלקוח משלם. אל תתרגם את התודה לשפה שיווקית, השאר את החומר האנושי שלה.`,
  );

  p = mustReplace(
    p,
    "- חלץ את הכאב מהשאלה השלישית, בעדינות, לפי עיקרון כתיבה 2: כקרקע שצמחה ממנה ראייה, לא כמרכז זהות. אם אדם דילג או רמז בלבד, אל תמציא. אמור את זה במפורש.",
    "- חלץ את הכאב מ-hard_period, בעדינות, לפי עיקרון כתיבה 2: כקרקע שצמחה ממנה ראייה, לא כמרכז זהות. הדילוג על השאלה הזו הוא בחירה לגיטימית ומכובדת: אם היא ריקה, אל תמציא כאב, אל תרמוז שחסר משהו, ואל תציין את הדילוג. בנה את האות מהחומר שכן ניתן, ובמקרה כזה what_helped נקרא כ\"מה שפיתחת בעצמך\" בלי עוגן הכאב.",
  );

  p = mustReplace(
    p,
    "- חלץ את הכלי מהשאלה הרביעית. כאן הזהב, זה מה שצמח מתוך הקושי והפך לשליחות.",
    "- חלץ את הכלי מ-what_helped. כאן הזהב, זה מה שצמח מתוך הקושי (או מתוך הדרך, אם hard_period דולגה) והפך לשליחות.",
  );

  p = mustReplace(
    p,
    "- חלץ את הקהל ואת הקול מהשאלה החמישית. הקהל הוא מי שנמצא היום איפה שהאדם היה. לא דמוגרפיה. שים לב: השאלה החמישית מנוסחת כפנייה לעצמי-בעבר, וזה מכוון.",
    "- חלץ את הקהל ואת הקול מ-message_to_past. הקהל הוא מי שנמצא היום איפה שהאדם היה. לא דמוגרפיה. שים לב: message_to_past מנוסחת כפנייה לעצמי-בעבר, וזה מכוון.",
  );

  // 3. thin_answer_keys gains gratitude_mirror.
  p = mustReplace(
    p,
    `בחר מתוך: ["flow_zone", "effortless_mastery", "hard_period", "what_helped", "message_to_past"]. שאלה 3 (hard_period) שדולגה במכוון לא נחשבת רזה - היא בחירה מותרת.`,
    `בחר מתוך: ["flow_zone", "effortless_mastery", "gratitude_mirror", "hard_period", "what_helped", "message_to_past"]. hard_period שדולגה במכוון לא נחשבת רזה - היא בחירה מותרת.`,
  );

  // 4. Team authorial voice: the warm_note exception + field description.
  p = mustReplace(
    p,
    "חריג יחיד: warm_note רשאי להתחיל בשם הפרטי + אמירה של \"ראיתי אותך\" - אבל גם שם בלי לטעון כלים (\"קראתי\", \"ניתחתי\", \"בדקתי\"). חם, לא מטא.",
    "חריג יחיד: warm_note רשאי להתחיל בשם הפרטי + אמירה של \"ראינו אותך\" - אבל גם שם בלי לטעון כלים (\"קראנו\", \"ניתחנו\", \"בדקנו\"). חם, לא מטא. קול הכותב הוא צוות (רבים): \"זיהינו\", \"ראינו\", \"שמנו לב\". לעולם לא גוף ראשון יחיד (\"זיהיתי\", \"ראיתי\") - אין כותב יחיד. הנמען נשאר ביחיד (אתה/את) כרגיל. ואם השם הפרטי כתוב באותיות לטיניות, אל תשתמש בשם בכלל, פתח בלי שם.",
  );

  p = mustReplace(
    p,
    `"warm_note": "פנייה חמה ואישית **של שני משפטים בלבד**, בגוף שני. מתחילה בשם הפרטי אם נמסר (פעם אחת, בפתיחה), אחרת בלי שם. אומרת בקול ברור 'ראיתי אותך' ומציינת דבר אחד ספציפי שזיהית. הטוב כאן הוא של בהירות, לא של ליטוף. בלי לסכם, בלי לחזור על האות.",`,
    `"warm_note": "פנייה חמה ואישית **של שניים עד שלושה משפטים**, בגוף שני אל האדם, בקול צוות (רבים) כשיש קול כותב: 'זיהינו', 'ראינו', 'שמנו לב'. לעולם לא 'זיהיתי' או 'ראיתי'. מתחילה בשם הפרטי אם נמסר ורק אם הוא בעברית (פעם אחת, בפתיחה), אחרת בלי שם. מחברת לפחות שתי תשובות שונות זו לזו (מה חוזר, מה מתיישב אחד על השני), בלשון עדות ולא ורדיקט. הטוב כאן הוא של בהירות, לא של ליטוף. בלי לסכם, בלי לחזור על האות.",`,
  );

  // 5. General authorial-voice + gender-consistency hardening (appended).
  p += `

שדה occupation (חילוץ תחום עיסוק):
הסק את תחום העיסוק של האדם מתוך שש התשובות בלבד (לא ממטא-נתונים). החזר אותו בשדה "occupation" בעברית קצרה ("מאמנת עסקית", "עורך דין", "בעלת סטודיו פילאטיס"). אם אי אפשר לקבוע בביטחון סביר, החזר null. השדה הזה הוא מטא-נתון פנימי: אסור שהוא ישפיע על תשעת השדות הרגשיים, ואסור להמציא תחום שלא נרמז בתשובות. אם נמסר תחום עיסוק כמטא-נתון בקלט, החזר אותו כפי שנמסר (בניקוי קל) אלא אם התשובות סותרות אותו בבירור.

חוקי-על נוספים (v2, קריטיים):
1. קול-כותב ברבים בכל מקום: כל פועל או כינוי בגוף ראשון, בכל שדה, חייב להיות ברבים. "עצר אותנו", "זיהינו", "ראינו", "שמנו לב". אסורה כל צורת גוף ראשון יחיד: "עצר אותי", "זיהיתי", "ראיתי", "אני". לפני שאתה מגיש, סרוק את הפלט: אם מופיעה צורת גוף-ראשון-יחיד כלשהי, תקן אותה לרבים.
2. עקביות מגדר מוחלטת: אם לא נמסר מגדר פנייה, קבע נטייה אחת לפי השם הפרטי (אם הוא שם עברי מובהק) והחזק אותה בכל מילה בכל השדות. אסור בשום מקרה לערבב נטיות באותו משפט או באותו פלט ("אתה מוצאת" הוא כשל פוסל). אם אין שם או שהשם לא מכריע, כתוב הכול בנטיית נקבה עקבית.
3. הוסף ל-JSON המוחזר שדה נוסף: "occupation" (מחרוזת קצרה בעברית או null) לפי כלל חילוץ תחום העיסוק למעלה. השדה יושב ליד palette_id, אחרי כל השדות האחרים.`;

  return p;
}

export const SIGNAL_ENGINE_V2_SYSTEM_PROMPT = deriveV2Prompt();

export function buildSignalUserMessageV2(
  answers: SignalAnswersV2,
  firstName?: string,
  occupation?: string,
  gender?: "m" | "f",
): string {
  const lines: string[] = [];
  if (firstName) lines.push(`שם פרטי: ${firstName}`);
  if (occupation && occupation.trim().length > 0) {
    lines.push(`תחום עיסוק (מטא-נתון לקונטקסט בלבד, לא תשובה לשאלה): ${occupation.trim()}`);
  }
  if (gender) {
    const label = gender === "m" ? "זכר" : "נקבה";
    const youForm = gender === "m" ? "אתה" : "את";
    lines.push(
      `מגדר הפנייה: ${label}. ` +
      `כל הפלט חייב להיכתב בפנייה ליחיד ${label} בלבד. ` +
      `השתמש ב"${youForm}", בפעלים, ובכינויי שייכות בנטיית ${label}. ` +
      `אסור לחלוטין להשתמש בשני המינים יחד (לא "אתה/את", לא "מצאת/מצאה"). ` +
      `קול הכותב (כשקיים) נשאר קול צוות ברבים ("זיהינו"), אבל הנמען ביחיד ${label}.`
    );
  }
  const meta = lines.length > 0 ? `${lines.join("\n")}\n\n` : "";
  const sections = SIGNAL_QUESTIONS_V2.map((q) => {
    const a = (answers[q.key] ?? "").trim() || "(לא נענה)";
    return `מפתח: ${q.key}\nשאלה: ${q.label}\nתשובה:\n${a}`;
  }).join("\n\n");
  return `${meta}להלן שש תשובות חופשיות שניתנו על ידי המשתמש, מסומנות במפתח. החזר את האות לפי ההוראות בשיטת TrueSignal©.\n\n${sections}`;
}

/** ≥3 filled answers among the six v2 keys; hard_period may be empty. */
export function isValidAnswersV2(value: unknown): value is SignalAnswersV2 {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  for (const q of SIGNAL_QUESTIONS_V2) {
    const raw = v[q.key];
    if (raw !== undefined && typeof raw !== "string") return false;
  }
  const filled = SIGNAL_QUESTIONS_V2.filter((q) => {
    const raw = v[q.key];
    return typeof raw === "string" && raw.trim().length >= 8;
  });
  return filled.length >= 3;
}
