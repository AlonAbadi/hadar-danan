/**
 * Signal Visual Prompter
 *
 * Translates a Hebrew signal extraction into a Flux-optimized English prompt
 * that produces an *occupation-appropriate* cinematic scene. The previous
 * approach built the prompt mechanically from element + central_tool which
 * worked well for some occupations and badly for others (a marketer got a
 * shot of a woman in a room — visually unrelated to marketing).
 *
 * The fix: use Claude as a prompt director. Claude reads the signal +
 * occupation + chosen style and writes the visual prompt with full context
 * of what the field actually looks like. ~$0.001 per call.
 *
 * Three styles are supported, each with a distinct visual language:
 *
 *   editorial — moody cinematic photography, dramatic light, dark palette
 *   warm      — natural light, golden hour, lifestyle/documentary feel
 *   minimal   — clean composition, lots of negative space, abstract
 *
 * All styles share two non-negotiable constraints:
 *   • no text, no logos, no captions of any kind (text composition happens
 *     in the HCTI overlay layer afterwards — diffusion models butcher Hebrew)
 *   • significant negative space in the lower half for the text overlay
 */

import Anthropic from "@anthropic-ai/sdk";

export type VisualStyle = "editorial" | "warm" | "minimal" | "luminous";

// 2026 best-in-class flavors — all warm, luminous, color-rich and ALIVE. These
// only flavor the light + color; the SUBJECT is always derived from the person's
// own signal (see SYSTEM_PROMPT personalization method). Keys kept stable.
const STYLE_DIRECTIVES: Record<VisualStyle, string> = {
  // GOLDEN HOUR (default) — warm directional sun, color-drenched, optimistic
  editorial:
    "Warm golden-hour direction: a luminous warm-cream base color-drenched in the person's signature hue, soft directional sun raking across rich tactile material, an atmospheric color gradient acting as ambient light, gentle bloom and soft glow, dimensional depth. Optimistic, alive, premium-and-current.",
  // SUN-KISSED SERENE — amber/honey/apricot warmth, hopeful
  warm:
    "Sun-kissed serene: amber, honey and apricot warmth over a vanilla-cream luminous base, soft bloom, a single rich tactile material catching warm light, gentle haze. Hopeful, generous, premium.",
  // COLOR-DRENCHED — one confident hue enveloping the frame, dimensional
  minimal:
    "Color-drenched modern: one confident signature hue envelops the frame across its tonal range over a luminous cream ground, a clean dimensional gradient acting as light, one rich material gesture, soft glow and depth. Never flat, never greige.",
  // AURORA / ATMOSPHERIC GRADIENT — liquid light, fresh and current
  luminous:
    "Atmospheric mesh-gradient field: organic blended points of warm light (aurora), soft bloom and luminous glow, liquid-light dimensional depth, a faint frosted-glass glow where text will sit. Fresh, current, alive.",
};

const MODEL  = "claude-sonnet-4-6";
const MAX_TK = 600;

