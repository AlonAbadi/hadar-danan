// חדר השידור — select a take: computes the version (max 3 non-failed per
// script, the partial unique index backstops races), inserts the edit at
// 'queued', returns 202 immediately and runs transcription detached via
// waitUntil. Only the selected take ever enters processing.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";
import { runTranscribeStage } from "@/lib/broadcast/transcribe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const db = createServerClient() as any;
    const { data: take } = await db
      .from("broadcast_takes")
      .select("id, status, extraction_id, video_number, duration_seconds")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!take) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (take.status === "recorded") {
      return NextResponse.json({ error: "not_uploaded" }, { status: 409 });
    }
    const durationMs = (take.duration_seconds ?? 0) * 1000;
    if (durationMs > 0 && (durationMs < 10_000 || durationMs > 180_000)) {
      return NextResponse.json({ error: "duration_out_of_range" }, { status: 422 });
    }

    // Version = the smallest free slot in {1,2,3}. Deleting an episode frees
    // its slot (field bug: versions {1,3} occupied after a deletion made
    // count+1 collide with 3 and block filming forever). Cap = 3 ACTIVE
    // versions, aligned with the delete-to-refilm model.
    const { data: versionRows } = await db
      .from("broadcast_edits")
      .select("version")
      .eq("extraction_id", take.extraction_id)
      .eq("video_number", take.video_number)
      .neq("status", "failed");
    const taken = new Set((versionRows ?? []).map((r: { version: number }) => r.version));
    const version = [1, 2, 3].find((v) => !taken.has(v));
    if (!version) return NextResponse.json({ error: "version_limit" }, { status: 409 });

    // Season cap (second gate — takes may predate the cap): 7 non-failed
    // edits per member; deleting an episode frees a slot.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: seasonCount } = await (db as any)
      .from("broadcast_edits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .neq("status", "failed");
    if ((seasonCount ?? 0) >= 7) {
      return NextResponse.json({ error: "season_full" }, { status: 409 });
    }

    const { data: edit, error } = await db
      .from("broadcast_edits")
      .insert({
        take_id: take.id,
        user_id: session.userId,
        extraction_id: take.extraction_id,
        video_number: take.video_number,
        version,
        status: "queued",
        is_test: session.isTest,
      })
      .select("id, take_id, user_id, extraction_id, video_number")
      .single();
    if (error) {
      // Unique-index collision = concurrent select raced us to the version.
      if (String(error.message).includes("uniq_broadcast_edits_script_version")) {
        return NextResponse.json({ error: "version_conflict" }, { status: 409 });
      }
      throw new Error(error.message);
    }

    await db.from("broadcast_takes").update({ status: "selected" }).eq("id", take.id);

    // Claim + detach: transcription continues after the 202.
    const { data: claimed } = await db
      .from("broadcast_edits")
      .update({ status: "transcribing", processing_started_at: new Date().toISOString() })
      .eq("id", edit.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();
    if (claimed) waitUntil(runTranscribeStage(edit));

    return NextResponse.json({ edit_id: edit.id, version }, { status: 202 });
  } catch (e) {
    await logBroadcastError("/api/broadcast/takes/[id]/select", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
