/**
 * POST /api/partnership-lead
 *
 * Receives a strategic partnership application.
 * Upserts user, fires PARTNERSHIP_LEAD event, enqueues confirmation email.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sendCapiEvent } from "@/lib/meta-capi";

const BodySchema = z.object({
  name:               z.string().min(2),
  business:           z.string().min(1),
  phone:              z.string().min(7),
  email:              z.string().email(),
  challenge:          z.string().min(10),
  anonymous_id:       z.string().optional(),
  marketing_consent:  z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));
  const body = BodySchema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json(
      { error: body.error.issues[0]?.message ?? "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const { name, business, phone, email, challenge, anonymous_id, marketing_consent } = body.data;
  const supabase = createServerClient();

  // Upsert user with partnership_lead status
  const { data: user, error: userErr } = await supabase
    .from("users")
    .upsert(
      {
        email: email.toLowerCase().trim(), name, phone, status: "partnership_lead",
        ...(marketing_consent ? { marketing_consent: true, consent_at: new Date().toISOString() } : {}),
      },
      { onConflict: "email,tenant_id", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (userErr || !user) {
    await supabase.from("error_logs").insert({
      context: "api/partnership-lead",
      error: userErr?.message ?? "upsert failed",
      payload: { email },
    });
    return NextResponse.json({ error: "שגיאת שרת, נסה שוב" }, { status: 500 });
  }

  // Link anonymous identity
  if (anonymous_id) {
    await supabase
      .from("identities")
      .upsert(
        { anonymous_id, user_id: user.id, email: email.toLowerCase().trim() },
        { onConflict: "anonymous_id", ignoreDuplicates: false }
      );
  }

  // Fire PARTNERSHIP_LEAD event
  await supabase.from("events").insert({
    user_id: user.id,
    type: "PARTNERSHIP_LEAD",
    metadata: { business, challenge, phone },
  });

  // Enqueue confirmation email
  const { data: seq } = await supabase
    .from("email_sequences")
    .select("id, subject, template_key")
    .eq("trigger_event", "PARTNERSHIP_LEAD")
    .eq("delay_hours", 0)
    .eq("active", true)
    .maybeSingle();

  if (seq) {
    await supabase.from("jobs").insert({
      type: "SEND_EMAIL",
      payload: {
        user_id:      user.id,
        email:        email.toLowerCase().trim(),
        name,
        sequence_id:  seq.id,
        subject:      seq.subject,
        template_key: seq.template_key,
        business,
      },
      run_at: new Date().toISOString(),
      status: "pending",
    });
  }

  await sendCapiEvent({
    eventName: "Lead",
    eventId:   `partnership_${user.id}`,
    userData:  {
      email:           email.toLowerCase().trim(),
      phone,
      fbp:             req.cookies.get("_fbp")?.value,
      fbc:             req.cookies.get("_fbc")?.value,
      clientUserAgent: req.headers.get("user-agent") ?? undefined,
    },
    customData: { contentName: "partnership_lead", contentIds: ["partnership_lead"] },
  });

  return NextResponse.json({ ok: true, user_id: user.id });
}
