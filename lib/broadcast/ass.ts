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

  // MarginV 320 keeps captions above the Reels UI zone; Stamp sits top-center.
  return `﻿[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Assistant,92,&H00E1E9ED,&H00FFFFFF,&H66140C08,&H00000000,1,0,0,0,100,100,0,0,1,4,1,2,70,70,340,-1
Style: Stamp,Assistant,36,&H004AB9E8,&H00FFFFFF,&H66140C08,&H00000000,0,0,0,0,100,100,0,0,1,2,0,8,90,90,96,-1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join("\n")}
`;
}
