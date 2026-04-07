/**
 * POST /api/hive/join
 *
 * Joins a user to the "הכוורת" (Hive) monthly membership.
 *
 * Body: { email: string, name: string, tier: "basic_97" | "discounted_29" }
 * Response: { success: true, tier: string } | { status: "pending_payment", message: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const QUALIFYING_PRODUCTS = [
  "challenge_197",
  "workshop_1080",
  "course_1800",
  "strategy_4000",
  "premium_14000",
] as const;

const BodySchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  name:  z.string().min(1, "נדרש שם"),
  tier:  z.enum(["basic_97", "discounted_29"]),
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
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      errors[field] = issue.message;
    }
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { email, name, tier } = parsed.data;

  const supabase = createServerClient();

  try {
    // For discounted tier: re-verify eligibility via completed purchases
    if (tier === "discounted_29") {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (!existingUser) {
        return NextResponse.json(
          { error: "לא נמצאה רכישה קודמת - אינך זכאי למחיר המיוחד" },
          { status: 403 }
        );
      }

      const { data: purchases } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("status", "completed")
        .in("product", QUALIFYING_PRODUCTS)
        .limit(1);

      if (!purchases || purchases.length === 0) {
        return NextResponse.json(
          { error: "לא נמצאה רכישה קודמת - אינך זכאי למחיר המיוחד" },
          { status: 403 }
        );
      }
    }

    // Upsert user - on conflict email, update name only if blank
    const { data: user, error: upsertErr } = await supabase
      .from("users")
      .upsert(
        {
          email,
          name,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
          ignoreDuplicates: false,
        }
      )
      .select("id, name")
      .single();

    if (upsertErr || !user) throw upsertErr ?? new Error("Upsert returned no user");

    // Update hive membership fields
    const now      = new Date();
    const billing  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: updateErr } = await supabase
      .from("users")
      .update({
        hive_tier:              tier,
        hive_status:            "active",
        hive_started_at:        now.toISOString(),
        hive_next_billing_date: billing.toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    // Stub Cardcom recurring - return pending_payment if credentials not set
    const terminal = process.env.CARDCOM_TERMINAL;
    const apiName  = process.env.CARDCOM_API_NAME;

    if (!terminal || !apiName) {
      return NextResponse.json({
        status: "pending_payment",
        message: "נדרש תשלום - יתווסף בקרוב",
      });
    }

    // Insert HIVE_JOINED event
    await supabase.from("events").insert({
      user_id:  user.id,
      type:     "HIVE_JOINED",
      metadata: { tier },
    });

    // Enqueue SEND_EMAIL job for hive_welcome (immediate)
    const { data: welcomeSeq } = await supabase
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "HIVE_JOINED")
      .eq("delay_hours", 0)
      .eq("active", true)
      .single();

    if (welcomeSeq) {
      const price = tier === "discounted_29" ? "29" : "97";
      await supabase.from("jobs").insert({
        type:    "SEND_EMAIL",
        payload: {
          user_id:      user.id,
          email,
          name:         user.name ?? name,
          sequence_id:  welcomeSeq.id,
          subject:      welcomeSeq.subject,
          template_key: welcomeSeq.template_key,
          tier,
          price,
        },
        run_at: new Date().toISOString(),
        status: "pending",
      });
    }

    // Enqueue follow-up jobs (e.g. day-7) at their scheduled times
    const { data: followups } = await supabase
      .from("email_sequences")
      .select("id, delay_hours, subject, template_key")
      .eq("trigger_event", "HIVE_JOINED")
      .gt("delay_hours", 0)
      .eq("active", true);

    if (followups?.length) {
      const jobs = followups.map((seq) => ({
        type:    "SEND_EMAIL",
        payload: {
          user_id:      user.id,
          email,
          name:         user.name ?? name,
          sequence_id:  seq.id,
          subject:      seq.subject,
          template_key: seq.template_key,
          tier,
        },
        run_at: new Date(
          now.getTime() + seq.delay_hours * 60 * 60 * 1000
        ).toISOString(),
        status: "pending" as const,
      }));
      await supabase.from("jobs").insert(jobs);
    }

    return NextResponse.json({ success: true, tier }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    try {
      await supabase.from("error_logs").insert({
        context: "api/hive/join",
        error:   message,
        payload: { email, tier },
      });
    } catch {}

    return NextResponse.json({ error: "שגיאת שרת, נסה שוב" }, { status: 500 });
  }
}
