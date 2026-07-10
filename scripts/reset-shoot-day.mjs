#!/usr/bin/env node
/**
 * reset-shoot-day.mjs <email>
 *
 * Clears the cached shoot_day plan + phase1 for a user, so the next
 * /kaveret visit re-runs the engine from scratch. Use after deploying an
 * engine-prompt change and wanting a specific customer to see the new output
 * without waiting for organic churn.
 *
 * Data cleared (kept minimal — just the shoot-day slices, everything else
 * survives): signal.shoot_day, signal.shoot_day_phase1, signal.shoot_day_v1..v7,
 * signal.shoot_day_generated_at.
 *
 * Content kit + signal fields are NOT touched — they're stable inputs, not
 * outputs of the engine-prompt version we just changed.
 *
 * Usage: node scripts/reset-shoot-day.mjs alonabadi9@gmail.com
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
if (!email) { console.error("Usage: node scripts/reset-shoot-day.mjs <email>"); process.exit(1); }

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Locate the user.
const { data: user, error: userErr } = await supa
  .from("users")
  .select("id, name, email")
  .eq("email", email.toLowerCase())
  .maybeSingle();
if (userErr || !user) { console.error(`No user for ${email}: ${userErr?.message ?? "not found"}`); process.exit(1); }
console.log(`👤 ${user.name ?? "(no name)"} · ${user.email} · ${user.id}`);

// 2. Get their signal_extractions rows.
const { data: exts } = await supa
  .from("signal_extractions")
  .select("id, signal, created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
if (!exts?.length) { console.error("No signal_extractions for this user."); process.exit(1); }
console.log(`📊 ${exts.length} extraction(s) found.`);

// 3. Strip shoot-day fields from each row's signal JSON.
const SHOOT_KEYS = [
  "shoot_day", "shoot_day_phase1", "shoot_day_generated_at",
  "shoot_day_v1", "shoot_day_v2", "shoot_day_v3", "shoot_day_v4",
  "shoot_day_v5", "shoot_day_v6", "shoot_day_v7",
  "shoot_day_strategy", "shoot_day_gifts", "shoot_day_director",
];

for (const ext of exts) {
  const before = { ...(ext.signal ?? {}) };
  const hadKeys = SHOOT_KEYS.filter((k) => k in before);
  if (hadKeys.length === 0) {
    console.log(`   ${ext.id} (${ext.created_at}) — already empty, skipping`);
    continue;
  }
  const next = { ...before };
  for (const k of SHOOT_KEYS) delete next[k];

  const { error: upErr } = await supa
    .from("signal_extractions")
    .update({ signal: next })
    .eq("id", ext.id);
  if (upErr) { console.error(`   ${ext.id} update failed: ${upErr.message}`); continue; }
  console.log(`   ✅ ${ext.id} cleared ${hadKeys.length} field(s): ${hadKeys.join(", ")}`);
}

console.log(`\n🎬 Done. Next visit to /kaveret will regenerate the shoot day using the current engine.`);
