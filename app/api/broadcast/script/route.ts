// חדר השידור — member edits their own script before filming.
// POST { extraction_id, video_number, hook, body, cta } -> { ok }
//
// Alon 2026-07-22: engine Hebrew slips (conjunctions, ה' הידיעה) are minor —
// the fix is ownership: the member reads the script aloud and fixes any word
// that doesn't sit right BEFORE the camera. The edit is saved onto the
// video's slice (signal.shoot_day_v{n} / shoot_day_s2_v{n}) via the atomic
// merge RPC, so the teleprompter, the kaveret episode card and the burn all
// see the member's wording. The engine's original is kept once under
// script_original for future regen comparisons.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";
import { findShootDayVideo } from "@/lib/signal/shoot-day-slices";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number): string =>
  String(v ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const bodyJson = await req.json().catch(() => ({}));
    const extractionId = typeof bodyJson.extraction_id === "string" ? bodyJson.extraction_id : "";
    const videoNumber = Number(bodyJson.video_number);
    const hook = clean(bodyJson.hook, 400);
    const scriptBody = clean(bodyJson.body, 2400);
    const cta = clean(bodyJson.cta, 400);
    if (!extractionId || !Number.isInteger(videoNumber) || videoNumber < 1 || videoNumber > 26) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    if (!hook || !scriptBody) {
      return NextResponse.json({ error: "empty_script" }, { status: 400 });
    }

    const db = createServerClient() as any;
    const { data: ext } = await db
      .from("signal_extractions")
      .select("id, user_id, signal")
      .eq("id", extractionId)
      .maybeSingle();
    if (!ext || ext.user_id !== session.userId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const video = findShootDayVideo(ext.signal, videoNumber);
    if (!video?.script?.hook) return NextResponse.json({ error: "script_not_found" }, { status: 404 });

    const updated = {
      ...video,
      number: video.number ?? videoNumber,
      script: { ...video.script, hook, body: scriptBody, cta: cta || undefined },
      script_original: video.script_original ?? video.script,
      script_edited_at: new Date().toISOString(),
    };
    // Writing the slice always wins: findShootDayVideo prefers slices over
    // the legacy shoot_day.videos plan array.
    const field =
      videoNumber >= 21 && videoNumber <= 26
        ? `shoot_day_s2_v${videoNumber}`
        : `shoot_day_v${videoNumber}`;
    const { error } = await db.rpc("signal_merge_field", {
      p_id: extractionId,
      p_field: field,
      p_value: JSON.stringify(updated),
    });
    if (error) throw new Error(`script_save:${error.message}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    await logBroadcastError("/api/broadcast/script", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
