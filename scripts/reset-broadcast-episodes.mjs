#!/usr/bin/env node
/**
 * reset-broadcast-episodes.mjs <email>
 *
 * Wipes broadcast state for one user — used when Alon or Hadar want to
 * re-run the full shoot-day → film → publish flow from zero against a
 * newer engine.
 *
 * Deletes (SERVICE ROLE — bypasses RLS):
 *   - broadcast_edits          (all rows, any status, is_test true or false)
 *   - broadcast_takes          (all rows)
 *   - review_items             (all rows for this user's edits)
 *
 * Also clears the shoot_day cache slots (same set the /kaveret reset
 * script covers) so the next visit regenerates the plan too.
 *
 * Files on storage (broadcast-takes bucket) are LEFT ALONE — the daily
 * cleanup cron handles those on its own schedule. Removing them here
 * would need service-role bucket delete which we can't guarantee is
 * enabled everywhere.
 *
 * Usage: node scripts/reset-broadcast-episodes.mjs hadar@…
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath   = path.resolve(__dirname, "..", ".env.local");
const env       = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/reset-broadcast-episodes.mjs <email>");
  process.exit(1);
}

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Find the user.
const { data: user, error: uerr } = await supa
  .from("users")
  .select("id, name, email")
  .eq("email", email.toLowerCase())
  .maybeSingle();
if (uerr || !user) {
  console.error(`No user for ${email}: ${uerr?.message ?? "not found"}`);
  process.exit(1);
}
console.log(`👤 ${user.name ?? "(no name)"} · ${user.email} · ${user.id}`);

// 2. Gather edit ids so we can also delete their review_items.
const { data: edits } = await supa
  .from("broadcast_edits")
  .select("id, video_number, status, is_test")
  .eq("user_id", user.id);
console.log(`🎬 ${edits?.length ?? 0} broadcast_edits to delete`);

if (edits?.length) {
  const editIds = edits.map((e) => e.id);
  // Delete review_items first (FK on edit_id)
  const { count: riCount, error: riErr } = await supa
    .from("review_items")
    .delete({ count: "exact" })
    .in("edit_id", editIds);
  if (riErr) console.error(`  review_items delete failed: ${riErr.message}`);
  else console.log(`  ✅ review_items deleted (${riCount ?? 0})`);

  // Then edits
  const { count: edCount, error: edErr } = await supa
    .from("broadcast_edits")
    .delete({ count: "exact" })
    .in("id", editIds);
  if (edErr) console.error(`  broadcast_edits delete failed: ${edErr.message}`);
  else console.log(`  ✅ broadcast_edits deleted (${edCount ?? 0})`);
}

// 3. Takes (independent of edits — a rejected take can hang around without
//    an edit). Cascade wouldn't help here since edits are already gone.
const { count: takeCount, error: tkErr } = await supa
  .from("broadcast_takes")
  .delete({ count: "exact" })
  .eq("user_id", user.id);
if (tkErr) console.error(`  broadcast_takes delete failed: ${tkErr.message}`);
else console.log(`📼 broadcast_takes deleted (${takeCount ?? 0})`);

// 4. Clear shoot_day slots so the plan re-generates against the current
//    engine on next /kaveret visit.
const { data: exts } = await supa
  .from("signal_extractions")
  .select("id, signal")
  .eq("user_id", user.id);
const SHOOT_KEYS = [
  "shoot_day", "shoot_day_phase1", "shoot_day_generated_at",
  "shoot_day_v1", "shoot_day_v2", "shoot_day_v3", "shoot_day_v4",
  "shoot_day_v5", "shoot_day_v6", "shoot_day_v7",
  "shoot_day_strategy", "shoot_day_gifts", "shoot_day_director",
];
let clearedExts = 0;
for (const ext of exts ?? []) {
  const before = { ...(ext.signal ?? {}) };
  const hadKeys = SHOOT_KEYS.filter((k) => k in before);
  if (!hadKeys.length) continue;
  const next = { ...before };
  for (const k of SHOOT_KEYS) delete next[k];
  const { error } = await supa
    .from("signal_extractions")
    .update({ signal: next })
    .eq("id", ext.id);
  if (error) { console.error(`  ext ${ext.id} update failed: ${error.message}`); continue; }
  clearedExts++;
  console.log(`  ✅ ext ${ext.id} cleared ${hadKeys.length} shoot-day field(s)`);
}
console.log(`📊 shoot_day cache cleared on ${clearedExts} extraction(s)`);

// 5. Users.reels_count counter (for future 10-reel-shoot-day offer).
const { error: rcErr } = await supa
  .from("users")
  .update({ reels_count: 0 })
  .eq("id", user.id);
if (rcErr) console.error(`  reels_count reset failed: ${rcErr.message}`);
else console.log(`🎯 users.reels_count reset to 0`);

console.log(`\n🎬 Done. ${user.name}'s next /kaveret visit is a clean slate.`);
