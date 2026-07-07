// חדר השידור — pipeline stage B: trim + burn + cover frames.
//
// Runs only AFTER human caption approval. One-pass ffmpeg: -ss/-to trim
// (before -i: frame-accurate with re-encode, resets timestamps so the ASS is
// generated trim-relative), normalize to 1080x1920@30 (Safari MP4 and Chrome
// webm converge to the same deliverable), burn captions + the
// "מצולם, לא מיוצר" stamp via libass. 'ready' is set only after the output
// object is verified present in storage.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { runFfmpeg, scratchDir, scratchCleanup, probeVideoDims, FONTS_DIR, type VideoDims } from "./ffmpeg";
import { buildAss } from "./ass";
import { detectPersonWindow } from "./framing";
import type { CaptionsPayload } from "./captions";

const BUCKET = "broadcast-takes";
const COVER_FRACTIONS = [0.2, 0.45, 0.7];

export type FramingStrategy =
  | "portrait_crop"
  | "landscape_blurpad"
  | "portrait_crop_app_rotated"
  | "portrait_crop_person_centered"
  | "landscape_blurpad_persons_wide";

export interface VideoFilterPlan {
  kind: "vf" | "complex";
  value: string;
  strategy: FramingStrategy;
  captionMarginV: number;
  stampMarginV: number;
}

