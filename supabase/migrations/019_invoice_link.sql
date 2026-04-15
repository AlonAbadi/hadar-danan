-- Migration 019: Add invoice_link to purchases
-- Stores the direct PDF URL returned by Cardcom in the webhook verification response.

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS invoice_link TEXT;
