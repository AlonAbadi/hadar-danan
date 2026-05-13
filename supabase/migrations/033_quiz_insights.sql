-- Migration 033: quiz_insights — stores the last AI analysis of quiz results
CREATE TABLE IF NOT EXISTS quiz_insights (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis   JSONB       NOT NULL,
  meta       JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
