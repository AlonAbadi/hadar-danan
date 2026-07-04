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
import { runFfmpeg, scratchDir, scratchCleanup, FONTS_DIR } from "./ffmpeg";
import { buildAss } from "./ass";
import type { CaptionsPayload } from "./captions";

const BUCKET = "broadcast-takes";
const COVER_FRACTIONS = [0.2, 0.45, 0.7];

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

    // ASS with approved lines only (mode 'none' approved an empty set —
    // the stamp still burns).
    const lines = (edit.captions?.lines ?? []).filter((l) => !l.deleted && l.text.trim());
    const assPath = path.join(dir, "captions.ass");
    writeFileSync(assPath, buildAss(lines, { trimStartMs: trimStart, durationMs: trimmedMs, stamp: true }), "utf8");

    const outPath = path.join(dir, "out.mp4");
    await runFfmpeg([
      "-ss", (trimStart / 1000).toFixed(3),
      ...(trimEnd > trimStart ? ["-to", (trimEnd / 1000).toFixed(3)] : []),
      "-i", inputPath,
      "-vf",
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,ass=${assPath}:fontsdir=${FONTS_DIR}`,
      // Reels-sufficient quality: IG recompresses everything to ~2-4 Mbps, so
      // CRF 23 capped at 5 Mbps loses nothing visible for talking-head footage
      // and roughly halves file size vs CRF 20 uncapped.
      "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "high", "-crf", "23",
      "-maxrate", "5M", "-bufsize", "10M",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
      "-movflags", "+faststart",
      outPath,
    ]);

    // 3 cover candidate frames from the trimmed timeline (input already local).
    const authPrefix = take.storage_path.split("/")[0];
    const framePaths: string[] = [];
    for (let i = 0; i < COVER_FRACTIONS.length; i++) {
      const t = trimStart / 1000 + (trimmedMs / 1000) * COVER_FRACTIONS[i];
      const framePath = path.join(dir, `frame${i}.jpg`);
      await runFfmpeg(["-ss", t.toFixed(2), "-i", inputPath, "-frames:v", "1", "-q:v", "2", framePath]);
      framePaths.push(framePath);
    }

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
