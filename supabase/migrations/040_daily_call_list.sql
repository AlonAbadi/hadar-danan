-- Migration 040: Daily call-list audit + dedup ledger.
--
-- Each row = one lead included in a specific day's 09:00 email.
-- UNIQUE(sent_on, user_id) makes the cron handler idempotent — if cron-job.org
-- accidentally double-fires, the second send becomes a no-op via ON CONFLICT.
--
-- Yesterday's rows are read to suppress lead repetition unless the lead has
-- a fresh hot signal (CHECKOUT_STARTED, /strategy/book visit, quiz completion
-- in last 24h).

CREATE TABLE IF NOT EXISTS daily_call_list (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_on     DATE NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  score       NUMERIC(6, 2) NOT NULL,
  reasons     JSONB NOT NULL DEFAULT '[]'::jsonb,
  brief       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sent_on, user_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_call_list_sent_on ON daily_call_list (sent_on DESC);
CREATE INDEX IF NOT EXISTS idx_daily_call_list_user    ON daily_call_list (user_id, sent_on DESC);

-- Single-row-per-day marker so we can detect "already sent" even when
-- zero leads qualified (in which case daily_call_list has no rows for today).
CREATE TABLE IF NOT EXISTS daily_call_list_runs (
  sent_on    DATE PRIMARY KEY,
  lead_count INTEGER NOT NULL DEFAULT 0,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

NOTIFY pgrst, 'reload schema';
