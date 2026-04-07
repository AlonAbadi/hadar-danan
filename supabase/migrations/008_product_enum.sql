-- Migration 008: Add missing product types to product_type enum

ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'course_1800';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'premium_14000';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'test_1';
