-- Migration 065: kriah daily morning reports (Alon, 2026-07-05).
--
-- One row per day (Asia/Jerusalem date): the metrics snapshot + the written
-- conclusions. Generated lazily by the first /admin/kriah load after 06:00 —
-- no cron infrastructure needed (Vercel Hobby cron slots are exhausted).

CREATE TABLE IF NOT EXISTS kriah_daily_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date UNIQUE NOT NULL,
  metrics     jsonb NOT NULL,
  conclusions text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kriah_daily_reports ENABLE ROW LEVEL SECURITY;
-- service-role only
