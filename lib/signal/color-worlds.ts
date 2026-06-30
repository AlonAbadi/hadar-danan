/**
 * Color-world engine for the signal cards (from the world-class-signal-cards
 * multi-agent design, 2026-06-30).
 *
 * The failure it fixes: every card collapsed to the same gold/amber. Now each
 * PERSON is deterministically assigned ONE color world (domain-biased candidate
 * set + a stable name/signal hash so people diverge — no coach monoculture),
 * and the 7 cards rotate value/temperature within that world so the set is
 * cohesive but not identical. The world's exact hexes are injected (forced) into
 * the Flux prompt, and a shared negative block bans the gem/glitter/gold basin.
 */

export interface ColorWorld {
  name:     string;
  hueName:  string;   // plain-language dominant hue for the Flux prompt
  warm:     boolean;  // warm worlds may use gold/amber; cool/jewel worlds ban it
  keywords: string[]; // Hebrew domain keywords that bias toward this world
  ramp: {
    bgDeep:  string;  // darkest edge of the background field
    bgMid:   string;  // dominant background hue
    light:   string;  // airy light zone (text bed on light cards)
    accent:  string;  // <=10% of frame, never in the text zone
    neutral: string;  // scrim/cream base
  };
}

// 12 worlds. Index 0-11 (the spec numbered them 1-12).
export const WORLDS: ColorWorld[] = [
  { name: "Emerald Vault",    hueName: "deep emerald green",  warm: false, keywords: ["אסטרטג","עסק","כסף","פיננס","יזם","הון","מכירות","רווח"],
    ramp: { bgDeep:"#10342B", bgMid:"#1E6F5C", light:"#A8D8C6", accent:"#E8B04B", neutral:"#F4EFE6" } },
  { name: "Sage Atelier",     hueName: "soft sage green",     warm: false, keywords: ["מטפל","ריפוי","רוגע","מיינדפול","יוגה","מדיטצי","שקט","איזון"],
    ramp: { bgDeep:"#3A4A3F", bgMid:"#7E9B82", light:"#D8E2D0", accent:"#E5A98A", neutral:"#F6F2E9" } },
  { name: "Coral Studio",     hueName: "warm coral",          warm: true,  keywords: ["מותג","עיצוב","קריאייטיב","יצירה","תוכן","סטודיו","אמנות"],
    ramp: { bgDeep:"#5A2A2A", bgMid:"#D96A52", light:"#F6C9A8", accent:"#3E6E6A", neutral:"#FBF3EA" } },
  { name: "Plum Interior",    hueName: "rich plum violet",    warm: false, keywords: ["פסיכו","תודעה","עומק","נפש","פנימי","הבנה"],
    ramp: { bgDeep:"#2E2036", bgMid:"#6E4B7A", light:"#CDB6D6", accent:"#E3B15A", neutral:"#F3EDE9" } },
  { name: "Lavender Light",   hueName: "soft lavender",       warm: false, keywords: ["זוגי","הורות","רגש","עדינ","תמיכה","ילד","משפח"],
    ramp: { bgDeep:"#4A4763", bgMid:"#9E97C4", light:"#E0DBF0", accent:"#E59AA8", neutral:"#F6F3F0" } },
  { name: "Indigo Authority", hueName: "deep indigo blue",    warm: false, keywords: ["מנהיג","מנהל","ניהול","סמכות","ארגון","מקצוע","מומחה"],
    ramp: { bgDeep:"#1B2440", bgMid:"#3A4F86", light:"#AEC0E6", accent:"#E0A24B", neutral:"#F2EFE8" } },
  { name: "Teal Method",      hueName: "clear teal",          warm: false, keywords: ["שיטה","מערכת","טכנו","תהליך","סדר","בהירות","דאטה"],
    ramp: { bgDeep:"#0E3338", bgMid:"#1F7A7E", light:"#A6DCD8", accent:"#EBA45B", neutral:"#EFF3EF" } },
  { name: "Apricot Dawn",     hueName: "warm apricot",        warm: true,  keywords: ["רוחני","מסע","נשי","אינטואי","אנרגי","הארה","שחר"],
    ramp: { bgDeep:"#6B3A2E", bgMid:"#E08A5B", light:"#F8D6A8", accent:"#7B9E8E", neutral:"#FBF4E9" } },
  { name: "Rose Clay",        hueName: "warm rose clay",      warm: true,  keywords: ["חמלה","חיבור","לב","תשוקה","יחסים","אהבה","ביטחון"],
    ramp: { bgDeep:"#5C3138", bgMid:"#C77B7C", light:"#F0CCC4", accent:"#5E7E74", neutral:"#FAF1EC" } },
  { name: "Magenta Bloom",    hueName: "bold magenta",        warm: false, keywords: ["פריצ","שינוי","העז","תעוז","מהפכ","בולט","נוכח"],
    ramp: { bgDeep:"#4A1A3A", bgMid:"#B23A78", light:"#F0B8D2", accent:"#3E7E6E", neutral:"#FAEFF3" } },
  { name: "Eucalyptus Fresh", hueName: "fresh eucalyptus",    warm: false, keywords: ["בריאות","תזונה","כושר","ספורט","תנועה","גוף","חיוני"],
    ramp: { bgDeep:"#26403A", bgMid:"#5E9486", light:"#CDE5DA", accent:"#E8B96A", neutral:"#F2F4ED" } },
  { name: "Saffron Voice",    hueName: "warm saffron gold",   warm: true,  keywords: ["הרצא","דובר","במה","קול","נוכחות","השפע","קהל"],
    ramp: { bgDeep:"#5A3416", bgMid:"#C97B2E", light:"#F4CF96", accent:"#3D6E84", neutral:"#FAF2E6" } },
];

