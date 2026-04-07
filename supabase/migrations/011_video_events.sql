-- Migration 011: video_events table
-- Safe IF NOT EXISTS - table may already exist from migration 009.
-- Column names match the existing API route (api/video-event/route.ts).

CREATE TABLE IF NOT EXISTS video_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id         TEXT NOT NULL,
  user_email       TEXT,
  anon_id          TEXT,
  event_type       TEXT NOT NULL,
  percent_watched  INTEGER DEFAULT 0,
  drop_off_second  REAL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_events_video_id   ON video_events (video_id);
CREATE INDEX IF NOT EXISTS idx_video_events_anon_id    ON video_events (anon_id);
CREATE INDEX IF NOT EXISTS idx_video_events_event_type ON video_events (event_type);
CREATE INDEX IF NOT EXISTS idx_video_events_created_at ON video_events (created_at DESC);
