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
// Auth is optional. Authenticated users skip the email gate; anonymous users
// must pass `email` and `name` in the body — we upsert a lead row before
// running the extraction so every signal is tied to a real CRM entry.

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getRequestIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { answers, first_name, email, name, phone } = (body ?? {}) as {
    answers?:    unknown;
    first_name?: unknown;
    email?:      unknown;
    name?:       unknown;
    phone?:      unknown;
  };

  const db = createServerClient();
  const authUser = await getSessionUser();

  let userId:        string;
  let userNameForPrompt: string | undefined;

  if (authUser) {
    // Authenticated path — find their public.users row
    const { data: userRow } = await db
      .from("users")
      .select("id, name")
      .eq("auth_id", authUser.id)
      .maybeSingle();
    if (!userRow) {
      return NextResponse.json({ error: "לא נמצא פרופיל משתמש" }, { status: 404 });
    }
    userId = userRow.id as string;
    if (typeof userRow.name === "string" && userRow.name.trim().length > 0) {
      userNameForPrompt = userRow.name.split(" ")[0];
    }
  } else {
    // Anonymous path — require email + name + phone, upsert lead
    const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
    const nameStr  = typeof name === "string" ? name.trim() : "";
    const phoneStr = typeof phone === "string" ? phone.trim() : "";
    if (!isValidEmail(emailStr)) {
      return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });
    }
    if (nameStr.length < 2) {
      return NextResponse.json({ error: "נדרש שם" }, { status: 400 });
    }
    if (!/^[0-9+\-\s()]{9,20}$/.test(phoneStr)) {
      return NextResponse.json({ error: "טלפון לא תקין" }, { status: 400 });
    }

    // Rate-limit anonymous extractions by IP — 3/hr
    const ip = getRequestIp(req);
    if (!rateLimit(`signal-anon:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "יותר מדי ניסיונות. נסה שוב בעוד שעה." },
        { status: 429 },
      );
    }

    // Upsert the lead. Match by email; create with status=lead if new.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (db as any)
      .from("users")
      .select("id, name, phone")
      .eq("email", emailStr)
      .maybeSingle();

    if (existing?.id) {
      userId = existing.id as string;
      // Backfill missing fields without overwriting existing values
      const patch: Record<string, string> = {};
      if (!existing.name  && nameStr)  patch.name  = nameStr;
      if (!existing.phone && phoneStr) patch.phone = phoneStr;
      if (Object.keys(patch).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any).from("users").update(patch).eq("id", userId);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: insErr } = await (db as any)
        .from("users")
        .insert({ email: emailStr, name: nameStr, phone: phoneStr, status: "lead" })
        .select("id")
        .single();
      if (insErr || !created?.id) {
        await db.from("error_logs").insert({
          context: "api/signal/extract POST — user upsert",
          error:   String(insErr?.message ?? insErr ?? "no row"),
          payload: { emailStr },
        });
        return NextResponse.json({ error: "לא הצלחנו לשמור את הפרטים. נסה שוב." }, { status: 500 });
      }
      userId = created.id as string;
      // Note: we intentionally do NOT fire USER_SIGNED_UP here. The generic
      // welcome pitches the full ladder, which doesn't fit a lead who just
      // generated their signal. Instead, SIGNAL_EXTRACTED fires below for
      // every successful extraction (new and existing users) and triggers
      // the signal_welcome template.
    }

    userNameForPrompt = nameStr.split(" ")[0];
  }

  // Rate-limit per user (in addition to the per-IP anon limit above)
  if (!rateLimit(`signal:${userId}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "הגעת למקסימום ניסיונות לשעה. נסה שוב מאוחר יותר." },
      { status: 429 },
    );
  }

  if (!isValidAnswers(answers)) {
    return NextResponse.json(
      { error: "צריך לענות על לפחות שלוש שאלות, בכל אחת לפחות שמונה תווים." },
      { status: 400 },
    );
  }

  const nameForPrompt = typeof first_name === "string" && first_name.trim().length > 0
    ? first_name.trim()
    : userNameForPrompt;

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

  // ── Fire SIGNAL_EXTRACTED + enqueue welcome email inline ────────────────
  // We don't route through /api/events because we want this self-contained
  // and we already have the user_id in hand. Soft-fail throughout — the user
  // already has their signal on screen even if event logging or job enqueue
  // fails. Matches the same pattern /api/hive/join uses.
  try {
    await db.from("events").insert({
      user_id:  userId,
      type:     "SIGNAL_EXTRACTED",
      metadata: { source: authUser ? "authenticated" : "anonymous_gate" },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: welcomeSeq } = await (db as any)
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "SIGNAL_EXTRACTED")
      .eq("delay_hours", 0)
      .eq("active", true)
      .maybeSingle();

    if (welcomeSeq) {
      // Pull email + name fresh so the job has what it needs even if the
      // anonymous path didn't keep it in scope.
      const { data: u } = await db
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .maybeSingle();

      if (u?.email) {
        await db.from("jobs").insert({
          type:    "SEND_EMAIL",
          payload: {
            user_id:      userId,
            email:        u.email,
            name:         u.name ?? "",
            sequence_id:  welcomeSeq.id,
            subject:      welcomeSeq.subject,
            template_key: welcomeSeq.template_key,
          },
          run_at: new Date().toISOString(),
          status: "pending",
        });
      }
    }
  } catch (e) {
    await db.from("error_logs").insert({
      context: "api/signal/extract POST — SIGNAL_EXTRACTED enqueue",
      error:   String(e),
      payload: { userId },
    });
  }

  return NextResponse.json({
    signal:       parsed,
    generated_at: generatedAt,
  });
}
