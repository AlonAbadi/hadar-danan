/**
 * Quiz side-effects: status bumps + admin notifications + Make webhook + WhatsApp.
 *
 * Called from /api/quiz-result (canonical entry) and /api/events (backup when
 * the client's quiz-result POST is fire-and-forget and may silently fail).
 *
 * Dedup strategy: PROTECTED_STATUSES short-circuits everything. If the user is
 * already a premium_lead / partnership_lead / buyer / booked / etc., we skip
 * status bumps AND admin emails. This means the second caller (whichever lost
 * the race) sees the updated status and stays silent.
 */
import { Resend } from "resend";
import type { createServerClient } from "@/lib/supabase/server";
import type { UserStatus } from "@/lib/supabase/types";

export const MAKE_WEBHOOK = "https://hook.eu1.make.com/rmw23usw8k9l4oooc573epuwh2skcbil";

export const HIGH_VALUE_PRODUCTS = new Set(["strategy", "premium", "partnership"]);

// Quiz leads that get an instant admin email to Alon + Hadar.
// Includes partnership — quiz-recommended partnership leads never hit the
// dedicated /api/partnership-lead form, so without this they get zero alert.
export const ADMIN_ALERT_PRODUCTS = new Set(["strategy", "premium", "partnership"]);

// Quiz recommendations that map directly to a user.status. strategy stays in
// the engaged/lead funnel — the priority CRM tab surfaces strategy users via
// the quiz_product join, not via a dedicated status.
export const STATUS_FOR_PRODUCT: Record<string, UserStatus> = {
  premium:     "premium_lead",
  partnership: "partnership_lead",
};

// Statuses we will NOT touch — protects buyers / booked / already-tagged
// premium/partnership leads, AND short-circuits side-effects so a second
// QUIZ_COMPLETED for the same user doesn't trigger a second admin email.
export const PROTECTED_STATUSES = new Set([
  "high_intent", "buyer", "booked", "handled", "not_relevant",
  "premium_lead", "partnership_lead",
]);

export const PRODUCT_LABELS: Record<string, string> = {
  challenge:   "אתגר 7 ימים",
  workshop:    "סדנה יום אחד",
  strategy:    "פגישת אסטרטגיה",
  premium:     "יום צילום פרמיום",
  partnership: "שותפות אסטרטגית",
};

const PRODUCT_EMOJI: Record<string, string> = {
  strategy:    "🎯",
  premium:     "📸",
  partnership: "🤝",
};

async function sendAdminQuizAlert(opts: {
  product:        string;
  name:           string;
  email:          string;
  phone:          string;
  user_id:        string;
  matchPercent:   number;
  secondProduct?: string;
  utmSource?:     string;
  utmCampaign?:   string;
}): Promise<void> {
  if (!ADMIN_ALERT_PRODUCTS.has(opts.product)) return;
  if (!opts.phone || !opts.name) return;

  const label      = PRODUCT_LABELS[opts.product] ?? opts.product;
  const emoji      = PRODUCT_EMOJI[opts.product]  ?? "🎯";
  const phoneWa    = opts.phone.replace(/\D/g, "").replace(/^0/, "972");
  const secondLine = opts.secondProduct
    ? `<p style="margin:4px 0;font-size:13px;color:#888"><strong>גם מתאים:</strong> ${PRODUCT_LABELS[opts.secondProduct] ?? opts.secondProduct}</p>`
    : "";
  const utmLine    = opts.utmSource
    ? `<p style="margin:4px 0;font-size:12px;color:#aaa">מקור: ${opts.utmSource}${opts.utmCampaign ? ` · ${opts.utmCampaign}` : ""}</p>`
    : "";

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
      to: ["alonabadi9@gmail.com", "hadard1113@gmail.com"],
      subject: `${emoji} ליד חם מהקוויז — ${label}: ${opts.name}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:480px">
        <h2 style="color:#C9964A;margin-bottom:16px">${emoji} ליד מהקוויז · ${label}</h2>
        <p style="margin:4px 0"><strong>שם:</strong> ${opts.name}</p>
        <p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${opts.email}" style="color:#4285F4">${opts.email}</a></p>
        <p style="margin:4px 0"><strong>טלפון:</strong> <a href="tel:${opts.phone}" style="color:#4285F4">📞 ${opts.phone}</a> &nbsp;·&nbsp; <a href="https://wa.me/${phoneWa}" style="color:#25D366">💬 WhatsApp</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <p style="margin:4px 0"><strong>התאמה:</strong> ${opts.matchPercent}%</p>
        ${secondLine}
        ${utmLine}
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <p style="margin:8px 0;font-size:13px;color:#888">💡 סיים/ה את הקוויז וקיבל/ה המלצה ל-${label}. שווה להתקשר עכשיו לפני שמתקרר.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <a href="https://www.beegood.online/admin/users/${opts.user_id}" style="display:inline-block;background:#C9964A;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח פרופיל באדמין ←</a>
      </div>`,
    });
  } catch {}
}

