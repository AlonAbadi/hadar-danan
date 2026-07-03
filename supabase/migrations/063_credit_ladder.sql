-- Migration 063: controlled credit ladder (BUILD_SPEC §9 + AUDIT §ב slim version)
--
-- One credit system instead of two: a static ladder in lib/products.ts,
-- computed server-side, snapshotted on the pending purchase at checkout-start
-- (Race-A fix), and atomically marked on the SOURCE purchase at completion.
--
-- Semantics from this migration on:
--   purchases.amount       = gross (list price)           [was: billed net]
--   purchases.amount_paid  = net actually billed          [webhook writes it]
--   credit_applied         = the credit inside that delta
--   credit_source_purchase_id (on the TARGET row) = checkout-start snapshot
--   credited_toward        (on the SOURCE row)    = atomic completion mark
-- The two edges are deliberate: snapshot vs. consumption (AUDIT §ב.7).
--
-- Historical rows keep amount=net; the backfill below sets amount_paid=amount
-- for completed rows so `amount_paid ?? amount` (all admin revenue math)
-- stays correct across the epoch boundary.

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS credit_applied            numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_source_purchase_id uuid REFERENCES purchases(id),
  ADD COLUMN IF NOT EXISTS credited_toward           uuid REFERENCES purchases(id);

UPDATE purchases SET amount_paid = amount
  WHERE status = 'completed' AND amount_paid IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_credited_toward
  ON purchases (credited_toward) WHERE credited_toward IS NOT NULL;

-- ── Refund runbook (manual — nothing in the codebase sets status='refunded') ──
-- When refunding a purchase that CONSUMED a credit (the upsell):
--   UPDATE purchases SET credited_toward = NULL
--     WHERE credited_toward = '<refunded purchase id>';
--   -- restores the source credit for future use.
-- When refunding a purchase that GRANTED a credit already consumed (the source):
--   SELECT id, product, amount_paid FROM purchases
--     WHERE credit_source_purchase_id = '<refunded purchase id>';
--   -- the upsell was undercharged relative to the refund — handle manually
--   -- (collect the difference or accept it), there is no automatic clawback.
-- Guard query (run monthly): refunded rows participating in credit edges:
--   SELECT p.id, p.product FROM purchases p
--    WHERE p.status = 'refunded'
--      AND (p.credited_toward IS NOT NULL
--           OR EXISTS (SELECT 1 FROM purchases t WHERE t.credit_source_purchase_id = p.id));
