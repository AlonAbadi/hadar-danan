// Returns 3 fresh bee facts in Hebrew, used by the /signal loading screen
// to keep visitors engaged while Claude extracts their Signal.
// Ported from the carousel-ai project (same UX intent — entertain while waiting).

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime  = "nodejs";
export const maxDuration = 15;

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "service_unconfigured" }, { status: 503 });
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content:
            'תן לי 3 עובדות מרתקות ומפתיעות על דבורים שרוב האנשים לא יודעים. כל עובדה במשפט אחד קצר בעברית. החזר JSON בלבד: {"facts": ["עובדה1", "עובדה2", "עובדה3"]}',
        },
      ],
    });

    const text  = (message.content[0] as { type: string; text: string }).text;
    const clean = text.replace(/```json|```/g, "").trim();
    const { facts } = JSON.parse(clean) as { facts: string[] };
    return NextResponse.json({ facts });
  } catch (err) {
    console.error("bee-facts api error", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }
}
