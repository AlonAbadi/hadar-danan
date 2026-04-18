-- 025: Composite unique constraints for tenant scoping
-- Replaces 3 global unique constraints that would collide across tenants:
--   users.email          → (email, tenant_id)
--   experiments.name     → (name, tenant_id)
--   bookings_slot_unique → (tenant_id, slot_date, slot_time) WHERE status='confirmed'
--
-- NOT touched (intentionally global):
--   users_auth_id_key          — auth linkage is cross-tenant by design
--   purchases.cardcom_ref      — Cardcom refs are globally unique by design
--   email_logs (user_id, sequence_id) — user_id already implies tenant
--   identities.anonymous_id    — device-scoped, not tenant-scoped
--
-- Reversible: every DROP IF EXISTS paired before each ADD.
-- Verification runs inside the transaction — bad state never committed.

BEGIN;

-- ── Drop old global unique constraints ───────────────────────────────────

ALTER TABLE public.users        DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.experiments  DROP CONSTRAINT IF EXISTS experiments_name_key;
DROP INDEX IF EXISTS bookings_slot_unique;

-- ── Add new tenant-scoped composite constraints ───────────────────────────

ALTER TABLE public.users
  ADD CONSTRAINT users_email_tenant_key UNIQUE (email, tenant_id);

ALTER TABLE public.experiments
  ADD CONSTRAINT experiments_name_tenant_key UNIQUE (name, tenant_id);

CREATE UNIQUE INDEX bookings_slot_unique
  ON public.bookings (tenant_id, slot_date, slot_time)
  WHERE status = 'confirmed';

-- ── Verification (inside transaction — bad state never committed) ─────────

-- Part 1: new composite constraints present, old global ones absent
-- Expected: users_email_tenant_key + users_auth_id_key on users,
--           experiments_name_tenant_key on experiments.
--           users_email_key and experiments_name_key must NOT appear.
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name IN ('users', 'experiments')
  AND constraint_type = 'UNIQUE'
ORDER BY table_name, constraint_name;

-- Part 2: bookings_slot_unique now includes tenant_id as first column
-- Expected indexdef contains: (tenant_id, slot_date, slot_time)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'bookings'
  AND indexname = 'bookings_slot_unique';

COMMIT;
