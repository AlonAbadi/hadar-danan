/**
 * POST /api/training-view
 *
 * Records a page view for /training/watch and returns the updated total count.
 * Uses video_events table (no migration needed).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const anonId = req.cookies.get("anon_id")?.value ?? null;

  const { error } = await supabase.from("video_events").insert({
    video_id:   "training_free",
    event_type: "training_page_view",
    anon_id:    anonId,
  });

  if (error) {
    await supabase.from("error_logs").insert({
      context: "api/training-view",
      error:   error.message,
      payload: {},
    });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const { count } = await supabase
    .from("video_events")
    .select("*", { count: "exact", head: true })
    .eq("video_id", "training_free")
    .eq("event_type", "training_page_view");

  return NextResponse.json({ success: true, count: count ?? 0 });
}
