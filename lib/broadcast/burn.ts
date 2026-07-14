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
import type { CaptionsPayload, CaptionTransform } from "./captions";

const BUCKET = "broadcast-takes";
const COVER_FRACTIONS = [0.2, 0.45, 0.7];

export type FramingStrategy = "portrait_crop" | "landscape_fullframe";

export interface VideoFilterPlan {
  kind: "vf" | "complex";
  value: string;
  strategy: FramingStrategy;
  captionMarginV: number;
  stampMarginV: number;
  playResX: number;
  playResY: number;
}

// Framing (per Alon, 2026-07-09): the footage keeps its own frame. Portrait
// sources get the exact 9:16 crop chain as always; landscape sources (however
// they were captured — browser, app, mis-rotated) ship FULL-FRAME at their
// native aspect.
//
// Exception restored 2026-07-10 evening after regression report: expo-camera
// on iOS 26 records a PORTRAIT pixel buffer with a ±90° displaymatrix — after
// autorotation the effective dims read as landscape even though the user
// held the phone vertically and saw a 9:16 preview. If we let those takes
// through the landscape_fullframe branch we ship 16:9 with letterboxing on
// top and bottom, which is what Alon reported today. Fingerprint the case
// (landscape effective + ±90 rotation + raw buffer taller than wide) and
// route to the portrait crop chain — same treatment as commit e906f00.
// User zoom/pan (approval screen): crop the chosen window — the base window
// divided by z, centered on (cx,cy) — before scaling. WYSIWYG with the
// client preview, which runs the identical math. Returns null for identity.
function transformCrop(
  W: number,
  H: number,
  w0: number,
  h0: number,
  transform: CaptionTransform | null | undefined
): string | null {
  if (!transform) return null;
  const meaningful =
    transform.z > 1.005 || Math.abs(transform.cx - 0.5) > 0.005 || Math.abs(transform.cy - 0.5) > 0.005;
  if (!meaningful) return null;
  const z = Math.min(2.5, Math.max(1, transform.z));
  const w = Math.max(2, Math.floor(w0 / z / 2) * 2);
  const h = Math.max(2, Math.floor(h0 / z / 2) * 2);
  const x = Math.round(Math.min(W - w, Math.max(0, transform.cx * W - w / 2)) / 2) * 2;
  const y = Math.round(Math.min(H - h, Math.max(0, transform.cy * H - h / 2)) / 2) * 2;
  return `crop=${w}:${h}:${x}:${y}`;
}

export function buildVideoFilter(
  dims: VideoDims | null,
  assPath: string,
  transform?: CaptionTransform | null,
  phoneCapture = false
): VideoFilterPlan {
  const landscape = dims !== null && dims.effWidth > dims.effHeight;
  const appRotatedFromPortrait =
    landscape &&
    Math.abs(dims.rotation) % 180 === 90 &&
    dims.width < dims.height;
  // Phone captures are portrait-intent even as landscape buffers with no
  // rotation tag (Android Chrome) — they belong in the 9:16 crop chain.
  if (!landscape || appRotatedFromPortrait || phoneCapture) {
    // Base window: the 9:16 cover crop. Needs probed dims; without them (or
    // without a transform) the legacy cover chain runs.
    let cropChain = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`;
    if (dims) {
      const W = dims.effWidth;
      const H = dims.effHeight;
      const w0 = Math.min(W, (H * 9) / 16);
      const crop = transformCrop(W, H, w0, (w0 * 16) / 9, transform);
      if (crop) cropChain = `${crop},scale=1080:1920`;
    }
    return {
      kind: "vf",
      value: `${cropChain},fps=30,ass=${assPath}:fontsdir=${FONTS_DIR}`,
      strategy: "portrait_crop",
      // Top-anchored (Alignment 8): block sits at 62% — below the chin in
      // selfie framing (customer feedback 2026-07-14), above the Reels UI.
      captionMarginV: Math.round(1920 * 0.70),
      stampMarginV: 96,
      playResX: 1080,
      playResY: 1920,
    };
  }
  const outW = Math.min(1920, Math.floor(dims.effWidth / 2) * 2);
  const outH = Math.floor((outW * dims.effHeight) / dims.effWidth / 2) * 2;
  // Landscape keeps its own frame (full-frame policy) — zoom/pan reframes
  // WITHIN that frame: base window = the whole frame, output dims unchanged.
  const crop = transformCrop(dims.effWidth, dims.effHeight, dims.effWidth, dims.effHeight, transform);
  return {
    kind: "vf",
    value: `${crop ? `${crop},` : ""}scale=${outW}:${outH},fps=30,ass=${assPath}:fontsdir=${FONTS_DIR}`,
    strategy: "landscape_fullframe",
    captionMarginV: Math.round(outH * 0.70),
    stampMarginV: 96,
    playResX: outW,
    playResY: outH,
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

    // Member language for the ASS bidi handling (EN lines must not carry the
    // RLM prefix — a strong-RTL char that flips all-Latin lines under
    // Encoding -1 first-strong autodetect). Best-effort: default Hebrew.
    let language: "he" | "en" = "he";
    try {
      const { data: editRow } = await db
        .from("broadcast_edits")
        .select("extraction_id")
        .eq("id", edit.id)
        .maybeSingle();
      if (editRow?.extraction_id) {
        const { data: ext } = await db
          .from("signal_extractions")
          .select("signal")
          .eq("id", editRow.extraction_id)
          .maybeSingle();
        if (ext?.signal?.language === "en") language = "en";
      }
    } catch { /* language stays he */ }

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
    const phoneCapture = /\.p\.(mp4|webm|mov)$/.test(take.storage_path ?? "");
    const plan = buildVideoFilter(dims, assPath, edit.captions?.transform ?? null, phoneCapture);

    // ASS with approved lines only (mode 'none' approved an empty set —
    // the stamp still burns). Margins depend on the framing strategy.
    const lines = (edit.captions?.lines ?? []).filter((l) => !l.deleted && l.text.trim());
    writeFileSync(
      assPath,
      buildAss(lines, {
        trimStartMs: trimStart,
        durationMs: trimmedMs,
        // Per Alon (2026-07-09): the stamp is not burned into the video.
        stamp: false,
        captionMarginV: plan.captionMarginV,
        stampMarginV: plan.stampMarginV,
        playResX: plan.playResX,
        playResY: plan.playResY,
        language,
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
