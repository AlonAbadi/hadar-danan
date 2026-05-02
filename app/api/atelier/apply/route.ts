import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendCapiEvent } from "@/lib/meta-capi";
import { Resend } from "resend";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 3 applications per hour per IP
  if (!rateLimit(`atelier:${ip}`, 3, 60 * 60 * 1000)) {
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

  const name      = typeof body.name      === "string" ? body.name.trim()      : "";
  const phone     = typeof body.phone     === "string" ? body.phone.trim()     : "";
  const instagram = typeof body.instagram === "string" ? body.instagram.trim() : "";
  const story     = typeof body.story     === "string" ? body.story.trim()     : "";
  const sourceUtm = body.source_utm && typeof body.source_utm === "object" ? body.source_utm : null;

  // Validation
  if (!name || !phone || !instagram || !story) {
    return NextResponse.json({ error: "כל השדות נדרשים" }, { status: 400 });
  }
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "שם לא תקין" }, { status: 400 });
  }
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
  }
  if (story.length > 2000) {
    return NextResponse.json({ error: "הסיפור ארוך מדי (עד 2000 תווים)" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Save to DB
  const { data, error } = await safeFrom(supabase, "atelier_applications")
    .insert({
      name,
      phone,
      instagram,
      story,
      source_utm: sourceUtm,
      ip_address: ip,
      user_agent: req.headers.get("user-agent") ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[atelier/apply] DB error:", error);
    // Log to error_logs
    await safeFrom(supabase, "error_logs").insert({
      message: "[atelier/apply] DB insert failed",
      context: JSON.stringify({ error: error.message, name, phone }),
    }).catch(() => {});
    return NextResponse.json(
      { error: "שגיאה בשמירת הבקשה, נסי שוב." },
      { status: 500 }
    );
  }

  // WhatsApp notification to Hadar (fire-and-forget)
  // No server-side WhatsApp API is configured yet - message is logged only.
  // When a WhatsApp provider is added, replace this log with the actual API call.
  const waMessage =
    `בקשה חדשה ל-atelier\n\n` +
    `שם: ${name}\n` +
    `טלפון: ${phone}\n` +
    `אינסטגרם: ${instagram}\n\n` +
    `"${story.slice(0, 300)}${story.length > 300 ? "..." : ""}"`;

  console.info("[atelier/apply] New application #" + data.id + "\n" + waMessage);

  // Email notification to Hadar + Alon
  const atelierWa = phone.replace(/\D/g, "").replace(/^0/, "972");
  new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
    to: ["alonabadi9@gmail.com", "hadard1113@gmail.com"],
    subject: `✨ ליד חם — atelier: ${name}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:480px">
      <h2 style="color:#e05555;margin-bottom:16px">✨ בקשת atelier חדשה</h2>
      <p style="margin:4px 0"><strong>שם:</strong> ${name}</p>
      <p style="margin:4px 0"><strong>טלפון:</strong> <a href="tel:${phone}" style="color:#4285F4">📞 ${phone}</a> &nbsp;·&nbsp; <a href="https://wa.me/${atelierWa}" style="color:#25D366">💬 WhatsApp</a></p>
      <p style="margin:4px 0"><strong>אינסטגרם:</strong> <a href="https://instagram.com/${instagram.replace("@","")}" style="color:#4285F4">@${instagram.replace("@","")}</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="margin:4px 0;font-size:13px;color:#888">הסיפור שלהם:</p>
      <p style="margin:8px 0;color:#333;line-height:1.6">${story.replace(/\n/g, "<br/>")}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <a href="https://www.beegood.online/admin/atelier/${data.id}" style="display:inline-block;background:#e05555;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח בCRM אטלייר ←</a>
    </div>`,
  }).catch(() => {});

  const fbp             = req.cookies.get("_fbp")?.value;
  const fbc             = req.cookies.get("_fbc")?.value;
  const clientUserAgent = req.headers.get("user-agent") ?? undefined;
  const clientIpAddress = getClientIp(req);
  const firstName       = name.trim().split(" ")[0] || undefined;

  const sharedUserData = {
    phone,
    firstName,
    fbp,
    fbc,
    clientUserAgent,
    clientIpAddress,
  };

  const sharedCustomData = {
    contentName: "atelier_influencer",
    contentIds:  ["atelier_influencer"],
  };

  await sendCapiEvent({
    eventName:  "Lead",
    eventId:    `atelier_${data.id}`,
    userData:   sharedUserData,
    customData: sharedCustomData,
  });

  await sendCapiEvent({
    eventName:  "AtelierLead",
    eventId:    `atelierLead_${data.id}`,
    userData:   sharedUserData,
    customData: sharedCustomData,
  });

  return NextResponse.json({ success: true, id: data.id });
}
