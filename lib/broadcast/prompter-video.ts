// חדר השידור — floating teleprompter video (PiP over the native camera).
//
// iOS keeps Picture-in-Picture windows alive across app switches, so a real
// MP4 of the script scrolling at the chosen pace floats above the native
// camera app while she films — the only reliable way to prompt over native
// capture (canvas streams freeze when the page backgrounds; a real video
// does not). Rendered server-side with the same libass stack as the burn,
// cached per (user, video, wpm) in storage.
//
// r4 (expert-panel respec, 2026-07-20):
// - NO audio track (-an). A silent AAC track made WebKit hold an audio
//   session, and the native camera's record-start interruption paused the
//   PiP the moment she hit record. Video-only playback is immune.
// - 1280x720 @ 60fps, font 146px, ~15 chars/line, 3 visible lines — the
//   PiP window renders the video at 0.20-0.37x, so 146px lands at a
//   readable 22-41pt on screen (58px was a 12-16pt squint).
// - Timeline baked into the file (page JS is suspended while she films):
//   1s title card ("מקליטים? לחצו ▶") -> 3-2-1 countdown -> lead -> scroll
//   -> end card frozen for max(120s, 25% of scroll) so `ended` never fires
//   mid-take. The client enters PiP then pauses on the title card; she
//   starts it from the native PiP play button after recording begins.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { runFfmpeg, scratchDir, scratchCleanup, FONTS_DIR } from "./ffmpeg";

const BUCKET = "broadcast-takes";
const W = 1280;
const H = 720;
const FONT_SIZE = 146;
const LINE_H = 200;
const CHARS_PER_LINE = 15; // Hebrew at 146px inside ~1152px of usable width
const CHARS_PER_LINE_EN = 19; // Latin glyphs run narrower at the same size
const TITLE_MS = 1000;
const COUNT_MS = 3000; // 3 -> 2 -> 1, one second each
const LEAD_MS = 1200; // after the countdown, a beat before the first line hits
const READ_LINE_Y = 260; // line 2 of 3 — classic upper-third read point

function estHeight(text: string, charsPerLine: number): number {
  return Math.max(1, Math.ceil(text.length / charsPerLine)) * LINE_H;
}

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
  language?: "he" | "en"; // default he — Hebrew renders keep their cache keys
}

