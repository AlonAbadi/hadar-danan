// חדר השידור — server-rendered filmstrip for the trim strip.
// GET -> image/jpeg: 10 evenly-spaced frames tiled into one 720x128 strip.
//
// Why server-side (Alon field saga, 2026-07-22): phone MP4s are FRAGMENTED
// (moof/mdat, no sidx index), so browser-side frame grabbing must download
// the file linearly to reach each seek target — every seek "times out" and
// the strip renders empty. ffmpeg on the server seeks the local file
// instantly; the client gets one ~50KB JPEG. Cached per take in storage.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";
import { runFfmpeg, scratchDir, scratchCleanup } from "@/lib/broadcast/ffmpeg";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BUCKET = "broadcast-takes";
const FRAMES = 10;
const TILE_W = 72;
const TILE_H = 128;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;

    const db = createServerClient() as any;
    const { data: take } = await db
      .from("broadcast_takes")
      .select("id, user_id, storage_path, duration_seconds, status")
      .eq("id", id)
      .maybeSingle();
    if (!take || take.user_id !== session.userId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const cachePath = `${session.authUserId}/filmstrips/${take.id}.jpg`;
    const cacheDir = cachePath.split("/").slice(0, -1).join("/");
    const cacheName = cachePath.split("/").pop()!;
    const { data: existing } = await db.storage
      .from(BUCKET)
      .list(cacheDir, { search: cacheName, limit: 1 });
    if (existing?.some((o: { name: string }) => o.name === cacheName)) {
      const { data: file } = await db.storage.from(BUCKET).download(cachePath);
      if (file) {
        return new NextResponse(Buffer.from(await file.arrayBuffer()), {
          headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" },
        });
      }
    }

    const { data: src } = await db.storage.from(BUCKET).download(take.storage_path);
    if (!src) return NextResponse.json({ error: "take_object_missing" }, { status: 410 });

    const scratch = scratchDir(`strip-${take.id}`);
    try {
      const inPath = path.join(scratch, "in.mp4");
      writeFileSync(inPath, Buffer.from(await src.arrayBuffer()));

      // Duration truth: the DB row (client-measured at upload); ffmpeg
      // fallback would need a stderr parse — the row is always present in
      // practice and a slightly-off duration only shifts frame timestamps.
      const dur = Number(take.duration_seconds) > 0 ? Number(take.duration_seconds) : 60;

      const framePaths: string[] = [];
      for (let i = 0; i < FRAMES; i++) {
        const t = ((i + 0.5) / FRAMES) * dur;
        const out = path.join(scratch, `f${i}.jpg`);
        // Input seeking (-ss before -i) = instant keyframe seek on a local
        // file; autorotate honors the displaymatrix like the burn does.
        await runFfmpeg([
          "-ss", t.toFixed(2),
          "-i", inPath,
          "-frames:v", "1",
          "-vf", `scale=${TILE_W}:${TILE_H}:force_original_aspect_ratio=increase,crop=${TILE_W}:${TILE_H}`,
          "-q:v", "6",
          out,
        ]);
        framePaths.push(out);
      }

      const stripPath = path.join(scratch, "strip.jpg");
      await runFfmpeg([
        ...framePaths.flatMap((p) => ["-i", p]),
        "-filter_complex", `${framePaths.map((_, i) => `[${i}:v]`).join("")}hstack=inputs=${FRAMES}`,
        "-q:v", "6",
        stripPath,
      ]);

      const jpg = readFileSync(stripPath);
      await db.storage
        .from(BUCKET)
        .upload(cachePath, jpg, { contentType: "image/jpeg", upsert: true })
        .catch(() => { /* cache write is best-effort */ });

      return new NextResponse(jpg, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" },
      });
    } finally {
      scratchCleanup(`strip-${take.id}`);
    }
  } catch (e) {
    await logBroadcastError("/api/broadcast/takes/[id]/filmstrip", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
