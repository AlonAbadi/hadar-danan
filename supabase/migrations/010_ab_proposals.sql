-- Migration 010: AI-powered A/B testing proposals table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ab_proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category            TEXT NOT NULL CHECK (category IN ('copy', 'ux', 'funnel')),
  title               TEXT NOT NULL,
  hypothesis          TEXT NOT NULL,
  variant_a           TEXT NOT NULL,
  variant_b           TEXT NOT NULL,
  metric              TEXT NOT NULL,
  page_or_element     TEXT NOT NULL,
  estimated_traffic   INTEGER DEFAULT 0,
  days_to_significance INTEGER DEFAULT 14,
  priority            TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  reasoning           TEXT,
  status              TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'running', 'paused', 'completed')),
  visitors_a          INTEGER DEFAULT 0,
  visitors_b          INTEGER DEFAULT 0,
  conversions_a       INTEGER DEFAULT 0,
  conversions_b       INTEGER DEFAULT 0,
  confidence          REAL DEFAULT 0,
  winner              TEXT CHECK (winner IN ('a', 'b', 'none', NULL)),
  approved_at         TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seed data: 5 realistic initial proposals ─────────────────────────────────

INSERT INTO ab_proposals
  (category, title, hypothesis, variant_a, variant_b, metric, page_or_element,
   estimated_traffic, days_to_significance, priority, reasoning, status)
VALUES

-- 1. HIGH: CTA text on free training page
(
  'copy',
  'טקסט כפתור ההרשמה — דף הדרכה חינמית',
  'כפתור ממוקד תועלת ("לקבל את השיעור בחינם") יגדיל את שיעור ההרשמה ב-20% לעומת כפתור גנרי ("להתחיל עכשיו") כי הוא מדגיש את הערך הישיר ומפחית חיכוך.',
  '"להתחיל עכשיו" — CTA גנרי, ניטרלי',
  '"לקבל את השיעור בחינם" — CTA ממוקד תועלת שמדגיש מה המשתמש מקבל',
  'signup_rate',
  '/training',
  80,
  14,
  'high',
  'עמוד /training הוא נקודת הכניסה הראשית לפאנל. שיפור בשיעור ההרשמה בשלב זה משפיע על כל שאר הפאנל. מחקרים מראים שכפתורים ממוקדי-תועלת מגדילים המרה ב-15-30%.',
  'proposed'
),

-- 2. HIGH: Hero headline on homepage
(
  'copy',
  'כותרת ראשית — עמוד הבית',
  'כותרת ממוקדת תוצאה ומספרים קונקרטיים ("200+ עסקים שינו את הנוכחות הדיגיטלית שלהם ב-90 יום") תגדיל המרה ב-15% לעומת כותרת brand-centric, כי היא מדברת לתוצאה שהלקוח רוצה ובונה אמינות.',
  'כותרת נוכחית: "אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | TrueSignal©"',
  'כותרת חדשה: "200+ עסקים שינו את הנוכחות הדיגיטלית שלהם ב-90 יום" + תת-כותרת: "בלי צילום יומי. בלי עייפות תוכן. רק תוצאות."',
  'signup_rate',
  '/',
  150,
  10,
  'high',
  'עמוד הבית מקבל את עיקר התנועה (150+ ביקורים יומי). הכותרת הנוכחית ממוקדת במותג — הכותרת המוצעת ממוקדת בתוצאת הלקוח ומשתמשת בסוציאל פרוף (מספרים). זה ההבדל המשפיע ביותר בשלב הראשוני.',
  'proposed'
),

-- 3. MEDIUM: Pricing display on course page
(
  'copy',
  'פורמט תמחור — עמוד הקורס הדיגיטלי',
  'הצגת מחיר כ"₪5 ביום" במקום "₪1,800 חד פעמי" תגדיל לחיצות על כפתור הקנייה ב-25%, כי היא מפחיתה את כאב המחיר ומאפשרת השוואה נוחה לרכישות יומיות.',
  'תמחור נוכחי: "₪1,800" בתשלום חד פעמי עם כפתור קנייה ישיר',
  'תמחור מחולק: "₪5 ביום × 365 יום = ₪1,800" — הצגה של הערך היומי עם סיכום סכום סופי',
  'checkout_rate',
  '/course',
  40,
  21,
  'medium',
  'עמוד הקורס מציג מחיר של ₪1,800 שנתפס כגבוה. פסיכולוגיית תמחור מראה שפיצול לסכום יומי (₪5) מקטין כאב ומגדיל המרה — נפוץ בסאאס ובקורסים. שווה לבדוק עם הקהל הספציפי.',
  'proposed'
),

-- 4. MEDIUM: Quiz length
(
  'funnel',
  'אורך שאלון האבחון — 5 שאלות מול 3 שאלות',
  'שאלון קצר יותר (3 שאלות) יגדיל את שיעור השלמת השאלון ב-30%, כי הוא מקטין חיכוך ועייפות — גם אם בדיקת הדיוק של ההמלצה הסופית מוגבלת יותר.',
  'שאלון נוכחי: 5 שאלות — אבחון מפורט עם 3 אפשרויות לכל שאלה',
  'שאלון מקוצר: 3 שאלות — רק השאלות הגבוהות-ביותר בחיזוי (תקציב, שלב עסקי, מטרה ראשית)',
  'quiz_completion_rate',
  '/quiz',
  60,
  14,
  'medium',
  'שאלוני אבחון עם יותר מ-4 שאלות סובלים מנשירה גבוהה. בפאנל שלנו השאלון מפנה למוצר הנכון — אם אנשים לא מסיימים, הם לא ממירים. שאלון קצר עם המרה גבוהה שווה יותר משאלון מדויק עם נשירה.',
  'proposed'
),

-- 5. LOW: Email subject line for challenge upsell
(
  'copy',
  'שורת נושא — אימייל אפסייל לאתגר 7 ימים',
  'שורת נושא מותחת סקרנות וממוקדת תוצאה ("7 ימים שיכולים לשנות את הפיד שלך לנצח") תגדיל את שיעור הפתיחה ב-10% לעומת שורת נושא הנוכחית הכללית.',
  'שורת נושא נוכחית: "הדרכה שלך מוכנה! הצעד הבא בשבילך 🚀"',
  'שורת נושא חדשה: "7 ימים שיכולים לשנות את הפיד שלך לנצח"',
  'email_open_rate',
  'email:challenge_upsell_workshop',
  200,
  7,
  'low',
  'אימייל האפסייל לאתגר נשלח לכל הנרשמים אחרי 24 שעות — קהל הכי גדול בפאנל. שיפור ב-10% ב-open rate של 200 איש = 20 פתיחות נוספות ביום. כפול קצב ההמרה = 2-3 רכישות נוספות לשבוע.',
  'proposed'
);
