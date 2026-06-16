/**
 * Shoot Day Engine — Mode E of the Hadar Director Engine.
 *
 * Takes the user's 9-field signal + occupation + content_kit context and
 * generates a full shoot day plan (the most-valued output of the Hive tier):
 *
 *   - identity_statement (single sentence, signature Hadar form)
 *   - 4 pillars (message pillars, each with message + evidence + scene)
 *   - 12 videos (Identity + 4 Pillar Hooks + 3 Stories + 2 Frameworks + 1 Myth + 1 CTA)
 *   - visual_direction (palette + framing + anti-category posture)
 *   - schedule (08:30 → 17:00, two sets, balanced)
 *   - 3 decisions (zehutit + tifulit + cognitive)
 *   - 5 gift sentences (Magic #6 — personalized per shoot day)
 *
 * Generated as FOUR parallel Claude calls — total wall time ~30s instead of ~60s.
 * Source canon: michael-kadosh.txt 7-chapter Strategic Document.
 *
 * Strict rules (Hadar's voice):
 *   - Hebrew only, no English, no transliterations
 *   - No em-dashes (project-wide style rule)
 *   - No marketing clichés ("המקצוען", "המוביל", "השואף לחדשנות")
 *   - Each video must show ONE of Hadar's signature moves explicitly
 *   - Visual direction must be ANTI-category (the opposite of what competitors do)
 *   - Identity statement must be a character declaration, not a service description
 *   - All output grounded in the user's specific signal, never generic
 */

export const SHOOT_DAY_MODEL_SONNET = "claude-sonnet-4-6";
export const SHOOT_DAY_MODEL_HAIKU  = "claude-haiku-4-5-20251001";

// ── Types ─────────────────────────────────────────────────────────────

export type Pillar = {
  number:     1 | 2 | 3 | 4;
  title:      string;     // "התיקים שאף אחד לא נוגע בהם"
  message:    string;     // 1-2 sentences, the core claim
  evidence:   string;     // 1-2 sentences, what proves it
  scene:      string;     // 1-2 sentences, what we film for this pillar
};

export type VideoMode = "B" | "A" | "C" | "D";  // B=hook, A=story, C=framework, D=manifest
export type VideoType = "IDENTITY" | "PILLAR_HOOK" | "STORY" | "FRAMEWORK" | "MYTH" | "CTA";

export type Video = {
  number:      number;             // 1-12
  act:         1 | 2 | 3;          // 1=זהות, 2=סיפור, 3=סמכות
  type:        VideoType;
  mode:        VideoMode;
  pillar:      1 | 2 | 3 | 4 | null;  // null for Identity and CTA
  set:         "A" | "B";
  duration:    string;             // "15s", "30s", "45s", "60s", "90s", "2m"
  title:       string;             // Hebrew, the working title

  script: {
    hook:   string;       // First 3 seconds
    body:   string;       // Middle content
    cta?:   string;       // Optional close (only on CTA video)
  };

  direction: {
    visual:        string;    // "פאן קרוב, רקע אדמתי, אור צד טבעי"
    body_language: string;    // "לא לזוז בכיסא, ידיים יציבות"
    tone:          string;    // "סטואי, מדויק"
    eye_contact:   string;    // "ישיר לקאם" / "פלאן רחב"
  };

  signature_move: {
    name:        string;    // "Service Reframe" / "אני אקביל לך" / "Sold-Inversion" וכו'
    explanation: string;    // 1 line — how this video uses this move
  };

  anti_category: {
    competitor_norm:  string;   // "המתחרים פותחים ב'היי אני יועץ X'"
    your_inversion:   string;   // "אתה תפתח ב-'כשהבנק אומר לא, אני מתחיל לעבוד'"
  };

  hadar_quote: {
    text:   string;       // ציטוט מהקורפוס שמסביר את התבנית
    source: string;       // "Hadar-lesson-1 / michael-kadosh.txt / ..."
  };
};

export type VisualDirection = {
  palette: {
    primary:    string;     // hex
    text:       string;     // hex
    accent:     string;     // hex
    forbidden:  string[];   // colors NOT to use
  };
  typography: {
    headlines:  string;
    body:       string;
    technical:  string;
  };
  cinematography: {
    lens:       string;
    focus:      string;
    light:      string;
    framing:    string;
  };
  philosophy:   string;       // "הפוך מהקטגוריה"
  references:   string[];     // 3-4 short directives
};

