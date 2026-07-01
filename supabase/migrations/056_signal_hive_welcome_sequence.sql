-- Migration 056: כוורת האות welcome email sequence.
--
-- Fired by the Cardcom webhook on a signal_hive_590 purchase (via the
-- SIGNAL_HIVE_PURCHASED product event). The webhook injects a magic link
-- (access_link) into the delay-0 job so the buyer lands straight in
-- /hive/signal-kit. Template signal_hive_welcome lives in lib/email/templates.ts.
--
-- Run in Supabase SQL Editor. Idempotent.

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'SIGNAL_HIVE_PURCHASED',
  0,
  'נכנסת לכוורת האות',
  'signal_hive_welcome',
  TRUE
)
ON CONFLICT DO NOTHING;
