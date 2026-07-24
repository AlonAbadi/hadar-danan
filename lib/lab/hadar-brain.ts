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

// Archetype → move pool (soft — keyword rules override).
export const ARCHETYPE_POOLS: Record<string, SignatureMoveName[]> = {
  "cognitive_business": ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Chain-Collapse Rhetoric", "Full-Disclosure Reveal", "Category-Rename / Reclaim"],
  "sensory":            ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Anti-flattery", "Sensory-to-Business Translation", "Process-as-Proof", "Receptive Embodiment", "Silent Authority Positioning"],
  "therapy":            ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Specificity-as-Service", "Moral-Obligation Activation", "Sacred-Path Protection", "Proxy Embodiment"],
  "handmade":           ["External→Internal Translation", "Service Reframe", "אני אקביל לך Parable Building", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Process-as-Proof", "Sacred-Path Protection"],
  "third_party_service":["External→Internal Translation", "Service Reframe", "Tangible Metaphor Anchor", "Sold-Inversion", "Self-as-example", "Embodiment direction (Projective)", "Anti-flattery", "Specificity-as-Service", "Proxy Embodiment"],
};
