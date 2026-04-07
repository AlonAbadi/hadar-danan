-- ============================================================
-- Hebrew Marketing OS — Supabase Schema
-- Hadar Danan Ltd.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_status AS ENUM (
  'lead',
  'engaged',
  'high_intent',
  'buyer',
  'booked'
);

CREATE TYPE product_type AS ENUM (
  'challenge_197',
  'workshop_1080',
  'strategy_4000'
);

CREATE TYPE purchase_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'done',
  'failed'
);

CREATE TYPE email_log_status AS ENUM (
  'sent',
  'opened',
  'clicked'
);

CREATE TYPE experiment_status AS ENUM (
  'running',
  'paused',
  'concluded'
);

-- ============================================================
-- USERS
-- Core CRM table. One row per identified contact.
-- ============================================================

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  phone          TEXT,
  name           TEXT,
  status         user_status NOT NULL DEFAULT 'lead',
  segment        TEXT,                        -- e.g. 'freelancer', 'business_owner'
  ab_variant     CHAR(1) CHECK (ab_variant IN ('A', 'B')),
  utm_source     TEXT,
  utm_campaign   TEXT,
  utm_adset      TEXT,
  utm_ad         TEXT,
  click_id       TEXT,                        -- Facebook fbclid / Google gclid
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_status      ON users (status);
CREATE INDEX idx_users_created_at  ON users (created_at DESC);
CREATE INDEX idx_users_ab_variant  ON users (ab_variant);

-- ============================================================
-- IDENTITIES
-- Links anonymous browser sessions to identified users.
-- One anonymous_id can link to at most one user_id (post-merge).
-- ============================================================

CREATE TABLE identities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id  TEXT NOT NULL,               -- stored in cookie / localStorage
  user_id       UUID REFERENCES users (id) ON DELETE SET NULL,
  email         TEXT,
  phone         TEXT,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_identities_anonymous_id ON identities (anonymous_id);
CREATE INDEX        idx_identities_user_id      ON identities (user_id);
CREATE INDEX        idx_identities_email        ON identities (email);

-- ============================================================
-- PURCHASES
-- One row per payment attempt. cardcom_ref is the unique
-- Cardcom transaction reference used for idempotency.
-- ============================================================

CREATE TABLE purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  product      product_type NOT NULL,
  amount       NUMERIC(10, 2) NOT NULL,
  currency     CHAR(3) NOT NULL DEFAULT 'ILS',
  status       purchase_status NOT NULL DEFAULT 'pending',
  cardcom_ref  TEXT UNIQUE,                  -- Cardcom InternalDealNumber
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_user_id    ON purchases (user_id);
CREATE INDEX idx_purchases_status     ON purchases (status);
CREATE INDEX idx_purchases_product    ON purchases (product);
CREATE INDEX idx_purchases_created_at ON purchases (created_at DESC);

-- ============================================================
-- EVENTS
-- Immutable event log. The state machine in /api/events reads
-- this table to decide user status transitions.
-- ============================================================

CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users (id) ON DELETE SET NULL,
  anonymous_id  TEXT,
  type          TEXT NOT NULL,               -- e.g. 'USER_SIGNED_UP', 'VIDEO_50PCT'
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_user_id      ON events (user_id);
CREATE INDEX idx_events_anonymous_id ON events (anonymous_id);
CREATE INDEX idx_events_type         ON events (type);
CREATE INDEX idx_events_created_at   ON events (created_at DESC);
CREATE INDEX idx_events_metadata     ON events USING gin (metadata);

-- ============================================================
-- EXPERIMENTS
-- A/B test registry. One row per named experiment.
-- Counters are incremented atomically via UPDATE … SET x = x + 1.
-- ============================================================

CREATE TABLE experiments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT UNIQUE NOT NULL,
  variant_a_label  TEXT NOT NULL DEFAULT 'Variant A',
  variant_b_label  TEXT NOT NULL DEFAULT 'Variant B',
  visitors_a       INTEGER NOT NULL DEFAULT 0,
  visitors_b       INTEGER NOT NULL DEFAULT 0,
  conversions_a    INTEGER NOT NULL DEFAULT 0,
  conversions_b    INTEGER NOT NULL DEFAULT 0,
  winner           CHAR(1) CHECK (winner IN ('A', 'B')),
  status           experiment_status NOT NULL DEFAULT 'running'
);

-- ============================================================
-- JOBS
-- Outbox / job queue. Processed by GET /api/cron/jobs every 5 min.
-- failed_permanently = true after 3 failed attempts.
-- ============================================================

CREATE TABLE jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL,           -- e.g. 'SEND_EMAIL', 'NOTIFY_ADMIN'
  payload           JSONB NOT NULL DEFAULT '{}',
  run_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            job_status NOT NULL DEFAULT 'pending',
  attempts          SMALLINT NOT NULL DEFAULT 0,
  failed_permanently BOOLEAN NOT NULL DEFAULT FALSE,
  last_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status_run_at ON jobs (status, run_at)
  WHERE status = 'pending' AND failed_permanently = FALSE;
CREATE INDEX idx_jobs_created_at    ON jobs (created_at DESC);

-- ============================================================
-- EMAIL_SEQUENCES
-- Defines automated drip emails triggered by events.
-- delay_hours = hours after trigger_event to send.
-- ============================================================

