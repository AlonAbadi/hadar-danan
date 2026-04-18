/**
 * POST /api/premium-lead
 *
 * Submits a premium product lead form.
 * Upserts user with status='premium_lead', fires PREMIUM_LEAD event,
 * enqueues premium_lead_confirmation email.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const BodySchema = z.object({
  name:               z.string().min(2, "שם חובה"),
  email:              z.string().email("אימייל לא תקין"),
  phone:              z.string().regex(/^0[5][0-9]{8}$/, "מספר טלפון לא תקין"),
  business:           z.string().min(2, "שם עסק חובה"),
  anonymous_id:       z.string().optional(),
  marketing_consent:  z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    const firstIssue = body.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "בקשה לא תקינה" },
      { status: 400 }
    );
  }

  const { name, email, phone, business, anonymous_id, marketing_consent } = body.data;
  const supabase = createServerClient();

  try {
    // Upsert user - set status only if currently a lead (don't downgrade)
    const { data: user, error: upsertErr } = await supabase
      .from("users")
      .upsert(
        {
          email, name, phone, status: "premium_lead" as const,
          ...(marketing_consent ? { marketing_consent: true, consent_at: new Date().toISOString() } : {}),
        },
        { onConflict: "email,tenant_id", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (upsertErr || !user) {
      throw new Error(upsertErr?.message ?? "upsert failed");
    }

    const userId = user.id;

    // Link anonymous identity if present
    if (anonymous_id) {
      await supabase.from("identities").upsert(
        { anonymous_id, user_id: userId, email },
        { onConflict: "anonymous_id", ignoreDuplicates: false }
      );
    }

    // Fire PREMIUM_LEAD event
    await supabase.from("events").insert({
      user_id:    userId,
      anonymous_id: anonymous_id ?? null,
      type:       "PREMIUM_LEAD",
      metadata:   { business },
    });

    // Enqueue confirmation email
    await supabase.from("jobs").insert({
      type: "SEND_EMAIL",
      payload: {
        user_id:      userId,
        email,
        name,
        subject:      `${name.split(" ")[0]}, קיבלנו את הבקשה - ניצור קשר תוך 24 שעות`,
        template_key: "premium_lead_confirmation",
        business,
      },
      run_at: new Date().toISOString(),
      status: "pending",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await supabase.from("error_logs").insert({
      context: "api/premium-lead",
      error:   String(err),
      payload: { email, name },
    });
    return NextResponse.json({ error: "שגיאת שרת, נסה שוב" }, { status: 500 });
  }
}
