/**
 * Resets the landing_headline experiment counters to zero so the new
 * pain-vs-gain test starts clean. Run once after deploy.
 * Usage: node scripts/reset-landing-headline-ab.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile.split("\n").filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
    .filter(([k, v]) => k && v)
    .map(([k, ...rest]) => [k, rest.join("=")])
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: before } = await supabase
  .from("experiments").select("*").eq("name", "landing_headline").maybeSingle();
console.log("Before:", before);

const { error } = await supabase
  .from("experiments")
  .update({
    visitors_a:      0,
    visitors_b:      0,
    conversions_a:   0,
    conversions_b:   0,
    variant_a_label: "תפסיקו לנחש",
    variant_b_label: "בהירות משנה הכל",
    winner:          null,
    status:          "running",
  })
  .eq("name", "landing_headline");
if (error) { console.error("❌", error.message); process.exit(1); }

const { data: after } = await supabase
  .from("experiments").select("*").eq("name", "landing_headline").maybeSingle();
console.log("After:", after);
console.log("✓ Counters reset");
