-- Run this in Supabase SQL Editor after schema.sql
-- Atomic counter increment for A/B experiment tracking

CREATE OR REPLACE FUNCTION increment_experiment(
  p_name   TEXT,
  p_column TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_column NOT IN (
    'visitors_a', 'visitors_b', 'conversions_a', 'conversions_b'
  ) THEN
    RAISE EXCEPTION 'Invalid column: %', p_column;
  END IF;

  EXECUTE format(
    'UPDATE experiments SET %I = %I + 1 WHERE name = $1',
    p_column, p_column
  ) USING p_name;
END;
$$;
