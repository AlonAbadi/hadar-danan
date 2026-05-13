import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerClient();
  const { data } = await safeFrom(supabase, "quiz_insights")
    .select("analysis, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return NextResponse.json({ saved: null });
  return NextResponse.json({ saved: data });
}

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

const QUESTIONS: { id: string; title: string; options: Record<string, string> }[] = [
  {
    id: "q1",
    title: "איפה העסק שלך עכשיו?",
    options: {
      A: "רק מתחיל - עדיין בונה את הבסיס",
      B: "יש לי עסק פעיל - רוצה יותר לקוחות",
      C: "יש לי עסק מבוסס - רוצה לצמוח בגדול",
      D: "חברה / מותג - מחפשים שותף אסטרטגי",
    },
  },
  {
    id: "q2",
    title: "מה הכי עוצר אותך בשיווק?",
    options: {
      A: "לא יודע מה לומר מול המצלמה",
      B: "מייצר תוכן אבל לא רואה תוצאות",
      C: "אין לי זמן לעשות הכל לבד",
      D: "השיווק לא משקף את האיכות האמיתית שלי",
    },
  },
  {
    id: "q3",
    title: "מה הקשר שלך לתוכן כרגע?",
    options: {
      A: "לא מייצר תוכן בכלל",
      B: "מנסה לפה ולשם, לא עקבי",
      C: "מייצר תוכן אבל לא מרוצה מהאיכות",
      D: "רוצה ליצור תוכן ברמה מקצועית גבוהה",
    },
  },
  {
    id: "q4",
    title: "איך אתה לומד הכי טוב?",
    options: {
      A: "סרטון קצר + מיידי לפעולה",
      B: "קורס מובנה שאוכל לעבור בקצב שלי",
      C: "ליווי אישי עם פידבק אמיתי",
      D: "מישהו שפשוט עושה את זה בשבילי",
    },
  },
  {
    id: "q5",
    title: "מה רמת הדחיפות שלך?",
    options: {
      A: "רוצה להבין לפני שאני מחליט",
      B: "מוכן להתחיל בקרוב - שבוע-שבועיים",
      C: "דחוף - רוצה תוצאות עכשיו",
      D: "יש לי פרויקט ספציפי שצריך פתרון מהיר",
    },
  },
  {
    id: "q6",
    title: "מה ההשקעה שנוחה לך?",
    options: {
      A: 'מעדיף להתחיל חינם ולראות',
      B: 'עד 2,000 ש"ח - השקעה נוחה',
      C: '2,000-15,000 ש"ח - מוכן להשקיע ברצינות',
      D: 'מעל 15,000 ש"ח - תוצאות חשובות יותר מעלות',
    },
  },
];

