// חדר השידור — mark a pending review item as published (v1 mark-only flow;
// the existing text post-review API stays untouched by decision).
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
    const { data, error } = await db
      .from("review_items")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.userId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: Boolean(data) });
  } catch (e) {
    await logBroadcastError("/api/broadcast/review-items/[id]/publish", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
