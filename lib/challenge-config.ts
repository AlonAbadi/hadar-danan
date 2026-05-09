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
    videoId: "1185862328",
    title: "מה משתנה בשיווק 2026",
    duration: 120,
    aspectRatio: "16:9",
    description: "למה השיווק הישן כבר לא עובד ומה השינוי הנדרש עבורכם. מתכוננים לשבוע של צילום יומי — כל יום סוג אחר של סרטון שיווקי.",
  },
  {
    day: 1,
    videoId: "1146491419",
    title: "סרטוני בעיה — לדבר ללב",
    duration: 7,
    aspectRatio: "9:16",
    description: "לומדים לזהות את הבעיות של הקהל ולבנות סרטון שמדבר ישר אליהן. כשאתם מדברים על הבעיה של הלקוח — הוא מבין לבד שאתם הפתרון.",
  },
  {
    day: 2,
    videoId: "1149821176",
    title: "סרטוני סיפור — המסר מנצח",
    duration: 6,
    aspectRatio: "9:16",
    description: "הסיפור הוא רק הכלי — המסר הוא הדבר החשוב. לומדים לקחת חוויה אישית ולהעביר דרכה ערך שמחבר ומשכנע.",
  },
  {
    day: 3,
    videoId: "1146553292",
    title: "אזור הגאונות שלכם",
    duration: 8,
    aspectRatio: "9:16",
    description: "מגלים את הרגע הייחודי שבו אתם הכי טובים ומצלמים אותו. הקהל קונה כשהוא פוגש אתכם בשיא הכוח שלכם — לא כשאתם מסבירים.",
  },
  {
    day: 4,
    videoId: "1147280995",
    title: "סרטוני ביקורת — הדעה שלכם",
    duration: 7,
    aspectRatio: "9:16",
    description: "מצלמים את מה שתמיד רציתם להגיד ללקוח אבל לא אמרתם. ביקורת מקצועית אמיתית היא מה שמבדיל אתכם ובונה אמון.",
  },
  {
    day: 5,
    videoId: "1147281285",
    title: "לפרק התנגדויות בוידאו",
    duration: 7,
    aspectRatio: "9:16",
    description: "לוקחים את ההתנגדויות הנפוצות של הלקוחות ופותרים אותן בסרטון — לפני שיחת המכירה. ככה הלקוח מגיע מוכן ושיחת המכירה קלה יותר.",
  },
  {
    day: 6,
    videoId: "1147597114",
    title: "סיפור + דעה = תוכן חזק",
    duration: 8,
    aspectRatio: "9:16",
    description: "לוקחים דבר שראיתם, שמעתם או חוויתם עם לקוח — ומוסיפים עליו את הדעה האישית שלכם. זה התוכן שמייצר עמדה ומשיך לקוחות שמתחברים אליכם.",
  },
  {
    day: 7,
    videoId: "1147325993",
    title: "עדויות שמוכרות במקומכם",
    duration: 6,
    aspectRatio: "9:16",
    description: "שלוש שאלות קריטיות שהופכות כל שיחה עם לקוח מרוצה לסרטון מכירה עוצמתי. הלקוחות שלכם מספרים את המסר שלכם טוב מכם.",
  },
  {
    day: 8,
    videoId: "PLACEHOLDER",
    title: "מפגש סיום",
    duration: 120,
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

/**
 * Time-based unlock: days 1–7 open every 24 h after enrollment, skipping Saturday.
 * Day 0 is always available. Day 8 becomes visible once day 7 is unlocked.
 */
export function computeMaxUnlockedDay(enrolledAt: string): number {
  const start = new Date(enrolledAt);
  const now = new Date();
  let unlocked = 0;
  let prevUnlock = start;

  for (let day = 1; day <= 7; day++) {
    let nextUnlock = new Date(prevUnlock.getTime() + 24 * 60 * 60 * 1000);
    // Skip Saturday (getDay() === 6)
    while (nextUnlock.getDay() === 6) {
      nextUnlock = new Date(nextUnlock.getTime() + 24 * 60 * 60 * 1000);
    }
    if (now >= nextUnlock) {
      unlocked = day;
      prevUnlock = nextUnlock;
    } else {
      break;
    }
  }

  return unlocked;
}

/**
 * Closing live meeting: 15th of the current (or next) month.
 * If the 15th falls on Friday (5) or Saturday (6), moves to Sunday.
 */
export function computeNextLiveMeetingDate(): Date {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), 15);
  // If 15th already passed this month, use next month
  if (d <= now) {
    d = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  }
  const dow = d.getDay();
  if (dow === 5) d.setDate(d.getDate() + 2); // Friday → Sunday
  if (dow === 6) d.setDate(d.getDate() + 1); // Saturday → Sunday
  return d;
}