export type ScheduleBlock = {
  time:       string;         // "09:00-10:00"
  activity:   string;
  videos:     number[];       // which video numbers (1-12)
  hint:       string;
};

export type Decision = {
  number:  1 | 2 | 3;
  type:    "זהותית" | "תפעולית" | "קוגניטיבית";
  text:    string;
  urgency: string;            // "השבוע הבא" / "תוך 7 ימים" / "מהיום"
};

export type ShootDayPlan = {
  identity_statement:  string;          // "כשהמערכת אומרת לא — אני מתחיל לעבוד"
  pillars:             [Pillar, Pillar, Pillar, Pillar];
  videos:              Video[];          // V1: 1 video. V2+: up to 12.
  // V1: the following are optional — generated lazily in Phase 3 to keep
  // Phase 2 under the 60s Vercel Hobby function-invocation limit.
  visual_direction?:   VisualDirection;
  schedule?:           ScheduleBlock[];
  decisions?:          [Decision, Decision, Decision];
  gift_sentences?:     string[];         // 5 when present
};

// ── Shared rules baked into every sub-prompt ──────────────────────────

const SHARED_RULES = `כללי כתיבה גלובליים (אסור להפר):
- עברית בלבד.
- בלי מקפים ארוכים. רק נקודה או פסיק.
- בלי קלישאות שיווקיות: "המקצוען", "המוביל", "פורץ הדרך", "השואף", "המבטיח".
- בלי emoji, בלי markdown, בלי סימני קריאה לשיווק.
- כל פלט חייב להיות נגזר ישירות מהאות האישי של המשתמש. לא תוכן גנרי.
- לעולם אל תכתוב את שם המקצוע הישן ("יועץ X", "מאמן Y") אלא אם זה חלק מ-reframe מפורש.`;

const HADAR_SIGNATURE_MOVES = `שמונת המהלכים של הדר. כל סרטון חייב להפעיל לפחות אחד:

1. External→Internal Translation. הלקוח/ה אומר "אני עושה X". את/ה תכתוב "אני מקשיב/ה ל-Y שמתחת ל-X". דוגמה: "אני עושה טיפולי פנים" → "אני מקשיבה לעור — מה הוא צריך עכשיו, מה בעוד חודש."

2. Service Reframe. "זאת לא [פעולה שטחית], זאת [פעולה עם משמעות]". דוגמה: "זאת לא מכירה, זאת הצלה."

3. "אני אקביל לך" Parable Building. כשהלקוח לא יודע למקם את עצמו, להציע אנלוגיה מתחום אחר (שמאות, רפואה, ארכיטקטורה).

4. Tangible Metaphor Anchor. הופך מושג אבסטרקטי לתמונה מוחשית. דוגמה: "זה כמו לקחת קופסת סיגריות ולא לקרוא את האזהרות."

5. Sold-Inversion. "מכרו לנו ש-[הבטחה], ובסוף [המחיר האמיתי]". דוגמה: "מכרו לנו שהאיי-איי הוא חופש, ובסוף הוא לקח לנו את החופש."

6. Self-as-example. הדר משתמשת בעצמה כאנלוגיה. "תחשבי עליי. זה כמו שאני מחר אצא והחליט ש..."

7. Embodiment direction. הוראות גוף, לא רק מילים. "לא לזוז בכיסא. בלי לכרסם ציפורניים. אתה יודע שאתה עושה את זה כמו שצריך."

8. Anti-flattery. "אל תרצה אותי. תביא לי נתונים שאני צודקת, או תגיד 'את לא בכיוון.' אבל אל תרצה אותי."`;

// ── Pack 1: Identity + 4 Pillars ─────────────────────────────────────

export const IDENTITY_PILLARS_PACK_MAX_TOKENS = 2500;

