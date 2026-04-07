-- ============================================================
-- Migration 002: Email automation sequences
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Sequence 2: Challenge buyers (immediate access + day-7 workshop upsell)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
VALUES
  ('CHALLENGE_PURCHASED',  0,    'הגישה שלך לצ׳אלנג׳ 7 הימים מוכנה!',       'challenge_access'),
  ('CHALLENGE_PURCHASED',  168,  'יום 7: מה השגת? + ההצעה הבאה שלך',          'challenge_upsell_workshop');

-- Sequence 3: Workshop buyers (immediate confirmation + day-7 strategy upsell)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
VALUES
  ('WORKSHOP_PURCHASED',   0,    'ההרשמה לסדנה אושרה! הנה כל הפרטים',         'workshop_confirmation'),
  ('WORKSHOP_PURCHASED',   168,  'שבוע אחרי הסדנה — מה עכשיו?',               'workshop_upsell_strategy');

-- Sequence 4: Abandoned checkout (1h + 24h with coupon)
-- Only insert if they don't already exist from schema.sql
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
SELECT 'CHECKOUT_STARTED', 1,  'שכחת משהו... המקום עדיין שמור לך',            'cart_abandon_1h'
WHERE NOT EXISTS (
  SELECT 1 FROM email_sequences
  WHERE trigger_event = 'CHECKOUT_STARTED' AND delay_hours = 1
);

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
SELECT 'CHECKOUT_STARTED', 24, 'אחרון — קוד הנחה 10% בפנים',                  'cart_abandon_24h'
WHERE NOT EXISTS (
  SELECT 1 FROM email_sequences
  WHERE trigger_event = 'CHECKOUT_STARTED' AND delay_hours = 24
);

-- Sequence 5: Re-engagement (fired by job runner for 3-day inactive users)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
VALUES
  ('INACTIVE_3_DAYS',      0,    'התגעגענו אליך',                               'reengagement');

-- Verify
SELECT trigger_event, delay_hours, template_key, active
FROM email_sequences
ORDER BY trigger_event, delay_hours;
