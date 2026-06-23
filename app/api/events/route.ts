import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { EventSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";
import type { UserStatus } from "@/lib/supabase/types";
import { applyQuizSideEffects, ensureQuizResultRow } from "@/lib/quiz/side-effects";

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
      <h2 style="color:#E8B94A;margin-bottom:16px">${emoji} שינוי סטטוס</h2>
      <p style="margin:4px 0"><strong>שם:</strong> ${name}</p>
      <p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${email}" style="color:#4285F4">${email}</a></p>
      ${phone ? `<p style="margin:4px 0"><strong>טלפון:</strong> ${phoneLinks(phone)}</p>` : ""}
      <p style="margin:4px 0"><strong>סטטוס חדש:</strong> <span style="color:#E8B94A;font-weight:bold">${label}</span></p>
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
  "SIGNAL_EXTRACTED",
]);


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

    // ── QUIZ_COMPLETED backup: ensure quiz_results row + fire side effects ──
    // The client also fires POST /api/quiz-result, but that call is
    // fire-and-forget on the client side — silent failures (network race,
    // tab close during navigation, transient 5xx) leave us with the event
    // recorded but no quiz_results row and no admin email. This is the
    // safety net so high-value leads can never go silent.
    if (type === "QUIZ_COMPLETED" && metadata && typeof metadata === "object") {
      const meta = metadata as { recommended_product?: unknown; match_percent?: unknown; answers?: unknown };
      const recommended_product = typeof meta.recommended_product === "string" ? meta.recommended_product : null;
      const match_percent       = typeof meta.match_percent === "number" ? meta.match_percent : null;

      if (recommended_product) {
        try {
          await ensureQuizResultRow(supabase, {
            user_id:             resolvedUserId,
            anonymous_id:        anonymous_id ?? null,
            recommended_product,
            match_percent,
            answers:             meta.answers,
          });
        } catch {}

        if (resolvedUserId) {
          try {
            await applyQuizSideEffects(supabase, {
              user_id:             resolvedUserId,
              recommended_product,
              match_percent,
              answers:             meta.answers,
            });
          } catch {}
        }
      }
    }

    // ── A/B experiment visitor/conversion tracking ───────────
    // Each PAGE_VIEW counts as a visitor for its experiment.
    // Conversion events vary by experiment (default: USER_SIGNED_UP).
    // experiment_name from metadata; defaults to "landing_headline" for
    // backward compatibility with PageTracker calls that pre-date the
    // multi-experiment refactor.
    if (metadata?.ab_variant) {
      const experimentName =
        typeof metadata.experiment_name === "string"
          ? metadata.experiment_name
          : "landing_headline";

      const isVisitor = type === "PAGE_VIEW";

      // Per-experiment conversion definition. Each experiment chooses what
      // counts as a win: signup, quiz lead, checkout start, or purchase.
      let isConversion = false;
      if (experimentName === "challenge_hero_format") {
        // Concluded 2026-06-19 (B won). Kept for any tail-end events.
        isConversion =
          type === "PURCHASE_COMPLETED" &&
          (metadata as { product?: string }).product === "challenge_197";
      } else if (experimentName === "challenge_hero_format_checkout") {
        // Concluded 2026-06-19 (B won). Kept for any tail-end events.
        isConversion =
          type === "CHECKOUT_STARTED" &&
          (metadata as { product?: string }).product === "challenge_197";
      } else if (experimentName === "challenge_proof_position") {
        // Launched 2026-06-19. Primary metric: actual challenge purchase.
        isConversion =
          type === "PURCHASE_COMPLETED" &&
          (metadata as { product?: string }).product === "challenge_197";
      } else if (experimentName === "landing_headline") {
        // Hero CTA leads to /signal — a completed signal extraction is the
        // true win. USER_SIGNED_UP / QUIZ_LEAD kept for backward compat
        // with any tail traffic that still routes through the old funnels.
        isConversion =
          type === "SIGNAL_EXTRACTED" ||
          type === "USER_SIGNED_UP" ||
          type === "QUIZ_LEAD";
      } else if (experimentName === "landing_headline_click") {
        // Leading indicator alongside the primary landing_headline test.
        // Visitor: PAGE_VIEW (same as primary, fired with its own
        // experiment_name by HomeHeroCtaTracker). Conversion: clicking the
        // hero CTA on the homepage, fired as CTA_CLICKED via sendBeacon.
        isConversion = type === "CTA_CLICKED";
      } else {
        // Default (quiz-Q1, future): signup or quiz lead
        isConversion = type === "USER_SIGNED_UP" || type === "QUIZ_LEAD";
      }

      if (isVisitor || isConversion) {
        const variantSuffix = metadata.ab_variant === "A" ? "_a" : "_b";
        const col = (isVisitor ? "visitors" : "conversions") + variantSuffix;
        try {
          await supabase.rpc("increment_experiment", {
            p_name: experimentName,
            p_column: col,
          });
        } catch {}
      }
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
