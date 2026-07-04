// חדר השידור — first download = approval: creates the pending review item in
// ביקורת פוסטים, bumps the reels counter, and extends the selected raw take's
// retention to downloaded_at + 7 days. Idempotent — repeat downloads no-op.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const db = createServerClient() as any;
    // Idempotency lock: only the first approve sets downloaded_at.
    const { data: claimed } = await db
      .from("broadcast_edits")
      .update({ downloaded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.userId)
      .eq("status", "ready")
      .is("downloaded_at", null)
      .select("id, take_id")
      .maybeSingle();
    if (!claimed) return NextResponse.json({ ok: true, already: true });

    const { data: item, error: riError } = await db
      .from("review_items")
      .insert({
        user_id: session.userId,
        source: "broadcast",
        status: "pending",
        is_test: session.isTest,
      })
      .select("id")
      .single();
    if (riError) throw new Error(riError.message);

    await db.from("broadcast_edits").update({ review_item_id: item.id }).eq("id", claimed.id);

    // Selected raw take: keep 7 days from approval, then the cleanup cron
    // removes it (the burned output is the deliverable).
    await db
      .from("broadcast_takes")
      .update({ expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() })
      .eq("id", claimed.take_id);

    // reels_count: counter only in v1 (future 10-reels shoot-day offer).
    const { data: user } = await db
      .from("users")
      .select("reels_count")
      .eq("id", session.userId)
      .maybeSingle();
    await db
      .from("users")
      .update({ reels_count: (user?.reels_count ?? 0) + 1 })
      .eq("id", session.userId);

    return NextResponse.json({ ok: true, review_item_id: item.id });
  } catch (e) {
    await logBroadcastError("/api/broadcast/edits/[id]/approve", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
