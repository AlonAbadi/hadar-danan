-- Migration 067: English v2 funnel email sequences (KRIAH_CORE_LEAD_EN + SIGNAL_STRATEGY_LEAD_EN)
-- Mirrors migrations 062 (Hebrew KRIAH_CORE_LEAD) and 060 (Hebrew
-- SIGNAL_STRATEGY_LEAD) on the English side.
--
-- Enqueued by /api/signal/extract for v2_funnel_en readings:
--   hive ending      → kriah_hive_offer_en (~40h, The Signal Hive $149)
--   concierge ending → signal_strategy_fallback_en (72h, no-meeting re-open)
-- Both templates live in lib/email/templates.ts. Day1-12 EN nurture rows are
-- deliberately NOT added — the v2 route filters the welcome chain to
-- signal_welcome_en only.

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'KRIAH_CORE_LEAD_EN',
  40,
  'Does your sentence still hold?',
  'kriah_hive_offer_en',
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'SIGNAL_STRATEGY_LEAD_EN',
  72,
  'Still here, still yours',
  'signal_strategy_fallback_en',
  TRUE
)
ON CONFLICT DO NOTHING;
