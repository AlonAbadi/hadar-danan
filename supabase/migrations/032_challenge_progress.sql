-- Challenge enrollment + completion tracking.
-- Replaces time-based day unlock with completion-based unlock.

-- One row per user. Created automatically on first content page visit
-- (or immediately after Cardcom webhook fires CHALLENGE_PURCHASED).
CREATE TABLE IF NOT EXISTS challenge_enrollments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_day      INTEGER     NOT NULL DEFAULT 0,
  completed_at     TIMESTAMPTZ,                          -- set when day 7 is completed
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- One row per (enrollment, day) when user marks a day complete.
-- UNIQUE constraint prevents double-counting.
CREATE TABLE IF NOT EXISTS challenge_day_completions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID        NOT NULL REFERENCES challenge_enrollments(id) ON DELETE CASCADE,
  day_number    INTEGER     NOT NULL CHECK (day_number >= 0 AND day_number <= 8),
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, day_number)
);

-- WhatsApp send log for the daily challenge messages.
-- Separate from whatsapp_logs (which tracks cart-abandon) because
-- dedup key here is (enrollment, day), not (user, template).
CREATE TABLE IF NOT EXISTS challenge_whatsapp_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID        NOT NULL REFERENCES challenge_enrollments(id) ON DELETE CASCADE,
  day_number    INTEGER     NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT        NOT NULL DEFAULT 'sent',  -- sent | failed | skipped
  UNIQUE (enrollment_id, day_number)                  -- one send per (enrollment, day)
);

-- Global settings — single row, updated via admin UI.
CREATE TABLE IF NOT EXISTS challenge_settings (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  next_live_meeting_date TIMESTAMPTZ,
  live_meeting_zoom_url  TEXT,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO challenge_settings DEFAULT VALUES ON CONFLICT DO NOTHING;
