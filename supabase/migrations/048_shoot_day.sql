-- Migration 048: Shoot Day Plans
-- Adds the "shoot_day" feature to /hive/signal-kit — Hadar's Mode E
-- (Strategic Architect) output. A 7-chapter shoot day plan per the
-- michael-kadosh canonical blueprint:
--   identity_statement + 4 pillars + 12 videos + visual_direction +
--   schedule + 3 decisions + 5 gift_sentences.
--
-- Cached on signal_extractions.signal.shoot_day (JSONB), same pattern as
-- signal.content_kit. First call hits 4 parallel Claude prompts (~30-40s,
-- ~$0.20). Cached subsequent calls return instantly for free.
--
-- No new table needed — JSONB extension only.

-- Validate the JSONB shape. Loose validation only — strict validation
-- lives in lib/prompts/shoot-day-engine.ts (validateShootDayPlan).
alter table signal_extractions
  add constraint signal_extractions_shoot_day_shape
  check (
    signal->'shoot_day' is null
    or (
      jsonb_typeof(signal->'shoot_day') = 'object'
      and (signal->'shoot_day') ? 'identity_statement'
      and (signal->'shoot_day') ? 'pillars'
      and (signal->'shoot_day') ? 'videos'
    )
  );

-- Index for fast cache lookups (does the row already have a shoot_day?)
create index if not exists idx_signal_extractions_has_shoot_day
  on signal_extractions ((signal ? 'shoot_day'))
  where signal ? 'shoot_day';

comment on column signal_extractions.signal is
  'JSONB envelope: 7-field signal output + optional content_kit + optional shoot_day. Each section cached after first generation.';
