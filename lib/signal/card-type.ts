/**
 * Pull-quote typography for the signal cards (from the world-class-signal-cards
 * design, 2026-06-30). Fixes "all text the same size": every quote is split into
 * a smaller SUPPORT lead-in and a larger LEAD punch, giving real hierarchy.
 *
 * The split is a render-time heuristic (no extra LLM call): Hebrew (and the
 * English lines) usually resolve the punch in the LAST clause, so we cut after
 * the last comma/colon when that yields a balanced lead, else at ~58% of words.
 */

export interface QuoteParts { support: string; lead: string }

export function splitQuote(text: string): QuoteParts {
  const t = (text ?? "").trim();
  const words = t.split(/\s+/).filter(Boolean);
  // Short quotes: all lead, no support (one confident statement).
  if (words.length <= 4 || t.length <= 32) return { support: "", lead: t };

  // Prefer the last sentence/clause break — the Hebrew punch lands at the end.
  const breaks = [...t.matchAll(/[,:;.!?]\s+/g)];
  if (breaks.length) {
    const last = breaks[breaks.length - 1];
    const idx = (last.index ?? 0) + last[0].length;
    const support = t.slice(0, idx).trim();
    const lead = t.slice(idx).trim();
    if (lead.length >= 6 && lead.length <= t.length * 0.62 && support.length >= 6) {
      return { support, lead };
    }
  }

  // Otherwise split by words — last ~42% becomes the lead.
  const cut = Math.max(1, Math.round(words.length * 0.58));
  return { support: words.slice(0, cut).join(" "), lead: words.slice(cut).join(" ") };
}

// Lead font-size by lead length (kept conservative for the 780px quote column
// so the big line never overflows). Hebrew serif wants higher line-height.
export function leadSize(len: number): { fs: number; lh: number } {
  if (len <= 12) return { fs: 104, lh: 1.12 };
  if (len <= 22) return { fs: 88,  lh: 1.14 };
  if (len <= 34) return { fs: 74,  lh: 1.18 };
  if (len <= 48) return { fs: 62,  lh: 1.22 };
  if (len <= 70) return { fs: 52,  lh: 1.28 };
  if (len <= 110) return { fs: 44, lh: 1.34 };
  return { fs: 37, lh: 1.4 };
}

// Support is a clear step below the lead by SIZE (hierarchy comes from size, not
// from fading — the support must stay fully readable).
export function supportSize(leadFs: number): number {
  return Math.max(30, Math.round(leadFs * 0.54));
}
