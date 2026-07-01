-- Migration 054: add the "כוורת האות" (Signal Hive) product type.
--
-- The ₪590 one-time activation product that bridges signal discovery → broadcast.
-- It grants signal-kit (Hive) access. Purchases table stores it as the product
-- enum, so the value must exist before any כוורת-האות purchase can be written.
--
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).

ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'signal_hive_590';
