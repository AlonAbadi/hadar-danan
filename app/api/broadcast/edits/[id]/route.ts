// חדר השידור — edit status snapshot. This GET is the polling GUARANTEE that
// backs the Realtime accelerator; ready payloads include short-lived signed
// URLs for the output, cover frames, and the selected-take preview.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";

export const dynamic = "force-dynamic";

const BUCKET = "broadcast-takes";
const COVER_FRAME_COUNT = 3;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const db = createServerClient() as any;
    const { data: edit } = await db
      .from("broadcast_edits")
      .select(
        "id, status, error_detail, captions, trim_start_ms, trim_end_ms, output_path, cover_path, take_id, video_number"
      )
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!edit) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // downloadAs forces Content-Disposition: attachment — without it, iOS
    // Safari plays cross-origin video links instead of saving them.
    const sign = async (
      objectPath: string | null,
      ttl = 3600,
      downloadAs?: string
    ): Promise<string | null> => {
      if (!objectPath) return null;
      const { data } = await db.storage
        .from(BUCKET)
        .createSignedUrl(objectPath, ttl, downloadAs ? { download: downloadAs } : undefined);
      return data?.signedUrl ?? null;
    };

    let takePreviewUrl: string | null = null;
    if (edit.status === "awaiting_captions") {
      const { data: take } = await db
        .from("broadcast_takes")
        .select("storage_path")
        .eq("id", edit.take_id)
        .maybeSingle();
      takePreviewUrl = await sign(take?.storage_path ?? null);
    }

    let coverFrames: string[] | null = null;
    let outputUrl: string | null = null;
    let outputDownloadUrl: string | null = null;
    if (edit.status === "ready" && edit.output_path) {
      outputUrl = await sign(edit.output_path, 7200);
      outputDownloadUrl = await sign(edit.output_path, 7200, `reel-${edit.video_number ?? ""}.mp4`);
      const prefix = edit.output_path.split("/")[0];
      const frames = await Promise.all(
        Array.from({ length: COVER_FRAME_COUNT }, (_, i) =>
          sign(`${prefix}/covers/${edit.id}-frame${i}.jpg`)
        )
      );
      coverFrames = frames.filter(Boolean) as string[];
    }

    return NextResponse.json({
      status: edit.status,
      error_detail: edit.error_detail,
      captions: edit.captions,
      trim_start_ms: edit.trim_start_ms,
      trim_end_ms: edit.trim_end_ms,
      take_preview_url: takePreviewUrl,
      // Same-origin streaming proxy — the ONLY <video> source that streams
      // on non-Safari iOS browsers (cross-origin signed URLs don't).
      take_media_url:
        edit.status === "awaiting_captions" && edit.take_id
          ? `/api/broadcast/takes/${edit.take_id}/media`
          : null,
      output_url: outputUrl,
      output_download_url: outputDownloadUrl,
      cover_frames: coverFrames,
      cover_url: await sign(edit.cover_path ?? null, 7200),
      cover_download_url: await sign(edit.cover_path ?? null, 7200, "cover.png"),
    });
  } catch (e) {
    await logBroadcastError("/api/broadcast/edits/[id] GET", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Member deletes a finished reel: storage objects first (output, cover
// frames, custom cover), then the review item, then the edit row — the
// version budget for that script frees up with it. Takes are untouched
// (they expire on their own schedule).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const db = createServerClient() as any;
    const { data: edit } = await db
      .from("broadcast_edits")
      .select("id, status, output_path, cover_path, review_item_id")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!edit) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (edit.status === "transcribing" || edit.status === "burning") {
      return NextResponse.json({ error: "busy" }, { status: 409 });
    }

    const prefix = (edit.output_path ?? edit.cover_path)?.split("/")[0];
    const objects: string[] = [];
    if (edit.output_path) objects.push(edit.output_path);
    if (edit.cover_path) objects.push(edit.cover_path);
    if (prefix) {
      for (let i = 0; i < COVER_FRAME_COUNT; i++) {
        objects.push(`${prefix}/covers/${edit.id}-frame${i}.jpg`);
      }
    }
    if (objects.length) {
      const { error: rmError } = await db.storage.from(BUCKET).remove(objects);
      if (rmError) throw new Error(`delete:objects:${rmError.message}`);
    }

    if (edit.review_item_id) {
      await db.from("review_items").delete().eq("id", edit.review_item_id).eq("user_id", session.userId);
    }
    const { error: delError } = await db
      .from("broadcast_edits")
      .delete()
      .eq("id", edit.id)
      .eq("user_id", session.userId);
    if (delError) throw new Error(`delete:row:${delError.message}`);

    return NextResponse.json({ deleted: true });
  } catch (e) {
    await logBroadcastError("/api/broadcast/edits/[id] DELETE", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
