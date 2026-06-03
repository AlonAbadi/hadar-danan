import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from "resend";

const MAKE_WEBHOOK = "https://hook.eu1.make.com/rmw23usw8k9l4oooc573epuwh2skcbil";

const HIGH_VALUE_PRODUCTS = new Set(["strategy", "premium", "partnership"]);

// Quiz leads that get an instant admin email to Alon + Hadar so they can
// call immediately. Partnership has its own dedicated lead flow with
// notification, so it's not included here.
const ADMIN_ALERT_PRODUCTS = new Set(["strategy", "premium"]);

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

    // Enqueue WhatsApp quiz-result message (fire & forget)
    if (process.env.UCHAT_API_KEY && updatedCount > 0) {
      const WA_LABELS: Record<string, string> = {
        challenge:   'אתגר 7 ימים',
        workshop:    'סדנה יום אחד',
        course:      'קורס דיגיטלי',
        strategy:    'פגישת אסטרטגיה',
        premium:     'יום צילום פרמיום',
        partnership: 'שותפות אסטרטגית',
      };

      try {
        const [{ data: qr }, { data: user }] = await Promise.all([
          supabase.from('quiz_results')
            .select('recommended_product, second_product, match_percent, answers')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from('users')
            .select('name, email, phone, utm_source, utm_medium, utm_campaign')
            .eq('id', user_id)
            .single(),
        ]);

        const label = qr?.recommended_product ? WA_LABELS[qr.recommended_product] : null;
        if (label && user?.phone) {
          const firstName = user.name?.trim().split(/\s+/)[0] ?? '';
          await supabase.from('jobs').insert({
            type:    'SEND_WHATSAPP',
            payload: {
              user_id,
              phone:           user.phone,
              name:            firstName,
              template_name:   'hadar_quiz_result',
              template_params: [firstName, label],
            },
            run_at: new Date().toISOString(),
            status: 'pending',
          });
        }

        // Send high-value leads to Make webhook
        if (qr?.recommended_product && HIGH_VALUE_PRODUCTS.has(qr.recommended_product)) {
          await sendToMake({
            name:                user?.name ?? "",
            email:               user?.email ?? "",
            phone:               user?.phone ?? "",
            recommended_product: PRODUCT_LABELS[qr.recommended_product] ?? qr.recommended_product,
            second_product:      qr.second_product ? (PRODUCT_LABELS[qr.second_product] ?? qr.second_product) : "",
            match_percent:       qr.match_percent ?? 0,
            answers:             qr.answers ?? {},
            utm_source:          user?.utm_source ?? "",
            utm_medium:          user?.utm_medium ?? "",
            utm_campaign:        user?.utm_campaign ?? "",
            source:              "quiz",
          });
        }

        // Admin email alert to Alon + Hadar for strategy / premium recommendations
        if (qr?.recommended_product && user) {
          await sendAdminQuizAlert({
            product:       qr.recommended_product,
            name:          user.name ?? "",
            email:         user.email ?? "",
            phone:         user.phone ?? "",
            user_id,
            matchPercent:  qr.match_percent ?? 0,
            secondProduct: qr.second_product ?? undefined,
            utmSource:     user.utm_source ?? undefined,
            utmCampaign:   user.utm_campaign ?? undefined,
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
    const { user_id, anonymous_id, answers, scores, recommended_product, second_product, match_percent } = body;

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
    });

    if (error) {
      await supabase.from('error_logs').insert({
        context: '/api/quiz-result',
        error: error.message,
        payload: { recommended_product },
      });
    }

    // Enqueue WhatsApp quiz-result message when user is already known (logged-in flow)
    if (!error && user_id && process.env.UCHAT_API_KEY) {
      const WA_LABELS: Record<string, string> = {
        challenge:   'אתגר 7 ימים',
        workshop:    'סדנה יום אחד',
        course:      'קורס דיגיטלי',
        strategy:    'פגישת אסטרטגיה',
        premium:     'יום צילום פרמיום',
        partnership: 'שותפות אסטרטגית',
      };
      const label = WA_LABELS[recommended_product];
      if (label) {
        try {
          const { data: user } = await supabase.from('users').select('name, email, phone, utm_source, utm_medium, utm_campaign').eq('id', user_id).single();
          if (user?.phone) {
            const firstName = user.name?.trim().split(/\s+/)[0] ?? '';
            await supabase.from('jobs').insert({
              type:    'SEND_WHATSAPP',
              payload: {
                user_id,
                phone:           user.phone,
                name:            firstName,
                template_name:   'hadar_quiz_result',
                template_params: [firstName, label],
              },
              run_at: new Date().toISOString(),
              status: 'pending',
            });
          }

          // Send high-value leads to Make webhook
          if (HIGH_VALUE_PRODUCTS.has(recommended_product) && user) {
            await sendToMake({
              name:                user.name ?? "",
              email:               user.email ?? "",
              phone:               user.phone ?? "",
              recommended_product: PRODUCT_LABELS[recommended_product] ?? recommended_product,
              second_product:      second_product ? (PRODUCT_LABELS[second_product] ?? second_product) : "",
              match_percent:       match_percent ?? 0,
              answers:             answers ?? {},
              utm_source:          user.utm_source ?? "",
              utm_medium:          user.utm_medium ?? "",
              utm_campaign:        user.utm_campaign ?? "",
              source:              "quiz",
            });
          }

          // Admin email alert to Alon + Hadar for strategy / premium recommendations
          if (user) {
            await sendAdminQuizAlert({
              product:       recommended_product,
              name:          user.name ?? "",
              email:         user.email ?? "",
              phone:         user.phone ?? "",
              user_id,
              matchPercent:  match_percent ?? 0,
              secondProduct: second_product ?? undefined,
              utmSource:     user.utm_source ?? undefined,
              utmCampaign:   user.utm_campaign ?? undefined,
            });
          }
        } catch {}
      }
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
