-- Migration 018: Add invoice tracking to purchases
-- Stores Cardcom invoice number returned after payment for receipt/accounting purposes.

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS invoice_number TEXT;
