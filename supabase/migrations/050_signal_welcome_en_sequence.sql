-- Migration 050: SIGNAL_EXTRACTED_EN email sequence (English /en/signal flow)
-- Mirrors migration 046 (Hebrew SIGNAL_EXTRACTED welcome) on the English side.
--
-- Fired by /api/en/signal/extract on every successful extraction. The
-- signal_welcome_en template lives in lib/email/templates.ts.

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'SIGNAL_EXTRACTED_EN',
  0,
  'Your signal',
  'signal_welcome_en',
  TRUE
)
ON CONFLICT DO NOTHING;
