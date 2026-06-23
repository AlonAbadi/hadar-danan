/**
 * Inserts the 50%-off strategy meeting coupon. Idempotent.
 * Usage: node scripts/insert-strategy-coupon.mjs
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

const { error } = await supabase
  .from("coupons")
  .upsert(
    {
      code:             "PGISHA50",
      product:          "strategy_4000",
      discount_percent: 50,
      max_uses:         null,
      expires_at:       null,
      active:           true,
      notes:            "Strategy meeting 50% off — community list",
    },
    { onConflict: "code" }
  );
if (error) { console.error("❌", error.message); process.exit(1); }
console.log("✓ Coupon PGISHA50 ready (strategy_4000, 50% off)");
console.log("  Link: https://www.beegood.online/strategy?code=PGISHA50");
