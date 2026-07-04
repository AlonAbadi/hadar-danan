// חדר השידור — the 90-second handoff: the client's timer fired while the burn
// was still running, so she left the screen. Flag the edit; the burn stage
// enqueues the WhatsApp job when it finishes.
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
    await db
      .from("broadcast_edits")
      .update({ notify_on_ready: true })
      .eq("id", id)
      .eq("user_id", session.userId)
      .in("status", ["burning", "transcribing", "queued"]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    await logBroadcastError("/api/broadcast/edits/[id]/notify", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
