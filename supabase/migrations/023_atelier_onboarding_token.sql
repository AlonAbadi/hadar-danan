-- Add email + onboarding token so clients can fill in their own details
alter table public.atelier_applications
  add column if not exists email                 text,
  add column if not exists onboarding_token      text unique,
  add column if not exists onboarding_sent_at    timestamptz,
  add column if not exists onboarding_submitted_at timestamptz;

create index if not exists atelier_onboarding_token_idx
  on public.atelier_applications(onboarding_token)
  where onboarding_token is not null;
