#!/usr/bin/env node
/**
 * set-lifetime-caps.mjs
 *
 * Writes signal.season_cap_override = 999 on every extraction owned by
 * the users listed below. Ships them into the "lifetime" tier: unlimited
 * filming per season, no 7-episode wall.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs.readFileSync(path.resolve(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);

const EMAILS = [
  "alonabadi9@gmail.com",
  "hadard1113@gmail.com",
  "yonatansheflan@gmail.com",
];

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

for (const email of EMAILS) {
  const { data: user } = await supa.from("users").select("id, name").eq("email", email).maybeSingle();
  if (!user) { console.log(`❌ ${email}: no user`); continue; }
  const { data: exts } = await supa.from("signal_extractions").select("id, signal").eq("user_id", user.id);
  if (!exts?.length) { console.log(`⚠️  ${email}: no extractions`); continue; }
  for (const ext of exts) {
    const next = { ...(ext.signal ?? {}), season_cap_override: 999 };
    const { error } = await supa.from("signal_extractions").update({ signal: next }).eq("id", ext.id);
    console.log(`${error ? "❌" : "✅"} ${user.name ?? email} · ${ext.id}${error ? ` : ${error.message}` : ""}`);
  }
}
