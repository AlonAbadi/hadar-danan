/**
 * Visual-law engine for the signal cards (2026-06-30, v5 — Alon's metaphor brief).
 *
 * The real upgrade: reason BEFORE generating. signal -> metaphor -> image. The
 * metaphor is derived by the model from the signal; here we only seed a DIFFERENT
 * "visual law" (transformation family) per card so the 7 cards each express the
 * transformation differently and people diverge. The model is free to derive its
 * own metaphor — the seed is just a lean toward a distinct family.
 */

export interface VisualLaw { name: string }

// Transformation families (from Alon's examples + extensions). Each is a "visual
// law" the image can obey — emotion carried by light, texture, space, motion.
export const VISUAL_LAWS: VisualLaw[] = [
  { name: "boundaries dissolving" },
  { name: "light expanding and spreading" },
  { name: "weightlessness, something rising" },
  { name: "emerging from fog, the mist clearing" },
  { name: "a cracked surface opening to light" },
  { name: "the hidden becoming visible" },
  { name: "chaos resolving into structure" },
  { name: "frozen becoming fluid, a thaw" },
  { name: "pressure becoming breath, a release" },
  { name: "scattered fragments coming into coherence" },
  { name: "a threshold or passage opening" },
  { name: "stillness settling after motion" },
  { name: "depth revealed beneath a surface" },
  { name: "warmth returning to something cold" },
  { name: "a single clear point amid vast expanse" },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/**
 * Seed a DISTINCT visual law per card (so the 7 differ and people diverge).
 * Stride 4 is coprime to 15, so 7 consecutive cards never repeat a law.
 */
export function assignVisualLaw(occupation: string | null | undefined, signal: string, cardIndex: number): VisualLaw {
  const start = hashStr(`${(occupation ?? "").trim()}|${signal}`);
  const idx = (start + cardIndex * 4) % VISUAL_LAWS.length;
  return VISUAL_LAWS[idx];
}

// People rule (Alon's brief): anonymous / blurred / silhouetted / partial figures
// are ALLOWED; identifiable faces are not. Plus the standing quality bans.
export const SHARED_NEGATIVES =
  "No identifiable face, no recognizable person, no clear facial features, no direct eye contact, no portrait close-up of a face. " +
  "Any human presence must stay anonymous — blurred, silhouetted, partially hidden, distant, or abstract. " +
  "No text, no letters, no logos, no watermarks. " +
  "No CGI look, no 3D render, no video-game render, no over-processed AI imagery, no plastic artificial surfaces, no stock-photo cliche, no generic coaching or wellness imagery. " +
  "No cliche metaphor props — no compass, no magnifying glass, no globe, no hourglass, no clock, no lightbulb, no chess pieces, no scattered gems or glitter. " +
  "No flat solid-color background, no plain abstract gradient, no mosaic. " +
  "No vintage, no sepia, no heavy retro filter, no oversaturation, no neon, no HDR halos.";
