/**
 * Per-lead brief generator using Anthropic Haiku 4.5.
 *
 * Each call produces a short Hebrew opening line + 2 talking points based on
 * the lead's quiz answers and recent behavior. Falls back to a deterministic
 * template if Anthropic fails (rate-limit, timeout, etc.) so the email always
 * sends.
 *
 * Cost/perf: Haiku 4.5 + prompt caching on the system prompt → ~$0.001 per
 * lead × 10 leads/day × 22 workdays/month ≈ $0.22/month.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ScoredLead, LeadBrief } from "./types";

const SYSTEM_PROMPT = `אתה עוזר של הדר דנן, מומחית שיווק וקואצ'רית בכירה לעסקים. תפקידך לכתוב בריף קצר לקראת שיחת מכירה ולהחליט אם בכלל שווה להתקשר ללקוח היום.

ההדר מתקשרת ללידים שהראו עניין בפגישת אסטרטגיה (₪4,000), יום צילום פרמיום (₪14,000), או שותפות אסטרטגית (₪10-30 אלף לחודש).

קונטקסט חשוב:
- פגישת אסטרטגיה היא העדיפות העליונה. אחרי פגישה קל הרבה יותר לסגור פרמיום או שותפות. אנחנו מעדיפים לידים שמתאימים לפגישה.
- הזמן של הדר יקר. עדיף לוותר על שיחה מאשר לבזבז אותה על מישהו שלא בשל.

לכל ליד תקבל:
- תשובות הקוויז שלו (אם מילא)
- אירועים אחרונים באתר (כבר סוננו מ junk)
- סטטוס במערכת
- אם קיים, ניתוח TrueSignal© של ה-AI על הליד. זה הניתוח הסמכותי ביותר.

החזר את השדות הבאים באמצעות הכלי 'lead_brief':

1. go_no_go. החלטה: "go" אם שווה להתקשר, "no_go" אם לא. אמת מידה: האם סביר שהיא תיסגר על פגישה. סימני no_go: מילא קוויז מספר פעמים במהירות, אין מעורבות אמיתית, TrueSignal מצביע על סקרנות בלבד, לא נתן הסכמת שיווק וגם אין סיגנל חזק אחר. כשיש ספק, no_go.

2. no_go_reason. אם no_go, סיבה אחת קצרה בעברית. אחרת, השאר ריק.

3. opening. רק אם go. שורת פתיחה קצרה (משפט אחד עד שניים) שהדר תפתח איתו. ספציפית, מתייחסת למשהו ספציפי שהליד עשה. לא גנרי.

4. talking_points. רק אם go. שתי נקודות שיחה קצרות (עד 12 מילים כל אחת) שיחברו לכאב הספציפי של הליד.

5. risk (אופציונלי). דגל אחד אם יש סיכון מסוים בשיחה (חוסר הסכמת שיווק, סיגנלים מעורבים).

עקרונות:
- אל תמציא עובדות. רק על בסיס המידע שיש.
- אל תשתמש במקפים גדולים (—) בקופי בעברית. תמיד נקודה או פסיק.
- שפה: לשון פנייה ישירה ("ראיתי ש...", "אמרת ש..."). לא "המשתמש".
- טון: חם, אישי, מקצועי. לא מכירתי בכוח.
- כשיש קונפליקט בין המספרים לבין TrueSignal, סמוך על TrueSignal.`;

const TOOL = {
  name: "lead_brief",
  description: "Output the call brief + go/no-go decision in structured form",
  input_schema: {
    type: "object" as const,
    properties: {
      go_no_go: {
        type: "string",
        enum: ["go", "no_go"],
        description: "Whether the lead is worth calling today. When in doubt → no_go.",
      },
      no_go_reason: {
        type: "string",
        maxLength: 120,
        description: "Short Hebrew sentence on why no_go. Required when go_no_go='no_go', empty otherwise.",
      },
      opening: {
        type: "string",
        description: "Hebrew opening line, 1 to 2 sentences. Personal, specific.",
        maxLength: 220,
      },
      talking_points: {
        type: "array",
        items: { type: "string", maxLength: 80 },
        minItems: 2,
        maxItems: 2,
        description: "Two short Hebrew bullets, each up to 12 words.",
      },
      risk: {
        type: "string",
        maxLength: 80,
        description: "Optional: one risk flag in Hebrew. Omit if no concern.",
      },
    },
    required: ["go_no_go", "opening", "talking_points"],
  },
};

function buildUserPrompt(lead: ScoredLead): string {
  const lines: string[] = [];
  lines.push(`שם: ${lead.name ?? "(ללא שם)"}`);
  lines.push(`סטטוס: ${lead.status}`);
  if (lead.utmCampaign)         lines.push(`קמפיין מקור: ${lead.utmCampaign}`);
  if (!lead.marketingConsent)   lines.push(`הסכמה שיווקית: ❌`);

  // TrueSignal AI synthesis — show it FIRST since it's authoritative.
  if (lead.insight?.synthesis) {
    lines.push(`\n=== ניתוח TrueSignal© (${new Date(lead.insight.generated_at).toLocaleDateString("he-IL")}) ===`);
    lines.push(lead.insight.synthesis);
    lines.push(`=== סוף ניתוח TrueSignal© ===`);
  }

  if (lead.latestQuiz) {
    lines.push(`\nתוצאות קוויז (${new Date(lead.latestQuiz.created_at).toLocaleDateString("he-IL")}):`);
    lines.push(`- מוצר מומלץ: ${lead.latestQuiz.recommended_product}`);
    if (lead.latestQuiz.match_percent) lines.push(`- אחוז התאמה: ${Math.round(lead.latestQuiz.match_percent)}%`);
    if (lead.latestQuiz.answers) {
      lines.push(`- תשובות גולמיות: ${JSON.stringify(lead.latestQuiz.answers)}`);
    }
  } else {
    lines.push(`\n(לא מילא קוויז)`);
  }

  if (lead.multipleQuizSubmissions) {
    lines.push(`⚠ הליד מילא את הקוויז מספר פעמים בזמן קצר — סימן לאי-רצינות.`);
  }

  if (lead.pendingHighTicketCheckout) {
    lines.push(`\n⚠ התחיל תשלום ולא סיים:`);
    lines.push(`- מוצר: ${lead.pendingHighTicketCheckout.product}`);
    lines.push(`- סכום: ₪${lead.pendingHighTicketCheckout.amount}`);
    lines.push(`- מתי: ${new Date(lead.pendingHighTicketCheckout.created_at).toLocaleString("he-IL")}`);
  }

  lines.push(`\nאירועים אחרונים (עד 15 אחרונים, אחרי סינון רעש):`);
  for (const e of lead.recentEvents.slice(0, 15)) {
    const when = new Date(e.created_at).toLocaleString("he-IL");
    const meta = Object.keys(e.metadata ?? {}).length > 0 ? ` · ${JSON.stringify(e.metadata).slice(0, 120)}` : "";
    lines.push(`- ${when} · ${e.type}${meta}`);
  }
  if (lead.junkEventCount > 0) {
    lines.push(`(הוסרו ${lead.junkEventCount} אירועי רעש: קליקים על קבצי פונט/CSS וכדומה.)`);
  }

  lines.push(`\nסיבות שהליד ברשימה היום (לפי scoring):`);
  lead.reasons.forEach(r => lines.push(`- ${r}`));

  return lines.join("\n");
}

function deterministicFallback(lead: ScoredLead): LeadBrief {
  const firstName = lead.name?.split(" ")[0] ?? "";
  const greet = firstName ? `שלום ${firstName},` : "שלום,";

  let opening = `${greet} ראיתי שהיית פעיל/ה אצלנו לאחרונה ורציתי לדבר איתך כמה דקות.`;
  const talkingPoints: string[] = [];

  if (lead.pendingHighTicketCheckout) {
    opening = `${greet} ראיתי שהתחלת תהליך הזמנה ולא סיימת. רוצה לשמוע אם משהו עצר אותך.`;
    talkingPoints.push("מה היה הקושי שמנע השלמה?");
    talkingPoints.push("מה חשוב שהפגישה תיתן לך?");
  } else if (lead.latestQuiz) {
    const matchTxt = lead.latestQuiz.match_percent
      ? ` (התאמה של ${Math.round(lead.latestQuiz.match_percent)}%)`
      : "";
    opening = `${greet} ראיתי שמילאת את הקוויז וקיבלת המלצה ספציפית${matchTxt}. רציתי לבדוק איתך אם זה באמת מה שמתאים.`;
    talkingPoints.push("מה הוביל אותך למלא את הקוויז?");
    talkingPoints.push("מה הכי חסר לך בשיווק שלך עכשיו?");
  } else if (lead.isAwakened) {
    opening = `${greet} שמתי לב שחזרת לאתר אחרי תקופה. רוצה לשמוע אם השתנה משהו אצלך.`;
    talkingPoints.push("מה הביא אותך לחזור עכשיו?");
    talkingPoints.push("מה האתגר הכי גדול שעומד מולך?");
  } else {
    talkingPoints.push("מה הסיבה המרכזית שאת/ה כאן?");
    talkingPoints.push("איך אני יכולה לעזור בצורה הכי ממוקדת?");
  }

  // Deterministic go/no-go: when the AI call failed, fall back to the
  // strongest local signals. Multiple-quiz-spam is auto no-go.
  const goNoGo: "go" | "no_go" = lead.multipleQuizSubmissions ? "no_go" : "go";
  const noGoReason = goNoGo === "no_go" ? "מילא את הקוויז כמה פעמים במהירות, ככל הנראה לא בשל לשיחה." : undefined;

  const risk = !lead.marketingConsent ? "אין הסכמת שיווק. תפתחי בעדינות" : undefined;
  return { opening, talkingPoints, risk, goNoGo, noGoReason };
}

export async function generateBrief(lead: ScoredLead): Promise<LeadBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministicFallback(lead);

  const client = new Anthropic({ apiKey });

  // 3-attempt retry with exponential backoff on 429/529; other errors fall back.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: [
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ],
        tools:       [TOOL],
        tool_choice: { type: "tool" as const, name: "lead_brief" },
        messages: [{ role: "user", content: buildUserPrompt(lead) }],
      });

      const toolBlock = res.content.find(b => b.type === "tool_use");
      if (!toolBlock || toolBlock.type !== "tool_use") {
        return deterministicFallback(lead);
      }
      const out = toolBlock.input as {
        opening?:        string;
        talking_points?: string[];
        risk?:           string;
        go_no_go?:       string;
        no_go_reason?:   string;
      };
      if (!out.opening || !Array.isArray(out.talking_points) || out.talking_points.length < 2) {
        return deterministicFallback(lead);
      }
      const goNoGo: "go" | "no_go" = out.go_no_go === "no_go" ? "no_go" : "go";
      return {
        opening:       out.opening,
        talkingPoints: out.talking_points.slice(0, 2),
        risk:          out.risk,
        goNoGo,
        noGoReason:    goNoGo === "no_go" ? (out.no_go_reason || undefined) : undefined,
      };
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status !== 429 && status !== 529) return deterministicFallback(lead);
      if (attempt === 2) return deterministicFallback(lead);
      await new Promise(r => setTimeout(r, 800 * Math.pow(2, attempt)));
    }
  }

  return deterministicFallback(lead);
}

export { deterministicFallback };
