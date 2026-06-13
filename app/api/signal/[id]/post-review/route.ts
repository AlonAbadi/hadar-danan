/**
 * POST /api/signal/[id]/post-review
 *
 * Hive perk. Takes user-submitted post text and returns a Claude-generated
 * alignment review against the person's signal: what's strong, what drifts,
 * a sharper rewrite suggestion. Designed to be a habit-forming weekly tool
 * inside the Hive members area.
 *
 * Request body:
 *   { text: string }   - the post draft to review (max 2000 chars)
 *
 * Response:
 *   {
 *     alignment_score:    number 1-10,
 *     matches:            string  // what aligns with the signal
 *     drifts:             string  // what doesn't, and why
 *     sharper_rewrite:    string  // a tighter version, ~same length
 *     suggested_opening:  string  // alternative opening line
 *   }
 *
 * Gated to hive_status='active'. Cost ~$0.01 per call.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const SYSTEM_PROMPT = `אתה מבקר תוכן של beegood, מומחה בשיטת TrueSignal© של הדר דנן. אתה מקבל את האות המלא של אדם ופוסט טיוטה שלו, ובודק כמה הפוסט מחובר לאות.

כללי כתיבה גלובליים:
- עברית בלבד.
- בלי מקפים ארוכים (em dash). רק נקודה או פסיק.
- בלי קלישאות שיווקיות, בלי emoji.
- ביקורת חמה אבל ישרה. לא מתחנף, לא מקטין.

מה אתה בוחן:
1. האם הפוסט נשמע כמו האדם הזה ספציפית, או שזה תוכן גנרי שיכול היה להגיע מכל אחד באותו תחום?
2. האם הוא נשען על הבידול האישי שכבר חולץ (הכאב, האלמנט, הכלי, האות עצמו), או שהוא מתחבא בכלליות?
3. האם הפתיחה תופסת את הקורא הנכון תוך 2 שניות?
4. האם הסיום ברור או מתפזר?

החזר JSON תקין:
{
  "alignment_score":   <מספר 1-10, כמה הפוסט מחובר לאות. 10 = זה הוא במדויק, 1 = אפס קשר>,
  "matches":           "<2-3 משפטים על מה עובד טוב — חזק כי X. במיוחד הקטע שבו...>",
  "drifts":            "<2-4 משפטים על מה לא — מתחיל ב'קלישאה X' או 'הכלליות של Y'. אם הציון הוא 9-10, החזר משפט שאומר שהפוסט אכן חד.>",
  "sharper_rewrite":   "<גרסה חדה יותר של הפוסט באורך דומה, בקול האדם, שמשתמשת יותר בבידול שלו. עד 800 תווים.>",
  "suggested_opening": "<משפט פתיחה חלופי, אחד בלבד, חד וקצר. ימשוך את הקורא הנכון מהשנייה הראשונה.>"
}`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof (body as { text?: unknown })?.text === "string"
    ? (body as { text: string }).text.trim().slice(0, 2000)
    : "";
  if (text.length < 30) {
    return NextResponse.json({ error: "Post text must be at least 30 characters" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: row } = await safeFrom(supabase, "signal_extractions")
    .select("signal, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!row?.signal?.signal) {
    return NextResponse.json({ error: "signal not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (supabase as any)
    .from("users")
    .select("hive_status, occupation, name")
    .eq("id", row.user_id)
    .maybeSingle();

  const adminBypass = req.headers.get("x-admin-bypass-hive") === "1";
  if (userRow?.hive_status !== "active" && !adminBypass) {
    return NextResponse.json({ error: "Post Review is a Hive perk", upgrade_url: "/hive" }, { status: 403 });
  }

  // Per-user rate limit — 30 reviews per hour is plenty for genuine use.
  if (!rateLimit(`post-review:${row.user_id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reviews. Try again in an hour." }, { status: 429 });
  }

  const occupation = typeof userRow?.occupation === "string" && userRow.occupation.trim().length > 0
    ? userRow.occupation.trim()
    : "לא נמסר";

  const userMessage = [
    `תחום עיסוק: ${occupation}`,
    "",
    "האות של האדם:",
    `מקור הכאב: ${row.signal.pain_source ?? ""}`,
    `האלמנט: ${row.signal.element ?? ""}`,
    `האות: ${row.signal.signal ?? ""}`,
    `מה שהאות מבטיח: ${row.signal.signal_promise ?? ""}`,
    `הכלי המרכזי: ${row.signal.central_tool ?? ""}`,
    `האנשים שלו: ${row.signal.people ?? ""}`,
    "",
    "הפוסט הטיוטה שלו:",
    `"""${text}"""`,
    "",
    "החזר את הביקורת כ-JSON על פי הסכמה.",
  ].join("\n");

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 2000,
      system:     SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("Non-text block");
    const cleanText = block.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(cleanText);
    if (typeof parsed?.alignment_score !== "number") throw new Error("Invalid shape");
    return NextResponse.json(parsed);
  } catch (e) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/post-review",
      error:   String(e),
      payload: { extractionId: id, textLen: text.length },
    });
    return NextResponse.json({ error: "Review failed. Try again." }, { status: 502 });
  }
}
