-- 054_signal_temperature.sql
--
-- Persist a lead-temperature classification on the users table, sourced from
-- the bucket of the user's most recent signal extraction. Powers:
--   (1) the "🔥 לידים רותחים" section at the top of /admin
--   (2) the immediate "boiling lead" email to Alon + Hadar
--   (3) future admin sorting / filtering by lead heat
--
-- Mapping (route logic):
--   bucket = strategy   → signal_temperature = boiling
--   bucket = challenge  → signal_temperature = warm
--   bucket = nurture    → signal_temperature = nurture
--   bucket = hive       → leave NULL (existing customer, separate flow)
--   bucket = none       → leave NULL (too thin to classify)
--
-- The column is set/updated in /api/signal/extract after a successful save.
-- It's not the source of truth — signal_extractions.bucket is. This column
-- is a denormalized index for fast admin reads.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS signal_temperature TEXT
    CHECK (signal_temperature IN ('boiling', 'warm', 'nurture')),
  ADD COLUMN IF NOT EXISTS signal_temperature_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_signal_temperature
  ON users (signal_temperature, signal_temperature_at DESC NULLS LAST);

-- Backfill from existing signal_extractions so legacy rows show up in admin
-- immediately. Each user's MOST RECENT extraction wins.
WITH latest AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    bucket,
    generated_at
  FROM signal_extractions
  ORDER BY user_id, generated_at DESC
)
UPDATE users u
SET
  signal_temperature = CASE l.bucket
    WHEN 'strategy'  THEN 'boiling'
    WHEN 'challenge' THEN 'warm'
    WHEN 'nurture'   THEN 'nurture'
    ELSE NULL
  END,
  signal_temperature_at = l.generated_at
FROM latest l
WHERE l.user_id = u.id
  AND l.bucket IN ('strategy', 'challenge', 'nurture');
