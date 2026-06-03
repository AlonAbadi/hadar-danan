/**
 * POST /api/admin/resend-quiz-alert
 *
 * Manually re-sends the admin quiz alert email for a given user_id.
 * Used to test the notification or to retroactively notify on past leads.
 *
 * Body: { user_id: string }
 * Auth: Basic Auth via proxy.ts (admin only).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const PRODUCT_LABELS: Record<string, string> = {
  strategy: "פגישת אסטרטגיה",
  premium:  "יום צילום פרמיום",
};

const PRODUCT_EMOJI: Record<string, string> = {
  strategy: "🎯",
  premium:  "📸",
};

export async function POST(req: NextRequest) {
  const { user_id } = (await req.json().catch(() => ({}))) as { user_id?: string };
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("name, email, phone, utm_source, utm_campaign")
    .eq("id", user_id)
    .single();

  const { data: qr } = await supabase
    .from("quiz_results")
    .select("recommended_product, second_product, match_percent")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!user || !qr) return NextResponse.json({ error: "user or quiz_result not found" }, { status: 404 });
  if (!qr.recommended_product || !(qr.recommended_product in PRODUCT_LABELS)) {
    return NextResponse.json({ error: `not a strategy/premium lead (got: ${qr.recommended_product})` }, { status: 400 });
  }

  const product   = qr.recommended_product;
  const label     = PRODUCT_LABELS[product];
  const emoji     = PRODUCT_EMOJI[product];
  const name      = user.name ?? "";
  const email     = user.email ?? "";
  const phone     = user.phone ?? "";
  const phoneWa   = phone.replace(/\D/g, "").replace(/^0/, "972");
  const secondLine = qr.second_product
    ? `<p style="margin:4px 0;font-size:13px;color:#888"><strong>גם מתאים:</strong> ${PRODUCT_LABELS[qr.second_product] ?? qr.second_product}</p>`
    : "";
  const utmLine = user.utm_source
    ? `<p style="margin:4px 0;font-size:12px;color:#aaa">מקור: ${user.utm_source}${user.utm_campaign ? ` · ${user.utm_campaign}` : ""}</p>`
    : "";

  try {
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
      to: ["alonabadi9@gmail.com", "hadard1113@gmail.com"],
      subject: `${emoji} ליד חם מהקוויז — ${label}: ${name}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:480px">
        <h2 style="color:#C9964A;margin-bottom:16px">${emoji} ליד מהקוויז · ${label}</h2>
        <p style="margin:4px 0"><strong>שם:</strong> ${name}</p>
        <p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${email}" style="color:#4285F4">${email}</a></p>
        <p style="margin:4px 0"><strong>טלפון:</strong> <a href="tel:${phone}" style="color:#4285F4">📞 ${phone}</a> &nbsp;·&nbsp; <a href="https://wa.me/${phoneWa}" style="color:#25D366">💬 WhatsApp</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <p style="margin:4px 0"><strong>התאמה:</strong> ${qr.match_percent ?? 0}%</p>
        ${secondLine}
        ${utmLine}
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <p style="margin:8px 0;font-size:13px;color:#888">💡 סיים/ה את הקוויז וקיבל/ה המלצה ל-${label}. שווה להתקשר עכשיו לפני שמתקרר.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <a href="https://www.beegood.online/admin/users/${user_id}" style="display:inline-block;background:#C9964A;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח פרופיל באדמין ←</a>
      </div>`,
    });
    return NextResponse.json({ ok: true, name, product, email_id: result?.data?.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
