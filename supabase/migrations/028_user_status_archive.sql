-- Add archive statuses to user_status enum
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'handled';
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'not_relevant';
