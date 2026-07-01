import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/signal/handoff
 *
 * Advances a signal lead through Hadar's manual handoff workflow on
 * /admin/signal:
 *   - stage="whatsapp_sent"  → Hadar clicked "שלח ווטסאפ" (stamps handoff_wa_sent_at)
 *   - stage="meeting_booked" → Hadar marked "סגר פגישה" (stamps handoff_booked_at,
 *                              fires CALL_BOOKED, bumps user status to "booked")
 *
 * Removal from the list is NOT done here — it's computed at read time
 * (meeting_booked + a completed purchase = paid → hidden). purchases stays the
 * source of truth for payment.
 *
 * Body: { id: signal_extraction UUID, stage: "whatsapp_sent" | "meeting_booked" }
 *
 * /api/* is excluded from the middleware Basic Auth (proxy.ts matcher), so this
 * route authenticates itself against the same admin credentials.
 */

const VALID_STAGES = new Set(["whatsapp_sent", "meeting_booked"]);

function isAdminAuthorized(req: NextRequest): { ok: boolean; username: string } {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return { ok: false, username: "" };
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD) {
      return { ok: true, username: user };
    }
    if (user === process.env.ADMIN_USERNAME_2 && pass === process.env.ADMIN_PASSWORD_2) {
      return { ok: true, username: user };
    }
    return { ok: false, username: "" };
  } catch {
    return { ok: false, username: "" };
  }
}

export async function POST(req: NextRequest) {
  const auth = isAdminAuthorized(req);
  if (!auth.ok) return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });

  let body: { id?: string; stage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  const { id, stage } = body;
  if (!id || !stage) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }
  if (!VALID_STAGES.has(stage)) {
    return NextResponse.json({ error: "שלב לא חוקי" }, { status: 400 });
  }

  const supabase = createServerClient();
  const now = new Date().toISOString();

  try {
    // Look up the extraction's user_id (needed for the booked side effects).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ext, error: extErr } = await (supabase as any)
      .from("signal_extractions")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();
    if (extErr) throw extErr;
    if (!ext) return NextResponse.json({ error: "אבחון לא נמצא" }, { status: 404 });

    // Stamp the stage on the extraction row.
    const patch: Record<string, unknown> = { handoff_stage: stage, handoff_by: auth.username };
    if (stage === "whatsapp_sent")  patch.handoff_wa_sent_at = now;
    if (stage === "meeting_booked") patch.handoff_booked_at   = now;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: stampErr } = await (supabase as any)
      .from("signal_extractions")
      .update(patch)
      .eq("id", id);
    if (stampErr) throw stampErr;

    // On "סגר פגישה": bump user status + log the state-machine event.
    if (stage === "meeting_booked" && ext.user_id) {
      await supabase
        .from("users")
        .update({ status: "booked" })
        .eq("id", ext.user_id);
      await supabase.from("events").insert({
        user_id: ext.user_id,
        type:    "CALL_BOOKED",
        metadata: { source: "admin/signal-handoff", outcome_by: auth.username },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("error_logs").insert({
      context: "api/admin/signal/handoff",
      error:   msg,
      payload: { id, stage },
    });
    return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
  }
}
