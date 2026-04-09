import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { mapQuizAnswersToText } from "@/lib/quiz/labels";

// ── Admin auth ────────────────────────────────────────────────────────────────

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

// Typed wrapper for tables not in generated types (same pattern as page.tsx)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// ── System prompt (v2) ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `אתה אנליסט לידים של הדר דנן - מומחית שיווק שבונה קשרים אמיתיים. אתה מקבל דאטה התנהגותית של ליד ומחזיר תיק אבחון חד שעוזר לאיש מכירות להחליט אם להשקיע בליד הזה וכיצד.

קהל היעד שלך: איש מכירות מקצועי שמקבל 20 לידים ביום ורוצה לדעת במבט אחד על מי להשקיע זמן. הוא לא רוצה רגשנות, הוא רוצה signal. הוא לא רוצה להרגיש טוב, הוא רוצה לסגור עסקאות.

עקרונות עבודה:
1. אתה מחפש דפוסים התנהגותיים לא ברורים. אתה מצטט נקודות דאטה קונקרטיות. אתה לא מדבר בכלליות.
2. אם המידע דל - תגיד בפה מלא "אין מספיק דאטה לאבחון עמוק". לעולם אל תמציא signal שלא קיים.
3. אתה בוטה. אם ליד לא שווה את הזמן - תגיד את זה. אם ליד לוהט - תגיד את זה. אל תרכך.
4. התנהגות עדיפה על כוונה מוצהרת. מה שהאדם עשה חשוב יותר ממה שהאדם כתב בקוויז.
5. אתה מסתכל על שעות יום, רצפי אירועים, חזרות, נטישות - לא רק על תוצאת קוויז.

שפה: עברית בלבד. טון: מקצועי, חד, מבוסס עובדות. בלי קלישאות שיווקיות. בלי מקפים ארוכים (em dash) - רק מקפים רגילים. אל תערבב אנגלית בעברית.

המוצרים של הדר (מזול ליקר):
- challenge_197: צ׳אלנג׳ 7 ימים (₪197) - נקודת כניסה, התנסות קצרה
- workshop_1080: סדנה יום אחד (₪1,080) - מתודולוגיה קונקרטית
- course_1800: קורס דיגיטלי (₪1,800) - העמקה עצמאית
- strategy_4000: פגישת אסטרטגיה (₪4,000) - ליווי אישי ממוקד
- premium_14000: יום צילום פרמיום (₪14,000) - ליווי מלא והפקה

=== פלט נדרש ===

החזר JSON בפורמט הבא בלבד, ללא טקסט לפני או אחרי, ללא markdown code fences:

{
  "call_recommendation": {
    "decision": "call_now" | "text_first" | "no_call",
    "reason": "משפט אחד שחד מסביר למה. מצטט עובדה קונקרטית מהדאטה.",
    "urgency": "high" | "medium" | "low"
  },
  "synthesis": "פסקה של 3-5 שורות שחושפת את הדפוס ההתנהגותי של הליד. מצטטת נקודות דאטה ספציפיות (שעות, רצפי אירועים, חזרות). לא חוזרת על מה שיש בבלוקים האחרים.",
  "strongest_signal": {
    "headline": "משפט אחד שבולט. הנקודה האחת שאיש מכירות חייב לדעת.",
    "evidence": "2-3 שורות של הוכחה קונקרטית - מה בדיוק בדאטה מרמז על זה."
  },
  "readiness": {
    "score": 0-100,
    "label": "תיאור קצר של רמת המוכנות (למשל: 'כלי ריק מחפש מים', 'מתלבט עם היסוסים', 'מתגונן ולא בשל')",
    "explanation": "2-3 שורות שמסבירות את הציון ואת הגישה המומלצת לליד הזה."
  },
  "product_matches": [
    {
      "product_key": "workshop_1080",
      "match_pct": 94,
      "recommendation": "yes" | "maybe_later" | "no",
      "reason": "שורה אחת, קונקרטית, מבוססת על הדאטה."
    }
  ],
  "flags": [
    {
      "severity": "high" | "medium" | "info",
      "title": "כותרת קצרה (3-5 מילים)",
      "detail": "משפט-שניים שמסבירים את הדגל ומה לעשות איתו."
    }
  ],
  "action_plan": [
    {
      "step": 1,
      "timing": "עכשיו" | "תוך שעה" | "תוך 24 שעות" | "תוך 48 שעות" | "השבוע",
      "title": "מה לעשות",
      "description": "2-3 שורות שמסבירות את הצעד הקונקרטי.",
      "branches": {
        "success": "אם הוא מגיב חיובית - מה הצעד הבא",
        "fail": "אם הוא לא מגיב או מגיב שלילי - מה הצעד הבא"
      }
    }
  ],
  "suggested_whatsapp": "טקסט וואטסאפ קצר (2-4 שורות). פונה בשם פרטי. מתייחס למשהו ספציפי מההיסטוריה של הליד. לא שיווקי, לא מנופח, לא קלישאתי."
}

