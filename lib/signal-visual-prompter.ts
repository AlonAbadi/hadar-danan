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
import { assignTerritory, territoryDirective, SHARED_NEGATIVES } from "@/lib/signal/color-worlds";

export type VisualStyle = "editorial" | "warm" | "minimal" | "luminous";

// Photographic flavors — they only tune the LIGHT, never force color. The scene
// (from color-worlds) and its natural palette carry the variety. Keys kept stable.
const STYLE_DIRECTIVES: Record<VisualStyle, string> = {
  editorial: "Cinematic editorial photography — rich, dimensional, gorgeous natural light, modern and alive.",
  warm:      "Warm sun-kissed natural-light photography — golden, hopeful, soft and inviting.",
  minimal:   "Clean, airy, light-filled photography — calm and spacious, soft abundant daylight.",
  luminous:  "Luminous atmospheric photography — soft haze and gentle glow, fresh and current.",
};

const MODEL  = "claude-sonnet-4-6";
const MAX_TK = 600;

const SYSTEM_PROMPT = `You are a world-class cinematographer writing image prompts for Black Forest Labs Flux 1.1 Pro Ultra. Each image is the background of an Instagram post — a UNIQUE, ORIGINAL, SURPRISING cinematic scene that feels like real contemporary high-end cinematography worthy of a luxury brand campaign or award-winning editorial photography.

SUBJECT IS UNCONSTRAINED: the scene may come from absolutely any real-world environment, object, material, architecture, interior, exterior, weather condition, surface, light interaction, or unexpected visual moment. Prioritize ORIGINALITY and visual beauty. Every prompt should feel fresh and surprising — never the obvious or generic choice.

Write ONE English Flux prompt (90-150 words) that bakes in ALL of the following:

CINEMATOGRAPHY (mandatory): shot as real high-end cinema photography; ARRI Alexa / Sony Venice visual quality; 35mm, 50mm or 85mm prime-lens aesthetics; natural lens compression; believable shallow depth of field.

COMPOSITION: editorial framing; layered depth with clear foreground, midground and background separation; strong visual balance with intentional asymmetry; deliberate NEGATIVE SPACE suitable for a text overlay (keep one calm, low-detail, softly-lit area — ideally the vertical center band — clear for Hebrew text).

LIGHTING: beautiful motivated lighting from natural or practical sources; soft diffusion; realistic shadow falloff; subtle halation and bloom; occasional volumetric atmosphere.

TEXTURE: visible micro-detail; real-world materials; tactile surfaces; subtle imperfections; fine cinematic film grain.

COLOR: premium modern cinematic color grading; soft highlight rolloff; rich but controlled contrast; tasteful color separation; a warm-neutral emotional palette (let each card carry its own natural colors — never one uniform hue across the set).

MOOD: modern, positive, emotionally intelligent, elegant, alive, human, premium. Let the signal in the user message inform the EMOTION/mood only — never illustrate it literally.

HARD RULES: no people, no faces, no human figures. No artificial CGI look, no 3D-render look, no stock-photo aesthetic, no over-processed AI imagery.

**Target frame:** compose explicitly for the "Target frame" given in the user message (e.g. 4:5 portrait).

**Negatives:** end your prompt by appending, verbatim, the NEGATIVE BLOCK provided in the user message.

Output: ONLY the prompt text. No preamble, no explanation, no quotes. One block of prose, 90-150 words, ending with the negative block.`;

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
  cardIndex?:      number;         // 0-6 — which of the 7 cards (drives color value + concept variation)
}): Promise<{ ok: true; prompt: string } | { ok: false; error: string }> {
  try {
    const client = new Anthropic();
    const occupationLine = args.occupation && args.occupation.trim().length > 0
      ? `תחום עיסוק: ${args.occupation.trim()}`
      : "תחום עיסוק: לא נמסר. השתמש בכלי המרכזי כדי להסיק את הסצנה.";

    const aspectHint = ASPECT_HINT[args.aspect ?? "4:5"] ?? "vertical 4:5 portrait";

    // Each card springs from a DIFFERENT broad territory (varied per card +
    // varied between people); the model invents an original cinematic scene.
    const cardIndex = args.cardIndex ?? 0;
    const territory = assignTerritory(args.occupation, args.signal, cardIndex);
    const territoryBlock = territoryDirective(territory);

    const userMessage = [
      occupationLine,
      "",
      `The signal (for emotional MOOD only — let it inform the feeling, do NOT illustrate it literally): ${args.signal}`,
      `Its direction: ${args.signal_promise}`,
      "",
      `Photographic flavor: ${STYLE_DIRECTIVES[args.style]}`,
      "",
      territoryBlock,
      "",
      `This is card #${cardIndex + 1} of 7 for this person — make it genuinely different from a typical card: a fresh, surprising, original scene with its own natural colors.`,
      `Target frame: ${aspectHint}`,
      "",
      `NEGATIVE BLOCK — append this verbatim as the final sentences of your prompt: "${SHARED_NEGATIVES}"`,
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
