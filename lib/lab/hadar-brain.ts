/**
 * Lab — distilled Hadar brain.
 *
 * Everything the lab prompts need to reason like Hadar in a shoot day:
 *   - 20 signature moves (distilled from lib/prompts/shoot-day-engine.ts,
 *     canonical list + short usage note per move)
 *   - Voice mechanics at the sentence level (openers, transitions, landing
 *     beats) — the micro-craft
 *   - Signal-keyword → mandatory move rules (from Phase A)
 *   - Archetype → allowed move pool
 *
 * This file is a self-contained snapshot copied into the lab so the lab
 * can evolve independently of production. If the production catalog gets
 * a #21, we'll port it here manually.
 */

export const APPROVED_MOVE_NAMES = [
  "External→Internal Translation",
  "Service Reframe",
  "אני אקביל לך Parable Building",
  "Tangible Metaphor Anchor",
  "Sold-Inversion",
  "Self-as-example",
  "Embodiment direction (Projective)",
  "Anti-flattery",
  "Sensory-to-Business Translation",
  "Process-as-Proof",
  "Receptive Embodiment",
  "Specificity-as-Service",
  "Silent Authority Positioning",
  "Category-Rename / Reclaim",
  "Diagnostic-Framework Reveal",
  "Moral-Obligation Activation",
  "Chain-Collapse Rhetoric",
  "Full-Disclosure Reveal",
  "Sacred-Path Protection",
  "Proxy Embodiment",
] as const;

export type SignatureMoveName = typeof APPROVED_MOVE_NAMES[number];

/**
 * Full 20-move catalog. Each entry: how to recognize it fits, what it
 * looks like structurally, and what it forbids. Written for the LLM to
 * choose from — dense on structure, sparse on prose.
 */
