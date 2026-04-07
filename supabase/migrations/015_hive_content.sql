-- 015: hive_content table
-- Stores curated content for Hive members, with per-tier access control.

CREATE TABLE IF NOT EXISTS hive_content (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text        NOT NULL,
  body           text,
  tier_required  text        NOT NULL DEFAULT 'starter', -- 'starter' | 'pro' | 'elite'
  content_type   text        NOT NULL DEFAULT 'article', -- 'article' | 'pdf' | 'video'
  url            text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for ordered listing
CREATE INDEX IF NOT EXISTS hive_content_created_at_idx ON hive_content (created_at DESC);
