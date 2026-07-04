// THROWAWAY broadcast-room spike route — proves Hebrew RTL caption burning
// (libass + fribidi + vendored Assistant) works in a deployed Vercel function.
// Deleted after the spike gate passes. Not linked anywhere.
import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statfsSync, writeFileSync } from "node:fs";
import path from "node:path";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const SPIKE_KEY = "br-spike-9c41e7a2f08d";
const RLM = "‏";

function resolveFfmpeg(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bundled = require("ffmpeg-static") as string;
  try {
    execFileSync(bundled, ["-version"], { stdio: "ignore" });
    return bundled;
  } catch {
    const tmp = "/tmp/ffmpeg";
    if (!existsSync(tmp)) {
      copyFileSync(bundled, tmp);
      chmodSync(tmp, 0o755);
    }
    return tmp;
  }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== SPIKE_KEY) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const report: Record<string, unknown> = {};
  const dir = "/tmp/br-spike";
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  try {
    const ffmpeg = resolveFfmpeg();
    report.ffmpeg_path = ffmpeg;

    const buildconf = execFileSync(ffmpeg, ["-buildconf"], { encoding: "utf8" });
    report.libs = Object.fromEntries(
      ["libass", "libfribidi", "libharfbuzz", "libfreetype", "fontconfig"].map((l) => [
        l,
        buildconf.includes(`enable-${l}`),
      ])
    );

    try {
      const s = statfsSync("/tmp");
      report.tmp_free_mb = Math.round((s.bavail * s.bsize) / 1048576);
    } catch { /* best effort */ }

    const fontsDir = path.join(process.cwd(), "assets", "broadcast", "fonts");
    report.fonts_dir = fontsDir;
    report.fonts_present = existsSync(path.join(fontsDir, "Assistant-Regular.ttf"));

    // Objective bidi test: first logical word RED, second WHITE; trailing period GREEN.
    // Correct RTL: red right of white; green period at visual LEFT end of its line.
    const ass = `﻿[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: T,Assistant,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,2,90,90,700,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:03.00,T,,0,0,0,,${RLM}{\\1c&H0000FF&}ראשון{\\1c&HFFFFFF&} אחרון
Dialogue: 0,0:00:00.00,0:00:03.00,T,,0,0,300,,${RLM}שלך{\\1c&H00FF00&}.
`;
    const assPath = path.join(dir, "test.ass");
    writeFileSync(assPath, ass, "utf8");

    const raw = path.join(dir, "out.raw");
    const t0 = Date.now();
    execFileSync(ffmpeg, [
      "-y", "-loglevel", "error",
      "-f", "lavfi", "-i", "color=c=black:s=1080x1920:d=1:r=1",
      "-vf", `ass=${assPath}:fontsdir=${fontsDir}`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", raw,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    report.burn_ms = Date.now() - t0;

    const data = readFileSync(raw);
    const W = 1080;
    const band = (y0: number, y1: number) => {
      let rs = 0, rn = 0, ws = 0, wn = 0, gs = 0, gn = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 3;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 180 && g < 80 && b < 80) { rs += x; rn++; }
          else if (r > 180 && g > 180 && b > 180) { ws += x; wn++; }
          else if (g > 180 && r < 80 && b < 80) { gs += x; gn++; }
        }
      }
      return {
        red: rn ? rs / rn : null,
        white: wn ? ws / wn : null,
        green: gn ? gs / gn : null,
      };
    };
    const l1 = band(1050, 1250);
    const l2 = band(1450, 1650);
    report.line1 = l1;
    report.line2 = l2;
    const bidiOk = l1.red !== null && l1.white !== null && l1.red > l1.white;
    const punctOk = l2.green !== null && l2.white !== null && l2.green < l2.white;
    const glyphsOk = (l1.red ?? 0) > 0; // any red pixels at all = Hebrew glyphs rendered
    report.checks = {
      bidi_first_word_on_right: bidiOk,
      trailing_period_on_left: punctOk,
      hebrew_glyphs_rendered: glyphsOk,
    };
    report.pass = bidiOk && punctOk && glyphsOk;
    return NextResponse.json(report);
  } catch (e) {
    const err = e as { message?: string; stderr?: Buffer };
    report.error = err.message?.slice(0, 500);
    report.stderr_tail = err.stderr ? String(err.stderr).slice(-2000) : undefined;
    return NextResponse.json(report, { status: 500 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
