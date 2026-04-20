import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch { return false; }
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { application_id, email } = await req.json();
  if (!application_id || !email) {
    return NextResponse.json({ error: "חסרים application_id ו-email" }, { status: 400 });
  }

  const token = generateToken();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";
  const link = `${APP_URL}/onboarding/${token}`;

  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app, error: fetchErr } = await (supabase as any)
    .from("atelier_applications")
    .select("name")
    .eq("id", application_id)
    .single();

  if (fetchErr || !app) {
    return NextResponse.json({ error: "בקשה לא נמצאה" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (supabase as any)
    .from("atelier_applications")
    .update({
      email,
      onboarding_token: token,
      onboarding_sent_at: new Date().toISOString(),
    })
    .eq("id", application_id);

  if (updateErr) {
    return NextResponse.json({ error: "שגיאת שמירה" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

  const { error: emailErr } = await resend.emails.send({
    from: `BeeGood <${fromEmail}>`,
    to: email,
    subject: `${app.name}, הטופס שלך מחכה — BeeGood`,
    html: buildEmail(app.name, link),
  });

  if (emailErr) {
    console.error("[send-onboarding] Resend error:", emailErr);
    return NextResponse.json({ error: "שגיאת שליחת מייל" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token });
}

function buildEmail(name: string, link: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f4f7fb; font-family: 'Assistant', Arial, sans-serif; direction: rtl; text-align: right; color: #1f2937; }
    .wrapper { max-width: 580px; margin: 32px auto; padding: 0 16px 40px; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    .header { background: #0a0a0f; padding: 28px 32px; }
    .header-logo { font-size: 12px; font-weight: 700; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
    .header h1 { font-size: 22px; font-weight: 800; color: #fff; line-height: 1.3; }
    .header p { font-size: 14px; color: #9ca3af; margin-top: 6px; }
    .body { padding: 32px; }
    .body p { font-size: 16px; line-height: 1.8; color: #374151; margin-bottom: 16px; }
    .cta { display: inline-block; background: #C9964A; color: #fff !important; text-decoration: none; font-weight: 800; font-size: 16px; padding: 15px 36px; border-radius: 10px; margin: 8px 0 20px; }
    .note { font-size: 13px; color: #9ca3af; margin-top: 4px; }
    .footer { padding: 20px 32px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="header-logo">BeeGood · Atelier</div>
        <h1>שלום ${name} 👋</h1>
        <p>הטופס שלך לבניית הזהות הדיגיטלית מחכה</p>
      </div>
      <div class="body">
        <p>קיבלנו את הבקשה שלך וזה הזמן להתחיל לבנות.</p>
        <p>מלאי את הטופס הבא — ככל שתספקי יותר פרטים, קלוד יוכל לייצר זהות מדויקת ואמיתית יותר עבורך.</p>
        <p>את יכולה לצרף מסמכים, קבצים, כל דבר שמתאר את הקול והשיטה שלך.</p>
        <a class="cta" href="${link}">למילוי הטופס ←</a>
        <p class="note">הלינק תקף ל-14 ימים. אם יש שאלות — ענה על המייל הזה.</p>
      </div>
      <div class="footer">BeeGood · beegood.online</div>
    </div>
  </div>
</body>
</html>`;
}
