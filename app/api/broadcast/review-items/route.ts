// חדר השידור — pending review items for the ביקורת פוסטים tab section.
// v1 is mark-only: list pending items (joined back to their edit for the
// cover + script context); a separate route flips them to 'published'.
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
    const { data: items, error } = await db
      .from("review_items")
      .select("id, created_at")
      .eq("user_id", session.userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    if (!items?.length) return NextResponse.json({ items: [] });

    const { data: edits } = await db
      .from("broadcast_edits")
      .select("review_item_id, video_number, cover_path, output_path")
      .in("review_item_id", items.map((i: { id: string }) => i.id));

    const enriched = await Promise.all(
      items.map(async (item: { id: string; created_at: string }) => {
        const edit = edits?.find((e: any) => e.review_item_id === item.id);
        let coverUrl: string | null = null;
        if (edit?.cover_path) {
          const { data } = await db.storage.from(BUCKET).createSignedUrl(edit.cover_path, 3600);
          coverUrl = data?.signedUrl ?? null;
        }
        return {
          id: item.id,
          created_at: item.created_at,
          video_number: edit?.video_number ?? null,
          cover_url: coverUrl,
        };
      })
    );

    return NextResponse.json({ items: enriched });
  } catch (e) {
    await logBroadcastError("/api/broadcast/review-items GET", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
