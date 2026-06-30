/**
 * Territory engine for the signal cards (2026-06-30, v4).
 *
 * Per Alon's cinematography brief: the SUBJECT is unconstrained — any real-world
 * environment, original and surprising, shot as high-end cinema. We don't pin a
 * fixed scene; instead each card gets a broad "territory" as a springboard (so
 * the 7 cards explore different worlds and people diverge), and the model invents
 * an original cinematic scene within/around it. Cohesion comes from the shared
 * cinematography quality bar, not from one look.
 */

export interface Territory { name: string; hint: string }

// Broad, diverse springboards — environments / light / atmosphere, never a
// staged single prop. The model is told to spring FREELY from these.
export const TERRITORIES: Territory[] = [
  { name: "Natural landscape",     hint: "any dramatic or serene natural landscape — mountains, dunes, coast, canyon, valley, plateau" },
  { name: "Water",                 hint: "water in any state — calm sea, lake mirror, a river, rain, ripples, a reflection, mist over water" },
  { name: "Sky & atmosphere",      hint: "sky and air — layered clouds, dawn or dusk light, fog, light beams, a clearing storm" },
  { name: "Modern architecture",   hint: "contemporary architecture — concrete, glass, curves, a stair, a facade, light carving structure" },
  { name: "Intimate interior",     hint: "a quiet modern interior — light moving across a wall, floor, table, a corner of a calm room" },
  { name: "Light through a form",  hint: "light filtered through something — a window, blinds, an archway, foliage, sheer fabric, a colonnade" },
  { name: "Material & texture",    hint: "real-world material up close in cinematic light — stone, wood, plaster, paper, metal, sand, fabric" },
  { name: "Botanical",             hint: "the natural plant world — a forest, a single tree, a field of flowers, leaves, a quiet garden" },
  { name: "Urban moment",          hint: "an unexpected urban moment — a street in soft light, a courtyard, a bridge, an alley, a rooftop" },
  { name: "Raw / industrial",      hint: "raw spaces — a warehouse shaft of light, steel, concrete, a workshop, a hangar, a quarry" },
  { name: "Arid beauty",           hint: "arid land — desert dunes, cracked earth, red rock, salt flats, warm low light on sand" },
  { name: "Cold light",            hint: "cold beauty — snow, ice, frost on glass, a misty cold morning, pale winter light" },
  { name: "Fields & agriculture",  hint: "open cultivated land — a field of grain, vines, lavender rows, a meadow swaying in wind" },
  { name: "Coast & shoreline",     hint: "where land meets sea — cliffs, a shoreline, foam, tide pools, harbor light" },
  { name: "Reflective surfaces",   hint: "reflection and refraction — a glass wall, a wet street, a still pool, polished metal, a prism of light" },
  { name: "Weather & mood",        hint: "weather as subject — rain on glass, drifting mist, golden haze, a sun shower, low fog" },
  { name: "Aerial / vastness",     hint: "a vast top-down or wide perspective — a coastline, terraced land, a river delta, patterned earth" },
  { name: "Quiet still life",      hint: "a real lived environment in beautiful light (a windowsill, a desk corner, a kitchen counter) — found, never staged" },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/**
 * Pick a DISTINCT territory per card. The person seed sets a start offset (so
 * people diverge); stepping by a stride coprime to the list length keeps the 7
 * cards on different territories.
 */
export function assignTerritory(occupation: string | null | undefined, signal: string, cardIndex: number): Territory {
  const start = hashStr(`${(occupation ?? "").trim()}|${signal}`);
  const idx = (start + cardIndex * 7) % TERRITORIES.length;
  return TERRITORIES[idx];
}

export function territoryDirective(t: Territory): string {
  return [
    `STARTING TERRITORY (a springboard, not a constraint): ${t.hint}.`,
    `Spring freely from it into ONE original, surprising, beautiful cinematic scene — invent something fresh, not the obvious first idea.`,
  ].join(" ");
}

// Shared negatives. NOTE: fine cinematic film grain is WANTED (handled in the
// positive brief) — only vintage/over-processed looks are banned here.
export const SHARED_NEGATIVES =
  "No people, no person, no faces, no face, no human figure, no silhouette, no profile, no portrait, no head, no bust, no statue, no mannequin, no body parts, no hands, no crowd. " +
  "No text, no letters, no logos, no watermarks. " +
  "No CGI look, no 3D render, no video-game render, no overprocessed AI imagery, no plastic artificial surfaces, no stock-photo cliche. " +
  "No flat solid-color background, no plain abstract gradient, no mosaic. " +
  "No cliche metaphor props — no compass, no magnifying glass, no globe, no hourglass, no clock, no lightbulb, no chess pieces, no scattered gems or glitter. " +
  "No vintage, no sepia, no heavy retro filter, no oversaturation, no neon, no HDR halos.";
