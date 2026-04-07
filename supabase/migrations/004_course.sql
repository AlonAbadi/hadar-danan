-- Migration 004: Add email sequences for course product
-- Run in Supabase SQL Editor

-- Course access email (immediate on purchase)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'COURSE_PURCHASED',
  0,
  'ברוכ/ה הבא/ה לקורס! הגישה שלך פעילה 🎓',
  'course_access',
  true
)
ON CONFLICT DO NOTHING;

-- Course → strategy upsell (after 1 week)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'COURSE_PURCHASED',
  168,
  'סיימת שבוע ראשון — הצעד הבא שלך',
  'course_upsell_strategy',
  true
)
ON CONFLICT DO NOTHING;

-- Update workshop upsell to point to course instead of strategy
-- (template key already updated in lib/email/templates.ts)
UPDATE email_sequences
SET template_key = 'workshop_upsell_course',
    subject      = 'מה הצעד הבא אחרי הסדנה? (הצעה מיוחדת)'
WHERE trigger_event = 'WORKSHOP_PURCHASED'
  AND delay_hours   = 168;
