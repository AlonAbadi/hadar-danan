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

// ── English edition ─────────────────────────────────────────────────────
// Same season taxonomy, written for the English hive (The Signal Hive).
// Hadar's Hebrew teachings are rendered in English, attributed.

export const KAVERET_SEASONS_EN: KaveretSeason[] = [
  {
    number: 1,
    title: "The Foundations",
    tagline: "Your signal builds your identity line and four message pillars",
    episodes: 7,
    status: "live",
    what: "The season you are inside right now. Seven episodes that build your identity line and the four message pillars that feed everything you make from here on.",
    why: "Every future season stands on these foundations. Without this core, the rest is decoration.",
  },
  {
    number: 2,
    title: "Me, In Action",
    tagline: "Show what you look like while you deliver",
    episodes: 6,
    status: "next",
    what: "Six episodes that show you working: taking on a new client, untangling a hard problem in real time, the moment you stop and listen, fixing a mid-course mistake, closing a conversation, and the one small habit of your service only you have.",
    why: "Hadar names this the most important category - it dissolves price and fear objections before the client ever reaches a sales call.",
  },
  {
    number: 3,
    title: "Full Disclosure",
    tagline: "Five episodes in Hadar's signature format",
    episodes: 5,
    status: "coming",
    what: "Every episode opens with \"I want to be fully honest with you\" and reveals a truth people don't like hearing - drawn directly from your signal.",
    why: "Hadar's teaching: this becomes your strongest asset. A signature that cannot be faked.",
  },
  {
    number: 4,
    title: "The Signal Dictionary",
    tagline: "A whole season on one word from your signal",
    episodes: 7,
    status: "coming",
    what: "If your signal carries a word - gap, clarity, endurance - a whole season explores that one word: what it really is, what it is not, the moment it breaks, who owns it, how it changes over time.",
    why: "Hadar's teaching: don't talk about the field, talk about the word. That is where the specificity lives that pulls only the people who need you.",
  },
  {
    number: 5,
    title: "Testimony, In Their Voice",
    tagline: "Clients saying your signal line back in their own words",
    episodes: 5,
    status: "coming",
    what: "Testimonials produced with the interview questions you received in season one. Five episodes of clients saying your signal line in their own voice.",
    why: "A regular testimonial proves you are good. A testimonial that returns your signal line proves you solve exactly what you said you solve.",
  },
  {
    number: 6,
    title: "Objections, Investigated",
    tagline: "Investigate objections - never answer them",
    episodes: 5,
    status: "future",
    what: "Each episode takes one objection from your category and returns it as a counter-question that exposes a worldview. A season of anti-selling.",
    why: "Hadar's teaching: don't answer objections, investigate them. The viewer discovers the insight themselves.",
  },
  {
    number: 7,
    title: "The Origin Story",
    tagline: "A special season: how your signal was born",
    episodes: 4,
    status: "future",
    what: "Four longer episodes. The story of how the gap you see in your category revealed itself to you. The moment you saw it. The time you fell. The first person who said it out loud.",
    why: "The people who follow you form their identity through your story. Without it, a signal sounds like a formula.",
  },
  {
    number: 8,
    title: "The Mantras",
    tagline: "Short signature lines people forward without adding a word",
    episodes: 4,
    status: "future",
    what: "Four very short episodes. Each one - a single mantra from your signal, unfolded. Built so people forward them with no caption of their own.",
    why: "Your brand lives in memory through its mantras. They are the moment a signal becomes something you can hold.",
  },
  {
    number: 9,
    title: "The Unasked Question",
    tagline: "The questions your client asks themselves quietly",
    episodes: 6,
    status: "future",
    what: "Each episode takes a question your ideal audience asks themselves in silence, says it out loud - and the answer is your signal.",
    why: "Your audience is not looking for more content. They are looking for someone to phrase what they could not. A whole season of those moments.",
  },
  {
    number: 10,
    title: "The Responder",
    tagline: "Fast response to what is happening in your category",
    episodes: 5,
    status: "future",
    what: "A live season: when something happens in your field, an episode ships within hours that runs the event through your signal. Five episodes a month that touch what is current.",
    why: "The signal becomes alive, not archived. Your audience sees you speaking now, not last year.",
  },
];

export const KAVERET_SEASONS_INTRO_EN =
  "The hive does not end with season one. Every month, a new season - same signal, different angle. A glimpse of what is waiting.";
