/**
 * WhatsApp sender via UChat BSP (uchat.com.au).
 *
 * The phone number +972 53-470-2458 is managed by UChat — we cannot call
 * Meta's Graph API directly. All messages go through UChat's REST API.
 *
 * Template names used by the cart-abandon flow:
 *   hadar_cart_1h  — sent 1h after CHECKOUT_STARTED
 *   hadar_cart_24h — sent 24h after CHECKOUT_STARTED
 *
 * Both accept one body parameter: the user's first name ({{1}}).
 * Create/approve them in UChat → Templates → WhatsApp Templates.
 *
 * Required env var: UCHAT_API_KEY (UChat Settings → API Keys)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface SendWhatsappPayload {
  user_id: string;
  phone: string;
  name: string;
  template_name: string;
  template_params?: string[]; // maps to {{1}}, {{2}}, … body component params
  [key: string]: unknown;
}

// 05X-XXXXXXX or 05XXXXXXXX → 9725XXXXXXXX
function normalizePhone(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("972") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 10) return "972" + d.slice(1);
  return null;
}

export async function handleSendWhatsapp(
  payload: SendWhatsappPayload,
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { user_id, phone, template_name, template_params = [] } = payload;

  const apiKey = process.env.UCHAT_API_KEY;
  if (!apiKey) throw new Error("UCHAT_API_KEY not configured");

  // Skip if the user already purchased — cart abandon no longer relevant.
  const { data: user } = await supabase
    .from("users")
    .select("status")
    .eq("id", user_id)
    .single();

  if (user?.status === "buyer" || user?.status === "booked") return;

  // Dedup: one successful send per (user, template).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("whatsapp_logs")
    .select("id")
    .eq("user_id", user_id)
    .eq("template_name", template_name)
    .eq("status", "sent")
    .maybeSingle();

  if (existing) return;

  const to = normalizePhone(phone);
  if (!to) throw new Error(`Cannot normalize phone to E.164: ${phone}`);

  // UChat Cloud API does not require a namespace — pass empty string
  const namespace = "";

  // Build params as flat object: BODY_{{1}}, BODY_{{2}}, ...
  const params: Record<string, string> = {};
  template_params.forEach((text, i) => { params[`BODY_{{${i + 1}}}`] = text; });

  const body = {
    user_id:             `+${to}`,
    create_if_not_found: "yes",
    content: {
      namespace,
      name:      template_name,
      lang:      "he",
      params,
    },
    contact: {
      first_name: payload.name ?? "",
    },
  };

  const res = await fetch(
    "https://www.uchat.com.au/api/subscriber/send-whatsapp-template-by-user-id",
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(`UChat API error ${res.status}: ${JSON.stringify(data)}`);
  }

  const waMessageId = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("whatsapp_logs").insert({
    user_id,
    template_name,
    phone:         to,
    status:        "sent",
    wa_message_id: waMessageId,
  });
}
