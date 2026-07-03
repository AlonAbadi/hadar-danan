-- Migration 064: premium_outcomes — the KPI that tunes the routing threshold
-- (BUILD_SPEC §11 + AUDIT §ג KPI rules).
--
-- One row per concierge meeting that actually happened (or didn't). Filled
-- from /admin (manual for now). couldnt_pay_rate over a rolling window of the
-- last 30 outcomes is THE routing north star:
--   tighten 0.72 → 0.74-0.76 only if ≥5/30 couldn't pay
--   loosen  0.72 → 0.70      only if ≤1/30
--   max one threshold move per 6 weeks; never tune on fewer than 30 outcomes.

CREATE TABLE IF NOT EXISTS premium_outcomes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  extraction_id uuid,
  showed_up     boolean,
  could_pay     boolean,
  purchased     boolean,
  amount        numeric,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE premium_outcomes ENABLE ROW LEVEL SECURITY;
-- Service-role only (all admin access goes through the server client).
