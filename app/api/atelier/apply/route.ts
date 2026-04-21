import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendCapiEvent } from "@/lib/meta-capi";

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

  await sendCapiEvent({
    eventName:  "Lead",
    eventId:    `atelier_${data.id}`,
    userData:   {
      phone,
      fbp:             req.cookies.get("_fbp")?.value,
      fbc:             req.cookies.get("_fbc")?.value,
      clientUserAgent: req.headers.get("user-agent") ?? undefined,
    },
    customData: {
      contentName: "atelier_influencer",
      contentIds:  ["atelier_influencer"],
    },
  });

  return NextResponse.json({ success: true, id: data.id });
}
