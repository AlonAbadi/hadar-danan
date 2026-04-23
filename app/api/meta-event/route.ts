import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  // Israeli numbers: prepend country code if missing
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

export async function POST(req: NextRequest) {
  try {
    const { eventName, eventId, email, phone, firstName, lastName, userId, contentName, productEventName, value, currency } = await req.json() as {
      eventName: string;
      eventId?: string;
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      userId?: string;
      contentName?: string;
      productEventName?: string;
      value?: number;
      currency?: string;
    };

    const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const token   = process.env.META_CAPI_TOKEN;

    if (!pixelId || !token) {
      return NextResponse.json({ error: "CAPI not configured" }, { status: 503 });
    }

    const userData: Record<string, unknown> = {
      client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
      client_user_agent: req.headers.get("user-agent") || "",
    };

    if (email)     userData.em = [sha256(email)];
    if (phone)     userData.ph = [sha256(normalizePhone(phone))];
    if (firstName) userData.fn = [sha256(firstName.toLowerCase())];
    if (lastName)  userData.ln = [sha256(lastName.toLowerCase())];
    if (userId)    userData.external_id = [sha256(userId)];
    userData.country = [sha256("il")];

    const fbp = req.cookies.get("_fbp")?.value;
    const fbc = req.cookies.get("_fbc")?.value;
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    const eventTime = Math.floor(Date.now() / 1000);
    const sourceUrl = req.headers.get("referer") || "https://beegood.online";
    const customData: Record<string, unknown> = {};
    if (contentName)        customData.content_name = contentName;
    if (value !== undefined) customData.value       = value;
    if (currency)           customData.currency     = currency;

    const baseEvent = {
      event_time:       eventTime,
      action_source:    "website",
      event_source_url: sourceUrl,
      user_data:        userData,
      custom_data:      Object.keys(customData).length > 0 ? customData : undefined,
    };

    const events = [
      { ...baseEvent, event_name: eventName,        event_id: eventId },
      // Product-specific custom event — same eventId as the standard event
      // (deduplication is per event_name so identical IDs across different names are safe)
      ...(productEventName ? [{ ...baseEvent, event_name: productEventName, event_id: eventId }] : []),
    ];

    const payload = { data: events, access_token: token };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[meta-event] CAPI error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
