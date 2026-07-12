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
// r3 (per Alon): the floating window opens WIDE (16:9 — a broad PiP strip),
// with big type and the in-page prompter's color language (gold hook/cta).
const W = 960;
const H = 540;
const FONT_SIZE = 58;
const LINE_H = Math.round(FONT_SIZE * 1.5);
const CHARS_PER_LINE = 27; // Hebrew at 58px inside ~860px of usable width
const CHARS_PER_LINE_EN = 34; // Latin glyphs run narrower at the same size
const LEAD_MS = 1200; // text starts below the window — a short beat, then it rises in
const TAIL_MS = 1500;
// The visible prompter strip (the rest of the frame is masked to background).
const WINDOW_TOP = 96;
const WINDOW_BOTTOM = 440;
const READ_LINE_Y = Math.round(WINDOW_TOP + (WINDOW_BOTTOM - WINDOW_TOP) * 0.33);
const BLOCK_GAP = Math.round(LINE_H * 0.35);

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
  // r3: wide window, big type, colored hook/cta — bust older caches.
  // English renders get their own suffix so cached Hebrew files never collide.
  const langSuffix = spec.language === "en" ? "-en" : "";
  return `${spec.authPrefix}/prompter/v${spec.videoNumber}-w${spec.wpm}-r3${langSuffix}.mp4`;
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

  const hook = spec.hook.replace(/\s+/g, " ").trim();
  const body = (spec.body ?? "").replace(/\s+/g, " ").trim();
  const cta = (spec.cta ?? "").replace(/\s+/g, " ").trim();
  const charsPerLine = spec.language === "en" ? CHARS_PER_LINE_EN : CHARS_PER_LINE;
  const words = [hook, body, cta].filter(Boolean).join(" ").split(" ").length;
  const scrollMs = Math.round((words / spec.wpm) * 60_000);
  const durationMs = LEAD_MS + scrollMs + TAIL_MS;

  // Three stacked blocks (hook gold, body ivory, cta gold) moving in lockstep.
  // COLOR LIVES IN THE STYLE, never in override tags — the spike proved
  // {\c} tags split bidi runs and reverse Hebrew word order.
  const hookH = hook ? estHeight(hook, charsPerLine) : 0;
  const bodyH = body ? estHeight(body, charsPerLine) : 0;
  const ctaH = cta ? estHeight(cta, charsPerLine) : 0;
  const totalH =
    hookH + bodyH + ctaH + (body ? BLOCK_GAP : 0) + (cta ? BLOCK_GAP : 0);
  const travel = totalH + (WINDOW_BOTTOM - WINDOW_TOP) + 60;

  const esc = (t: string) => t.replace(/\{/g, "(").replace(/\}/g, ")");
  const block = (style: string, text: string, offset: number): string => {
    const yStart = WINDOW_BOTTOM + offset;
    return `Dialogue: 0,${assTime(0)},${assTime(durationMs)},${style},,0,0,0,,{\move(${W / 2},${yStart},${W / 2},${yStart - travel},${LEAD_MS},${LEAD_MS + scrollMs})}${esc(text)}`;
  };
  const events: string[] = [];
  let offset = 0;
  if (hook) { events.push(block("PHook", hook, offset)); offset += hookH + BLOCK_GAP; }
  if (body) { events.push(block("PBody", body, offset)); offset += bodyH + BLOCK_GAP; }
  if (cta) { events.push(block("PCta", cta, offset)); }

  const ass = `\ufeff[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: PHook,Assistant,${FONT_SIZE},&H004AB9E8,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,2,0,8,40,40,0,-1
Style: PBody,Assistant,${FONT_SIZE},&H00E1E9ED,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,2,0,8,40,40,0,-1
Style: PCta,Assistant,${FONT_SIZE},&H004AB9E8,&H00FFFFFF,&H00140C08,&H00000000,1,0,0,0,100,100,0,0,1,2,0,8,40,40,0,-1

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
      "-f", "lavfi", "-i", `color=c=0x080C14:s=${W}x${H}:d=${(durationMs / 1000).toFixed(1)}:r=30`,
      "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
      "-shortest",
      "-vf",
      // ass renders the moving block; the drawboxes mask everything outside
      // the window strip; the last drawbox is the gold read line.
      `ass=${assPath}:fontsdir=${FONTS_DIR}` +
        `,drawbox=x=0:y=0:w=${W}:h=${WINDOW_TOP}:color=0x080C14:t=fill` +
        `,drawbox=x=0:y=${WINDOW_BOTTOM}:w=${W}:h=${H - WINDOW_BOTTOM}:color=0x080C14:t=fill` +
        `,drawbox=x=20:y=${READ_LINE_Y}:w=${W - 40}:h=3:color=0xE8B94A@0.75:t=fill`,
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
