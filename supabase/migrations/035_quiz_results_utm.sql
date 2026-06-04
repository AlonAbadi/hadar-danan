-- Migration 035: Add UTM attribution columns to quiz_results
-- Enables per-campaign quiz-completion → lead-capture funnel analysis.
-- Snapshot of UTM cookies taken when the quiz finishes (step 6 of QuizClient),
-- BEFORE the lead form, so we can attribute drop-offs to the campaign that
-- drove the visit.

ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS utm_source   TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content  TEXT,
  ADD COLUMN IF NOT EXISTS utm_term     TEXT,
  ADD COLUMN IF NOT EXISTS utm_adset    TEXT,
  ADD COLUMN IF NOT EXISTS utm_ad       TEXT,
  ADD COLUMN IF NOT EXISTS click_id     TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_results_utm_source   ON quiz_results (utm_source);
CREATE INDEX IF NOT EXISTS idx_quiz_results_utm_campaign ON quiz_results (utm_campaign);
