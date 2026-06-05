-- Backfill quiz_results rows for users who have a QUIZ_COMPLETED event
-- but no quiz_results row (because /api/quiz-result POST is fire-and-forget
-- on the client and may silently fail — see lib/quiz/side-effects.ts).
--
-- Run once in Supabase SQL Editor. Idempotent: only inserts when no row
-- exists for that (user_id, recommended_product) pair.
--
-- Note: this restores VISIBILITY of the quiz result in the CRM pipeline
-- + priority tabs. It does NOT send retroactive admin emails — leads
-- from previous weeks are already cold; the backfill_premium_partnership
-- migration (037) handles the status bump for those users.

INSERT INTO quiz_results (
  user_id,
  anonymous_id,
  recommended_product,
  match_percent,
  answers,
  scores,
  created_at
)
SELECT
  e.user_id,
  e.anonymous_id,
  (e.metadata->>'recommended_product')::text                  AS recommended_product,
  COALESCE((e.metadata->>'match_percent')::numeric, 0)::int   AS match_percent,
  COALESCE(e.metadata->'answers', '{}'::jsonb)                AS answers,
  '{}'::jsonb                                                  AS scores,
  e.created_at
FROM events e
WHERE e.type = 'QUIZ_COMPLETED'
  AND e.user_id IS NOT NULL
  AND e.metadata->>'recommended_product' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM quiz_results qr
    WHERE qr.user_id = e.user_id
      AND qr.recommended_product = (e.metadata->>'recommended_product')::text
  )
-- If a user has multiple QUIZ_COMPLETED events, take the most recent per
-- (user_id, recommended_product) — DISTINCT ON keeps the first row by ORDER BY.
ORDER BY e.user_id, e.metadata->>'recommended_product', e.created_at DESC;
