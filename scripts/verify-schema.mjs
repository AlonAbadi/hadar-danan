/**
 * Verifies that all expected tables exist in Supabase after running schema.sql.
 * Usage: node scripts/verify-schema.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local manually (Node doesn't auto-load it)
const envFile = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
    .filter(([k, v]) => k && v)
    .map(([k, ...rest]) => [k, rest.join("=")])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EXPECTED_TABLES = [
  "users",
  "identities",
  "purchases",
  "events",
  "experiments",
  "jobs",
  "email_sequences",
  "email_logs",
  "error_logs",
];

const EXPECTED_VIEWS = ["v_funnel_stats", "v_ab_results", "v_recent_errors"];

async function verify() {
  console.log("🔍 Verifying Supabase schema...\n");
  let allOk = true;

  for (const table of EXPECTED_TABLES) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows, which is fine
      console.error(`  ✗ ${table}: ${error.message}`);
      allOk = false;
    } else {
      console.log(`  ✓ ${table}`);
    }
  }

  for (const view of EXPECTED_VIEWS) {
    const { error } = await supabase.from(view).select("*").limit(1);
    if (error) {
      console.error(`  ✗ view ${view}: ${error.message}`);
      allOk = false;
    } else {
      console.log(`  ✓ view ${view}`);
    }
  }

  // Check seed data
  const { data: seqs } = await supabase
    .from("email_sequences")
    .select("id")
    .limit(1);
  if (!seqs?.length) {
    console.warn("\n  ⚠ email_sequences is empty — did you run the full SQL including the INSERT seeds?");
    allOk = false;
  }

  const { data: exp } = await supabase
    .from("experiments")
    .select("id")
    .limit(1);
  if (!exp?.length) {
    console.warn("  ⚠ experiments is empty — did you run the full SQL including the INSERT seeds?");
    allOk = false;
  }

  console.log(allOk ? "\n✅ All tables verified." : "\n❌ Some checks failed — re-run schema.sql.");
  process.exit(allOk ? 0 : 1);
}

verify();
