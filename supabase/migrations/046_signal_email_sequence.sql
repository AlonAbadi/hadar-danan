-- Migration 046: SIGNAL_EXTRACTED email sequence
-- Forks /signal leads out of the generic USER_SIGNED_UP welcome (which pitched
-- the full product ladder) into a dedicated message that references the
-- diagnostic they just took and points to the Hive as the next step.
--
-- Fired by /api/signal/extract on every successful extraction. The
-- signal_welcome template lives in lib/email/templates.ts.

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'SIGNAL_EXTRACTED',
  0,
  'האות שלך כאן',
  'signal_welcome',
  TRUE
)
ON CONFLICT DO NOTHING;
