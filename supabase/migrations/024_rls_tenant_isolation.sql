-- 024: Enable RLS on tenant-scoped tables not yet protected
-- Pattern: deny-all-non-service-role (default PostgreSQL behaviour when
-- RLS is enabled and no permissive policy exists for the requesting role).
-- Service role bypasses RLS entirely — all existing code paths unaffected.
--
-- Tables already protected since 001_schema.sql (no change needed):
--   users, identities, purchases, events, experiments, jobs,
--   email_sequences, email_logs, error_logs
-- Tables already protected from their own migrations (no change needed):
--   tenants (021), atelier_applications (020)
--
-- No CREATE POLICY statements in this migration →
-- no DROP POLICY IF EXISTS needed for idempotency.
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent in PostgreSQL.
-- Migration 014 policies (users_read_own, users_update_own,
-- purchases_read_own) are untouched.

BEGIN;

-- ── Enable RLS on 8 tables not yet protected ─────────────────────────────
-- Effect: anon and authenticated roles cannot read, write, or delete any
-- rows in these tables. Access is service-role only.

ALTER TABLE public.bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_proposals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_content  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

-- ── Verification part 1: RLS enabled on all expected tables ──────────────

SELECT
  relname          AS table_name,
  relrowsecurity   AS rls_enabled
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE pg_namespace.nspname = 'public'
  AND relkind = 'r'
  AND relname IN (
    'users', 'identities', 'purchases', 'events', 'experiments',
    'jobs', 'email_sequences', 'email_logs', 'error_logs',
    'bookings', 'ab_proposals', 'video_events', 'quiz_results',
    'notes', 'reminders', 'hive_content', 'user_insights',
    'tenants', 'atelier_applications'
  )
ORDER BY relname;

-- ── Verification part 2: migration 014 policies still intact ─────────────

SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'purchases')
ORDER BY tablename, policyname;

COMMIT;