// Per-card variation across the 7 (one world, seven states). Card index 0-6.
// theme drives text-on-light vs text-on-dark; valueKey picks which ramp value
// dominates the image; temp shifts warm/cool for visual variety.
export type CardVariation = {
  valueKey: "bgDeep" | "bgMid" | "light" | "midDeep" | "lightMid";
  temp:     "base" | "warm" | "cool";
  theme:    "dark" | "light";
};
export const CARD_VARIATION: CardVariation[] = [
  { valueKey: "bgDeep",   temp: "base", theme: "dark"  }, // 0 public statement (thesis)
  { valueKey: "light",    temp: "warm", theme: "light" }, // 1 signal sentence
  { valueKey: "bgMid",    temp: "base", theme: "light" }, // 2 promise
  { valueKey: "light",    temp: "cool", theme: "light" }, // 3 audience
  { valueKey: "midDeep",  temp: "warm", theme: "light" }, // 4 direction 1
  { valueKey: "lightMid", temp: "cool", theme: "light" }, // 5 direction 2
  { valueKey: "bgDeep",   temp: "base", theme: "dark"  }, // 6 direction 3 (bookend)
];

// Stable, deterministic string hash (FNV-1a-ish).
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Domain-biased candidate set from the Hebrew occupation + signal text. Falls
// back to ALL worlds when nothing matches (so niche fields still get spread).
function candidateSet(text: string): number[] {
  const hits: number[] = [];
  WORLDS.forEach((w, i) => {
    if (w.keywords.some((k) => text.includes(k))) hits.push(i);
  });
  if (hits.length >= 2) return hits;
  if (hits.length === 1) {
    // widen by one neighbour so a single keyword doesn't lock everyone in.
    return [hits[0], (hits[0] + 5) % WORLDS.length];
  }
  return WORLDS.map((_, i) => i);
}

/**
 * Deterministically assign a color world to a person. The same person (same
 * occupation+signal) always gets the same world; different people spread out
 * via the hash even inside the same domain (anti-monoculture).
 */
export function assignWorld(occupation: string | null | undefined, signal: string): { world: ColorWorld; index: number } {
  const occ = (occupation ?? "").trim();
  const set = candidateSet(`${occ} ${signal}`);
  const seed = hashStr(`${occ}|${signal}`);
  const index = set[seed % set.length];
  return { world: WORLDS[index], index };
}

// The forced color directive for one card's Flux prompt (color stated concretely
// with the world's hexes + the card's value/temperature).
export function colorDirective(world: ColorWorld, cardIndex: number): string {
  const v = CARD_VARIATION[cardIndex % CARD_VARIATION.length];
  const r = world.ramp;
  const dominant =
    v.valueKey === "bgDeep"  ? r.bgDeep :
    v.valueKey === "light"   ? r.light  :
    v.valueKey === "lightMid"? r.light  :
    v.valueKey === "midDeep" ? r.bgDeep : r.bgMid;
  const tempWord = v.temp === "warm" ? "a touch warmer" : v.temp === "cool" ? "a touch cooler" : "neutral, true to the hue";
  const zone = v.theme === "dark"
    ? `Keep the central text zone the calmest, smoothly-lit, low-detail DARK area (for light text).`
    : `Keep the central text zone the lightest, smoothly-lit, low-detail airy area (${r.light}) for dark text, all detail pushed to the edges.`;
  return [
    `COLOR WORLD — ${world.name}: a ${world.hueName} field, ${tempWord}, dominated by ${dominant} and deepening to ${r.bgDeep} at the edges.`,
    `One restrained accent of ${r.accent} on at most 10% of the frame, never in the text zone.`,
    `Muted, harmonious, low-saturation, limited palette. State this hue bound into the subject itself.`,
    zone,
  ].join(" ");
}

// Shared negative block (the gem/glitter/gold basin + people/text/vintage).
export const SHARED_NEGATIVES =
  "No scattered gems, gemstones, crystals, jewels, glitter, sparkles, sequins, confetti, treasure, shiny scattered objects, bokeh dots, fairy lights, magnifying glass, compass, gold coins. " +
  "No busy or cluttered center, no high-contrast busy background. " +
  "No people, no faces, no hands, no body parts. No text, no letters, no logos, no watermarks. " +
  "No film grain, no vintage, no sepia, no kodak emulation, no antique, no greige minimalism, no flat beige, no generic stock photo, no oversaturation, no neon, no HDR.";

// On non-warm worlds (and non-warm cards) actively repel the gold attractor basin.
export function goldRepulsion(world: ColorWorld, cardIndex: number): string {
  const v = CARD_VARIATION[cardIndex % CARD_VARIATION.length];
  if (world.warm && v.temp === "warm") return "";
  return " No gold, no amber, no brass, no golden-hour wash, no warm-yellow glow, no orange sparkle.";
}
