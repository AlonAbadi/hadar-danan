-- Migration 069: broadcast_takes / broadcast_edits — allow Season 2 range
-- (21..26) alongside Season 1 (1..12).
--
-- Alon 2026-07-22: Season 2 · "אני בפעולה" shipped, but customers who
-- filmed an S2 episode hit a check-constraint failure on insert:
--   ERROR: new row for relation "broadcast_takes" violates check
--          constraint "broadcast_takes_video_number_check"
-- The check limited video_number to 1..12 (migration 065).
--
-- Season 2 uses 21..26 to stay orthogonal to Season 1's 1..7 without
-- migrating to a composite (season, video) key. Widen both check
-- constraints to accept the S2 band. Keeps 1..12 valid so no S1 rows
-- break.

alter table broadcast_takes
  drop constraint if exists broadcast_takes_video_number_check;
alter table broadcast_takes
  add constraint broadcast_takes_video_number_check
  check (video_number between 1 and 12 or video_number between 21 and 26);

alter table broadcast_edits
  drop constraint if exists broadcast_edits_video_number_check;
alter table broadcast_edits
  add constraint broadcast_edits_video_number_check
  check (video_number between 1 and 12 or video_number between 21 and 26);
