-- 053_signal_feedback.sql
-- Adds customer-quality feedback fields on signal_extractions so we can
-- iterate the LLM prompt against real signal. Without this, every prompt
-- tweak is a guess — once we have feedback we can A/B against extractions
-- the user said were "precise" vs "missed".

ALTER TABLE signal_extractions
  ADD COLUMN IF NOT EXISTS feedback_rating TEXT
    CHECK (feedback_rating IS NULL OR feedback_rating IN ('precise', 'close', 'missed')),
  ADD COLUMN IF NOT EXISTS feedback_note TEXT,
  ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMPTZ;

-- Partial index — only feedback rows. Lets the admin overview / prompt-eval
-- query run cheaply ("show me all missed extractions from the last week").
CREATE INDEX IF NOT EXISTS idx_signal_extractions_feedback_rating
  ON signal_extractions (feedback_rating)
  WHERE feedback_rating IS NOT NULL;

COMMENT ON COLUMN signal_extractions.feedback_rating IS 'User quality rating on the extracted signal. precise=ראיתי את עצמי, close=קרוב, missed=פספס. NULL = no feedback given. One-time submission (overwrite allowed).';
COMMENT ON COLUMN signal_extractions.feedback_note  IS 'Optional free-text elaboration from the user when they submit feedback. Hebrew. Used to refine the system prompt against real misses.';
COMMENT ON COLUMN signal_extractions.feedback_at    IS 'Timestamp of the most recent feedback submission. Updated on every POST to /api/signal/[id]/feedback.';
