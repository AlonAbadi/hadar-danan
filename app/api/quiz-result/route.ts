import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from "resend";
import type { UserStatus } from '@/lib/supabase/types';

const MAKE_WEBHOOK = "https://hook.eu1.make.com/rmw23usw8k9l4oooc573epuwh2skcbil";

const HIGH_VALUE_PRODUCTS = new Set(["strategy", "premium", "partnership"]);

// Quiz leads that get an instant admin email to Alon + Hadar so they can
// call immediately. Includes partnership — quiz users recommended partnership
// never hit /api/partnership-lead (that endpoint is for the dedicated form),
// so they would otherwise get zero admin notification.
const ADMIN_ALERT_PRODUCTS = new Set(["strategy", "premium", "partnership"]);

// Quiz recommendations that map directly to a user.status. Lets the priority
// CRM tab group them under the right category without depending on the user
// hitting a separate form. strategy has no dedicated status — it stays in
// quiz_results and the priority endpoint surfaces it via quiz_product join.
const STATUS_FOR_PRODUCT: Record<string, UserStatus> = {
  premium:     "premium_lead",
  partnership: "partnership_lead",
};

// Status values we will NOT downgrade from. Once a user has moved past a
// quiz-driven status (e.g. they bought something), don't reset them.
const PROTECTED_STATUSES = new Set([
  "high_intent", "buyer", "booked", "handled", "not_relevant",
  "premium_lead", "partnership_lead",
]);

