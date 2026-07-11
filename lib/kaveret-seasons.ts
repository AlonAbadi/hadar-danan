/**
 * Kaveret season roadmap
 *
 * The /kaveret monthly subscription is open-ended — every month a new season
 * generates, each built on the same signal but expressing it from a
 * different angle. Season 1 is the current /kaveret experience (the 7-video
 * challenge structure that builds identity + 4 pillars). Every season after
 * it stands on top of that foundation and sharpens one specific dimension.
 *
 * Sources for the season taxonomy:
 * - Hadar's canonical funnel framework (2026-07-11, transmitted through
 *   Alon) — /Users/work/hadar-transcripts/HADAR_FUNNEL_FRAMEWORK.md
 * - Alon 2026-07-11: "המנוי הוא אינסופי לכן ניתן דוגמאות לעונות"
 *
 * Design rules:
 * - Every season references the signal, not a generic theme.
 * - Every season has 3-7 episodes; short seasons are permitted for
 *   high-density formats (mantras).
 * - Season 1 titles stay short and iconic. Season copies are the customer
 *   pitch, not internal descriptions.
 * - The list is intentionally longer than we'll display at once — the UI
 *   renders the first N as visible teasers, with an "ראה עוד" affordance
 *   for the rest, so the pipeline reads as endless (which it is).
 */

export type KaveretSeason = {
  number:   number;                // 1-based
  title:    string;                // Short display title
  tagline:  string;                // One-line teaser (≤ 90 chars)
  episodes: number;                // Episode count
  status:   "live" | "next" | "coming" | "future";
  what:     string;                // 1-2 sentences — what the customer gets
  why:      string;                // 1 sentence — why it matters, referenced back to Hadar
};

