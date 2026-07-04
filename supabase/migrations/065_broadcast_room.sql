-- Migration 065: Broadcast Room (חדר השידור) — review_items, broadcast_takes, broadcast_edits.
--
-- All FKs reference public.users(id), NEVER auth.users (two-ID rule — see CLAUDE.md).
-- Scripts are NOT rows: a script is (extraction_id, video_number) inside
-- signal_extractions.signal.shoot_day.videos[]. video_number allows 1-12 because
-- legacy cached plans hold up to 12 videos (lib/prompts/shoot-day-engine.ts).

-- 1. review_items — first backing table for the ביקורת פוסטים tab.
--    broadcast_edits.review_item_id FKs here, so it must exist first.
--    v1 flow is mark-only: item is created 'pending' when a reel is approved,
--    and flipped to 'published' by the user from the tab. post_text/review are
--    nullable future-proofing for persisting Claude text reviews (v1.1).
create table if not exists review_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  source       text not null default 'broadcast' check (source in ('broadcast','text')),
  status       text not null default 'pending'   check (status in ('pending','published','dismissed')),
  post_text    text,
  review       jsonb,
  created_at   timestamptz not null default now(),
  published_at timestamptz,
  is_test      boolean not null default false
);

create index if not exists idx_review_items_user_pending
  on review_items (user_id, status) where status = 'pending';

-- 2. broadcast_takes — one row per recorded take. The row is created BEFORE the
--    TUS upload starts (status 'recorded'), so an orphaned row is detectable and
--    no take can exist in storage without a row ("אף טייק לא הולך לאיבוד").
create table if not exists broadcast_takes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  extraction_id    uuid not null references signal_extractions(id) on delete cascade,
  video_number     smallint not null check (video_number between 1 and 12),
  storage_path     text not null,
  duration_seconds real,
  suggested_trim_start_ms integer,
  suggested_trim_end_ms   integer,
  status           text not null default 'recorded'
                     check (status in ('recorded','uploaded','selected','expired')),
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default now() + interval '3 days',
  is_test          boolean not null default false
);

create index if not exists idx_broadcast_takes_user   on broadcast_takes (user_id);
create index if not exists idx_broadcast_takes_script on broadcast_takes (extraction_id, video_number);
create index if not exists idx_broadcast_takes_expiry on broadcast_takes (expires_at)
  where status in ('recorded','uploaded','selected');

-- 3. broadcast_edits — one row per edit pipeline run on a selected take.
--    extraction_id + video_number are denormalized from the take so the
--    3-versions-per-script cap is enforceable with a plain unique index.
create table if not exists broadcast_edits (
  id             uuid primary key default gen_random_uuid(),
  take_id        uuid not null references broadcast_takes(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  extraction_id  uuid not null references signal_extractions(id) on delete cascade,
  video_number   smallint not null check (video_number between 1 and 12),
  version        smallint not null check (version between 1 and 3),
  status         text not null default 'queued'
                   check (status in ('queued','transcribing','awaiting_captions','burning','ready','failed')),
  captions       jsonb,
  trim_start_ms  integer,
  trim_end_ms    integer,
  output_path    text,
  cover_path     text,
  review_item_id uuid references review_items(id) on delete set null,
  error_detail   text,
  downloaded_at  timestamptz,
  processing_started_at timestamptz,
  notify_on_ready boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  is_test        boolean not null default false
);

-- The 3-version cap: failed runs do not consume the budget, and two concurrent
-- "create edit" calls computing the same next version collide here instead of
-- creating a 4th edit.
create unique index if not exists uniq_broadcast_edits_script_version
  on broadcast_edits (extraction_id, video_number, version)
  where status <> 'failed';

create index if not exists idx_broadcast_edits_user on broadcast_edits (user_id);
create index if not exists idx_broadcast_edits_take on broadcast_edits (take_id);

-- 4. Future "10 reels → professional shoot day offer": counting field only.
--    Incremented server-side on the FIRST approve/download of each edit.
alter table users add column if not exists reels_count integer not null default 0;

-- 5. RLS — read-own only. ALL writes go through service-role API routes.
--    The SELECT policy on broadcast_edits is what authorizes Realtime UPDATE
--    events for the status screen ("הבמאית עורכת").
alter table review_items    enable row level security;
alter table broadcast_takes enable row level security;
alter table broadcast_edits enable row level security;

create policy "review_items_read_own" on review_items for select
  using (user_id in (select id from users where auth_id = auth.uid()));
create policy "broadcast_takes_read_own" on broadcast_takes for select
  using (user_id in (select id from users where auth_id = auth.uid()));
create policy "broadcast_edits_read_own" on broadcast_edits for select
  using (user_id in (select id from users where auth_id = auth.uid()));

-- 6. Realtime — first Realtime use in this codebase. broadcast_edits ONLY;
--    do not add more tables to the publication (NANO instance discipline).
alter table broadcast_edits replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'broadcast_edits'
  ) then
    alter publication supabase_realtime add table broadcast_edits;
  end if;
end $$;
