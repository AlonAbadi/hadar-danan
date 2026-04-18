-- 022: Add tenant_id to all tenant-scoped tables (nullable + backfill)
-- Run this migration BEFORE 023 (NOT NULL + FK).
-- Verify all NULL counts = 0 in the output before proceeding to 023.
-- Safe to rerun: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.

BEGIN;

-- ── Step 1: Add tenant_id column (nullable) to all 14 tables ─────────────

ALTER TABLE public.users         ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.purchases     ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.bookings      ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.identities    ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.events        ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.email_logs    ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.notes         ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.reminders     ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.user_insights ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.quiz_results  ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.video_events  ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.hive_content  ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.experiments   ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.ab_proposals  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- ── Step 2: Backfill all existing rows to hadar tenant ───────────────────
-- Fetch hadar's UUID once to avoid 14 separate subqueries.
-- Guard: raises EXCEPTION (and rolls back) if hadar tenant is missing.

DO $$
DECLARE
  hadar_id UUID;
BEGIN
  SELECT id INTO hadar_id FROM public.tenants WHERE slug = 'hadar';

  IF hadar_id IS NULL THEN
    RAISE EXCEPTION 'hadar tenant not found — run 021 first';
  END IF;

  UPDATE public.users         SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.purchases     SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.bookings      SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.identities    SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.events        SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.email_logs    SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.notes         SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.reminders     SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.user_insights SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.quiz_results  SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.video_events  SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.hive_content  SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.experiments   SET tenant_id = hadar_id WHERE tenant_id IS NULL;
  UPDATE public.ab_proposals  SET tenant_id = hadar_id WHERE tenant_id IS NULL;
END $$;

-- ── Step 3: Indexes (after backfill — avoids per-row index churn) ─────────

CREATE INDEX IF NOT EXISTS idx_users_tenant_id         ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchases_tenant_id     ON public.purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id      ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_identities_tenant_id    ON public.identities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant_id        ON public.events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_id    ON public.email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_tenant_id         ON public.notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reminders_tenant_id     ON public.reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_tenant_id ON public.user_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_tenant_id  ON public.quiz_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_video_events_tenant_id  ON public.video_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hive_content_tenant_id  ON public.hive_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiments_tenant_id   ON public.experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ab_proposals_tenant_id  ON public.ab_proposals(tenant_id);

-- ── Verification: all counts must be 0 before running 023 ────────────────

SELECT 'users'         AS tbl, COUNT(*) AS null_count FROM public.users         WHERE tenant_id IS NULL
UNION ALL
SELECT 'purchases',             COUNT(*) FROM public.purchases     WHERE tenant_id IS NULL
UNION ALL
SELECT 'bookings',              COUNT(*) FROM public.bookings      WHERE tenant_id IS NULL
UNION ALL
SELECT 'identities',            COUNT(*) FROM public.identities    WHERE tenant_id IS NULL
UNION ALL
SELECT 'events',                COUNT(*) FROM public.events        WHERE tenant_id IS NULL
UNION ALL
SELECT 'email_logs',            COUNT(*) FROM public.email_logs    WHERE tenant_id IS NULL
UNION ALL
SELECT 'notes',                 COUNT(*) FROM public.notes         WHERE tenant_id IS NULL
UNION ALL
SELECT 'reminders',             COUNT(*) FROM public.reminders     WHERE tenant_id IS NULL
UNION ALL
SELECT 'user_insights',         COUNT(*) FROM public.user_insights WHERE tenant_id IS NULL
UNION ALL
SELECT 'quiz_results',          COUNT(*) FROM public.quiz_results  WHERE tenant_id IS NULL
UNION ALL
SELECT 'video_events',          COUNT(*) FROM public.video_events  WHERE tenant_id IS NULL
UNION ALL
SELECT 'hive_content',          COUNT(*) FROM public.hive_content  WHERE tenant_id IS NULL
UNION ALL
SELECT 'experiments',           COUNT(*) FROM public.experiments   WHERE tenant_id IS NULL
UNION ALL
SELECT 'ab_proposals',          COUNT(*) FROM public.ab_proposals  WHERE tenant_id IS NULL
ORDER BY tbl;

COMMIT;
