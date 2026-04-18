import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SignupSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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
    ab_variant,
    utm_source,
    utm_campaign,
    utm_adset,
    utm_ad,
    click_id,
    anonymous_id,
    marketing_consent,
  } = parsed.data;

  const supabase = createServerClient();

  try {
    // ── Upsert user (idempotent on email) ───────────────────
    const { data: user, error: upsertErr } = await supabase
      .from("users")
      .upsert(
        {
          email,
          name,
          phone,
          ab_variant: ab_variant ?? null,
          utm_source: utm_source ?? null,
          utm_campaign: utm_campaign ?? null,
          utm_adset: utm_adset ?? null,
          utm_ad: utm_ad ?? null,
          click_id: click_id ?? null,
          status: "lead",
          last_seen_at: new Date().toISOString(),
          ...(marketing_consent ? { marketing_consent: true, consent_at: new Date().toISOString() } : {}),
        },
        {
          onConflict: "email,tenant_id",
          ignoreDuplicates: false, // update name/phone if they changed
        }
      )
      .select("id, status")
      .single();

    if (upsertErr) throw upsertErr;

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

    return NextResponse.json({ ok: true, user_id: user.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

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
