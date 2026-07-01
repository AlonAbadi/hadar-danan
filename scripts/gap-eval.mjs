#!/usr/bin/env node
/**
 * Gap engine eval harness — runs the LIVE pipeline over real extractions and
 * reports agreement + risk-coverage. Runs where there IS network to the app +
 * Anthropic (locally against a preview deploy, or on a server) — NOT in the
 * sandbox.
 *
 * Prereqs:
 *   - GAP_ENGINE_ENABLED=true on the target deploy
 *   - env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *          APP_URL (e.g. https://preview.beegood.online),
 *          ADMIN_USERNAME, ADMIN_PASSWORD
 *
 * Usage:  node scripts/gap-eval.mjs [limit]
 *
 * What it does:
 *   1. Pull extractions (prioritizing those with customer feedback_rating).
 *   2. POST each to /api/signal/[id]/gap  (computes + persists the gap read).
 *   3. Aggregate: abstain rate, crisis-floor count, emitted-gap count.
 *   4. Cross-tab gap decision vs customer feedback_rating — tests the core
 *      hypothesis: "missed" feedback co-occurs with a detected gap.
 *   5. Risk proxy: among EMITTED gaps, how many landed on a customer who rated
 *      the signal "precise" (a soft over-reach signal to eyeball).
 */
import { createClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_SUPABASE_URL: URL, SUPABASE_SERVICE_ROLE_KEY: KEY,
  APP_URL, ADMIN_USERNAME, ADMIN_PASSWORD,
} = process.env;

if (!URL || !KEY || !APP_URL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL, ADMIN_USERNAME, ADMIN_PASSWORD");
  process.exit(1);
}

const limit = parseInt(process.argv[2] ?? "60", 10);
const db = createClient(URL, KEY);
const authHeader = "Basic " + Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString("base64");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runOne(id) {
  try {
    const res = await fetch(`${APP_URL}/api/signal/${id}/gap`, {
      method: "POST", headers: { Authorization: authHeader, "Content-Type": "application/json" },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const j = await res.json();
    return j.result ?? { error: "no result" };
  } catch (e) {
    return { error: String(e?.message ?? e) };
  }
}

(async () => {
  // Prioritize feedback-labeled rows, then fill.
  const { data: rows, error } = await db
    .from("signal_extractions")
    .select("id, feedback_rating, generated_at")
    .not("answers", "is", null)
    .order("feedback_rating", { ascending: true, nullsFirst: false })
    .order("generated_at", { ascending: false })
    .limit(limit);
  if (error) { console.error(error); process.exit(1); }

  console.log(`Running gap pipeline on ${rows.length} extractions against ${APP_URL} …\n`);

  const out = [];
  for (const r of rows) {
    const g = await runOne(r.id);
    out.push({ id: r.id, fb: r.feedback_rating, ...g });
    process.stdout.write(g.error ? "x" : (g.present === "abstain" ? "." : g.safety === "do_not_name" ? "!" : g.present?.[0] ?? "?"));
    await sleep(400); // be gentle
  }
  console.log("\n");

  const ok = out.filter((o) => !o.error);
  const emitted = ok.filter((o) => o.present === "yes" || o.present === "partial");
  const abstain = ok.filter((o) => o.present === "abstain");
  const noGap   = ok.filter((o) => o.present === "no");
  const crisis  = ok.filter((o) => o.safety === "do_not_name");

  console.log("=== Distribution ===");
  console.log(`total ok: ${ok.length} / ${out.length}  (errors: ${out.length - ok.length})`);
  console.log(`emitted gap: ${emitted.length}  | no-gap: ${noGap.length}  | abstain: ${abstain.length}  | crisis: ${crisis.length}`);
  console.log(`abstention rate: ${(100 * abstain.length / ok.length).toFixed(0)}%\n`);

  console.log("=== Gap decision × customer feedback ===");
  for (const fb of ["precise", "close", "missed"]) {
    const g = ok.filter((o) => o.fb === fb);
    if (!g.length) continue;
    const e = g.filter((o) => o.present === "yes" || o.present === "partial").length;
    const n = g.filter((o) => o.present === "no").length;
    const a = g.filter((o) => o.present === "abstain" || o.safety === "do_not_name").length;
    console.log(`  ${fb.padEnd(8)} (n=${g.length}):  gap=${e}  no-gap=${n}  abstain/crisis=${a}`);
  }
  console.log("\nHypothesis check: 'missed' should skew toward gap; 'precise' toward no-gap.");
  console.log("\nFull reads persisted to signal_extractions.gap_* — review at /admin/signal/gap");
})();
