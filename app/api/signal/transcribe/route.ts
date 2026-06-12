import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — OpenAI's hard cap

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`stt:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "service_unconfigured" }, { status: 503 });
  }

  let audio: Blob;
  try {
    const formData = await req.formData();
    const file = formData.get("audio");
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "no_audio" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "too_large" }, { status: 413 });
    }
    audio = file;
  } catch {
    return NextResponse.json({ error: "bad_form" }, { status: 400 });
  }

  const ext =
    audio.type.includes("mp4")  ? "mp4"  :
    audio.type.includes("ogg")  ? "ogg"  :
    audio.type.includes("wav")  ? "wav"  :
    "webm";

  const fd = new FormData();
  fd.append("file", audio, `audio.${ext}`);
  fd.append("model", "whisper-1");
  fd.append("language", "he");
  fd.append("response_format", "json");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: fd,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("openai stt error", res.status, body.slice(0, 500));
      // surface a short detail so the client can show something useful in dev
      return NextResponse.json(
        { error: "transcribe_failed", status: res.status, detail: body.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: data.text ?? "" });
  } catch (err) {
    console.error("transcribe network error", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "network", detail: msg.slice(0, 200) }, { status: 502 });
  }
}
