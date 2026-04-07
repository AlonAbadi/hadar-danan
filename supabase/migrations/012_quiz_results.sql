-- Migration 012: quiz_results table

CREATE TABLE IF NOT EXISTS quiz_results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id         TEXT,
  answers              JSONB NOT NULL DEFAULT '{}',
  scores               JSONB NOT NULL DEFAULT '{}',
  recommended_product  TEXT NOT NULL,
  second_product       TEXT,
  match_percent        INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id            ON quiz_results (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_anonymous_id       ON quiz_results (anonymous_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_recommended_product ON quiz_results (recommended_product);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at         ON quiz_results (created_at DESC);