const PRODUCT_LABELS: Record<string, string> = {
  free_training: "הדרכה חינמית",
  challenge:     "אתגר 7 ימים (₪197)",
  workshop:      "סדנה יום אחד (₪1,080)",
  course:        "קורס דיגיטלי (₪1,800)",
  strategy:      "פגישת אסטרטגיה (₪4,000)",
  premium:       "יום צילום פרמיום (₪14,000)",
  partnership:   "שותפות אסטרטגית",
};

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  try {

  const { data: results, error } = await supabase
    .from("quiz_results")
    .select("answers, recommended_product, second_product, match_percent, created_at")
    .order("created_at", { ascending: false });

  if (error || !results?.length) {
    return NextResponse.json({ error: "אין תוצאות קוויז במסד הנתונים" }, { status: 404 });
  }

  const total = results.length;
  const oldest = results[results.length - 1].created_at as string;
  const newest = results[0].created_at as string;

  // Per-question answer distribution
  const questionDist: Record<string, Record<string, number>> = {};
  for (const q of QUESTIONS) questionDist[q.id] = { A: 0, B: 0, C: 0, D: 0 };

  const productDist: Record<string, number> = {};
  const secondProductDist: Record<string, number> = {};
  let totalMatchPct = 0;

  for (const r of results) {
    const answers = (r.answers ?? {}) as Record<string, string>;
    for (const [q, a] of Object.entries(answers)) {
      if (questionDist[q] && ["A", "B", "C", "D"].includes(a)) {
        questionDist[q][a]++;
      }
    }
    const prod = r.recommended_product as string;
    if (prod) productDist[prod] = (productDist[prod] ?? 0) + 1;
    const second = r.second_product as string;
    if (second) secondProductDist[second] = (secondProductDist[second] ?? 0) + 1;
    totalMatchPct += (r.match_percent as number) ?? 0;
  }

  const avgMatchPct = Math.round(totalMatchPct / total);

  // Build structured summary for Claude
  const questionSummaries = QUESTIONS.map((q) => {
    const dist = questionDist[q.id];
    const sorted = (["A", "B", "C", "D"] as const)
      .map((opt) => ({
        opt,
        text: q.options[opt],
        count: dist[opt],
        pct: Math.round((dist[opt] / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
    return { question: q.title, distribution: sorted };
  });

  const productSummary = Object.entries(productDist)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ product: PRODUCT_LABELS[k] ?? k, count: v, pct: Math.round((v / total) * 100) }));

  const fromDate = new Date(oldest).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const toDate   = new Date(newest).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  const dataBlock = JSON.stringify({ total, period: `${fromDate} – ${toDate}`, avgMatchPct, questionSummaries, productSummary }, null, 2);

  const systemPrompt = `אתה מנהל שיווק ואנליסט עסקי בכיר. אתה מקבל נתוני קוויז צרכני מהאתר של הדר דנן - מומחית שיווק דיגיטלי שמתמחה בהגדרה עצמית ותוכן וידאו.

הקוויז מיועד לעזור לבעלי עסקים להבין איזה מוצר של הדר מתאים להם.

מוצרי הדר (מסלול הלמידה):
- הדרכה חינמית - נקודת כניסה
- אתגר 7 ימים (₪197) - התנסות ראשונה
- סדנה יום אחד (₪1,080) - מתודולוגיה קונקרטית
- קורס דיגיטלי (₪1,800) - העמקה עצמאית
- פגישת אסטרטגיה (₪4,000) - ליווי אישי
- יום צילום פרמיום (₪14,000) - הפקה מלאה

תפקידך: לנתח את נתוני הקוויז ולהפיק תובנות אמיתיות ומעשיות על הקהל שמגיע ועל הזדמנויות עסקיות.

כתוב בעברית. היה חד, ישיר, ענייני. אל תנפח. אל תחזור על הנתונים - פרש אותם.`;

  const userPrompt = `נתח את נתוני הקוויז הבאים וספק ניתוח עסקי מעמיק:

${dataBlock}

על בסיס הנתונים:
1. זהה מי הקהל ומה מאפיין אותו
2. מצא את שלושת הכאבים המרכזיים שעולים מהתשובות
3. הערך האם ההמלצות תואמות לרצון ההשקעה שהביעו
4. הצע שלוש הזדמנויות עסקיות קונקרטיות
5. זהה את הפחד או החסם המרכזי שצריך לדבר עליו בתוכן השיווקי — זו הזווית שתגרום לאנשים לעצור ולקרוא
6. ציין אזהרה אחת ספציפית שעולה מהנתונים שדורשת תשומת לב`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [{
      name: "quiz_analysis",
      description: "מחזיר ניתוח מובנה של תוצאות הקוויז",
      input_schema: {
        type: "object" as const,
        properties: {
          headline:         { type: "string", description: "משפט אחד (עד 20 מילה) שמסכם את הממצא המרכזי" },
          audience_profile: { type: "string", description: "2-3 משפטים קצרים: מי הם, מה שלב העסק שלהם" },
          top_pains:        { type: "array", items: { type: "string", maxLength: 80 }, description: "3 כאבים — כל אחד עד 15 מילה" },
          product_fit:      { type: "string", description: "2-3 משפטים: התאמה בין המלצות לרצון ההשקעה" },
          opportunities:    { type: "array", items: { type: "string", maxLength: 80 }, description: "3 הזדמנויות — כל אחת עד 15 מילה" },
          content_angle:    { type: "string", description: "משפט אחד: הפחד/חסם המרכזי לתוכן שיווקי" },
          watch_out:        { type: "string", description: "משפט אחד: אזהרה ספציפית מהנתונים" },
        },
        required: ["headline","audience_profile","top_pains","product_fit","opportunities","content_angle","watch_out"],
      },
    }],
    tool_choice: { type: "tool" as const, name: "quiz_analysis" },
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const toolBlock = message.content.find(b => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    return NextResponse.json({ error: "Claude לא החזיר תוצאה מובנית" }, { status: 500 });
  }
  const analysis = toolBlock.input as Record<string, unknown>;

  // Debug: log the raw tool input so we can inspect it in /admin/system
  await supabase.from("error_logs").insert({
    context: "api/admin/quiz-analysis/debug",
    error:   "tool_use input dump",
    payload: { keys: Object.keys(analysis), content_angle: analysis.content_angle, watch_out: analysis.watch_out },
  });

  const payload = {
    analysis,
    meta: { total, period: `${fromDate} – ${toDate}`, avgMatchPct, productSummary },
  };

  // Persist — keep only the latest row (delete old, insert new)
  await safeFrom(supabase, "quiz_insights").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await safeFrom(supabase, "quiz_insights").insert({ analysis, meta: payload.meta });

  return NextResponse.json({ ...payload, _debug: { content_angle: analysis.content_angle, watch_out: analysis.watch_out, keys: Object.keys(analysis) } });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("error_logs").insert({
      context: "api/admin/quiz-analysis",
      error:   "Unhandled error in POST",
      payload: { message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
