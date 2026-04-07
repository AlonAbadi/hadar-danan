-- Migration 005: Add email sequence for partnership lead
-- Run in Supabase SQL Editor

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'PARTNERSHIP_LEAD',
  0,
  'קיבלנו את הבקשה שלך — הדר תחזור אליך בקרוב',
  'partnership_confirmation',
  true
)
ON CONFLICT DO NOTHING;
