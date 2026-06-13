// English bee facts for the /en/signal loading screen.
// Mirrors /api/bee-facts but asks Claude for English output.

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
            'Give me three surprising, fascinating facts about honey bees that most people don\'t know. Each fact must be one short sentence in English. Return JSON only: {"facts": ["fact1", "fact2", "fact3"]}',
        },
      ],
    });

    const text  = (message.content[0] as { type: string; text: string }).text;
    const clean = text.replace(/```json|```/g, "").trim();
    const { facts } = JSON.parse(clean) as { facts: string[] };
    return NextResponse.json({ facts });
  } catch (err) {
    console.error("en/bee-facts api error", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }
}
