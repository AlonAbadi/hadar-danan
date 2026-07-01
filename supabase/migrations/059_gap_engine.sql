-- Migration 059: Gap engine (מנוע הפער) — INTERNAL ONLY, behind GAP_ENGINE_ENABLED flag.
--
-- Stores the gap-detection engine's read on each extraction. NEVER shown to the
-- user in this phase. Powers the internal review UI (/admin/signal/gap) where
-- Hadar + human experts (rav / Yemima teacher) validate before anything ships.
--
-- Grounded in SIGNAL_GAP_FOUNDATION.md + SIGNAL_GAP_SOLUTION.md, validated on
-- 45 real extractions (SIGNAL_GAP_VALIDATION_R2.md): two independent framework
-- raters reached AC1=0.73 on gap and 100% agreement on the crisis floor.
--
-- Abstention-first: most fields may be NULL when the engine abstains (correct
-- default — a missing gap costs nothing, a wrong one costs a person).

ALTER TABLE signal_extractions
  -- Decision
  ADD COLUMN IF NOT EXISTS gap_present     text
    CHECK (gap_present IN ('yes','partial','no','abstain')),
  ADD COLUMN IF NOT EXISTS gap_seam        text
    CHECK (gap_seam IN ('overshoot','metabolized','unclear','not_applicable')),
  ADD COLUMN IF NOT EXISTS gap_safety      text
    CHECK (gap_safety IN ('ok','caution','do_not_name')),
  -- Calibrated confidence 0..1 + the raw agreement signals it was built from
  ADD COLUMN IF NOT EXISTS gap_confidence  real,
  ADD COLUMN IF NOT EXISTS gap_signals     jsonb DEFAULT '{}'::jsonb,
  -- The grounded output (only when emitted): threshold + crossing + verbatim evidence
  ADD COLUMN IF NOT EXISTS gap_reading     text,
  ADD COLUMN IF NOT EXISTS gap_crossing    text,
  ADD COLUMN IF NOT EXISTS gap_evidence    jsonb DEFAULT '[]'::jsonb,
  -- Provenance
  ADD COLUMN IF NOT EXISTS gap_engine_version text,
  ADD COLUMN IF NOT EXISTS gap_computed_at    timestamptz,
  -- Human validation (filled in the review UI)
  ADD COLUMN IF NOT EXISTS gap_review_verdict text
    CHECK (gap_review_verdict IN ('precise','close','missed','harmful')),
  ADD COLUMN IF NOT EXISTS gap_review_by      text,
  ADD COLUMN IF NOT EXISTS gap_review_note    text,
  ADD COLUMN IF NOT EXISTS gap_review_at      timestamptz;

-- Index the reviewed rows (cheap review-queue queries).
CREATE INDEX IF NOT EXISTS idx_signal_ext_gap_review
  ON signal_extractions (gap_review_verdict)
  WHERE gap_review_verdict IS NOT NULL;

-- Index computed rows for the review UI (newest first).
CREATE INDEX IF NOT EXISTS idx_signal_ext_gap_computed
  ON signal_extractions (gap_computed_at DESC)
  WHERE gap_computed_at IS NOT NULL;
