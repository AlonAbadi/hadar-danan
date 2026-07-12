// THROWAWAY transcription spike — compares transcription engines on a real
// take, server-side (where OPENAI_API_KEY lives). DELETE after the engine
// decision. Guarded by a random key, no session semantics.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { runFfmpeg, scratchDir, scratchCleanup } from "@/lib/broadcast/ffmpeg";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SPIKE_KEY = "tspike-4e7d1b6c90aa";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-spike-key") !== SPIKE_KEY) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { take_id, variant, prompt } = await req.json();
  const db = createServerClient() as any;
  const { data: take } = await db
    .from("broadcast_takes")
    .select("id, storage_path")
    .eq("id", take_id)
    .maybeSingle();
  if (!take) return NextResponse.json({ error: "take_not_found" }, { status: 404 });

  const dir = scratchDir(`tspike-${take_id.slice(0, 8)}`);
  try {
    const { data: blob } = await db.storage.from("broadcast-takes").download(take.storage_path);
    const inPath = path.join(dir, `in${path.extname(take.storage_path) || ".mp4"}`);
    writeFileSync(inPath, Buffer.from(await blob.arrayBuffer()));
    const audioPath = path.join(dir, "audio.m4a");
    await runFfmpeg(["-i", inPath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "aac", "-b:a", "64k", audioPath]);

    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(readFileSync(audioPath))], { type: "audio/mp4" }), "audio.m4a");
    fd.append("model", variant === "4o-mini" ? "gpt-4o-mini-transcribe" : "whisper-1");
    fd.append("language", "he");
    if (variant === "4o-mini") {
      fd.append("response_format", "json");
    } else {
      fd.append("response_format", "verbose_json");
      fd.append("timestamp_granularities[]", "segment");
    }
    if (prompt) fd.append("prompt", String(prompt));

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: fd,
    });
    const out = await res.json();
    return NextResponse.json({
      ok: res.ok,
      text: out.text ?? null,
      segments: Array.isArray(out.segments)
        ? out.segments.map((s: any) => ({ s: s.start, e: s.end, t: s.text }))
        : null,
      raw_error: res.ok ? null : out,
    });
  } finally {
    scratchCleanup(`tspike-${take_id.slice(0, 8)}`);
  }
}
