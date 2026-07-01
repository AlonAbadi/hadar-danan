/**
 * מנוע הפער (Gap Engine) — prompts, schema, and the validated deterministic
 * crisis floor.
 *
 * INTERNAL ONLY, behind GAP_ENGINE_ENABLED. Never renders to a user in this
 * phase. Grounded in SIGNAL_GAP_FOUNDATION.md + SIGNAL_GAP_SOLUTION.md.
 *
 * Empirical basis (SIGNAL_GAP_VALIDATION_R2.md, 45 real extractions, two
 * independent framework raters — Tanya/Rebbe + Yemima):
 *   - gap agreement AC1 = 0.73 (tentative→substantial)
 *   - crisis floor agreement = 100% (3/3 do_not_name, identical)
 *   - a rules-only gap decision is confidently-wrong on ~1/3 of cases
 *     (the "aspirational as-if-arrived" seam) → the gap decision MUST be the
 *     LLM ensemble; rules serve ONLY the crisis floor + thin-abstain.
 */

export const GAP_ENGINE_VERSION = "gap-v1-2026-07";
export const GAP_MODEL = "claude-sonnet-4-6";

// Feature flag — OFF by default. The whole engine is inert until validated by
// living experts (rav/mashpia + trained Yemima teacher) per the foundation doc.
export const GAP_ENGINE_ENABLED = process.env.GAP_ENGINE_ENABLED === "true";

// ── Types ─────────────────────────────────────────────────────────────────
export type GapPresent  = "yes" | "partial" | "no" | "abstain";
export type GapSeam     = "overshoot" | "metabolized" | "unclear" | "not_applicable";
export type GapSafety   = "ok" | "caution" | "do_not_name";

export interface AnswerTag {
  key:           string;
  concreteness:  0 | 1 | 2 | 3;
  separatedness: 0 | 1 | 2 | 3;
  tense:         "past_closed" | "past_open" | "present_continuous" | "mixed";
  vantage:       "outside_observing" | "inside_the_storm" | "mixed";
  cliche:        boolean;
  spans:         string[]; // verbatim
}

export interface SeamJudgment {
  label:            GapSeam;
  overshoot_score:  number;    // 0..1
  q3_span:          string | null; // verbatim showing "still inside"
  q5_span:          string | null; // verbatim showing the jump
  confidence_local: number;    // 0..1 (this sample's self-report — weak feature)
}

export interface GapEvidenceBinding {
  claim:  string;
  span:   string;      // verbatim substring of some answer
  source: string;      // answer key
}

export interface GapResult {
  present:     GapPresent;
  seam:        GapSeam;
  safety:      GapSafety;
  confidence:  number;                     // calibrated 0..1
  signals:     Record<string, unknown>;    // raw agreement signals (audit)
  reading:     string | null;              // one-sentence mirror (only if emitted)
  crossing:    string | null;              // one self-doable movement (only if emitted)
  evidence:    GapEvidenceBinding[];
  version:     string;
}

// ── Stage 0: deterministic crisis floor (VALIDATED: 3/3 recall, 0 FP) ───────
// Fresh/acute present-tense distress with no lesson → suppress everything,
// human door only. Err massively toward suppression.
export const CRISIS_MARKERS = [
  "עכשיו אין לי", "די הפסקתי את המלחמה", "אני עדיין לא יודעת מה זה",
  "אני עכשיו בתוך", "כבר חודשים שאני לא", "מרגישה אבודה", "אני עדיין באמצע",
  "אני עוד בתוך התהליך", "בלי כיוון", "לא מצליחה להרים את עצמי",
  "מתאמצת כל יום סתם", "אין לי כוח", "לא רוצה להמשיך", "לפגוע בעצמי",
] as const;

const LESSON_MARKERS = [
  "למדתי", "לימד אותי", "לימדה אותי", "הבנתי", "ולבסוף", "עברתי את",
  "בסופו של דבר", "גיליתי ש", "ומשם הבנתי", "זה לימד", "היום אני",
] as const;

const hit = (t: string, lex: readonly string[]) => lex.some((k) => t.includes(k));

