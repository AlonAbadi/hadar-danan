-- Migration 041: track per-lead call outcomes on daily_call_list.
--
-- After Hadar/Alon make the call, the admin marks the result on /admin/call-list.
-- Outcome values:
--   handled       — talked, no immediate sale (parked, not a fit right now)
--   not_relevant  — not a fit at all
--   booked        — booked a session as a result of the call
--
-- The user's main `status` is also updated (handled / not_relevant / booked) so
-- the candidate query naturally stops surfacing this lead in future emails.
-- These columns provide the audit trail for /admin/call-list.

ALTER TABLE daily_call_list
  ADD COLUMN IF NOT EXISTS outcome     TEXT,
  ADD COLUMN IF NOT EXISTS outcome_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome_by  TEXT,
  ADD COLUMN IF NOT EXISTS outcome_note TEXT;

CREATE INDEX IF NOT EXISTS idx_daily_call_list_outcome
  ON daily_call_list (outcome) WHERE outcome IS NOT NULL;

NOTIFY pgrst, 'reload schema';
