// The first-reel experience: a complete ~15-second script for video #1 of
// season 1, generated from the lead's signal and recorded by them in the
// browser (teleprompter-lite, no server pipeline). This is the free taste of
// כוורת האות - the raw selfie they make here vs. the polished member output
// (captions, cuts, the "מצולם לא מיוצר" stamp) IS the sales contrast.
//
// Generated once per extraction, merged into the signal jsonb under
// `first_reel` via the atomic merge RPC (same lifecycle as result_teasers).
/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { readResultTeasers } from "@/lib/signal/result-teasers";

// Same model family as result-teasers: this is the same micro-copy voice
// task, and the lead is waiting on it interactively - latency matters.
const MODEL = "claude-sonnet-4-6";

export interface FirstReel {
  title: string;    // e.g. "הרגע שבו הבנתי"
  script: string;   // 35-45 words, line breaks as spoken beats
  generated_at: string;
}

// signal_merge_field stores values as JSON strings; tolerate both shapes.
export function readFirstReel(sig: any): Partial<FirstReel> {
  let t = sig?.first_reel;
  if (typeof t === "string") {
    try { t = JSON.parse(t); } catch { return {}; }
  }
  return t && typeof t === "object" ? t : {};
}

const SYSTEM = `אתה כותב תסריט לסרטון רשת ראשון עבור בעל עסק, מתוך "האות" שלו: האבחון שמזהה מה הוא לבדו מביא.

תקבל את שדות האות (כתובים אליו בגוף שני) ולפעמים משפט פתיחה קיים. תפיק תסריט של 15 שניות בדיוק:

- 35 עד 45 מילים, לא יותר.
- גוף ראשון, מדובר מול מצלמה. שפה פשוטה שנשמעת כמו דיבור, לא כתיבה.
- אם קיבלת משפט פתיחה קיים, פתח בו בדיוק כפי שהוא.
- מבנה: פתיחה שעוצרת גלילה, אמת אחת מתוך האות, ומשפט סיום שמזמין להישאר (לא מכירתי).
- בלי "היי", בלי הצגה עצמית, בלי קריאה לפעולה מסחרית, בלי האשטגים.
- חלק את התסריט ל-3 עד 5 שורות קצרות (כל שורה = נשימה אחת מול מצלמה).
- התאם מגדר לניסוחי השדות שקיבלת.
- תן גם כותרת של 2-4 מילים לסרטון.

כללים: בלי מקפים ארוכים, בלי אימוג'ים, בלי מרכאות מסביב לטקסט.

החזר JSON בלבד: {"title": "...", "script": "שורה 1\\nשורה 2\\nשורה 3"}`;

const SYSTEM_EN = `You write the first short-form video script for a business owner, from their "signal" - the diagnostic that identifies what only they bring.

You receive their signal fields (written to them in second person) and sometimes an existing opening line. Produce a script of exactly 15 seconds:

- 35 to 45 words, no more.
- First person, spoken to camera. Plain spoken language, not written language.
- If you received an existing opening line, open with it exactly as it is.
- Structure: a scroll-stopping opening, one truth from the signal, and a closing line that invites people to stay (not salesy).
- No "hey", no self-introduction, no commercial call to action, no hashtags.
- Split the script into 3 to 5 short lines (each line = one breath on camera).
- Also give the video a 2-4 word title.

Rules: no em dashes (plain hyphen only), no emoji, no surrounding quotation marks.

Return JSON only: {"title": "...", "script": "line 1\\nline 2\\nline 3"}`;

async function generateFirstReel(sig: any): Promise<Omit<FirstReel, "generated_at"> | null> {
  try {
    const en = sig.language === "en";
    const hook = readResultTeasers(sig).first_script_hook;
    const L = en
      ? { signal: "The signal", element: "The element", tool: "The central tool", people: "The audience", directions: "Content directions", hook: "Existing opening line (use verbatim)" }
      : { signal: "האות", element: "האלמנט", tool: "הכלי המרכזי", people: "הקהל", directions: "כיווני תוכן", hook: "משפט פתיחה קיים (פתח בו כלשונו)" };
    const anthropic = new Anthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: en ? SYSTEM_EN : SYSTEM,
      messages: [{
        role: "user",
        content: [
          `${L.signal}: ${String(sig.signal)}`,
          sig.element ? `${L.element}: ${String(sig.element)}` : "",
          sig.central_tool ? `${L.tool}: ${String(sig.central_tool)}` : "",
          sig.people ? `${L.people}: ${String(sig.people)}` : "",
          Array.isArray(sig.content_directions) && sig.content_directions.length
            ? `${L.directions}: ${sig.content_directions.map(String).join(" | ")}`
            : "",
          hook ? `${L.hook}: ${hook}` : "",
        ].filter(Boolean).join("\n"),
      }],
    });
    const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const title = String(parsed.title ?? "").trim();
    const script = String(parsed.script ?? "").trim();
    const words = script.split(/\s+/).length;
    if (!title || words < 20 || words > 60) return null;
    return { title, script };
  } catch {
    return null;
  }
}

// Read-or-generate for an extraction. Returns null only when the extraction
// is missing or generation failed (caller shows an honest fallback).
export async function getOrCreateFirstReel(extractionId: string): Promise<FirstReel | null> {
  const db = createServerClient() as any;
  try {
    const { data: ext } = await db
      .from("signal_extractions")
      .select("id, signal")
      .eq("id", extractionId)
      .maybeSingle();
    const sig = ext?.signal;
    if (!sig?.signal) return null;

    const existing = readFirstReel(sig);
    if (existing.script && existing.title) return existing as FirstReel;

    const fresh = await generateFirstReel(sig);
    if (!fresh) return null;
    const full: FirstReel = { ...fresh, generated_at: new Date().toISOString() };
    await db.rpc("signal_merge_field", {
      p_id: extractionId,
      p_field: "first_reel",
      p_value: JSON.stringify(full),
    });
    return full;
  } catch (e) {
    try {
      await db.from("error_logs").insert({
        context: "signal/first-reel",
        error: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
      });
    } catch { /* never propagate */ }
    return null;
  }
}