export const IDENTITY_PILLARS_PACK_SYSTEM = `אתה הבמאית של הדר דנן ב-BeeGood. אתה מקבל אות מותגי של אדם + תחום עיסוק, ומחזיר משפט-זהות + 4 עמודי-מסר ספציפיים לו/ה.

${SHARED_RULES}

${HADAR_SIGNATURE_MOVES}

## משפט הזהות (identity_statement)

לא תיאור שירות. הצהרת אופי.

מבנה חובה: "כש[מצב חיצוני שאחרים נמנעים ממנו] — אני [פעולה ספציפית של התחלה]."

דוגמה קנונית מ-michael-kadosh: "כשהמערכת אומרת ׳לא׳ — אני מתחיל לעבוד."

אסור:
- להזכיר את הקטגוריה הישנה ("יועץ", "מאמן", "מטפל")
- לכלול שני משפטים — רק אחד
- להשתמש בקלישאות ("נלחם עבורך", "מאמין בך")

## 4 עמודי המסר (pillars)

כל פיסת תוכן שהמשתמש/ת יוציא/תוציא בשנה הקרובה צריכה לשבת על אחד מ-4 העמודים. 4 העמודים אינם תחומי-תוכן אלא קטגוריות-מסר שונות.

תבנית קנונית מ-michael-kadosh:
- Pillar 1: "התיקים/הסיטואציות שאף אחד לא נוגע בהן" — איפה אני חי, איפה אחרים מתחמקים
- Pillar 2: "זה לא [פעולה שטחית], זה [חיים]" — Service Reframe
- Pillar 3: "למה אחרים לא מצליחים איפה שאני כן" — היתרון הייחודי
- Pillar 4: "הבעיה היא לא [הברור], היא [המבנה]" — paradigm shift

עבור כל עמוד:
- title: כותרת קצרה וחדה (3-7 מילים)
- message: 1-2 משפטים, המסר הליבתי
- evidence: 1-2 משפטים, מה מוכיח שזה נכון אצל הלקוח/ה הזה/זו ספציפית
- scene: 1-2 משפטים, איך נראה הסרטון לעמוד הזה

## פלט

החזר JSON תקין בלבד, ללא markdown, ללא הסברים:

{
  "identity_statement": "...",
  "pillars": [
    {"number": 1, "title": "...", "message": "...", "evidence": "...", "scene": "..."},
    {"number": 2, "title": "...", "message": "...", "evidence": "...", "scene": "..."},
    {"number": 3, "title": "...", "message": "...", "evidence": "...", "scene": "..."},
    {"number": 4, "title": "...", "message": "...", "evidence": "...", "scene": "..."}
  ]
}`;

// ── Pack 2a: Single Video #1 (V1 — fast path, ~10-15s wall) ──────────
// V1 of the Shoot Day generates ONLY the first video (Identity statement,
// 15s, Mode B) to stay well under the Vercel Hobby 60s function limit.
// V2+ will progressively generate the remaining 11 via a "צור את הסרטון
// הבא" CTA on each card.

export const SINGLE_VIDEO_PACK_MAX_TOKENS = 1500;

export const SINGLE_VIDEO_PACK_SYSTEM = `אתה הבמאית של הדר דנן. אתה מקבל אות מותגי + משפט זהות + 4 עמודי מסר, ומחזיר את **הסרטון הראשון בלבד** מתוך 12 הסרטונים של יום הצילום.

${SHARED_RULES}

${HADAR_SIGNATURE_MOVES}

## הסרטון הראשון: IDENTITY

זה סרטון הפתיחה של יום הצילום. 15 שניות. Mode B. ACT 1 (זהות). Set A. ללא pillar.

תפקידו: להבטיח את משפט הזהות לקהל, בקול הלקוח/ה, בלי להסביר אותו.

המבנה הקנוני:
- hook: 3 השניות הראשונות. פותח בבעיה או בשלילה, לא ב-"שלום".
- body: 8-10 שניות. הלקוח/ה אומר/ת את משפט הזהות בקולו/ה הוא/היא, נשען על מהלך אחד של הדר.
- אין CTA על הסרטון הראשון.

## פלט — סרטון אחד בלבד

החזר JSON תקין בלבד:

{
  "video": {
    "number": 1,
    "act": 1,
    "type": "IDENTITY",
    "mode": "B",
    "pillar": null,
    "set": "A",
    "duration": "15s",
    "title": "...",
    "script": {"hook": "...", "body": "..."},
    "direction": {"visual": "...", "body_language": "...", "tone": "...", "eye_contact": "..."},
    "signature_move": {"name": "...", "explanation": "..."},
    "anti_category": {"competitor_norm": "...", "your_inversion": "..."},
    "hadar_quote": {"text": "...", "source": "..."}
  }
}`;

