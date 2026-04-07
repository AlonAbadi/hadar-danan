/**
 * POST /api/video-event
 * Records a Vimeo video analytics event into video_events table.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { video_id, event_type, percent_watched, drop_off_second, email, anon_id: bodyAnonId } = body as {
    video_id?: string;
    event_type?: string;
    percent_watched?: number;
    drop_off_second?: number;
    email?: string;
    anon_id?: string;
  };

  if (!video_id || !event_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Read anon_id from cookie if not in body
  const anonId = bodyAnonId ?? req.cookies.get("anon_id")?.value ?? null;

  // Rate limit: 30 req/min per anon_id
  const rateLimitKey = anonId ?? "anonymous";
  if (!rateLimit(rateLimitKey, 30, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const supabase = createServerClient();

  const { error } = await supabase.from("video_events").insert({
    video_id,
    event_type,
    percent_watched: percent_watched ?? null,
    drop_off_second: drop_off_second ?? null,
    user_email: email ?? null,
    anon_id: anonId,
  });

  if (error) {
    await supabase.from("error_logs").insert({
      context: "api/video-event",
      error: error.message,
      payload: { video_id, event_type },
    });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
