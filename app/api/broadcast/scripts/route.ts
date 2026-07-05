// חדר השידור — the member's shoot-day scripts, app-shaped (the mobile app's
// list screen). Same data the /kaveret page assembles server-side.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!session.hiveActive) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const db = createServerClient() as any;
    const { data: ext } = await db
      .from("signal_extractions")
      .select("id, signal")
      .eq("user_id", session.userId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!ext) return NextResponse.json({ extraction_id: null, scripts: [] });

    const signal = ext.signal ?? {};
    const toScript = (v: any) => ({
      number: v.number,
      title: String(v.title ?? ""),
      hook: String(v.script?.hook ?? ""),
      body: String(v.script?.body ?? ""),
      cta: v.script?.cta ? String(v.script.cta) : "",
    });
    const scripts = Array.isArray(signal.shoot_day?.videos)
      ? signal.shoot_day.videos.map(toScript)
      : Array.from({ length: 12 }, (_, i) => i + 1)
          .filter((n) => signal[`shoot_day_v${n}`])
          .map((n) => toScript(signal[`shoot_day_v${n}`]));

    const { data: readyEdits } = await db
      .from("broadcast_edits")
      .select("video_number")
      .eq("extraction_id", ext.id)
      .eq("status", "ready");
    const filmed = Array.from(
      new Set((readyEdits ?? []).map((e: { video_number: number }) => e.video_number))
    );

    return NextResponse.json({ extraction_id: ext.id, scripts, filmed });
  } catch (e) {
    await logBroadcastError("/api/broadcast/scripts", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
