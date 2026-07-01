/**
 * POST /api/admin/signal/gap-review  — INTERNAL, admin-only.
 *
 * Records a human reviewer's verdict on a computed gap read (precise / close /
 * missed / harmful), for the internal validation loop that must clear before
 * the gap engine is ever shown to a user. "harmful" is a hard gate: any harmful
 * verdict blocks launch (per SIGNAL_GAP_SOLUTION.md).
 *
 * Body: { id: UUID, verdict: 'precise'|'close'|'missed'|'harmful', note?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const VALID = new Set(["precise", "close", "missed", "harmful"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

function admin(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return null;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD) return user;
    if (user === process.env.ADMIN_USERNAME_2 && pass === process.env.ADMIN_PASSWORD_2) return user;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = admin(req);
  if (!user) return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });

  let body: { id?: string; verdict?: string; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 }); }

  const { id, verdict, note } = body;
  if (!id || !verdict || !VALID.has(verdict)) {
    return NextResponse.json({ error: "שדות לא תקינים" }, { status: 400 });
  }

  const supabase = createServerClient();
  try {
    const { error } = await safeFrom(supabase, "signal_extractions")
      .update({
        gap_review_verdict: verdict,
        gap_review_by:      user,
        gap_review_note:    note ?? null,
        gap_review_at:      new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await safeFrom(supabase, "error_logs").insert({ context: "api/admin/signal/gap-review", error: msg, payload: { id, verdict } });
    return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
  }
}