async function applyQuizSideEffects(
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

  // 1. Bump user.status when quiz recommends a category with a dedicated status.
  //    Only upgrade — never downgrade users who already advanced beyond lead/engaged.
  const targetStatus = STATUS_FOR_PRODUCT[recommended_product];
  type UserRow = {
    name: string | null;
    email: string;
    phone: string | null;
    status: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
  };
  let user: UserRow | null = null;

  try {
    const { data } = await supabase
      .from("users")
      .select("name, email, phone, status, utm_source, utm_medium, utm_campaign")
      .eq("id", user_id)
      .single();
    user = (data as unknown as UserRow) ?? null;
  } catch {}

  if (targetStatus && user && !PROTECTED_STATUSES.has(user.status)) {
    try {
      await supabase.from("users").update({ status: targetStatus }).eq("id", user_id);
      // Fire the matching event so timelines/email sequences pick it up
      const eventType = targetStatus === "premium_lead" ? "PREMIUM_LEAD" : "PARTNERSHIP_LEAD";
      await supabase.from("events").insert({
        user_id,
        type: eventType,
        metadata: { source: "quiz", recommended_product, match_percent: opts.match_percent ?? null },
      });
    } catch {}
  }

  if (!user) return;

  // 2. Admin email alert to Alon + Hadar for any high-value quiz recommendation.
  //    Runs regardless of UCHAT_API_KEY — this is the urgent "call them now" ping.
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

  // 4. WhatsApp message (gated on UCHAT key — fine to skip if missing).
  if (process.env.UCHAT_API_KEY && user.phone) {
    const WA_LABELS: Record<string, string> = {
      challenge:   "אתגר 7 ימים",
      workshop:    "סדנה יום אחד",
      course:      "קורס דיגיטלי",
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

const PRODUCT_LABELS: Record<string, string> = {
  challenge:   "אתגר 7 ימים",
  workshop:    "סדנה יום אחד",
  course:      "קורס דיגיטלי",
  strategy:    "פגישת אסטרטגיה",
  premium:     "יום צילום פרמיום",
  partnership: "שותפות אסטרטגית",
};

const PRODUCT_EMOJI: Record<string, string> = {
  strategy: "🎯",
  premium:  "📸",
};

async function sendAdminQuizAlert(opts: {
  product:      string;
  name:         string;
  email:        string;
  phone:        string;
  user_id:      string;
  matchPercent: number;
  secondProduct?: string;
  utmSource?:   string;
  utmCampaign?: string;
}) {
  if (!ADMIN_ALERT_PRODUCTS.has(opts.product)) return;
  if (!opts.phone || !opts.name) return;

  const label    = PRODUCT_LABELS[opts.product] ?? opts.product;
  const emoji    = PRODUCT_EMOJI[opts.product]  ?? "🎯";
  const phoneWa  = opts.phone.replace(/\D/g, "").replace(/^0/, "972");
  const secondLine = opts.secondProduct
    ? `<p style="margin:4px 0;font-size:13px;color:#888"><strong>גם מתאים:</strong> ${PRODUCT_LABELS[opts.secondProduct] ?? opts.secondProduct}</p>`
    : "";
  const utmLine = opts.utmSource
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

async function sendToMake(payload: Record<string, unknown>) {
  try {
    await fetch(MAKE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Link anonymous quiz results to a newly authenticated user.
// Only updates rows where user_id IS NULL to avoid overwriting existing links.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { anonymous_id, user_id } = body as { anonymous_id?: string; user_id?: string };

    if (!anonymous_id || !user_id) {
      return NextResponse.json({ error: 'anonymous_id and user_id are required' }, { status: 400 });
    }
    if (!UUID_RE.test(user_id)) {
      return NextResponse.json({ error: 'invalid user_id' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('quiz_results')
      .update({ user_id })
      .eq('anonymous_id', anonymous_id)
      .is('user_id', null)
      .select('id');

    if (error) {
      await supabase.from('error_logs').insert({
        context: '/api/quiz-result PATCH',
        error: error.message,
        payload: { anonymous_id, user_id },
      });
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const updatedCount = (data ?? []).length;

    // Fire status bump + admin alert + Make webhook + WhatsApp.
    // No longer gated on UCHAT_API_KEY — admin emails must go out regardless.
    if (updatedCount > 0) {
      try {
        const { data: qr } = await supabase
          .from('quiz_results')
          .select('recommended_product, second_product, match_percent, answers')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (qr?.recommended_product) {
          await applyQuizSideEffects(supabase, {
            user_id,
            recommended_product: qr.recommended_product,
            second_product:      qr.second_product ?? null,
            match_percent:       qr.match_percent ?? null,
            answers:             qr.answers ?? {},
          });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, updated_count: updatedCount });
  } catch (err) {
    const supabase = createServerClient();
    await supabase.from('error_logs').insert({
      context: '/api/quiz-result PATCH',
      error: String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id, anonymous_id, answers, scores, recommended_product, second_product, match_percent,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_adset, utm_ad, click_id,
    } = body;

    if (!recommended_product || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error } = await supabase.from('quiz_results').insert({
      user_id:              user_id ?? null,
      anonymous_id:         anonymous_id ?? null,
      answers:              answers ?? {},
      scores:               scores ?? {},
      recommended_product,
      second_product:       second_product ?? null,
      match_percent:        match_percent ?? 0,
      utm_source:           utm_source   ? String(utm_source).slice(0, 100)   : null,
      utm_medium:           utm_medium   ? String(utm_medium).slice(0, 100)   : null,
      utm_campaign:         utm_campaign ? String(utm_campaign).slice(0, 100) : null,
      utm_content:          utm_content  ? String(utm_content).slice(0, 100)  : null,
      utm_term:             utm_term     ? String(utm_term).slice(0, 100)     : null,
      utm_adset:            utm_adset    ? String(utm_adset).slice(0, 100)    : null,
      utm_ad:               utm_ad       ? String(utm_ad).slice(0, 100)       : null,
      click_id:             click_id     ? String(click_id).slice(0, 200)     : null,
    });

    if (error) {
      await supabase.from('error_logs').insert({
        context: '/api/quiz-result',
        error: error.message,
        payload: { recommended_product },
      });
    }

    // Fire status bump + admin alert + Make webhook + WhatsApp.
    // No longer gated on UCHAT_API_KEY — admin emails must go out for every
    // high-value quiz lead, even if WhatsApp is unavailable.
    if (!error && user_id) {
      try {
        await applyQuizSideEffects(supabase, {
          user_id,
          recommended_product,
          second_product: second_product ?? null,
          match_percent:  match_percent  ?? null,
          answers:        answers        ?? {},
        });
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const supabase = createServerClient();
    await supabase.from('error_logs').insert({
      context: '/api/quiz-result',
      error: String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
