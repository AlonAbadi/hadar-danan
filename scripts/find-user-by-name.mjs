/**
 * Tiny lookup script — used once to find Hadar's email so
 * reset-broadcast-episodes.mjs can target her account.
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

const nameQuery = process.argv[2] || "הדר";
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supa
  .from("users")
  .select("id, name, email, hive_status")
  .or(`name.ilike.%${nameQuery}%,email.ilike.%${nameQuery.toLowerCase()}%`)
  .limit(20);
if (error) { console.error(error.message); process.exit(1); }

for (const u of data ?? []) {
  console.log(`${u.email}   ${u.name}   (hive: ${u.hive_status})`);
}
