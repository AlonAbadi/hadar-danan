-- Migration 007: Hive membership system
-- Run in Supabase Dashboard → SQL Editor

-- Add hive columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hive_tier              VARCHAR     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hive_status            VARCHAR     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hive_started_at        TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hive_cancelled_at      TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hive_next_billing_date TIMESTAMPTZ DEFAULT NULL;

-- Add recurring flag to purchases
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Email sequences for hive
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
VALUES
  ('HIVE_JOINED',    0,   'ברוך הבא לכוורת 🐝',         'hive_welcome'),
  ('HIVE_JOINED',    168, 'שבוע בכוורת — איך הולך? 🐝', 'hive_day7'),
  ('HIVE_CANCELLED', 0,   'אישור ביטול מנוי הכוורת',     'hive_cancelled');

-- Verify
SELECT trigger_event, delay_hours, template_key, active
FROM email_sequences
WHERE trigger_event LIKE 'HIVE%'
ORDER BY trigger_event, delay_hours;
