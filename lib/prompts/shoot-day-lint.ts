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
import { isApprovedQuoteSource, type Video } from "@/lib/prompts/shoot-day-engine";

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

// ── 3. Cliché lint (warnings only) ────────────────────────────────────
// Mirrors the banned list in SHARED_RULES (shoot-day-engine.ts).
const CLICHES = [
  "המקצוען", "המוביל", "פורץ הדרך", "פורץ דרך", "השואף", "המבטיח",
  "פותרים בעיות", "תהליך מדהים", "משנה חיים", "בלעדי", "המהפכה",
  "מסע", "העצמה", "שינוי תודעתי", "אנשי מקצוע", "מומחים",
];

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
