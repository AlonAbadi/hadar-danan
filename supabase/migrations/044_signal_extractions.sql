-- Migration 044: signal_extractions table for the Signal Engine (מנוע האות)
-- Powers the user-facing Hive onboarding diagnostic at /signal.
-- Captures 5 extraction answers + 7-field signal output per the TrueSignal© method.
-- Separate from user_insights (which is the admin-facing diagnosis cache) — different
-- prompt, different consumer, different lifecycle.

create table if not exists signal_extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,

  -- 5 extraction answers (Hebrew, free text). Order matches the questionnaire flow:
  -- 1. flow_zone — when you lose track of time
  -- 2. natural_talent — what's easy for you that's hard for others
  -- 3. hard_period — a difficult chapter and what it taught you
  -- 4. what_helped — what got you out, what you developed
  -- 5. message_to_past — what you'd say to someone where you were
  answers jsonb not null,

  -- 7-field signal output from Claude (the prompt enforces this shape):
  -- pain_source, element, signal, central_tool, people, content_directions[3], warm_note
  signal jsonb not null,

  model_used text not null,
  raw_response jsonb,

  generated_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists idx_signal_extractions_user_id on signal_extractions(user_id);
create index if not exists idx_signal_extractions_generated_at on signal_extractions(generated_at desc);

comment on table signal_extractions is 'User-facing Signal Engine (מנוע האות) results. Powers /signal diagnostic for Hive onboarding.';
