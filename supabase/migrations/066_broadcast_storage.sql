-- Migration 066: 'broadcast-takes' private bucket + storage RLS for TUS uploads.
--
-- Path convention: '{auth_uid}/takes/{take_id}.{ext}' — storage RLS can only
-- check auth.uid(), so the FIRST path segment is the auth UUID, while the
-- broadcast_takes row carries public.users.id (the two-ID rule).
-- Outputs and covers ('{auth_uid}/outputs/…', '{auth_uid}/covers/…') are
-- written server-side with the service role, which bypasses these policies.
-- Cleanup is a Vercel cron route (/api/cron/broadcast-cleanup), NOT pg_cron —
-- deleting storage objects requires the Storage API, not SQL.
--
-- NOTE: the PROJECT-LEVEL upload size limit must also be raised in the
-- Supabase dashboard (Settings → Storage) — it caps every bucket from above.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'broadcast-takes', 'broadcast-takes', false,
  629145600,  -- 600MB headroom; a 3-minute iPhone take at ~5Mbps is ~110-130MB
  array['video/mp4','video/webm','video/quicktime','image/png','image/jpeg']
)
on conflict (id) do nothing;

-- TUS resumable upload as the authenticated user needs INSERT + SELECT
-- (+ UPDATE to resume/finalize parts) on the user's own path prefix.
create policy "broadcast_takes_upload_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'broadcast-takes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "broadcast_takes_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'broadcast-takes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "broadcast_takes_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'broadcast-takes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'broadcast-takes' and (storage.foldername(name))[1] = auth.uid()::text);
-- Deliberately NO delete policy: deletion is service-role-only (cleanup cron).
