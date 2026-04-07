import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { EventSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import type { UserStatus } from "@/lib/supabase/types";

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
  "CHECKOUT_STARTED",
  "CHALLENGE_PURCHASED",
  "WORKSHOP_PURCHASED",
  "INACTIVE_3_DAYS",
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
      const query = supabase
        .from("users")
        .update({ status: to })
        .eq("id", resolvedUserId);
      if (Array.isArray(from)) {
        await query.in("status", from);
      } else {
        await query.eq("status", from);
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
