/**
 * One-time attribution backfill (2026-07-18).
 *
 * Problem: 562/777 registered users (72%) have utm_source = null because two
 * signup paths never wrote UTM to the users row (signal/extract and the
 * Supabase Auth link-user path). Forward capture is fixed in code; this
 * script recovers what the DB already knows for EXISTING rows.
 *
 * Priority per user (first hit wins), fills ONLY null utm_source rows:
 *   1. signal_extractions.source_utm   (earliest extraction with attribution)
 *   2. purchases.utm_source            (earliest completed purchase with utm)
 *   3. users.click_id present          → utm_source=fb, utm_medium=click-id-backfill
 *   4. earliest external PAGE_VIEW referrer → classified domain,
 *                                        utm_medium=referrer-backfill
 * Plus: decodes percent-encoded values in EXISTING utm_source/campaign
 * (Hebrew campaign names stored as "%D7%90...").
 *
 * Safety: never overwrites a real value; writes a restore log with the
 * before-state of every touched row to scripts/_attribution-backfill-log.json
 * BEFORE applying. Run modes:
 *   node scripts/backfill-attribution.mjs          → dry run (prints plan)
 *   node scripts/backfill-attribution.mjs --apply  → applies
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);
const BASE = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const APPLY = process.argv.includes("--apply");

async function all(p) {
  const rows = [];
  for (let off = 0; ; off += 1000) {
    const res = await fetch(`${BASE}/rest/v1/${p}`, { headers: { ...H, Range: `${off}-${off + 999}` } });
    if (!res.ok) throw new Error(`${p}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const dec = (v) => { if (typeof v !== "string") return v; try { return decodeURIComponent(v); } catch { return v; } };
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_adset", "utm_ad"];

const REFERRER_SOURCE = [
  [/instagram\.com$/, "instagram"],
  [/facebook\.com$/, "fb"],
  [/linktr\.ee$/, "linktree"],
  [/whatsapp/, "whatsapp"],
  [/^google\.[a-z.]+$/, "google"],
  [/com\.google\.android\.gm$/, "email"],   // Gmail app referrer = arrived from an email link
  [/tiktok/, "tiktok"],
  [/youtube|youtu\.be/, "youtube"],
];

// ── load everything ──
const users = await all("users?select=id,email,utm_source,utm_medium,utm_campaign,utm_content,utm_term,utm_adset,utm_ad,click_id");
const extractions = await all("signal_extractions?select=user_id,source_utm,created_at&source_utm=not.is.null&order=created_at.asc");
const purchases = await all("purchases?select=user_id,utm_source,utm_medium,utm_campaign,utm_adset,utm_ad,created_at&status=eq.completed&utm_source=not.is.null&order=created_at.asc");
const events = await all("events?select=user_id,metadata&user_id=not.is.null&type=eq.PAGE_VIEW&order=created_at.asc");

const signalUtm = new Map();
for (const e of extractions) {
  if (signalUtm.has(e.user_id)) continue;
  const s = e.source_utm ?? {};
  if (s.utm_source || s.fbclid || s.gclid) signalUtm.set(e.user_id, s);
}
const purchaseUtm = new Map();
for (const p of purchases) if (!purchaseUtm.has(p.user_id)) purchaseUtm.set(p.user_id, p);
const refByUser = new Map();
for (const e of events) {
  if (refByUser.has(e.user_id)) continue;
  const r = e.metadata?.referrer;
  if (typeof r !== "string" || !r) continue;
  try {
    const host = new URL(r).hostname.replace(/^www\./, "").replace(/^l\./, "").replace(/^lm\./, "");
    if (/beegood\.online|vercel\.app|localhost|cardcom|accounts\.google/.test(host)) continue;
    refByUser.set(e.user_id, host);
  } catch { /* skip */ }
}

// ── build the plan ──
const plan = [];   // { user_id, email, method, before, patch }
const counts = { decode_existing: 0, signal: 0, purchase: 0, click_id: 0, referrer: 0, untouched: 0 };

for (const u of users) {
  const before = Object.fromEntries(["click_id", ...UTM_KEYS].map((k) => [k, u[k] ?? null]));

  if (u.utm_source) {
    // Existing attribution — only fix percent-encoding
    const patch = {};
    for (const k of UTM_KEYS) {
      const d = dec(u[k]);
      if (d !== u[k]) patch[k] = d;
    }
    if (Object.keys(patch).length) {
      counts.decode_existing++;
      plan.push({ user_id: u.id, email: u.email, method: "decode", before, patch });
    } else counts.untouched++;
    continue;
  }

  const sig = signalUtm.get(u.id);
  if (sig) {
    const patch = {};
    for (const k of UTM_KEYS) if (sig[k]) patch[k] = dec(String(sig[k]).slice(0, 200));
    if (!u.click_id && (sig.fbclid || sig.gclid)) patch.click_id = String(sig.fbclid || sig.gclid).slice(0, 200);
    if (!patch.utm_source && patch.click_id) { patch.utm_source = "fb"; patch.utm_medium = "click-id-backfill"; }
    if (patch.utm_source) {
      counts.signal++;
      plan.push({ user_id: u.id, email: u.email, method: "signal_source_utm", before, patch });
      continue;
    }
  }

  const pur = purchaseUtm.get(u.id);
  if (pur?.utm_source) {
    const patch = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_adset", "utm_ad"]) if (pur[k]) patch[k] = dec(pur[k]);
    counts.purchase++;
    plan.push({ user_id: u.id, email: u.email, method: "purchase_utm", before, patch });
    continue;
  }

  if (u.click_id) {
    counts.click_id++;
    plan.push({ user_id: u.id, email: u.email, method: "click_id", before, patch: { utm_source: "fb", utm_medium: "click-id-backfill" } });
    continue;
  }

  const ref = refByUser.get(u.id);
  if (ref) {
    const match = REFERRER_SOURCE.find(([re]) => re.test(ref));
    const source = match ? match[1] : ref;
    counts.referrer++;
    plan.push({ user_id: u.id, email: u.email, method: "referrer", before, patch: { utm_source: source, utm_medium: "referrer-backfill" } });
    continue;
  }

  counts.untouched++;
}

console.log("plan:", JSON.stringify(counts, null, 2));
console.log("total patches:", plan.length);
const dist = {};
for (const p of plan) if (p.patch.utm_source) dist[p.patch.utm_source] = (dist[p.patch.utm_source] ?? 0) + 1;
console.log("resulting utm_source distribution of patches:",
  Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 15));

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to execute.");
  process.exit(0);
}

// ── restore log FIRST, then apply ──
const logPath = path.join(ROOT, "scripts", `_attribution-backfill-log-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(logPath, JSON.stringify(plan, null, 1));
console.log("restore log written:", logPath);

let ok = 0, fail = 0;
for (let i = 0; i < plan.length; i += 20) {
  await Promise.all(plan.slice(i, i + 20).map(async (p) => {
    const res = await fetch(`${BASE}/rest/v1/users?id=eq.${p.user_id}`, {
      method: "PATCH", headers: H, body: JSON.stringify(p.patch),
    });
    if (res.ok) ok++; else { fail++; console.error("FAIL", p.user_id, res.status, await res.text()); }
  }));
  if (i % 200 === 0) console.log(`applied ${Math.min(i + 20, plan.length)}/${plan.length}`);
}
console.log(`done: ${ok} updated, ${fail} failed`);
