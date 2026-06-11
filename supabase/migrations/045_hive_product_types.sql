-- Migration 045: add Hive subscription product types to product_type enum
-- Required before Cardcom recurring can write hive subscription purchases to the
-- purchases table (purchases.product is product_type enum). Until now the code
-- referenced hive_starter_160 / hive_pro_280 / hive_elite_480 as labels but
-- those values were never added to the enum — any attempt to insert would fail.
--
-- The 2026-06 Hive rename collapses three legacy tiers (29/97/197) to two
-- (₪59 basic / ₪149 full). We're adding only the active tier values.

ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'hive_basic_59';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'hive_full_149';
