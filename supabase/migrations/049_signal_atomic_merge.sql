-- 049_signal_atomic_merge.sql
--
-- Atomic JSONB merge for signal_extractions.signal — fixes a race condition.
--
-- The asset/share-card routes cache per-(extraction, style, type) bg URLs and
-- per-(extraction, type) rewritten card text by reading row.signal, spreading
-- it in JS with the new field, and writing the whole object back. When the
-- Signal Kit page fires 5-8 parallel iframe loads, each request reads the
-- same V1 signal, computes its addition, and writes back — so writes overwrite
-- each other and at most one addition survives.
--
-- This function uses Postgres's atomic JSONB concat operator (||) inside a
-- single UPDATE, so concurrent calls properly serialize via the row lock and
-- every field gets merged in.

CREATE OR REPLACE FUNCTION signal_merge_field(
  p_id    uuid,
  p_field text,
  p_value text
) RETURNS void
LANGUAGE sql
AS $$
  UPDATE signal_extractions
  SET signal = COALESCE(signal, '{}'::jsonb) || jsonb_build_object(p_field, p_value)
  WHERE id = p_id;
$$;
