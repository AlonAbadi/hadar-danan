/**
 * Shoot Day output guards — deterministic post-processing applied to every
 * generated slice BEFORE it is cached/returned.
 *
 * Two project rules are too important to leave to model compliance:
 *  1. No em-dashes anywhere (project-wide style rule). We STRIP them.
 *  2. hadar_quote.source must be a real corpus source, never invented —
 *     otherwise Magic #2 ("למה זה?") shows users fabricated provenance.
 *     We force unknown sources to "general".
 *
 * Clichés are LINTED (returned as warnings for logging), not auto-rewritten,
 * since rewriting changes meaning.
 */
import { deriveReelsProfile, isApprovedQuoteSource, type Video } from "@/lib/prompts/shoot-day-engine";
import { CORPUS_QUOTES_BY_MOVE } from "@/lib/prompts/hadar-corpus-quotes";

// ── 1. Em-dash strip ──────────────────────────────────────────────────
// Replaces em/en dashes. A spaced dash (" - ") becomes a comma; a bare one
// becomes a short hyphen so compounds stay readable.
export function stripEmDashes(s: string): string {
  return s
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/[—–]/g, "-");
}

/** Recursively strip em-dashes from every string in a JSON-like value. */
export function normalizeShootDayText<T>(value: T): T {
  if (typeof value === "string") return stripEmDashes(value) as unknown as T;
  if (Array.isArray(value)) return value.map(normalizeShootDayText) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeShootDayText(v);
    return out as T;
  }
  return value;
}

// ── 2. Quote provenance guard ─────────────────────────────────────────
/** Force any video citing an unapproved source to source:"general". */
export function sanitizeHadarQuotes(videos: Video[]): Video[] {
  return videos.map((v) => {
    if (v.hadar_quote && !isApprovedQuoteSource(v.hadar_quote.source)) {
      return { ...v, hadar_quote: { ...v.hadar_quote, source: "general" } };
    }
    return v;
  });
}

// ── 2b. reels_profile backfill ────────────────────────────────────────
// Legacy cached videos + models that forget the field: derive from duration.
export function backfillReelsProfile(videos: Video[]): Video[] {
  return videos.map((v) => {
    if (v.reels_profile) return v;
    return { ...v, reels_profile: deriveReelsProfile(v.duration) };
  });
}

// ── 3. Cliché lint (warnings only) ────────────────────────────────────
// Mirrors the banned list in SHARED_RULES (shoot-day-engine.ts).
const CLICHES = [
  "המקצוען", "המוביל", "פורץ הדרך", "פורץ דרך", "השואף", "המבטיח",
  "פותרים בעיות", "תהליך מדהים", "משנה חיים", "בלעדי", "המהפכה",
  "מסע", "העצמה", "שינוי תודעתי", "אנשי מקצוע", "מומחים",
];

// ── 3. Anti-verbatim leak (IP protection) ────────────────────────────
// The engine is trained on Hadar's actual quotes. Per Alon 2026-07-10, no
// verbatim run from the corpus may reach a paying customer's output — two
// customers in the same archetype would get identical text, and any
// competitor watching a customer's public reel could reverse-engineer
// Hadar's playbook. We check every string field in the video output for
// a 5+ word overlap with any corpus quote. `sanitizeText` strips
// Hebrew punctuation, collapses whitespace, and lowercases (Latin letters
// only) so the comparison ignores cosmetics.

const CORPUS_STRINGS_CACHE: string[] = Object.values(CORPUS_QUOTES_BY_MOVE)
  .flat()
  .map((q) => q.quote);

function tokenize(s: string): string[] {
  return s
    .replace(/["""''.,:;!?()[\]{}«»<>—–\-\/\\|]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

const CORPUS_TOKENS: string[][] = CORPUS_STRINGS_CACHE.map(tokenize);

/**
 * Returns the FIRST corpus 5-word overlap detected, or null if clean.
 * Used both as a leak detector (hard block) and lint warning.
 */
export function detectCorpusLeak(text: string, minWords = 5): { corpus: string; run: string } | null {
  const outTokens = tokenize(text);
  if (outTokens.length < minWords) return null;
  for (let i = 0; i <= outTokens.length - minWords; i++) {
    const window = outTokens.slice(i, i + minWords);
    for (let j = 0; j < CORPUS_TOKENS.length; j++) {
      const corpus = CORPUS_TOKENS[j];
      // Search this window inside the corpus quote.
      for (let k = 0; k <= corpus.length - minWords; k++) {
        let match = true;
        for (let w = 0; w < minWords; w++) {
          if (corpus[k + w] !== window[w]) { match = false; break; }
        }
        if (match) return { corpus: CORPUS_STRINGS_CACHE[j], run: window.join(" ") };
      }
    }
  }
  return null;
}

/** Same shape as lintShootDay — walks the tree and returns warnings for leaks. */
export function lintCorpusLeaks(value: unknown): string[] {
  const warnings: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === "string" && v.length > 0) {
      const hit = detectCorpusLeak(v);
      if (hit) warnings.push(`corpus-leak at ${path}: "${hit.run}" (matches: "${hit.corpus.slice(0, 60)}…")`);
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) walk(val, path ? `${path}.${k}` : k);
    }
  };
  walk(value, "");
  return warnings;
}

/** Returns a list of human-readable warnings (cliché hits, leftover dashes). */
export function lintShootDay(value: unknown): string[] {
  const warnings: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === "string") {
      for (const c of CLICHES) {
        if (v.includes(c)) warnings.push(`cliché "${c}" at ${path}`);
      }
      if (/[—–]/.test(v)) warnings.push(`em-dash leftover at ${path}`);
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) walk(val, path ? `${path}.${k}` : k);
    }
  };
  walk(value, "");
  return warnings;
}
