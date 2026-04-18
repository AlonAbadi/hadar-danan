-- 023: Add NOT NULL constraint and FK to tenants(id) on all 14 tenant-scoped tables
-- Run AFTER 022 (nullable tenant_id + backfill) is verified clean.
-- Safe to rerun: SET NOT NULL is idempotent; FK constraints use IF NOT EXISTS guards.

BEGIN;

-- ── Safety assertion: abort if any NULLs remain from 022 ─────────────────
-- Raises EXCEPTION (rolling back the whole transaction) on first violation.

DO $$
DECLARE
  n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM public.users         WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'users: % NULL tenant_id rows — run 022 first', n; END IF;

  SELECT COUNT(*) INTO n FROM public.purchases     WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'purchases: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.bookings      WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'bookings: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.identities    WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'identities: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.events        WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'events: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.email_logs    WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'email_logs: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.notes         WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'notes: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.reminders     WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'reminders: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.user_insights WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'user_insights: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.quiz_results  WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'quiz_results: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.video_events  WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'video_events: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.hive_content  WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'hive_content: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.experiments   WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'experiments: % NULL tenant_id rows', n; END IF;

  SELECT COUNT(*) INTO n FROM public.ab_proposals  WHERE tenant_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'ab_proposals: % NULL tenant_id rows', n; END IF;
END $$;

-- ── Step 1: Flip tenant_id to NOT NULL on all 14 tables ──────────────────
-- SET NOT NULL is idempotent in PostgreSQL — safe to rerun.

ALTER TABLE public.users         ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.purchases     ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bookings      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.identities    ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.events        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.email_logs    ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.notes         ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.reminders     ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_insights ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.quiz_results  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.video_events  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.hive_content  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.experiments   ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ab_proposals  ALTER COLUMN tenant_id SET NOT NULL;

-- ── Step 2: Add FK constraints → tenants(id) ON DELETE RESTRICT ──────────
-- Named constraints with IF NOT EXISTS guards for safe reruns.
-- ON DELETE RESTRICT: tenant deletion must be deliberate, never cascaded.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_tenant_id'         AND table_schema = 'public') THEN
    ALTER TABLE public.users         ADD CONSTRAINT fk_users_tenant_id         FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_purchases_tenant_id'     AND table_schema = 'public') THEN
    ALTER TABLE public.purchases     ADD CONSTRAINT fk_purchases_tenant_id     FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_tenant_id'      AND table_schema = 'public') THEN
    ALTER TABLE public.bookings      ADD CONSTRAINT fk_bookings_tenant_id      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_identities_tenant_id'    AND table_schema = 'public') THEN
    ALTER TABLE public.identities    ADD CONSTRAINT fk_identities_tenant_id    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_events_tenant_id'        AND table_schema = 'public') THEN
    ALTER TABLE public.events        ADD CONSTRAINT fk_events_tenant_id        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_email_logs_tenant_id'    AND table_schema = 'public') THEN
    ALTER TABLE public.email_logs    ADD CONSTRAINT fk_email_logs_tenant_id    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_notes_tenant_id'         AND table_schema = 'public') THEN
    ALTER TABLE public.notes         ADD CONSTRAINT fk_notes_tenant_id         FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_reminders_tenant_id'     AND table_schema = 'public') THEN
    ALTER TABLE public.reminders     ADD CONSTRAINT fk_reminders_tenant_id     FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_user_insights_tenant_id' AND table_schema = 'public') THEN
    ALTER TABLE public.user_insights ADD CONSTRAINT fk_user_insights_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_quiz_results_tenant_id'  AND table_schema = 'public') THEN
    ALTER TABLE public.quiz_results  ADD CONSTRAINT fk_quiz_results_tenant_id  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_video_events_tenant_id'  AND table_schema = 'public') THEN
    ALTER TABLE public.video_events  ADD CONSTRAINT fk_video_events_tenant_id  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_hive_content_tenant_id'  AND table_schema = 'public') THEN
    ALTER TABLE public.hive_content  ADD CONSTRAINT fk_hive_content_tenant_id  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_experiments_tenant_id'   AND table_schema = 'public') THEN
    ALTER TABLE public.experiments   ADD CONSTRAINT fk_experiments_tenant_id   FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_ab_proposals_tenant_id'  AND table_schema = 'public') THEN
    ALTER TABLE public.ab_proposals  ADD CONSTRAINT fk_ab_proposals_tenant_id  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────
-- Part 1: All 14 tenant_id columns must show is_nullable = 'NO'

SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
  AND table_name IN (
    'users','purchases','bookings','identities','events','email_logs',
    'notes','reminders','user_insights','quiz_results','video_events',
    'hive_content','experiments','ab_proposals'
  )
ORDER BY table_name;

-- Part 2: All 14 FK constraints must be present

SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE 'fk_%_tenant_id'
ORDER BY table_name;

COMMIT;
