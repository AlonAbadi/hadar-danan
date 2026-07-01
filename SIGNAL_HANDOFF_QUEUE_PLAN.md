# תור האות — מנוע ניתוב וסגירת-לולאה להדר

סטטוס: **טיוטה לאישור.** שום קוד לא נכתב עד שמסכימים על כל סעיף.
תאריך: 2026-07-01
ממשיך את: `SIGNAL_BUILD_PLAN.md` (מנוע האות, רמות A/B)

---

## המטרה במשפט

שהדר תפסיק לנהל לידים רותחים מתוך תיבת המייל. כל ליד שהמנוע כבר סימן כשווה-שיחה נכנס ל**תור עבודה אחד** — ממויין לפי חום, עם הודעה מוכנה ללחיצה — ו**אף ליד רותח לא מתקרר כי אף אחד לא נגע בו**, כי המערכת אוכפת SLA ומסלימה לבד.

---

## מה כבר קיים (הבסיס — לא בונים מחדש)

מנוע האות כבר עושה את החלק הקשה. לפני שמוסיפים, חשוב לדעת מה יש:

| רכיב | קובץ | מה הוא עושה |
|---|---|---|
| ניתוב bucket | `lib/signal/score.ts` · `determineBucket` | strategy / challenge / hive / nurture / none — LLM + חוקים |
| ציון קלות-המרה | `lib/signal/conversion-score.ts` · `conversionScore` | hot/warm/cold, 0–12, עם "סיבות" |
| חום ליד על ה-user | `app/api/signal/extract/route.ts` (054) | `signal_temperature` = boiling/warm/nurture + `signal_temperature_at` |
| התראת ליד-רותח בזמן אמת | `extract/route.ts` (~ש' 620–668) | מייל ל-Alon+Hadar על כל boiling או convScore≥8 |
| שרשרת נרצ'ר מודעת-bucket | `templates.ts` (054) | welcome + day1/3/5/8/12, המייל מסתעף על `ctx.bucket` |
| השתקה אחרי רכישה | `send-email.ts` | day5/8/12 לא נשלחים למי שכבר קנה |
| מסך אבחונים | `app/admin/signal/page.tsx` | רשימת extractions + המלצה per-lead + קישור WhatsApp |

**המסקנה:** המנוע מצוין ב**זיהוי** וב**נרצ'ר אוטומטי**. הדליפה היחידה שנשארה היא **המסירה האנושית**.

---

## הדליפה — למה זה קריטי

היום ליד רותח מגיע כ**מייל** ל-Alon+Hadar. משם:

1. **אין מעקב אם מישהו באמת יצר קשר.** ההתראה היא fire-and-forget. אם הדר עסוקה ולא ראתה — הליד הרותח מתקרר בשקט.
2. **אין תור עבודה.** `conversionScore` מחושב ואז נזרק — הוא לא נשמר ולא ממיין שום מסך. הדר מנווטת בין מיילים, לא ברשימת-פעולה אחת ממוינת.
3. **הודעת ה-WhatsApp נכתבת ידנית כל פעם.** הקישור קיים אבל הדר מחברת את ההודעה בעצמה — חיכוך שחוזר על כל ליד.
4. **אין רשת ביטחון.** `daily_call_list` יש בו סגירת-לולאה (outcome), אבל הוא המנגנון הכללי היומי — לידי-האות הרותחים לא מוזנים אליו, ואין SLA שאומר "boiling שלא נגעו בו 4 שעות → הסלמה".

זה בדיוק המקום שבו הצוות עובד קשה על מה שהמערכת כבר יודעת — וגם המקום שבו הכי הרבה כסף דולף (ליד ב-fit גבוה שהתקרר).

---

## הפיצ'ר — תור האות (Signal Action Queue)

שכבה דקה מעל מה שקיים. לא נוגעת בליבת המנוע, רק סוגרת את המייל האחרון.

### רכיב 1 · לשמור את החום, לא לזרוק אותו
- **מה:** בעת extraction, לשמור על ה-extraction את `conversion_tier` (hot/warm/cold), `conversion_score`, ו-`conversion_reasons[]` — כרגע `conversionScore` מחושב בשורה 502 ומשמש רק לסף ההתראה, ואז נעלם.
- **קבצים:** `app/api/signal/extract/route.ts` (הוספת השדות ל-insert של `signal_extractions`), migration חדש (למטה).
- **למה:** בלי זה אין מה למיין. זו התשתית לכל השאר.

### רכיב 2 · התור עצמו — מסך פעולה אחד
- **מה:** טאב/מסך חדש `/admin/signal/queue` (או בלוק עליון ב-`/admin/signal`) שמציג רק לידים שדורשים מגע אנושי: `bucket=strategy` **או** `conversion_tier=hot`, שעדיין לא נסגר להם outcome. ממוין: הכי חם קודם, ובתוך אותו חום — הטרי ביותר קודם.
- **כל כרטיס מציג:** שם + עיסוק · צ'יפ חום עם ה"סיבות" (מ-`conversion_reasons`) · משפט-האות (`signal`) · זמן מאז האבחון · שעון SLA (למטה).
- **קבצים:** חדש `app/admin/signal/queue/` (page + client), נשען על `app/admin/signal/page.tsx` הקיים לסטייל.

### רכיב 3 · הודעת WhatsApp מוכנה-ללחיצה
- **מה:** כפתור "לדבר עם [שם]" שפותח `wa.me` עם הודעה **ממולאת מהאות** — בנוסח הדר, סקרנות לא מכירה: שם + רפרנס לאלמנט/משפט שלהם. הדר בודקת, אולי עורכת מילה, שולחת.
- **קבצים:** helper חדש `lib/signal/handoff-message.ts` (בונה את הטקסט מ-`signal` + `name`), משמש גם את הכרטיס ב-`/admin/signal/queue` וגם את מייל ההתראה הקיים.
- **עיקרון נשמר:** נוסח-סקרנות בלבד. אפס "קנה/הזמן", אפס scarcity (מהרשימה האסורה ב-SIGNAL_BUILD_PLAN).

### רכיב 4 · סגירת לולאה — outcome
- **מה:** על כל כרטיס, כפתורי outcome: `contacted` / `booked` / `no_answer` / `not_relevant`. לחיצה שומרת מי+מתי, מוציאה את הכרטיס מהתור, ומעדכנת סטטוס user בהתאם (booked → booked, וכו').
- **קבצים:** חדש `app/api/admin/signal/queue/outcome/route.ts` (מקביל ל-`/api/admin/call-list/outcome` הקיים — לשכפל את התבנית), Basic Auth.
- **שדות:** `handoff_outcome`, `handoff_outcome_at`, `handoff_outcome_by`, `handoff_note` על `signal_extractions`.

### רכיב 5 · שעון ה-SLA — רשת הביטחון (הליבה של הייעול)
- **מה:** cron שרץ כל שעה. כל ליד `boiling`/`hot` שאין לו outcome ועברו X שעות מ-`signal_temperature_at` → **הסלמה**:
  - **שלב 1 (למשל 4 שעות):** re-alert להדר — "ליד רותח ממתין X שעות, עדיין לא נגעת בו" + קישור ישיר לכרטיס בתור.
  - **שלב 2 (למשל 24 שעות, אופציונלי, מאחורי flag):** נודניק רך אוטומטי ל**ליד** עצמו (WhatsApp/מייל) בנוסח-סקרנות — "רצינו לחזור אלייך על האות שלך" — כדי שהחום לא יתבזבז.
- **קבצים:** חדש `app/api/cron/signal-sla/route.ts` (CRON_SECRET), נרשם ב-cron-job.org / `vercel.json`. שלב 2 מאחורי `SIGNAL_SLA_AUTONUDGE_ENABLED=false` עד שמאשרים.
- **למה זו הליבה:** זה מה שהופך "התראה" ל"מערכת". הדר יכולה לפספס מייל; היא לא יכולה לפספס ליד שהמערכת דואגת שלא ייפול.

---

## מודל הנתונים — migration 056

> הערה: קיימת התנגשות מספור קיימת (שני 054 + 055). המספר הפנוי הבא הוא **056**.

```sql
-- 056_signal_handoff_queue.sql
ALTER TABLE signal_extractions
  ADD COLUMN conversion_tier    text CHECK (conversion_tier IN ('hot','warm','cold')),
  ADD COLUMN conversion_score   int,
  ADD COLUMN conversion_reasons jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN handoff_outcome    text CHECK (handoff_outcome IN ('contacted','booked','no_answer','not_relevant')),
  ADD COLUMN handoff_outcome_at timestamptz,
  ADD COLUMN handoff_outcome_by text,
  ADD COLUMN handoff_note       text,
  ADD COLUMN sla_escalated_at   timestamptz;  -- מונע re-alert כפול

-- אינדקס לתור: הרותחים הפתוחים, טרי-ראשון
CREATE INDEX idx_signal_ext_queue
  ON signal_extractions (conversion_tier, generated_at DESC)
  WHERE handoff_outcome IS NULL;
```

---

## עקרונות שנשמרים (מ-SIGNAL_BUILD_PLAN)

- **החוליה האנושית = פרמיום, לא לאוטמט.** התור לא מוכר בשביל הדר — הוא מביא לה את הליד המוכן ומסלק חיכוך. ההחלטה והשיחה נשארות שלה.
- **אפס מניפולציה.** נודניק ה-SLA (רכיב 5, שלב 2) בנוסח-סקרנות בלבד, כבוי כברירת מחדל, לא נוגע במחיר.
- **בשלות לא מעלה מחיר ולא מתייגת אדם.** התור ממיין לפי *fit מסחרי* (convScore), לא לפי בשלות. תיוג הבשלות (רמה B) נשאר נפרד.
- **לא ממציאים.** הודעת ה-handoff נבנית מהתשובות של הליד עצמו, לא מהזיה חדשה.

---

## רצף עבודה מוצע

1. **056 + רכיב 1** (לשמור tier/score/reasons) — תשתית, בלי UI. מיד.
2. **רכיב 2 + 3** (התור + הודעה מוכנה) — הערך המיידי להדר.
3. **רכיב 4** (outcome, סגירת לולאה) — משכפל תבנית call-list קיימת.
4. **רכיב 5 שלב 1** (re-alert SLA) — רשת הביטחון.
5. **רכיב 5 שלב 2** (auto-nudge לליד) — נכתב **כבוי**, נדלק רק אחרי אישור.
6. `npx tsc --noEmit` → commit → push (auto-deploy).

הערכת היקף גסה: רכיבים 1–4 ליבה קטנה-בינונית; רכיב 5 שלב 1 קטן; שלב 2 בינוני (כתוב-כבוי).

---

## החלטות פתוחות — לסגור לפני בנייה

1. **סף ה-SLA שלב 1** — 4 שעות? (בשעות עבודה בלבד, או 24/7?)
2. **להדליק את שלב 2 (auto-nudge לליד)?** המלצה: לבנות כבוי, להחליט אחרי שרואים כמה לידים באמת נופלים.
3. **התור = מסך נפרד `/admin/signal/queue`, או בלוק עליון במסך האבחונים הקיים?** המלצה: בלוק עליון — פחות ניווט להדר.
4. **מי מסומן כ-`handoff_outcome_by`?** (Basic Auth יחיד היום — אולי פשוט "hadar"/"alon" מכפתור).
5. **להזין את לידי-האות הרותחים גם ל-`daily_call_list` הקיים, או להשאיר תור נפרד?** המלצה: תור נפרד — הקשר שונה (מסירה חמה מיידית מול שיחות-יום מתוזמנות).

---

## מה מפורשות *לא* בתוכנית

- שינוי בליבת מנוע האות (bucket / conversionScore / prompt) — נשאר כמו שהוא.
- אוטומציה של השיחה עצמה — הדר מדברת, המערכת רק מביאה ומודדת.
- הדלקת auto-nudge בלי אישור.
- נגיעה ברמה B (בשלות) — נפרד לחלוטין.
