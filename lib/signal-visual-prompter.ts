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
import { assignScene, sceneDirective, SHARED_NEGATIVES } from "@/lib/signal/color-worlds";

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

const SYSTEM_PROMPT = `You are a world-class photography art director writing image prompts for Black Forest Labs Flux 1.1 Pro Ultra. Each image is the background of an Instagram quote card (4:5) — a BEAUTIFUL, HIGH-QUALITY, CINEMATIC, PEOPLE-FREE REAL PHOTOGRAPH. Think premium editorial / nature / architectural photography: rich, dimensional, gorgeous natural light. Modern 2026 — never antique, never film/vintage, never flat abstract color.

Your job: given a Hebrew personal-brand signal (their differentiation), their promise and field, plus a SCENE FOUNDATION, write ONE English Flux prompt (90-150 words) for a stunning real photograph.

METHOD:
1. START FROM THE SCENE FOUNDATION given in the user message — that scene + its natural palette + its light are the foundation, and the source of this card's color (each of the 7 cards has a different scene, so the set is varied, never one uniform hue).
2. BEND THE SCENE to embody the signal's EMOTIONAL TRUTH (not its literal words): e.g. "clarity that quiets the noise" -> first light breaking softly over still water; "patient growth" -> dawn warming a field. The scene should feel like the signal, while staying a real photographic place.
3. LIGHT IS THE HERO and it is generous — rising, spreading, warming, breaking through. Positive, alive, hopeful. Never moody darkness, never flat shadowless light.
4. REAL PHOTOGRAPHY, never a staged single prop object, never flat color or a plain gradient, never a mosaic. A real place, with depth, atmosphere and natural color.

CALM LIGHT ZONE FOR TEXT (critical): keep the vertical center band (about 38%-82% of the height) the LIGHTEST, softest, lowest-detail area — open sky, soft water, a wash of light, gentle haze — so dark Hebrew quote text overlaid there reads crisp. Push the richer detail to the top and bottom.

ABSOLUTELY NO PEOPLE: no person, face, silhouette, profile, portrait, head, bust, statue, or mosaic-of-a-face. If the scene could imply a figure, remove it.

**Target frame:** the user message gives a "Target frame" (e.g. 4:5 portrait). Compose explicitly for it.

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

    // Each card gets a DISTINCT real-photography scene (varied per card +
    // varied between people). Color comes from the scene's natural palette,
    // never one forced uniform hue.
    const cardIndex = args.cardIndex ?? 0;
    const scene = assignScene(args.occupation, args.signal, cardIndex);
    const sceneBlock = sceneDirective(scene);

    const userMessage = [
      occupationLine,
      "",
      `האות: ${args.signal}`,
      `הכיוון שאליו האות מצביע: ${args.signal_promise}`,
      `האלמנט: ${args.element}`,
      `הכלי המרכזי: ${args.central_tool}`,
      "",
      `Photographic flavor: ${STYLE_DIRECTIVES[args.style]}`,
      "",
      sceneBlock,
      "",
      `This is card #${cardIndex + 1} of 7 for this person — its scene is already different from the others. Keep its natural colors (do NOT force one uniform hue across the set).`,
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
