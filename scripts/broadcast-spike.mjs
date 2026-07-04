// Broadcast Room risk spike: Hebrew RTL caption burning via libass + Assistant.
// Phase 1 (local): node scripts/broadcast-spike.mjs [optional-input.mp4]
// Pass criteria: correct bidi order, punctuation at visual left of RTL lines,
// Assistant glyphs, Santosha styling. Frames are written for eyeball inspection.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FONTS_DIR = path.join(ROOT, "assets", "broadcast", "fonts");
const OUT_DIR = "/tmp/broadcast-spike";
const RLM = "‏";

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

function run(args) {
  return execFileSync(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
}

// --- capability report ---
const buildconf = execFileSync(ffmpegPath, ["-buildconf"], { encoding: "utf8" });
const caps = ["libass", "libfribidi", "libharfbuzz", "libfreetype", "fontconfig"]
  .map((lib) => `${lib}: ${buildconf.includes(`enable-${lib}`) ? "yes" : "NOT IN BUILDCONF"}`);
console.log("[spike] buildconf:", caps.join(" | "));

// --- sample input (or real take passed as argv) ---
let input = process.argv[2];
if (!input || !existsSync(input)) {
  input = path.join(OUT_DIR, "sample.mp4");
  run([
    "-y",
    "-f", "lavfi", "-i", "color=c=0x141820:s=1080x1920:d=10:r=30",
    "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
    input,
  ]);
  console.log("[spike] generated sample input:", input);
}

// --- adversarial ASS fixture ---
// Colors are &HAABBGGRR (BGR): #EDE9E1 -> E1E9ED, #E8B94A -> 4AB9E8, #080C14 -> 140C08
const CASES = [
  { t: [0.5, 1.9], text: "זה לא עוד סרטון, זה האות שלך." },        // trailing period -> visual LEFT
  { t: [2.0, 3.4], text: "השיטה של TrueSignal עובדת" },             // embedded Latin token
  { t: [3.5, 4.9], text: "ב-2026 הכל משתנה" },                      // digits inside RTL
  { t: [5.0, 6.4], text: "97% מהנשים מרגישות את זה" },              // digit-leading line (RLM test)
  { t: [6.5, 7.9], text: "למה זה מרגיש ככה?" },                     // question mark -> visual LEFT
  { t: [8.0, 9.4], text: 'היא אמרה "אני מוכנה" בְּשֶׁקֶט' }, // quotes + nikud marks
];

const toAss = (s) => {
  const cs = Math.round((s % 1) * 100).toString().padStart(2, "0");
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${cs}`;
};

const ass = `﻿[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Assistant,66,&H00E1E9ED,&H00FFFFFF,&H99140C08,&H00000000,1,0,0,0,100,100,0,0,1,2,0,2,90,90,320,1
Style: CaptionGold,Assistant,66,&H004AB9E8,&H00FFFFFF,&H99140C08,&H00000000,1,0,0,0,100,100,0,0,1,2,0,2,90,90,320,1
Style: Stamp,Assistant,30,&H004AB9E8,&H00FFFFFF,&H99140C08,&H00000000,0,0,0,0,100,100,1,0,1,1,0,8,90,90,96,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,${toAss(0)},${toAss(10)},Stamp,,0,0,0,,${RLM}מצולם, לא מיוצר
${CASES.map((c, i) =>
  `Dialogue: 0,${toAss(c.t[0])},${toAss(c.t[1])},${i === 1 ? "CaptionGold" : "Caption"},,0,0,0,,${RLM}${c.text}`
).join("\n")}
`;

const assPath = path.join(OUT_DIR, "captions.ass");
writeFileSync(assPath, ass, "utf8");
console.log("[spike] wrote", assPath);

// --- burn ---
const out = path.join(OUT_DIR, "spike-out.mp4");
const t0 = Date.now();
try {
  run([
    "-y", "-i", input,
    "-vf", `ass=${assPath}:fontsdir=${FONTS_DIR}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    out,
  ]);
} catch (e) {
  console.error("[spike] BURN FAILED");
  console.error(String(e.stderr || e.message).slice(-2000));
  process.exit(1);
}
console.log(`[spike] burned ${out} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// --- frame per cue for eyeball inspection ---
for (let i = 0; i < CASES.length; i++) {
  const mid = (CASES[i].t[0] + CASES[i].t[1]) / 2;
  run(["-y", "-ss", String(mid), "-i", out, "-frames:v", "1", "-q:v", "2",
    path.join(OUT_DIR, `case-${i + 1}.jpg`)]);
}
// control render WITHOUT fontsdir — must differ if Assistant was actually used
const ctrl = path.join(OUT_DIR, "control-no-fontsdir.jpg");
try {
  run(["-y", "-i", input, "-vf", `ass=${assPath}`, "-frames:v", "1", "-ss", "1", "-q:v", "2", ctrl]);
} catch { /* a hard failure here is itself proof fontsdir matters */ }

console.log(`[spike] frames written to ${OUT_DIR} — inspect case-1..6.jpg`);