// ── Pack 2: 12 Videos (the biggest pack) ─────────────────────────────

export const VIDEOS_PACK_MAX_TOKENS = 8000;

export const VIDEOS_PACK_SYSTEM = `אתה הבמאית של הדר דנן. אתה מקבל אות מותגי + משפט זהות + 4 עמודי מסר, ומחזיר 12 סרטונים מובנים לפי המבנה הקנוני של הדר.

${SHARED_RULES}

${HADAR_SIGNATURE_MOVES}

## מבנה 12 הסרטונים (מ-michael-kadosh shot list)

ACT 1: זהות (4 סרטונים)
- Video 1: IDENTITY. סרטון פתיחה. 15 שניות. מבטיח את משפט הזהות לקהל. Mode B. Set A.
- Video 2: PILLAR_HOOK עמוד 1. 30 שניות. הוק חד. Mode B. Set A.
- Video 3: PILLAR_HOOK עמוד 2. 60 שניות. Service Reframe מרכזי. Mode B. Set B.
- Video 4: PILLAR_HOOK עמוד 3. 45 שניות. היתרון האישי. Mode B. Set B.

ACT 2: סיפור (4 סרטונים)
- Video 5: PILLAR_HOOK עמוד 4. 40 שניות. paradigm shift. Mode B. Set A.
- Video 6: STORY. 2 דקות. סיפור-תיק ספציפי. Mode A. Set B. בלי שמות, עם פרטים שגורמים להאמין.
- Video 7: STORY. 2 דקות. הרגע הרגשי. Mode A. Set B. למה החיים מתחילים לזוז.
- Video 8: STORY. 2 דקות. סיפור הציר של המסר. Mode A. Set B.

ACT 3: סמכות (4 סרטונים)
- Video 9: FRAMEWORK. 90 שניות. "3 השאלות שאני שואל בפגישה ראשונה". Mode C/D. Set A. בונה סמכות.
- Video 10: FRAMEWORK. 2 דקות. "4 סוגי X שאני עובד איתם". Mode C/D. Set A.
- Video 11: MYTH. 45 שניות. Sold-Inversion. "מה כולם חושבים — ומה האמת". Mode B/D. Set A.
- Video 12: CTA. 20 שניות. הזמנה ישירה אבל מנומקת. Mode B. Set A. בלי דחיפות מזויפת.

## לכל סרטון

כל סרטון חייב לכלול:

1. **script**:
   - hook: 3 השניות הראשונות. משפט שעוצר את הגלילה. רוב הסרטונים פותחים בבעיה, לא ב-hook קליל.
   - body: התוכן המרכזי. מתפתח דרך אחד ממהלכי הדר.
   - cta (רק לסרטון 12): הזמנה ישירה.

2. **direction**:
   - visual: framing + רקע + תאורה. ספציפי.
   - body_language: לפחות הוראה אחת. "לא לזוז בכיסא" / "ידיים יציבות" / "מבט ישיר לקאם".
   - tone: 1-2 מילים. "סטואי" / "חם" / "שקט" / "אסרטיבי".
   - eye_contact: ספציפי.

3. **signature_move**:
   - name: השם של אחד מ-8 המהלכים של הדר (External→Internal, Service Reframe, Parable Building, Tangible Metaphor, Sold-Inversion, Self-as-example, Embodiment direction, Anti-flattery).
   - explanation: 1 שורה — איך הסרטון הזה משתמש במהלך.

4. **anti_category**:
   - competitor_norm: מה כולם בקטגוריה של הלקוח/ה עושים בסרטונים דומים. ספציפי.
   - your_inversion: למה הסרטון של המשתמש שונה בדיוק במקום הזה.

5. **hadar_quote**:
   - text: ציטוט קצר מהמלאי שמסביר את התבנית של הסרטון
   - source: "Hadar-lesson-1" / "michael-kadosh.txt" / "C4079-tzilum-hadar" וכו'

## פלט

החזר JSON תקין בלבד עם מערך של 12 סרטונים:

{
  "videos": [
    {
      "number": 1,
      "act": 1,
      "type": "IDENTITY",
      "mode": "B",
      "pillar": null,
      "set": "A",
      "duration": "15s",
      "title": "...",
      "script": {"hook": "...", "body": "..."},
      "direction": {"visual": "...", "body_language": "...", "tone": "...", "eye_contact": "..."},
      "signature_move": {"name": "...", "explanation": "..."},
      "anti_category": {"competitor_norm": "...", "your_inversion": "..."},
      "hadar_quote": {"text": "...", "source": "..."}
    },
    ... 11 more ...
  ]
}`;