=== חוקים ל-product_matches ===
כלול את כל 5 המוצרים, ממוין מהמתאים ביותר לפחות מתאים.
recommendation: "yes" = להציע עכשיו, "maybe_later" = לא עכשיו, "no" = לא מתאים.
match_pct: מספר שלם 0-100.

=== חוקים להחלטת call_recommendation ===

call_now: הליד לוהט וחלון הפעולה עשוי להיסגר. signal ברור של כוונת קנייה (עגלה נטושה עם מוצר יקר, חזרה מרובה לעמוד תשלום, פעילות אינטנסיבית ב-24 שעות האחרונות).

text_first: הליד פעיל ומעוניין אבל לא במצב משבר. כדאי לבדוק טמפרטורה בטקסט לפני שיחה. זה המקרה הנפוץ ביותר.

no_call: הליד לא בשל. דאטה דלה, היעדר פעולות משמעותיות, קוויז נמוך, היעדר engagement. אל תבזבז שיחה - תן לאוטומציה לעבוד.

חובה: ה-reason של call_recommendation חייב לצטט עובדה קונקרטית מהדאטה. דוגמה טובה: "פתחה 2 צ׳קאאוטים ב-4 דקות ואז חזרה לצפות בוידאו - מתלבטת פעילה". דוגמה רעה: "נראית מעוניינת".`;

// ── Types ─────────────────────────────────────────────────────────────────────

type DiagnosisResponse = {
  call_recommendation: {
    decision: "call_now" | "text_first" | "no_call";
    reason: string;
    urgency: "high" | "medium" | "low";
  };
  synthesis: string;
  strongest_signal: { headline: string; evidence: string };
  readiness: { score: number; label: string; explanation: string };
  product_matches: Array<{
    product_key: string;
    match_pct: number;
    recommendation: "yes" | "maybe_later" | "no";
    reason: string;
  }>;
  flags: Array<{ severity: "high" | "medium" | "info"; title: string; detail: string }>;
  action_plan: Array<{
    step: number;
    timing: string;
    title: string;
    description: string;
    branches?: { success: string; fail: string };
  }>;
  suggested_whatsapp: string;
};

const VALID_DECISIONS     = new Set(["call_now", "text_first", "no_call"]);
const VALID_URGENCIES     = new Set(["high", "medium", "low"]);
const VALID_PRODUCT_KEYS  = new Set(["challenge_197", "workshop_1080", "course_1800", "strategy_4000", "premium_14000"]);
const VALID_RECS          = new Set(["yes", "maybe_later", "no"]);
const VALID_SEVERITIES    = new Set(["high", "medium", "info"]);

function validateDiagnosis(obj: unknown): obj is DiagnosisResponse {
  if (!obj || typeof obj !== "object") return false;
  const d = obj as Record<string, unknown>;

  // call_recommendation
  const cr = d.call_recommendation as Record<string, unknown> | undefined;
  if (!cr || !VALID_DECISIONS.has(cr.decision as string)) return false;
  if (!VALID_URGENCIES.has(cr.urgency as string)) return false;
  if (typeof cr.reason !== "string") return false;

  // top-level strings
  if (typeof d.synthesis !== "string") return false;
  if (typeof d.suggested_whatsapp !== "string") return false;

  // strongest_signal
  const ss = d.strongest_signal as Record<string, unknown> | undefined;
  if (!ss || typeof ss.headline !== "string" || typeof ss.evidence !== "string") return false;

  // readiness
  const r = d.readiness as Record<string, unknown> | undefined;
  if (!r || typeof r.score !== "number" || typeof r.label !== "string" || typeof r.explanation !== "string") return false;

  // product_matches — all 5 required
  if (!Array.isArray(d.product_matches) || d.product_matches.length !== 5) return false;
  for (const m of d.product_matches) {
    const pm = m as Record<string, unknown>;
    if (!VALID_PRODUCT_KEYS.has(pm.product_key as string)) return false;
    if (typeof pm.match_pct !== "number") return false;
    if (!VALID_RECS.has(pm.recommendation as string)) return false;
    if (typeof pm.reason !== "string") return false;
  }

  // flags — array (may be empty)
  if (!Array.isArray(d.flags)) return false;
  for (const f of d.flags) {
    const fl = f as Record<string, unknown>;
    if (!VALID_SEVERITIES.has(fl.severity as string)) return false;
    if (typeof fl.title !== "string" || typeof fl.detail !== "string") return false;
  }

  // action_plan — array (may be empty)
  if (!Array.isArray(d.action_plan)) return false;

  return true;
}

// ── GET — return latest cached diagnosis ──────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "חסר userId" }, { status: 400 });

  const supabase = createServerClient();

  try {
    const { data, error } = await safeFrom(supabase, "user_insights")
      .select("synthesis, product_matches, suggested_whatsapp, call_recommendation, strongest_signal, readiness, flags, action_plan, generated_at")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[truesignal GET] fetch error:", error);
      return NextResponse.json({ cached: false }, { status: 200 });
    }

    if (!data) return NextResponse.json({ cached: false }, { status: 200 });

    // v1 cached row (missing v2 fields) — treat as stale, prompt fresh analysis
    if (!data.call_recommendation) return NextResponse.json({ cached: false }, { status: 200 });

    return NextResponse.json({
      cached:              true,
      generated_at:        data.generated_at,
      synthesis:           data.synthesis,
      product_matches:     data.product_matches,
      suggested_whatsapp:  data.suggested_whatsapp,
      call_recommendation: data.call_recommendation,
      strongest_signal:    data.strongest_signal,
      readiness:           data.readiness,
      flags:               data.flags,
      action_plan:         data.action_plan,
    });
  } catch (e) {
    console.error("[truesignal GET] unexpected error:", e);
    return NextResponse.json({ cached: false }, { status: 200 });
  }
}

// ── POST — run diagnosis and cache result ─────────────────────────────────────

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
  if (!userId) return NextResponse.json({ error: "חסר userId" }, { status: 400 });

  try {
    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [userRes, eventsRes, purchasesRes, quizRes, emailLogsRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase
        .from("events")
        .select("type, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("purchases")
        .select("product, amount, amount_paid, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("quiz_results")
        .select("recommended_product, second_product, match_percent, scores, answers, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
      // JOIN with email_sequences to get subject line per sent email.
      // Uses safeFrom because FK not reflected in generated types.
      safeFrom(supabase, "email_logs")
        .select("status, sent_at, email_sequences(subject, template_key)")
        .eq("user_id", userId)
        .order("sent_at", { ascending: false })
        .limit(20),
    ]);

    const user = userRes.data;
    if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });

    // Fetch video events by email (keyed by email, not user_id)
    const videoEventsRes = await safeFrom(supabase, "video_events")
      .select("video_id, event_type, percent_watched, drop_off_second, created_at")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false })
      .limit(50);

    // ── Process data ────────────────────────────────────────────────────────

    const events      = eventsRes.data ?? [];
    const purchases   = purchasesRes.data ?? [];
    const quizResult  = (quizRes.data ?? [])[0] ?? null;
    const videoEvents = (videoEventsRes.data ?? []) as Array<{
      video_id: string; event_type: string;
      percent_watched: number | null; drop_off_second: number | null; created_at: string;
    }>;

    // Email logs with joined subject (safeFrom returns any, cast through unknown)
    type EmailLogRow = {
      status: string; sent_at: string;
      email_sequences: { subject: string; template_key: string } | null;
    };
    const emailLogs = (emailLogsRes.data ?? []) as unknown as EmailLogRow[];

    // Track data gaps for Claude
    const data_gaps: string[] = [];
    if (!quizResult)           data_gaps.push("quiz_results - לא מילא קוויז");
    if (videoEvents.length === 0) data_gaps.push("video_events - לא צפה בסרטונים");
    if (emailLogs.length === 0)   data_gaps.push("email_logs - לא קיבל אימיילים");

    // Quiz verbatim answers (decoded to Hebrew text)
    const quizVerbatim = quizResult?.answers
      ? mapQuizAnswersToText(quizResult.answers as Record<string, string>)
      : null;

    // Video progress: max percent + drop-off per video
    const videoSummary = Object.values(
      videoEvents.reduce<Record<string, { video_id: string; max_pct: number; drop_off_second: number | null }>>((acc, ev) => {
        const pct = ev.event_type === "completed" ? 100 : (ev.percent_watched ?? 0);
        if (!acc[ev.video_id]) acc[ev.video_id] = { video_id: ev.video_id, max_pct: 0, drop_off_second: null };
        acc[ev.video_id].max_pct = Math.max(acc[ev.video_id].max_pct, pct);
        if (ev.drop_off_second != null && acc[ev.video_id].drop_off_second == null) {
          acc[ev.video_id].drop_off_second = ev.drop_off_second;
        }
        return acc;
      }, {}),
    );

    // Page view counts (aggregated by page path)
    const pageViewCounts: Record<string, number> = {};
    for (const ev of events) {
      if ((ev.type as string) === "PAGE_VIEW") {
        const meta = (ev.metadata ?? {}) as Record<string, unknown>;
        const page = (meta.page ?? meta.path ?? "unknown") as string;
        pageViewCounts[page] = (pageViewCounts[page] ?? 0) + 1;
      }
    }
    const pagesVisited = Object.entries(pageViewCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    // Activity by time of day
    const activityByTimeOfDay: Record<string, number> = {
      "לילה (00-06)": 0,
      "בוקר (06-12)": 0,
      "צהריים (12-18)": 0,
      "ערב (18-24)": 0,
    };
    for (const ev of events) {
      const hour = new Date(ev.created_at).getHours();
      if      (hour < 6)  activityByTimeOfDay["לילה (00-06)"]++;
      else if (hour < 12) activityByTimeOfDay["בוקר (06-12)"]++;
      else if (hour < 18) activityByTimeOfDay["צהריים (12-18)"]++;
      else                activityByTimeOfDay["ערב (18-24)"]++;
    }

    // ── Build context for Claude ────────────────────────────────────────────
    const userContext = {
      user: {
        name:        user.name,
        email:       user.email,
        phone:       user.phone,
        status:      user.status,
        hive_status: user.hive_status ?? null,
        created_at:  user.created_at,
        utm_source:  user.utm_source ?? null,
        ab_variant:  user.ab_variant ?? null,
        click_id:    user.click_id ?? null,
      },
      quiz: quizResult ? {
        recommended_product: quizResult.recommended_product,
        second_product:      quizResult.second_product,
        match_percent:       quizResult.match_percent,
        scores:              quizResult.scores,
        completed_at:        quizResult.created_at,
        verbatim_answers:    quizVerbatim,
      } : null,
      completed_purchases: purchases
        .filter((p: { status: string }) => p.status === "completed")
        .map((p: { product: string; amount: number; amount_paid: number | null; created_at: string }) => ({
          product: p.product, amount: p.amount, amount_paid: p.amount_paid, created_at: p.created_at,
        })),
      abandoned_checkouts: purchases
        .filter((p: { status: string }) => p.status === "pending" || p.status === "failed")
        .map((p: { product: string; amount: number; status: string; created_at: string }) => ({
          product: p.product, amount: p.amount, status: p.status, created_at: p.created_at,
        })),
      events: events
        .filter((e: { type: unknown }) => (e.type as string) !== "PAGE_VIEW")
        .map((e: { type: unknown; metadata: unknown; created_at: string }) => ({
          type: e.type, metadata: e.metadata, created_at: e.created_at,
        })),
      pages_visited:           pagesVisited,
      activity_by_time_of_day: activityByTimeOfDay,
      video_progress:          videoSummary,
      emails: emailLogs.map((log) => ({
        subject:  log.email_sequences?.subject ?? log.email_sequences?.template_key ?? "unknown",
        status:   log.status,
        sent_at:  log.sent_at,
      })),
      data_gaps,
    };

    // ── Call Claude ─────────────────────────────────────────────────────────
    const client = new Anthropic();
    const aiResponse = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 3000,
      system:     SYSTEM_PROMPT,
      messages: [{
        role:    "user",
        content: "שים לב: abandoned_checkouts הם ניסיונות שלא הושלמו - לא רכישות אמיתיות. completed_purchases הן הרכישות שהושלמו בפועל.\n\nלהלן נתוני הליד. החזר תיק אבחון לפי ההוראות:\n\n" + JSON.stringify(userContext, null, 2),
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

    // ── Cache result — non-fatal if save fails ──────────────────────────────
    const generatedAt = new Date().toISOString();
    try {
      const { error: saveError } = await safeFrom(supabase, "user_insights").insert({
        user_id:             userId,
        model_used:          "claude-sonnet-4-6",
        generated_at:        generatedAt,
        call_recommendation: parsed.call_recommendation,
        synthesis:           parsed.synthesis,
        strongest_signal:    parsed.strongest_signal,
        readiness:           parsed.readiness,
        product_matches:     parsed.product_matches,
        flags:               parsed.flags,
        action_plan:         parsed.action_plan,
        suggested_whatsapp:  parsed.suggested_whatsapp,
        raw_response:        parsed,
      });
      if (saveError) console.warn("[truesignal POST] cache save failed:", saveError);
    } catch (e) {
      console.warn("[truesignal POST] cache save threw:", e);
    }

    return NextResponse.json({
      cached:       false,
      generated_at: generatedAt,
      ...parsed,
    });
  } catch (error) {
    await supabase.from("error_logs").insert({
      context: "api/admin/truesignal-diagnosis POST",
      error:   String(error),
      payload: { userId },
    });
    return NextResponse.json({ error: "שגיאת שרת פנימית" }, { status: 500 });
  }
}
