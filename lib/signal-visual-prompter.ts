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
    "Moody editorial photography. Deep cinematic palette (dark navy, charcoal, warm gold rim light). " +
    "Dramatic chiaroscuro lighting, shallow depth of field, film grain. Magazine-cover quality.",
  warm:
    "Natural documentary photography. Soft golden-hour lighting, warm earthy tones, " +
    "lifestyle/editorial feel. Authentic, lived-in, photo-realistic. Like a New York Times Magazine feature.",
  minimal:
    "Minimalist abstract composition. Clean geometric forms, monochromatic palette with one accent color, " +
    "lots of negative space, fine art photography sensibility. Like Wolfgang Tillmans or Hiroshi Sugimoto.",
  luminous:
    "Bright, joyful, optimistic photography. Abundant natural daylight, airy weightless atmosphere, " +
    "luminous pastel palette (cream, soft gold, peach, dusty sky blue, fresh white). Sun flares, " +
    "dust motes catching light, soft glow, hopeful and energetic mood. Like a Kinfolk magazine cover " +
    "or a modern Apple keynote still — premium and uplifting, never garish or oversaturated. " +
    "Important: keep the lower third of the frame brighter and softer (no dark vignettes there) so the " +
    "overall image reads as luminous, not moody.",
};

const MODEL  = "claude-sonnet-4-6";
const MAX_TK = 600;

const SYSTEM_PROMPT = `You are a brand-photography art director writing image-generation prompts for Black Forest Labs Flux 1.1 Pro.

Your job: given a Hebrew personal-brand signal (the "essence" of who a person is professionally), their occupation (in Hebrew), and a chosen visual style, write ONE English Flux prompt that produces a high-end social-media-ready square 1080×1080 image that:

1. **Visually reads the occupation immediately.** A marketer (משווק) gets data screens / urban office / abstract growth visualizations — NOT a generic person in a room. A potter (קדר) gets clay / wheel / studio hands. A coach (מאמן עסקי) gets boardroom / mountain horizons / strategic objects. A therapist gets soft warm intimate spaces. Match the field's visual vocabulary.

2. **Embodies the signal's emotional truth**, not its literal words. If the signal is about building when no one believes — you get a lone figure against impossible scale, or sunrise on an unfinished structure. If it's about reading silence — you get a contemplative still life or a single object lit by window light.

3. **Honors the chosen style directive** to the letter.

4. **Leaves the lower half of the frame compositionally empty** — that's where the Hebrew text overlay will sit.

Hard constraints you MUST end every prompt with verbatim:
"Square 1:1 composition. Significant negative space in the lower half. Strict: no text, no letters, no words, no logos, no watermarks, no captions, no signage, no people facing camera. Photorealistic, highly detailed, editorial quality, 8k."

Output: ONLY the prompt text itself. No preamble, no explanation, no quotes around it. One block of prose ending with the constraint sentence above. 80-160 words total.`;

export async function buildVisualPrompt(args: {
  signal:          string;       // The signal sentence (Hebrew)
  signal_promise:  string;       // The forward direction (Hebrew)
  element:         string;       // The element/talent zone (Hebrew)
  central_tool:    string;       // Their core practice (Hebrew)
  occupation?:     string | null; // Their field (Hebrew, optional)
  style:           VisualStyle;
}): Promise<{ ok: true; prompt: string } | { ok: false; error: string }> {
  try {
    const client = new Anthropic();
    const occupationLine = args.occupation && args.occupation.trim().length > 0
      ? `תחום עיסוק: ${args.occupation.trim()}`
      : "תחום עיסוק: לא נמסר. השתמש בכלי המרכזי כדי להסיק את הסצנה.";

    const userMessage = [
      occupationLine,
      "",
      `האות: ${args.signal}`,
      `הכיוון שאליו האות מצביע: ${args.signal_promise}`,
      `האלמנט: ${args.element}`,
      `הכלי המרכזי: ${args.central_tool}`,
      "",
      `Visual style directive: ${STYLE_DIRECTIVES[args.style]}`,
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
