-- Migration 061: v2 isolation contract (BUILD_SPEC_KRIAH_V2 §1 + AUDIT §א)
--
-- Adds the is_test carrier bolt to every table the /kriah funnel writes,
-- plus instrument_version + source_utm on signal_extractions, plus the
-- live_* views that admin/revenue readers will filter through.
--
-- Additive only. ADD COLUMN ... DEFAULT false backfills existing rows to
-- false (PG11+ fast default), so no NULL-handling is needed in filters:
-- `.neq("is_test", true)` is safe everywhere.

ALTER TABLE users              ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE signal_extractions ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE purchases          ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE jobs               ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE quiz_results       ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE events             ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

ALTER TABLE signal_extractions
  ADD COLUMN IF NOT EXISTS instrument_version text NOT NULL DEFAULT 'v1_5q',
  ADD COLUMN IF NOT EXISTS source_utm jsonb;

CREATE INDEX IF NOT EXISTS idx_users_is_test              ON users (is_test) WHERE is_test;
CREATE INDEX IF NOT EXISTS idx_signal_extractions_is_test ON signal_extractions (is_test) WHERE is_test;
CREATE INDEX IF NOT EXISTS idx_purchases_is_test          ON purchases (is_test) WHERE is_test;

-- One valve instead of fifteen: admin/revenue surfaces read these views.
-- (Direct-table readers that the views can't cover — daily-call-list,
-- immediate-leads, admin queries on users/quiz_results/events — get
-- explicit .neq("is_test", true) filters in code; see AUDIT §א #5, #12.)
CREATE OR REPLACE VIEW live_signal_extractions AS
  SELECT * FROM signal_extractions WHERE is_test IS NOT TRUE;
CREATE OR REPLACE VIEW live_purchases AS
  SELECT * FROM purchases WHERE is_test IS NOT TRUE;
CREATE OR REPLACE VIEW live_users AS
  SELECT * FROM users WHERE is_test IS NOT TRUE;
CREATE OR REPLACE VIEW live_quiz_results AS
  SELECT * FROM quiz_results WHERE is_test IS NOT TRUE;
