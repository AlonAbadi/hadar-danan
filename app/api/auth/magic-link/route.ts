import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const APP_URL      = process.env.NEXT_PUBLIC_APP_URL  ?? "https://beegood.online";
const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

export async function POST(req: NextRequest) {
  // Rate limit: 3 requests per 5 minutes per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`magic-link:${ip}`, 3, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות, נסי שוב בעוד כמה דקות" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "חסר אימייל" }, { status: 400 });

  const supabase = createServerClient();

  // Verify user exists in CRM
  const { data: user } = await supabase
    .from("users")
    .select("id, name")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Generate magic link — redirects to /access where session is processed
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${APP_URL}/access` },
  });

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: "שגיאה ביצירת קישור" }, { status: 500 });
  }

  const magicLink  = data.properties.action_link;
  const firstName  = user.name?.split(" ")[0] ?? "";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: `הדר דנן <${FROM_ADDRESS}>`,
    to: email,
    subject: "הקישור שלך לכניסה לאזור האישי",
    html: buildEmail(firstName, magicLink),
  });

  if (sendError) {
    return NextResponse.json({ error: "שגיאה בשליחת המייל" }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}

function buildEmail(name: string, href: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
</head>
<body style="background:#f4f7fb;font-family:'Assistant',Arial,sans-serif;direction:rtl;text-align:right;color:#1f2937;margin:0;padding:0;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <div style="background:#0a0a0f;padding:28px 32px;">
        <div style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;">beegood</div>
        <h1 style="font-size:22px;font-weight:800;color:#fff;margin:0;">הקישור שלך מוכן</h1>
      </div>
      <div style="padding:28px 32px;">
        ${name ? `<p style="font-size:15px;margin:0 0 14px;">שלום ${name},</p>` : ""}
        <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 24px;">
          לחצי על הכפתור כדי להיכנס לאזור האישי שלך.<br>
          הקישור בתוקף ל-24 שעות.
        </p>
        <a href="${href}" style="display:inline-block;background:#E8B94A;color:#080C14;border-radius:8px;padding:13px 28px;font-size:15px;font-weight:800;text-decoration:none;">
          כניסה לאזור האישי ←
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:20px;line-height:1.5;">
          אם לא ביקשת קישור זה, ניתן להתעלם ממנו בבטחה.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
