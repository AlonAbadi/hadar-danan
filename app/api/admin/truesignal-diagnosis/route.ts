import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

// ── Admin auth (same pattern as all other admin API routes) ──────────────────

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `אתה האנליסט של הדר דנן - מומחית שיווק שבונה קשרים אמיתיים ולא רודפת אחרי לידים. אתה מקבל נתונים גולמיים על ליד ומחזיר תיק אבחון שיעזור להדר להחליט מה לעשות איתו.

עקרונות TrueSignal:
- אתה מחפש signal אמיתי, לא noise. התנהגות עדיפה על כוונה מוצהרת.
- אתה לא ממליץ על המוצר היקר ביותר - אתה ממליץ על המתאים ביותר לשלב של הליד.
- אם אדם לא בשל למוצר - תגיד את זה בפה מלא. עדיף לא למכור מאשר למכור את הדבר הלא נכון.
- אל תמציא נתונים. אם חסר מידע - תגיד את זה בפירוש.

שפה: עברית בלבד. טון: מקצועי, חד, אמפתי, לא שיווקי, לא מנופח. בלי מקפים ארוכים (em dash) - רק מקפים רגילים.

המוצרים של הדר (ממוין מזול ליקר):
- challenge_197: צ׳אלנג׳ 7 הימים (₪197) - נקודת כניסה, התנסות קצרה
- workshop_1080: סדנה יום אחד (₪1,080) - מתודולוגיה קונקרטית
- course_1800: קורס דיגיטלי (₪1,800) - העמקה עצמאית
- strategy_4000: פגישת אסטרטגיה (₪4,000) - ליווי אישי ממוקד
- premium_14000: יום צילום פרמיום (₪14,000) - ליווי מלא והפקה

אתה חייב להחזיר JSON בפורמט הבא בלבד, ללא טקסט נוסף לפני או אחרי, ללא markdown code fences, ללא הסברים:

{
  "synthesis": "פסקה של 3-4 שורות שמחברת את כל הנקודות לתמונה אחת של מי היא, מאיפה הגיעה, ומה באמת מניע אותה. בלי קלישאות.",
  "product_matches": [
    {
      "product_key": "workshop_1080",
      "match_pct": 94,
      "recommendation": "yes",
      "reason": "שורה אחת שמסבירה למה זה מתאים לה עכשיו"
    }
  ],
  "suggested_whatsapp": "טקסט וואטסאפ קצר (2-4 שורות) שהדר תוכל להעתיק ולשלוח כמו שהוא. פונה בשם פרטי, מתייחס למשהו ספציפי מההיסטוריה שלה."
}

חוקים ל-product_matches:
- כלול את כל 5 המוצרים, ממוין ממתאים ביותר לפחות מתאים.
- recommendation הוא אחד מ: "yes" (להציע עכשיו), "maybe_later" (לא עכשיו אבל בהמשך), "no" (לא מתאים לה).
- match_pct הוא מספר שלם בין 0 ל-100.
- reason חייב להיות שורה אחת בלבד, קונקרטי, מבוסס על הנתונים שהתקבלו.`;

// ── Types ────────────────────────────────────────────────────────────────────

type DiagnosisResponse = {
  synthesis: string;
  product_matches: Array<{
    product_key: "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000";
    match_pct: number;
    recommendation: "yes" | "maybe_later" | "no";
    reason: string;
  }>;
  suggested_whatsapp: string;
};

const VALID_PRODUCT_KEYS = new Set([
  "challenge_197", "workshop_1080", "course_1800", "strategy_4000", "premium_14000",
]);
const VALID_RECOMMENDATIONS = new Set(["yes", "maybe_later", "no"]);

