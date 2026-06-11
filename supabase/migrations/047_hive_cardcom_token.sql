-- Migration 047: Cardcom token storage for Hive recurring billing (Stage 4 Phase 1)
-- ============================================================================
-- The Hive billing model: the customer pays the first month via Cardcom
-- LowProfile with Operation=ChargeAndCreateToken. Cardcom returns a Token +
-- card validity month/year. We store these and use ChargeToken to bill the
-- recurring monthly charge ourselves on a cron schedule. Cardcom does NOT
-- run the recurring calendar; we do.
--
-- These columns are NULL until the customer completes their first Hive
-- payment. Sensitive token data is never logged or returned in API responses.

ALTER TABLE users
  -- Cardcom-issued token used to charge the saved card again. Single token
  -- per user — if they re-subscribe with a different card, we overwrite.
  ADD COLUMN IF NOT EXISTS cardcom_token             TEXT        DEFAULT NULL,

  -- Card validity required by ChargeToken on every monthly renewal. We can't
  -- bill if these are stale — used to detect expired cards in advance.
  ADD COLUMN IF NOT EXISTS cardcom_card_valid_month  SMALLINT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cardcom_card_valid_year   SMALLINT    DEFAULT NULL,

  -- Last 4 digits for display in /account and admin views. Safe to show.
  ADD COLUMN IF NOT EXISTS cardcom_card_last4        TEXT        DEFAULT NULL,

  -- Last successful renewal timestamp. Used by the renewal cron to skip
  -- users whose charge already ran this cycle (idempotency belt-and-braces
  -- on top of hive_next_billing_date).
  ADD COLUMN IF NOT EXISTS hive_last_charged_at      TIMESTAMPTZ DEFAULT NULL,

  -- Count of consecutive failed renewal attempts. Reset to 0 on success.
  -- Used to escalate (e.g. email at 1 failure, suspend at 3).
  ADD COLUMN IF NOT EXISTS hive_failed_charge_count  SMALLINT    NOT NULL DEFAULT 0;

-- Partial index — only the rows we'll actually scan in the renewal cron.
CREATE INDEX IF NOT EXISTS idx_users_hive_renewal_due
  ON users (hive_next_billing_date)
  WHERE hive_status = 'active' AND cardcom_token IS NOT NULL;

COMMENT ON COLUMN users.cardcom_token IS
  'Cardcom card token from LowProfile ChargeAndCreateToken. Used by /api/cron/hive-renew to charge monthly via ChargeToken endpoint. Treat as a secret.';
