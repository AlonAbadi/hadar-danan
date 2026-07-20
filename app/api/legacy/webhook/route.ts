import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Resend webhook for the legacy-list reactivation campaign.
 * Records bounces / complaints / clicks as immutable rows in `events`
 * so the send script can suppress and measure without a new table.
 *
 * Only events for mail sent from news.beegood.online are recorded — the
 * webhook fires for the whole Resend account, and transactional mail from
 * the main domain must not pollute the campaign data.
 *
 * Signature: Resend signs with the Svix scheme —
 *   signedContent = `${svix-id}.${svix-timestamp}.${rawBody}`
 *   expected = base64(HMAC-SHA256(signedContent, base64decode(secret without "whsec_")))
 * Secret in LEGACY_WEBHOOK_SECRET.
 */

const EVENT_MAP: Record<string, string> = {
  "email.bounced": "LEGACY_EMAIL_BOUNCED",
  "email.complained": "LEGACY_EMAIL_COMPLAINED",
  "email.clicked": "LEGACY_EMAIL_CLICKED",
};

function verifySvix(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.LEGACY_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signatures = req.headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;
  // reject stale deliveries (>5 min) to prevent replay
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");
  // header holds space-separated versioned signatures: "v1,<base64> v1,<base64>"
  return signatures.split(" ").some((part) => {
    const sig = part.split(",")[1] ?? "";
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifySvix(req, rawBody)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const supabase = createServerClient();
  try {
    const payload = JSON.parse(rawBody) as {
      type?: string;
      data?: { from?: string; to?: string[]; email_id?: string; click?: { link?: string } };
    };

    const mappedType = EVENT_MAP[payload.type ?? ""];
    const from = payload.data?.from ?? "";
    // Only the campaign subdomain — ignore transactional mail events
    if (!mappedType || !from.includes("news.beegood.online")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const email = (payload.data?.to?.[0] ?? "").toLowerCase();
    if (!email) return NextResponse.json({ ok: true, skipped: true });

    await supabase.from("events").insert({
      type: mappedType,
      metadata: {
        email,
        resend_id: payload.data?.email_id ?? null,
        link: payload.data?.click?.link ?? null,
        at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await supabase.from("error_logs").insert({
      context: "api/legacy/webhook",
      error: err instanceof Error ? err.message : String(err),
    });
    // 200 so svix doesn't retry forever on malformed payloads
    return NextResponse.json({ ok: false });
  }
}
