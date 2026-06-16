/**
 * One-off broadcast: notify all paid Workshop registrants that the venue
 * has moved to משרדי הדר דנן · רחוב החילזון 5, רמת גן (from בית ציוני
 * אמריקה, תל אביב).
 *
 * Audience: every user with a `purchases` row where
 *   product = 'workshop_1080' AND status = 'completed'.
 * De-duplicated by email.
 *
 * Usage:
 *   node scripts/notify-workshop-venue-change.mjs --dry-run   # list recipients, no send
 *   node scripts/notify-workshop-venue-change.mjs              # actually send
 *   node scripts/notify-workshop-venue-change.mjs --limit 1    # send to first match only
 *   node scripts/notify-workshop-venue-change.mjs --only you@example.com  # single-user test
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
 * NEXT_PUBLIC_FROM_EMAIL from .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { readFileSync } from "fs";

// ── Args ──────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const DRY_RUN  = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit"));
const onlyArg  = args.find((a) => a.startsWith("--only"));
const LIMIT    = limitArg ? parseInt(limitArg.split("=")[1] || args[args.indexOf(limitArg) + 1], 10) : null;
const ONLY     = onlyArg  ? (onlyArg.split("=")[1] || args[args.indexOf(onlyArg) + 1])?.toLowerCase() : null;

// ── Env ───────────────────────────────────────────────────────────────
const envFile = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
    .filter(([k, v]) => k && v)
    .map(([k, ...rest]) => [k, rest.join("=")])
);

const SUPABASE_URL   = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY    = env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY     = env.RESEND_API_KEY;
// Hardcoded to the verified Resend domain — .env.local often holds a
// dev-only sender that wouldn't deliver in production.
const FROM_EMAIL     = "noreply@beegood.online";
const FROM_NAME      = "אלון והדר · beegood";
const FROM_HEADER    = `${FROM_NAME} <${FROM_EMAIL}>`;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!DRY_RUN && !RESEND_KEY) {
  console.error("❌ Missing RESEND_API_KEY in .env.local (required unless --dry-run)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const resend   = DRY_RUN ? null : new Resend(RESEND_KEY);

// ── Email render ──────────────────────────────────────────────────────
function buildEmail(firstName) {
  const subject = `${firstName}, מיקום חדש לסדנה שלך`;
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f4f7fb; font-family: 'Assistant', Arial, sans-serif; direction: rtl; text-align: right; color: #1f2937; }
  .wrapper { max-width: 600px; margin: 32px auto; padding: 0 16px 40px; }
  .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  .header { background: #0a0a0f; padding: 28px 32px; color: #fff; }
  .header-logo { font-size: 13px; font-weight: 700; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 14px; text-transform: uppercase; }
  .header h1 { font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3; }
  .header-accent { color: #4ade80; }
  .body { padding: 32px; }
  .body p { font-size: 16px; line-height: 1.75; color: #374151; margin-bottom: 14px; }
  .body strong { color: #111827; }
  .highlight-box { background: #eff6ff; border-right: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin: 18px 0; }
  .highlight-box p { margin: 0 0 6px; color: #1e40af; font-weight: 600; font-size: 15px; }
  .highlight-box p:last-child { margin-bottom: 0; }
  .footer { padding: 18px 32px 28px; font-size: 12px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="header-logo">beegood · סדנה יום אחד</div>
      <h1>מיקום חדש, <span class="header-accent">${firstName}</span></h1>
    </div>
    <div class="body">
      <p>${firstName},</p>
      <p>החלטנו להעביר את הסדנה ב-25 ביוני למקום חדש. רצינו לעדכן אותך באופן אישי.</p>
      <p>הסדנה תתקיים <strong>במשרדים שלנו ברחוב החילזון 5 ברמת גן</strong>, במקום בבית ציוני אמריקה.</p>
      <p>כשהסדנה אצלנו, היא יוצאת אחרת. קבוצה אינטימית יותר, סביבה צמודה, ויותר זמן אישי עם כל משתתפ/ת.</p>
      <div class="highlight-box">
        <p>25 ביוני 2026, יום חמישי</p>
        <p>10:00–15:00</p>
        <p>משרדי הדר דנן, רחוב החילזון 5, רמת גן</p>
      </div>
      <p>התאריך, השעות, התוכן והמחיר זהים. רק המקום זז.</p>
      <p>יש שאלה? כתבו לנו בוואטסאפ ל-053-9566961.</p>
      <p>מחכים לראות אותך.</p>
      <p><strong>אלון והדר</strong></p>
    </div>
    <div class="footer">beegood · הדר דנן בע״מ</div>
  </div>
</div>
</body>
</html>`;
  return { subject, html };
}

// ── Fetch recipients ──────────────────────────────────────────────────
async function fetchRecipients() {
  const { data, error } = await supabase
    .from("purchases")
    .select("user_id, users(email, name)")
    .eq("product", "workshop_1080")
    .eq("status", "completed");
  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  const dedup = new Map(); // email → { email, name }
  for (const row of data ?? []) {
    const u = row.users;
    if (!u?.email) continue;
    const email = u.email.toLowerCase().trim();
    if (!email) continue;
    if (ONLY && email !== ONLY) continue;
    if (!dedup.has(email)) dedup.set(email, { email, name: u.name ?? "" });
  }

  let list = Array.from(dedup.values());
  if (LIMIT && LIMIT > 0) list = list.slice(0, LIMIT);
  return list;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("📧 Workshop venue-change broadcast");
  console.log(`   from: ${FROM_HEADER}`);
  console.log(`   mode: ${DRY_RUN ? "DRY RUN (no emails sent)" : "LIVE"}`);
  if (ONLY)  console.log(`   only: ${ONLY}`);
  if (LIMIT) console.log(`   limit: ${LIMIT}`);
  console.log("");

  const recipients = await fetchRecipients();
  if (recipients.length === 0) {
    console.log("⚠️  No recipients found. Done.");
    return;
  }

  console.log(`👥 ${recipients.length} recipient(s):`);
  for (const r of recipients) console.log(`   · ${r.email}   (${r.name || "—"})`);
  console.log("");

  if (DRY_RUN) {
    console.log("✋ Dry run — no emails sent. Drop --dry-run to send for real.");
    return;
  }

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const firstName = (r.name || "").split(" ")[0] || "שלום";
    const { subject, html } = buildEmail(firstName);
    try {
      const result = await resend.emails.send({
        from:    FROM_HEADER,
        to:      r.email,
        subject,
        html,
      });
      if (result.error) {
        console.log(`   ✗ ${r.email}   ${result.error.message ?? result.error}`);
        failed++;
      } else {
        console.log(`   ✓ ${r.email}   id=${result.data?.id ?? "?"}`);
        sent++;
      }
    } catch (e) {
      console.log(`   ✗ ${r.email}   ${e?.message ?? e}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 250)); // be polite
  }

  console.log("");
  console.log(`📊 Sent ${sent}, failed ${failed}, total ${recipients.length}.`);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
