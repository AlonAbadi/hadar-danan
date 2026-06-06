-- Migration 042: stage_applications - "3 ימי פתוחים" application flow.
--
-- Free public application for the upcoming on-stage / open-days series.
-- The questions are deliberately open-ended and demand effort - the score is
-- a SIGNAL of will and commitment (depth + specificity + commitment language),
-- not a judgement of business quality. Computed server-side in lib/stageScore.ts.
--
-- This is distinct from atelier_applications (influencer program): it has no
-- payment flow, no user account requirement, and is a one-off lead capture.

create table if not exists public.stage_applications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null,
  email           text,
  phone           text,
  answers         jsonb not null,
  score           int  not null default 0,
  score_breakdown jsonb,
  status          text not null default 'new',
  source_utm      jsonb,
  ip_address      text,
  user_agent      text,
  notes           text,
  reviewed_at     timestamptz,
  constraint stage_status_valid check (
    status in ('new','reviewing','shortlisted','accepted','rejected')
  )
);

create index if not exists stage_applications_score_idx
  on public.stage_applications (score desc);
create index if not exists stage_applications_status_idx
  on public.stage_applications (status);
create index if not exists stage_applications_created_idx
  on public.stage_applications (created_at desc);

-- Service role bypasses RLS; these policies are defensive in case the table
-- is ever accessed with the anon/authenticated key.
alter table public.stage_applications enable row level security;

create policy "public can insert stage applications"
  on public.stage_applications for insert
  to anon, authenticated with check (true);

create policy "authenticated can read stage applications"
  on public.stage_applications for select
  to authenticated using (true);

create policy "authenticated can update stage applications"
  on public.stage_applications for update
  to authenticated using (true);
