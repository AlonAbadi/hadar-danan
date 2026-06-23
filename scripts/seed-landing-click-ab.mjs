/**
 * Seeds the landing_headline_click secondary experiment row.
 * Same variants as landing_headline, but conversion = CTA click (leading
 * indicator) instead of full signal extraction. Idempotent.
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

// Manual upsert — no unique constraint on `name`, so check first.
const { data: existing } = await supabase
  .from("experiments").select("id").eq("name", "landing_headline_click").maybeSingle();

if (existing) {
  const { error } = await supabase
    .from("experiments")
    .update({
      variant_a_label: "תפסיקו לנחש",
      variant_b_label: "בהירות משנה הכל",
      visitors_a:      0,
      visitors_b:      0,
      conversions_a:   0,
      conversions_b:   0,
      winner:          null,
      status:          "running",
    })
    .eq("id", existing.id);
  if (error) { console.error("❌", error.message); process.exit(1); }
} else {
  const { error } = await supabase.from("experiments").insert({
    name:            "landing_headline_click",
    variant_a_label: "תפסיקו לנחש",
    variant_b_label: "בהירות משנה הכל",
    visitors_a:      0,
    visitors_b:      0,
    conversions_a:   0,
    conversions_b:   0,
    winner:          null,
    status:          "running",
  });
  if (error) { console.error("❌", error.message); process.exit(1); }
}

const { data: after } = await supabase
  .from("experiments").select("*").eq("name", "landing_headline_click").maybeSingle();
console.log("✓ landing_headline_click ready:", after);
