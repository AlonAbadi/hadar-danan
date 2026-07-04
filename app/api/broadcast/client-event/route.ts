// חדר השידור — client observability beacon (sendBeacon-safe): recorder
// errors, stalled uploads, permission denials, Realtime fallbacks. Best-effort
// by design; never blocks the user path.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPES = new Set([
  "recorder_error",
  "upload_stalled",
  "permission_denied",
  "realtime_fallback_to_poll",
  "capture_recipe",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = typeof body.type === "string" && TYPES.has(body.type) ? body.type : null;
    if (!type) return NextResponse.json({ ok: true });
    const db = createServerClient() as any;
    await db.from("error_logs").insert({
      context: `broadcast/client:${type}`,
      error: JSON.stringify({
        take_id: body.take_id ?? null,
        edit_id: body.edit_id ?? null,
        detail: typeof body.detail === "string" ? body.detail.slice(0, 400) : body.detail ?? null,
        ua: req.headers.get("user-agent")?.slice(0, 200) ?? null,
      }),
    });
  } catch { /* beacons are fire-and-forget */ }
  return NextResponse.json({ ok: true });
}
