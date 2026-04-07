-- Migration 013: CRM features

-- 1. Notes table - הערות על לקוחות
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- 2. Reminders table - תזכורות ומשימות
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to TEXT NOT NULL,
  task TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminders_due_at ON reminders(due_at);
CREATE INDEX idx_reminders_completed ON reminders(completed_at) WHERE completed_at IS NULL;

-- 3. Add last activity tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- 4. Update last_activity_at from existing events
UPDATE users SET last_activity_at = (
  SELECT MAX(created_at) FROM events WHERE events.user_id = users.id
);