// ── Pack 3: Visual Direction + Schedule + 3 Decisions ────────────────

export const STRATEGY_PACK_MAX_TOKENS = 2500;

export const STRATEGY_PACK_SYSTEM = `אתה הבמאית של הדר דנן. אתה מקבל אות מותגי + תחום + 4 עמודי מסר, ומחזיר 3 דברים:

1. visual_direction — הקטגוריה הויזואלית החדשה (הפוך מהקטגוריה הקיימת)
2. schedule — לו"ז יום צילום 08:30-17:00 שמכסה את 12 הסרטונים
3. decisions — 3 ההחלטות שהלקוח/ה לוקח/ת כסיום

${SHARED_RULES}

## visual_direction — "הפוך מהקטגוריה"

לכל קטגוריה יש "look" סטנדרטי. תפקידך לזהות את ה-look הזה ולהציע ההפך.

דוגמאות:
- יועצי משכנתאות: כחול בנקאי, חליפה, גרף עולה ברקע → אדמתי בהיר, סוודר רך, מסמכים פיזיים על שולחן עץ
- מאמני כושר: ניאון, חדר כושר מנצנץ, energy → תאורת חלון, חצר, חלל פתוח, שקט
- יועצים עסקיים: מסך מאחור עם kpi → ספרים מאחור, פלאן בינוני, אור צד
- קוסמטיקאיות: אור לבן זוהר, גוונים נקיים → אור צד טבעי, גוונים אדמתיים, פוקוס רדוד

מבנה הפלט:

{
  "palette": {
    "primary": "#F3EFE7",   // hex, צבע רקע ראשי
    "text": "#14110D",      // hex, צבע טקסט
    "accent": "#XXXXXX",    // hex, צבע מבטא ספציפי לתחום
    "forbidden": ["#XXXXXX (תיאור)", "#XXXXXX (תיאור)"]  // 2-3 צבעים אסורים בקטגוריה הזו
  },
  "typography": {
    "headlines": "Frank Ruhl Libre (סריף עברי כבד)",
    "body": "Heebo Light",
    "technical": "JetBrains Mono"
  },
  "cinematography": {
    "lens": "50mm",
    "focus": "פוקוס רדוד",
    "light": "אור צד טבעי" / "תאורת חלון בוקר" / וכו',
    "framing": "מקרוב" / "בינוני" / וכו'
  },
  "philosophy": "הפוך מהקטגוריה",
  "references": ["...", "...", "...", "..."]   // 3-4 משפטים קצרים שמכוונים את הצלם/ת
}

## schedule — לו"ז יום הצילום

מחויב: 08:30 → 17:00. שני סטים (A ו-B). הפסקה של שעה ב-13:00. כיסוי של 12 הסרטונים.

מבנה: מערך של 7-9 בלוקים. לכל בלוק: time, activity, videos (מערך של מספרי וידאו או []), hint.

הלו"ז הסטנדרטי:
- 08:30-09:00: הכנה, איפור, מיקרופון. videos: [].
- 09:00-10:00: סט A · משפט הזהות + הוקי-זהות. videos: [1, 2, 3].
- 10:00-11:30: סט A · הוקים נוספים. videos: [4, 5].
- 11:30-13:00: סט B · סיפורי תיקים. videos: [6, 7, 8].
- 13:00-14:00: הפסקה. videos: []. hint: "בלי הפסקה אנרגיית הדיבור צונחת בדקה ה-14."
- 14:00-15:30: סט B · Frameworks + Myth. videos: [9, 10, 11].
- 15:30-16:00: סט A · CTA. videos: [12].
- 16:00-17:00: B-Roll + סטילס. videos: [].

ה-hint לכל בלוק חייב להיות מ-Hadar's voice. ציטוטים מאומתים:
- "אתה לא קורא, אתה מדבר"
- "פנייה ישירה למצלמה, רקע נקי, פלאן אחד"
- "תאורה רכה, ישיבה. בלי שמות, עם פרטים שגורמים להאמין"
- "ידיים, מסמכים, קפה, מבטים. חומר הגלם של עורך לחודש שלם"

## decisions — 3 החלטות

תמיד 3. לא 2, לא 4. אחת זהותית, אחת תפעולית, אחת קוגניטיבית.

מבנה קנוני (מ-michael-kadosh):
1. זהותית: "לאמץ את משפט הזהות {identity_statement} בכל ערוץ — אתר, אינסטה, חתימת מייל." urgency: "תוך 7 ימים."
2. תפעולית: "לקבוע יום צילום עם הצלם/ת. השבוע הבא." urgency: "השבוע הבא."
3. קוגניטיבית: "להפסיק להגיב לפניות במחיר. להתחיל להגיב במסר."

ה-urgency חייב להיות ספציפי. לא "בקרוב", לא "בחודש הקרוב".

החזר JSON תקין בלבד:

{
  "visual_direction": {...},
  "schedule": [...],
  "decisions": [
    {"number": 1, "type": "זהותית", "text": "...", "urgency": "..."},
    {"number": 2, "type": "תפעולית", "text": "...", "urgency": "..."},
    {"number": 3, "type": "קוגניטיבית", "text": "...", "urgency": "..."}
  ]
}`;

