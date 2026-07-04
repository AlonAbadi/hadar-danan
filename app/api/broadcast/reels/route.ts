// חדר השידור — "התכנים שלי": every finished reel the member produced, with
// thumbnail, download URL, and its publish state (mark-only review flow).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";

export const dynamic = "force-dynamic";

const BUCKET = "broadcast-takes";

export async function GET() {
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const db = createServerClient() as any;
    const { data: edits, error } = await db
      .from("broadcast_edits")
      .select("id, video_number, output_path, review_item_id, created_at")
      .eq("user_id", session.userId)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    if (!edits?.length) return NextResponse.json({ reels: [] });

    const itemIds = edits.map((e: any) => e.review_item_id).filter(Boolean);
    const { data: items } = itemIds.length
      ? await db.from("review_items").select("id, status").in("id", itemIds)
      : { data: [] };

    const reels = await Promise.all(
      edits.map(async (e: any) => {
        const prefix = e.output_path?.split("/")[0];
        const [thumb, download] = await Promise.all([
          prefix
            ? db.storage.from(BUCKET).createSignedUrl(`${prefix}/covers/${e.id}-frame0.jpg`, 3600)
            : Promise.resolve({ data: null }),
          e.output_path
            ? db.storage
                .from(BUCKET)
                .createSignedUrl(e.output_path, 7200, { download: `reel-${e.video_number}.mp4` })
            : Promise.resolve({ data: null }),
        ]);
        const item = items?.find((i: any) => i.id === e.review_item_id);
        return {
          edit_id: e.id,
          review_item_id: e.review_item_id,
          video_number: e.video_number,
          created_at: e.created_at,
          published: item?.status === "published",
          thumb_url: thumb.data?.signedUrl ?? null,
          download_url: download.data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ reels });
  } catch (e) {
    await logBroadcastError("/api/broadcast/reels GET", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
