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

const STYLE_DIRECTIVES: Record<VisualStyle, string> = {
  editorial:
    "Magazine editorial photography. Hasselblad H6D-100c with 85mm f/1.4 wide open. " +
    "Dramatic single-source lighting (Profoto strobe through a softbox left, warm tungsten rim right). " +
    "Rich dimensional shadows — never muddy black. Kodak Portra 800 push-1 grain. Vogue cover quality. " +
    "Palette: deep navy, warm charcoal, gold rim light, cream highlights.",
  warm:
    "Documentary lifestyle photography. Leica M11 with 50mm Summilux f/1.4. " +
    "Golden-hour natural light, warm earth tones, lived-in textures. " +
    "Kodak Portra 400 film — natural skin tones, gentle grain, subtle halation. " +
    "Aperture Magazine feel: quiet observed moments, unposed composition.",
  minimal:
    "Fine-art still-life photography. Phase One IQ4 150MP with 80mm leaf-shutter, f/8. " +
    "Single soft directional light on a clean backdrop (raw concrete, pale plaster, linen). " +
    "Mostly monochromatic with one quiet accent color, generous negative space, asymmetric. " +
    "Hiroshi Sugimoto or Wolfgang Tillmans sensibility — restraint as elegance.",
  luminous:
    "Bright lifestyle photography, Kinfolk magazine cover energy. " +
    "Hasselblad X2D 100c with 55mm XCD, slightly overexposed for an airy feel. " +
    "Abundant overcast daylight OR sun-flooded interior with soft window glow. " +
    "Kodak Ektar 100 — luminous color, gentle blooming highlights. " +
    "Palette: cream, soft gold, peach blush, dusty sky blue, fresh white. " +
    "Sun flares, dust motes catching light. Optimistic, hopeful, weightless. " +
    "The entire frame stays bright and open — no dark vignettes anywhere.",
};

const MODEL  = "claude-sonnet-4-6";
const MAX_TK = 600;

const SYSTEM_PROMPT = `You are a brand-photography art director writing image-generation prompts for Black Forest Labs Flux 1.1 Pro Ultra — the highest-fidelity photographic model available in 2026.

Your job: given a Hebrew personal-brand signal, the person's occupation (in Hebrew), and a visual style directive, write ONE English Flux Ultra prompt (90-150 words) that produces a premium, social-media-ready image suitable for a personal-brand magazine cover.

NON-NEGOTIABLE QUALITY BAR — every prompt must specify, by name, all four of:

1. **A specific camera body + lens** (e.g. Hasselblad H6D-100c, 85mm f/1.4). Pull from the style directive verbatim if it names one.
2. **A specific lighting setup** (e.g. golden-hour rim light + softbox fill, single-source window light, overcast diffusion, sun-flooded interior). Match the style's mood.
3. **A specific film stock or processing reference** (e.g. Kodak Portra 400, Fuji 400H, Ektar 100, Ektachrome). Match the style.
4. **An occupation-literate scene.** A marketer (משווק) → data dashboards, urban office, abstract growth — not a generic person. A potter (קדר) → clay, wheel, studio hands. A coach (מאמן) → boardroom, mountain horizons. A therapist → soft intimate space. Match the field's visual vocabulary.

The image must also embody the signal's emotional truth (not its literal words): building when no one believes → a lone figure against impossible scale; reading silence → a contemplative still life lit by a single window.

**Composition rule:** the lower half of the frame must stay visually CALMER (less detail, softer focus) but never dark or empty — text will be overlaid there and we want a premium magazine feel, not a black void.

**Composition for the target frame:** the user message gives a "Target frame" (e.g. 4:5 portrait, 9:16 vertical, wide banner). Compose explicitly for it — a portrait frame wants a vertical subject with calmer space in the lower third; a wide banner wants a horizontal scene with the subject off-center. Never compose for a square if a different frame is requested.

**Hard constraint, append VERBATIM at the very end:**
"No text, no letters, no words, no logos, no watermarks, no captions, no signage. No close-up faces directly toward the camera."

Output: ONLY the prompt text. No preamble, no explanation, no quotes around it. One block of prose, 90-150 words, ending with the constraint sentence.`;

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
