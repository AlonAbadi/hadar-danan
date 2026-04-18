import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, instagram, story } = body;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `אתה יועץ עסקי של חברת beegood שמנתחת לידים למשפיעניות ויועצים.

הליד:
- שם: ${name}
- אינסטגרם: ${instagram}
- מה שהם כתבו על עצמם: "${story}"

נתח את הליד הזה וצור JSON בלבד (ללא markdown):

{
  "fit_score": מספר 1-10,
  "fit_label": "מתאים מאוד" / "מעניין" / "לא ברור" / "לא מתאים",
  "niche_guess": "ניחוש מה הנישה שלה",
  "audience_guess": "ניחוש מיהו הקהל שלה",
  "strengths": ["חוזק 1", "חוזק 2", "חוזק 3"],
  "questions": ["שאלה שכדאי לשאול בשיחת גילוי 1", "שאלה 2"],
  "one_liner": "משפט אחד שמסכם מי היא ומה הפוטנציאל שלה"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const analysis = JSON.parse(cleaned);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[atelier/analyze]", err);
    return NextResponse.json({ error: "שגיאה בניתוח" }, { status: 500 });
  }
}