export const SIGNATURE_MOVES_CATALOG = `רשימת 20 מהלכי החתימה של הדר (רשימה סגורה — אסור להמציא שם חדש):

1. External→Internal Translation — הלקוח אומר "אני עושה X"; אתה כותב "אני מקשיב ל־Y שמתחת ל־X". דוגמה: "אני עושה טיפולי פנים" → "אני מקשיבה לעור, מה הוא צריך עכשיו."

2. Service Reframe — "זאת לא [פעולה שטחית], זאת [פעולה עם משמעות]". דוגמה: "זאת לא מכירה, זאת הצלה."

3. אני אקביל לך Parable Building — אנלוגיה מתחום אחר (שמאות, קונדיטוריה, ארכיטקטורה) כדי למקם מושג שהלקוח לא מבין.

4. Tangible Metaphor Anchor — הופך מושג אבסטרקטי לתמונה מוחשית. "זה כמו לקחת קופסת סיגריות ולא לקרוא את האזהרות."

5. Sold-Inversion — "מכרו לנו ש־[הבטחה], ובסוף [המחיר האמיתי]". "מכרו לנו שהאיי־איי הוא חופש, ובסוף הוא לקח לנו את החופש."

6. Self-as-example — המשתמש/הדר משמש/ת כאנלוגיה. "תחשוב עליי, זה כמו שאני אחליט מחר ש..."

7. Embodiment direction (Projective) — הוראות גוף לסמכות קוגניטיבית: "לא לזוז בכיסא. בלי לכרסם ציפורניים. אתה יודע שאתה עושה את זה כמו שצריך." **רק** ליועץ/מאמן/אסטרטג/עו"ד. אסור למותג חושי.

8. Anti-flattery — "אל תרצה אותי. תביא לי נתונים או תגיד לא נכון. אבל אל תרצה אותי."

9. Sensory-to-Business Translation — למותגי חוש (ריח/טעם/מוזיקה/מגע): התפקיד העסקי הוא ההחלטה שהחוש מפעיל, לא ההנאה. "הריח הוא ארכיטקטורת קנייה, לא הנאה."

10. Process-as-Proof — יד־עבודה/ייצור: לחשוף פרט־תהליך ספציפי (חומרים/טמפרטורות/רצף) לנעילת loyalty לטווח ארוך. "פתיל פתיל, יציקה כפולה, טמפרור כמו קונדיטוריה."

11. Receptive Embodiment — למותגי חוש בלבד. הוראת גוף הפוכה מ־#7: הגוף נח, החוש הוא הפעיל. "לאט, כל פעולה לאט. סתכל, זה הריח. תפתח. אל תהיה דם."

12. Specificity-as-Service — טיפול/טרנספורמציה: הערך אינו בהבנה הכללית של הלקוח, אלא בדיוק של הנקודה הספציפית. "אם אני לא מבינה את הנקודה הספציפית של כל אחד, אין שיקום."

13. Silent Authority Positioning — B2B־טכני עם ידע אסימטרי. המומחה לא "טוב יותר" — אלא היחיד שמבין מנגנון בלתי־נראה שכולם משתמשים בו בלי לדעת. "הריח הוא איש המחירות הכי שקט שיש."

14. Category-Rename / Reclaim — לקטגוריה רוויה (מאמנים, מטפלים, יועצים). מחליף את שם הפעולה למשהו שרק המשתמש יכול לטעון. לרוב מתחיל בשלילה: "אל תעשו סרטונים." / "אין דבר כזה זימון מציאות."

15. Diagnostic-Framework Reveal — **בדיוק 3** פרמטרים שהמשתמש בודק לפני מתן תשובה. הופך אינטואיציה לפורנזיקה. "אני בודקת שלושה: אישיות, דינמיקה, וחוקי הזוגיות." רק אם באמת קיים אצלו framework כזה, אסור להמציא.

16. Moral-Obligation Activation — הופך את "לא לרכוש" ל"עבירה מוסרית" כלפי מישהו שהלקוח אחראי לו (עצמו/ילד/בן זוג/לקוח). "זה פשע לא לתת לה את זה." שימוש: מותגים טיפוליים, חינוכיים, בריאותיים.

17. Chain-Collapse Rhetoric — שרשרת קצרה של שלילות: "אין X, אין Y. אין Y, אין Z." שימוש: פתיחת hook של PROBLEM/CRITIQUE. אסור אם אין קשר סיבתי מוחשי בין החוליות.

18. Full-Disclosure Reveal — פתיחה קנונית קבועה: "אני רוצה לעשות איתכם/ן גילוי נאות." ואחריה אמת לא־נוחה שנגזרת ישירות מהאות של המשתמש. "רוב בעלי העסקים לא צריכים עוד אסטרטגיה." זו חתימת מותג. שימוש: CRITIQUE (V4) כאלטרנטיבה.

19. Sacred-Path Protection — הגנה על ה"למה" הפנימי של העסק נגד לחצים חיצוניים שנראים כמו הצלחה. "אם נלך אחרי X, נאבד את Y, ו־Y זה למה התחלנו." מתאים למייסדים עם משימה, אמנים, תרפיה עמוקה.

20. Proxy Embodiment — במקום להראות את הלקוח שלך בפעולה, מראים את **הלקוח־של־הלקוח** (הצד השלישי שמקבל את הערך). "כי אני רואה את הילדים האלה. הם התיקון שלי." מתאים: אדריכלים, מעצבי פנים, UX, מטפלים בילדים/הורים, מאמני מנהיגות.`;

export const VOICE_MECHANICS_BRIEF = `מכניקות ברמת המשפט (משתמשים בכלים האלה בזהירות, לא מכל אחד בכל סרטון):

**פותחי־בעיטה:** "רגע." / "עכשיו," / "אני אגיד לכם" / "בואו נעמיק" / "בא לי להגיד לך" / "תהיו איתי רגע" / "בסופו של דבר,"

**גשרי־מעבר:** "אז מה עשיתי?" / "וברגע ש..." / "במקום X, [imperative], ולא הפוך" / "זאת בעיה. ולמה זאת בעיה? כי בסופו של דבר..." / "מה זה אומר?" / "אני לא [X], אני מדברת על [Y]"

**סגירות (Landing beats):** "זאת המשוואה." / "זה הדבר." / "וזה בדיוק ה[X]." / "וזה מה ש[הם] לא מבינים." / "המחירה לא מתחילה ב[X], היא מתחילה ב[Y]."

**חוק שימוש קשיח:** לא יותר משני "פותחי־בעיטה" בסרטון אחד. אם משתמשים ב"רגע" בפתיח, לא לחזור עליו בגשר. סגירה חייבת להיות אחת בלבד, בסוף.

**Client-quote handling:** לפתוח ציטוט של לקוח ב־"באה ואמרה לי [תיאור, לא שם]" / "אמרה לי [ציטוט מדויק]". חיתוך בתוך ציטוט: "רגע, שנייה,".`;

