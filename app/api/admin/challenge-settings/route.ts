/**
 * POST /api/admin/challenge-settings
 * Updates the challenge_settings row (live meeting date + Zoom URL).
 * Admin-only — no auth beyond Basic Auth on /admin/* in middleware.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { settings_id, next_live_meeting_date, live_meeting_zoom_url } = await req.json().catch(() => ({}));

  if (!settings_id) return NextResponse.json({ error: "settings_id required" }, { status: 400 });

  const db = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from("challenge_settings")
    .update({
      next_live_meeting_date: next_live_meeting_date ?? null,
      live_meeting_zoom_url:  live_meeting_zoom_url  ?? null,
      updated_at:             new Date().toISOString(),
    })
    .eq("id", settings_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
