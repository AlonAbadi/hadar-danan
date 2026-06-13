/**
 * Replicate API wrapper — generates a cinematic background image for the
 * signal-card PNG. Text composition (Hebrew signal sentence, bee logo,
 * attribution) happens entirely in the HCTI overlay layer afterwards, so we
 * never ask the AI model to render Hebrew text (every diffusion model on the
 * market today butchers Hebrew). The prompt explicitly says "no text, no
 * logos" and leaves negative space in the lower third for the HCTI overlay.
 *
 * Model: Flux 1.1 Pro Ultra by Black Forest Labs. 4MP native resolution
 * (2048×2048), best-in-class photorealism for premium brand assets.
 * ~6-9 second generation time, ~$0.06 per image.
 */

import Replicate from "replicate";

const MODEL = "black-forest-labs/flux-1.1-pro-ultra" as const;

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

// Flux 1.1 Pro supported aspect ratios per Black Forest Labs docs. For
// wider ratios (e.g. LinkedIn banner 4:1), generate at 16:9 and crop with
// background-size:cover in the HCTI container.
export type FluxAspectRatio = "1:1" | "9:16" | "16:9" | "2:3" | "3:2" | "4:5" | "5:4" | "21:9" | "9:21";

export async function generateBackgroundImage(
  prompt: string,
  aspectRatio: FluxAspectRatio = "1:1",
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  if (!isReplicateConfigured()) {
    return { ok: false, error: "REPLICATE_API_TOKEN not configured" };
  }

  const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    const output = await client.run(MODEL, {
      input: {
        prompt,
        aspect_ratio:     aspectRatio,
        output_format:    "png",
        safety_tolerance: 2,
        // raw=false → Ultra's polished cinematic look (raw=true is more like a
        // smartphone photo). For brand assets we always want polished.
        raw: false,
      },
    });

    // Flux SDK returns a FileOutput object whose .url() yields the CDN URL.
    // Some older clients return a plain string. Handle both.
    let url: string | null = null;
    if (typeof output === "string") {
      url = output;
    } else if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      url = typeof first === "string" ? first : null;
    } else if (output && typeof output === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fo = output as any;
      if (typeof fo.url === "function") {
        const u = fo.url();
        url = typeof u === "string" ? u : (u?.toString?.() ?? null);
      }
    }

    if (!url) return { ok: false, error: "No image URL in Replicate response" };
    return { ok: true, imageUrl: url };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/**
 * Translate a Hebrew signal extraction into an English cinematic prompt. The
 * goal isn't a literal illustration of the signal sentence — it's a *mood*
 * that resonates with the person's element + central tool, plus their
 * occupation as light context. Text overlay carries the actual message.
 */
export function buildBackgroundPrompt(args: {
  element:      string;
  central_tool: string;
  occupation?:  string | null;
}): string {
  const occupationLine = args.occupation && args.occupation.trim().length > 0
    ? ` Subject's role context: ${args.occupation.trim()}.`
    : "";

  return [
    "Cinematic photograph, moody and atmospheric.",
    "Deep cinematic palette: rich dark navy, deep charcoal, warm gold rim light.",
    `Visual essence (do not include literally as text): ${truncate(args.element, 220)}.`,
    `Practice or tool (visual mood, not literal): ${truncate(args.central_tool, 220)}.${occupationLine}`,
    "Shallow depth of field, soft film grain, golden hour rim lighting, volumetric haze.",
    "Square 1:1 composition. Significant negative space in the lower half for text overlay.",
    "Photo-realistic, highly detailed, editorial quality.",
    "Strict constraints: no text, no letters, no words, no logos, no watermarks, no captions, no signage. No people facing camera.",
  ].join(" ");
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max) + "...";
}
