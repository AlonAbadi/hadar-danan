import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SignupSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendCapiEvent } from "@/lib/meta-capi";
import { Resend } from "resend";

function notifyNewLead(name: string, email: string, phone?: string | null, utmSource?: string | null) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  resend.emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
    to: "alonabadi9@gmail.com",
    subject: `ליד חדש: ${name}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
      <h2 style="color:#C9964A">ליד חדש נכנס 🎯</h2>
      <p><strong>שם:</strong> ${name}</p>
      <p><strong>אימייל:</strong> ${email}</p>
      ${phone ? `<p><strong>טלפון:</strong> ${phone}</p>` : ""}
      ${utmSource ? `<p><strong>מקור:</strong> ${utmSource}</p>` : ""}
    </div>`,
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 5 requests / minute per IP ──────────────
  const ip = getClientIp(req);
  if (!rateLimit(`signup:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "יותר מדי ניסיונות. נסה שוב בעוד דקה." },
      { status: 429 }
    );
  }

  // ── Parse & validate ────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      errors[field] = issue.message;
    }
    return NextResponse.json({ errors }, { status: 422 });
  }

  const {
    name,
    email,
    phone,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    utm_adset,
    utm_ad,
    click_id,
    anonymous_id,
    marketing_consent,
  } = parsed.data;

  // Sanitize ab_variant — DB constraint only allows 'A' or 'B'
  const raw_variant = parsed.data.ab_variant;
  const ab_variant = (raw_variant === "A" || raw_variant === "B") ? raw_variant : null;

  const supabase = createServerClient();

  try {
    // ── Find-or-create user (avoids relying on a unique constraint) ──────────
    const { data: existing } = await supabase
      .from("users")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    let user: { id: string; status: string };
    let isNewUser = false;

    if (existing) {
      // Update mutable fields; preserve status if already advanced beyond 'lead'
      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update({
          name,
          phone,
          last_seen_at: new Date().toISOString(),
          ...(utm_source   ? { utm_source }   : {}),
          ...(utm_medium   ? { utm_medium }   : {}),
          ...(utm_campaign ? { utm_campaign } : {}),
          ...(utm_content  ? { utm_content }  : {}),
          ...(utm_term     ? { utm_term }     : {}),
          ...(utm_adset    ? { utm_adset }    : {}),
          ...(utm_ad       ? { utm_ad }       : {}),
          ...(click_id     ? { click_id }     : {}),
          ...(ab_variant   ? { ab_variant }   : {}),
          ...(marketing_consent ? { marketing_consent: true, consent_at: new Date().toISOString() } : {}),
        })
        .eq("id", existing.id)
        .select("id, status")
        .single();
      if (updateErr) throw new Error(updateErr.message);
      user = updated!;
    } else {
      // New user
      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert({
          email,
          name,
          phone,
          ab_variant:   ab_variant   ?? null,
          utm_source:   utm_source   ?? null,
          utm_medium:   utm_medium   ?? null,
          utm_campaign: utm_campaign ?? null,
          utm_content:  utm_content  ?? null,
          utm_term:     utm_term     ?? null,
          utm_adset:    utm_adset    ?? null,
          utm_ad:       utm_ad       ?? null,
          click_id:     click_id     ?? null,
          status: "lead",
          last_seen_at: new Date().toISOString(),
          ...(marketing_consent ? { marketing_consent: true, consent_at: new Date().toISOString() } : {}),
        })
        .select("id, status")
        .single();
      if (insertErr) throw new Error(insertErr.message);
      user = inserted!;
      isNewUser = true;
    }

    // ── Merge anonymous identity → user ─────────────────────
    if (anonymous_id) {
      await supabase
        .from("identities")
        .upsert(
          {
            anonymous_id,
            user_id: user.id,
            email,
            phone,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "anonymous_id" }
        );
    }

    // ── Fire USER_SIGNED_UP event ────────────────────────────
    await supabase.from("events").insert({
      user_id: user.id,
      anonymous_id: anonymous_id ?? null,
      type: "USER_SIGNED_UP",
      metadata: {
        ab_variant: ab_variant ?? null,
        utm_source: utm_source ?? null,
      },
    });

    // ── Enqueue welcome email job (immediate) ────────────────
    // Find the welcome sequence step
    const { data: welcomeSeq } = await supabase
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "USER_SIGNED_UP")
      .eq("delay_hours", 0)
      .eq("active", true)
      .single();

    if (welcomeSeq) {
      await supabase.from("jobs").insert({
        type: "SEND_EMAIL",
        payload: {
          user_id: user.id,
          email,
          name,
          sequence_id: welcomeSeq.id,
          subject: welcomeSeq.subject,
          template_key: welcomeSeq.template_key,
        },
        run_at: new Date().toISOString(),
        status: "pending",
      });
    }

    // ── Enqueue follow-up email jobs at their scheduled times ─
    const { data: followups } = await supabase
      .from("email_sequences")
      .select("id, delay_hours, subject, template_key")
      .eq("trigger_event", "USER_SIGNED_UP")
      .gt("delay_hours", 0)
      .eq("active", true);

    if (followups?.length) {
      const jobs = followups.map((seq) => ({
        type: "SEND_EMAIL",
        payload: {
          user_id: user.id,
          email,
          name,
          sequence_id: seq.id,
          subject: seq.subject,
          template_key: seq.template_key,
        },
        run_at: new Date(
          Date.now() + seq.delay_hours * 60 * 60 * 1000
        ).toISOString(),
        status: "pending" as const,
      }));
      await supabase.from("jobs").insert(jobs);
    }

    const fbp = req.cookies.get("_fbp")?.value;
    const fbc = req.cookies.get("_fbc")?.value;
    const ua  = req.headers.get("user-agent") ?? undefined;

    if (isNewUser) notifyNewLead(name, email, phone, utm_source);

    await sendCapiEvent({
      eventName: "Lead",
      eventId:   user.id,
      userData:  { email, phone: phone ?? undefined, fbp, fbc, clientUserAgent: ua },
    });

    await sendCapiEvent({
      eventName: "CompleteRegistration",
      eventId:   `reg_${user.id}`,
      userData:  { email, phone: phone ?? undefined, fbp, fbc, clientUserAgent: ua },
    });

    return NextResponse.json({ ok: true, user_id: user.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : (err && typeof err === "object" ? JSON.stringify(err) : String(err));

    try {
      await supabase.from("error_logs").insert({
        context: "api/signup",
        error: message,
        payload: { email, ip },
      });
    } catch {}

    return NextResponse.json(
      { error: "שגיאת שרת, נסה שוב" },
      { status: 500 }
    );
  }
}
