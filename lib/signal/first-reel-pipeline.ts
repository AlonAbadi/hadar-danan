// First-reel render pipeline: the free taste runs through the REAL broadcast
// engine - same Whisper transcription, same caption grouping, same framing,
// same ASS builder, same encode settings (imported from lib/broadcast, not
// copied) - just orchestrated without the member DB state machine and without
// the human caption gate (captions are auto-approved as transcribed).
//
// State lives on the extraction jsonb under `first_reel_render` (atomic merge
// RPC), storage under first-reel/{extractionId}/ in the broadcast-takes
// bucket - away from the member {auth_uid}/ RLS prefix and the cleanup cron.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { runFfmpeg, scratchDir, scratchCleanup, probeVideoDims } from "@/lib/broadcast/ffmpeg";
import { buildAss } from "@/lib/broadcast/ass";
import { buildVideoFilter, buildEncodeArgs } from "@/lib/broadcast/burn";
import {
  buildWhisperPrompt,
  groupWordsIntoLines,
  transcriptLooksBroken,
  type CaptionLanguage,
  type CaptionLine,
  type CaptionWord,
} from "@/lib/broadcast/captions";
import { readFirstReel } from "@/lib/signal/first-reel";

const BUCKET = "broadcast-takes";

export interface FirstReelRender {
  status: "processing" | "ready" | "failed";
  take_path?: string;
  output_path?: string;
  error?: string;
  at: string;
}

// Merge-RPC values are JSON strings; tolerate both shapes.
export function readFirstReelRender(sig: any): Partial<FirstReelRender> {
  let t = sig?.first_reel_render;
  if (typeof t === "string") {
    try { t = JSON.parse(t); } catch { return {}; }
  }
  return t && typeof t === "object" ? t : {};
}

export async function setFirstReelRender(extractionId: string, render: FirstReelRender): Promise<void> {
  const db = createServerClient() as any;
  await db.rpc("signal_merge_field", {
    p_id: extractionId,
    p_field: "first_reel_render",
    p_value: JSON.stringify(render),
  });
}

export interface FirstReelTrims {
  durationMs?: number | null;   // client-measured take duration
  trimStartMs?: number | null;  // client RMS voice-analysis suggestion (wins, like the member flow)
  trimEndMs?: number | null;
}

