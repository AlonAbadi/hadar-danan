/**
 * POST /api/admin/whatsapp/send
 *
 * Sends a free-form WhatsApp message directly to a user from the admin CRM.
 * Routes through UChat BSP (uchat.com.au) which manages the +972 53-470-2458 number.
 *
 * Free-form text messages work only within WhatsApp's 24h customer-service window
 * (i.e. the user messaged the business first). Outside that window, use a template.
 * UChat returns a clear error when the window is closed — the admin can then copy
 * the text and send it manually from the UChat dashboard instead.
 *
 * Required env var: UCHAT_API_KEY (UChat Settings → API Keys)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const BodySchema = z.object({
  user_id: z.string().uuid(),
  message: z.string().min(1).max(4096),
});

function normalizePhone(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("972") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 10) return "972" + d.slice(1);
  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.UCHAT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "WhatsApp לא מוגדר — חסר UCHAT_API_KEY" },
      { status: 503 }
    );
  }

  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "פרמטרים לא תקינים" }, { status: 400 });
  }

  const { user_id, message } = body.data;
  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("name, phone")
    .eq("id", user_id)
    .single();

  if (!user?.phone) {
    return NextResponse.json({ error: "אין מספר טלפון לכתובת זו" }, { status: 422 });
  }

  const to = normalizePhone(user.phone);
  if (!to) {
    return NextResponse.json(
      { error: `לא ניתן לנרמל מספר טלפון: ${user.phone}` },
      { status: 422 }
    );
  }

  // UChat: send a free-form text message to a subscriber (within 24h service window).
  const uchatRes = await fetch(
    "https://www.uchat.com.au/api/subscriber/send-whatsapp-text",
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone:              `+${to}`,
        text:               message,
        create_if_not_found: false, // don't create ghost subscribers for admin sends
      }),
    }
  );

  const uchatData = (await uchatRes.json()) as Record<string, unknown>;

  if (!uchatRes.ok) {
    const errMsg = (uchatData?.message as string) ?? JSON.stringify(uchatData);
    await supabase.from("error_logs").insert({
      context: "api/admin/whatsapp/send",
      error:   String(errMsg),
      payload: { user_id, to },
    });
    return NextResponse.json({ error: `שגיאת UChat API: ${errMsg}` }, { status: 502 });
  }

  const messageId = (uchatData.message_id as string) ?? null;

  return NextResponse.json({ ok: true, message_id: messageId, to });
}
