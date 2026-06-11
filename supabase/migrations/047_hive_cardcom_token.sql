-- Migration 047: Cardcom recurring order linkage for Hive billing (Stage 4 Phase 1)
-- ============================================================================
-- Cardcom runs the recurring schedule natively via its הוראת קבע (standing
-- order) system. Our flow:
--   1. Customer pays month 1 via LowProfile with Operation=ChargeAndCreateToken
--      → Cardcom returns a Token + LowProfileDealGuid
--   2. We POST to BillGoldService.AddUpdateRecurringOrder with the token →
--      Cardcom creates a RecurringOrder and returns its RecurringId + AccountId
--   3. Cardcom charges the saved card on its own schedule. Each charge hits
--      our existing /api/cardcom/webhook IndicatorUrl. We just listen.
--   4. Cancellation = call AddUpdateRecurringOrder with IsActive=false.
--
-- These columns are NULL until the customer's first Hive payment succeeds.

ALTER TABLE users
  -- Cardcom's identifier for the recurring order. Required for cancel /
  -- update calls (AddUpdateRecurringOrder with this RecurringId).
  ADD COLUMN IF NOT EXISTS cardcom_recurring_id      INTEGER     DEFAULT NULL,

  -- Cardcom's customer account record. Returned by AddUpdateRecurringOrder.
  -- Useful for tying multiple orders to the same customer in the future.
  ADD COLUMN IF NOT EXISTS cardcom_account_id        INTEGER     DEFAULT NULL,

  -- Token from LowProfile ChargeAndCreateToken. Stored so we can build a
  -- new RecurringOrder if the customer ever upgrades tier / restarts after
  -- cancellation without re-entering card details. Treat as a secret.
  ADD COLUMN IF NOT EXISTS cardcom_token             TEXT        DEFAULT NULL,

  -- Card validity — Cardcom can in some flows require these to be re-asserted
  -- when reactivating a cancelled recurring order. Cheap to store.
  ADD COLUMN IF NOT EXISTS cardcom_card_valid_month  SMALLINT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cardcom_card_valid_year   SMALLINT    DEFAULT NULL,

  -- Last 4 digits for display in /account and admin views. Safe to show.
  ADD COLUMN IF NOT EXISTS cardcom_card_last4        TEXT        DEFAULT NULL;

-- Look up a user by their Cardcom RecurringId quickly when the renewal
-- webhook fires referencing an order, not a user.
CREATE INDEX IF NOT EXISTS idx_users_cardcom_recurring_id
  ON users (cardcom_recurring_id)
  WHERE cardcom_recurring_id IS NOT NULL;

COMMENT ON COLUMN users.cardcom_recurring_id IS
  'Cardcom RecurringId from BillGoldService.AddUpdateRecurringOrder. Cardcom runs the monthly schedule; we cancel by calling the same endpoint with IsActive=false.';

COMMENT ON COLUMN users.cardcom_token IS
  'Cardcom card token from LowProfile ChargeAndCreateToken. Treat as a secret. Only used to construct new recurring orders (e.g. tier change, reactivation).';