async function sendToMake(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(MAKE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}

export async function applyQuizSideEffects(
  supabase: ReturnType<typeof createServerClient>,
  opts: {
    user_id:             string;
    recommended_product: string;
    second_product?:     string | null;
    match_percent?:      number | null;
    answers?:            unknown;
  },
): Promise<void> {
  const { user_id, recommended_product } = opts;

  type UserRow = {
    name:         string | null;
    email:        string;
    phone:        string | null;
    status:       string;
    utm_source:   string | null;
    utm_medium:   string | null;
    utm_campaign: string | null;
    is_test?:     boolean | null;
  };
  let user: UserRow | null = null;

  try {
    const { data } = await supabase
      .from("users")
      .select("name, email, phone, status, utm_source, utm_medium, utm_campaign, is_test")
      .eq("id", user_id)
      .single();
    user = (data as unknown as UserRow) ?? null;
  } catch {}

  if (!user) return;

  // v2 isolation: a test user never triggers admin email, Make webhook,
  // premium_lead escalation, or WhatsApp. Defense in depth — callers gate
  // too, but this function is reachable from two routes.
  if (user.is_test === true) return;

  // DEDUP: if user already has a protected status (already a premium_lead,
  // partnership_lead, buyer, booked, etc.), skip ALL side-effects. This
  // prevents double admin emails when both /api/quiz-result and /api/events
  // call this function for the same QUIZ_COMPLETED event.
  if (PROTECTED_STATUSES.has(user.status)) return;

  // 1. Bump status when the quiz recommends a category with a dedicated status.
  const targetStatus = STATUS_FOR_PRODUCT[recommended_product];
  if (targetStatus) {
    try {
      await supabase.from("users").update({ status: targetStatus }).eq("id", user_id);
      const eventType = targetStatus === "premium_lead" ? "PREMIUM_LEAD" : "PARTNERSHIP_LEAD";
      await supabase.from("events").insert({
        user_id,
        type: eventType,
        metadata: { source: "quiz", recommended_product, match_percent: opts.match_percent ?? null },
      });
    } catch {}
  }

  // 2. Admin email to Alon + Hadar (runs regardless of UCHAT_API_KEY).
  if (ADMIN_ALERT_PRODUCTS.has(recommended_product) && user.phone && user.name) {
    await sendAdminQuizAlert({
      product:       recommended_product,
      name:          user.name,
      email:         user.email,
      phone:         user.phone,
      user_id,
      matchPercent:  opts.match_percent ?? 0,
      secondProduct: opts.second_product ?? undefined,
      utmSource:     user.utm_source ?? undefined,
      utmCampaign:   user.utm_campaign ?? undefined,
    });
  }

  // 3. Make webhook for high-value leads.
  if (HIGH_VALUE_PRODUCTS.has(recommended_product)) {
    await sendToMake({
      name:                user.name ?? "",
      email:               user.email ?? "",
      phone:               user.phone ?? "",
      recommended_product: PRODUCT_LABELS[recommended_product] ?? recommended_product,
      second_product:      opts.second_product ? (PRODUCT_LABELS[opts.second_product] ?? opts.second_product) : "",
      match_percent:       opts.match_percent ?? 0,
      answers:             opts.answers ?? {},
      utm_source:          user.utm_source ?? "",
      utm_medium:          user.utm_medium ?? "",
      utm_campaign:        user.utm_campaign ?? "",
      source:              "quiz",
    });
  }

  // 4. WhatsApp message (only if UCHAT is configured).
  if (process.env.UCHAT_API_KEY && user.phone) {
    const WA_LABELS: Record<string, string> = {
      challenge:   "אתגר 7 ימים",
      workshop:    "סדנה יום אחד",
      strategy:    "פגישת אסטרטגיה",
      premium:     "יום צילום פרמיום",
      partnership: "שותפות אסטרטגית",
    };
    const label = WA_LABELS[recommended_product];
    if (label) {
      try {
        const firstName = user.name?.trim().split(/\s+/)[0] ?? "";
        await supabase.from("jobs").insert({
          type:    "SEND_WHATSAPP",
          payload: {
            user_id,
            phone:           user.phone,
            name:            firstName,
            template_name:   "hadar_quiz_result",
            template_params: [firstName, label],
          },
          run_at: new Date().toISOString(),
          status: "pending",
        });
      } catch {}
    }
  }
}

/**
 * Insert a quiz_results row if no recent one exists for this anonymous_id /
 * user_id with the same recommended_product. Used as a backup write path from
 * /api/events when /api/quiz-result POST fails silently on the client side.
 */
export async function ensureQuizResultRow(
  supabase: ReturnType<typeof createServerClient>,
  opts: {
    user_id?:             string | null;
    anonymous_id?:        string | null;
    recommended_product:  string;
    match_percent?:       number | null;
    answers?:             unknown;
  },
): Promise<void> {
  const { user_id, anonymous_id, recommended_product } = opts;
  if (!user_id && !anonymous_id) return;

  // Dedup: look back 1 hour for an existing row with this product
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  let existing: { id: string } | null = null;

  if (user_id) {
    const { data } = await supabase
      .from("quiz_results")
      .select("id")
      .eq("user_id", user_id)
      .eq("recommended_product", recommended_product)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    existing = (data as { id: string } | null) ?? null;
  }
  if (!existing && anonymous_id) {
    const { data } = await supabase
      .from("quiz_results")
      .select("id")
      .eq("anonymous_id", anonymous_id)
      .eq("recommended_product", recommended_product)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    existing = (data as { id: string } | null) ?? null;
  }
  if (existing) return;

  try {
    // The supabase types insist `answers` is Record<string,string>; in practice
    // it's stored as JSONB so any shape works. Cast through unknown to satisfy
    // the typecheck without runtime change.
    await supabase.from("quiz_results").insert({
      user_id:              user_id ?? null,
      anonymous_id:         anonymous_id ?? null,
      recommended_product,
      match_percent:        typeof opts.match_percent === "number" ? opts.match_percent : 0,
      answers:              ((opts.answers ?? {}) as unknown) as Record<string, string>,
      scores:               {},
    });
  } catch {}
}
