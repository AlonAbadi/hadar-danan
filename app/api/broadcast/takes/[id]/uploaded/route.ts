// חדר השידור — upload confirmation: the client calls this after tus onSuccess.
// The server verifies the object actually exists in storage (service role)
// before flipping the row to 'uploaded' — a row is never trusted on the
// client's word alone.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";

export const dynamic = "force-dynamic";

const BUCKET = "broadcast-takes";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const duration = Number(body.duration_seconds);
    const trimStart = Number.isFinite(Number(body.suggested_trim_start_ms))
      ? Math.max(0, Math.round(Number(body.suggested_trim_start_ms)))
      : null;
    const trimEnd = Number.isFinite(Number(body.suggested_trim_end_ms))
      ? Math.max(0, Math.round(Number(body.suggested_trim_end_ms)))
      : null;

    const db = createServerClient();
    const { data: take } = await (db as any)
      .from("broadcast_takes")
      .select("id, storage_path, status")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!take) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Verify the object exists — list the parent folder filtered to the file.
    const dir = take.storage_path.split("/").slice(0, -1).join("/");
    const file = take.storage_path.split("/").pop()!;
    const { data: objects, error: listError } = await (db as any).storage
      .from(BUCKET)
      .list(dir, { search: file, limit: 1 });
    if (listError) throw new Error(listError.message);
    if (!objects?.some((o: { name: string }) => o.name === file)) {
      return NextResponse.json({ error: "object_missing" }, { status: 409 });
    }

    const { error } = await (db as any)
      .from("broadcast_takes")
      .update({
        status: take.status === "selected" ? "selected" : "uploaded",
        duration_seconds: Number.isFinite(duration) && duration > 0 ? duration : null,
        suggested_trim_start_ms: trimStart,
        suggested_trim_end_ms: trimEnd,
      })
      .eq("id", id)
      .eq("user_id", session.userId);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e) {
    await logBroadcastError("/api/broadcast/takes/[id]/uploaded", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
