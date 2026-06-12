-- 048_users_occupation.sql
-- Adds an optional `occupation` (free-text field of work / niche) column to
-- the `users` table. Captured at the /signal lead gate, surfaced in the
-- admin CRM, and passed to the Signal Engine as *context only*. The
-- TrueSignal© method differentiates from the person, not the occupation —
-- the field shapes how the model phrases the positioning relative to field
-- norms, but never drives what the differentiation IS. See
-- SIGNAL_ENGINE_SYSTEM_PROMPT for the strict rule.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS occupation TEXT;

COMMENT ON COLUMN users.occupation IS 'Free-text field of work / niche, e.g. "מאמן כלבים", "קוסמטיקאית", "יוצר פודקאסט". Captured at /signal gate. Used for Signal Engine context + admin filtering.';
