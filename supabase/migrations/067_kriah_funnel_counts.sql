-- 067_kriah_funnel_counts.sql
-- The /admin/kriah report used to pull raw FUNNEL_STEP rows with .limit(10000),
-- but PostgREST caps result sets at 1000 rows, so every events-derived number
-- (entries, funnel steps, A/B card) was silently truncated (e.g. it showed 185
-- entries when the real 14-day count was ~1,330). Aggregating in Postgres fixes
-- that AND keeps the page light on the NANO compute: one indexed range-scan +
-- hash aggregate, returning a few hundred grouped rows instead of tens of
-- thousands.
--
-- Completion normalisation (baked in here so the report never has to reconstruct
-- it): a completion == the diagnosis was generated. It has no single historical
-- event — kaveret-routed completions redirect away and fire `kaveret_enter`
-- (never s16), the rest fire `s16_full_reading`. From 2026-07-23 a unified
-- `kriah_complete` fires on every path. So: rows before the cutover map their
-- path-signal to 'complete'; from the cutover on, only `kriah_complete` maps to
-- 'complete' (its path-signals stay raw), so each completion is counted once.

-- Partial index so the range-scan over the window is cheap. Safe to run once;
-- build it during a quiet window if the events table is large.
create index if not exists idx_events_funnel_step_created
  on events (created_at)
  where type = 'FUNNEL_STEP';

create or replace function kriah_funnel_counts(p_since timestamptz, p_cutover timestamptz)
returns table (
  step    text,
  exp     text,
  arm     text,
  q_order int,
  il_day  date,
  n       bigint
)
language sql
stable
as $$
  select
    case
      when e.metadata->>'step' = 'kriah_complete' then 'complete'
      when e.metadata->>'step' in ('kaveret_enter', 's16_full_reading')
           and e.created_at < p_cutover then 'complete'
      else e.metadata->>'step'
    end                                                       as step,
    e.metadata->>'exp'                                        as exp,
    e.metadata->>'arm'                                        as arm,
    nullif(e.metadata->>'q_order', '')::int                   as q_order,
    (e.created_at at time zone 'Asia/Jerusalem')::date        as il_day,
    count(*)                                                  as n
  from events e
  where e.type = 'FUNNEL_STEP'
    and e.is_test = false
    and e.created_at >= p_since
    and e.metadata->>'step' is not null
  group by 1, 2, 3, 4, 5
$$;
