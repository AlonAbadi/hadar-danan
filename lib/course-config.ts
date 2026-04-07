export interface Lesson {
  id: number;
  videoId: string; // Vimeo ID - "PLACEHOLDER" until real IDs are provided
  title: string;
  duration: number; // minutes
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
      { id: 1,  videoId: "PLACEHOLDER", title: 'TrueSignal שלך',    duration: 28 },
      { id: 2,  videoId: "PLACEHOLDER", title: "הבידול בשטח",       duration: 24 },
    ],
  },
  {
    id: 2,
    title: "הלקוח האידיאלי",
    lessons: [
      { id: 3,  videoId: "PLACEHOLDER", title: "מיפוי הלקוח",        duration: 31 },
      { id: 4,  videoId: "PLACEHOLDER", title: "פסיכולוגיית הקנייה", duration: 27 },
    ],
  },
  {
    id: 3,
    title: "המסר שמוכר",
    lessons: [
      { id: 5,  videoId: "PLACEHOLDER", title: "משפט הבידול",        duration: 33 },
      { id: 6,  videoId: "PLACEHOLDER", title: "ניסוח ובדיקה",       duration: 29 },
    ],
  },
  {
    id: 4,
    title: "הסיפור שמחבר",
    lessons: [
      { id: 7,  videoId: "PLACEHOLDER", title: "מבנה הסיפור",        duration: 31 },
      { id: 8,  videoId: "PLACEHOLDER", title: "הסיפור ברשתות",      duration: 26 },
    ],
  },
  {
    id: 5,
    title: "תוכן שמביא לידים",
    lessons: [
      { id: 9,  videoId: "PLACEHOLDER", title: "אסטרטגיית תוכן",     duration: 28 },
      { id: 10, videoId: "PLACEHOLDER", title: "פורמטים שעובדים",    duration: 32 },
    ],
  },
  {
    id: 6,
    title: "המחיר שמשקף ערך",
    lessons: [
      { id: 11, videoId: "PLACEHOLDER", title: "תמחור נכון",          duration: 29 },
      { id: 12, videoId: "PLACEHOLDER", title: "הצגת המחיר",          duration: 25 },
    ],
  },
  {
    id: 7,
    title: "הפניות שמגיעות לבד",
    lessons: [
      { id: 13, videoId: "PLACEHOLDER", title: "מנגנון הפניות",       duration: 27 },
      { id: 14, videoId: "PLACEHOLDER", title: "שימור לקוחות",        duration: 30 },
    ],
  },
  {
    id: 8,
    title: "הצמיחה הבאה",
    lessons: [
      { id: 15, videoId: "PLACEHOLDER", title: "תוכנית פעולה",        duration: 33 },
      { id: 16, videoId: "PLACEHOLDER", title: "המדידה והשיפור",      duration: 28 },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = COURSE_MODULES.flatMap((m) => m.lessons);
export const TOTAL_LESSONS = ALL_LESSONS.length; // 16

export function lessonVideoId(lessonId: number): string {
  return `course_lesson_${lessonId}`;
}
