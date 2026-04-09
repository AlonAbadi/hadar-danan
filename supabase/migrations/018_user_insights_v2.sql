-- Migration 018: user_insights v2 - add rich behavioral analysis columns
-- 017 created the table with v1 schema (synthesis, product_matches, suggested_whatsapp).
-- This migration adds the new v2 columns. Nullable so existing cached rows are unaffected.

alter table user_insights
  add column if not exists call_recommendation jsonb,
  add column if not exists strongest_signal    jsonb,
  add column if not exists readiness           jsonb,
  add column if not exists flags               jsonb,
  add column if not exists action_plan         jsonb;

comment on column user_insights.call_recommendation is '{ decision, reason, urgency } - primary signal for sales team';
comment on column user_insights.strongest_signal    is '{ headline, evidence } - single most important behavioral signal';
comment on column user_insights.readiness           is '{ score, label, explanation } - 0-100 purchase readiness score';
comment on column user_insights.flags               is 'array of { severity, title, detail } - alerts for sales team';
comment on column user_insights.action_plan         is 'array of { step, timing, title, description, branches? } - next steps';
