import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const BookingSchema = z.object({
  name:         z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  email:        z.string().email("אימייל לא תקין"),
  phone:        z.string().regex(/^0[5][0-9]{8}$/, "מספר טלפון לא תקין - פורמט: 05XXXXXXXX"),
  slot_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
  slot_time:    z.enum(["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]).refine(Boolean, "שעה לא תקינה"),
  anonymous_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // ── Rate limit: 3 bookings / minute per IP ───────────────
  const ip = getClientIp(req);
  if (!rateLimit(`book:${ip}`, 3, 60_000)) {
    return NextResponse.json(
      { error: "יותר מדי ניסיונות. נסה שוב בעוד דקה." },
      { status: 429 }
    );
  }

  // ── Parse & validate ─────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "קלט לא תקין";
    return NextResponse.json({ error }, { status: 422 });
  }

  const { name, email, phone, slot_date, slot_time, anonymous_id } = parsed.data;

  // ── Reject past dates ────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  if (slot_date <= today) {
    return NextResponse.json({ error: "לא ניתן לקבוע פגישה לתאריך שעבר" }, { status: 422 });
  }

  const supabase = createServerClient();

  try {
    // ── Check slot availability ───────────────────────────
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("slot_date", slot_date)
      .eq("slot_time", slot_time)
      .eq("status", "confirmed")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "המועד הזה כבר נתפס. אנא בחר/י מועד אחר." },
        { status: 409 }
      );
    }

    // ── Upsert user ───────────────────────────────────────
    const { data: user, error: upsertErr } = await supabase
      .from("users")
      .upsert(
        {
          email,
          name,
          phone,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (upsertErr) throw upsertErr;

    // ── Merge anonymous identity → user ───────────────────
    if (anonymous_id) {
      await supabase
        .from("identities")
        .upsert(
          { anonymous_id, user_id: user.id, email, phone, last_seen: new Date().toISOString() },
          { onConflict: "anonymous_id" }
        );
    }

    // ── Insert booking ────────────────────────────────────
    const { data: bookingRow, error: bookingErr } = await supabase
      .from("bookings")
      .insert({ user_id: user.id, name, email, phone, slot_date, slot_time })
      .select("id")
      .single();

    if (bookingErr) {
      // Catch unique constraint violation (race condition)
      if (bookingErr.code === "23505") {
        return NextResponse.json(
          { error: "המועד הזה כבר נתפס. אנא בחר/י מועד אחר." },
          { status: 409 }
        );
      }
      throw bookingErr;
    }

    // ── Fire CALL_BOOKED event ────────────────────────────
    await supabase.from("events").insert({
      user_id:      user.id,
      anonymous_id: anonymous_id ?? null,
      type:         "CALL_BOOKED",
      metadata:     { slot_date, slot_time, booking_id: bookingRow.id },
    });

    // ── Advance state machine: buyer → booked ─────────────
    await supabase
      .from("users")
      .update({ status: "booked" })
      .eq("id", user.id)
      .eq("status", "buyer");

    // ── Enqueue booking_confirmation email ────────────────
    await supabase.from("jobs").insert({
      type: "SEND_EMAIL",
      payload: {
        user_id:    user.id,
        email,
        name,
        subject:    `✅ הפגישה נקבעה! ${slot_date} בשעה ${slot_time}`,
        template_key: "booking_confirmation",
        slot_date,
        slot_time,
      },
      run_at: new Date().toISOString(),
      status: "pending",
    });

    return NextResponse.json({ ok: true, booking_id: bookingRow.id, user_id: user.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    try {
      await supabase.from("error_logs").insert({
        context: "api/book",
        error:   message,
        payload: { email, slot_date, slot_time, ip },
      });
    } catch {}

    return NextResponse.json({ error: "שגיאת שרת, נסה שוב" }, { status: 500 });
  }
}
