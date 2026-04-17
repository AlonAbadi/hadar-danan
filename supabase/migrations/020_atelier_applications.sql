-- beegood atelier - application submissions from /atelier page
-- These are prospective clients requesting a discovery call, NOT paying customers.

create table public.atelier_applications (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  phone               text not null,
  instagram           text not null,
  story               text not null,
  status              text not null default 'new',
  source_utm          jsonb,
  ip_address          text,
  user_agent          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  reviewed_at         timestamptz,
  call_scheduled_at   timestamptz,
  notes               text,
  constraint atelier_status_valid check (
    status in ('new', 'reviewing', 'call_scheduled', 'accepted', 'rejected', 'not_a_fit')
  )
);

create index atelier_applications_status_idx   on public.atelier_applications(status);
create index atelier_applications_created_idx  on public.atelier_applications(created_at desc);

-- No RLS policies - accessed only via service role from API routes
alter table public.atelier_applications enable row level security;
