// חדר השידור — ffmpeg process wrapper for the Vercel processing functions.
//
// The static binary ships via outputFileTracingIncludes (next.config.ts).
// /var/task is read-only on Vercel, so when the traced binary loses its exec
// bit we copy it once to /tmp (memoized — Fluid Compute reuses instances).
import { execFile } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

let resolvedBinary: string | null = null;

export function ffmpegPath(): string {
  if (resolvedBinary) return resolvedBinary;
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
    // Cheap exec-bit probe; throws EACCES when tracing stripped permissions.
    require("node:child_process").execFileSync(bundled, ["-version"], { stdio: "ignore" });
    resolvedBinary = bundled;
  } catch {
    const tmp = "/tmp/ffmpeg";
    if (!existsSync(tmp)) {
      copyFileSync(bundled, tmp);
      chmodSync(tmp, 0o755);
    }
    resolvedBinary = tmp;
  }
  return resolvedBinary;
}

export const FONTS_DIR = path.join(process.cwd(), "assets", "broadcast", "fonts");

export interface FfmpegResult {
  stderrTail: string;
}

// Runs ffmpeg, resolving on exit 0 and rejecting with the stderr tail
// (the single most valuable diagnostic — always captured for error_detail).
export function runFfmpeg(args: string[], timeoutMs = 480_000): Promise<FfmpegResult> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      ffmpegPath(),
      ["-hide_banner", "-y", ...args],
      { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        const stderrTail = String(stderr).slice(-2000);
        if (err) {
          const e = new Error(`ffmpeg_exit:${err.message.slice(0, 200)}`) as Error & {
            stderrTail: string;
          };
          e.stderrTail = stderrTail;
          reject(e);
        } else {
          resolve({ stderrTail });
        }
      }
    );
    child.on("error", (err) => reject(err));
  });
}

// Per-edit scratch dir under /tmp; callers must scratchCleanup() in finally.
export function scratchDir(editId: string): string {
  const dir = `/tmp/br-${editId}`;
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function scratchCleanup(editId: string): void {
  rmSync(`/tmp/br-${editId}`, { recursive: true, force: true });
}