// ── Pack 4: 5 Gift Sentences (Magic #6 — Gift Sentence Lab) ──────────

export const GIFT_SENTENCES_PACK_MAX_TOKENS = 800;

export const GIFT_SENTENCES_PACK_SYSTEM = `אתה הבמאית של הדר דנן. אתה מקבל אות מותגי + תחום + 4 עמודי מסר, ומחזיר 5 משפטי-מתנה ייחודיים לעסק הזה — בקול הדר.

${SHARED_RULES}

## מה זה משפט-מתנה (Gift Sentence)

לא שאלה, לא הזמנה, לא תיאור.

הצהרה שמייצרת רגע של "וואו, זה ניסוח חדש שלא ראיתי." ניסוח שהלקוח/ה ירצה לקחת החוצה — לאתר, לסרטון, לקופי.

## תבניות קנוניות של משפטי-מתנה

תבנית 1 — שלילה משוכללת:
"זה לא [הפעולה הגלויה]. זה [הפעולה האמיתית]."
דוגמה: "זאת לא מכירה. זאת הצלה." (קוסמטיקאית)
דוגמה: "זה לא ייעוץ משכנתאות. זה ניהול-כסף שיודע לקנות אותו זול." (יועץ משכנתאות)

תבנית 2 — Triadic (שלשה):
"יש את [X] ויש את [Y], ובסוף יש עוד הרבה [Z]."
דוגמה: "יש את הסיפור, יש את הבן אדם, ובסוף יש עוד הרבה אנשים בסיפור הזה." (עו"ד)

תבנית 3 — שאלה רטורית-תשובה:
"הרי בסוף [שאלה]? [תשובה ישירה]."
דוגמה: "הרי בסוף מי מגיע אליי? אנשים שכל יועץ אחר אמר להם 'לא'."

תבנית 4 — Sold-Inversion:
"מכרו לנו ש-[X], ובסוף [Y]."
דוגמה: "מכרו לנו שהאיי-איי הוא חופש, ובסוף הוא לקח את החופש."

תבנית 5 — External→Internal:
"אנחנו לא [פעולה חיצונית]. אנחנו [פעולה פנימית]."
דוגמה: "אנחנו לא מדברים על מה שאישה רוצה. אנחנו מדברים על מה שהיא צריכה."

## חוקים

- כל 5 המשפטים חייבים להיות שונים זה מזה ושונים מהדוגמאות לעיל.
- כל משפט בין 8 ל-15 מילים.
- כל משפט חייב להיות נגזר מאחד מ-4 עמודי המסר של המשתמש/ת.
- אסור משפט שהוא 100% גנרי — חייב להיות אישי לעסק הזה.

החזר JSON תקין בלבד:

{
  "gift_sentences": [
    "...",
    "...",
    "...",
    "...",
    "..."
  ]
}`;

