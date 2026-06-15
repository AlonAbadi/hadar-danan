-- 051_users_gender.sql
-- Adds a `gender` column to `users` and `signal_extractions` so the Signal
-- Engine can address visitors in singular Hebrew (זכר / נקבה) rather than the
-- generic "אתה/את" fallback. The /signal lead gate detects gender from first
-- name via `lib/gender/detect.ts`; on ambiguity we default to feminine (core
-- audience of beegood.online). Stored once per user so the value persists for
-- future signal re-extractions and for email personalization.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IS NULL OR gender IN ('m', 'f'));

COMMENT ON COLUMN users.gender IS 'Hebrew grammatical gender for addressing the user. m=זכר, f=נקבה. Detected from first name at /signal lead gate; default fallback is f (core audience). NULL means undetected/legacy.';

-- Signal-level gender (used at extraction time). Stored on the row so the
-- letter copy can be re-rendered later from the same data even if the user's
-- own gender field is updated.
ALTER TABLE signal_extractions
  ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IS NULL OR gender IN ('m', 'f'));

COMMENT ON COLUMN signal_extractions.gender IS 'Gender used when generating this extraction. Drives addressing in the signal text + result page template.';

-- Bucket column on signal_extractions — drives the conditional CTA on the
-- result page (challenge / strategy / hive / none). Computed server-side from
-- the answers + user state at extraction time.
ALTER TABLE signal_extractions
  ADD COLUMN IF NOT EXISTS bucket TEXT
    CHECK (bucket IS NULL OR bucket IN ('challenge', 'strategy', 'hive', 'none'));

COMMENT ON COLUMN signal_extractions.bucket IS 'Conversion bucket assigned to this signal. challenge=default entry, strategy=qualified founder/agency, hive=existing customer continuation, none=too-shallow signal (save only, no CTA).';

CREATE INDEX IF NOT EXISTS idx_signal_extractions_bucket
  ON signal_extractions (bucket);