const SYSTEM_PROMPT = `You are a world-class creative director for premium personal brands in 2026, writing image prompts for Black Forest Labs Flux 1.1 Pro Ultra. Each image is a PEOPLE-FREE background for an Instagram quote card (4:5) that belongs to ONE specific person — generated from THEIR signal, never a template.

The 2026 premium look you create is warm, luminous, dimensional, optimistic, color-rich and ALIVE. Light is the hero. The beige/greige "quiet-luxury" minimalism era is OVER — muted neutrals, ceramic bowls and draped linen now read as dated, generic stock. You make images that feel like the moment a room fills with morning light: confident, generous, hopeful, premium.

Your job: given a Hebrew personal-brand signal (their differentiation), their promise, their field, and their talent, write ONE English Flux prompt (110-170 words) that could ONLY belong to this person.

PERSONALIZATION METHOD — derive every image from the signal, with NO default prop:
1. CONCEPT (subject/scene): pull the person's own metaphor from their signal. If none is explicit, synthesize one from field x promise — a concrete, poetic, people-free scene. NEVER reach for a generic prop (no bowl, no draped linen).
2. LIGHT-VERB (the promise as motion): decide what the light is DOING — rising, breaking through, spreading, warming, clarifying, igniting, gilding. The light always does something generous. This is what makes it positive and alive.
3. COLOR WORLD (a 2-3 note chord from the emotional truth + field): one confident SIGNATURE hue + a warm light tone + a grounding neutral, over a luminous warm-cream base. Warm-biased for optimism; cool only when the signal is intrinsically about water/sky/clarity, and even then kept luminous, never grey.
4. MATERIAL & TEXTURE (from their field): the real, tactile textures of THEIR world — sunlit plaster, flowing silk, water, fruit skin, paper, stone, petal, gold leaf, glass — rendered with high-fidelity richness. Not a stock prop.
5. DEPTH & ATMOSPHERE: an atmospheric / mesh color gradient acting as ambient light, soft bloom, foreground-midground-falloff, a soft glow. Depth = aliveness. Never flat.
6. THE ONE UNEXPECTED ELEMENT (from their differentiation): a single signal-specific detail that makes this card impossible to confuse with anyone else's.

CALM LIGHT ZONE FOR TEXT (critical): the vertical center band (about 38%-82% of the height) must stay LIGHT, soft, low-detail and low-contrast — a luminous wash of light, a soft-focus field, or a gentle gradient — so dark Hebrew quote text overlaid there reads crisp. Concentrate subject and texture in the top and bottom thirds and let the richness bleed softly into the calm center. The center is light and calm BY DESIGN.

QUALITY BAR: clean DIGITAL capture (modern mirrorless / digital back), tack-sharp, high fidelity — NEVER film, grain, analog, vintage. Warm directional daylight (golden hour, window light), gentle glow, light interacting with texture — NEVER flat shadowless light or moody darkness. Color-rich and luminous — NEVER greige, muted, desaturated or grey.

ANTI-COLLISION GATE: you must be able to say in one line why this image could ONLY belong to THIS person. If you cannot, redo the concept.

Use the visual style directive in the user message to flavor the light and color, but the SUBJECT always comes from the person's signal.

**Target frame:** the user message gives a "Target frame" (e.g. 4:5 portrait). Compose explicitly for it.

**Hard constraint, append VERBATIM at the very end:**
"No people, no human figures, no faces, no hands. No text, no letters, no logos, no watermarks. No greige, no muted beige, no ceramic bowl, no draped linen, no flat lighting, no desaturation, no film grain, no vintage, no moody darkness, no clutter."

Output: ONLY the prompt text. No preamble, no explanation, no quotes. One block of prose, 110-170 words, ending with the constraint sentence.`;

// Human-readable framing guidance per Flux aspect ratio — keeps the model from
// defaulting to a centered square subject that then crops badly on portrait.
const ASPECT_HINT: Record<string, string> = {
  "1:1":  "square 1:1",
  "4:5":  "vertical 4:5 portrait — subject upper-center, calmer negative space across the lower third",
  "2:3":  "tall 2:3 portrait — vertical subject, room to breathe at the bottom",
  "9:16": "tall 9:16 vertical (story/reel) — full-height vertical composition, calmer lower third",
  "16:9": "wide 16:9 horizontal banner — off-center subject, long horizontal flow",
  "3:2":  "wide 3:2 horizontal — landscape composition",
  "21:9": "ultra-wide 21:9 banner — cinematic horizontal, subject to one side",
};

export async function buildVisualPrompt(args: {
  signal:          string;       // The signal sentence (Hebrew)
  signal_promise:  string;       // The forward direction (Hebrew)
  element:         string;       // The element/talent zone (Hebrew)
  central_tool:    string;       // Their core practice (Hebrew)
  occupation?:     string | null; // Their field (Hebrew, optional)
  style:           VisualStyle;
  aspect?:         string;         // Flux aspect ratio (e.g. "4:5", "9:16"); composition matches it
}): Promise<{ ok: true; prompt: string } | { ok: false; error: string }> {
  try {
    const client = new Anthropic();
    const occupationLine = args.occupation && args.occupation.trim().length > 0
      ? `תחום עיסוק: ${args.occupation.trim()}`
      : "תחום עיסוק: לא נמסר. השתמש בכלי המרכזי כדי להסיק את הסצנה.";

    const aspectHint = ASPECT_HINT[args.aspect ?? "4:5"] ?? "vertical 4:5 portrait";

    const userMessage = [
      occupationLine,
      "",
      `האות: ${args.signal}`,
      `הכיוון שאליו האות מצביע: ${args.signal_promise}`,
      `האלמנט: ${args.element}`,
      `הכלי המרכזי: ${args.central_tool}`,
      "",
      `Visual style directive: ${STYLE_DIRECTIVES[args.style]}`,
      `Target frame: ${aspectHint}`,
      "",
      "Write the Flux prompt now. Output the prompt text only.",
    ].join("\n");

    const res = await client.messages.create({
      model:      MODEL,
      max_tokens: MAX_TK,
      system:     SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = res.content[0];
    if (!block || block.type !== "text") {
      return { ok: false, error: "Claude returned non-text block" };
    }
    const prompt = block.text.trim();
    if (prompt.length < 40) {
      return { ok: false, error: `Prompt too short: ${prompt.length} chars` };
    }
    return { ok: true, prompt };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

export function isValidStyle(s: string): s is VisualStyle {
  return s === "editorial" || s === "warm" || s === "minimal" || s === "luminous";
}

export const DEFAULT_STYLE: VisualStyle = "editorial";
