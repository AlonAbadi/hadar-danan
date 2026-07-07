// חדר השידור — person-aware framing for landscape-captured takes.
//
// A blind center-crop beheads anyone who isn't standing dead-center (field
// case: a two-person take lost one speaker entirely). Before cropping a
// landscape source to 9:16, three sampled frames go to Claude vision for the
// horizontal span of every person; the crop centers on that span. If people
// are wider than a 9:16 window can hold, the caller falls back to the
// blur-pad. Detection failure of any kind degrades to the center crop —
// framing intelligence must never block a burn.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { runFfmpeg } from "./ffmpeg";

// Sonnet: bbox estimates from Haiku proved too coarse on small frames, and
// three thumbnails per burn cost fractions of a cent either way.
const MODEL = "claude-sonnet-4-6";

export interface PersonWindow {
  // Fractions of frame width — the union span of all detected persons.
  left: number;
  right: number;
  frames: number; // frames that contributed (observability)
}

// Samples up to 3 frames across the trimmed span (downscaled, cheap) and
// returns the union horizontal span of detected persons, or null when
// nothing is detected / the API is unavailable.
export async function detectPersonWindow(opts: {
  inputPath: string;
  scratchDir: string;
  trimStartMs: number;
  trimmedMs: number;
}): Promise<PersonWindow | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const fractions = [0.25, 0.5, 0.75];
    const images: string[] = [];
    for (let i = 0; i < fractions.length; i++) {
      const t = (opts.trimStartMs + opts.trimmedMs * fractions[i]) / 1000;
      const framePath = path.join(opts.scratchDir, `framing-${i}.jpg`);
      try {
        await runFfmpeg(
          ["-ss", t.toFixed(2), "-i", opts.inputPath, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "5", framePath],
          30_000
        );
        images.push(readFileSync(framePath).toString("base64"));
      } catch {
        // a missing sample frame is fine — we average what we have
      }
    }
    if (!images.length) return null;

    const anthropic = new Anthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            ...images.map((data) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
            })),
            {
              type: "text" as const,
              text:
                "These are frames from one selfie video. Locate every human FACE (head only, not shoulders or body). For each face give its horizontal bounds as precise fractions of the frame width measured from the LEFT edge (e.g. a head occupying the left quarter is {\"left\": 0.02, \"right\": 0.25}). Look carefully at each frame separately. Respond with ONLY this JSON, no prose: " +
                '{"frames": [{"faces": [{"left": 0.02, "right": 0.25}]}, ...]} — one entry per frame in order; "faces" is empty if none are visible in that frame.',
            },
          ],
        },
      ],
    });
    const text = res.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const faces: { left: number; right: number }[] = (Array.isArray(parsed.frames) ? parsed.frames : [])
      .flatMap((f: any) => (Array.isArray(f?.faces) ? f.faces : []))
      .filter(
        (b: any) =>
          typeof b?.left === "number" &&
          typeof b?.right === "number" &&
          b.right > b.left &&
          b.left >= 0 &&
          b.right <= 1 &&
          // a single head wider than half a landscape frame is a hallucination
          // wider than 70% of a landscape frame is not a head
          b.right - b.left < 0.7
      );
    if (!faces.length) return null;
    return {
      left: Math.min(...faces.map((s) => s.left)),
      right: Math.max(...faces.map((s) => s.right)),
      frames: faces.length,
    };
  } catch {
    return null;
  }
}
