-- Migration 009: Video analytics tracking

CREATE TABLE IF NOT EXISTS video_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  anon_id TEXT,
  video_id TEXT NOT NULL,          -- vimeo video id e.g. '1178865564'
  event_type TEXT NOT NULL,        -- 'watch_progress' | 'drop_off' | 'completed'
  percent_watched INTEGER,         -- 0–100
  drop_off_second INTEGER,         -- second at which user stopped (for drop_off)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_events_video_id ON video_events(video_id);
CREATE INDEX IF NOT EXISTS idx_video_events_event_type ON video_events(event_type);
