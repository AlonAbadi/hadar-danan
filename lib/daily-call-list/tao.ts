/**
 * Tao Te Ching — Hebrew verses for the morning email opening.
 *
 * One verse per workday, rotating deterministically by day-of-year.
 * Verses are short (1-2 sentences max) and selected for resonance with
 * relationships, attention, patience, and craft — themes that apply to
 * a Hebrew coaching/consulting practice.
 *
 * Source: Lao Tzu, Tao Te Ching (Hebrew renderings — paraphrased for brevity
 * and natural Hebrew rhythm rather than literal translation).
 */

export type TaoVerse = {
  chapter: number;
  he:      string;
};

const VERSES: TaoVerse[] = [
  { chapter:  8, he: "הטוב שבטוב דומה למים — מועיל לכל הדברים בלי להיאבק בהם." },
  { chapter:  9, he: "מלא כלי עד שפתו — תרצה שהיה ריק. חדד להב עד הקצה — לא יחזיק זמן רב." },
  { chapter: 11, he: "הריק שבכלי הוא שעושה אותו לשימושי. מה שאין שם — שם הערך." },
  { chapter: 15, he: "מי שיודע לחכות לבוץ שישקע — יראה את המים צלולים." },
  { chapter: 17, he: "כשהמנהיג הטוב גמר את עבודתו, אומרים האנשים: עשינו זאת בעצמנו." },
  { chapter: 22, he: "כפוף — ותישמר שלם. התכופף — וגם תיישר." },
  { chapter: 24, he: "מי שעומד על קצות אצבעותיו לא יעמוד יציב. מי שצועד פסיעות גדולות מדי לא יחזיק מעמד." },
  { chapter: 27, he: "ההולך הטוב לא משאיר עקבות. הדובר הטוב לא משאיר פגמים." },
  { chapter: 29, he: "מי שמחזיק חזק מדי — מאבד. מי שאוחז יותר מדי — שומט." },
  { chapter: 33, he: "להכיר אחרים זו חכמה. להכיר את עצמך זו הארה." },
  { chapter: 36, he: "הרך והעדין מנצח את הקשה והחזק." },
  { chapter: 37, he: "הטאו לעולם לא עושה דבר — ובכל זאת שום דבר לא נשאר לא־נעשה." },
  { chapter: 38, he: "טוב גבוה אינו רואה עצמו טוב — ולכן הוא טוב." },
  { chapter: 41, he: "האור הגדול נראה אפל. הצעד קדימה נראה כנסיגה." },
  { chapter: 43, he: "הרך שבעולם מנצח את הקשה שבעולם. שתיקה מלמדת יותר ממילים." },
  { chapter: 44, he: "מי שיודע מתי להפסיק — אינו עומד בסכנה." },
  { chapter: 45, he: "השלמות הגדולה נראית חסרה. ההישג הגדול נראה ריק." },
  { chapter: 46, he: "אין אסון גדול מאי־ידיעת מספיק. אין שגיאה גדולה מהרצון לעוד." },
  { chapter: 47, he: "בלי לצאת מהדלת — אפשר להכיר את העולם. ככל שהולכים רחוק יותר — יודעים פחות." },
  { chapter: 48, he: "הלימוד — להוסיף יום יום. הדרך — לגרוע יום יום." },
  { chapter: 56, he: "היודע אינו מדבר. המדבר אינו יודע." },
  { chapter: 58, he: "במזל מסתתר אסון. באסון מסתתר מזל." },
  { chapter: 59, he: "במשק חיים ובשירות שמיים — אין דבר טוב יותר ממידה." },
  { chapter: 60, he: "ניהול ממלכה גדולה דומה לבישול דג קטן — יותר מדי הפיכות, והכל מתפורר." },
  { chapter: 63, he: "תקוף את הקשה כשעודנו רך. עשה את הגדול כשעודנו קטן." },
  { chapter: 64, he: "מסע של אלף מילין מתחיל בצעד אחד." },
  { chapter: 66, he: "הים מלך על מאה הנהרות — כי הוא יודע להיות מתחתם." },
  { chapter: 67, he: "שלושה אוצרות לי: רחמים, פשטות, ואי־התקדמות לפני אחרים." },
  { chapter: 71, he: "לדעת שאינך יודע — זו דעת עליונה. לחשוב שאתה יודע כשאינך — זו מחלה." },
  { chapter: 73, he: "הרשת של השמיים רחבה — וחוטיה דקים. דבר לא חומק ממנה." },
  { chapter: 76, he: "הקשה והנוקשה הם בני־לוויית המוות. הרך והגמיש הם בני־לוויית החיים." },
  { chapter: 78, he: "אין דבר רך וגמיש יותר ממים — ובכל זאת הם שוחקים את הסלע." },
  { chapter: 79, he: "החכם נותן מבלי לצפות לקבל." },
  { chapter: 81, he: "מילים אמיתיות אינן יפות. מילים יפות אינן אמיתיות." },
  { chapter:  2, he: "הקשה והקל יוצרים זה את זה. הארוך והקצר מודדים זה את זה." },
  { chapter:  5, he: "השמיים והארץ אינם מעדיפים. הם מתייחסים לכל הדברים כאל קש." },
  { chapter:  7, he: "החכם נשאר מאחור — ולכן הוא לפנים. מתעלם מעצמו — ולכן הוא נשמר." },
  { chapter: 16, he: "הגיע אל הריק המוחלט. שמור על שלווה איתנה. עשרת אלפים דברים עולים יחד — ואני מתבונן בשובם." },
  { chapter: 31, he: "כלי המלחמה הם כלי אסון. החכם משתמש בהם רק כשאין ברירה." },
  { chapter: 80, he: "ארץ קטנה, אנשים מעטים — שיהיו כלים רבים ושלא יעשה בהם שימוש. שיהיה אוכל פשוט וטעים, בגדים יפים, מנוחה בבית." },
];

/**
 * Pick a verse for a given date — deterministic, rotates through the full list.
 * Same day → same verse always (good for re-running cron on the same day).
 */
export function getTaoVerseForDate(date: Date): TaoVerse {
  const start = new Date(date.getFullYear(), 0, 0);
  const diffMs = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const index = dayOfYear % VERSES.length;
  return VERSES[index]!;
}

export const TAO_VERSE_COUNT = VERSES.length;
