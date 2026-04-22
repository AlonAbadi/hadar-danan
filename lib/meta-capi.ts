/**
 * Meta Conversions API (server-side).
 * Sends events directly from the server — not blocked by ad blockers or iOS restrictions.
 * Deduplicates with browser pixel via matching event_id.
 *
 * Requires: META_CAPI_TOKEN env var (server-side only, never expose to client).
 */
import crypto from "crypto";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function hashEmail(email: string): string {
  return sha256(email);
}

export function hashPhone(phone: string): string {
  return sha256(phone.replace(/\D/g, ""));
}

interface UserData {
  email?: string;
  phone?: string;
  clientUserAgent?: string;
  clientIpAddress?: string;
  fbp?: string;  // _fbp cookie value
  fbc?: string;  // _fbc cookie value (fbclid)
}

interface CapiPayload {
  eventName: string;
  eventId?: string;  // must match browser pixel eventID for deduplication
  userData: UserData;
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentIds?: string[];
  };
}

export async function sendCapiEvent(payload: CapiPayload): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token   = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  const ud: Record<string, string | string[]> = {};
  if (payload.userData.email) ud.em = [hashEmail(payload.userData.email)];
  if (payload.userData.phone) ud.ph = [hashPhone(payload.userData.phone)];
  if (payload.userData.clientUserAgent) ud.client_user_agent  = payload.userData.clientUserAgent;
  if (payload.userData.clientIpAddress) ud.client_ip_address  = payload.userData.clientIpAddress;
  if (payload.userData.fbp) ud.fbp = payload.userData.fbp;
  if (payload.userData.fbc) ud.fbc = payload.userData.fbc;

  const event: Record<string, unknown> = {
    event_name:    payload.eventName,
    event_time:    Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data:     ud,
  };
  if (payload.eventId)   event.event_id   = payload.eventId;
  if (payload.customData) {
    event.custom_data = {
      ...(payload.customData.value       != null && { value:        payload.customData.value }),
      ...(payload.customData.currency             && { currency:     payload.customData.currency }),
      ...(payload.customData.contentName          && { content_name: payload.customData.contentName }),
      ...(payload.customData.contentIds?.length   && { content_ids:  payload.customData.contentIds, content_type: "product" }),
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${token}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ data: [event] }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[CAPI] ${payload.eventName} failed ${res.status}:`, body);
    }
  } catch (err) {
    console.error(`[CAPI] ${payload.eventName} network error:`, err);
  }
}
