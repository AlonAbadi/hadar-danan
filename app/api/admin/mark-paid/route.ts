import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/mark-paid
 *
 * Records a payment made OUTSIDE Cardcom (bank transfer, cash, etc.) from the
 * /admin/today worklist — for a lead who closed a meeting and paid by transfer.
 *
 * Effects (so the lead behaves like a normal paid customer):
 *   1. Inserts a completed `purchases` row (so revenue + "paid" logic count it).
 *   2. Marks the handoff booked + CRM status=booked (drops from the live queue,
 *      since getImmediateLeads hides meeting_booked + paid).
 *   3. Logs PURCHASE_COMPLETED + CALL_BOOKED events for the record (no email
 *      sequences fired — the person already closed with Hadar directly).
 *
 * Body: { user_id: UUID, amount: number, product?: ProductKey }
 *
 * /api/* is excluded from middleware Basic Auth, so it self-authenticates.
 */

function isAdminAuthorized(req: NextRequest): { ok: boolean; username: string } {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return { ok: false, username: "" };
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD) return { ok: true, username: user };
    if (user === process.env.ADMIN_USERNAME_2 && pass === process.env.ADMIN_PASSWORD_2) return { ok: true, username: user };
    return { ok: false, username: "" };
  } catch {
    return { ok: false, username: "" };
  }
}

const VALID_PRODUCTS = new Set([
  "challenge_197", "signal_hive_590", "workshop_1080", "course_1800", "strategy_4000", "premium_14000",
]);

export async function POST(req: NextRequest) {
  const auth = isAdminAuthorized(req);
  if (!auth.ok) return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });

  let body: { user_id?: string; amount?: number; product?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 }); }

  const { user_id } = body;
  const amount = Number(body.amount);
  const product = body.product && VALID_PRODUCTS.has(body.product) ? body.product : "strategy_4000";
  if (!user_id || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "חסר user_id או סכום תקין" }, { status: 400 });
  }

  const supabase = createServerClient();
  const now = new Date().toISOString();

  try {
    // 1. Completed purchase (bank transfer marker in cardcom_ref for traceability)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: purErr } = await (supabase as any).from("purchases").insert({
      user_id,
      product,
      amount,
      amount_paid: amount,
      currency:    "ILS",
      status:      "completed",
      cardcom_ref: `manual_bank_${user_id}_${Date.now()}`,
    });
    if (purErr) throw purErr;

    // 2. Book + convert on the user row → drops from the live worklist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("users").update({
      handoff_stage:    "meeting_booked",
      handoff_booked_at: now,
      handoff_by:       auth.username,
      status:           "booked",
    }).eq("id", user_id);

    // 3. Record events (no sequences — closed directly with Hadar)
    await supabase.from("events").insert([
      { user_id, type: "PURCHASE_COMPLETED", metadata: { product, amount, method: "bank_transfer", by: auth.username } },
      { user_id, type: "CALL_BOOKED",        metadata: { source: "admin/today-mark-paid", by: auth.username } },
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("error_logs").insert({ context: "api/admin/mark-paid", error: msg, payload: { user_id, amount, product } });
    return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
  }
}
