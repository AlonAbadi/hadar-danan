import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/signal/[id]/first-reel/upload?t=<kaveret token>  { mime }
// Returns a signed storage upload URL. The take goes from the browser
// DIRECTLY to Supabase storage - same principle as the member broadcast
// room (TUS): video bytes must never pass through a Vercel function,
// whose 4.5MB request limit rejects any real take.
const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tokenId = verifyKaveretToken(req.nextUrl.searchParams.get("t"));
  if (!tokenId || tokenId !== id) {
    return NextResponse.json({ error: "קישור לא תקין" }, { status: 401 });
  }
  if (!rateLimit(`first-reel-upload:${id}`, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות, נסו שוב בעוד כמה דקות" }, { status: 429 });
  }

  const db = createServerClient();
  try {
    const { mime } = (await req.json().catch(() => ({}))) as { mime?: string };
    const ext = EXT_BY_MIME[(mime ?? "").split(";")[0].trim()];
    if (!ext) return NextResponse.json({ error: "פורמט וידאו לא נתמך" }, { status: 415 });

    const path = `first-reel/${id}/take-${Date.now()}.${ext}`;
    const { data, error } = await db.storage.from("broadcast-takes").createSignedUploadUrl(path);
    if (error || !data?.signedUrl) throw new Error(`signed_upload:${error?.message ?? "empty"}`);

    return NextResponse.json({ uploadUrl: data.signedUrl, path });
  } catch (err) {
    await db.from("error_logs").insert({
      context: "api/signal/first-reel/upload",
      error: err instanceof Error ? err.message.slice(0, 500) : String(err),
    });
    return NextResponse.json({ error: "ההעלאה נכשלה, נסו שוב" }, { status: 500 });
  }
}
