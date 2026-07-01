import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/handoff
 *
 * Advances a lead through Hadar's manual handoff workflow on /admin/today
 * ("לידים לטיפול מיידי"). State lives on the users row (migration 057) so it is
 * shared across sources (signal strategy leads + high-value quiz leads):
 *
 *   stage="whatsapp_sent"  → Hadar clicked "שלח ווטסאפ" (stamps handoff_wa_sent_at)
 *   stage="meeting_booked" → Hadar marked "סגר פגישה" (stamps handoff_booked_at,
 *                            bumps status→booked, fires CALL_BOOKED)
 *
 * Removal from the worklist is computed at read time (meeting_booked + a
 * completed purchase = paid → hidden). purchases stays the payment source of truth.
 *
 * Body: { user_id: UUID, stage: "whatsapp_sent" | "meeting_booked" }
 *
 * /api/* is excluded from the middleware Basic Auth (proxy.ts matcher), so this
 * route authenticates itself against the admin credentials.
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

  let body: { user_id?: string; stage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  const { user_id, stage } = body;
  if (!user_id || !stage) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }
  if (!VALID_STAGES.has(stage)) {
    return NextResponse.json({ error: "שלב לא חוקי" }, { status: 400 });
  }

  const supabase = createServerClient();
  const now = new Date().toISOString();

  try {
    const patch: Record<string, unknown> = { handoff_stage: stage, handoff_by: auth.username };
    if (stage === "whatsapp_sent")  patch.handoff_wa_sent_at = now;
    if (stage === "meeting_booked") {
      patch.handoff_booked_at = now;
      patch.status = "booked";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: stampErr } = await (supabase as any)
      .from("users")
      .update(patch)
      .eq("id", user_id);
    if (stampErr) throw stampErr;

    // On "סגר פגישה": log the state-machine event too.
    if (stage === "meeting_booked") {
      await supabase.from("events").insert({
        user_id,
        type:     "CALL_BOOKED",
        metadata: { source: "admin/today-handoff", outcome_by: auth.username },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("error_logs").insert({
      context: "api/admin/handoff",
      error:   msg,
      payload: { user_id, stage },
    });
    return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
  }
}
