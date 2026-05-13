-- Migration 031: add sadna_500 to product_type enum
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'sadna_500';
