import { NextRequest, NextResponse } from "next/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { getOrCreateFirstReel } from "@/lib/signal/first-reel";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

// GET /api/signal/[id]/first-reel?t=<kaveret token>
// Auth: the signed kaveret token must decode to the same extraction id —
// exactly the visitor-state trust model of /kaveret/i itself.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tokenId = verifyKaveretToken(req.nextUrl.searchParams.get("t"));
  if (!tokenId || tokenId !== id) {
    return NextResponse.json({ error: "קישור לא תקין" }, { status: 401 });
  }
  if (!rateLimit(`first-reel:${id}`, 10, 60_000)) {
    return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429 });
  }

  const reel = await getOrCreateFirstReel(id);
  if (!reel) {
    return NextResponse.json({ error: "התסריט עוד לא מוכן, נסו שוב עוד רגע" }, { status: 503 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await import("@/lib/supabase/server")).createServerClient() as any;
  const { data: ext } = await db.from("signal_extractions").select("signal").eq("id", id).maybeSingle();
  const language = ext?.signal?.language === "en" ? "en" : "he";
  return NextResponse.json({ title: reel.title, script: reel.script, language });
}
