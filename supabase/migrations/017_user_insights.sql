-- Migration 017: user_insights table for TrueSignal diagnosis caching
-- Stores AI-generated diagnosis results so the admin user page loads them instantly
-- without re-calling the Claude API on every visit.

create table if not exists user_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  model_used text not null,

  synthesis text not null,
  product_matches jsonb not null,
  suggested_whatsapp text not null,

  raw_response jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_user_insights_user_id on user_insights(user_id);
create index if not exists idx_user_insights_generated_at on user_insights(generated_at desc);

comment on table user_insights is 'TrueSignal AI diagnosis results cached for admin user pages. Avoids re-calling Claude API on every visit.';
