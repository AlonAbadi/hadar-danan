// חדר השידור — all user-facing microcopy in one place.
//
// Components must import via getBroadcastCopy(key, gender) and never hold
// literals, so Hadar's final wording lands here in one batch (and a DB
// override can slot in behind the accessor later with zero component changes).
//
// Gender: values are either a plain string (neutral) or { f, m } — resolved
// against users.gender (migration 051). No stored gender falls back to
// feminine (the product's home audience).
//
// Vocabulary rules (spec): mandatory terms — "לצלם עכשיו", "הבמאית עורכת",
// "טייק נוסף", "הורדת הווידאו", "הורדת הקאבר", "מצולם, לא מיוצר",
// "הבמאית מסיימת". Forbidden — פרויקט, קליפ, אדיטור, רנדר, ייצוא.
// No emoji, no em/en dashes. Lines marked [PLACEHOLDER] await Hadar's wording.

export type BroadcastGender = "m" | "f" | null | undefined;

type CopyValue = string | { f: string; m: string };

export const BROADCAST_COPY = {
  // Entry button (shoot-day tab)
  "entry.cta": "לצלם עכשיו",

  // Screen 2 — preparation
  "prep.eyebrow": "חדר השידור",
  "prep.title": "התסריט שלך, פעם אחת ברצף",
  "prep.tip.eyeline": "מצלמה בגובה העיניים, פנים אל האור",
  "prep.tip.one_friend": {
    f: "את מדברת לחברה אחת, לא לקהל",
    m: "אתה מדבר לחבר אחד, לא לקהל",
  },
  "prep.tip.no_fixing": "לא מתקנים טייק באמצע. עוצרים ומתחילים טייק נוסף",
  "prep.cta": { f: "אני מוכנה", m: "אני מוכן" },

  // Screen 3 — broadcast room
  "room.pause": "השהיה",
  "room.restart": "מהתחלה",
  "room.speed": "מהירות",
  "room.size": "גודל",
  "room.rotate_back": { f: "סובבי חזרה למאונך", m: "סובב חזרה למאונך" },
  "room.native_capture": "לצלם במצלמת הטלפון",

  // Director lines (הבמאית) — [PLACEHOLDER] items await Hadar's final wording
  "director.encourage_after_take1": "טייק שלישי הוא כמעט תמיד הטוב ביותר",
  "director.perfectionism_after_take5": {
    f: "מהטייק החמישי את לא נהיית יותר אמיתית, רק יותר מבוקרת. בחרי אחד מהשלושה האחרונים",
    m: "מהטייק החמישי אתה לא נהיה יותר אמיתי, רק יותר מבוקר. בחר אחד מהשלושה האחרונים",
  },
  "director.breathing": {
    f: "הטייק אצלה. את יכולה לנשום",
    m: "הטייק אצלה. אתה יכול לנשום",
  },
  "director.release": "זה מצולם, זה אמיתי, וזה שלך", // [PLACEHOLDER]

  // Screen 4 — take selection
  "takes.title": { f: "בחרי טייק", m: "בחר טייק" },
  "takes.select_cta": { f: "בחרי את הטייק הזה", m: "בחר את הטייק הזה" },
  "takes.another": "טייק נוסף",
  "takes.uploading": "הטייק עולה",
  "takes.interrupted": "הצילום נעצר",
  "takes.duration_short": "הטייק קצר מ-10 שניות. שווה לנסות טייק נוסף, יש לך את זה",
  "takes.duration_long": "הטייק ארוך מ-3 דקות. הבמאית עובדת עד 3 דקות, כדאי טייק ממוקד יותר",
  "takes.version_limit": "לתסריט הזה כבר יש שלוש גרסאות ערוכות. זה הרגע לבחור אחת ולפרסם",

  // Processing — הבמאית עורכת
  "processing.title": "הבמאית עורכת",
  "processing.stage.transcribing": "מקשיבה לטייק ויוצרת כתוביות מסונכרנות",
  "processing.stage.awaiting_captions": "הכתוביות מחכות לאישור שלך",
  "processing.stage.burning": "צורבת את הכתוביות ומכינה את הרילס",
  "processing.handoff": "הבמאית מסיימת - נשלח לך הודעה כשהרילס מוכן",
  "processing.handoff_note": "אפשר לסגור את המסך",

  // Screen 5 — caption approval
  "captions.title": "אישור כתוביות",
  "captions.hint": {
    f: "תקני מילים שהתמלול פספס. שום טקסט לא נצרב בלי האישור שלך",
    m: "תקן מילים שהתמלול פספס. שום טקסט לא נצרב בלי האישור שלך",
  },
  "captions.approve_cta": { f: "אשרי וסיימי", m: "אשר וסיים" },
  "captions.delete_line": "מחיקת שורה",
  "captions.trim_start.title": "תחילת הטייק",
  "captions.trim_end.title": "סוף הטייק",
  "captions.trim.expand": "להרחיב עוד רגע",
  "captions.trim.shrink": "לצמצם עוד רגע",
  "captions.failed.title": "התמלול לא הסתדר הפעם",
  "captions.failed.option_none": "רילס בלי כתוביות",
  "captions.failed.option_script": "התסריט ככתוביות, בסנכרון באישור שלך",
  "captions.sync.next_line": "השורה הבאה",

  // Screen 6 — output
  "output.stamp": "מצולם, לא מיוצר",
  "output.share": "שיתוף הרילס",
  "output.share_hint": "נפתח מסך השיתוף, שם בוחרים אינסטגרם",
  "output.download_video": "הורדת הווידאו",
  "output.download_cover": "הורדת הקאבר",
  "output.cover_title": "הקאבר שלך",
  "output.cover_hint": {
    f: "ההוק נצרב על הפריים שתבחרי",
    m: "ההוק נצרב על הפריים שתבחר",
  },
  "output.review_link": "הרילס שלך מחכה גם בביקורת פוסטים",

  // Review tab pending items
  "review.pending_title": "ממתינים לביקורת",
  "review.mark_published": "פורסם",

  // Permission + errors
  "permission.title": "אנחנו צריכות את המצלמה",
  "permission.body":
    "חדר השידור מצלם אותך במצלמה הקדמית. הדפדפן חסם את הגישה, ככה פותחים אותה",
  "permission.step1": "לוחצים על aA בשורת הכתובת",
  "permission.step2": "בוחרים הגדרות אתר",
  "permission.step3": "מצלמה ומיקרופון: אישור",
  "permission.retry": "ניסיתי שוב",
  "error.upload_retry": "הטייק שמור אצלך. מנסות להעלות שוב",
  "error.processing_failed": "משהו לא הסתדר בעריכה. הטייק שלך שמור, אפשר לנסות שוב",
  "error.unsupported": {
    f: "הדפדפן הזה עוד לא יודע להקליט וידאו. עדכני את iOS או פתחי בספארי",
    m: "הדפדפן הזה עוד לא יודע להקליט וידאו. עדכן את iOS או פתח בספארי",
  },
  "error.open_in_safari": { f: "כדי לצלם, פתחי את הקישור בספארי", m: "כדי לצלם, פתח את הקישור בספארי" },
} as const satisfies Record<string, CopyValue>;

export type BroadcastCopyKey = keyof typeof BROADCAST_COPY;

// Session gender, set once by the room client on mount. One user per browser
// session, so a module singleton is safe; explicit gender args still win.
let sessionGender: BroadcastGender = null;

export function setBroadcastGender(gender: BroadcastGender): void {
  sessionGender = gender;
}

export function getBroadcastCopy(key: BroadcastCopyKey, gender?: BroadcastGender): string {
  const value: CopyValue = BROADCAST_COPY[key];
  if (typeof value === "string") return value;
  return (gender ?? sessionGender) === "m" ? value.m : value.f;
}
