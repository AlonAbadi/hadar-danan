// חדר השידור — takes collection: create a take row (before upload) and list
// takes for a script. The row is created BEFORE the TUS upload starts so no
// take can exist in storage without a row (iron rule: אף טייק לא הולך לאיבוד).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";
import { rateLimit } from "@/lib/rate-limit";
import { seasonCapFor } from "@/lib/broadcast/season-cap";

export const dynamic = "force-dynamic";

const BUCKET = "broadcast-takes";
const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Ownership + script existence: the script is (extraction_id, video_number)
// inside signal_extractions.signal — shoot_day.videos[] or the per-video cache.
async function scriptExists(
  db: any,
  userId: string,
  extractionId: string,
  videoNumber: number
): Promise<boolean> {
  const { data } = await db
    .from("signal_extractions")
    .select("id, user_id, signal")
    .eq("id", extractionId)
    .maybeSingle();
  if (!data || data.user_id !== userId) return false;
  const signal = data.signal ?? {};
  const inPlan = Array.isArray(signal.shoot_day?.videos)
    ? signal.shoot_day.videos.some((v: { number?: number }) => v?.number === videoNumber)
    : false;
  return inPlan || Boolean(signal[`shoot_day_v${videoNumber}`]);
}

export async function POST(req: NextRequest) {
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!session.hiveActive) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (!rateLimit(`broadcast-take:${session.userId}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const extractionId = typeof body.extraction_id === "string" ? body.extraction_id : "";
    const videoNumber = Number(body.video_number);
    const mime = typeof body.mime_type === "string" ? body.mime_type.split(";")[0] : "";
    const ext = EXT_BY_MIME[mime];
    // Phone captures carry a portrait INTENT even when the sensor delivers a
    // landscape buffer with no rotation tag (Android Chrome). The intent is
    // encoded in the object name (".p.") — zero schema change — and the burn
    // routes such takes into the 9:16 portrait chain (field case 2026-07-14:
    // Android shipped a 4:3 "square" reel through the full-frame branch).
    const phoneCapture = body.capture_hint === "phone";
    if (!extractionId || !Number.isInteger(videoNumber) || videoNumber < 1 || videoNumber > 12 || !ext) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const db = createServerClient();
    if (!(await scriptExists(db as any, session.userId, extractionId, videoNumber))) {
      return NextResponse.json({ error: "script_not_found" }, { status: 404 });
    }

    // Season cap: the Hebrew package grants 7 episodes; the English free
    // launch grants 1. At the cap the member must delete an episode (frees
    // the slot) before filming again.
    const seasonCap = await seasonCapFor(db as any, extractionId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: seasonCount } = await (db as any)
      .from("broadcast_edits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .neq("status", "failed");
    if ((seasonCount ?? 0) >= seasonCap) {
      return NextResponse.json({ error: "season_full" }, { status: 409 });
    }

    // Version cap: 3 takes per script. Enforced also at /takes/[id]/select as
    // the last-line defense, but doing it here saves the customer from
    // recording a fourth take that would be rejected on select. Alon
    // 2026-07-11: "תבנה מנגנון שאוכף את זה ומסביר את זה".
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: versionCount } = await (db as any)
      .from("broadcast_edits")
      .select("id", { count: "exact", head: true })
      .eq("extraction_id", extractionId)
      .eq("video_number", videoNumber)
      .neq("status", "failed");
    if ((versionCount ?? 0) >= 3) {
      return NextResponse.json({ error: "version_limit" }, { status: 409 });
    }

    const takeId = randomUUID();
    const storagePath = `${session.authUserId}/takes/${takeId}.${phoneCapture ? "p." : ""}${ext}`;
    const { error } = await (db as any).from("broadcast_takes").insert({
      id: takeId,
      user_id: session.userId,
      extraction_id: extractionId,
      video_number: videoNumber,
      storage_path: storagePath,
      status: "recorded",
      is_test: session.isTest,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      take_id: takeId,
      bucket: BUCKET,
      object_name: storagePath,
      content_type: mime,
    });
  } catch (e) {
    await logBroadcastError("/api/broadcast/takes POST", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const extractionId = req.nextUrl.searchParams.get("extraction_id") ?? "";
    const videoNumber = Number(req.nextUrl.searchParams.get("video_number"));
    if (!extractionId || !Number.isInteger(videoNumber)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const db = createServerClient();
    const { data: takes, error } = await (db as any)
      .from("broadcast_takes")
      .select("id, status, duration_seconds, storage_path, created_at, suggested_trim_start_ms, suggested_trim_end_ms")
      .eq("user_id", session.userId)
      .eq("extraction_id", extractionId)
      .eq("video_number", videoNumber)
      .neq("status", "expired")
      .order("created_at", { ascending: true })
      .limit(30);
    if (error) throw new Error(error.message);

    // Signed preview URLs only for takes whose object is confirmed uploaded.
    const withUrls = await Promise.all(
      (takes ?? []).map(async (t: { id: string; status: string; storage_path: string }) => {
        let preview_url: string | null = null;
        if (t.status !== "recorded") {
          const { data: signed } = await (db as any).storage
            .from(BUCKET)
            .createSignedUrl(t.storage_path, 3600);
          preview_url = signed?.signedUrl ?? null;
        }
        return { ...t, storage_path: undefined, preview_url };
      })
    );

    return NextResponse.json({ takes: withUrls });
  } catch (e) {
    await logBroadcastError("/api/broadcast/takes GET", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