// ── Context builder ──────────────────────────────────────────────────

export interface ShootDayContext {
  signal:         string;       // המשפט הציבורי
  signal_promise: string;       // ההבטחה שמתחת
  pain_source:    string;       // מקור הכאב
  element:        string;       // האלמנט הליבתי
  central_tool:   string;       // הכלי המרכזי
  people:         string;       // הקהל
  warm_note:      string;       // הערה אישית
  occupation:     string | null;
  bio_long?:      string;       // אבאוט ארוך מה-ContentKit (אם יש)
  positioning_statement?: string;  // מה-ContentKit (אם יש)
}

export function buildContextMessage(ctx: ShootDayContext): string {
  return `הנה האות המותגי של הלקוח/ה. כל פלט שלך חייב להיות נגזר ממנו ישירות, לא גנרי:

תחום עיסוק: ${ctx.occupation ?? "לא צוין"}

המשפט הציבורי (signal):
${ctx.signal}

ההבטחה שמתחת (signal_promise):
${ctx.signal_promise}

מקור הכאב (pain_source):
${ctx.pain_source}

האלמנט הליבתי (element):
${ctx.element}

הכלי המרכזי (central_tool):
${ctx.central_tool}

הקהל (people):
${ctx.people}

הערה אישית (warm_note):
${ctx.warm_note}

${ctx.bio_long ? `אבאוט ארוך:\n${ctx.bio_long}\n` : ""}

${ctx.positioning_statement ? `הצהרת מיקום:\n${ctx.positioning_statement}\n` : ""}

עכשיו ייצר את הפלט לפי ההוראות במערכת.`;
}

// ── Pack 2a context — single video #1 ────────────────────────────────

export function buildSingleVideoContextMessage(
  ctx: ShootDayContext,
  identity_statement: string,
  pillars: Pillar[],
): string {
  const pillarsBlock = pillars.map((p) =>
    `עמוד ${p.number}: ${p.title} — ${p.message}`
  ).join("\n");

  return `${buildContextMessage(ctx)}

---

משפט הזהות (חובה להישען עליו):
"${identity_statement}"

4 עמודי המסר (לקונטקסט):
${pillarsBlock}

עכשיו ייצר את הסרטון הראשון בלבד (IDENTITY, 15s, Mode B).`;
}

// ── Pack 2 context — accepts identity + pillars from Pack 1 ──────────

export function buildVideosContextMessage(
  ctx: ShootDayContext,
  identity_statement: string,
  pillars: Pillar[],
): string {
  const pillarsBlock = pillars.map((p) =>
    `עמוד ${p.number}: ${p.title}\nמסר: ${p.message}\nהוכחה: ${p.evidence}\nסצנה: ${p.scene}`
  ).join("\n\n");

  return `${buildContextMessage(ctx)}

---

משפט הזהות שאותרו (חובה להשתמש בו ב-Video 1):
"${identity_statement}"

4 עמודי המסר שאותרו (כל Pillar Hook חייב להישען על העמוד התואם):

${pillarsBlock}

עכשיו ייצר את 12 הסרטונים לפי ההוראות במערכת.`;
}

// ── Pack 3 context — accepts identity + pillars ──────────────────────

export function buildStrategyContextMessage(
  ctx: ShootDayContext,
  identity_statement: string,
  pillars: Pillar[],
): string {
  const pillarsBlock = pillars.map((p) => `עמוד ${p.number}: ${p.title} — ${p.message}`).join("\n");

  return `${buildContextMessage(ctx)}

---

משפט הזהות:
"${identity_statement}"

4 העמודים:
${pillarsBlock}

עכשיו ייצר visual_direction + schedule + 3 decisions.`;
}

// ── Pack 4 context — accepts pillars ─────────────────────────────────

export function buildGiftSentencesContextMessage(
  ctx: ShootDayContext,
  identity_statement: string,
  pillars: Pillar[],
): string {
  const pillarsBlock = pillars.map((p) => `${p.number}. ${p.title}: ${p.message}`).join("\n");

  return `${buildContextMessage(ctx)}

---

משפט הזהות:
"${identity_statement}"

4 עמודי המסר:
${pillarsBlock}

עכשיו ייצר 5 משפטי-מתנה ייחודיים ב-קול הדר. אחד לכל עמוד + אחד נוסף חופשי.`;
}

