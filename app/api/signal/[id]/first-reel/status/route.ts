import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { readFirstReelRender } from "@/lib/signal/first-reel-pipeline";

// GET /api/signal/[id]/first-reel/status?t=<kaveret token>
// → { status: "none" | "processing" | "ready" | "failed", url? }
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tokenId = verifyKaveretToken(req.nextUrl.searchParams.get("t"));
  if (!tokenId || tokenId !== id) {
    return NextResponse.json({ error: "קישור לא תקין" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServerClient() as any;
  const { data: ext } = await db
    .from("signal_extractions")
    .select("signal")
    .eq("id", id)
    .maybeSingle();
  const render = readFirstReelRender(ext?.signal);
  if (!render.status) return NextResponse.json({ status: "none" });

  if (render.status === "ready" && render.output_path) {
    // Two URLs: inline for the <video> player, attachment for the download
    // button (iOS Safari honors the content-disposition, unlike blob links).
    const [{ data: inline }, { data: attachment }] = await Promise.all([
      db.storage.from("broadcast-takes").createSignedUrl(render.output_path, 60 * 60),
      db.storage.from("broadcast-takes").createSignedUrl(render.output_path, 60 * 60, { download: "first-reel.mp4" }),
    ]);
    if (inline?.signedUrl) {
      return NextResponse.json({
        status: "ready",
        url: inline.signedUrl,
        downloadUrl: attachment?.signedUrl ?? inline.signedUrl,
      });
    }
  }
  return NextResponse.json({ status: render.status });
}
