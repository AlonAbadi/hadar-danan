// חדר השידור — cover generation: the chosen frame + the hook in brand
// typography + the "מצולם, לא מיוצר" stamp, composed as HTML and rendered by
// HCTI (real Chrome — proven Hebrew BiDi, same pattern as the share-card).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logBroadcastError, resolveBroadcastSession } from "@/lib/broadcast/auth";
import { createHctiImage } from "@/lib/htmlcsstoimage";
import { getBroadcastCopy } from "@/lib/broadcast-copy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "broadcast-takes";

function coverHtml(frameUrl: string, hook: string): { html: string; css: string } {
  return {
    html: `
<div class="cover" dir="rtl">
  <img class="frame" src="${frameUrl}" alt="" />
  <div class="scrim"></div>
  <p class="hook">${hook.replace(/</g, "&lt;")}</p>
  <p class="stamp">${getBroadcastCopy("output.stamp")}</p>
</div>`,
    css: `
.cover { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #080C14; font-family: 'Assistant', sans-serif; }
.frame { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,12,20,0.92) 0%, rgba(8,12,20,0.55) 30%, transparent 60%); }
.hook { position: absolute; bottom: 200px; right: 80px; left: 80px; margin: 0; color: #E8B94A; font-size: 76px; line-height: 1.35; font-weight: 700; text-align: center; text-shadow: 0 2px 14px rgba(0,0,0,0.85), 0 4px 28px rgba(0,0,0,0.65); text-wrap: balance; }
.stamp { position: absolute; bottom: 100px; right: 0; left: 0; margin: 0; text-align: center; color: #E8B94A; font-size: 30px; letter-spacing: 2px; opacity: 0.9; }`,
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await resolveBroadcastSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const frameIndex = Number(body.frame_index);
    if (![0, 1, 2].includes(frameIndex)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const db = createServerClient() as any;
    const { data: edit } = await db
      .from("broadcast_edits")
      .select("id, status, output_path, extraction_id, video_number")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!edit || edit.status !== "ready" || !edit.output_path) {
      return NextResponse.json({ error: "not_ready" }, { status: 409 });
    }

    const prefix = edit.output_path.split("/")[0];
    const framePath = `${prefix}/covers/${edit.id}-frame${frameIndex}.jpg`;
    const { data: signed } = await db.storage.from(BUCKET).createSignedUrl(framePath, 600);
    if (!signed?.signedUrl) return NextResponse.json({ error: "frame_missing" }, { status: 404 });

    // The hook text from the script (JSONB plan).
    const { data: ext } = await db
      .from("signal_extractions")
      .select("signal")
      .eq("id", edit.extraction_id)
      .maybeSingle();
    const signal = ext?.signal ?? {};
    const fromPlan = Array.isArray(signal.shoot_day?.videos)
      ? signal.shoot_day.videos.find((v: any) => v?.number === edit.video_number)
      : null;
    const hook = String((fromPlan ?? signal[`shoot_day_v${edit.video_number}`])?.script?.hook ?? "");

    const { html, css } = coverHtml(signed.signedUrl, hook);
    const result = await createHctiImage({
      html,
      css,
      googleFonts: "Assistant:wght@700",
      viewportWidth: 1080,
      viewportHeight: 1920,
      msDelay: 600,
    });
    if (!result.ok) throw new Error(`cover:hcti:${result.error}`);

    // Re-host the PNG in our bucket (HCTI URLs are external).
    const pngRes = await fetch(result.imageUrl);
    if (!pngRes.ok) throw new Error(`cover:fetch_png:${pngRes.status}`);
    const coverPath = `${prefix}/covers/${edit.id}.png`;
    const { error: upError } = await db.storage
      .from(BUCKET)
      .upload(coverPath, Buffer.from(await pngRes.arrayBuffer()), {
        contentType: "image/png",
        upsert: true,
      });
    if (upError) throw new Error(`cover:upload:${upError.message}`);

    await db
      .from("broadcast_edits")
      .update({ cover_path: coverPath, updated_at: new Date().toISOString() })
      .eq("id", edit.id);

    const { data: coverSigned } = await db.storage.from(BUCKET).createSignedUrl(coverPath, 7200);
    return NextResponse.json({ cover_url: coverSigned?.signedUrl ?? null });
  } catch (e) {
    await logBroadcastError("/api/broadcast/edits/[id]/cover", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
