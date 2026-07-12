// חדר השידור — ASS subtitle file generation for the libass burn.
//
// Times are written relative to trim start: the burn command uses -ss before
// -i, which resets timestamps to 0 (see lib/broadcast/burn.ts).
//
// ASS colors are &HAABBGGRR (BGR, alpha-first): #EDE9E1 -> &H00E1E9ED,
// #E8B94A (gold) -> &H004AB9E8, #080C14 outline at ~60% alpha -> &H99140C08.
//
// Bidi (spike-proven on this exact ffmpeg-static build): libass strips bidi
// control chars and hardcodes an LTR base direction UNLESS the style sets
// Encoding: -1, which enables per-line direction autodetection — that single
// field fixes trailing punctuation, digit-leading lines, and mid-line Latin
// tokens. The RLM prefix is kept as belt-and-suspenders for future builds
// that honor it (today it is stripped, harmlessly). Two hard rules proven by
// the spike: NEVER use per-line override tags ({\c}, {\fsp}) and NEVER a
// nonzero style Spacing — both split the text into runs laid out LTR.
import type { CaptionLine } from "./captions";

const RLM = "‏";

function assTime(ms: number): string {
  const clamped = Math.max(0, ms);
  const cs = Math.floor((clamped % 1000) / 10);
  const total = Math.floor(clamped / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function escapeAss(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "(").replace(/\}/g, ")").replace(/\n/g, " ");
}

export interface BuildAssOptions {
  trimStartMs: number;
  durationMs: number; // trimmed duration
  stamp: boolean;
  // Captions anchor TOP-CENTER (Alignment 8): MarginV is the distance from
  // the TOP of the canvas to the first caption line, so two-line captions
  // grow downward — matching Hadar's published-reel style (block slightly
  // below vertical center).
  captionMarginV?: number; // default ≈52.5% of canvas height
  stampMarginV?: number; // default 96
  // Output canvas — landscape full-frame outputs pass their own dims; type
  // scales off the canvas height so captions read the same at any aspect.
  playResX?: number; // default 1080
  playResY?: number; // default 1920
}

export function buildAss(lines: CaptionLine[], opts: BuildAssOptions): string {
  const events: string[] = [];

  if (opts.stamp) {
    events.push(
      `Dialogue: 0,${assTime(0)},${assTime(opts.durationMs)},Stamp,,0,0,0,,${RLM}מצולם, לא מיוצר`
    );
  }

  for (const line of lines) {
    if (line.deleted || !line.text.trim()) continue;
    const start = line.start_ms - opts.trimStartMs;
    const end = line.end_ms - opts.trimStartMs;
    if (end <= 0) continue;
    events.push(
      `Dialogue: 0,${assTime(start)},${assTime(Math.min(end, opts.durationMs))},Caption,,0,0,0,,${RLM}${escapeAss(line.text)}`
    );
  }

  const prX = opts.playResX ?? 1080;
  const prY = opts.playResY ?? 1920;
  const capMv = opts.captionMarginV ?? Math.round(prY * 0.525);
  const stampMv = opts.stampMarginV ?? 96;
  // Matched to Hadar's published reels (2026-07-12 examples): pure white,
  // heavy weight, thick solid-black outline, ~72px on a 1920 grid, block
  // sitting just below vertical center. Type scales with canvas height.
  const capFs = Math.round((72 * prY) / 1920);
  const capOutline = Math.max(3, Math.round((7 * prY) / 1920));
  const stampFs = Math.round((36 * prY) / 1920);
  return `﻿[Script Info]
ScriptType: v4.00+
PlayResX: ${prX}
PlayResY: ${prY}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Assistant,${capFs},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,${capOutline},0,8,60,60,${capMv},-1
Style: Stamp,Assistant,${stampFs},&H004AB9E8,&H00FFFFFF,&H66140C08,&H00000000,0,0,0,0,100,100,0,0,1,2,0,8,90,90,${stampMv},-1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join("\n")}
`;
}
