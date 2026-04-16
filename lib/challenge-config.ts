export interface ChallengeDay {
  day: number;
  videoId: string; // Vimeo ID - "PLACEHOLDER" until real IDs are provided
  title: string;
  duration: number; // minutes
  aspectRatio: "16:9" | "9:16"; // 16:9 for day 0 & 8, 9:16 reels for days 1-7
  description: string;
}

export const CHALLENGE_DAYS: ChallengeDay[] = [
  {
    day: 0,
    videoId: "PLACEHOLDER",
    title: "מפגש פתיחה",
    duration: 12,
    aspectRatio: "16:9",
    description: "ברוכים הבאים לאתגר 7 הימים! במפגש הפתיחה נבין מה אנחנו הולכים לבנות יחד, איך תעבוד המסגרת ומה תצאו איתו בסוף השבוע.",
  },
  {
    day: 1,
    videoId: "1146491419",
    title: "בהירות — למה אתה עושה מה שאתה עושה",
    duration: 7,
    aspectRatio: "9:16",
    description: "יום ראשון: נחפור לשורש — מה מניע אותך, איפה אתה באמת חזק, ולמה הלקוחות שלך בוחרים דווקא בך. הבהירות הזו היא הבסיס לכל מה שבא אחריה.",
  },
  {
    day: 2,
    videoId: "1146553292",
    title: "הלקוח האידיאלי שלך",
    duration: 6,
    aspectRatio: "9:16",
    description: "יום שני: נגדיר במדויק את מי אתה רוצה לעזור — לא רק דמוגרפיה, אלא הכאבים, הרצונות, והשפה שבה הוא מדבר. ככל שתדייק יותר, כך המסרים שלך יפגעו בול.",
  },
  {
    day: 3,
    videoId: "PLACEHOLDER",
    title: "המסר שמבדל אותך",
    duration: 8,
    aspectRatio: "9:16",
    description: "יום שלישי: נבנה את משפט הבידול שלך — תמצית חדה של מה שאתה עושה, למי, ולמה זה שונה מכל האחרים. זה מה שיפתח את הפה של הלקוחות שלך בשבח שלך.",
  },
  {
    day: 4,
    videoId: "PLACEHOLDER",
    title: "הסיפור שמחבר",
    duration: 7,
    aspectRatio: "9:16",
    description: "יום רביעי: נלמד לספר את הסיפור שלך בצורה שיוצרת חיבור רגשי מיידי. הסיפור הנכון הופך אותך ממוכר לאדם שאנשים רוצים לעשות איתו עסקים.",
  },
  {
    day: 5,
    videoId: "PLACEHOLDER",
    title: "תוכן שמייצר לידים",
    duration: 7,
    aspectRatio: "9:16",
    description: "יום חמישי: נחשוף את הפורמטים שמביאים לידים אורגניים בשוק הישראלי — על מה לכתוב, איך לכתוב, ומה לעולם לא לפרסם.",
  },
  {
    day: 6,
    videoId: "PLACEHOLDER",
    title: "שיחת המכירה שמוכרת",
    duration: 8,
    aspectRatio: "9:16",
    description: "יום שישי: נפרק את שיחת המכירה לחלקים — מהשאלות שפותחות שיחה ועד הרגע שמציגים מחיר בביטחון. המכירה מתחילה הרבה לפני שמציגים מחיר.",
  },
  {
    day: 7,
    videoId: "PLACEHOLDER",
    title: "תוכנית הפעולה",
    duration: 6,
    aspectRatio: "9:16",
    description: "יום שביעי: נגבש יחד תוכנית פעולה ל-30 הימים הקרובים — צעדים ברורים ומדידים שתוכלו להתחיל ליישם מחר בבוקר.",
  },
  {
    day: 8,
    videoId: "PLACEHOLDER",
    title: "מפגש סיום",
    duration: 18,
    aspectRatio: "16:9",
    description: "מפגש הסיום המיוחד: נסכם את השבוע, נחגוג את ההישגים, ונדבר על הצעדים הבאים — איך להמשיך לבנות את המותג שלך מכאן.",
  },
];

export const TOTAL_DAYS = CHALLENGE_DAYS.length; // 9 (days 0–8)

export function dayVideoId(day: number): string {
  return `challenge_day_${day}`;
}

/** Returns true if the given day is a "session" day (16:9 format) */
export function isSessionDay(day: number): boolean {
  return day === 0 || day === 8;
}
