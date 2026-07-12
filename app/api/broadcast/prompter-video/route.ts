// חדר השידור — floating-prompter video for native-camera filming.
// POST { extraction_id, video_number, wpm } -> { url } (signed, cached).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";
import { renderPrompterVideo } from "@/lib/broadcast/prompter-video";
import { findShootDayVideo } from "@/lib/signal/shoot-day-slices";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BUCKET = "broadcast-takes";

export async function POST(req: NextRequest) {
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const extractionId = typeof body.extraction_id === "string" ? body.extraction_id : "";
    const videoNumber = Number(body.video_number);
    const wpm = Math.min(Math.max(Math.round(Number(body.wpm) / 5) * 5 || 130, 80), 220);
    if (!extractionId || !Number.isInteger(videoNumber) || videoNumber < 1 || videoNumber > 12) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
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

    const storagePath = await renderPrompterVideo({
      authPrefix: session.authUserId,
      videoNumber,
      wpm,
      hook: String(video.script.hook),
      body: String(video.script.body ?? ""),
      cta: video.script.cta ? String(video.script.cta) : undefined,
      // English members (signal.language === "en") get the wider Latin line
      // metrics and a "-en" cache key so Hebrew renders never collide.
      language: ext.signal?.language === "en" ? "en" : "he",
    });

    const { data: signed } = await db.storage.from(BUCKET).createSignedUrl(storagePath, 7200);
    if (!signed?.signedUrl) throw new Error("prompter:sign_failed");
    return NextResponse.json({ url: signed.signedUrl, wpm });
  } catch (e) {
    await logBroadcastError("/api/broadcast/prompter-video", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
