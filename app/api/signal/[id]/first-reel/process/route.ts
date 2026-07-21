import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createServerClient } from "@/lib/supabase/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { runFirstReelPipeline, setFirstReelRender } from "@/lib/signal/first-reel-pipeline";
import { rateLimit } from "@/lib/rate-limit";

// The render (Whisper + ffmpeg burn) runs via waitUntil after the 202.
export const maxDuration = 600;

// POST /api/signal/[id]/first-reel/process?t=<kaveret token>  { path }
// Kicks the render pipeline for a take already uploaded straight to storage.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tokenId = verifyKaveretToken(req.nextUrl.searchParams.get("t"));
  if (!tokenId || tokenId !== id) {
    return NextResponse.json({ error: "קישור לא תקין" }, { status: 401 });
  }
  if (!rateLimit(`first-reel-process:${id}`, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות, נסו שוב בעוד כמה דקות" }, { status: 429 });
  }

  const db = createServerClient();
  try {
    const { path } = (await req.json().catch(() => ({}))) as { path?: string };
    // The token only authorizes takes inside this extraction's own prefix.
    if (!path || !path.startsWith(`first-reel/${id}/`) || path.includes("..")) {
      return NextResponse.json({ error: "נתיב לא תקין" }, { status: 400 });
    }
    const { data: exists } = await db.storage
      .from("broadcast-takes")
      .list(`first-reel/${id}`, { search: path.split("/").pop(), limit: 1 });
    if (!exists?.length) {
      return NextResponse.json({ error: "הקובץ לא נמצא, נסו להעלות שוב" }, { status: 404 });
    }

    await setFirstReelRender(id, { status: "processing", take_path: path, at: new Date().toISOString() });
    waitUntil(runFirstReelPipeline(id, path));
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (err) {
    await db.from("error_logs").insert({
      context: "api/signal/first-reel/process",
      error: err instanceof Error ? err.message.slice(0, 500) : String(err),
    });
    return NextResponse.json({ error: "העיבוד נכשל, נסו שוב" }, { status: 500 });
  }
}