// Framing decision (expert-panel verdict): portrait sources keep the exact
// crop chain; LANDSCAPE sources (iPhone Safari records the full landscape
// sensor) get the industry-standard blur-pad — full frame as a band over a
// blurred, dimmed fill, captions on the lower strip, stamp on the upper one.
// Cropping a landscape source cannot fix "too zoomed in"; padding can.
//
// Exception: the native app (expo-camera on iOS 26) records a PORTRAIT pixel
// buffer with a ±90° displaymatrix — effectively landscape after autorotation.
// Browser MediaRecorder landscape takes never carry a rotation tag, so this
// fingerprint (rotated + portrait buffer + landscape effective) uniquely
// identifies app takes; those get a portrait crop. Where the crop lands is
// person-aware (see runBurnStage): centered on the detected people, or the
// blur-pad when they're too wide for a 9:16 window to hold.
export function buildVideoFilter(
  dims: VideoDims | null,
  assPath: string,
  personWindow?: { left: number; right: number } | null
): VideoFilterPlan {
  const landscape = dims !== null && dims.effWidth > dims.effHeight;
  const appRotated =
    landscape && Math.abs(dims.rotation) % 180 === 90 && dims.width < dims.height;
  if (!landscape) {
    return {
      kind: "vf",
      value: `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,ass=${assPath}:fontsdir=${FONTS_DIR}`,
      strategy: "portrait_crop",
      captionMarginV: 430,
      stampMarginV: 96,
    };
  }
  if (appRotated) {
    // 9:16 window out of the effective landscape frame.
    const cropW = Math.round(((dims.effHeight * 9) / 16) / 2) * 2;
    let strategy: FramingStrategy = "portrait_crop_app_rotated";
    let cropX = Math.round((dims.effWidth - cropW) / 2);
    if (personWindow) {
      // Face span + breathing room on both sides — a face at the exact crop
      // edge still reads as beheaded.
      const padPx = dims.effWidth * 0.04;
      const spanPx = (personWindow.right - personWindow.left) * dims.effWidth + padPx * 2;
      if (spanPx > cropW) {
        // People wider than the window — cropping would behead someone.
        strategy = "landscape_blurpad_persons_wide";
      } else {
        const centerPx = ((personWindow.left + personWindow.right) / 2) * dims.effWidth;
        cropX = Math.round(Math.min(Math.max(centerPx - cropW / 2, 0), dims.effWidth - cropW));
        strategy = "portrait_crop_person_centered";
      }
    }
    if (strategy !== "landscape_blurpad_persons_wide") {
      return {
        kind: "vf",
        value: `crop=${cropW}:${dims.effHeight}:${cropX}:0,scale=1080:1920,fps=30,ass=${assPath}:fontsdir=${FONTS_DIR}`,
        strategy,
        captionMarginV: 430,
        stampMarginV: 96,
      };
    }
    // fall through to the blur-pad below
  }
  return {
    kind: "complex",
    value:
      `[0:v]split=2[bg][fg];` +
      `[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
      `scale=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear,` +
      `eq=brightness=-0.12:saturation=0.85[bgv];` +
      `[fg]scale=1080:-2:flags=lanczos[fgv];` +
      `[bgv][fgv]overlay=(W-w)/2:(H-h)/2:format=auto,setsar=1,fps=30,` +
      `ass=${assPath}:fontsdir=${FONTS_DIR}[v]`,
    strategy: appRotated ? "landscape_blurpad_persons_wide" : "landscape_blurpad",
    // 1080-wide band sits at y 555-1365: captions just below it on the blur
    // strip, stamp just above it — both clear of the Reels UI zones.
    captionMarginV: 400,
    stampMarginV: 440,
  };
}

interface EditRow {
  id: string;
  take_id: string;
  user_id: string;
  trim_start_ms: number | null;
  trim_end_ms: number | null;
  captions: CaptionsPayload | null;
  notify_on_ready: boolean;
  is_test: boolean;
}

async function setStatus(db: any, editId: string, patch: Record<string, unknown>) {
  await db
    .from("broadcast_edits")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", editId);
}

export async function runBurnStage(edit: EditRow): Promise<void> {
  const db = createServerClient() as any;
  const dir = scratchDir(edit.id);
  try {
    const { data: take } = await db
      .from("broadcast_takes")
      .select("id, user_id, storage_path, duration_seconds")
      .eq("id", edit.take_id)
      .maybeSingle();
    if (!take) throw new Error("burn:take_missing");

    const { data: blob, error: dlError } = await db.storage
      .from(BUCKET)
      .download(take.storage_path);
    if (dlError || !blob) throw new Error(`burn:download:${dlError?.message ?? "empty"}`);
    const inputPath = path.join(dir, `in${path.extname(take.storage_path) || ".mp4"}`);
    writeFileSync(inputPath, Buffer.from(await blob.arrayBuffer()));

    const durationMs = Math.round((take.duration_seconds ?? 0) * 1000);
    const trimStart = Math.max(0, edit.trim_start_ms ?? 0);
    const rawTrimEnd = edit.trim_end_ms ?? durationMs;
    const trimEnd =
      rawTrimEnd > trimStart + 1000
        ? durationMs > 0
          ? Math.min(rawTrimEnd, durationMs)
          : rawTrimEnd
        : durationMs || rawTrimEnd;
    const trimmedMs = trimEnd - trimStart;

    // Framing decision from the EFFECTIVE source dims (autorotation-aware).
    const dims = await probeVideoDims(inputPath);
    const assPath = path.join(dir, "captions.ass");

    // Person-aware crop for app-rotated takes: a blind center-crop beheads
    // off-center speakers (field case: a two-person take lost one of them).
    let personWindow: Awaited<ReturnType<typeof detectPersonWindow>> = null;
    const isAppRotated =
      dims !== null &&
      dims.effWidth > dims.effHeight &&
      Math.abs(dims.rotation) % 180 === 90 &&
      dims.width < dims.height;
    if (isAppRotated) {
      personWindow = await detectPersonWindow({
        inputPath,
        scratchDir: dir,
        trimStartMs: trimStart,
        trimmedMs: trimmedMs,
      });
    }
    const plan = buildVideoFilter(dims, assPath, personWindow);

    // ASS with approved lines only (mode 'none' approved an empty set —
    // the stamp still burns). Margins depend on the framing strategy.
    const lines = (edit.captions?.lines ?? []).filter((l) => !l.deleted && l.text.trim());
    writeFileSync(
      assPath,
      buildAss(lines, {
        trimStartMs: trimStart,
        durationMs: trimmedMs,
        stamp: true,
        captionMarginV: plan.captionMarginV,
        stampMarginV: plan.stampMarginV,
      }),
      "utf8"
    );

    const outPath = path.join(dir, "out.mp4");
    const encodeArgs = [
      // Reels-sufficient quality: IG recompresses everything to ~2-4 Mbps, so
      // CRF 23 capped at 5 Mbps loses nothing visible for talking-head footage.
      "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "high", "-crf", "23",
      "-maxrate", "5M", "-bufsize", "10M",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
      "-movflags", "+faststart",
      outPath,
    ];
    await runFfmpeg([
      "-ss", (trimStart / 1000).toFixed(3),
      ...(trimEnd > trimStart ? ["-to", (trimEnd / 1000).toFixed(3)] : []),
      "-i", inputPath,
      ...(plan.kind === "vf"
        ? ["-vf", plan.value]
        : ["-filter_complex", plan.value, "-map", "[v]", "-map", "0:a?"]),
      ...encodeArgs,
    ]);

    // 3 cover candidate frames — extracted from the BURNED OUTPUT so the
    // thumbnails always match the delivered framing, whatever the strategy.
    const authPrefix = take.storage_path.split("/")[0];
    const framePaths: string[] = [];
    for (let i = 0; i < COVER_FRACTIONS.length; i++) {
      const t = (trimmedMs / 1000) * COVER_FRACTIONS[i];
      const framePath = path.join(dir, `frame${i}.jpg`);
      await runFfmpeg(["-ss", t.toFixed(2), "-i", outPath, "-frames:v", "1", "-q:v", "2", framePath]);
      framePaths.push(framePath);
    }

    // Framing observability: one info row per burn, answerable per edit id.
    await db.from("error_logs").insert({
      context: "broadcast/burn:framing_info",
      error: JSON.stringify({
        edit_id: edit.id,
        src: dims ? `${dims.width}x${dims.height}r${dims.rotation}` : "probe_failed",
        eff: dims ? `${dims.effWidth}x${dims.effHeight}` : null,
        strategy: plan.strategy,
        persons: personWindow
          ? `${personWindow.left.toFixed(2)}-${personWindow.right.toFixed(2)}@${personWindow.frames}`
          : null,
      }),
    });

    // Upload output + frames.
    const outputPath = `${authPrefix}/outputs/${edit.id}.mp4`;
    const { error: upError } = await db.storage
      .from(BUCKET)
      .upload(outputPath, readFileSync(outPath), { contentType: "video/mp4", upsert: true });
    if (upError) throw new Error(`burn:upload_output:${upError.message}`);

    for (let i = 0; i < framePaths.length; i++) {
      await db.storage
        .from(BUCKET)
        .upload(`${authPrefix}/covers/${edit.id}-frame${i}.jpg`, readFileSync(framePaths[i]), {
          contentType: "image/jpeg",
          upsert: true,
        });
    }

    // Never flip 'ready' before the output object is verified present.
    const { data: verify } = await db.storage
      .from(BUCKET)
      .list(`${authPrefix}/outputs`, { search: `${edit.id}.mp4`, limit: 1 });
    if (!verify?.some((o: { name: string }) => o.name === `${edit.id}.mp4`)) {
      throw new Error("burn:output_verify_failed");
    }

    await setStatus(db, edit.id, { status: "ready", output_path: outputPath, error_detail: null });

    // Delayed-delivery WhatsApp (stub template) — only when she left the screen.
    if (edit.notify_on_ready) {
      const { data: user } = await db
        .from("users")
        .select("id, name, phone")
        .eq("id", edit.user_id)
        .maybeSingle();
      if (user?.phone) {
        await db.from("jobs").insert({
          type: "SEND_WHATSAPP",
          payload: {
            user_id: user.id,
            phone: user.phone,
            name: user.name ?? "",
            template_name: "hadar_reel_ready",
            template_params: [user.name?.split(" ")[0] ?? ""],
            is_test: edit.is_test,
          },
        });
      }
    }
  } catch (e) {
    const err = e as Error & { stderrTail?: string };
    await setStatus(db, edit.id, {
      status: "failed",
      error_detail: `burn:${err.message.slice(0, 400)}${err.stderrTail ? `|ffmpeg:${err.stderrTail.slice(-400)}` : ""}`,
    });
    await db.from("error_logs").insert({
      context: "broadcast/burn",
      error: err.message.slice(0, 1000),
    });
  } finally {
    scratchCleanup(edit.id);
  }
}
