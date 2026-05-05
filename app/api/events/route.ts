import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { EventSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";
import type { UserStatus } from "@/lib/supabase/types";

const STATUS_EMOJI: Record<string, string> = {
  high_intent: "🔥",
  buyer:       "💰",
  booked:      "📅",
};
const STATUS_LABEL: Record<string, string> = {
  high_intent: "כוונה גבוהה — התחיל checkout",
  buyer:       "רכישה הושלמה!",
  booked:      "פגישה נקבעה",
};
const NOTIFY_ON_TRANSITION = new Set(["high_intent", "buyer", "booked"]);

function phoneLinks(phone: string): string {
  const wa = phone.replace(/\D/g, "").replace(/^0/, "972");
  return `<a href="tel:${phone}" style="color:#4285F4">📞 ${phone}</a> &nbsp;·&nbsp; <a href="https://wa.me/${wa}" style="color:#25D366">💬 WhatsApp</a>`;
}

function notifyStatusChange(
  userId: string,
  name: string,
  email: string,
  phone: string | null,
  utmSource: string | null,
  newStatus: string,
  triggerEvent: string,
) {
  const emoji    = STATUS_EMOJI[newStatus] ?? "📌";
  const label    = STATUS_LABEL[newStatus] ?? newStatus;
  const adminUrl = `https://www.beegood.online/admin/users/${userId}`;
  new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
    to: ["alonabadi9@gmail.com", "hadard1113@gmail.com"],
    subject: `${emoji} ${name} — ${label}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:480px">
      <h2 style="color:#C9964A;margin-bottom:16px">${emoji} שינוי סטטוס</h2>
      <p style="margin:4px 0"><strong>שם:</strong> ${name}</p>
      <p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${email}" style="color:#4285F4">${email}</a></p>
      ${phone ? `<p style="margin:4px 0"><strong>טלפון:</strong> ${phoneLinks(phone)}</p>` : ""}
      <p style="margin:4px 0"><strong>סטטוס חדש:</strong> <span style="color:#C9964A;font-weight:bold">${label}</span></p>
      <p style="margin:4px 0"><strong>טריגר:</strong> ${triggerEvent}</p>
      ${utmSource ? `<p style="margin:4px 0"><strong>מקור:</strong> ${utmSource}</p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <a href="${adminUrl}" style="display:inline-block;background:#C9964A;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח פרופיל באדמין ←</a>
    </div>`,
  }).catch(() => {});
}

// ── State machine ────────────────────────────────────────────
// Maps event type → { required current status → new status }
const TRANSITIONS: Record<string, { from: UserStatus | UserStatus[]; to: UserStatus }> = {
  QUIZ_COMPLETED:      { from: "lead",                    to: "engaged" },
  EMAIL_OPENED:        { from: "lead",                    to: "engaged" },
  LINK_CLICKED:        { from: "lead",                    to: "engaged" },
  CHECKOUT_STARTED:    { from: ["lead", "engaged"],       to: "high_intent" },
  PURCHASE_COMPLETED:  { from: "high_intent",             to: "buyer" },
  CALL_BOOKED:         { from: "buyer",                   to: "booked" },
};

// Events that should also trigger email sequences
const SEQUENCE_TRIGGERS = new Set([
  "PURCHASE_COMPLETED",
  "CHALLENGE_PURCHASED",
  "WORKSHOP_PURCHASED",
  "COURSE_PURCHASED",
  "INACTIVE_3_DAYS",
]);

// ── WhatsApp cart-abandon helper ─────────────────────────────
// Enqueues two SEND_WHATSAPP jobs (1h and 24h) when CHECKOUT_STARTED fires.
// Silently skips if: WhatsApp creds missing, user has no phone, or jobs already
// enqueued for this user in the last 24 hours (dedup at enqueue time).
async function enqueueWhatsappCartAbandon(
  userId: string,
  supabase: ReturnType<typeof createServerClient>
): Promise<void> {
  if (!process.env.UCHAT_API_KEY) return;

  const { data: user } = await supabase
    .from("users")
    .select("name, phone")
    .eq("id", userId)
    .single();

  if (!user?.phone) return;

  // Dedup: skip if we already queued WhatsApp for this user in the last 24h.
  const { data: existingJob } = await supabase
    .from("jobs")
    .select("id")
    .eq("type", "SEND_WHATSAPP")
    .in("status", ["pending", "running", "done"])
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .filter("payload->user_id", "eq", userId)
    .limit(1)
    .maybeSingle();

  if (existingJob) return;

  const firstName = user.name?.trim().split(/\s+/)[0] ?? user.name ?? "";

  await supabase.from("jobs").insert([
    {
      type: "SEND_WHATSAPP",
      payload: {
        user_id:         userId,
        phone:           user.phone,
        name:            firstName,
        template_name:   "hadar_cart_1h",
        template_params: [firstName],
      },
      run_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      status: "pending" as const,
    },
    {
      type: "SEND_WHATSAPP",
      payload: {
        user_id:         userId,
        phone:           user.phone,
        name:            firstName,
        template_name:   "hadar_cart_24h",
        template_params: [firstName],
      },
      run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending" as const,
    },
  ]);
}

export async function POST(req: NextRequest) {
  // ── Parse body ───────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 422 }
    );
  }

  const { type, anonymous_id, user_id, metadata } = parsed.data;

  // ── Rate limit: 20 / min per anonymous_id ────────────────
  const rateLimitKey = anonymous_id ?? user_id ?? "unknown";
  if (!rateLimit(`events:${rateLimitKey}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const supabase = createServerClient();

  try {
    // ── Resolve user_id from anonymous_id if not provided ────
    let resolvedUserId = user_id ?? null;
    if (!resolvedUserId && anonymous_id) {
      const { data: identity } = await supabase
        .from("identities")
        .select("user_id")
        .eq("anonymous_id", anonymous_id)
        .single();
      resolvedUserId = identity?.user_id ?? null;
    }

    // ── Persist event ────────────────────────────────────────
    await supabase.from("events").insert({
      user_id: resolvedUserId,
      anonymous_id: anonymous_id ?? null,
      type,
      metadata: metadata ?? {},
    });

    // ── A/B experiment visitor/conversion tracking ───────────
    if (type === "PAGE_VIEW" && metadata?.ab_variant) {
      const col =
        metadata.ab_variant === "A" ? "visitors_a" : "visitors_b";
      // Non-fatal - RPC may not exist until increment_experiment.sql is applied
      try {
        await supabase.rpc("increment_experiment", {
          p_name: "landing_headline",
          p_column: col,
        });
      } catch {}
    }
    if (type === "USER_SIGNED_UP" && metadata?.ab_variant) {
      const col =
        metadata.ab_variant === "A" ? "conversions_a" : "conversions_b";
      try {
        await supabase.rpc("increment_experiment", {
          p_name: "landing_headline",
          p_column: col,
        });
      } catch {}
    }

    // ── State machine transition ─────────────────────────────
    if (resolvedUserId && TRANSITIONS[type]) {
      const { from, to } = TRANSITIONS[type];
      const baseQuery = supabase
        .from("users")
        .update({ status: to })
        .eq("id", resolvedUserId)
        .select("id, name, email, phone, utm_source");
      const { data: transitioned } = Array.isArray(from)
        ? await baseQuery.in("status", from)
        : await baseQuery.eq("status", from);

      // Notify admin when user reaches a high-value status
      if (transitioned?.length && NOTIFY_ON_TRANSITION.has(to)) {
        const u = transitioned[0];
        notifyStatusChange(u.id, u.name ?? u.email ?? "", u.email, u.phone ?? null, u.utm_source ?? null, to, type);
      }
    }

    // ── WhatsApp cart-abandon (1h + 24h after CHECKOUT_STARTED) ─
    if (type === "CHECKOUT_STARTED" && resolvedUserId) {
      await enqueueWhatsappCartAbandon(resolvedUserId, supabase);
    }

    // ── Trigger email sequences ──────────────────────────────
    if (resolvedUserId && SEQUENCE_TRIGGERS.has(type)) {
      const { data: sequences } = await supabase
        .from("email_sequences")
        .select("id, delay_hours, subject, template_key")
        .eq("trigger_event", type)
        .eq("active", true);

      if (sequences?.length) {
        const { data: userData } = await supabase
          .from("users")
          .select("email, name")
          .eq("id", resolvedUserId)
          .single();

        if (userData) {
          const jobs = sequences.map((seq) => ({
            type: "SEND_EMAIL",
            payload: {
              user_id: resolvedUserId,
              email: userData.email,
              name: userData.name ?? "",
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
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    try {
      await supabase
        .from("error_logs")
        .insert({
          context: "api/events",
          error: message,
          payload: { type, anonymous_id, user_id },
        });
    } catch {}

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
