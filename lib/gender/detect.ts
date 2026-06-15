/**
 * Hebrew first-name → grammatical gender detection.
 *
 * Used at the /signal lead gate to decide whether to address the visitor in
 * masculine ('m', אתה / שלך / -ת) or feminine ('f', את / שלך / -י) singular.
 * Most Hebrew first names are gender-unambiguous, so a static dictionary
 * resolves the majority of cases in zero ms and without any API call.
 *
 * Fallback: 'f' (feminine) — beegood.online's core audience skews female
 * (coaches, agency owners, personal-brand builders). Picking the right side
 * of the coin matters more than picking the safe-sounding side.
 */
export type Gender = "m" | "f";

const MALE_NAMES = new Set<string>([
  // Common Hebrew male first names
  "אלון", "אביב", "אביעד", "אבי", "אבישי", "אדם", "אהרון", "אורי", "אופיר",
  "איתי", "איתמר", "איתן", "אלעד", "אלי", "אליעזר", "אליהו", "אמיר", "אסף",
  "אריאל", "אריה", "ארז", "ארנון", "אורן", "אופק", "אורון",
  "בן", "בנימין", "בני", "ברק", "בועז",
  "גבריאל", "גדי", "גיא", "גיל", "גלעד", "גל", "גור",
  "דוד", "דניאל", "דן", "דרור", "דקל",
  "הלל", "הראל",
  "ולדימיר",
  "זאב", "זוהר",
  "חיים", "חן", "חנן",
  "טל", "טוביה", "טום", "טוהר",
  "יאיר", "יאניב", "יבגני", "יהונתן", "יהודה", "יואב", "יואל", "יוחנן", "יוסי",
  "יוסף", "יורם", "יזהר", "יחיאל", "ינון", "יניב", "יעקב", "יפתח", "יצחק",
  "ירון", "ירדן", "ישי", "ישראל",
  "כפיר",
  "לב", "לוי", "ליאור", "ליאם", "לירן",
  "מאור", "מאיר", "מוטי", "מיכאל", "מנחם", "מני", "מתן", "מתי", "משה",
  "נדב", "נחמיה", "ניסן", "ניר", "נח", "נריה", "נתן", "נתנאל",
  "סהר", "סלע", "סער", "ספיר",
  "עדן", "עוז", "עומר", "עידן", "עידו", "עידי", "עמית", "עמיר", "עמנואל",
  "ערן", "עוזי",
  "פלג", "פנחס",
  "צבי", "צח",
  "קובי", "קים",
  "רהב", "רואי", "רוי", "רומן", "רון", "רוני", "רותם", "רז", "רחמים", "רן",
  "רענן", "רפאל", "רומי",
  "שאול", "שגיא", "שובל", "שון", "שחר", "שי", "שלום", "שלמה", "שמואל",
  "שמעון", "שניר", "שקד",
  "תום", "תומר", "תמיר",
]);

const FEMALE_NAMES = new Set<string>([
  // Common Hebrew female first names
  "אביגיל", "אביה", "אדל", "אופירה", "אורית", "אורלי", "אורנה", "אילנה",
  "אילה", "איריס", "אלה", "אלונה", "אליה", "אלינור", "אלישבע", "אלמה",
  "אמא", "אמיתי", "אמלי", "אמילי", "אסתר", "אסיה", "אפרת", "אריאלה",
  "בלהה", "ברכה", "בר",
  "גילה", "גלית",
  "דבורה", "דגנית", "דורית", "דנה", "דניאלה", "דפנה", "דקלה",
  "הדס", "הדר", "הדרה", "הילה",
  "ויקטוריה", "ויקי", "ורד",
  "זהבה", "זיוה",
  "חוה", "חיה", "חני", "חנה",
  "טליה", "טל",
  "יאל", "יהודית", "יעל", "יפה", "יפעת", "יסכה",
  "כרמית", "כרמל", "כינרת",
  "לאה", "ליאן", "ליאת", "ליבי", "לילך", "ליהי", "לי", "לימור", "לינוי",
  "לירון", "ליה", "לירז", "לירית", "לוטם", "לוטן",
  "מאיה", "מורן", "מורין", "מורי", "מיכל", "מיטל", "מירב", "מירי", "מירית",
  "מיקה", "מלכה", "מרים", "מתנה",
  "נאוה", "נגה", "נדיה", "נופר", "נטלי", "נטע", "נטליה", "ניצן", "ניצה",
  "נינה", "נעה", "נעמה", "נעמי",
  "סופי", "סופיה", "סיגל", "סיון", "סמדר", "סטלה",
  "עדן", "עדינה", "עדי", "עדה", "עטרה", "עמליה", "ענבל", "ענבר", "ענת",
  "עפרי", "עופרה",
  "פנינה",
  "צביה", "צופיה",
  "קים", "קרן",
  "רבקה", "רוז", "רוית", "רותם", "רוני", "רחל", "רינה", "רן", "רנית",
  "רעות", "רעות", "ריבי", "רונית",
  "שגית", "שובל", "שולמית", "שורה", "שחר", "שיר", "שירה", "שירז", "שירן",
  "שיראל", "שלי", "שני", "שקד", "שרה", "שרון", "שריאל",
  "תהילה", "תכלת", "תמר",
]);

/**
 * Detects gender from a Hebrew first name. Returns 'f' as a safe default when
 * the name is unknown or ambiguous (present in both sets).
 *
 * Ambiguity strategy: a handful of names (רותם, רוני, שחר, שקד, עדן, ספיר,
 * רן, שובל, טל, etc.) work for both genders. They appear in both sets above
 * intentionally — `detectGender` returns 'f' when found in both (safer default
 * for the audience). For the rare misfire on a male visitor named "טל" we rely
 * on the prompt's gender override, and on the option to surface a manual fix
 * in the lead gate later if needed.
 */
export function detectGender(firstName: string | undefined | null): Gender {
  if (!firstName) return "f";
  const clean = firstName.trim().split(/\s+/)[0]; // first token only
  if (!clean) return "f";

  const inFem  = FEMALE_NAMES.has(clean);
  const inMale = MALE_NAMES.has(clean);

  if (inFem  && !inMale) return "f";
  if (inMale && !inFem)  return "m";
  // Both or neither → default feminine (core audience).
  return "f";
}

/**
 * Returns the Hebrew label for a gender, used in prompt instructions and
 * error messages.
 */
export function genderLabel(g: Gender): string {
  return g === "m" ? "זכר" : "נקבה";
}