/**
 * Returns true when the answers show a FRESH wound that must not be interpreted.
 * Deterministic, cheap, runs before any LLM call. Validated on 45 real
 * extractions (SIGNAL_GAP_VALIDATION_R2.md).
 */
export function crisisFloor(answers: Record<string, string>): boolean {
  const q3 = answers.hard_period ?? "";
  const q4 = answers.what_helped ?? "";
  const q5 = answers.message_to_past ?? "";
  const blob = `${q3} ${q4} ${q5}`;
  const hasLesson = hit(q3, LESSON_MARKERS) || hit(q4, LESSON_MARKERS);
  return hit(blob, CRISIS_MARKERS) && !hasLesson;
}

// ── Stage A: per-answer tagging prompt ──────────────────────────────────────
export const STAGE_A_SYSTEM = `אתה מתייג תשובה חופשית אחת בעברית עבור מנוע פנימי. אינך פונה לאדם ואינך כותב לו כלום. החזר JSON בלבד.

לכל תשובה קבע:
- concreteness (0-3): 0=מופשט/קלישאה ("למדתי להאמין בעצמי"), 1=כללי אך אישי, 2=רגע מטושטש, 3=רגע חי ומסומן (מתי/איפה/מה נאמר).
- separatedness (0-3): 0=המהות מודבקת לספק/קול חיצוני ("אבל..."), 3=נקודה נקייה ומופרדת.
- tense: past_closed (עבר עם סגירה) / past_open (עבר בלי סגירה) / present_continuous (הווה מתמשך, "אני עדיין") / mixed.
- vantage: outside_observing (מתבונן מבחוץ, מרחק) / inside_the_storm (עדיין בפנים) / mixed.
- cliche: true אם התשובה בעיקר קלישאות/מושגים בלי תוכן חי.
- spans: עד 2 ציטוטים מילוליים מדויקים מהתשובה (חובה מילה-במילה).

החזר JSON תקין בלבד: {"concreteness":0-3,"separatedness":0-3,"tense":"...","vantage":"...","cliche":true/false,"spans":["..."]}`;

export function stageAUser(questionLabel: string, answer: string): string {
  return `השאלה: ${questionLabel}\nהתשובה:\n${answer.trim()}\n\nהחזר JSON בלבד.`;
}

// ── Stage B: the seam (Q3 ↔ Q5) — the crux. Run k times × framings. ─────────
// Anchors are drawn from real validated extractions (R2 consensus).
export const STAGE_B_SYSTEM = `אתה מודד את **התפר** בין תשובה 3 (תקופה קשה + מה שלמדה) לתשובה 5 (מה היית אומר/ת למישהו במקום שבו היית). פנימי בלבד, לא מוצג לאיש. החזר JSON בלבד.

הגדרות:
- **overshoot (פער נוכח):** העצה ב-5 מגיעה ממקום שהאדם עדיין בתוכו לפי 3. סימנים: 3 בהווה/בלי סגירה, 5 נחרצת/מטיפה/כללית, או **הכתרה-כאילו-הגיע** (טוען יעד/סמכות שטרם נחצה, למשל "היום אני חייבת ואהיה מספר 1... אתחיל ללמד"). "מייעצת את מה שהיא עצמה עוד לא עשתה."
- **metabolized (אין פער בתפר):** העצה ב-5 היא בדיוק מה ש-3 לימד, נאמרת בקול מי שכבר חצה — קונקרטית, ענווה, לא מטיפה, עבור האחר.
- **unclear:** אין די חומר, או 3 ו-5 לא נוגעים באותו תחום → not_applicable.

עוגנים:
- overshoot: 3="השאיר בי טראומה לא פשוטה" + 5="הוא חייב תוכנית מסודרת ולהיזהר ממה שמוכרים ברשתות" (מייעצת על פרסום מתוך טראומה עדיין-חיה).
- metabolized: 3="החלטתי להיפרד מהשותף... אחרי שנפרדתי משני משרדים" + 5="לך עם האמת שלך, תסתכל במראה, הכל בסדר" (עבר סגור, עצה רגועה מהצד).

החזר: {"label":"overshoot|metabolized|unclear|not_applicable","overshoot_score":0.0-1.0,"q3_span":"ציטוט מ-3 שמראה 'עדיין בפנים' או null","q5_span":"ציטוט מ-5 שמראה את הקפיצה או null","confidence_local":0.0-1.0}`;

