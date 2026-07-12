// חדר השידור — pipeline stage A: transcription.
//
// Downloads the selected take from storage, extracts mono 16k AAC (a 3-minute
// take becomes ~1.5MB — the Whisper 25MB cap is structurally unreachable),
// calls whisper-1 with word+segment timestamps and the original script as the
// accuracy prompt, groups words into caption lines, and parks the edit at
// 'awaiting_captions'. Nothing is burned here — the human gate comes first.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { runFfmpeg, scratchDir, scratchCleanup } from "./ffmpeg";
import { findShootDayVideo } from "@/lib/signal/shoot-day-slices";
import {
  buildWhisperPrompt,
  groupWordsIntoLines,
  transcriptLooksBroken,
  type CaptionLanguage,
  type CaptionsPayload,
  type CaptionWord,
} from "./captions";

const BUCKET = "broadcast-takes";

interface EditRow {
  id: string;
  take_id: string;
  user_id: string;
  extraction_id: string;
  video_number: number;
}

async function setStatus(db: any, editId: string, patch: Record<string, unknown>) {
  await db
    .from("broadcast_edits")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", editId);
}

function extractScript(signal: any, videoNumber: number): string {
  const video = findShootDayVideo(signal, videoNumber);
  const s = video?.script ?? {};
  return [s.hook, s.body, s.cta].filter(Boolean).join("\n");
}

export async function runTranscribeStage(edit: EditRow): Promise<void> {
  const db = createServerClient() as any;
  const dir = scratchDir(edit.id);
  try {
    const { data: take } = await db
      .from("broadcast_takes")
      .select("id, storage_path, duration_seconds, suggested_trim_start_ms, suggested_trim_end_ms")
      .eq("id", edit.take_id)
      .maybeSingle();
    if (!take) throw new Error("transcribe:take_missing");

    // Download the take to /tmp.
    const { data: blob, error: dlError } = await db.storage
      .from(BUCKET)
      .download(take.storage_path);
    if (dlError || !blob) throw new Error(`transcribe:download:${dlError?.message ?? "empty"}`);
    const inputPath = path.join(dir, `in${path.extname(take.storage_path) || ".mp4"}`);
    writeFileSync(inputPath, Buffer.from(await blob.arrayBuffer()));

    // Extract mono 16k AAC for Whisper.
    const audioPath = path.join(dir, "audio.m4a");
    await runFfmpeg(["-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "aac", "-b:a", "64k", audioPath]);

    // Original script as the Hebrew-accuracy prompt. The extraction's signal
    // also carries the member's language (signal.language === "en" for /en
    // members) — that decides the Whisper language, the prompt policy, and
    // the garbage-transcript heuristics.
    const { data: extraction } = await db
      .from("signal_extractions")
      .select("signal")
      .eq("id", edit.extraction_id)
      .maybeSingle();
    const script = extractScript(extraction?.signal, edit.video_number);
    const language: CaptionLanguage = extraction?.signal?.language === "en" ? "en" : "he";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("transcribe:openai_unconfigured");

    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(readFileSync(audioPath))], { type: "audio/mp4" }), "audio.m4a");
    fd.append("model", "whisper-1");
    fd.append("language", language);
    fd.append("response_format", "verbose_json");
    fd.append("timestamp_granularities[]", "word");
    fd.append("timestamp_granularities[]", "segment");
    // Distinctive Latin terms only — NEVER the script text (see buildWhisperPrompt).
    const prompt = script ? buildWhisperPrompt(script, language) : "";
    if (prompt) fd.append("prompt", prompt);

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`transcribe:openai_${res.status}:${detail}`);
    }
    const result = (await res.json()) as {
      words?: { word: string; start: number; end: number }[];
      duration?: number;
    };

    const words: CaptionWord[] = (result.words ?? []).map((w) => ({
      w: w.word.trim(),
      s: Math.round(w.start * 1000),
      e: Math.round(w.end * 1000),
    })).filter((w) => w.w.length > 0);
    if (!words.length) throw new Error("transcribe:empty_transcript");

    const lines = groupWordsIntoLines(words, language);
    const broken = transcriptLooksBroken(words, lines, language);
    if (broken) throw new Error(`transcribe:broken_transcript:${broken}`);
    const captions: CaptionsPayload = {
      source: "whisper",
      words,
      lines,
      approved_at: null,
    };

    // Trim suggestions: client RMS analysis wins; Whisper word bounds are the
    // fallback and the sanity clamp.
    const durationMs = Math.round((take.duration_seconds ?? result.duration ?? 0) * 1000);
    const whisperStart = Math.max(0, words[0].s - 250);
    const whisperEnd = words[words.length - 1].e + 350;
    const trimStart = take.suggested_trim_start_ms ?? whisperStart;
    const trimEnd = Math.min(
      take.suggested_trim_end_ms ?? whisperEnd,
      durationMs > 0 ? durationMs : whisperEnd
    );

    await setStatus(db, edit.id, {
      status: "awaiting_captions",
      captions,
      trim_start_ms: Math.min(trimStart, whisperStart + 2000),
      trim_end_ms: Math.max(trimEnd, whisperEnd - 2000),
    });
  } catch (e) {
    const err = e as Error & { stderrTail?: string };
    const detail = `transcribe:${err.message.slice(0, 400)}${err.stderrTail ? `|ffmpeg:${err.stderrTail.slice(-400)}` : ""}`;
    // Whisper-level failures still reach the approval screen: the spec's
    // fallback paths (no captions / script-as-captions manual sync) live
    // there. Only infrastructure failures (missing take, download, ffmpeg)
    // dead-end at 'failed' where retry is the path.
    const whisperFailure = /openai_|empty_transcript|broken_transcript/.test(err.message);
    if (whisperFailure) {
      const emptyCaptions: CaptionsPayload = { source: "none", words: [], lines: [], approved_at: null };
      await setStatus(db, edit.id, {
        status: "awaiting_captions",
        captions: emptyCaptions,
        error_detail: detail,
      });
    } else {
      await setStatus(db, edit.id, { status: "failed", error_detail: detail });
    }
    await db.from("error_logs").insert({
      context: "broadcast/transcribe",
      error: err.message.slice(0, 1000),
    });
  } finally {
    scratchCleanup(edit.id);
  }
}
