/**
 * Scene engine for the signal cards (2026-06-30, v3).
 *
 * Direction reset after Alon: NOT a uniform forced color, NOT a staged prop
 * object — he wants beautiful, high-quality, cinematic REAL PHOTOGRAPHY, varied
 * across the set, and lets us choose the color. So each of the 7 cards is seeded
 * with a DIFFERENT real photographic scene archetype (own natural palette + light),
 * rotated by a person hash so the 7 differ AND different people differ. Cohesion
 * comes from consistent quality + modern warm light, not from one hue.
 */

export interface Scene {
  name:    string;
  scene:   string;   // concrete, people-free, real-photography description
  palette: string;   // the scene's natural colors (varied per scene)
  light:   string;   // the light behaviour
}

// 12 cinematic, people-free, modern, POSITIVE real-photography archetypes.
// Deliberately varied in color so a set is never one uniform hue.
export const SCENES: Scene[] = [
  { name: "Dawn Hills",      scene: "soft rolling hills under a light dawn mist, layers receding into a luminous sky",
    palette: "pale rose, soft gold, sage green, luminous cream sky", light: "low warm dawn light gently lifting the mist" },
  { name: "Forest Light",    scene: "tall green forest with soft sunbeams filtering through the canopy onto a quiet floor",
    palette: "emerald and moss green, warm gold light shafts, soft brown", light: "backlit soft god-rays, gentle and warm" },
  { name: "Ocean Horizon",   scene: "a calm open sea meeting a vast soft sky at golden hour, a single gentle horizon line",
    palette: "soft teal water, warm amber sky, cream light", light: "low warm sun spreading across the water" },
  { name: "Sunlit Room",     scene: "soft morning daylight pooling across a calm, airy, modern minimalist interior, a slice of warm wall and floor",
    palette: "warm white, honey, soft sand", light: "diffuse window daylight, soft long shadows" },
  { name: "Golden Field",    scene: "a field of soft tall grass swaying under a gentle open sky, shallow depth",
    palette: "warm amber and wheat, fresh green, pale blue sky", light: "warm late-afternoon side light" },
  { name: "Still Lake",      scene: "a mirror-still mountain lake at dawn reflecting soft colour, faint far shore",
    palette: "soft teal, dusty rose, silver, pale sky", light: "calm even dawn light, soft reflection" },
  { name: "Soft Sky",        scene: "a serene sunrise sky of soft layered clouds, gentle and vast (a real sky, not abstract)",
    palette: "blush pink, peach, soft gold, pale blue", light: "soft sunrise glow behind the clouds" },
  { name: "Curtain Light",   scene: "warm daylight glowing through sheer curtains onto a soft surface, gentle folds of light",
    palette: "cream, warm peach, soft white", light: "diffuse backlit window glow, soft and bright" },
  { name: "Desert Calm",     scene: "smooth desert dunes under soft warm light, gentle sculptural curves and a clean sky",
    palette: "warm sand, peach, soft clay, pale sky", light: "soft low warm sun raking the dunes" },
  { name: "Water Light",     scene: "gentle light moving across a calm water surface, soft slow reflections (smooth, never sparkly)",
    palette: "soft teal, warm gold reflection, cream", light: "soft warm light gliding on the water" },
  { name: "Garden Bloom",    scene: "a soft-focus garden of gentle blossoms and greenery in bright daylight, airy bokeh",
    palette: "blush and rose, fresh green, cream light", light: "bright soft daylight, gentle bloom" },
  { name: "Misty Mountains", scene: "layered mountain ridges fading into soft morning haze, calm and vast",
    palette: "soft blue, violet-grey, warm rose haze, pale sky", light: "soft dawn haze, gentle gradient of light" },
];

// Stable string hash (FNV-1a-ish).
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/**
 * Assign a DISTINCT scene per card. The person seed (occupation+signal) sets a
 * start offset so different people get different scene sets; stepping by a
 * stride coprime to 12 (5) guarantees the 7 cards are all different scenes.
 */
export function assignScene(occupation: string | null | undefined, signal: string, cardIndex: number): Scene {
  const start = hashStr(`${(occupation ?? "").trim()}|${signal}`);
  const idx = (start + cardIndex * 5) % SCENES.length;
  return SCENES[idx];
}

// The scene directive injected into the Flux prompt.
export function sceneDirective(scene: Scene): string {
  return [
    `SCENE FOUNDATION — ${scene.name}: ${scene.scene}.`,
    `Natural palette: ${scene.palette}. Light: ${scene.light}.`,
    `Render it as a gorgeous, high-resolution, cinematic real photograph — rich, dimensional, modern, alive. Bend the scene to embody the signal's emotional truth, but keep it a real photographic scene, never abstract flat colour and never a single staged object.`,
  ].join(" ");
}

// Shared negative block — bans people/faces (incl. the mosaic-portrait trap),
// the gem/glitter/gold basin, flat color/gradient, and vintage.
export const SHARED_NEGATIVES =
  "No people, no person, no faces, no face, no human figure, no silhouette, no profile, no portrait, no head, no bust, no statue, no mannequin, no mosaic of a face, no body parts, no hands, no crowd. " +
  "No scattered gems, gemstones, crystals, jewels, glitter, sparkles, sequins, confetti, treasure, bokeh dots, fairy lights, magnifying glass, compass, gold coins. " +
  "No flat solid-color background, no plain abstract gradient, no single staged prop object, no mosaic, no tiles. " +
  "No text, no letters, no logos, no watermarks. " +
  "No film grain, no vintage, no sepia, no antique, no kodak emulation, no greige minimalism, no generic stock cliche, no oversaturation, no neon, no HDR, no people.";
