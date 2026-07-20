/**
 * Legacy-list reactivation sender (see LEGACY_LIST_ACTIVATION_PLAN.md).
 *
 * Contacts live OUTSIDE the CRM: source CSV + wave ledger on disk
 * (~/Documents/legacy-crm-list/), server-side signals (bounce / complaint /
 * click / unsubscribe) in the `events` table via /api/legacy/webhook.
 *
 * Commands:
 *   node scripts/legacy-send.mjs --status                    dashboard + gates
 *   node scripts/legacy-send.mjs --test <email>              send all 3 emails for review
 *   node scripts/legacy-send.mjs --send --size 500 [--dry]   next wave of email 1
 *   node scripts/legacy-send.mjs --followup 2|3 [--dry]      email 2/3 to eligible clickers
 *   node scripts/legacy-send.mjs --sync                      pull events + poll Resend, update ledger
 *
 * Gates (checked in --status/--sync, enforced before --send):
 *   bounce rate > 8%  → STOP
 *   complaint rate > 0.1% → STOP
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createHmac } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(process.env.HOME, "Documents", "legacy-crm-list");
const STATE_PATH = path.join(DATA_DIR, "state.json");
const CSV_PATH = path.join(DATA_DIR, "legacy-fresh.csv");

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const SBH = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
const RESEND_H = { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" };
const FROM = "הדר דנן <hadar@news.beegood.online>";
const SITE = "https://www.beegood.online";
const GATE_BOUNCE = 0.08, GATE_COMPLAINT = 0.001;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };

// ── ledger ──
function loadState() {
  if (!existsSync(STATE_PATH)) return { contacts: {}, waves: [] };
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}
function saveState(s) { writeFileSync(STATE_PATH, JSON.stringify(s)); }

function loadCsv() {
  const lines = readFileSync(CSV_PATH, "utf8").split("\n").slice(1);
  const out = [];
  for (const line of lines) {
    const m = line.match(/^"(.*)",(\d*),(.+)$/);
    if (!m) continue;
    out.push({ name: m[1], phone: m[2], email: m[3].trim().toLowerCase() });
  }
  return out;
}

async function sbInsertEvent(type, metadata) {
  await fetch(`${SB}/rest/v1/events`, {
    method: "POST",
    headers: { ...SBH, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ type, metadata }),
  });
}

async function sbAll(p) {
  const rows = [];
  for (let off = 0; ; off += 1000) {
    const res = await fetch(`${SB}/rest/v1/${p}`, { headers: { ...SBH, Range: `${off}-${off + 999}` } });
    if (!res.ok) throw new Error(`${p}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

// ── suppression + signals from the server ──
async function fetchSignals() {
  const types = ["LEGACY_UNSUBSCRIBED", "LEGACY_EMAIL_BOUNCED", "LEGACY_EMAIL_COMPLAINED", "LEGACY_EMAIL_CLICKED"];
  const rows = await sbAll(`events?select=type,metadata&type=in.(${types.join(",")})`);
  const sig = { unsubscribed: new Set(), bounced: new Set(), complained: new Set(), clicked: new Set() };
  for (const r of rows) {
    const email = r.metadata?.email?.toLowerCase();
    if (!email) continue;
    if (r.type === "LEGACY_UNSUBSCRIBED") sig.unsubscribed.add(email);
    if (r.type === "LEGACY_EMAIL_BOUNCED") sig.bounced.add(email);
    if (r.type === "LEGACY_EMAIL_COMPLAINED") sig.complained.add(email);
    if (r.type === "LEGACY_EMAIL_CLICKED") sig.clicked.add(email);
  }
  // converted = created a users row via the legacy links
  const legacyUsers = await sbAll("users?select=email&utm_source=eq.legacy");
  sig.converted = new Set(legacyUsers.map((u) => u.email.toLowerCase()));
  // anyone already in the CRM at all (signed up independently since the export)
  const allUsers = await sbAll("users?select=email");
  sig.inCrm = new Set(allUsers.map((u) => u.email.toLowerCase()));
  return sig;
}

function applySignals(state, sig) {
  for (const [email, c] of Object.entries(state.contacts)) {
    c.unsubscribed = sig.unsubscribed.has(email) || c.unsubscribed || false;
    c.bounced = sig.bounced.has(email) || c.bounced || false;
    c.complained = sig.complained.has(email) || c.complained || false;
    c.clicked = sig.clicked.has(email) || c.clicked || false;
    c.converted = sig.converted.has(email) || c.converted || false;
  }
}

function stats(state) {
  const cs = Object.values(state.contacts);
  const sent1 = cs.filter((c) => c.sent1_at);
  return {
    sent1: sent1.length,
    sent2: cs.filter((c) => c.sent2_at).length,
    sent3: cs.filter((c) => c.sent3_at).length,
    bounced: sent1.filter((c) => c.bounced).length,
    complained: sent1.filter((c) => c.complained).length,
    clicked: sent1.filter((c) => c.clicked).length,
    unsubscribed: sent1.filter((c) => c.unsubscribed).length,
    converted: sent1.filter((c) => c.converted).length,
  };
}

function gates(st) {
  if (!st.sent1) return { ok: true, lines: ["no sends yet"] };
  const bounceRate = st.bounced / st.sent1;
  const complaintRate = st.complained / st.sent1;
  const lines = [
    `bounce:    ${st.bounced}/${st.sent1} = ${(bounceRate * 100).toFixed(2)}%  (gate ${GATE_BOUNCE * 100}%)  ${bounceRate > GATE_BOUNCE ? "❌ STOP" : "✓"}`,
    `complaint: ${st.complained}/${st.sent1} = ${(complaintRate * 100).toFixed(3)}%  (gate ${GATE_COMPLAINT * 100}%)  ${complaintRate > GATE_COMPLAINT ? "❌ STOP" : "✓"}`,
  ];
  return { ok: bounceRate <= GATE_BOUNCE && complaintRate <= GATE_COMPLAINT, lines };
}

// ── rendering ──
function loadTemplate(n) {
  const raw = readFileSync(path.join(ROOT, "scripts", "legacy-emails", `email${n}.html`), "utf8");
  const subject = raw.match(/<!--\s*subject:\s*(.+?)\s*-->/)?.[1];
  if (!subject) throw new Error(`email${n}.html missing subject comment`);
  return { subject, html: raw.replace(/<!--[\s\S]*?-->\n?/, "") };
}

const unsubToken = (email) =>
  createHmac("sha256", env.CRON_SECRET).update(email.toLowerCase()).digest("hex").slice(0, 32);

function renderEmail(tpl, contact, emailNum, wave) {
  const firstName = (contact.name ?? "").trim().split(/\s+/)[0];
  const unsub = `${SITE}/api/legacy/unsubscribe?e=${encodeURIComponent(contact.email)}&t=${unsubToken(contact.email)}`;
  // first-party click tracker: records the exact contact, then 302s to /signal with the UTM chain
  const e64 = Buffer.from(contact.email.toLowerCase()).toString("base64url");
  const signal = `${SITE}/api/legacy/c?e=${e64}&t=${unsubToken(contact.email)}&w=${wave}&n=${emailNum}`;
  const html = tpl.html
    .replaceAll("{{name}}", firstName || "שלום")
    .replaceAll("{{signal_url}}", signal)
    .replaceAll("{{unsub_url}}", unsub);
  return {
    from: FROM,
    to: [contact.email],
    subject: tpl.subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

async function sendBatch(payloads, dry) {
  if (dry) return payloads.map(() => ({ id: "dry-run" }));
  const out = [];
  for (let i = 0; i < payloads.length; i += 100) {
    const chunk = payloads.slice(i, i + 100);
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST", headers: RESEND_H, body: JSON.stringify(chunk),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`batch send failed: ${res.status} ${JSON.stringify(body)}`);
    out.push(...body.data);
    await new Promise((r) => setTimeout(r, 600)); // stay well under 10 rps
  }
  return out;
}

// ── commands ──
async function cmdStatus() {
  const state = loadState();
  applySignals(state, await fetchSignals());
  saveState(state);
  const st = stats(state);
  const total = loadCsv().length;
  console.log(`\n═ legacy reactivation status ═`);
  console.log(`list size:      ${total}`);
  console.log(`email1 sent:    ${st.sent1}   email2: ${st.sent2}   email3: ${st.sent3}`);
  console.log(`clicked:        ${st.clicked}  (${st.sent1 ? ((st.clicked / st.sent1) * 100).toFixed(1) : 0}%)`);
  console.log(`converted:      ${st.converted}  (created a user via utm_source=legacy)`);
  console.log(`unsubscribed:   ${st.unsubscribed}`);
  console.log(`\ngates:`);
  for (const l of gates(st).lines) console.log(`  ${l}`);
  for (const w of state.waves) console.log(`wave ${w.n}: ${w.size} sent at ${w.at}`);
}

async function cmdTest(to) {
  for (const n of [1, 2, 3]) {
    const tpl = loadTemplate(n);
    const payload = renderEmail(tpl, { email: to, name: "אלון אבאדי" }, n, 0);
    payload.to = [to];
    payload.subject = `[טיוטה ${n}/3] ${payload.subject}`;
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: RESEND_H, body: JSON.stringify(payload) });
    console.log(`email${n} → ${to}:`, res.status, JSON.stringify(await res.json()).slice(0, 80));
    await new Promise((r) => setTimeout(r, 400));
  }
}

async function cmdSend(size, dry) {
  const state = loadState();
  const sig = await fetchSignals();
  applySignals(state, sig);
  const st = stats(state);
  const g = gates(st);
  if (!g.ok) { console.log("GATES FAILED — not sending:"); g.lines.forEach((l) => console.log(" ", l)); process.exit(1); }

  const eligible = loadCsv().filter((c) =>
    !state.contacts[c.email]?.sent1_at &&
    !sig.inCrm.has(c.email) &&
    !sig.unsubscribed.has(c.email) && !sig.bounced.has(c.email) && !sig.complained.has(c.email)
  ).slice(0, size);
  if (!eligible.length) { console.log("no eligible contacts left"); return; }

  const wave = (state.waves.at(-1)?.n ?? 0) + 1;
  const tpl = loadTemplate(1);
  console.log(`wave ${wave}: sending email1 to ${eligible.length} contacts${dry ? " (DRY RUN)" : ""}`);
  const results = await sendBatch(eligible.map((c) => renderEmail(tpl, c, 1, wave)), dry);
  if (!dry) {
    const now = new Date().toISOString();
    eligible.forEach((c, i) => {
      state.contacts[c.email] = { ...(state.contacts[c.email] ?? {}), name: c.name, wave, sent1_at: now, sent1_id: results[i]?.id };
    });
    state.waves.push({ n: wave, size: eligible.length, at: now });
    saveState(state);
    // surface the wave in /admin/legacy (server has no access to the local ledger)
    await sbInsertEvent("LEGACY_WAVE_SENT", { wave, size: eligible.length, email: `wave-${wave}`, at: now });
  }
  console.log(dry ? "dry run complete, nothing sent" : `sent ${results.length}. Run --sync in ~1h, then --status before the next wave.`);
}

async function cmdFollowup(n, dry) {
  const state = loadState();
  const sig = await fetchSignals();
  applySignals(state, sig);
  const DAYS = n === 2 ? 4 : 7;
  const prevField = n === 2 ? "sent1_at" : "sent2_at";
  const sentField = `sent${n}_at`;
  const cutoff = Date.now() - DAYS * 864e5;
  const eligible = Object.entries(state.contacts).filter(([email, c]) =>
    c.clicked && !c.converted && !c.unsubscribed && !c.bounced && !c.complained &&
    c[prevField] && new Date(c[prevField]).getTime() < cutoff && !c[sentField] &&
    !sig.converted.has(email)
  );
  if (!eligible.length) { console.log(`no contacts eligible for email${n} yet`); return; }
  const tpl = loadTemplate(n);
  console.log(`sending email${n} to ${eligible.length} clicked-but-not-converted contacts${dry ? " (DRY RUN)" : ""}`);
  const results = await sendBatch(eligible.map(([email, c]) => renderEmail(tpl, { email, name: c.name }, n, c.wave ?? 0)), dry);
  if (!dry) {
    const now = new Date().toISOString();
    eligible.forEach(([email], i) => { state.contacts[email][sentField] = now; state.contacts[email][`sent${n}_id`] = results[i]?.id; });
    saveState(state);
  }
  console.log(dry ? "dry run complete" : `sent ${results.length}`);
}

async function cmdSync() {
  const state = loadState();
  applySignals(state, await fetchSignals());
  // poll Resend for recent wave sends missing a terminal state (webhook backup)
  const pending = Object.entries(state.contacts)
    .filter(([, c]) => c.sent1_id && !c.bounced && !c.delivered)
    .slice(0, 2000);
  console.log(`polling resend for ${pending.length} messages...`);
  let i = 0;
  for (const [email, c] of pending) {
    const res = await fetch(`https://api.resend.com/emails/${c.sent1_id}`, { headers: RESEND_H });
    if (res.ok) {
      const d = await res.json();
      if (d.last_event === "bounced") c.bounced = true;
      if (d.last_event === "complained") c.complained = true;
      if (d.last_event === "clicked") c.clicked = true;
      if (["delivered", "opened", "clicked"].includes(d.last_event)) c.delivered = true;
    }
    if (++i % 100 === 0) console.log(`  ${i}/${pending.length}`);
    await new Promise((r) => setTimeout(r, 120));
  }
  saveState(state);
  const st = stats(state);
  // authoritative ledger snapshot for /admin/legacy (webhook data is best-effort)
  await sbInsertEvent("LEGACY_SYNC_SNAPSHOT", { ...st, email: "snapshot", at: new Date().toISOString() });
  console.log("sync done.");
  for (const l of gates(st).lines) console.log(" ", l);
}

// ── entry ──
if (flag("status")) await cmdStatus();
else if (flag("test")) await cmdTest(opt("test"));
else if (flag("send")) await cmdSend(Number(opt("size", "500")), flag("dry"));
else if (flag("followup")) await cmdFollowup(Number(opt("followup")), flag("dry"));
else if (flag("sync")) await cmdSync();
else console.log("usage: --status | --test <email> | --send --size N [--dry] | --followup 2|3 [--dry] | --sync");