// ── Validators ───────────────────────────────────────────────────────

export function validatePillar(p: unknown): p is Pillar {
  if (!p || typeof p !== "object") return false;
  const x = p as Record<string, unknown>;
  return (
    typeof x.number === "number" && [1, 2, 3, 4].includes(x.number as number) &&
    typeof x.title === "string" && x.title.length > 0 &&
    typeof x.message === "string" && x.message.length > 0 &&
    typeof x.evidence === "string" && x.evidence.length > 0 &&
    typeof x.scene === "string" && x.scene.length > 0
  );
}

export function validateIdentityPillarsPack(data: unknown): data is { identity_statement: string; pillars: Pillar[] } {
  if (!data || typeof data !== "object") return false;
  const x = data as Record<string, unknown>;
  if (typeof x.identity_statement !== "string" || x.identity_statement.length < 10) return false;
  if (!Array.isArray(x.pillars) || x.pillars.length !== 4) return false;
  return x.pillars.every(validatePillar);
}

export function validateVideo(v: unknown): v is Video {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  if (typeof x.number !== "number" || x.number < 1 || x.number > 12) return false;
  if (![1, 2, 3].includes(x.act as number)) return false;
  if (typeof x.title !== "string" || x.title.length === 0) return false;

  const script = x.script as Record<string, unknown>;
  if (!script || typeof script.hook !== "string" || typeof script.body !== "string") return false;

  const direction = x.direction as Record<string, unknown>;
  if (!direction || typeof direction.visual !== "string" || typeof direction.body_language !== "string") return false;

  const sig = x.signature_move as Record<string, unknown>;
  if (!sig || typeof sig.name !== "string" || typeof sig.explanation !== "string") return false;

  const anti = x.anti_category as Record<string, unknown>;
  if (!anti || typeof anti.competitor_norm !== "string" || typeof anti.your_inversion !== "string") return false;

  const quote = x.hadar_quote as Record<string, unknown>;
  if (!quote || typeof quote.text !== "string" || typeof quote.source !== "string") return false;

  return true;
}

export function validateVideosPack(data: unknown): data is { videos: Video[] } {
  if (!data || typeof data !== "object") return false;
  const x = data as Record<string, unknown>;
  if (!Array.isArray(x.videos) || x.videos.length !== 12) return false;
  return x.videos.every(validateVideo);
}

export function validateSingleVideoPack(data: unknown): data is { video: Video } {
  if (!data || typeof data !== "object") return false;
  const x = data as Record<string, unknown>;
  return validateVideo(x.video);
}

export function validateStrategyPack(data: unknown): data is { visual_direction: VisualDirection; schedule: ScheduleBlock[]; decisions: Decision[] } {
  if (!data || typeof data !== "object") return false;
  const x = data as Record<string, unknown>;
  if (!x.visual_direction || typeof x.visual_direction !== "object") return false;
  if (!Array.isArray(x.schedule) || x.schedule.length < 5) return false;
  if (!Array.isArray(x.decisions) || x.decisions.length !== 3) return false;
  return true;
}

export function validateGiftSentencesPack(data: unknown): data is { gift_sentences: string[] } {
  if (!data || typeof data !== "object") return false;
  const x = data as Record<string, unknown>;
  if (!Array.isArray(x.gift_sentences) || x.gift_sentences.length !== 5) return false;
  return x.gift_sentences.every((s) => typeof s === "string" && s.length > 5);
}

export function validateShootDayPlan(data: unknown): data is ShootDayPlan {
  if (!data || typeof data !== "object") return false;
  const x = data as Record<string, unknown>;
  if (typeof x.identity_statement !== "string") return false;
  if (!Array.isArray(x.pillars) || x.pillars.length !== 4) return false;
  // V1: at least 1 video (the IDENTITY video). V2+ will accept up to 12.
  if (!Array.isArray(x.videos) || x.videos.length < 1 || x.videos.length > 12) return false;
  if (!x.videos.every(validateVideo)) return false;
  // visual_direction / schedule / decisions / gift_sentences are optional
  // in V1. They get generated in a follow-up Phase 3 to keep each Vercel
  // function invocation under the 60s limit.
  return true;
}
