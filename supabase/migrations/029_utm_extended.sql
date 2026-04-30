-- Add utm_medium, utm_content, utm_term to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS utm_medium  TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term    TEXT;
