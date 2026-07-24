/**
 * Shoot Day Lab — canonical episode catalog.
 *
 * The lab prototypes a new architecture: instead of the engine writing
 * scripts FROM the user's signal (which produces monoculture output — Alon
 * and Malka got identical-sounding videos), each episode becomes a short
 * Hadar-style interview → user answers in their own words → the engine
 * shapes those words into a script (preserving user vocabulary, not
 * imposing Hadar's).
 *
 * These 13 episodes live only in the lab (route /shoot-day-lab, gated to
 * Alon's email). They mirror production's season 1 (1..7) and season 2
 * (21..26) numbers so a future rollout can drop straight in.
 */

export type LabEpisode = {
  number:   number;
  season:   1 | 2;
  code:     string;        // "S1E1" / "S2E1" — for display
  title:    string;         // Short canonical title
  focus:    string;         // What this episode is trying to surface
  moment:   string;         // The specific moment/situation to point the user at
};

export const LAB_EPISODES: LabEpisode[] = [
  {
    number: 1, season: 1, code: "S1E1",
    title:  "הבעיה שאתה רואה",
    focus:  "בעיה מקצועית שהמשתמש רואה בתחום שלו שרוב האנשים מפספסים",
    moment: "רגע שבו לקוח הגיע עם משהו שכולם היו פותרים אחרת, והמשתמש ראה משהו אחר",
  },
  {
    number: 2, season: 1, code: "S1E2",
    title:  "הסיפור האישי",
    focus:  "סיפור אישי שדרכו עולה מסר גדול — לא סיפור סבתא, סיפור מהעבודה",
    moment: "פרויקט או לקוח אמיתי, עם שם/פרט מזהה כלשהו, שהחזיר למשתמש 'למה אני עושה את זה'",
  },
  {
    number: 3, season: 1, code: "S1E3",
    title:  "מה הקהל חושב שהוא צריך",
    focus:  "טעות תפיסה של הקהל — מה הם מבקשים לעומת מה שבאמת יעזור להם",
    moment: "בקשה שחוזרת מלקוחות שמסתירה את הבעיה האמיתית",
  },
  {
    number: 4, season: 1, code: "S1E4",
    title:  "המהפך הפנימי",
    focus:  "רגע ההבנה שבו המשתמש הבין שהוא עובד אחרת ממה שחשב",
    moment: "החלטה או תובנה שאחריה משהו בעבודה שלו השתנה מקצה לקצה",
  },
  {
    number: 5, season: 1, code: "S1E5",
    title:  "המסגרת שלך",
    focus:  "השיטה של המשתמש במונחים שלו, לא בז'רגון של הקטגוריה",
    moment: "התהליך שהמשתמש עובד בו עם לקוח מהשלב הראשון עד התוצאה",
  },
  {
    number: 6, season: 1, code: "S1E6",
    title:  "הנגד לקטגוריה",
    focus:  "עמדה שהמשתמש מחזיק שמעצבנת את הקטגוריה שלו",
    moment: "משפט שהוא אומר ללקוחות שעמיתים בתחום היו חולקים עליו",
  },
  {
    number: 7, season: 1, code: "S1E7",
    title:  "ההזמנה",
    focus:  "למי בדיוק העסק הזה, ומתי הזמן להתחיל — בלי CTA שיווקי",
    moment: "הסוג של לקוח שהמשתמש עובד איתו הכי טוב ומה מסמן שהם מוכנים",
  },
  {
    number: 21, season: 2, code: "S2E1",
    title:  "קבלת לקוח חדש",
    focus:  "המשפט או המהלך הראשון בפגישת פתיחה עם לקוח חדש",
    moment: "מה בדיוק המשתמש אומר או שואל ברגעים הראשונים כדי לפתוח את השיחה נכון",
  },
  {
    number: 22, season: 2, code: "S2E2",
    title:  "פירוק בעיה בזמן אמת",
    focus:  "לקוח נתקע, המשתמש פותח את זה מולו",
    moment: "מקרה שבו לקוח הגיע עם בעיה סתומה והמשתמש עשה מהלך שפירק אותה במקום",
  },
  {
    number: 23, season: 2, code: "S2E3",
    title:  "עצירה קולטת",
    focus:  "רגע שהמשתמש עוצר לפני שנותן פתרון — כדי להקשיב",
    moment: "פגישה שבה המשתמש בחר להישאר בשקט או לשאול שאלה במקום לענות",
  },
  {
    number: 24, season: 2, code: "S2E4",
    title:  "תיקון באמצע הדרך",
    focus:  "החלטה לשנות כיוון באמצע פרויקט, גם כשהיה קל להמשיך",
    moment: "פרויקט שבו המשתמש עצר את התהליך והפנה לכיוון אחר — ולמה",
  },
  {
    number: 25, season: 2, code: "S2E5",
    title:  "סגירה",
    focus:  "איך המשתמש מסיים תהליך עם לקוח — לא איך גובה, איך סוגר",
    moment: "השיחה או המהלך של יום אחרון עם לקוח, מה שנשאר בין השניים",
  },
  {
    number: 26, season: 2, code: "S2E6",
    title:  "הטיה חתומה",
    focus:  "התיקון הקטן שאף אחד אחר בתחום לא היה עושה — החתימה של המשתמש",
    moment: "פרט קטן בעבודה שהמשתמש עומד עליו גם כשזה לא משנה ללקוח, כי זו החתימה שלו",
  },
];

export function findLabEpisode(number: number): LabEpisode | null {
  return LAB_EPISODES.find((e) => e.number === number) ?? null;
}

export const LAB_S1_NUMBERS = LAB_EPISODES.filter((e) => e.season === 1).map((e) => e.number);
export const LAB_S2_NUMBERS = LAB_EPISODES.filter((e) => e.season === 2).map((e) => e.number);
