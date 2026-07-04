// חדר השידור — caption approval: the human gate. Valid only from
// 'awaiting_captions' (optimistic lock — double-tap and two-tab races lose
// here, harmlessly). Stores the approved lines + trims, then detaches the
// burn via waitUntil behind a 202.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";
import { runBurnStage } from "@/lib/broadcast/burn";
import type { CaptionLine, CaptionsPayload } from "@/lib/broadcast/captions";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

const MODES = new Set(["captions", "none", "script_sync"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = typeof body.mode === "string" && MODES.has(body.mode) ? body.mode : "captions";
    const rawLines: unknown[] = Array.isArray(body.lines) ? body.lines : [];
    const lines: CaptionLine[] = rawLines
      .map((l: any, i: number) => ({
        id: typeof l?.id === "string" ? l.id : `l${i + 1}`,
        text: typeof l?.text === "string" ? l.text.slice(0, 120) : "",
        start_ms: Math.max(0, Math.round(Number(l?.start_ms) || 0)),
        end_ms: Math.max(0, Math.round(Number(l?.end_ms) || 0)),
        deleted: l?.deleted === true,
        edited: l?.edited === true,
      }))
      .filter((l) => mode === "none" || (l.text.trim().length > 0 && l.end_ms > l.start_ms) || l.deleted)
      .slice(0, 200);
    const trimStart = Math.max(0, Math.round(Number(body.trim_start_ms) || 0));
    const trimEnd = Math.max(0, Math.round(Number(body.trim_end_ms) || 0));

    const db = createServerClient() as any;
    const { data: current } = await db
      .from("broadcast_edits")
      .select("id, take_id, user_id, extraction_id, video_number, captions, notify_on_ready, is_test")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const captions: CaptionsPayload = {
      source: mode === "captions" ? (current.captions?.source ?? "whisper") : mode === "none" ? "none" : "script",
      words: current.captions?.words ?? [],
      lines: mode === "none" ? [] : lines,
      approved_at: new Date().toISOString(),
    };

    // The optimistic lock: only one approval wins.
    const { data: claimed } = await db
      .from("broadcast_edits")
      .update({
        status: "burning",
        captions,
        trim_start_ms: trimStart,
        trim_end_ms: trimEnd > trimStart ? trimEnd : null,
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "awaiting_captions")
      .select("id, take_id, user_id, trim_start_ms, trim_end_ms, captions, notify_on_ready, is_test")
      .maybeSingle();
    if (!claimed) return NextResponse.json({ error: "already_processing" }, { status: 409 });

    waitUntil(runBurnStage(claimed));
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (e) {
    await logBroadcastError("/api/broadcast/edits/[id]/captions", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
