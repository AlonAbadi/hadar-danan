import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { application_id, name, niche, target_audience, tone_keywords, products, testimonials } = body;

  if (!application_id || !name || !niche) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const productsText = Array.isArray(products)
    ? products.map((p: { name: string; price: number }) => `- ${p.name}: ₪${p.price}`).join("\n")
    : "";

  const testimonialsText = Array.isArray(testimonials)
    ? testimonials.map((t: { name: string; quote: string }) => `- ${t.name}: "${t.quote}"`).join("\n")
    : "";

  const prompt = `אתה כותב שיווקי מומחה בעברית. אתה עוזר לחברת beegood לבנות אתרי מכירה למשפיעניות וועוצים.

פרטי הלקוחה:
- שם: ${name}
- תחום: ${niche}
- קהל יעד: ${target_audience || "לא צוין"}
- טון וסגנון: ${tone_keywords || "מקצועי ואנושי"}
- מוצרים:
${productsText || "- לא צוינו"}
- עדויות לקוחות:
${testimonialsText || "- לא צוינו"}

צור את הפלט הבא בפורמט JSON בלבד (ללא markdown, ללא הסברים, רק JSON):

{
  "hero": {
    "headline": "כותרת ראשית קצרה ומחזקת (עד 8 מילים)",
    "sub": "תת-כותרת שמרחיבה ומסבירה את הערך (2-3 משפטים)"
  },
  "about": {
    "title": "כותרת לעמוד about",
    "body": "פסקה אחת של 3-4 משפטים על הלקוחה"
  },
  "free_training": {
    "title": "שם ההדרכה החינמית",
    "description": "משפט תיאור אחד"
  },
  "emails": {
    "welcome": {
      "subject": "שורת נושא למייל ברוכים הבאים",
      "preview": "3 משפטים ראשונים של המייל"
    },
    "followup_24h": {
      "subject": "שורת נושא לפולו-אפ אחרי 24 שעות",
      "preview": "3 משפטים ראשונים של המייל"
    },
    "cart_abandon": {
      "subject": "שורת נושא לעגלה נטושה",
      "preview": "3 משפטים ראשונים של המייל"
    }
  },
  "quiz_questions": [
    {"question": "שאלת quiz ראשונה", "options": ["תשובה א", "תשובה ב", "תשובה ג"]},
    {"question": "שאלת quiz שנייה", "options": ["תשובה א", "תשובה ב", "תשובה ג"]},
    {"question": "שאלת quiz שלישית", "options": ["תשובה א", "תשובה ב", "תשובה ג"]}
  ],
  "social_proof": {
    "stat1": {"number": "מספר עם +", "label": "תווית קצרה"},
    "stat2": {"number": "מספר עם +", "label": "תווית קצרה"},
    "stat3": {"number": "אחוז עם %", "label": "תווית קצרה"}
  },
  "palettes": [
    {
      "id": "warm",
      "name": "חמים ואנושי",
      "bg": "#FFF6F0",
      "accent": "#E07A5F",
      "text": "#3E2F2B",
      "muted": "#B09888",
      "rationale": "הסבר קצר למה הפלטה הזו מתאימה לקהל הספציפי הזה"
    },
    {
      "id": "dark",
      "name": "כהה ומרשים",
      "bg": "#0D1018",
      "accent": "#C9964A",
      "text": "#EDE9E1",
      "muted": "#9E9990",
      "rationale": "הסבר קצר למה הפלטה הזו מתאימה לקהל הספציפי הזה"
    },
    {
      "id": "fresh",
      "name": "רענן ומודרני",
      "bg": "#F5FAF7",
      "accent": "#2D7A5F",
      "text": "#1A2E25",
      "muted": "#7A9E8E",
      "rationale": "הסבר קצר למה הפלטה הזו מתאימה לקהל הספציפי הזה"
    }
  ]
}`;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[atelier/generate] ANTHROPIC_API_KEY not set");
    return NextResponse.json({ error: "ANTHROPIC_API_KEY חסר בסביבה" }, { status: 500 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    let generated: Record<string, unknown>;
    try {
      generated = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      generated = JSON.parse(cleaned);
    }

    // Save to DB
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("atelier_applications")
      .update({
        niche,
        target_audience,
        tone_keywords,
        products,
        testimonials,
        generated_content: generated,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", application_id);

    return NextResponse.json({ generated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[atelier/generate] error:", msg);
    return NextResponse.json({ error: `שגיאה: ${msg}` }, { status: 500 });
  }
}
