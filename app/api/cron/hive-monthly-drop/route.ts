/**
 * GET /api/cron/hive-monthly-drop
 *
 * Monthly content drop for active Hive members — the recurring drumbeat.
 * Runs once a month via cron-job.org (or Vercel cron). Generates 10 fresh
 * content ideas per active Hive member whose signal extraction exists,
 * stores them in signal.monthly_drops[YYYY-MM], and queues an email to
 * each member announcing the new drop.
 *
 * Idempotency: writes to signal.monthly_drops[yearMonth] are conditional —
 * if a member already has a drop for the current month, they're skipped.
 * Safe to re-run mid-cycle without producing duplicates.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const SYSTEM = `אתה יועץ תוכן ב-beegood, מומחה בשיטת TrueSignal© של הדר דנן. אתה מקבל אות מותגי מלא של אדם וחודש קלנדרי, ומחזיר 10 רעיונות תוכן חדשים לחודש הקרוב.

כללים גלובליים:
- עברית בלבד.
- בלי מקפים ארוכים. רק נקודה או פסיק.
- בלי קלישאות שיווקיות.
- כל רעיון נגזר מהבידול הספציפי שכבר חולץ. לא תוכן גנרי.

10 הרעיונות:
- צריכים להיות שונים זה מזה במהותם (סיפור, תובנה, דעה שנויה במחלוקת, מאחורי הקלעים, איך-לעשות, רשימה, השוואה, פנייה לקהל מוגדר, וכו').
- כל רעיון בשורה אחת, חד וקונקרטי. עד 25 מילים.
- כל רעיון ספציפי דיו שאדם יכול לשבת ולכתוב פוסט מתוכו בלי לחשוב על "מה בדיוק התכוונת".
- שונים מרעיונות שכבר ניתנו בעבר (אם נמסרו קודמים).

החזר JSON תקין:
{ "ideas": ["...", "...", ... 10 ידיעות סך הכל] }`;

const HEB_MONTHS: Record<number, string> = {
  1:"ינואר",  2:"פברואר",  3:"מרץ",     4:"אפריל",
  5:"מאי",    6:"יוני",    7:"יולי",    8:"אוגוסט",
  9:"ספטמבר",10:"אוקטובר",11:"נובמבר",12:"דצמבר",
};

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServerClient();

  const now       = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const heMonth   = HEB_MONTHS[now.getMonth() + 1];

  // ── Find active Hive members who have a signal extraction ──────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase as any)
    .from("users")
    .select("id, email, name, occupation")
    .eq("hive_status", "active");

  const list = Array.isArray(members) ? members : [];
  const results: Array<{ user_id: string; status: "ok" | "skipped" | "no_signal" | "error"; detail?: string }> = [];

  for (const member of list) {
    // Find latest signal extraction for this member
    const { data: ext } = await safeFrom(supabase, "signal_extractions")
      .select("id, signal")
      .eq("user_id", member.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ext?.signal?.signal) {
      results.push({ user_id: member.id, status: "no_signal" });
      continue;
    }

    const existingDrops = (ext.signal.monthly_drops ?? {}) as Record<string, { ideas: string[]; created_at: string }>;
    if (existingDrops[yearMonth]) {
      results.push({ user_id: member.id, status: "skipped", detail: "already has drop" });
      continue;
    }

    // Build context including prior months' ideas to avoid repetition
    const priorIdeas: string[] = [];
    for (const k of Object.keys(existingDrops).sort().reverse().slice(0, 3)) {
      priorIdeas.push(...(existingDrops[k]?.ideas ?? []));
    }

    const userMessage = [
      member.occupation ? `תחום עיסוק: ${member.occupation}` : "תחום עיסוק: לא נמסר.",
      `החודש: ${heMonth} ${now.getFullYear()}`,
      "",
      "האות:",
      `מקור הכאב: ${ext.signal.pain_source ?? ""}`,
      `האלמנט: ${ext.signal.element ?? ""}`,
      `האות: ${ext.signal.signal ?? ""}`,
      `מה שהאות מבטיח: ${ext.signal.signal_promise ?? ""}`,
      `הכלי המרכזי: ${ext.signal.central_tool ?? ""}`,
      `הקהל: ${ext.signal.people ?? ""}`,
      "",
      priorIdeas.length > 0
        ? `רעיונות שכבר ניתנו בחודשים קודמים (אל תחזור עליהם):\n${priorIdeas.slice(0, 30).map((s,i)=>`${i+1}. ${s}`).join("\n")}`
        : "אין רעיונות קודמים.",
      "",
      `החזר 10 רעיונות חדשים לחודש ${heMonth}, JSON על פי הסכמה.`,
    ].join("\n");

    try {
      const client = new Anthropic();
      const res = await client.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 2000,
        system:     SYSTEM,
        messages: [{ role: "user", content: userMessage }],
      });
      const block = res.content[0];
      if (!block || block.type !== "text") throw new Error("non-text");
      const clean = block.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed = JSON.parse(clean);
      const ideas = Array.isArray(parsed?.ideas) ? parsed.ideas.filter((s: unknown) => typeof s === "string" && s.trim().length > 0) : [];
      if (ideas.length < 5) throw new Error(`too few ideas: ${ideas.length}`);

      const updatedSignal = {
        ...ext.signal,
        monthly_drops: {
          ...existingDrops,
          [yearMonth]: { ideas: ideas.slice(0, 10), created_at: new Date().toISOString() },
        },
      };

      await safeFrom(supabase, "signal_extractions")
        .update({ signal: updatedSignal })
        .eq("id", ext.id);

      // Queue an announcement email
      if (member.email) {
        await supabase.from("jobs").insert({
          type:    "SEND_EMAIL",
          payload: {
            user_id:      member.id,
            email:        member.email,
            name:         member.name ?? "",
            subject:      `${heMonth}: 10 רעיונות חדשים מהאות שלך`,
            template_key: "hive_monthly_drop",
            extraction_id: ext.id,
            year_month:    yearMonth,
          },
          run_at: new Date().toISOString(),
          status: "pending",
        });
      }

      results.push({ user_id: member.id, status: "ok" });
    } catch (e) {
      await supabase.from("error_logs").insert({
        context: "api/cron/hive-monthly-drop",
        error:   String(e),
        payload: { user_id: member.id, extractionId: ext.id },
      });
      results.push({ user_id: member.id, status: "error", detail: String(e).slice(0, 200) });
    }
  }

  return NextResponse.json({
    yearMonth,
    members_total: list.length,
    results,
  });
}