CREATE TABLE email_sequences (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_event  TEXT NOT NULL,             -- matches events.type
  delay_hours    NUMERIC(6, 2) NOT NULL DEFAULT 0,
  subject        TEXT NOT NULL,
  template_key   TEXT NOT NULL,             -- maps to a template in /lib/email/templates
  active         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_email_sequences_trigger ON email_sequences (trigger_event)
  WHERE active = TRUE;

-- ============================================================
-- EMAIL_LOGS
-- One row per send attempt. Used for open/click tracking and
-- suppression (don't send the same sequence email twice).
-- ============================================================

CREATE TABLE email_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  sequence_id  UUID REFERENCES email_sequences (id) ON DELETE SET NULL,
  status       email_log_status NOT NULL DEFAULT 'sent',
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user_id     ON email_logs (user_id);
CREATE INDEX idx_email_logs_sequence_id ON email_logs (sequence_id);
CREATE UNIQUE INDEX idx_email_logs_no_dupe
  ON email_logs (user_id, sequence_id)
  WHERE status = 'sent';                    -- prevents double-send per sequence step

-- ============================================================
-- ERROR_LOGS
-- Catch-all for server-side errors. Written by try/catch blocks
-- in API routes. Visible in /admin error panel.
-- ============================================================

CREATE TABLE error_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context    TEXT NOT NULL,                 -- e.g. 'api/signup', 'cron/jobs'
  error      TEXT NOT NULL,                 -- error.message or stringified error
  payload    JSONB NOT NULL DEFAULT '{}',   -- request body / extra debug info
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_context    ON error_logs (context);
CREATE INDEX idx_error_logs_created_at ON error_logs (created_at DESC);

-- ============================================================
-- TRIGGER: auto-update identities.last_seen
-- ============================================================

CREATE OR REPLACE FUNCTION update_identity_last_seen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_identities_last_seen
  BEFORE UPDATE ON identities
  FOR EACH ROW EXECUTE FUNCTION update_identity_last_seen();

-- ============================================================
-- TRIGGER: auto-update users.last_seen_at on event insert
-- Keeps the CRM fresh without an extra UPDATE on every event.
-- ============================================================

CREATE OR REPLACE FUNCTION touch_user_last_seen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE users SET last_seen_at = NOW() WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_touch_user
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION touch_user_last_seen();

-- ============================================================
-- ROW LEVEL SECURITY
-- Service-role key (used server-side) bypasses RLS.
-- Anon key (used client-side) is blocked from all tables.
-- ============================================================

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE identities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs      ENABLE ROW LEVEL SECURITY;

-- No anon access — all reads/writes go through server-side service role
-- (Add specific policies here if you add authenticated user flows later)

-- ============================================================
-- SEED DATA — Email sequences
-- ============================================================

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key) VALUES
  ('USER_SIGNED_UP',        0,    'ברוך הבא! הנה האימון החינמי שלך',      'welcome'),
  ('USER_SIGNED_UP',        24,   'ראית את הסרטון? יש לי שאלה בשבילך',    'followup_24h'),
  ('USER_SIGNED_UP',        72,   'שלושה ימים ואתה עדיין כאן — טוב',      'followup_72h'),
  ('PURCHASE_COMPLETED',    0,    'הרכישה התקבלה! הנה הפרטים',            'purchase_confirmation'),
  ('PURCHASE_COMPLETED',    48,   'איך מתקדמים? יש לי בונוס בשבילך',      'post_purchase_48h'),
  ('CHECKOUT_STARTED',      1,    'שכחת משהו בעגלה…',                     'cart_abandon_1h'),
  ('CHECKOUT_STARTED',      24,   'עדיין שמור לך מקום בצ׳אלנג׳',         'cart_abandon_24h');

-- ============================================================
-- SEED DATA — A/B experiment (landing page headline)
-- ============================================================

INSERT INTO experiments (name, variant_a_label, variant_b_label) VALUES
  ('landing_headline', 'שבעה ימים לסרטון הראשון שלך', 'למד לשווק את עצמך תוך שבוע');

-- ============================================================
-- HELPER VIEWS (used by /admin dashboard)
-- ============================================================

CREATE VIEW v_funnel_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'lead')        AS leads,
  COUNT(*) FILTER (WHERE status = 'engaged')     AS engaged,
  COUNT(*) FILTER (WHERE status = 'high_intent') AS high_intent,
  COUNT(*) FILTER (WHERE status = 'buyer')       AS buyers,
  COUNT(*) FILTER (WHERE status = 'booked')      AS booked,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')   AS signups_today,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS signups_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS signups_month
FROM users;

CREATE VIEW v_ab_results AS
SELECT
  name,
  variant_a_label,
  variant_b_label,
  visitors_a,
  visitors_b,
  conversions_a,
  conversions_b,
  CASE WHEN visitors_a > 0
    THEN ROUND((conversions_a::NUMERIC / visitors_a) * 100, 2) END AS cvr_a,
  CASE WHEN visitors_b > 0
    THEN ROUND((conversions_b::NUMERIC / visitors_b) * 100, 2) END AS cvr_b,
  winner,
  status
FROM experiments;

CREATE VIEW v_recent_errors AS
SELECT id, context, error, payload, created_at
FROM error_logs
ORDER BY created_at DESC
LIMIT 50;
