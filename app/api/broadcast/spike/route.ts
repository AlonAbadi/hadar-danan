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
  // require("ffmpeg-static") returns a path anchored to the bundler's fake
  // __dirname ("/ROOT/..."); the traced file actually lives under cwd.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fromRequire = require("ffmpeg-static") as string;
  const candidates = [
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    fromRequire,
  ];
  const bundled = candidates.find((p) => existsSync(p));
  if (!bundled) throw new Error(`ffmpeg binary not found; tried ${candidates.join(", ")}`);
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

    // Objective single-run bidi tests (spike lesson: override tags and letter
    // spacing split libass runs and corrupt the measurement — production lines
    // are single-run, so the tests must be too). Encoding: -1 enables per-line
    // direction autodetection, the fix this spike exists to prove on linux.
    // Cluster widths identify tokens: 6 shins ~240px, digits ~55px, period ~9px.
    const CASES: { tag: string; text: string; check: string }[] = [
      { tag: "order", text: "שששששש א", check: "wide_first_word_right" },
      { tag: "trail", text: "שששששש.", check: "trailing_period_left" },
      { tag: "dlead", text: "12 שששששש", check: "leading_digits_right" },
      { tag: "latmid", text: "שששששש AI אאא", check: "latin_mid_order" },
    ];
    const W = 1080;
    const clustersOf = (raw: Buffer, minGap: number) => {
      const cols = new Array<number>(W).fill(0);
      for (let y = 1100; y < 1240; y++) {
        for (let x = 0; x < W; x++) {
          if (raw[(y * W + x) * 3] > 140) cols[x]++;
        }
      }
      const cl: { w: number; c: number }[] = [];
      let start = -1;
      let gap = 0;
      for (let x = 0; x < W; x++) {
        if (cols[x] > 0) {
          if (start < 0) start = x;
          gap = 0;
        } else if (start >= 0 && ++gap >= minGap) {
          cl.push({ w: x - gap - start, c: Math.round((start + x - gap) / 2) });
          start = -1;
        }
      }
      if (start >= 0) cl.push({ w: W - start, c: Math.round((start + W) / 2) });
      return cl.sort((a, b) => a.c - b.c);
    };

    const checks: Record<string, boolean> = {};
    const clusterReport: Record<string, { w: number; c: number }[]> = {};
    const t0 = Date.now();
    for (const c of CASES) {
      const assPath = path.join(dir, `${c.tag}.ass`);
      writeFileSync(
        assPath,
        `﻿[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: T,Assistant,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,2,90,90,700,-1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:03.00,T,,0,0,0,,${RLM}${c.text}
`,
        "utf8"
      );
      const raw = path.join(dir, `${c.tag}.raw`);
      execFileSync(ffmpeg, [
        "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", "color=c=black:s=1080x1920:d=1:r=1",
        "-vf", `ass=${assPath}:fontsdir=${fontsDir}`,
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", raw,
      ], { stdio: ["ignore", "pipe", "pipe"] });
      const cl = clustersOf(readFileSync(raw), c.tag === "trail" ? 6 : 12);
      clusterReport[c.tag] = cl;
      if (c.tag === "order") {
        // wide (first logical word) must be the rightmost cluster
        checks[c.check] = cl.length === 2 && cl[1].w > cl[0].w;
      } else if (c.tag === "trail") {
        // tiny period cluster must sit left of the word cluster
        const tiny = cl.reduce((a, b) => (a.w < b.w ? a : b), cl[0]);
        const word = cl.reduce((a, b) => (a.w > b.w ? a : b), cl[0]);
        checks[c.check] = cl.length >= 2 && tiny.c < word.c;
      } else if (c.tag === "dlead") {
        // narrow digit cluster must be the rightmost
        checks[c.check] = cl.length === 2 && cl[1].w < cl[0].w;
      } else {
        // latmid — correct RTL display (L->R): aleph triple | AI | shins.
        // aleph (~108px) leftmost; the narrow AI (~46px) in the middle; the
        // shins bulk (>=180px combined, may split into sub-clusters) right of AI.
        const ai = cl.reduce((a, b) => (a.w < b.w ? a : b), cl[0]);
        const rightBulk = cl.filter((k) => k.c > ai.c).reduce((n, k) => n + k.w, 0);
        checks[c.check] =
          cl.length >= 3 && cl[0].w > 60 && cl[0].w < 160 && ai.c > cl[0].c && rightBulk >= 180;
      }
    }
    report.burn_ms = Date.now() - t0;
    report.clusters = clusterReport;
    report.checks = checks;
    report.pass = Object.values(checks).every(Boolean);
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