function validateDiagnosis(obj: unknown): obj is DiagnosisResponse {
  if (!obj || typeof obj !== "object") return false;
  const d = obj as Record<string, unknown>;
  if (typeof d.synthesis !== "string") return false;
  if (typeof d.suggested_whatsapp !== "string") return false;
  if (!Array.isArray(d.product_matches)) return false;
  if (d.product_matches.length !== 5) return false;
  for (const m of d.product_matches) {
    if (!m || typeof m !== "object") return false;
    const pm = m as Record<string, unknown>;
    if (!VALID_PRODUCT_KEYS.has(pm.product_key as string)) return false;
    if (typeof pm.match_pct !== "number") return false;
    if (!VALID_RECOMMENDATIONS.has(pm.recommendation as string)) return false;
    if (typeof pm.reason !== "string") return false;
  }
  return true;
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const supabase = createServerClient();
  let body: { userId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: "חסר userId" }, { status: 400 });
  }

  // ── Gather user data ───────────────────────────────────────────────────────

  try {
    const [userRes, eventsRes, purchasesRes, quizRes, emailLogsRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase
        .from("events")
        .select("type, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("purchases")
        .select("product, amount, amount_paid, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("quiz_results")
        .select("recommended_product, second_product, match_percent, scores, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("email_logs")
        .select("subject, opened_at, clicked_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const user = userRes.data;
    if (!user) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }

    // Fetch video events by email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoEventsRes = await (supabase as any)
      .from("video_events")
      .select("video_id, event_type, percent_watched, created_at")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false })
      .limit(50);

    const data_gaps: string[] = [];

    const quizResult = (quizRes.data ?? [])[0] ?? null;
    if (!quizResult) data_gaps.push("quiz_results - אין נתוני קוויז");

    const videoEvents = videoEventsRes.data ?? [];
    if (videoEvents.length === 0) data_gaps.push("video_events - אין נתוני צפייה בסרטונים");

    const emailLogs = emailLogsRes.data ?? [];
    if (emailLogs.length === 0) data_gaps.push("email_logs - אין נתוני פתיחת אימיילים");

    // Summarize video progress per video
    type VideoEventRow = { video_id: string; event_type: string; percent_watched: number | null };
    const videoSummary = Object.entries(
      (videoEvents as VideoEventRow[]).reduce((acc: Record<string, number>, ev) => {
        const pct = ev.event_type === "completed" ? 100 : (ev.percent_watched ?? 0);
        acc[ev.video_id] = Math.max(acc[ev.video_id] ?? 0, pct);
        return acc;
      }, {} as Record<string, number>),
    ).map(([video_id, max_percent]) => ({ video_id, max_percent }));

    // Build context object
    const userContext = {
      user: {
        name:         user.name,
        email:        user.email,
        phone:        user.phone,
        status:       user.status,
        hive_status:  user.hive_status ?? null,
        created_at:   user.created_at,
        utm_source:   user.utm_source ?? null,
        ab_variant:   user.ab_variant ?? null,
        click_id:     user.click_id ?? null,
      },
      quiz: quizResult
        ? {
            recommended_product: quizResult.recommended_product,
            second_product:      quizResult.second_product,
            match_percent:       quizResult.match_percent,
            scores:              quizResult.scores,
            completed_at:        quizResult.created_at,
          }
        : null,
      completed_purchases: (purchasesRes.data ?? [])
        .filter((p: { status: string }) => p.status === "completed")
        .map((p: { product: string; amount: number; amount_paid: number | null; status: string; created_at: string }) => ({
          product:     p.product,
          amount:      p.amount,
          amount_paid: p.amount_paid,
          created_at:  p.created_at,
        })),
      abandoned_checkouts: (purchasesRes.data ?? [])
        .filter((p: { status: string }) => p.status === "pending" || p.status === "failed")
        .map((p: { product: string; amount: number; status: string; created_at: string }) => ({
          product:    p.product,
          amount:     p.amount,
          status:     p.status,
          created_at: p.created_at,
        })),
      events: (eventsRes.data ?? []).map((e: { type: unknown; metadata: unknown; created_at: string }) => ({
        type:       e.type,
        metadata:   e.metadata,
        created_at: e.created_at,
      })),
      video_progress: videoSummary,
      email_engagement: emailLogs.map((e: { subject: string | null; opened_at: string | null; clicked_at: string | null; created_at: string }) => ({
        subject:    e.subject,
        opened:     !!e.opened_at,
        clicked:    !!e.clicked_at,
        sent_at:    e.created_at,
      })),
      data_gaps,
    };

    // ── Call Claude ──────────────────────────────────────────────────────────

    const client = new Anthropic();
    const aiResponse = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1500,
      system:     SYSTEM_PROMPT,
      messages: [{
        role:    "user",
        content: "שים לב: abandoned_checkouts הם לא רכישות אמיתיות - אלה ניסיונות שלא הושלמו. אל תתייחס אליהם כאל לקוחות משלמים. completed_purchases הן הרכישות שהושלמו בפועל.\n\nלהלן נתוני הליד. החזר תיק אבחון לפי ההוראות:\n\n" + JSON.stringify(userContext, null, 2),
      }],
    });

    const firstBlock = aiResponse.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      return NextResponse.json({ error: "תגובה לא תקינה מהמודל" }, { status: 500 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(firstBlock.text);
    } catch {
      return NextResponse.json(
        { error: "שגיאת פענוח JSON מהמודל", raw: firstBlock.text },
        { status: 500 },
      );
    }

    if (!validateDiagnosis(parsed)) {
      return NextResponse.json(
        { error: "המודל החזיר מבנה לא תקין", raw: parsed },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    await supabase.from("error_logs").insert({
      context: "api/admin/truesignal-diagnosis POST",
      error:   String(error),
      payload: { userId },
    });
    return NextResponse.json({ error: "שגיאת שרת פנימית" }, { status: 500 });
  }
}
