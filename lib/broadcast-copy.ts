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
export type BroadcastLanguage = "he" | "en";

type CopyValue = string | { f: string; m: string };

export const BROADCAST_COPY = {
  // Entry button (shoot-day tab)
  "entry.cta": "לצלם עכשיו",

  // Screen 2 — preparation
  "prep.eyebrow": "חדר השידור · בטא",
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
  "room.float_loading": "מכינה את הטלפרומפטר הצף",
  "room.float_ready": "הפעלת החלון הצף",
  "room.float_skip": "לצלם בלי טלפרומפטר",
  "room.float_open_camera": "פתיחת המצלמה",
  "room.float_hint": "החלון הצף נשאר מעל המצלמה. גרירה מזיזה אותו, נגיעה עוצרת ומחדשת את הגלילה",
  "room.vad_toggle": "עצירה בשקט",
  "room.exit": "יציאה",
  "room.stop": "עצירה",
  "room.record": "הקלטה",
  "room.zoom": "זום",
  "room.play": "ניגון",

  // Navigation labels (TopBar back/extra links)
  "nav.back": "חזרה",
  "nav.to_episodes": "לפרקים שלי",
  "nav.back_to_camera": "חזרה לצילום",
  "nav.to_kit": "חזרה לערכת האות",

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
  "takes.take_label": "טייק",
  "takes.sending": "הטייק נשלח לבמאית",
  "takes.select_cta": { f: "בחרי את הטייק הזה", m: "בחר את הטייק הזה" },
  "takes.another": "טייק נוסף",
  "takes.uploading": "הטייק עולה",
  "takes.interrupted": "הצילום נעצר",
  "takes.duration_short": "הטייק קצר מ-10 שניות. שווה לנסות טייק נוסף, יש לך את זה",
  "takes.duration_long": "הטייק ארוך מ-3 דקות. הבמאית עובדת עד 3 דקות, כדאי טייק ממוקד יותר",
  "takes.version_limit": "לתסריט הזה כבר יש שלוש גרסאות ערוכות. זה הרגע לבחור אחת ולפרסם",
  "takes.season_full": "העונה מלאה: שבעה פרקים באוויר. כדי לצלם פרק חדש, מחקו פרק מהסדרה שלכם בכוורת",

  // Processing — הבמאית עורכת
  "processing.title": "הבמאית עורכת",
  "processing.stage.transcribing": "מקשיבה לטייק ויוצרת כתוביות מסונכרנות",
  "processing.stage.awaiting_captions": "הכתוביות מחכות לאישור שלך",
  "processing.stage.burning": "צורבת את הכתוביות ומכינה את הרילס",
  "processing.handoff": "הבמאית מסיימת - נשלח לך הודעה כשהרילס מוכן",
  "processing.handoff_note": "אפשר לסגור את המסך",
  "processing.checking_bg": "ממשיכה לבדוק ברקע, המסך יתעדכן לבד",

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
  "captions.trim.strip_hint": {
    f: "גררי את הידיות בקצוות כדי לחתוך את ההתחלה והסוף",
    m: "גרור את הידיות בקצוות כדי לחתוך את ההתחלה והסוף",
  },
  "captions.trim.selected": "נבחר",
  "captions.zoom.hint": {
    f: "גררי את התמונה למיקום שנוח לך, וקרבי בצביטה או בסליידר. מה שרואים כאן זה מה שנצרב",
    m: "גרור את התמונה למיקום שנוח לך, וקרב בצביטה או בסליידר. מה שרואים כאן זה מה שנצרב",
  },
  "captions.zoom.reset": "איפוס מסגור",
  "captions.failed.title": "התמלול לא הסתדר הפעם",
  "captions.failed.option_none": "רילס בלי כתוביות",
  "captions.failed.option_script": "התסריט ככתוביות, בסנכרון באישור שלך",
  "captions.sync.next_line": "השורה הבאה",
  "captions.back_to_choice": "לבחירה",
  "captions.trim.seconds": "שניות",

  // Screen 6 — output
  "output.ready_title": "הרילס מוכן",
  "output.preparing_share": "מכינה את הקובץ לשיתוף",
  "output.done_link": "סיימתי לפרק הזה, חזרה לפרקים שלי ←",
  "output.stamp": "מצולם, לא מיוצר",
  "output.share": "שיתוף הרילס",
  "output.share_hint": "נפתח מסך השיתוף, שם בוחרים אינסטגרם",
  "output.download_video": "הורדת הווידאו",
  "output.reedit": "עריכה מחדש",
  "output.reedit_gone": "חומר הגלם של הפרק כבר לא שמור, אפשר לצלם טייק חדש",
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
  "room.placement_hint": "הרחיקו את הטלפון, הניחו אותו במקום יציב בגובה העיניים",
  "room.placement_hint_desktop": "הגביהו את המסך כך שהמצלמה בגובה העיניים, והביטו אליה כשאתם מדברים",
  "permission.title": "אנחנו צריכות את המצלמה",
  "permission.body":
    "חדר השידור מצלם אותך במצלמה הקדמית. הדפדפן חסם את הגישה, ככה פותחים אותה",
  "permission.step1": "לוחצים על aA בשורת הכתובת",
  "permission.step2": "בוחרים הגדרות אתר",
  "permission.step3": "מצלמה ומיקרופון: אישור",
  "permission.retry": "ניסיתי שוב",
  "permission.desktop_title": "אנחנו צריכות את המצלמה",
  "permission.desktop_body":
    "חדר השידור מצלם אתכם במצלמת המחשב. הדפדפן חסם את הגישה, ככה פותחים אותה",
  "permission.d_step1": "לוחצים על סמל המצלמה בשורת הכתובת",
  "permission.d_step2": "בוחרים לאפשר מצלמה ומיקרופון",
  "permission.d_step3": "מרעננים את העמוד",
  "permission.desktop_alt": "מעדיפים סלפי? אותו עמוד עובד גם מהטלפון",
  "error.upload_retry": "הטייק שמור אצלך. מנסות להעלות שוב",
  "error.processing_failed": "משהו לא הסתדר בעריכה. הטייק שלך שמור, אפשר לנסות שוב",
  "error.unsupported": {
    f: "הדפדפן הזה עוד לא יודע להקליט וידאו. עדכני את iOS או פתחי בספארי",
    m: "הדפדפן הזה עוד לא יודע להקליט וידאו. עדכן את iOS או פתח בספארי",
  },
  "error.open_in_safari": { f: "כדי לצלם, פתחי את הקישור בספארי", m: "כדי לצלם, פתח את הקישור בספארי" },
} as const satisfies Record<string, CopyValue>;

