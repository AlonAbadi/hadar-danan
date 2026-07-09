// The two personalized artifacts the locked kaveret shows a fresh lead that
// the extraction itself does not produce:
//
//   public_sentence   — the audience-facing card text. The signal speaks TO
//                       the member in second person; a published card must
//                       speak FOR the member to their audience.
//   first_script_hook — the opening line of video #1, shown loaded inside the
//                       teleprompter demo. This is the proof that "your
//                       scripts already exist" is literally true.
//
// Generated once, right after extraction, and merged into the signal jsonb
// under `result_teasers` via the atomic merge RPC. Failure never blocks the
// funnel — the visitor page has honest fallbacks for missing teasers.
/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

const MODEL = "claude-sonnet-4-6";

export interface ResultTeasers {
  public_sentence: string;
  first_script_hook: string;
  generated_at: string;
}

// The signal_merge_field RPC stores values as JSON strings (its p_value is
// text); every reader must tolerate both shapes.
export function readResultTeasers(sig: any): Partial<ResultTeasers> {
  let t = sig?.result_teasers;
  if (typeof t === "string") {
    try {
      t = JSON.parse(t);
    } catch {
      return {};
    }
  }
  return t && typeof t === "object" ? t : {};
}

const SYSTEM = `אתה כותב בעברית עבור מותג TrueSignal — אבחון שמזהה את "האות" של בעל עסק: הדבר שהוא לבדו מביא.

תקבל את שדות האות של אדם (כתובים אליו בגוף שני). תפיק שני פריטים:

1. "public_sentence" — משפט אחד שפונה החוצה, אל הקהל של האדם הזה (לא אליו!). המבנה המועדף: "לאלה ש..." או פנייה ישירה לקהל. הוא יודפס על כרטיס משותף ברשתות. עד 20 מילים. בלי שם המקצוע, בלי קלישאות, בלי סופרלטיבים.

2. "first_script_hook" — משפט פתיחה אחד לסרטון הראשון שלו: הוק שנאמר מול מצלמה בגוף ראשון, בקול שלו, על הרגע/התובנה שבלב האות שלו. עד 22 מילים. מדובר, לא כתוב. בלי "היי", בלי הצגה עצמית.

כללים: בלי מקפים ארוכים (—), בלי אימוג'ים, בלי מרכאות מסביב לטקסט. התאם מגדר לפי השדות (אם כתוב "בנית לעצמך" זה זכר, "בנית לעצמך" עם סיומות נקבה זה נקבה).

החזר JSON בלבד: {"public_sentence": "...", "first_script_hook": "..."}`;

export async function generateResultTeasers(input: {
  signal: string;
  element?: string;
  signalPromise?: string;
  centralTool?: string;
  people?: string;
  contentDirections?: string[];
}): Promise<Omit<ResultTeasers, "generated_at"> | null> {
  try {
    const anthropic = new Anthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            `האות: ${input.signal}`,
            input.element ? `האלמנט: ${input.element}` : "",
            input.signalPromise ? `מה האות מבטיח: ${input.signalPromise}` : "",
            input.centralTool ? `הכלי המרכזי: ${input.centralTool}` : "",
            input.people ? `הקהל: ${input.people}` : "",
            input.contentDirections?.length
              ? `כיווני תוכן: ${input.contentDirections.join(" | ")}`
              : "",
            "",
            'החזר JSON בלבד: {"public_sentence": "...", "first_script_hook": "..."}',
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });
    const text = res.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const publicSentence = String(parsed.public_sentence ?? "").trim();
    const firstScriptHook = String(parsed.first_script_hook ?? "").trim();
    if (publicSentence.length < 10 || firstScriptHook.length < 10) return null;
    return { public_sentence: publicSentence, first_script_hook: firstScriptHook };
  } catch {
    return null;
  }
}

// Generate + persist for an extraction row. Safe to call fire-and-forget.
export async function generateAndStoreResultTeasers(extractionId: string): Promise<void> {
  try {
    const db = createServerClient() as any;
    const { data: ext } = await db
      .from("signal_extractions")
      .select("id, signal")
      .eq("id", extractionId)
      .maybeSingle();
    const sig = ext?.signal ?? {};
    if (!sig.signal || readResultTeasers(sig).public_sentence) return; // missing or already done

    const teasers = await generateResultTeasers({
      signal: String(sig.signal),
      element: sig.element ? String(sig.element) : undefined,
      signalPromise: sig.signal_promise ? String(sig.signal_promise) : undefined,
      centralTool: sig.central_tool ? String(sig.central_tool) : undefined,
      people: sig.people ? String(sig.people) : undefined,
      contentDirections: Array.isArray(sig.content_directions)
        ? sig.content_directions.map(String)
        : undefined,
    });
    if (!teasers) return;

    await db.rpc("signal_merge_field", {
      p_id: extractionId,
      p_field: "result_teasers",
      p_value: JSON.stringify({ ...teasers, generated_at: new Date().toISOString() }),
    });
  } catch (e) {
    try {
      const db = createServerClient() as any;
      await db.from("error_logs").insert({
        context: "signal/result-teasers",
        error: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
      });
    } catch {
      // never propagate
    }
  }
}
