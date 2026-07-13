-- The Signal Hive (English edition) welcome email. Fired by the
-- SIGNAL_HIVE_PURCHASED_EN product event, which the Cardcom webhook emits
-- for signal_hive_590 purchases whose currency is USD (the English marker).
-- The webhook injects a magic link redirecting to /en/kaveret.
-- Run in Supabase SQL Editor. Idempotent.

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'SIGNAL_HIVE_PURCHASED_EN',
  0,
  'You''re in The Signal Hive',
  'signal_hive_welcome_en',
  TRUE
)
ON CONFLICT DO NOTHING;
