import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/call-list/outcome
 *
 * Records the outcome of a call from /admin/call-list:
 *   - persists outcome / outcome_at / outcome_by on daily_call_list
 *   - updates users.status accordingly (handled / not_relevant / booked)
 *   - on outcome="booked", also fires a CALL_BOOKED event so downstream
 *     analytics + state machine see it
 *
 * Body: { sent_on: "YYYY-MM-DD", user_id: UUID, outcome, note? }
 */

const VALID_OUTCOMES = new Set(["handled", "not_relevant", "booked"]);

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

  let body: { sent_on?: string; user_id?: string; outcome?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  const { sent_on, user_id, outcome, note } = body;
  if (!sent_on || !user_id || !outcome) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }
  if (!VALID_OUTCOMES.has(outcome)) {
    return NextResponse.json({ error: "תוצאה לא חוקית" }, { status: 400 });
  }

  const supabase = createServerClient();
  const now = new Date().toISOString();

  try {
    // 1. Stamp the daily_call_list row.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: stampErr } = await (supabase as any)
      .from("daily_call_list")
      .update({
        outcome,
        outcome_at:   now,
        outcome_by:   auth.username,
        outcome_note: note ?? null,
      })
      .eq("sent_on", sent_on)
      .eq("user_id", user_id);
    if (stampErr) throw stampErr;

    // 2. Update user status. The candidate query excludes all three of
    //    handled / not_relevant / booked, so this prevents resurfacing.
    const { error: statusErr } = await supabase
      .from("users")
      .update({ status: outcome as "handled" | "not_relevant" | "booked" })
      .eq("id", user_id);
    if (statusErr) throw statusErr;

    // 3. On booked, log the state machine event too.
    if (outcome === "booked") {
      await supabase.from("events").insert({
        user_id,
        type: "CALL_BOOKED",
        metadata: { source: "admin/call-list", outcome_by: auth.username, sent_on },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("error_logs").insert({
      context: "api/admin/call-list/outcome",
      error:   msg,
      payload: { sent_on, user_id, outcome },
    });
    return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
  }
}