export type BroadcastCopyKey = keyof typeof BROADCAST_COPY;

// English copy for /en members (signal_extractions.signal.language === "en").
// English has no grammatical gender, so every value is a plain string.
// Voice: quiet, warm, terse teleprompter/filming language. Plain hyphen only,
// never an em dash. No exclamation marks.
export const BROADCAST_COPY_EN: Record<BroadcastCopyKey, string> = {
  // Entry button (shoot-day tab)
  "entry.cta": "Film now",

  // Screen 2 — preparation
  "prep.eyebrow": "The Broadcast Room · beta",
  "prep.title": "Your script, once, straight through",
  "prep.tip.eyeline": "Camera at eye level, face toward the light",
  "prep.tip.one_friend": "You're talking to one friend, not a crowd",
  "prep.tip.no_fixing": "Don't fix a take mid-flow. Stop and start a fresh one",
  "prep.cta": "I'm ready",

  // Screen 3 — broadcast room
  "room.pause": "Pause",
  "room.restart": "From the top",
  "room.speed": "Speed",
  "room.size": "Size",
  "room.rotate_back": "Rotate back to portrait",
  "room.native_capture": "Film with the phone camera",
  "room.float_loading": "Preparing the floating teleprompter",
  "room.float_ready": "Open the floating window",
  "room.float_skip": "Film without the teleprompter",
  "room.float_open_camera": "Open the camera",
  "room.float_hint":
    "The floating window stays above the camera. Drag to move it, tap to pause and resume the scroll",
  "room.vad_toggle": "Pause on silence",
  "room.exit": "Exit",
  "room.stop": "Stop",
  "room.record": "Record",
  "room.zoom": "Zoom",
  "room.play": "Play",

  // Navigation labels (TopBar back/extra links)
  "nav.back": "Back",
  "nav.to_episodes": "My episodes",
  "nav.back_to_camera": "Back to the camera",
  "nav.to_kit": "Back to the Signal Kit",

  // Director lines (the director)
  "director.encourage_after_take1": "Take 3 is almost always the best one",
  "director.perfectionism_after_take5":
    "Past take 5 you don't get more real, just more careful. Pick one of the last three",
  "director.breathing": "The director has your take. You can breathe",
  "director.release": "It's filmed, it's real, and it's yours",

  // Screen 4 — take selection
  "takes.title": "Choose a take",
  "takes.take_label": "Take",
  "takes.sending": "Sending the take to the director",
  "takes.select_cta": "Use this take",
  "takes.another": "Another take",
  "takes.uploading": "Uploading",
  "takes.interrupted": "Recording stopped",
  "takes.duration_short": "This take is under 10 seconds. Worth one more, you've got this",
  "takes.duration_long":
    "This take runs past 3 minutes. The director edits up to 3 minutes, a tighter take will serve you better",
  "takes.version_limit": "This script already has three edited versions. Time to choose one and publish",
  "takes.season_full":
    "Your free plan includes one filmed episode, and it is live. More episodes are coming soon - or delete your episode in the Hive to film it again",

  // Processing — the director is editing
  "processing.title": "The director is editing",
  "processing.stage.transcribing": "Listening to the take and building synced captions",
  "processing.stage.awaiting_captions": "The captions are waiting for your approval",
  "processing.stage.burning": "Burning in the captions and preparing the reel",
  "processing.handoff": "The director is finishing - we'll message you when the reel is ready",
  "processing.handoff_note": "You can close this screen",
  "processing.checking_bg": "Still checking in the background, this screen will update on its own",

  // Screen 5 — caption approval
  "captions.title": "Approve captions",
  "captions.hint": "Fix any words the transcript missed. Nothing gets burned in without your approval",
  "captions.approve_cta": "Approve and finish",
  "captions.delete_line": "Delete line",
  "captions.trim_start.title": "Start of the take",
  "captions.trim_end.title": "End of the take",
  "captions.trim.strip_hint": "Drag the handles at the edges to trim the start and the end",
  "captions.trim.selected": "Selected",
  "captions.trim.seconds": "seconds",
  "captions.zoom.hint":
    "Drag the frame to where it feels right, and zoom with a pinch or the slider. What you see here is what gets burned in",
  "captions.zoom.reset": "Reset framing",
  "captions.failed.title": "The transcript didn't come together this time",
  "captions.failed.option_none": "Reel without captions",
  "captions.failed.option_script": "The script as captions, synced with your approval",
  "captions.sync.next_line": "Next line",
  "captions.back_to_choice": "Back to options",

  // Screen 6 — output
  "output.ready_title": "The reel is ready",
  "output.preparing_share": "Preparing the file to share",
  "output.done_link": "Done with this episode, back to my episodes",
  "output.stamp": "Filmed, not produced",
  "output.share": "Share the reel",
  "output.share_hint": "The share sheet opens, choose Instagram there",
  "output.download_video": "Download the video",
  "output.reedit": "Re-edit",
  "output.reedit_gone": "The raw footage for this episode is no longer stored, you can film a new take",
  "output.download_cover": "Download the cover",
  "output.cover_title": "Your cover",
  "output.cover_hint": "The hook gets burned onto the frame you choose",
  "output.review_link": "Your reel is also waiting in post review",

  // Review tab pending items
  "review.pending_title": "Waiting for review",
  "review.mark_published": "Published",

  // Permission + errors
  "room.placement_hint": "Set the phone back a little, somewhere steady at eye level",
  "room.placement_hint_desktop":
    "Raise the screen so the camera sits at eye level, and look at it while you speak",
  "permission.title": "We need the camera",
  "permission.body":
    "The Broadcast Room films you with the front camera. The browser blocked access, here's how to open it",
  "permission.step1": "Tap aA in the address bar",
  "permission.step2": "Choose Website Settings",
  "permission.step3": "Camera and Microphone: Allow",
  "permission.retry": "I tried again",
  "permission.desktop_title": "We need the camera",
  "permission.desktop_body":
    "The Broadcast Room films you with your computer's camera. The browser blocked access, here's how to open it",
  "permission.d_step1": "Click the camera icon in the address bar",
  "permission.d_step2": "Choose to allow the camera and microphone",
  "permission.d_step3": "Refresh the page",
  "permission.desktop_alt": "Prefer a selfie? The same page works from your phone",
  "error.upload_retry": "Your take is safe on this device. Trying the upload again",
  "error.processing_failed": "Something went wrong in the edit. Your take is saved, you can try again",
  "error.unsupported": "This browser can't record video yet. Update iOS or open in Safari",
  "error.open_in_safari": "To film, open this link in Safari",
};

// Session gender, set once by the room client on mount. One user per browser
// session, so a module singleton is safe; explicit gender args still win.
let sessionGender: BroadcastGender = null;

export function setBroadcastGender(gender: BroadcastGender): void {
  sessionGender = gender;
}

// Session language, set once by the room client beside the gender. Default is
// Hebrew — every existing call site keeps its exact behavior.
let sessionLanguage: BroadcastLanguage = "he";

export function setBroadcastLanguage(lang: BroadcastLanguage): void {
  sessionLanguage = lang;
}

export function getBroadcastLanguage(): BroadcastLanguage {
  return sessionLanguage;
}

export function getBroadcastCopy(key: BroadcastCopyKey, gender?: BroadcastGender): string {
  if (sessionLanguage === "en") {
    const en = BROADCAST_COPY_EN[key];
    if (typeof en === "string") return en; // fall through to Hebrew if missing
  }
  const value: CopyValue = BROADCAST_COPY[key];
  if (typeof value === "string") return value;
  return (gender ?? sessionGender) === "m" ? value.m : value.f;
}
