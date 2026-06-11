import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { rateLimit } from "@/lib/rate-limit";
import {
  SIGNAL_ENGINE_MODEL,
  SIGNAL_ENGINE_MAX_TOKENS,
  SIGNAL_ENGINE_SYSTEM_PROMPT,
  SIGNAL_QUESTIONS,
  buildSignalUserMessage,
  validateSignalOutput,
  type SignalAnswers,
  type SignalOutput,
} from "@/lib/prompts/signal-engine";

// Typed escape hatch — signal_extractions isn't in the generated Database types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

async function getSessionUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

function isValidAnswers(value: unknown): value is SignalAnswers {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  for (const q of SIGNAL_QUESTIONS) {
    const raw = v[q.key];
    if (raw !== undefined && typeof raw !== "string") return false;
  }
  // Require at least 3 non-empty answers — anything less is too thin to extract a signal
  const filled = SIGNAL_QUESTIONS.filter((q) => {
    const raw = v[q.key];
    return typeof raw === "string" && raw.trim().length >= 8;
  });
  return filled.length >= 3;
}

// ── GET: returns the user's most recent signal, or null ──────────────────────

export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ signal: null });

  const db = createServerClient();
  const { data: userRow } = await db
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!userRow) return NextResponse.json({ signal: null });

  const { data: latest } = await safeFrom(db, "signal_extractions")
    .select("id, signal, generated_at")
    .eq("user_id", userRow.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return NextResponse.json({ signal: null });
  return NextResponse.json({
    signal:       latest.signal as SignalOutput,
    generated_at: latest.generated_at,
    id:           latest.id,
  });
}

// ── POST: generate a fresh signal from 5 answers ────────────────────────────

export async function POST(req: NextRequest) {
  const authUser = await getSessionUser();
  if (!authUser) {
    return NextResponse.json({ error: "יש להתחבר כדי להפעיל את מנוע האות" }, { status: 401 });
  }

  const db = createServerClient();
  const { data: userRow } = await db
    .from("users")
    .select("id, name")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!userRow) {
    return NextResponse.json({ error: "לא נמצא פרופיל משתמש" }, { status: 404 });
  }
  const userId = userRow.id as string;

  // Rate-limit: 5 calls per hour per user. Claude calls are expensive.
  if (!rateLimit(`signal:${userId}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "הגעת למקסימום ניסיונות לשעה. נסה שוב מאוחר יותר." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { answers, first_name } = (body ?? {}) as { answers?: unknown; first_name?: unknown };
  if (!isValidAnswers(answers)) {
    return NextResponse.json(
      { error: "צריך לענות על לפחות שלוש שאלות, בכל אחת לפחות שמונה תווים." },
      { status: 400 },
    );
  }

  const nameForPrompt = typeof first_name === "string" && first_name.trim().length > 0
    ? first_name.trim()
    : (typeof userRow.name === "string" ? userRow.name.split(" ")[0] : undefined);

  // ── Call Claude ───────────────────────────────────────────────────────────
  let parsed: SignalOutput;
  let rawJson: unknown = null;
  try {
    const client = new Anthropic();
    const requestParams = {
      model:      SIGNAL_ENGINE_MODEL,
      max_tokens: SIGNAL_ENGINE_MAX_TOKENS,
      system:     SIGNAL_ENGINE_SYSTEM_PROMPT,
      messages: [{
        role:    "user" as const,
        content: buildSignalUserMessage(answers, nameForPrompt),
      }],
    };

    // Retry on 429/529 with exponential backoff (same pattern as truesignal-diagnosis)
    let aiResponse: Awaited<ReturnType<typeof client.messages.create>> | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        aiResponse = await client.messages.create(requestParams);
        break;
      } catch (e: unknown) {
        lastErr = e;
        const status = (e as { status?: number })?.status;
        if (status !== 429 && status !== 529) throw e;
        if (attempt === 2) throw e;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    if (!aiResponse) throw lastErr ?? new Error("Anthropic call failed");

    const firstBlock = aiResponse.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      throw new Error("Model returned non-text block");
    }

    const cleanText = firstBlock.text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    rawJson = JSON.parse(cleanText);

    if (!validateSignalOutput(rawJson)) {
      throw new Error("Model returned invalid signal shape");
    }
    parsed = rawJson;
  } catch (error) {
    await db.from("error_logs").insert({
      context: "api/signal/extract POST — claude call",
      error:   String(error),
      payload: { userId, raw: rawJson },
    });
    return NextResponse.json(
      { error: "מנוע האות נתקל בשגיאה זמנית. נסה שוב בעוד רגע." },
      { status: 502 },
    );
  }

  // ── Save to DB — soft-fail (return signal even if save fails) ────────────
  const generatedAt = new Date().toISOString();
  try {
    const { error: saveError } = await safeFrom(db, "signal_extractions").insert({
      user_id:      userId,
      answers,
      signal:       parsed,
      model_used:   SIGNAL_ENGINE_MODEL,
      raw_response: parsed,
      generated_at: generatedAt,
    });
    if (saveError) {
      await db.from("error_logs").insert({
        context: "api/signal/extract POST — db insert",
        error:   String(saveError.message ?? saveError),
        payload: { userId },
      });
    }
  } catch (e) {
    await db.from("error_logs").insert({
      context: "api/signal/extract POST — db insert threw",
      error:   String(e),
      payload: { userId },
    });
  }

  return NextResponse.json({
    signal:       parsed,
    generated_at: generatedAt,
  });
}