export function stageBUser(q3: string, q5: string, framing: "direct" | "adversarial" | "nli"): string {
  const base = `תשובה 3 (קושי):\n${q3.trim()}\n\nתשובה 5 (מסר):\n${q5.trim()}\n\n`;
  if (framing === "adversarial")
    return base + `הנח תחילה ש**אין פער**. הבא את הראיה הכי חזקה ש-5 הופנם באמת מ-3. ואז הכרע ביושר: אם ההגנה מחזיקה → metabolized; אם היא קורסת → overshoot. החזר JSON בלבד.`;
  if (framing === "nli")
    return base + `שאלת היסק: האם 3 (הנחה) גורר ש-האדם *יכול* לתת באמת את העצה ב-5 (מסקנה)? entail→metabolized, contradict→overshoot, neutral→unclear. החזר JSON בלבד.`;
  return base + `הכרע: האם העצה ב-5 באה ממקום שהאדם כבר עבר, או ממקום שהוא עדיין בתוכו? החזר JSON בלבד.`;
}

// ── Stage C: fusion (ערבוב) ─────────────────────────────────────────────────
export const STAGE_C_SYSTEM = `אתה בודק אם המתנה/היכולת של האדם (מתשובות 1-2) נאמרת כנקודה נקייה, או **מודבקת** לספק, פסילה-עצמית, או קול חיצוני/מורש ("אבל זה לא באמת מקצוע", "אמא תמיד אמרה", "כולם יודעים לעשות את זה"). פנימי בלבד. החזר JSON בלבד.
{"fusion_present":true/false,"fusion_type":"self_disqualification|external_voice|comparison|none","gift_span":"ציטוט","attached_voice_span":"ציטוט או null","confidence_local":0.0-1.0}`;

export function stageCUser(q1: string, q2: string): string {
  return `תשובה 1:\n${q1.trim()}\n\nתשובה 2:\n${q2.trim()}\n\nהחזר JSON בלבד.`;
}

// ── Stage F: constrained generation (only when the gate opens) ──────────────
// Builds threshold + crossing ONLY from pre-extracted verbatim spans. Emits a
// machine-checkable binding for the quote-or-discard verifier (Stage G).
export const STAGE_F_SYSTEM = `אתה כותב, בקול הדר דנן, שיקוף עדין של הסף הנוכחי שאדם עומד בו — כמראה שמשחררת, לא כתווית. פנימי לצורך סקירה אנושית; לא מוצג למשתמש עדיין.

חוקי-ברזל:
- המתנה כבר שלו. לעולם לא "חסר" ולא "עדיין לא מוכן".
- רגע-על-הדרך, לא תכונה. עטוף במתנה.
- אסור: "את/ה אדם ש...", "הבעיה שלך", "מה שעוצר אותך", "עדיין לא הגעת", דירוג, מרשם, סופיות, הכתרת סמכות שטרם קיימת.
- בנה את הסף אך ורק מהציטוטים שסופקו לך. אל תמציא.
- crossing = תנועה עצמית אחת קטנה בהווה (הפרדה אחת), לא קפיצה. בספק — השאר null.

קלט: רשימת ציטוטים מילוליים מהתשובות. פלט JSON:
{"reading":"משפט אחד — הסף כמראה","crossing":"תנועה עצמית אחת או null","bindings":[{"claim":"...","span":"ציטוט מדויק שסופק","source":"answer_key"}]}
כל claim חייב span מהרשימה שסופקה. אם אין די עוגן — reading=null.`;

export function stageFUser(spans: { source: string; text: string }[]): string {
  const list = spans.map((s) => `- [${s.source}] "${s.text}"`).join("\n");
  return `ציטוטים זמינים (בנה מהם בלבד):\n${list}\n\nהחזר JSON בלבד.`;
}
