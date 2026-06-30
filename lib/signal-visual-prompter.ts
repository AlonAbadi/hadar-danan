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
import { assignVisualLaw, SHARED_NEGATIVES } from "@/lib/signal/color-worlds";

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
const MAX_TK = 1000;

const SYSTEM_PROMPT = `You are not generating a beautiful image. You are translating a person's SIGNAL into a cinematic visual METAPHOR. Your task is to create ONE premium editorial-grade image that feels emotionally TRUE to the person's signal.

Do NOT illustrate the profession literally. Avoid cliches. No stock wellness imagery. No generic coaching visuals. No text overlays, no quotes. No obvious symbolism unless transformed into something visually sophisticated.

THINK IN THIS ORDER:

STEP 1 — Understand the signal. Read the SIGNAL DATA (pain source, core signal, promise, element, central tool, audience). Ask: what transformation happened inside this person?

STEP 2 — Extract the visual metaphor. Translate the transformation into ONE visual law — e.g. boundaries dissolving; light expanding; weightlessness; emerging from fog; a cracked surface opening; the hidden becoming visible; chaos becoming structure; frozen becoming fluid; pressure becoming breath. This metaphor is the HEART of the image.

STEP 3 — Decide the visual language: environment, lighting, camera distance, composition, physical tension, texture, movement.

The image must feel like LUXURY CINEMATIC PHOTOGRAPHY shot by a world-class art director — REAL photography, not AI fantasy art. Visual references: Vogue editorial photography, A24 cinematography, Apple cinematic campaigns, medium-format Hasselblad photography, natural material and skin realism.

STYLE RULES: prefer real-world physical scenes over surreal CGI; surreal elements only when emotionally justified. Human figures are allowed ONLY if anonymous — blurred, silhouetted, partially hidden, distant, or abstract enough to avoid identity; faces should rarely be visible. Emotion is carried by light, posture, texture, and space. Use negative space intelligently (keep one calm, softly-lit, low-detail area — ideally the vertical center band — clear for a Hebrew text overlay). Avoid over-staging. Avoid sentimentality. Avoid sadness unless the resolved signal is sadness. Generate TRANSFORMATION, not trauma.

The image must feel profound, contemporary, premium, emotionally intelligent, and culturally current (2026 visual language). FINAL TEST: someone seeing the image without text should FEEL the signal before understanding it.

OUTPUT — return ONLY a valid JSON object, no markdown, no preamble:
{"signal_summary": "<one sentence: the transformation inside this person>", "visual_metaphor": "<the one visual law this image obeys>", "image_prompt": "<one English paragraph, 80-140 words, for a photorealistic AI image model: the full cinematic scene with environment, lighting, lens, composition, texture and color grading, ending with the verbatim NEGATIVE BLOCK from the user message>"}`;

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
  pain_source?:    string;       // What they came from (Hebrew, optional)
  people?:         string;       // Their audience (Hebrew, optional)
  occupation?:     string | null; // Their field (Hebrew, optional)
  style:           VisualStyle;
  aspect?:         string;         // Flux aspect ratio (e.g. "4:5", "9:16"); composition matches it
  cardIndex?:      number;         // 0-6 — which of the 7 cards (seeds a distinct visual law)
}): Promise<{ ok: true; prompt: string } | { ok: false; error: string }> {
  try {
    const client = new Anthropic();
    const occupationLine = args.occupation && args.occupation.trim().length > 0
      ? `תחום עיסוק: ${args.occupation.trim()}`
      : "תחום עיסוק: לא נמסר. השתמש בכלי המרכזי כדי להסיק את הסצנה.";

    const aspectHint = ASPECT_HINT[args.aspect ?? "4:5"] ?? "vertical 4:5 portrait";

    // Seed a DISTINCT visual law per card so the 7 cards each express the
    // transformation differently (variety) and people diverge. The model still
    // derives its own metaphor from the signal — this is only a lean.
    const cardIndex = args.cardIndex ?? 0;
    const law = assignVisualLaw(args.occupation, args.signal, cardIndex);

    const userMessage = [
      "SIGNAL DATA:",
      args.occupation && args.occupation.trim() ? `- Field: ${args.occupation.trim()}` : "",
      args.pain_source && args.pain_source.trim() ? `- Pain source: ${args.pain_source.trim()}` : "",
      `- Core signal: ${args.signal}`,
      args.signal_promise ? `- Promise: ${args.signal_promise}` : "",
      args.element ? `- Element: ${args.element}` : "",
      args.central_tool ? `- Central tool: ${args.central_tool}` : "",
      args.people && args.people.trim() ? `- Audience: ${args.people.trim()}` : "",
      "",
      `This is card #${cardIndex + 1} of 7 for this person. For variety, lean this card's metaphor toward the transformation family of "${law.name}" — but only if it stays emotionally true to the signal; otherwise derive your own. Each card must feel distinct.`,
      `Photographic flavor: ${STYLE_DIRECTIVES[args.style]}`,
      `Target frame: ${aspectHint}`,
      "",
      `In the image_prompt, append this NEGATIVE BLOCK verbatim as the final sentences: "${SHARED_NEGATIVES}"`,
      "",
      "Now return ONLY the JSON object with signal_summary, visual_metaphor, and image_prompt.",
    ].filter(Boolean).join("\n");

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
    // Reason-before-generate: the model returns {signal_summary, visual_metaphor,
    // image_prompt}. Extract the image_prompt; fall back to raw text if the JSON
    // can't be parsed so a card never fails to render.
    const raw = block.text.trim();
    let prompt = raw;
    try {
      const jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const start = jsonText.indexOf("{");
      const end = jsonText.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(jsonText.slice(start, end + 1));
        if (parsed && typeof parsed.image_prompt === "string" && parsed.image_prompt.trim().length >= 40) {
          prompt = parsed.image_prompt.trim();
        }
      }
    } catch {
      // keep raw as fallback
    }
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