// Signal-keyword → mandatory move rules (from Phase A, distilled).
// The move-selector prompt is instructed to check these first.
export const KEYWORD_MOVE_RULES: { keywords: string[]; move: SignatureMoveName; note: string }[] = [
  { keywords: ["חוש", "ריח", "טעם", "מגע", "אקוסטיקה"], move: "Sensory-to-Business Translation", note: "בנוסף Receptive Embodiment חובה" },
  { keywords: ["פער", "בין X ל־Y", "בין X ל־", "מרחק", "שני עולמות"], move: "Receptive Embodiment", note: "לפחות בפרק אחד" },
  { keywords: ["מסלול", "משימה", "מהות", "מייסד", "אמן", "לא רודף אחרי המספרים"], move: "Sacred-Path Protection", note: "חובה ב־CRITIQUE" },
  { keywords: ["רואה את X שלא רואה את עצמו", "לקוחות של לקוחות", "משתמש הסופי"], move: "Proxy Embodiment", note: "חובה" },
  { keywords: ["פרויקט אישי", "עסק־תשוקה", "מהות שהתחלתי איתה"], move: "Sacred-Path Protection", note: "" },
];

/**
 * Structural template per move. Tells the script prompt exactly how the
 * move looks in shape: opening beat, body beat, landing beat, forbidden
 * shapes. Without these, the script prompt knows THAT it should apply a
 * move but not HOW it looks structurally, so abstract moves like Silent
 * Authority Positioning under-deliver.
 *
 * Each template is short. Real Hadar shoots vary; these are the tightest
 * template that any competent execution of the move must hit.
 */
export type MoveTemplate = {
  hook_shape:       string;
  body_shape:       string;
  landing_shape:    string;
  canonical_devices: string[];
  forbidden_shapes: string[];
  total_sentences:  string;  // rough target, e.g. "4-6"
};

