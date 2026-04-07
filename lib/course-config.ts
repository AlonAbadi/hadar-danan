export interface Lesson {
  id: number;
  videoId: string; // Vimeo ID - "PLACEHOLDER" until real IDs are provided
  title: string;
  duration: number; // minutes
  description: string;
}

export interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

export const COURSE_MODULES: Module[] = [
  {
    id: 1,
    title: "למה אתה באמת שונה",
    lessons: [
      { id: 1,  videoId: "PLACEHOLDER", title: 'TrueSignal שלך',    duration: 28, description: "נגדיר את ה-TrueSignal הייחודי שלך - מה באמת מבדל אותך מהמתחרים ולמה הלקוחות בוחרים דווקא בך." },
      { id: 2,  videoId: "PLACEHOLDER", title: "הבידול בשטח",       duration: 24, description: "נראה איך הבידול שלך מתבטא בפועל בשיחות מכירה, בתוכן ובאופן שבו הלקוחות מדברים עליך." },
    ],
  },
  {
    id: 2,
    title: "הלקוח האידיאלי",
    lessons: [
      { id: 3,  videoId: "PLACEHOLDER", title: "מיפוי הלקוח",        duration: 31, description: "נמפה את הלקוח האידיאלי שלך לעומק - מאפייניו, הכאבים שלו והסיבה האמיתית שהוא מחפש פתרון." },
      { id: 4,  videoId: "PLACEHOLDER", title: "פסיכולוגיית הקנייה", duration: 27, description: "נבין את מנגנון קבלת ההחלטות של הלקוח ואיך ליצור מסר שפוגע בנקודה הנכונה ברגע הנכון." },
    ],
  },
  {
    id: 3,
    title: "המסר שמוכר",
    lessons: [
      { id: 5,  videoId: "PLACEHOLDER", title: "משפט הבידול",        duration: 33, description: "נבנה יחד את משפט הבידול שלך - תמצית ברורה וחדה של מה שאתה עושה ולמי ולמה זה שונה." },
      { id: 6,  videoId: "PLACEHOLDER", title: "ניסוח ובדיקה",       duration: 29, description: "נעבור על שיטות לניסוח המסר, נבדוק אותו מול קהל אמיתי ונשכלל עד שהוא עובד בשטח." },
    ],
  },
  {
    id: 4,
    title: "הסיפור שמחבר",
    lessons: [
      { id: 7,  videoId: "PLACEHOLDER", title: "מבנה הסיפור",        duration: 31, description: "נלמד את מבנה הסיפור השיווקי שיוצר חיבור רגשי עם הקהל ומוביל אותו לפעולה באופן טבעי." },
      { id: 8,  videoId: "PLACEHOLDER", title: "הסיפור ברשתות",      duration: 26, description: "נתרגם את הסיפור שלך לפוסטים, סטוריז ורילס שמייצרים מעורבות ומביאים פניות אורגניות." },
    ],
  },
  {
    id: 5,
    title: "תוכן שמביא לידים",
    lessons: [
      { id: 9,  videoId: "PLACEHOLDER", title: "אסטרטגיית תוכן",     duration: 28, description: "נבנה אסטרטגיית תוכן שמתאימה לעסק שלך - כמה לפרסם, על מה ואיך לשמור על עקביות לאורך זמן." },
      { id: 10, videoId: "PLACEHOLDER", title: "פורמטים שעובדים",    duration: 32, description: "נסקור את הפורמטים שמביאים תוצאות בשוק הישראלי ונבחר את אלה שמתאימים לסגנון שלך." },
    ],
  },
  {
    id: 6,
    title: "המחיר שמשקף ערך",
    lessons: [
      { id: 11, videoId: "PLACEHOLDER", title: "תמחור נכון",          duration: 29, description: "נלמד כיצד לתמחר את השירות שלך על בסיס ערך ולא עלות - ולהסביר את המחיר ללקוח בביטחון." },
      { id: 12, videoId: "PLACEHOLDER", title: "הצגת המחיר",          duration: 25, description: "נתרגל את הרגע שבו מציגים את המחיר ללקוח - איך לעשות זאת בצורה שמעלה ולא מורידה את הערך." },
    ],
  },
  {
    id: 7,
    title: "הפניות שמגיעות לבד",
    lessons: [
      { id: 13, videoId: "PLACEHOLDER", title: "מנגנון הפניות",       duration: 27, description: "נבנה מנגנון שיטתי שגורם ללקוחות קיימים להפנות לקוחות חדשים - בלי לבקש ובלי להרגיש מוזר." },
      { id: 14, videoId: "PLACEHOLDER", title: "שימור לקוחות",        duration: 30, description: "נלמד כיצד לשמר לקוחות קיימים, לבנות נאמנות ולהפוך עסקה חד-פעמית לקשר עסקי ארוך טווח." },
    ],
  },
  {
    id: 8,
    title: "הצמיחה הבאה",
    lessons: [
      { id: 15, videoId: "PLACEHOLDER", title: "תוכנית פעולה",        duration: 33, description: "נגבש תוכנית פעולה אישית ל-90 הימים הקרובים עם יעדים ברורים וצעדים מדידים להשגתם." },
      { id: 16, videoId: "PLACEHOLDER", title: "המדידה והשיפור",      duration: 28, description: "נלמד אילו מדדים חשוב לעקוב אחריהם, איך לנתח תוצאות ולשפר את הביצועים ברציפות." },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = COURSE_MODULES.flatMap((m) => m.lessons);
export const TOTAL_LESSONS = ALL_LESSONS.length; // 16

export function lessonVideoId(lessonId: number): string {
  return `course_lesson_${lessonId}`;
}
