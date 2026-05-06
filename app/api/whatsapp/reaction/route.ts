import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Keywords for Hebrew/English sentiment classification
const POSITIVE_WORDS = [
  "כן", "בטח", "רוצה", "מעוניין", "מעוניינת", "אשמח", "ספר", "ספרי",
  "תחזרו", "חזרו", "מתאים", "מתאימה", "נשמע", "מעולה", "super", "yes",
  "👍", "❤️", "🙏", "😊", "🔥", "💪", "✅", "👏",
];

const NEGATIVE_WORDS = [
  "לא", "לא מעוניין", "לא מעוניינת", "תסיר", "הסר", "stop", "בטל",
  "לא רלוונטי", "לא רלוונטית", "👎",
];

function classifySentiment(content: string): { sentiment: "positive" | "negative" | "neutral"; score_delta: number } {
  const lower = content.toLowerCase().trim();

  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) return { sentiment: "negative", score_delta: -10 };
  }
  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) return { sentiment: "positive", score_delta: 15 };
  }
  // Any reply is a mild positive signal
  return { sentiment: "neutral", score_delta: 5 };
}

export async function POST(req: NextRequest) {
  // Verify shared secret
  const secret = process.env.UCHAT_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-uchat-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone     = typeof body.phone     === "string" ? body.phone.replace(/\D/g, "") : null;
  const uchat_uid = typeof body.uchat_uid === "string" ? body.uchat_uid : null;
  const first_name = typeof body.first_name === "string" ? body.first_name : null;
  const content   = typeof body.emoji === "string"   ? body.emoji
                  : typeof body.text  === "string"   ? body.text
                  : null;
  const type      = typeof body.type === "string" && body.type === "reply" ? "reply" : "reaction";

  if (!phone || !content) {
    return NextResponse.json({ error: "Missing phone or content" }, { status: 400 });
  }

  const { sentiment, score_delta } = classifySentiment(content);

  const supabase = createServerClient();

  // Look up user by phone (try both 972XXXXXXXXX and 0XXXXXXXXX formats)
  const normalized = phone.startsWith("972") ? phone : `972${phone.slice(1)}`;
  const alt = phone.startsWith("972") ? `0${phone.slice(3)}` : phone;

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .or(`phone.eq.${normalized},phone.eq.${alt},phone.eq.+${normalized}`)
    .maybeSingle();

  // Log to error_logs if user not found (so admin can investigate)
  if (!user) {
    await supabase.from("error_logs").insert({
      context: "whatsapp/reaction",
      error: `User not found for phone: ${phone}`,
      payload: { phone, uchat_uid, first_name },
    });
  }

  // Insert inbound signal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (supabase as any).from("whatsapp_inbound").insert({
    user_id:     user?.id ?? null,
    phone:       normalized,
    type,
    content,
    sentiment,
    score_delta,
    uchat_uid,
  });

  if (insertErr) {
    // Unique constraint violation = duplicate event, ignore silently
    if (insertErr.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentiment, score_delta });
}
