#!/usr/bin/env node
/**
 * merge-proposal.mjs
 *
 * P0-3.1 — the last hand-managed step in the corpus-to-engine pipeline.
 *
 * Reads a proposal file at PROPOSALS/YYYY-MM-DD-label.md, finds rows the human
 * marked as approved, appends them as new rows to the matching `## N.` section
 * of HADAR_RAW_QUOTES.md, then auto-runs `npm run sync-corpus` so the engine
 * picks up the additions.
 *
 * APPROVAL SYNTAX (two accepted forms):
 *   1. Checkbox at row start:   | [x] 3 | "quote" | source | type | notes |
 *   2. [APPROVED] anywhere:     | 3 | "quote" | source | type | notes | [APPROVED]
 *
 * The heading above each table row tells us the target move number:
 *   ### Move #9
 *   → row inserted into `## 9.` section of HADAR_RAW_QUOTES.md
 *
 * The "Unclassified (needs manual routing)" heading routes to a special
 * scratch section — the script REFUSES to merge unclassified rows without an
 * explicit --allow-unclassified flag, since routing them wrong pollutes the
 * corpus.
 *
 * NEW-PATTERN CANDIDATES are NOT auto-merged. Adding a new move is a bigger
 * decision than adding a quote (it requires updating HADAR_SIGNATURE_MOVES in
 * shoot-day-engine.ts and adjusting archetype routing). The script prints a
 * summary of new-pattern candidates so the human can act on them separately.
 *
 * USAGE:
 *   node scripts/merge-proposal.mjs PROPOSALS/2026-07-10-batch.md
 *   npm run merge-proposal PROPOSALS/2026-07-10-batch.md
 *   node scripts/merge-proposal.mjs FILE --dry-run
 *
 * FLAGS:
 *   --dry-run              Print what would be merged; make no changes.
 *   --skip-sync            Don't auto-run npm run sync-corpus after.
 *   --allow-unclassified   Allow rows under "Unclassified" heading (dangerous).
 *
 * The proposal file is MOVED to PROPOSALS/PROCESSED/ on success (unless --dry-run).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT   = path.resolve(__dirname, "..");
const CORPUS_ROOT = "/Users/work/hadar-transcripts";
const RAW_QUOTES  = path.join(CORPUS_ROOT, "HADAR_RAW_QUOTES.md");
const PROCESSED   = path.join(CORPUS_ROOT, "PROPOSALS", "PROCESSED");

// ── args ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flags = { dryRun: false, skipSync: false, allowUnclassified: false };
let inputPath = null;
for (const a of argv) {
  if (a === "--dry-run")             flags.dryRun = true;
  else if (a === "--skip-sync")      flags.skipSync = true;
  else if (a === "--allow-unclassified") flags.allowUnclassified = true;
  else if (a === "-h" || a === "--help") { printHelp(); process.exit(0); }
  else if (a.startsWith("--"))       { console.error(`unknown flag: ${a}`); process.exit(1); }
  else if (!inputPath)               inputPath = a;
  else                               { console.error("only one input file allowed"); process.exit(1); }
}

if (!inputPath) { printHelp(); process.exit(1); }

// Resolve relative paths against CORPUS_ROOT so `PROPOSALS/xxx.md` works from
// any CWD.
if (!path.isAbsolute(inputPath)) {
  const guess = path.resolve(process.cwd(), inputPath);
  inputPath = fs.existsSync(guess) ? guess : path.join(CORPUS_ROOT, inputPath);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Proposal file not found: ${inputPath}`);
  process.exit(1);
}

function printHelp() {
  console.log(`
merge-proposal.mjs — apply approved quotes from a proposal to HADAR_RAW_QUOTES.md

Usage:
  node scripts/merge-proposal.mjs PROPOSALS/YYYY-MM-DD-label.md [flags]

Approval:
  Mark rows with [x] at start:   | [x] 3 | "quote" | source | type | notes |
  Or with [APPROVED] anywhere:   | 3 | "quote" | source | type | notes | [APPROVED]

Flags:
  --dry-run              Preview merges; no file changes.
  --skip-sync            Don't auto-run 'npm run sync-corpus' after.
  --allow-unclassified   Allow rows under "Unclassified" heading.
`);
}

// ── parse proposal ───────────────────────────────────────────────────
function parseProposal(md) {
  // Walk line by line. Track the current ### heading. When we hit a table row,
  // check if it's approved. If yes, extract fields and route by heading.
  const lines = md.split("\n");
  const approvals = []; // [{ moveNumber, quote, source, type, notes, lineIdx }]
  const newPatterns = [];
  let currentHeading = null;
  let currentMoveNumber = null;
  let inNewPatternsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track heading state.
    if (/^## /.test(line)) {
      const t = line.slice(3).trim();
      if (/^New pattern candidates/i.test(t)) {
        inNewPatternsSection = true;
        currentHeading = null;
        currentMoveNumber = null;
      } else {
        inNewPatternsSection = false;
        currentHeading = t;
        currentMoveNumber = null;
      }
      continue;
    }
    if (/^### /.test(line)) {
      const t = line.slice(4).trim();
      currentHeading = t;
      const m = t.match(/^Move #(\d+)/);
      currentMoveNumber = m ? parseInt(m[1], 10) : null;

      // Collect new-pattern candidates just to display later.
      if (inNewPatternsSection) {
        newPatterns.push({ heading: t, line: i, description: [] });
      }
      continue;
    }

    // Collect new-pattern description lines.
    if (inNewPatternsSection && newPatterns.length > 0 && !/^#/.test(line) && !/^\|/.test(line)) {
      const last = newPatterns[newPatterns.length - 1];
      if (last) last.description.push(line);
      continue;
    }

    // Only care about markdown-table data rows: `|` … `|`
    if (!/^\s*\|/.test(line)) continue;
    // Skip header + separator rows (contain "---" or literal "Quote"/"Source"/"Approve").
    if (/^\s*\|\s*[-|:\s]+\s*\|\s*$/.test(line)) continue;
    if (/\|\s*Quote\s*\|/.test(line))    continue;
    if (/\|\s*Notes\s*\|/.test(line))    continue;
    if (/\|\s*Approve\s*\|/.test(line))  continue;

    // Split into cells first, then decide format + approval status.
    const rawCells = line.split("|").map((c) => c.trim());
    // The trailing pipe produces an empty last cell; strip both ends.
    while (rawCells.length && rawCells[0] === "")           rawCells.shift();
    while (rawCells.length && rawCells[rawCells.length - 1] === "") rawCells.pop();

    // Two accepted formats:
    //   NEW (deep-read >= 2026-07-10): [approve, #, quote, source, type, notes]
    //   OLD:                            [#, quote, source, type, notes]  (approval via [APPROVED] tag anywhere)
    let cells = rawCells;
    let approved = false;
    if (rawCells.length >= 5 && /^\[[x ]\]$/i.test(rawCells[0])) {
      // New format — first cell is the approval checkbox.
      if (rawCells[0].toLowerCase() === "[x]") approved = true;
      cells = rawCells.slice(1); // strip approval column
    }
    if (!approved && /\[APPROVED\]/i.test(line)) {
      approved = true;
    }
    if (!approved) continue;

    // Strip trailing [APPROVED] tag from the notes cell so it doesn't leak
    // into RAW_QUOTES.
    for (let c = 0; c < cells.length; c++) {
      cells[c] = cells[c].replace(/\[APPROVED\]/gi, "").trim();
    }

    if (cells.length < 4) continue;

    // Expected shape after normalization: [rowIndex, quote, source, type, notes]
    // rowIndex is a numeric ordinal from the proposal; discard.
    let quote  = cells[1] ?? "";
    const source = cells[2] ?? "general";
    const type   = cells[3] ?? "";
    const notes  = cells[4] ?? "";

    // Strip surrounding straight quotes from the quote field.
    quote = quote.replace(/^"|"$/g, "").trim();
    if (!quote) continue;

    approvals.push({
      moveNumber: currentMoveNumber,
      quote,
      source,
      type,
      notes,
      heading:    currentHeading,
      lineIdx:    i,
    });
  }

  return { approvals, newPatterns };
}

// ── inject into RAW_QUOTES ───────────────────────────────────────────
// Section headings can be either legacy `## N.` (moves 9-15) or the bootstrap
// pattern `## Move #N — <name>` (moves 1-8, added 2026-07-10 so the guardrail
// against core-move auto-merge could be lifted). Both patterns are treated
// equivalently for boundary detection and target-matching.
function parseSectionHeading(line) {
  // Same discipline as sync-hadar-corpus.mjs:
  //   `## N.` (legacy) is authoritative for moves 9-15 only. For 1-8 the same
  //   pattern names structural notes (Setup / Reformulation / etc.) — NOT moves.
  //   `## Move #N — ...` is authoritative for moves 1-8 only.
  const legacy = line.match(/^## (\d+)\./);
  if (legacy) {
    const n = parseInt(legacy[1], 10);
    return (n >= 9 && n <= 15) ? n : null;
  }
  const core = line.match(/^## Move #(\d+)\b/);
  if (core) {
    const n = parseInt(core[1], 10);
    return (n >= 1 && n <= 8) ? n : null;
  }
  return null;
}

function insertIntoSection(rawMd, moveNumber, quoteObj) {
  const lines = rawMd.split("\n");
  let sectionStart = -1;
  let sectionEnd   = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const n = parseSectionHeading(lines[i]);
    if (n == null) continue;
    if (sectionStart === -1 && n === moveNumber) {
      sectionStart = i;
    } else if (sectionStart !== -1 && n !== moveNumber) {
      // The NEXT recognized section heading closes our section.
      sectionEnd = i;
      break;
    }
  }
  if (sectionStart === -1) return null;

  // Inside the section, find the LAST table data row so we can append below.
  // If no data rows yet (empty bootstrap section), fall back to the separator
  // row so the first insert appends the first real data row after it.
  let lastTableRowIdx = -1;
  let separatorRowIdx = -1;
  for (let i = sectionStart; i < sectionEnd; i++) {
    const l = lines[i];
    if (!/^\s*\|/.test(l)) continue;
    if (/^\s*\|\s*[-|:\s]+\s*\|\s*$/.test(l)) {
      separatorRowIdx = i;
    } else {
      lastTableRowIdx = i;
    }
  }
  if (lastTableRowIdx === -1) lastTableRowIdx = separatorRowIdx;
  if (lastTableRowIdx === -1) return null; // Section has no table at all.

  // Compute next sub-number by counting existing rows in this section.
  let existingCount = 0;
  for (let i = sectionStart; i < sectionEnd; i++) {
    // A data row starts with `| N.M |` where N === moveNumber.
    const rowMatch = lines[i].match(new RegExp(`^\\|\\s*${moveNumber}\\.(\\d+)\\s*\\|`));
    if (rowMatch) existingCount = Math.max(existingCount, parseInt(rowMatch[1], 10));
  }
  const nextSub = existingCount + 1;

  const cleanQuote = quoteObj.quote.replace(/\|/g, "\\|");
  const cleanType  = quoteObj.type.replace(/\|/g, "\\|");
  const cleanNotes = quoteObj.notes ? ` | ${quoteObj.notes.replace(/\|/g, "\\|")}` : "";
  const rowLine    = `| ${moveNumber}.${nextSub} | "${cleanQuote}" | ${quoteObj.source} | ${cleanType}${cleanNotes} |`;

  // Insert AFTER the last table row.
  const updated = [
    ...lines.slice(0, lastTableRowIdx + 1),
    rowLine,
    ...lines.slice(lastTableRowIdx + 1),
  ].join("\n");

  return updated;
}

// ── main ─────────────────────────────────────────────────────────────
function main() {
  const proposalMd = fs.readFileSync(inputPath, "utf8");
  const { approvals, newPatterns } = parseProposal(proposalMd);

  if (approvals.length === 0) {
    console.log("ℹ️  No approved rows found. Mark rows with [x] at start or [APPROVED] anywhere in the row.");
    if (newPatterns.length > 0) {
      console.log(`\n📋 ${newPatterns.length} new-pattern candidate(s) in this proposal (manual review only — not auto-merged):`);
      for (const p of newPatterns) console.log(`   • ${p.heading}`);
    }
    return;
  }

  const unclassified = approvals.filter((a) => a.moveNumber == null);
  if (unclassified.length > 0 && !flags.allowUnclassified) {
    console.error(`❌ ${unclassified.length} approved row(s) are under "Unclassified" heading — no move number to route to.`);
    console.error(`   Move them under a "### Move #N" heading, or re-run with --allow-unclassified (dangerous).`);
    for (const u of unclassified) console.error(`   line ${u.lineIdx + 1}: "${u.quote.slice(0, 60)}..."`);
    process.exit(1);
  }

  console.log(`✅ Found ${approvals.length} approved row(s) across ${new Set(approvals.map((a) => a.moveNumber)).size} moves.\n`);

  if (flags.dryRun) {
    for (const a of approvals) {
      console.log(`  Move #${a.moveNumber}: "${a.quote.slice(0, 80)}${a.quote.length > 80 ? "…" : ""}" (${a.source})`);
    }
    if (newPatterns.length > 0) {
      console.log(`\n📋 ${newPatterns.length} new-pattern candidate(s) in this proposal (not auto-merged).`);
    }
    console.log(`\n(dry-run) no changes made.`);
    return;
  }

  // Apply merges to RAW_QUOTES.
  let rawMd = fs.readFileSync(RAW_QUOTES, "utf8");
  let applied = 0;
  const failures = [];

  for (const a of approvals) {
    if (a.moveNumber == null) continue;
    const updated = insertIntoSection(rawMd, a.moveNumber, a);
    if (!updated) {
      failures.push(a);
      continue;
    }
    rawMd = updated;
    applied++;
  }

  fs.writeFileSync(RAW_QUOTES, rawMd, "utf8");
  console.log(`✍️  Wrote ${applied} row(s) to ${RAW_QUOTES}.`);
  if (failures.length > 0) {
    console.log(`⚠️  ${failures.length} row(s) could not be routed (target section not found):`);
    for (const f of failures) console.log(`   Move #${f.moveNumber}: "${f.quote.slice(0, 60)}..."`);
  }

  if (newPatterns.length > 0) {
    console.log(`\n📋 ${newPatterns.length} new-pattern candidate(s) in this proposal — NOT auto-merged.`);
    for (const p of newPatterns) console.log(`   • ${p.heading}`);
    console.log(`   Handle these by editing HADAR_RAW_QUOTES.md + shoot-day-engine.ts manually.`);
  }

  // Move proposal to PROCESSED/.
  fs.mkdirSync(PROCESSED, { recursive: true });
  const dest = path.join(PROCESSED, path.basename(inputPath));
  fs.renameSync(inputPath, dest);
  console.log(`\n📁 Moved proposal → ${dest}`);

  // Auto-sync.
  if (!flags.skipSync) {
    console.log(`\n🔁 Running sync-corpus…`);
    const r = spawnSync("node", ["scripts/sync-hadar-corpus.mjs"], {
      cwd:   REPO_ROOT,
      stdio: "inherit",
    });
    if (r.status !== 0) {
      console.error(`❌ sync-corpus failed with exit code ${r.status}`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Done. Review the diff in HADAR_RAW_QUOTES.md and lib/prompts/hadar-corpus-quotes.ts, then commit.`);
}

main();
