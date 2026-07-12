// חדר השידור — same-origin streaming proxy for a raw take.
//
// Non-Safari iOS browsers (CriOS/FxiOS) refuse to STREAM cross-origin signed
// storage URLs in <video>, and blob-fetching a 30-80MB take first is minutes
// of dead screen. Serving the bytes from our own origin makes <video> stream
// natively everywhere: Range headers pass through to Supabase storage (which
// supports partial content), so each seek is one small proxied chunk. Auth
// rides the session cookie — same-origin media requests carry it.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BUCKET = "broadcast-takes";
const PASS_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const db = createServerClient() as any;
    const { data: take } = await db
      .from("broadcast_takes")
      .select("id, storage_path")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!take?.storage_path) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const upstream = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${take.storage_path}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          ...(req.headers.get("range") ? { Range: req.headers.get("range")! } : {}),
        },
      }
    );
    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: "storage_error" }, { status: 502 });
    }

    const headers = new Headers();
    for (const h of PASS_HEADERS) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
    headers.set("cache-control", "private, max-age=3600");
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    await logBroadcastError("/api/broadcast/takes/[id]/media", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
