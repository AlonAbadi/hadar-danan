/**
 * POST /api/hive/cancel
 *
 * Cancels a user's active Hive membership.
 * Checks 14-day refund eligibility based on hive_started_at.
 *
 * Body: { email: string }
 * Response: { success: true, refund_eligible: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { cancelRecurringOrder } from "@/lib/cardcom/recurring";

const BodySchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
});

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "כתובת אימייל לא תקינה" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  const supabase = createServerClient();

  try {
    // Find user by email — include cardcom_recurring_id so we can ask Cardcom
    // to stop the schedule on their side.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userErr } = await (supabase as any)
      .from("users")
      .select("id, name, hive_status, hive_started_at, cardcom_recurring_id")
      .eq("email", email)
      .maybeSingle();

    if (userErr) throw userErr;

    if (!user) {
      return NextResponse.json({ error: "לא נמצא משתמש עם כתובת אימייל זו" }, { status: 404 });
    }

    if (user.hive_status !== "active") {
      return NextResponse.json({ error: "אין מנוי פעיל" }, { status: 400 });
    }

    const now = new Date();

    // Check 14-day refund window
    const startedAt     = user.hive_started_at ? new Date(user.hive_started_at) : null;
    const msIn14Days    = 14 * 24 * 60 * 60 * 1000;
    const refundEligible =
      startedAt !== null && now.getTime() - startedAt.getTime() <= msIn14Days;

    // Stop the recurring order at Cardcom BEFORE marking the user cancelled.
    // If Cardcom rejects the call we still complete cancellation locally and
    // log the error — better to honor the customer's request and reconcile
    // manually than to refuse cancellation because of a SOAP hiccup.
    if (user.cardcom_recurring_id) {
      const stopped = await cancelRecurringOrder(user.cardcom_recurring_id as number);
      if (!stopped.ok) {
        await supabase.from("error_logs").insert({
          context: "api/hive/cancel — cancelRecurringOrder",
          error:   stopped.error,
          payload: {
            user_id:             user.id,
            cardcom_recurring_id: user.cardcom_recurring_id,
            responseCode:        "responseCode" in stopped ? stopped.responseCode : undefined,
          },
        });
      }
    }

    // Update hive_status and hive_cancelled_at
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        hive_status:       "cancelled",
        hive_cancelled_at: now.toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    // Insert HIVE_CANCELLED event
    await supabase.from("events").insert({
      user_id:  user.id,
      type:     "HIVE_CANCELLED",
      metadata: { refund_eligible: refundEligible },
    });

    // Enqueue SEND_EMAIL job for hive_cancelled template
    const { data: cancelledSeq } = await supabase
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "HIVE_CANCELLED")
      .eq("delay_hours", 0)
      .eq("active", true)
      .single();

    if (cancelledSeq) {
      await supabase.from("jobs").insert({
        type:    "SEND_EMAIL",
        payload: {
          user_id:         user.id,
          email,
          name:            user.name ?? email,
          sequence_id:     cancelledSeq.id,
          subject:         cancelledSeq.subject,
          template_key:    cancelledSeq.template_key,
          refund_eligible: refundEligible,
        },
        run_at: now.toISOString(),
        status: "pending",
      });
    }

    return NextResponse.json({ success: true, refund_eligible: refundEligible });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    try {
      await supabase.from("error_logs").insert({
        context: "api/hive/cancel",
        error:   message,
        payload: { email },
      });
    } catch {}

    return NextResponse.json({ error: "שגיאת שרת, נסה שוב" }, { status: 500 });
  }
}
