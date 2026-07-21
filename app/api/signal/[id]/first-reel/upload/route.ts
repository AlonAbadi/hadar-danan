import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createServerClient } from "@/lib/supabase/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { runFirstReelPipeline, setFirstReelRender } from "@/lib/signal/first-reel-pipeline";
import { rateLimit } from "@/lib/rate-limit";

// The render (Whisper + ffmpeg burn) runs via waitUntil after the 202 —
// same budget as the member pipeline routes.
export const maxDuration = 600;

const MAX_BYTES = 80 * 1024 * 1024; // 15s take is ~10-25MB; hard ceiling anyway
const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// POST /api/signal/[id]/first-reel/upload?t=<kaveret token>  (raw video body)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tokenId = verifyKaveretToken(req.nextUrl.searchParams.get("t"));
  if (!tokenId || tokenId !== id) {
    return NextResponse.json({ error: "קישור לא תקין" }, { status: 401 });
  }
  if (!rateLimit(`first-reel-upload:${id}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות, נסו שוב בעוד כמה דקות" }, { status: 429 });
  }

  const db = createServerClient();
  try {
    const mime = (req.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = EXT_BY_MIME[mime];
    if (!ext) {
      return NextResponse.json({ error: "פורמט וידאו לא נתמך" }, { status: 415 });
    }
    const body = Buffer.from(await req.arrayBuffer());
    if (!body.length) return NextResponse.json({ error: "קובץ ריק" }, { status: 400 });
    if (body.length > MAX_BYTES) return NextResponse.json({ error: "הקובץ גדול מדי" }, { status: 413 });

    const takePath = `first-reel/${id}/take-${Date.now()}.${ext}`;
    const { error: upError } = await db.storage
      .from("broadcast-takes")
      .upload(takePath, body, { contentType: mime, upsert: true });
    if (upError) throw new Error(`take_upload:${upError.message}`);

    await setFirstReelRender(id, { status: "processing", take_path: takePath, at: new Date().toISOString() });
    waitUntil(runFirstReelPipeline(id, takePath));

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (err) {
    await db.from("error_logs").insert({
      context: "api/signal/first-reel/upload",
      error: err instanceof Error ? err.message.slice(0, 500) : String(err),
    });
    return NextResponse.json({ error: "ההעלאה נכשלה, נסו שוב" }, { status: 500 });
  }
}
