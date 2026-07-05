// חדר השידור — floating teleprompter video (PiP over the native camera).
//
// iOS keeps Picture-in-Picture windows alive across app switches, so a real
// MP4 of the script scrolling at the chosen pace floats above the native
// camera app while she films — the only reliable way to prompt over native
// capture (canvas streams freeze when the page backgrounds; a real video
// does not). Rendered server-side with the same libass stack as the burn,
// cached per (user, video, wpm) in storage.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { runFfmpeg, scratchDir, scratchCleanup, FONTS_DIR } from "./ffmpeg";

const BUCKET = "broadcast-takes";
const W = 540;
const H = 960;
const FONT_SIZE = 46;
const LINE_H = Math.round(FONT_SIZE * 1.5);
const CHARS_PER_LINE = 16; // Hebrew at 46px inside ~460px of usable width
const LEAD_MS = 2500; // read the opening before it moves
const TAIL_MS = 1500;

function assTime(ms: number): string {
  const cs = Math.floor((ms % 1000) / 10);
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 3600)}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export interface PrompterSpec {
  authPrefix: string; // auth uid — storage path prefix
  videoNumber: number;
  wpm: number;
  hook: string;
  body: string;
  cta?: string;
}

export function prompterStoragePath(spec: PrompterSpec): string {
  return `${spec.authPrefix}/prompter/v${spec.videoNumber}-w${spec.wpm}.mp4`;
}

// Renders the scroll and uploads it; returns the storage path.
export async function renderPrompterVideo(spec: PrompterSpec): Promise<string> {
  const db = createServerClient() as any;
  const storagePath = prompterStoragePath(spec);

  // Cache hit? (same script content is implied by video number; a script
  // regen invalidates by version bump if ever needed)
  const dirName = storagePath.split("/").slice(0, -1).join("/");
  const fileName = storagePath.split("/").pop()!;
  const { data: existing } = await db.storage
    .from(BUCKET)
    .list(dirName, { search: fileName, limit: 1 });
  if (existing?.some((o: { name: string }) => o.name === fileName)) return storagePath;

  const text = [spec.hook, spec.body, spec.cta].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").length;
  const estLines = Math.max(3, Math.ceil(text.length / CHARS_PER_LINE));
  const textHeight = estLines * LINE_H;
  const scrollMs = Math.round((words / spec.wpm) * 60_000);
  const durationMs = LEAD_MS + scrollMs + TAIL_MS;

  // One dialogue block, top-center anchored, moved from below the read area
  // to fully past the top over the scroll window. libass wraps (WrapStyle 0)
  // and handles Hebrew bidi (Encoding -1, proven by the burn spike).
  const yStart = Math.round(H * 0.35);
  const yEnd = -(textHeight + 60);
  const ass = `﻿[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: P,Assistant,${FONT_SIZE},&H00EDE9E1,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,2,0,8,40,40,0,-1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,${assTime(0)},${assTime(durationMs)},P,,0,0,0,,{\\move(${W / 2},${yStart},${W / 2},${yEnd},${LEAD_MS},${LEAD_MS + scrollMs})}${text.replace(/\{/g, "(").replace(/\}/g, ")")}
`;

  const dir = scratchDir(`prompter-${spec.videoNumber}-${spec.wpm}`);
  try {
    const assPath = path.join(dir, "prompter.ass");
    writeFileSync(assPath, ass, "utf8");
    const outPath = path.join(dir, "prompter.mp4");
    await runFfmpeg([
      "-f", "lavfi", "-i", `color=c=0x080C14:s=${W}x${H}:d=${(durationMs / 1000).toFixed(1)}:r=30`,
      "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
      "-shortest",
      "-vf", `ass=${assPath}:fontsdir=${FONTS_DIR}`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "32k",
      "-movflags", "+faststart",
      outPath,
    ]);
    const { readFileSync } = await import("node:fs");
    const { error } = await db.storage
      .from(BUCKET)
      .upload(storagePath, readFileSync(outPath), { contentType: "video/mp4", upsert: true });
    if (error) throw new Error(`prompter:upload:${error.message}`);
    return storagePath;
  } finally {
    scratchCleanup(`prompter-${spec.videoNumber}-${spec.wpm}`);
  }
}
