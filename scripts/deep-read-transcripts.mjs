#!/usr/bin/env node
/**
 * deep-read-transcripts.mjs
 *
 * P0-3 from ENGINE_IMPROVEMENT_ROADMAP.md — the automation step.
 *
 * FLOW:
 *   1. Glob a set of transcripts under /Users/work/hadar-transcripts/
 *   2. For each (skipping tiny stubs), call Claude Sonnet with a structured
 *      "find NEW patterns" prompt.
 *   3. Aggregate findings and write a review-ready proposal .md at
 *      /Users/work/hadar-transcripts/PROPOSALS/<date>-<label>.md
 *   4. A human (Alon) reviews the .md, cherry-picks quotes to add to
 *      HADAR_RAW_QUOTES.md, then runs `npm run sync-corpus` to propagate
 *      to the engine.
 *
 * USAGE:
 *   node scripts/deep-read-transcripts.mjs --glob "C4[89]*.txt" [--limit 10]
 *   node scripts/deep-read-transcripts.mjs --glob "C4356*.txt"      # single file test
 *   node scripts/deep-read-transcripts.mjs --list-only               # dry run
 *
 * FLAGS:
 *   --glob PATTERN   File pattern under hadar-transcripts/ (required)
 *   --limit N        Max transcripts to process (default 10)
 *   --label TEXT     Slug appended to output filename (default "batch")
 *   --min-size N     Skip transcripts under N bytes (default 1500 — no stubs)
 *   --list-only      Print matched files and exit; don't call Claude
 *   --dry-run        Same as --list-only
 *
 * OUTPUT:
 *   /Users/work/hadar-transcripts/PROPOSALS/YYYY-MM-DD-<label>.md
 *   Formatted so approved quotes can be pasted into HADAR_RAW_QUOTES.md
 *   sections without further editing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT   = path.resolve(__dirname, "..");
const CORPUS_ROOT = "/Users/work/hadar-transcripts";
const PROPOSALS   = path.join(CORPUS_ROOT, "PROPOSALS");
const RAW_QUOTES  = path.join(CORPUS_ROOT, "HADAR_RAW_QUOTES.md");

// Load env for ANTHROPIC_API_KEY.
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(REPO_ROOT, ".env.local"));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY missing");
  process.exit(1);
}

// ── args ─────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { glob: null, limit: 10, label: "batch", minSize: 1500, listOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--glob")          out.glob     = argv[++i];
    else if (a === "--limit")    out.limit    = parseInt(argv[++i], 10);
    else if (a === "--label")    out.label    = argv[++i];
    else if (a === "--min-size") out.minSize  = parseInt(argv[++i], 10);
    else if (a === "--list-only" || a === "--dry-run") out.listOnly = true;
    else if (a === "-h" || a === "--help") { printHelp(); process.exit(0); }
    else { console.error(`unknown arg: ${a}`); printHelp(); process.exit(1); }
  }
  if (!out.glob) { console.error("❌ --glob is required"); printHelp(); process.exit(1); }
  return out;
}

function printHelp() {
  console.log(`
deep-read-transcripts.mjs — automated pattern harvest

Usage:
  node scripts/deep-read-transcripts.mjs --glob PATTERN [flags]

Flags:
  --glob PATTERN     File pattern under hadar-transcripts/ (required)
  --limit N          Max transcripts to process (default 10)
  --label TEXT       Slug in output filename (default "batch")
  --min-size N       Skip transcripts under N bytes (default 1500)
  --list-only        Print matched files and exit
`);
}

// ── discovery ────────────────────────────────────────────────────────
async function discover() {
  const matches = [];
  const iter = glob(args.glob, { cwd: CORPUS_ROOT });
  for await (const rel of iter) {
    const full = path.join(CORPUS_ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const size = fs.statSync(full).size;
    if (size < args.minSize) continue;
    matches.push({ path: full, name: rel, size });
  }
  matches.sort((a, b) => b.size - a.size);
  return matches.slice(0, args.limit);
}

// ── prompt ────────────────────────────────────────────────────────────
// The "reference bank" is a compressed summary of what the engine already
// knows, so the model prioritizes finding NEW material instead of
// re-surfacing old finds.
const KNOWN_QUOTES = `
מנטרות קנוניות (אל תציע שוב):
- "הכול חייב לנגן" (C4367)
- "הריח הוא האיש מחירות הכי שקט שיש" (C4377)
- "אין בחירה, אין תנועה. אין תנועה, אין שיווק. אין שיווק, אין מכירות. אין מכירות, אין עסק." (C4078)
- "רשת מנורות שמכבות אחת-אחת" (C4336, Mirvi DNA)

מהלכים המנוע כבר מכיר (1-15):
1. External→Internal Translation
2. Service Reframe ("זה לא X, זה Y")
3. "אני אקביל לך" Parable Building
4. Tangible Metaphor Anchor
5. Sold-Inversion ("מכרו לנו ש...")
6. Self-as-example
7. Projective Embodiment (הוראות גוף לסמכות קוגניטיבית)
8. Anti-flattery
9. Sensory-to-Business Translation (מותג חושי)
10. Process-as-Proof (יד-עבודה)
11. Receptive Embodiment (מותג חושי — הפוך מ-7)
12. Specificity-as-Service (טיפולי-עמוק)
13. Silent Authority Positioning (B2B ידע אסימטרי)
14. Category-Rename / Reclaim
15. Diagnostic-Framework Reveal (3 פרמטרים)
`.trim();

function buildPrompt(transcriptName, transcriptText) {
  return `אתה חוקר קורפוס לצורך שיפור מנוע Shoot Day של הדר דנן.

מטרה: קרא את התמלול המצורף וזהה **תבניות חדשות** (ציטוטים verbatim, מהלכים לא מוכרים, מנטרות אפשריות) שיכולות להעשיר את מנוע ההפקה.

${KNOWN_QUOTES}

תמלול (${transcriptName}):
---
${transcriptText}
---

החזר JSON תקין בלבד, בלי markdown fences:

{
  "verbatim_quotes": [
    {
      "quote": "ציטוט verbatim בעברית, ללא סימני מרכאות בתוך המחרוזת",
      "move_number": 9,                    // int 1-15, או null אם לא מתאים לאף מהלך
      "type": "hook | body | reframe | mantra | direction | anti-category | canonical",
      "notes": "1 משפט מדוע הציטוט הזה שווה בקורפוס"
    }
  ],
  "new_pattern_candidate": null,           // או: {"name": "...", "description": "...", "supporting_quotes": ["...", "..."]}
  "contradiction": null,                   // או: "תיאור בעברית של סתירה למה שהמנוע מכיר"
  "metadata": {
    "mode_guess": "A" | "B" | "C" | "D",   // A=story, B=Reels default, C=framework, D=self-performance
    "archetype_guess": "cognitive" | "sensory" | "therapy" | "handcraft" | "B2B" | "unknown",
    "client_or_context_hint": "1-2 מילים"
  }
}

חוקים נוקשים:
- אין להציע ציטוטים שכבר מופיעים ברשימת המנטרות הקנוניות.
- verbatim only — אם הדר לא אמרה את זה בדיוק ככה, לא לכלול.
- אם ציטוט מתאים למהלך קיים (1-15) — סמן move_number.
- אם הציטוט מגלה **דפוס חדש** שאף אחד מ-15 המהלכים לא מתאר — הכנס אותו לשדה new_pattern_candidate.
- אם אין ממצא בעל ערך: החזר verbatim_quotes כרשימה ריקה. עדיף שלא להציע מאשר להציע חלש.
- אורך תגובה: כ-200-800 מילים.`;
}

// ── run per transcript ────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function analyzeOne(entry) {
  const text = fs.readFileSync(entry.path, "utf8");
  const prompt = buildPrompt(entry.name, text);
  const res = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 2000,
    messages:   [{ role: "user", content: prompt }],
  });
  const raw = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { verbatim_quotes: [], _parse_error: raw.slice(0, 500) };
  }
}

// ── output rendering ─────────────────────────────────────────────────
function todayIso() {
  // Deterministic date via env (tests) or now.
  return process.env.DEEP_READ_DATE || new Date().toISOString().slice(0, 10);
}

function renderProposal(findings) {
  const date = todayIso();
  const lines = [];
  lines.push(`# Deep-Read Proposals — ${date}`);
  lines.push("");
  lines.push(`Generated by \`scripts/deep-read-transcripts.mjs\`. Glob: \`${args.glob}\`. Analyzed ${findings.length} transcripts.`);
  lines.push("");
  lines.push("## Review flow");
  lines.push("");
  lines.push("1. Read each proposed quote below.");
  lines.push("2. To approve a row, flip `[ ]` at the start of the row to `[x]`. Rows without `[x]` are skipped on merge.");
  lines.push("3. Run: `npm run merge-proposal PROPOSALS/" + `${date}-${args.label}.md` + "` — script inserts approved rows into `HADAR_RAW_QUOTES.md`, auto-runs sync-corpus, moves this file to `PROCESSED/`.");
  lines.push("4. For new-pattern candidates: NOT auto-merged. To promote one, edit `HADAR_RAW_QUOTES.md` (new `## N.` section) AND `lib/prompts/shoot-day-engine.ts` (register the move + archetype routing).");
  lines.push("");

  // Aggregate stats.
  const totalQuotes = findings.reduce((s, f) => s + (f.result.verbatim_quotes?.length ?? 0), 0);
  const newPatterns = findings.filter((f) => f.result.new_pattern_candidate).length;
  const contradictions = findings.filter((f) => f.result.contradiction).length;
  const errors = findings.filter((f) => f.result._parse_error || f._error).length;

  lines.push(`## Summary`);
  lines.push("");
  lines.push(`- **Total quote candidates**: ${totalQuotes}`);
  lines.push(`- **New pattern candidates**: ${newPatterns}`);
  lines.push(`- **Contradictions flagged**: ${contradictions}`);
  if (errors > 0) lines.push(`- **Parse errors**: ${errors} (see raw output at bottom)`);
  lines.push("");

  // Aggregate quotes by move number for easier merging.
  const byMove = new Map();
  for (const f of findings) {
    const source = f.entry.name.replace(/\.txt$/, "");
    for (const q of (f.result.verbatim_quotes ?? [])) {
      const key = q.move_number ?? "unclassified";
      if (!byMove.has(key)) byMove.set(key, []);
      byMove.get(key).push({ ...q, source });
    }
  }

  if (byMove.size > 0) {
    lines.push(`## Quote candidates by move`);
    lines.push("");
    const sortedKeys = Array.from(byMove.keys()).sort((a, b) => {
      if (a === "unclassified") return 1;
      if (b === "unclassified") return -1;
      return Number(a) - Number(b);
    });
    for (const k of sortedKeys) {
      const moveLabel = k === "unclassified" ? "Unclassified (needs manual routing)" : `Move #${k}`;
      lines.push(`### ${moveLabel}`);
      lines.push("");
      lines.push("| Approve | # | Quote | Source | Type | Notes |");
      lines.push("|---|---|---|---|---|---|");
      for (const [i, q] of byMove.get(k).entries()) {
        const quote = String(q.quote ?? "").replace(/\|/g, "\\|").trim();
        const type  = String(q.type ?? "").replace(/\|/g, "\\|");
        const notes = String(q.notes ?? "").replace(/\|/g, "\\|");
        lines.push(`| [ ] | ${i + 1} | "${quote}" | ${q.source} | ${type} | ${notes} |`);
      }
      lines.push("");
    }
  }

  // New pattern candidates.
  const patternFindings = findings.filter((f) => f.result.new_pattern_candidate);
  if (patternFindings.length > 0) {
    lines.push(`## New pattern candidates`);
    lines.push("");
    for (const f of patternFindings) {
      const p = f.result.new_pattern_candidate;
      lines.push(`### From \`${f.entry.name}\` — ${p.name || "unnamed pattern"}`);
      lines.push("");
      lines.push(p.description ?? "");
      lines.push("");
      if (p.supporting_quotes?.length) {
        lines.push("Supporting quotes:");
        for (const sq of p.supporting_quotes) {
          lines.push(`- "${String(sq).replace(/[\r\n]+/g, " ")}"`);
        }
        lines.push("");
      }
    }
  }

  // Contradictions.
  const contradictionFindings = findings.filter((f) => f.result.contradiction);
  if (contradictionFindings.length > 0) {
    lines.push(`## Contradictions flagged`);
    lines.push("");
    for (const f of contradictionFindings) {
      lines.push(`- \`${f.entry.name}\`: ${f.result.contradiction}`);
    }
    lines.push("");
  }

  // Metadata table.
  lines.push(`## Transcript metadata`);
  lines.push("");
  lines.push("| Transcript | Size | Mode | Archetype | Context |");
  lines.push("|---|---|---|---|---|");
  for (const f of findings) {
    const m = f.result.metadata ?? {};
    lines.push(`| ${f.entry.name} | ${(f.entry.size / 1024).toFixed(1)}KB | ${m.mode_guess ?? "?"} | ${m.archetype_guess ?? "?"} | ${m.client_or_context_hint ?? ""} |`);
  }
  lines.push("");

  // Parse errors (debug).
  const errorFindings = findings.filter((f) => f.result._parse_error || f._error);
  if (errorFindings.length > 0) {
    lines.push(`## Parse errors (debug)`);
    lines.push("");
    for (const f of errorFindings) {
      lines.push(`### ${f.entry.name}`);
      lines.push("```");
      lines.push(f.result._parse_error || f._error || "(no detail)");
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── main ─────────────────────────────────────────────────────────────
async function main() {
  const matches = await discover();
  console.log(`🔍 Matched ${matches.length} transcript(s) for glob "${args.glob}" (min ${args.minSize}B).`);

  if (args.listOnly) {
    for (const m of matches) console.log(`  ${(m.size / 1024).toFixed(1).padStart(6)}KB  ${m.name}`);
    return;
  }

  if (matches.length === 0) {
    console.log("nothing to do.");
    return;
  }

  const findings = [];
  for (let i = 0; i < matches.length; i++) {
    const entry = matches[i];
    process.stdout.write(`  [${i + 1}/${matches.length}] ${entry.name} (${(entry.size / 1024).toFixed(1)}KB)… `);
    const t0 = Date.now();
    try {
      const result = await analyzeOne(entry);
      const ms = Date.now() - t0;
      const qc = result.verbatim_quotes?.length ?? 0;
      const np = result.new_pattern_candidate ? " +new-pattern" : "";
      const co = result.contradiction ? " +contradiction" : "";
      console.log(`✅ ${qc} quote${qc === 1 ? "" : "s"}${np}${co} (${(ms / 1000).toFixed(1)}s)`);
      findings.push({ entry, result });
    } catch (e) {
      console.log(`❌ ${e.message}`);
      findings.push({ entry, result: {}, _error: e.message });
    }
  }

  fs.mkdirSync(PROPOSALS, { recursive: true });
  const outPath = path.join(PROPOSALS, `${todayIso()}-${args.label}.md`);
  fs.writeFileSync(outPath, renderProposal(findings), "utf8");
  console.log(`\n📄 Wrote proposal: ${outPath}`);

  const totalQuotes = findings.reduce((s, f) => s + (f.result.verbatim_quotes?.length ?? 0), 0);
  const newPatterns = findings.filter((f) => f.result.new_pattern_candidate).length;
  console.log(`   ${totalQuotes} quote candidate(s), ${newPatterns} new pattern(s).`);
  console.log(`\nNext: review the file, cherry-pick approved quotes into HADAR_RAW_QUOTES.md,`);
  console.log(`      then run: cd ${REPO_ROOT} && npm run sync-corpus`);
}

main().catch((e) => { console.error(e); process.exit(1); });
