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

// Four MODERN, people-free moods (2026 art-directed material realism, not
// emulated vintage photography). Keys kept stable for the codebase.
const STYLE_DIRECTIVES: Record<VisualStyle, string> = {
  // TONAL STILL — refined contemporary still life (default)
  editorial:
    "Refined contemporary still life, design-monograph aesthetic. One hero object, or two to three tonally-matched objects, on a matte textured surface (microcement, raw plaster, travertine, linen). " +
    "Clean digital capture, tack-sharp, high micro-contrast, crisp commercial product photography. " +
    "Soft bright diffused daylight, low contrast, gentle soft shadows that describe material. " +
    "Tonal low-saturation palette in one warm-neutral family (bone, oat, greige, clay) with a single restrained accent. Quiet, gallery-like, generous negative space.",
  // SOFT GRADIENT FIELD — atmosphere over object
  warm:
    "Clean dimensional soft gradient or color field, modern fragrance and skincare campaign aesthetic. Mostly atmosphere and surface with one subtle tactile gesture (a soft fold of linen, a frosted-glass plane, a gentle light bloom). " +
    "Smooth grain-free dimensionality, bright and airy. Palette of one or two soft warm hues blending (sand to cream, blush, butter, pale sage). Calm, weightless, premium.",
  // STUDIO PLASTER
  minimal:
    "Daylit studio with a curved matte plaster or microcement backdrop in bone or pale clay. One sculptural object or material sample. " +
    "Soft north-facing window light, long gentle soft shadows across the textured wall. Clean digital capture, tack-sharp. " +
    "Palette: oat, plaster-white, putty, one muted accent. Contemporary product-launch feel, vast calm field.",
  // SUNLIGHT & ARCHITECTURE
  luminous:
    "Real architectural daylight: a crisp hard-edged sun shape projected across a warm-neutral plaster wall, a windowsill or table edge, one material catching the sun. " +
    "Clean geometric light-and-shadow, bright and airy. Clean digital capture, tack-sharp. " +
    "Palette: warm white, sand, soft shadow-blue. Mediterranean design-studio at mid-morning, optimistic and current.",
};

const MODEL  = "claude-sonnet-4-6";
const MAX_TK = 600;

const SYSTEM_PROMPT = `You are a contemporary brand art director writing image-generation prompts for Black Forest Labs Flux 1.1 Pro Ultra. The look is MODERN and current (2026): art-directed material realism, not emulated vintage photography. Premium reads through CLARITY, clean bright light, and real matte materials — never through grain, darkness, drama, or film emulation.

Your job: given a Hebrew personal-brand signal, the person's occupation (in Hebrew), and a visual style directive, write ONE English Flux prompt (90-150 words) for a premium, people-free, social-media background.

NON-NEGOTIABLE QUALITY BAR — every prompt must specify, by name, all four of:

1. **A clean DIGITAL capture** (modern mirrorless or digital back, e.g. Sony A1 with 50mm f/2.8, or Phase One IQ4 150MP), tack-sharp, high micro-contrast, crisp commercial photography. NEVER film, analog, grain, or "shot on film".
2. **Bright, soft, diffused DAYLIGHT** (large north-window light, overcast softbox, or high-key studio), low contrast, gentle soft shadows that describe material. NEVER a dramatic single hard source, moody darkness, candlelight, or vignette.
3. **Real MATTE TACTILE MATERIALS + a modern palette.** Surfaces like matte plaster, microcement, raw linen, unglazed ceramic, travertine, pale oak, brushed aluminium, frosted glass. A tonal low-saturation warm-neutral palette (bone, oat, plaster, sand, greige, clay) with ONE restrained accent (sage, terracotta, dusty blue, butter, ink-blue). NEVER navy+gold+charcoal, sepia/amber wash, or glossy gold-marble luxury.
4. **An occupation-literate, people-free scene.** Translate the field into ONE signature material/object/space, in the modern language above. Marketer (משווק) → a clean desk-plane, structured paper, an architectural pen, a faint grid. Therapist (מטפלת) → a linen fold, unglazed ceramic, a single leaf shadow on plaster. Chef (שף) → one raw ingredient or a matte ceramic plate on a microcement counter. Architect (אדריכל) → travertine, a small maquette, refined shadow geometry. Keep it to ONE hero idea, never a cluttered desk.

The image embodies the signal's emotional truth (not its literal words) WITHOUT any people: building when no one believes → a single small form against a vast calm field. Use objects, space, light, texture. Never a person.

**Composition:** ONE hero subject in the upper 55% of the frame. The lower 45% is a quiet, low-detail, near-uniform field (a plain wall, a smooth surface, a gentle gradient) so overlaid text stays legible. A subtle honest light falloff toward the bottom is good; never a dark void or a busy lower third.

**Target frame:** the user message gives a "Target frame" (e.g. 4:5 portrait). Compose explicitly for it.

**Hard constraint, append VERBATIM at the very end:**
"No people, no human figures, no faces, no hands. No text, no letters, no logos, no watermarks. No film grain, no vintage, no sepia, no vignette, no moody darkness, no dramatic single-source light, no glossy luxury cliche, no HDR, no clutter."

Output: ONLY the prompt text. No preamble, no explanation, no quotes. One block of prose, 90-150 words, ending with the constraint sentence.`;

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
