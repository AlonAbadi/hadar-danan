// חדר השידור — reopen a READY edit for re-editing (trim / zoom / captions).
// Flips the edit back to 'awaiting_captions' with its captions, trims and
// framing transform intact as the prefill; the next approval re-burns over
// the same output object. Requires the raw take to still exist in storage —
// after retention cleanup there is nothing to re-cut and the answer is 410.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";

export const dynamic = "force-dynamic";

const BUCKET = "broadcast-takes";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const db = createServerClient() as any;
    const { data: edit } = await db
      .from("broadcast_edits")
      .select("id, take_id, status")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!edit) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (edit.status !== "ready") {
      return NextResponse.json({ error: "not_ready" }, { status: 409 });
    }

    const { data: take } = await db
      .from("broadcast_takes")
      .select("id, storage_path")
      .eq("id", edit.take_id)
      .maybeSingle();
    const { data: signed } = take?.storage_path
      ? await db.storage.from(BUCKET).createSignedUrl(take.storage_path, 60)
      : { data: null };
    if (!signed?.signedUrl) {
      return NextResponse.json({ error: "take_gone" }, { status: 410 });
    }

    // Optimistic lock — only flips from 'ready', double-taps lose harmlessly.
    const { data: claimed } = await db
      .from("broadcast_edits")
      .update({ status: "awaiting_captions", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "ready")
      .select("id")
      .maybeSingle();
    if (!claimed) return NextResponse.json({ error: "not_ready" }, { status: 409 });

    // Keep the raw take alive while she edits — cleanup must not eat it.
    await db
      .from("broadcast_takes")
      .update({ expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() })
      .eq("id", edit.take_id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    await logBroadcastError("/api/broadcast/edits/[id]/reopen", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