export async function runFirstReelPipeline(
  extractionId: string,
  takePath: string,
  clientTrims: FirstReelTrims = {},
): Promise<void> {
  const db = createServerClient() as any;
  const jobId = `first-reel-${extractionId}-${Date.now()}`;
  const dir = scratchDir(jobId);
  try {
    // ── source ──
    const { data: blob, error: dlError } = await db.storage.from(BUCKET).download(takePath);
    if (dlError || !blob) throw new Error(`download:${dlError?.message ?? "empty"}`);
    const inputPath = path.join(dir, `in${path.extname(takePath) || ".mp4"}`);
    writeFileSync(inputPath, Buffer.from(await blob.arrayBuffer()));

    const { data: ext } = await db
      .from("signal_extractions")
      .select("signal")
      .eq("id", extractionId)
      .maybeSingle();
    const script = String(readFirstReel(ext?.signal).script ?? "");
    const language: CaptionLanguage = ext?.signal?.language === "en" ? "en" : "he";

    // ── stage A: transcription (identical params to the member pipeline) ──
    const audioPath = path.join(dir, "audio.m4a");
    await runFfmpeg(["-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "aac", "-b:a", "64k", audioPath]);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("openai_unconfigured");
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(readFileSync(audioPath))], { type: "audio/mp4" }), "audio.m4a");
    fd.append("model", "whisper-1");
    fd.append("language", language);
    fd.append("response_format", "verbose_json");
    fd.append("timestamp_granularities[]", "word");
    fd.append("timestamp_granularities[]", "segment");
    const prompt = script ? buildWhisperPrompt(script, language) : "";
    if (prompt) fd.append("prompt", prompt);

    // Captions are the product ("המוצר האמיתי עם הכתוביות" - Alon 2026-07-21):
    // a transcription failure FAILS the render loudly so the client offers a
    // retry, instead of silently delivering a captionless reel.
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });
    if (!res.ok) {
      throw new Error(`whisper_${res.status}:${(await res.text()).slice(0, 200)}`);
    }
    const result = (await res.json()) as {
      words?: { word: string; start: number; end: number }[];
      duration?: number;
    };
    const durationMs = Math.round((result.duration ?? 0) * 1000);
    const words: CaptionWord[] = (result.words ?? [])
      .map((w) => ({ w: w.word.trim(), s: Math.round(w.start * 1000), e: Math.round(w.end * 1000) }))
      .filter((w) => w.w.length > 0);
    if (!words.length) throw new Error("empty_transcript");
    const lines: CaptionLine[] = groupWordsIntoLines(words, language);
    const broken = transcriptLooksBroken(words, lines, language);
    if (broken) throw new Error(`broken_transcript:${broken}`);

    // ── trims: client RMS analysis wins, Whisper word bounds are the
    // fallback and the sanity clamp (identical to the member transcribe stage) ──
    const takeDurationMs = clientTrims.durationMs && clientTrims.durationMs > 0
      ? clientTrims.durationMs
      : durationMs;
    const whisperStart = Math.max(0, words[0].s - 250);
    const whisperEnd = words[words.length - 1].e + 350;
    const rawStart = clientTrims.trimStartMs ?? whisperStart;
    const rawEnd = Math.min(
      clientTrims.trimEndMs ?? whisperEnd,
      takeDurationMs > 0 ? takeDurationMs : whisperEnd,
    );
    const trimStart = Math.max(0, Math.min(rawStart, whisperStart + 2000));
    const trimEnd = Math.max(rawEnd, whisperEnd - 2000);
    const trimmedMs = trimEnd > trimStart ? trimEnd - trimStart : takeDurationMs;

    // ── stage B: burn (identical framing + ASS + encode) ──
    const dims = await probeVideoDims(inputPath);
    const assPath = path.join(dir, "captions.ass");
    const plan = buildVideoFilter(dims, assPath, null, false);
    const keptLines = lines.filter((l) => !l.deleted && l.text.trim());
    writeFileSync(
      assPath,
      buildAss(keptLines, {
        trimStartMs: trimStart,
        durationMs: trimmedMs || 20_000,
        stamp: false, // per Alon (2026-07-09): the stamp is not burned into the video
        captionMarginV: plan.captionMarginV,
        stampMarginV: plan.stampMarginV,
        playResX: plan.playResX,
        playResY: plan.playResY,
        language,
      }),
      "utf8"
    );

    const outPath = path.join(dir, "out.mp4");
    await runFfmpeg([
      "-ss", (trimStart / 1000).toFixed(3),
      ...(trimEnd > trimStart ? ["-to", (trimEnd / 1000).toFixed(3)] : []),
      "-i", inputPath,
      ...(plan.kind === "vf"
        ? ["-vf", plan.value]
        : ["-filter_complex", plan.value, "-map", "[v]", "-map", "0:a?"]),
      ...buildEncodeArgs(outPath),
    ]);

    // ── deliver ──
    const outputPath = `first-reel/${extractionId}/reel-${Date.now()}.mp4`;
    const { error: upError } = await db.storage
      .from(BUCKET)
      .upload(outputPath, readFileSync(outPath), { contentType: "video/mp4", upsert: true });
    if (upError) throw new Error(`upload_output:${upError.message}`);

    const { data: verify } = await db.storage
      .from(BUCKET)
      .list(`first-reel/${extractionId}`, { search: path.basename(outputPath), limit: 1 });
    if (!verify?.some((o: { name: string }) => o.name === path.basename(outputPath))) {
      throw new Error("output_verify_failed");
    }

    await setFirstReelRender(extractionId, {
      status: "ready",
      take_path: takePath,
      output_path: outputPath,
      at: new Date().toISOString(),
    });
  } catch (e) {
    const err = e as Error & { stderrTail?: string };
    await setFirstReelRender(extractionId, {
      status: "failed",
      take_path: takePath,
      error: err.message.slice(0, 300),
      at: new Date().toISOString(),
    });
    await db.from("error_logs").insert({
      context: "signal/first-reel-pipeline",
      error: `${err.message.slice(0, 600)}${err.stderrTail ? `|ffmpeg:${err.stderrTail.slice(-300)}` : ""}`,
    });
  } finally {
    scratchCleanup(jobId);
  }
}
