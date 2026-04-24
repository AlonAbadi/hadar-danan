-- Migration 027: Orchestration state machine
-- Run in Supabase SQL Editor (hadar-danan project).
--
-- NOTE: `status` already exists as a lead-funnel column ('new','reviewing','accepted'…).
-- This migration adds `pipeline_status` — a separate column that tracks the
-- site-CREATION pipeline driven by the ProjectManagerAgent.

ALTER TABLE atelier_applications
  ADD COLUMN IF NOT EXISTS pipeline_status      TEXT    NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS generated_client_ts  TEXT,
  ADD COLUMN IF NOT EXISTS error_detail         TEXT,
  ADD COLUMN IF NOT EXISTS orchestration_log    JSONB   NOT NULL DEFAULT '[]'::jsonb;

-- Index for filtering by pipeline phase
CREATE INDEX IF NOT EXISTS idx_atelier_pipeline_status ON atelier_applications(pipeline_status);

-- Backfill existing rows based on what data they have:
UPDATE atelier_applications SET pipeline_status = 'deployed'
  WHERE preview_url IS NOT NULL AND pipeline_status = 'pending';

UPDATE atelier_applications SET pipeline_status = 'awaiting_approval'
  WHERE generated_content IS NOT NULL AND preview_url IS NULL AND pipeline_status = 'pending';

UPDATE atelier_applications SET pipeline_status = 'onboarding_complete'
  WHERE onboarding_submitted_at IS NOT NULL AND generated_content IS NULL AND pipeline_status = 'pending';

UPDATE atelier_applications SET pipeline_status = 'onboarding_sent'
  WHERE onboarding_token IS NOT NULL AND onboarding_submitted_at IS NULL AND pipeline_status = 'pending';

-- pipeline_status values:
--   pending              → not yet started
--   analyzing            → LeadAnalystAgent running
--   onboarding_sent      → token email sent, waiting for client
--   onboarding_complete  → client submitted their form
--   generating           → ContentGeneratorAgent running
--   awaiting_palette     → palettes ready, admin must choose
--   generating_code      → ClientCodeAgent running
--   awaiting_approval    → client.ts ready, admin must approve
--   deploying            → DeployAgent running
--   deployed             → preview URL live
--   live                 → production domain connected
--   error                → something failed, see error_detail