export const MOVE_STRUCTURAL_TEMPLATES: Record<SignatureMoveName, MoveTemplate> = {
  "External→Internal Translation": {
    hook_shape:       "משפט אחד שמצטט את מה שהקהל חושב שאתה עושה (הפעולה החיצונית), ואז pivot ל'אני מקשיב ל־Y שמתחת ל־X'. שני חלקים בהוק, לא יותר.",
    body_shape:       "2-3 משפטים שמדגימים מה זה Y — לא הסבר תיאורטי, סיטואציה קונקרטית של מה שאתה שומע/רואה שאחרים מפספסים.",
    landing_shape:    "משפט קצר שממקבע: 'זו העבודה', 'זה מה שאני עושה', 'זה מה שקורה במפגש איתי'.",
    canonical_devices:["opener:'אנשים חושבים ש...'", "transition:'אני מקשיב ל־'", "landing:'זו העבודה.'"],
    forbidden_shapes: ["רשימה של פעולות שאתה עושה", "הסבר של תפיסת העולם שלך בגוף שלישי"],
    total_sentences:  "5-7",
  },

  "Service Reframe": {
    hook_shape:       "'זה לא [פעולה שטחית]. זה [פעולה עם משמעות].' — בדיוק במבנה הזה, בלי נקודה באמצע.",
    body_shape:       "2-3 משפטים שמסבירים למה הפעולה השטחית *נראית* נכונה אבל בעצם מפספסת. הפעולה עם המשמעות היא מה שהעבודה בפועל.",
    landing_shape:    "חזרה על המשוואה עם דיוק נוסף, למשל 'זו לא [X]. זו לא [X']. זו [Y].' חיזוק בשלילה כפולה.",
    canonical_devices:["opener:'זה לא [X], זה [Y].'", "landing:'זו לא X, זו לא X', זו Y.'"],
    forbidden_shapes: ["הצהרה של 'המשמעות של עבודתי'", "רשימה של יתרונות"],
    total_sentences:  "4-6",
  },

  "אני אקביל לך Parable Building": {
    hook_shape:       "'אני אקביל לך' + אנלוגיה מתחום שרחוק מהתחום שלך (שמאות, קונדיטוריה, ארכיטקטורה, רפואה).",
    body_shape:       "פיתוח האנלוגיה 3-4 משפטים, שכל הצעד באנלוגיה מקביל לצעד בעבודה שלך.",
    landing_shape:    "משפט אחד שסוגר את המעגל: 'בדיוק ככה אני עובד/ת עם [הלקוח שלך]'.",
    canonical_devices:["opener:'אני אקביל לך [תחום].'"],
    forbidden_shapes: ["אנלוגיה מהתחום של המשתמש עצמו", "שתי אנלוגיות מקבילות"],
    total_sentences:  "5-7",
  },

  "Tangible Metaphor Anchor": {
    hook_shape:       "משפט אחד שמציג מטאפורה מוחשית של מושג אבסטרקטי. תמונה, לא הגדרה. 'זה כמו לקחת X ולא [פעולה שולית שכולם עושים]'.",
    body_shape:       "2-3 משפטים שממחישים את המטאפורה עם פרטים סנסוריים או מספריים. הקורא רואה את התמונה, לא שומע הסבר.",
    landing_shape:    "חזרה על המטאפורה במילים חדשות למקבע אותה בזיכרון.",
    canonical_devices:["opener:'זה כמו X'"],
    forbidden_shapes: ["מטאפורה + הסבר שיווקי אחריה", "מטאפורה מופשטת ('זה כמו זרם של אנרגיה')"],
    total_sentences:  "4-6",
  },

  "Sold-Inversion": {
    hook_shape:       "'מכרו לנו/לך ש־[הבטחה הרווחת]. בסוף [המחיר האמיתי].' — בדיוק במבנה הזה, שני משפטים.",
    body_shape:       "2-3 משפטים שמראים ספציפית את הפער בין ההבטחה למחיר. כמה זמן חלף, מה הצטבר, מי נפגע.",
    landing_shape:    "משפט חד ברגיסטר של אזהרה או הבנה קרה: 'זה מה שקנית באמת.' / 'לזה לא הייתה לנו הכנה.'",
    canonical_devices:["opener:'מכרו לנו ש...'", "landing:'זה מה שקנית באמת.'"],
    forbidden_shapes: ["ביקורת על מישהו ספציפי בשם", "'צריך לחזור לבסיס'"],
    total_sentences:  "5-7",
  },

  "Self-as-example": {
    hook_shape:       "'תחשוב/תחשבי עליי.' + משפט אחד על נתיב אישי או החלטה שלך. שני משפטים בהוק.",
    body_shape:       "2-3 משפטים שממשיכים את הסיפור האישי עם פרטים ספציפיים. אחרי זה, pivot דרך 'בדיוק בגלל זה' או 'ולמה זה חשוב? כי' — המשתמש/הלקוח שלך זוכה מזה בפועל.",
    landing_shape:    "משפט שקושר את הנתיב שלך לתוצאה שהלקוח מקבל. לא 'ולכן אני יכול לעזור לך'. יותר בכיוון 'זו הסיבה ש[הלקוח בפעולה קונקרטית]'.",
    canonical_devices:["opener:'תחשוב עליי.'", "transition:'ולמה זה חשוב? כי'"],
    forbidden_shapes: ["סיפור אישי בלי pivot ללקוח", "סיפור אישי שמסתיים ב'ולכן אני הכי טוב'"],
    total_sentences:  "5-7",
  },

  "Embodiment direction (Projective)": {
    hook_shape:       "משפט־הצהרה חד ואז הוראת גוף ישירה. 'אתה יודע מה השווה יותר מ־X? זה. הזקיפות הזאת.'",
    body_shape:       "2-3 הוראות גוף/הימנעות ישירות בסגנון 'לא לזוז בכיסא, בלי לכרסם ציפורניים, לא לומר סליחה לפני שאתה קובע דעה.'",
    landing_shape:    "משפט מעצים: 'אתה יודע שאתה עושה את זה כמו שצריך.'",
    canonical_devices:["opener:'אתה יודע מה השווה יותר מ־X?'", "landing:'אתה יודע שאתה עושה את זה כמו שצריך.'"],
    forbidden_shapes: ["הוראות גוף למותג חושי", "רק שלוש הוראות בלי הצהרה"],
    total_sentences:  "4-6",
  },

  "Anti-flattery": {
    hook_shape:       "'אל תרצה אותי.' או וריאציה חדה: 'אני לא צריכה שתגיד לי X.'",
    body_shape:       "2-3 משפטים שמראים מה כן נדרש במקום: נתונים, פידבק אמיתי, סירוב לרצות. הפוזיציה: אני רוצה שנעבוד יחד, לא שתעבוד בשבילי.",
    landing_shape:    "'תגיד לי גם כשלא בכיוון.' או משפט דומה שהופך את הכלל.",
    canonical_devices:["opener:'אל תרצה אותי.'"],
    forbidden_shapes: ["הסבר של 'למה חשוב פידבק אמיתי'", "רשימה של יתרונות של קרירות מקצועית"],
    total_sentences:  "4-6",
  },

  "Sensory-to-Business Translation": {
    hook_shape:       "משפט על חוש (ריח/טעם/מגע/צליל) שממקבע אותו כמנגנון עסקי, לא כחוויה. 'הריח הוא ארכיטקטורת קנייה, לא הנאה.'",
    body_shape:       "2-3 משפטים שמדגימים איך החוש מפעיל החלטה: זיכרון, חזרה, קנייה חוזרת. פרטים סנסוריים אמיתיים, לא מטאפוריים.",
    landing_shape:    "'זה חוש שגורם ל[הלקוחות שלך] ל[פעולה עסקית קונקרטית].'",
    canonical_devices:["opener:'הריח/הטעם הוא [פונקציה עסקית].'"],
    forbidden_shapes: ["'חוויה חושית מדהימה'", "התמקדות בהנאה של הלקוח"],
    total_sentences:  "5-7",
  },

  "Process-as-Proof": {
    hook_shape:       "פרט־תהליך ספציפי בפתיח, לא הפשטה. 'פתיל פתיל, יציקה כפולה, טמפרור כמו קונדיטוריה.'",
    body_shape:       "2-3 משפטים על תהליך: חומרים, טמפרטורות, רצף. פרטים שלא ניתן לחקות בקלות.",
    landing_shape:    "'בקצה — הלקוח קונה את זה לנצח.' או הבטחת loyalty מסוימת.",
    canonical_devices:["opener:'[פרט תהליך ספציפי]'", "landing:'הלקוח קונה את זה לנצח.'"],
    forbidden_shapes: ["'איכות ברמה גבוהה'", "'תהליך מוקפד'"],
    total_sentences:  "5-7",
  },

  "Receptive Embodiment": {
    hook_shape:       "הוראת גוף איטית וקולטת: 'לאט. כל פעולה לאט. תפתח. תהיה בנחה.'",
    body_shape:       "2-3 משפטים על החוש כמכוון את הלקוח־הסופי בעל כורחו. פרדוקס: הגוף נח, החוש פועל.",
    landing_shape:    "משפט שממקבע את חוסר השליטה של הלקוח־הסופי: 'אין לו שליטה, לא בתגובה ולא בפעולה שיעשה אחר כך.'",
    canonical_devices:["opener:'לאט.'", "landing:'אין לו שליטה.'"],
    forbidden_shapes: ["הוראות גוף פרויקטיביות ('זקיפות, שליטה')", "רגיסטר של כוח"],
    total_sentences:  "4-6",
  },

  "Specificity-as-Service": {
    hook_shape:       "'אם אני לא [רואה/מבין/שומע] את הנקודה הספציפית של כל אחד, [X לא קורה].'",
    body_shape:       "2-3 משפטים על מה הופך את הנקודה לספציפית. מדוע גישה כללית נכשלת. פרט קונקרטי שמראה איך אתה מגיע לנקודה.",
    landing_shape:    "'זה מה שכולם מפספסים.' או משפט שמזהה את הפער בעזרת האחרים כניגוד.",
    canonical_devices:["opener:'אם אני לא [X], אין [Y].'"],
    forbidden_shapes: ["'טיפול מותאם אישית'", "'פתרון בהתאמה'"],
    total_sentences:  "5-7",
  },

  "Silent Authority Positioning": {
    hook_shape:       "הצהרת מנגנון־שקט: '[הדבר] הוא איש ה[פונקציה] הכי שקט שיש.' או 'יש מנגנון שאף אחד לא רואה. אני היחיד ששומע אותו.' — משפט אחד, ואז דממה מכוונת.",
    body_shape:       "2-3 משפטים שמראים איפה המנגנון פועל בפועל, בלי לחשוף איך זה עובד. עליונות דרך עמימות — לא מסבירים את המנגנון, מראים שהוא נמצא.",
    landing_shape:    "'זה יש לך כבר.' או 'אנשים משתמשים בזה בלי לדעת.' — לא CTA, לא הסבר, השארה תלויה.",
    canonical_devices:["opener:'X הוא איש ה־Y הכי שקט שיש.'", "landing:'זה יש להם כבר.'"],
    forbidden_shapes: ["הסבר של איך המנגנון עובד", "רשימה של יתרונות של המנגנון", "'אני מומחה ב־X'"],
    total_sentences:  "4-6",
  },

  "Category-Rename / Reclaim": {
    hook_shape:       "פתיחה בשלילה: 'אל תעשו X.' או 'אין דבר כזה X.' — משפט אחד, נקודה.",
    body_shape:       "2-3 משפטים שמראים מה כן. שם־חדש לפעולה. שני עולמות: מה שהקטגוריה עושה מול מה שאתה עושה.",
    landing_shape:    "'זה [השם החדש].' — מקבע את השם החדש.",
    canonical_devices:["opener:'אל תעשו X.'", "opener_alt:'אין דבר כזה X.'"],
    forbidden_shapes: ["פתיחה במה שאתה עושה (חייב לפתוח במה שלא עושים)", "התנצלות על העמדה"],
    total_sentences:  "4-6",
  },

  "Diagnostic-Framework Reveal": {
    hook_shape:       "'אני בודק/ת שלושה: [X], [Y], [Z].' — בדיוק שלושה, לא שניים ולא ארבעה, במשפט אחד.",
    body_shape:       "משפט או שניים על כל אחד משלושת הפרמטרים, בסדר יורד בעוצמה. לא הסבר תיאורטי — מה בפועל אני שואל/מודד ברגע ההוא.",
    landing_shape:    "'ואז אני יכול להגיד [כן/לא].' — מיקוד בהחלטה שהמסגרת מאפשרת.",
    canonical_devices:["opener:'אני בודק/ת שלושה: X, Y, Z.'"],
    forbidden_shapes: ["שני פרמטרים בלבד", "ארבעה או יותר", "פרמטרים ג'נריים ('אישיות, מקצועיות, יעילות')"],
    total_sentences:  "5-7",
  },

  "Moral-Obligation Activation": {
    hook_shape:       "משפט שמזהה את מי הלקוח מגן עליו (עצמו/ילד/בן זוג/הלקוחות שלו).",
    body_shape:       "2-3 משפטים שהופכים את חוסר־הפעולה לעבירה מוסרית כלפי אותו אדם. 'זה פשע לא לתת לה את זה.' 'אתה מזניח אותו בדיוק על ידי שאתה לא פועל.'",
    landing_shape:    "משפט קר שממקבע את החובה: 'זו לא בחירה. זו חובה.'",
    canonical_devices:["opener:'תחשוב על [האדם].'", "body:'זה פשע לא לתת לה את זה.'"],
    forbidden_shapes: ["FUD גנרי", "איום מסחרי ('תפסיד את הלקוחות שלך')"],
    total_sentences:  "5-7",
  },

  "Chain-Collapse Rhetoric": {
    hook_shape:       "שרשרת קצרה של שלילות: 'אין X, אין Y. אין Y, אין Z.' — לפחות שלוש חוליות, כל אחת נופלת מהקודמת.",
    body_shape:       "1-2 משפטים שמאזכרים את השרשרת ואת המשמעות שלה עבור המשתמש.",
    landing_shape:    "'זו המשוואה.' או 'זה מה שאף אחד לא רואה.' — סגירה חדה על המסקנה המכנית.",
    canonical_devices:["opener:'אין X, אין Y.'", "landing:'זו המשוואה.'"],
    forbidden_shapes: ["שרשרת של יותר מ־4 חוליות", "שרשרת שהחוליות לא נובעות באמת אחת מהשנייה"],
    total_sentences:  "4-6",
  },

  "Full-Disclosure Reveal": {
    hook_shape:       "בדיוק: 'אני רוצה לעשות איתכם/ן גילוי נאות.' — משפט אחד קבוע, בלי סטיות.",
    body_shape:       "משפט אחד של אמת לא־נוחה שנגזרת ישירות מהאות של המשתמש ('רוב [הקהל] לא צריכים עוד X'). ואז 1-2 משפטים על הסיבה שזה נכון.",
    landing_shape:    "משפט שממקבע את הפוזיציה כחתימת מותג, לא כטענה חד־פעמית.",
    canonical_devices:["opener:'אני רוצה לעשות איתכם גילוי נאות.'"],
    forbidden_shapes: ["פתיחה אחרת מ'גילוי נאות'", "'האמת היא ש...'"],
    total_sentences:  "4-6",
  },

  "Sacred-Path Protection": {
    hook_shape:       "משפט שמזהה איום חיצוני שנראה כמו הצלחה: 'אם נלך אחרי X, נאבד את Y.'",
    body_shape:       "2-3 משפטים שמראים למה Y היה הסיבה שהתחלנו, ולמה התשלום על X יבטל אותו. הגנה על ה'למה'.",
    landing_shape:    "'זה לא כלכלי. זה מהותי.' או משפט שמעביר את הבחירה מרגיסטר עסקי לרגיסטר מוסרי.",
    canonical_devices:["opener:'אם אנחנו נלך אחרי X, נאבד את Y.'"],
    forbidden_shapes: ["ויתור על פרגמטיות", "טענה שהמשתמש דוחה כסף (הוא לא דוחה כסף, הוא מגן על מהות)"],
    total_sentences:  "5-7",
  },

  "Proxy Embodiment": {
    hook_shape:       "'אני רואה את [הלקוח־של־הלקוח].' + פרט קונקרטי על אותו אדם.",
    body_shape:       "2-3 משפטים שמראים מה הצד השלישי חווה, איך הוא מרגיש, מה קורה לו — לא ללקוח הישיר. הראייה עוברת דרך הגוף/הפחד/החוויה של הלא־נראה.",
    landing_shape:    "'זה מה שאני בונה בפועל.' — קישור המנוע לצד־שלישי, לא ללקוח הישיר.",
    canonical_devices:["opener:'אני רואה את [X].'"],
    forbidden_shapes: ["התמקדות בלקוח הישיר במקום בצד שלישי", "'לקוחות מרוצים'"],
    total_sentences:  "5-7",
  },
};

// Archetype → move pool (soft — keyword rules override).
export const ARCHETYPE_POOLS: Record<string, SignatureMoveName[]> = {
  "cognitive_business": ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Chain-Collapse Rhetoric", "Full-Disclosure Reveal", "Category-Rename / Reclaim"],
  "sensory":            ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Anti-flattery", "Sensory-to-Business Translation", "Process-as-Proof", "Receptive Embodiment", "Silent Authority Positioning"],
  "therapy":            ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Specificity-as-Service", "Moral-Obligation Activation", "Sacred-Path Protection", "Proxy Embodiment"],
  "handmade":           ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Process-as-Proof", "Sacred-Path Protection"],
  "third_party_service":["External→Internal Translation", "Service Reframe", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Specificity-as-Service", "Proxy Embodiment"],
};