export const KAVERET_SEASONS: KaveretSeason[] = [
  {
    number:   1,
    title:    "היסודות",
    tagline:  "האות שלך בונה את משפט הזהות ואת 4 עמודי המסר",
    episodes: 7,
    status:   "live",
    what:     "העונה שאתם עכשיו בתוכה. שבעה פרקים שבונים את משפט הזהות שלכם ואת 4 עמודי המסר שיזינו כל תוכן שתעשו מפה והלאה.",
    why:      "כל עונה עתידית עומדת על היסודות האלה. בלי הליבה הזאת שאר העונות הן קישוט.",
  },
  {
    number:   2,
    title:    "אני בפעולה",
    tagline:  "הראו איך אתם נראים תוך כדי מתן השירות",
    episodes: 6,
    status:   "next",
    what:     "שישה פרקים שמראים אתכם בפעולה: קבלת לקוח חדש, פירוק בעיה מורכבת בזמן אמת, הרגע שבו אתם עוצרים ומקשיבים, תיקון טעות אמצע, סגירת שיחה, ונטיה קטנה של השירות שרק אתם עושים.",
    why:      "הדר מגדירה את הקטגוריה הזאת כהכי חשובה. היא מפרקת התנגדויות של מחיר ופחד לפני שהלקוח מגיע בכלל למכירה.",
  },
  {
    number:   3,
    title:    "גילוי נאות",
    tagline:  "חמישה פרקים בפורמט חתימת מותג של הדר",
    episodes: 5,
    status:   "coming",
    what:     "כל פרק פותח ב״אני רוצה לעשות איתכם גילוי נאות״ וחושף אמת שאנשים לא אוהבים לשמוע, שנגזרת ישירות מהאות שלכם.",
    why:      "הדר: ״זה יהיה הנכס הכי חזק שלך.״ המותג שלכם מבוסס על גילוי, וזו הסדרה שהופכת את זה לחתימה שאי אפשר לזייף.",
  },
  {
    number:   4,
    title:    "המילון של האות",
    tagline:  "עונה שלמה על מילה אחת שיצאה באות שלכם",
    episodes: 7,
    status:   "coming",
    what:     "אם באות שלכם יש ״פער״, ״התמדה״, ״בהירות״ — עונה שלמה שחוקרת את המילה האחת הזאת: מה היא בעצם, מה היא לא, הרגע שבו היא מתפרקת, מי הבעלים שלה, ואיך היא משתנה בזמן.",
    why:      "הדר: ״לא לדבר על התחום. לדבר על המילה.״ שם נמצאת הספציפיות שמושכת רק את הקהל שצריך אתכם.",
  },
  {
    number:   5,
    title:    "עדויות בפעולה",
    tagline:  "עדויות שמחזירות את משפט האות בפי הלקוחות שלכם",
    episodes: 5,
    status:   "coming",
    what:     "מפיקים עדויות עם השאלות שקיבלתם כבר בעונה 1. חמישה פרקים של לקוחות שאמרו בקולם את משפט האות שלכם.",
    why:      "עדות רגילה מוכיחה שאתם טובים. עדות שמחזירה את משפט האות מוכיחה שאתם פותרים בדיוק את מה שאמרתם שתפתרו.",
  },
  {
    number:   6,
    title:    "התנגדויות חוקרות",
    tagline:  "לחקור התנגדויות, לא לענות עליהן",
    episodes: 5,
    status:   "future",
    what:     "כל פרק לוקח התנגדות אחת מהקטגוריה שלכם ומחזיר אותה כשאלה נגדית שחושפת תפיסת עולם. עונה של אנטי-מכירה.",
    why:      "הדר: ״לא לענות על התנגדויות. לחקור אותן.״ הצופה מגלה בעצמו את התובנה, לא מקבל אותה סרוקה מכם.",
  },
  {
    number:   7,
    title:    "הסיפור האישי",
    tagline:  "עונת ספיישל: איך האות שלכם נולדה",
    episodes: 4,
    status:   "future",
    what:     "ארבעה פרקים ארוכים יותר. הסיפור של איך הפער שאתם רואים בקטגוריה שלכם התגלה לכם. הרגע שראיתם אותו. הפעם שנפלתם. הראשון שאמר לכם את זה בקול.",
    why:      "הזהות של אלה שעוברים אחריכם נוצרת מתוך הסיפור שלכם. בלי הסיפור, האות נשמע כמו נוסחה.",
  },
  {
    number:   8,
    title:    "המנטרות",
    tagline:  "משפטי חתימה קצרים שאנשים ישלחו הלאה",
    episodes: 4,
    status:   "future",
    what:     "ארבעה פרקים קצרים מאוד. כל פרק — מנטרה אחת מהאות שלכם, נפרשת בעומק. הסרטונים האלה נבנו כדי שאנשים ישלחו הלאה בלי טקסט משלהם.",
    why:      "המותג שלכם נשאר בזיכרון של הקהל בזכות המנטרות. הן הרגע שבו האות הופך למשהו שאפשר להחזיק.",
  },
  {
    number:   9,
    title:    "השאלה שלא נשאלה",
    tagline:  "שאלות שהלקוח שלכם שואל את עצמו בשקט",
    episodes: 6,
    status:   "future",
    what:     "כל פרק לוקח שאלה שהקהל האידאלי שלכם שואל את עצמו בשקט, מנסח אותה בקול, והתשובה היא האות שלכם.",
    why:      "הקהל שלכם לא מחפש עוד תוכן. הוא מחפש מישהו שינסח את מה שהוא לא הצליח לנסח. זאת עונה שלמה של הרגעים האלה.",
  },
  {
    number:   10,
    title:    "המגיבה",
    tagline:  "תגובה מהירה למה שקורה בקטגוריה שלכם",
    episodes: 5,
    status:   "future",
    what:     "עונה חיה: כשמשהו קורה בתחום שלכם, אנחנו מייצרים תוך שעות פרק שמעביר את האות שלכם דרך האירוע. חמישה פרקים בחודש שנוגעים במה שחם.",
    why:      "האות הופך לחי ולא לספר. הקהל רואה שאתם מדברים עכשיו, לא בשנה שעברה.",
  },
];

export const KAVERET_SEASONS_INTRO = "המנוי החודשי לא נגמר בעונה הראשונה. כל חודש עונה חדשה, אותה אות, זווית אחרת. כאן הצצה למה שמחכה.";
