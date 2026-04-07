-- 016: add amount_paid to purchases
-- Stores the actual amount paid after discounts/coupons (may differ from list price).
-- NULL means no override — fall back to `amount`.

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT NULL;
