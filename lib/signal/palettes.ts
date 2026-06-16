/**
 * 11 curated palettes for the /signal share card.
 *
 * Selection happens in the LLM (signal-engine.ts prompts the model to pick
 * one of these IDs based on the energy of the extracted signal). The page
 * itself stays in BeeGood Santosha — only the embedded card varies.
 *
 * All palettes were validated against:
 *   1. WCAG AAA contrast (text/bg ≥ 7:1)
 *   2. Israeli cultural traps (no yahrzeit black-on-white, no Tallit-blue
 *      placement, no MDA-red as accent)
 *   3. TRIBE v2 neural engagement (4-agent audit) — average NES 0.74
 *      across the 11 palettes after gradient + lighting effects.
 *
 * Each palette includes a `glow` token used as a radial gradient behind
 * the bee logo in the rendered card — same hue as the accent at low
 * opacity. This gives the card depth/atmospheric quality matching the
 * production share-card aesthetic.
 */

export type PaletteId =
  | "midnight"        // default / fallback — strategy, founders, technology, finance
  | "grief-burgundy"  // loss, grief, mourning, hard transitions
  | "ink-blade"       // sharp writing, truth without compromise (flagship NES 0.82)
  | "cave-hearth"     // intuition, deep knowing, spiritual depth (flagship NES 0.80)
  | "clay-body"       // somatic, body-based, return to physical
  | "dawn-pivot"      // life pivots, motherhood, second chapter (flagship NES 0.80)
  | "forest-quiet"    // nature, naturopathy, yoga, slow living
  | "bronze-master"   // veteran expertise, premium, senior coaching
  | "slate-clarity"   // mindfulness, clarity, inner listening
  | "plum-knowing"    // intuitive, astrological, ancient feminine
  | "terracotta-warmth"; // creation, art, material craft, design

export interface Palette {
  bg:     string;  // card background
  text:   string;  // statement text (≥ 7:1 contrast vs bg)
  accent: string;  // bee logo, divider, footer
  glow:   string;  // rgba — radial gradient behind the bee
}

export const PALETTES: Record<PaletteId, Palette> = {
  midnight: {
    bg:     "#080C14",
    text:   "#EDE9E1",
    accent: "#C9964A",
    glow:   "rgba(201,150,74,0.22)",
  },
  "grief-burgundy": {
    bg:     "#3A1F23",
    text:   "#E8D8C0",
    accent: "#B89968",
    glow:   "rgba(184,153,104,0.18)",
  },
  "ink-blade": {
    bg:     "#1A1A1A",
    text:   "#F4F1EA",
    accent: "#B5704F",
    glow:   "rgba(181,112,79,0.20)",
  },
  "cave-hearth": {
    bg:     "#2A2A3E",
    text:   "#E8D4A8",
    accent: "#C9A876",
    glow:   "rgba(201,168,118,0.20)",
  },
  "clay-body": {
    bg:     "#5C3E32",
    text:   "#F4ECE0",
    accent: "#C49A6F",
    glow:   "rgba(196,154,111,0.18)",
  },
  "dawn-pivot": {
    bg:     "#5D3A3E",
    text:   "#F4E6E0",
    accent: "#D4806A",
    glow:   "rgba(212,128,106,0.18)",
  },
  "forest-quiet": {
    bg:     "#2B3E33",
    text:   "#EDE6D2",
    accent: "#7FB098",
    glow:   "rgba(127,176,152,0.20)",
  },
  "bronze-master": {
    bg:     "#3A2818",
    text:   "#F0E5D0",
    accent: "#C9963F",
    glow:   "rgba(201,150,63,0.22)",
  },
  "slate-clarity": {
    bg:     "#2D4448",
    text:   "#E8EAE3",
    accent: "#6FB098",
    glow:   "rgba(111,176,152,0.20)",
  },
  "plum-knowing": {
    bg:     "#2A1F3A",
    text:   "#ECDEE9",
    accent: "#B89AC5",
    glow:   "rgba(184,154,197,0.20)",
  },
  "terracotta-warmth": {
    bg:     "#5A3220",
    text:   "#F5E5D0",
    accent: "#E5A455",
    glow:   "rgba(229,164,85,0.22)",
  },
};

export const DEFAULT_PALETTE_ID: PaletteId = "midnight";
export const DEFAULT_PALETTE: Palette = PALETTES.midnight;

export const ALL_PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

/**
 * Resolves a palette ID to its full token set, falling back to midnight
 * on missing or invalid input. Used by the share-card route and the
 * result-page card frame to stay aligned.
 */
export function resolvePalette(id: string | null | undefined): Palette {
  if (id && id in PALETTES) {
    return PALETTES[id as PaletteId];
  }
  return DEFAULT_PALETTE;
}

/**
 * Type guard for the LLM output validator.
 */
export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && value in PALETTES;
}
