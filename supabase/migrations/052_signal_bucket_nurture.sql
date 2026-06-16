-- 052_signal_bucket_nurture.sql
-- Extends the bucket CHECK constraint on signal_extractions to accept the
-- new 'nurture' value introduced in commit a046816 (signal/router: hybrid
-- routing via routing_signal + new nurture bucket between "none" and
-- "challenge" for thin-but-engaged signals).
--
-- Without this, INSERTs that route to nurture silently fail the CHECK
-- constraint and the row never saves. The user sees their signal on screen
-- (the route soft-fails save and returns the in-memory parsed signal) but
-- extractionId comes back null, breaking the embedded share-card preview
-- and the share/copy/contest UI.

-- Find and drop the existing bucket CHECK constraint by definition rather
-- than by assumed name — Postgres auto-names from migration 051 might not
-- match the conventional pattern across all environments.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'signal_extractions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%bucket%IN%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE signal_extractions DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE signal_extractions
  ADD CONSTRAINT signal_extractions_bucket_check
  CHECK (bucket IS NULL OR bucket IN ('challenge', 'strategy', 'hive', 'nurture', 'none'));

COMMENT ON COLUMN signal_extractions.bucket IS 'Conversion bucket assigned to this signal. challenge=default entry, strategy=qualified founder/agency, hive=existing customer continuation, nurture=thin-but-engaged → free training, none=too-shallow (save only).';
