import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Unsubscribe endpoint for the legacy-list reactivation campaign.
 * Contacts are NOT in the users table, so the regular /unsubscribe flow
 * doesn't apply. Unsubscribes are recorded as immutable rows in `events`
 * (type LEGACY_UNSUBSCRIBED, metadata.email) — the send script reads them
 * as a suppression list before every wave.
 *
 * GET  — human click from the email footer → Hebrew confirmation page
 * POST — Gmail/Yahoo One-Click (RFC 8058, List-Unsubscribe-Post header)
 *
 * Links are signed: t = HMAC-SHA256(email, CRON_SECRET) so nobody can
 * unsubscribe someone else by guessing their address.
 */

function sign(email: string): string {
  return createHmac("sha256", process.env.CRON_SECRET ?? "")
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

function verify(email: string, token: string): boolean {
  const expected = Buffer.from(sign(email));
  const got = Buffer.from(token);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

async function recordUnsubscribe(email: string): Promise<void> {
  const supabase = createServerClient();
  await supabase.from("events").insert({
    type: "LEGACY_UNSUBSCRIBED",
    metadata: { email: email.toLowerCase(), at: new Date().toISOString() },
  });
}

function parseParams(req: NextRequest): { email: string; token: string } | null {
  const email = req.nextUrl.searchParams.get("e")?.trim().toLowerCase() ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  if (!email || !token || !verify(email, token)) return null;
  return { email, token };
}

export async function GET(req: NextRequest) {
  const params = parseParams(req);
  if (!params) {
    return new NextResponse("קישור לא תקין", { status: 400 });
  }
  await recordUnsubscribe(params.email);
  return new NextResponse(
    `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>הוסרתם מהרשימה</title></head>
<body style="background:#0D1018;color:#EDE9E1;font-family:Assistant,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center">
<div style="max-width:420px;padding:32px">
<div style="font-size:40px;margin-bottom:16px">✓</div>
<h1 style="font-size:22px;margin:0 0 12px">הוסרתם מהרשימה</h1>
<p style="color:#9E9990;font-size:15px;line-height:1.7">לא נשלח לכם עוד מיילים מהסדרה הזאת.<br>אם תתחרטו, תמיד אפשר לחזור דרך beegood.online</p>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

// RFC 8058 One-Click: mail providers POST with no body expectations
export async function POST(req: NextRequest) {
  const params = parseParams(req);
  if (!params) return new NextResponse(null, { status: 400 });
  await recordUnsubscribe(params.email);
  return new NextResponse(null, { status: 200 });
}