export function prompterStoragePath(spec: PrompterSpec): string {
  // r4: no-audio, 720p60, giant type, baked title/countdown/end cards.
  const langSuffix = spec.language === "en" ? "-en" : "";
  return `${spec.authPrefix}/prompter/v${spec.videoNumber}-w${spec.wpm}-r4${langSuffix}.mp4`;
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

  const en = spec.language === "en";
  const hook = spec.hook.replace(/\s+/g, " ").trim();
  const body = (spec.body ?? "").replace(/\s+/g, " ").trim();
  const cta = (spec.cta ?? "").replace(/\s+/g, " ").trim();
  const charsPerLine = en ? CHARS_PER_LINE_EN : CHARS_PER_LINE;
  const words = [hook, body, cta].filter(Boolean).join(" ").split(" ").length;
  const scrollMs = Math.round((words / spec.wpm) * 60_000);
  const scrollStart = TITLE_MS + COUNT_MS + LEAD_MS;
  const scrollEnd = scrollStart + scrollMs;
  // Frozen end-card tail: long enough that `ended` never fires mid-take.
  const tailMs = Math.max(120_000, Math.round(scrollMs * 0.25));
  const durationMs = scrollEnd + tailMs;

  // Neutral-plural copy (one cached render serves every member).
  const titleMain = en ? "Recording? Press ▶" : "מקליטים? לחצו ▶";
  const titleSub = en ? "-15 skips back" : "15- מחזיר אחורה";
  const endMain = en ? "Done! Stop filming" : "זהו! עוצרים את הצילום";
  const endSub = en ? "and tap “Use Video”" : "ולוחצים “השתמש בסרטון”";

  // Three stacked blocks (hook gold, body ivory, cta gold) moving in lockstep.
  // COLOR LIVES IN THE STYLE, never in override tags — the spike proved
  // {\c} tags split bidi runs and reverse Hebrew word order.
  const hookH = hook ? estHeight(hook, charsPerLine) : 0;
  const bodyH = body ? estHeight(body, charsPerLine) : 0;
  const ctaH = cta ? estHeight(cta, charsPerLine) : 0;
  const gap = Math.round(LINE_H * 0.35);
  const totalH = hookH + bodyH + ctaH + (body ? gap : 0) + (cta ? gap : 0);
  const travel = totalH + H + 80;

  const esc = (t: string) => t.replace(/\{/g, "(").replace(/\}/g, ")");
  const block = (style: string, text: string, offset: number): string => {
    const yStart = H + offset;
    return `Dialogue: 0,${assTime(scrollStart - LEAD_MS)},${assTime(durationMs)},${style},,0,0,0,,{\\move(${W / 2},${yStart},${W / 2},${yStart - travel},${LEAD_MS},${LEAD_MS + scrollMs})}${esc(text)}`;
  };
  const centered = (style: string, from: number, to: number, y: number, text: string): string =>
    `Dialogue: 1,${assTime(from)},${assTime(to)},${style},,0,0,0,,{\\pos(${W / 2},${y})}${esc(text)}`;

  const events: string[] = [];
  // Title card (frame 0 IS the poster/hold frame the client pauses on).
  events.push(centered("PTitle", 0, TITLE_MS, 250, titleMain));
  events.push(centered("PSub", 0, TITLE_MS, 470, titleSub));
  // Countdown digits.
  for (let i = 0; i < 3; i++) {
    events.push(centered("PCount", TITLE_MS + i * 1000, TITLE_MS + (i + 1) * 1000, 200, String(3 - i)));
  }
  // The scroll itself.
  let offset = 0;
  if (hook) { events.push(block("PHook", hook, offset)); offset += hookH + gap; }
  if (body) { events.push(block("PBody", body, offset)); offset += bodyH + gap; }
  if (cta) { events.push(block("PCta", cta, offset)); }
  // End card — frozen tail.
  events.push(centered("PTitle", scrollEnd, durationMs, 250, endMain));
  events.push(centered("PSub", scrollEnd, durationMs, 470, endSub));

  const ass = `﻿[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: PHook,Assistant,${FONT_SIZE},&H004AB9E8,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,3,0,8,64,64,0,-1
Style: PBody,Assistant,${FONT_SIZE},&H00E1E9ED,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,3,0,8,64,64,0,-1
Style: PCta,Assistant,${FONT_SIZE},&H004AB9E8,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,3,0,8,64,64,0,-1
Style: PTitle,Assistant,120,&H004AB9E8,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,3,0,5,64,64,0,-1
Style: PSub,Assistant,72,&H00E1E9ED,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,2,0,5,64,64,0,-1
Style: PCount,Assistant,340,&H004AB9E8,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,4,0,5,64,64,0,-1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join("\n")}
`;

  const dir = scratchDir(`prompter-${spec.videoNumber}-${spec.wpm}`);
  try {
    const assPath = path.join(dir, "prompter.ass");
    writeFileSync(assPath, ass, "utf8");
    const outPath = path.join(dir, "prompter.mp4");
    await runFfmpeg([
      "-f", "lavfi", "-i", `color=c=0x080C14:s=${W}x${H}:d=${(durationMs / 1000).toFixed(1)}:r=60`,
      "-an", // NO audio track — the record-start interruption fix (see header)
      "-vf",
      // ass renders every card + the moving blocks; the drawbox is the gold
      // read line at the upper-third mark, only during the scroll window.
      `ass=${assPath}:fontsdir=${FONTS_DIR}` +
        `,drawbox=x=24:y=${READ_LINE_Y}:w=${W - 48}:h=5:color=0xE8B94A@0.32:t=fill:enable='between(t,${((scrollStart - LEAD_MS) / 1000).toFixed(1)},${(scrollEnd / 1000).toFixed(1)})'`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
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
