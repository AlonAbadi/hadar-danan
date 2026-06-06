/**
 * POST /api/stage/apply
 *
 * Receives an application for "3 ימי פתוחים".
 * Computes commitment score server-side (never trust client), stores in
 * stage_applications, sends a short confirmation email to the applicant and
 * an admin notification to Hadar + Alon.
 *
 * Vercel Hobby = 10s timeout. No AI here - everything is synchronous and fast.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendCapiEvent } from "@/lib/meta-capi";
import { scoreApplication } from "@/lib/stageScore";
import { Resend } from "resend";

// stage_applications is not yet in the generated DB types - use a typed any
// like the atelier route does.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!rateLimit(`stage:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "יותר מדי נסיונות. נסי שוב בעוד שעה." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const name    = typeof body.name  === "string" ? body.name.trim()  : "";
  const email   = typeof body.email === "string" ? body.email.trim() : "";
  const phone   = typeof body.phone === "string" ? body.phone.trim() : "";
  const answersRaw = body.answers && typeof body.answers === "object" ? body.answers as Record<string, unknown> : null;
  const sourceUtm  = body.source_utm && typeof body.source_utm === "object" ? body.source_utm : null;

  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "שם לא תקין" }, { status: 400 });
  }
  if (!answersRaw) {
    return NextResponse.json({ error: "חסרות תשובות" }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });
  }
  if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
  }

  // Normalize answers to strings only - guards against payload tampering and
  // keeps the scorer's input shape strict.
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(answersRaw)) {
    if (typeof v === "string") answers[k] = v.slice(0, 5000);
  }

  const joined = Object.values(answers).join(" ").trim();
  if (joined.length < 50) {
    return NextResponse.json({ error: "התשובות קצרות מדי" }, { status: 400 });
  }

  const { score, breakdown } = scoreApplication(answers);

  const supabase = createServerClient();

  const { data, error } = await safeFrom(supabase, "stage_applications")
    .insert({
      name,
      email:           email || null,
      phone:           phone || null,
      answers,
      score,
      score_breakdown: breakdown,
      status:          "new",
      source_utm:      sourceUtm,
      ip_address:      ip,
      user_agent:      req.headers.get("user-agent") ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    await safeFrom(supabase, "error_logs").insert({
      context: "api/stage/apply",
      error: error?.message ?? "insert failed",
      payload: { name, email, phone },
    }).catch(() => {});
    return NextResponse.json({ error: "שגיאה בשמירת הבקשה, נסי שוב." }, { status: 500 });
  }

  const resend  = new Resend(process.env.RESEND_API_KEY);
  const fromAddr = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

  // Applicant confirmation - short, warm, no emoji.
  if (email) {
    resend.emails.send({
      from: `הדר דנן <${fromAddr}>`,
      to:   email,
      subject: "קיבלנו את המועמדות שלך — 3 ימים פתוחים",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:520px;color:#222">
        <p>${name.split(" ")[0] || "שלום"},</p>
        <p>קיבלנו את המועמדות שלך לסדרת שלושת הימים הפתוחים.</p>
        <p>אנחנו עוברים על כל בקשה ידנית — לא בוט, לא טופס אוטומטי. אם המקום והרגע מתאימים, נחזור אליך תוך כמה ימים עם הצעד הבא.</p>
        <p>בינתיים, היה חכם שכתבת את התשובות באמת. השיחה הזאת מתחילה ברגע ששלחת.</p>
        <p style="margin-top:24px">צוות beegood</p>
      </div>`,
    }).catch(() => {});
  }

  // Admin alert - to Hadar + Alon.
  const applicantWa = phone ? phone.replace(/\D/g, "").replace(/^0/, "972") : "";
  const answerLines = Object.entries(answers).map(
    ([k, v]) => `<p style="margin:6px 0"><strong>${k}:</strong> ${v.replace(/\n/g, "<br/>")}</p>`
  ).join("");

  resend.emails.send({
    from: fromAddr,
    to:   ["alonabadi9@gmail.com", "hadard1113@gmail.com"],
    subject: `🎯 מועמדות חדשה — 3 ימים פתוחים: ${name} (${score})`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:560px">
      <h2 style="color:#C9964A;margin-bottom:12px">מועמדות חדשה — 3 ימים פתוחים</h2>
      <p style="margin:4px 0"><strong>שם:</strong> ${name}</p>
      ${email ? `<p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${email}">${email}</a></p>` : ""}
      ${phone ? `<p style="margin:4px 0"><strong>טלפון:</strong> <a href="tel:${phone}">${phone}</a>${applicantWa ? ` &middot; <a href="https://wa.me/${applicantWa}">WhatsApp</a>` : ""}</p>` : ""}
      <p style="margin:4px 0"><strong>ציון מחויבות:</strong> <span style="color:#C9964A;font-weight:700">${score}/100</span>
        <span style="color:#888;font-size:13px"> (עומק ${breakdown.depth}/40 · ספציפיות ${breakdown.specificity}/30 · מחויבות ${breakdown.commitment}/30)</span>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      ${answerLines}
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <a href="https://www.beegood.online/admin/stage" style="display:inline-block;background:#C9964A;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח ב-CRM ←</a>
    </div>`,
  }).catch(() => {});

  // Meta CAPI Lead event - fire-and-forget.
  sendCapiEvent({
    eventName: "Lead",
    eventId:   `stage_${data.id}`,
    userData: {
      email:           email || undefined,
      phone:           phone || undefined,
      fbp:             req.cookies.get("_fbp")?.value,
      fbc:             req.cookies.get("_fbc")?.value,
      clientUserAgent: req.headers.get("user-agent") ?? undefined,
      clientIpAddress: ip,
    },
    customData: { contentName: "stage_application", contentIds: ["stage_application"] },
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: data.id, score });
}
