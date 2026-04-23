-- Migration 025: Atelier deployment metadata
-- Run in Supabase SQL Editor (hadar-danan project).
-- Adds columns to track preview deployments created by the deployment-agent.

ALTER TABLE atelier_applications
  ADD COLUMN IF NOT EXISTS preview_url       TEXT,
  ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
  ADD COLUMN IF NOT EXISTS github_repo       TEXT,
  ADD COLUMN IF NOT EXISTS deployment_id     TEXT;
