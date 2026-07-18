import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { getUtmFromRequestCookies } from "@/lib/utm/server";
import {
  SIGNAL_ENGINE_EN_MODEL,
  SIGNAL_ENGINE_EN_MAX_TOKENS,
  SIGNAL_ENGINE_EN_SYSTEM_PROMPT,
  SIGNAL_QUESTIONS_EN,
  buildSignalUserMessageEn,
  validateSignalOutputEn,
  bucketFromRoutingEn,
  type SignalAnswersEn,
  type SignalOutputEn,
} from "@/lib/prompts/signal-engine-en";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getRequestIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isValidAnswers(value: unknown): value is SignalAnswersEn {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  for (const q of SIGNAL_QUESTIONS_EN) {
    const raw = v[q.key];
    if (raw !== undefined && typeof raw !== "string") return false;
  }
  const filled = SIGNAL_QUESTIONS_EN.filter((q) => {
    const raw = v[q.key];
    return typeof raw === "string" && raw.trim().length >= 8;
  });
  return filled.length >= 3;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { answers, first_name, last_name, email, occupation } = (body ?? {}) as {
    answers?:    unknown;
    first_name?: unknown;
    last_name?:  unknown;
    email?:      unknown;
    occupation?: unknown;
  };

  const firstStr = typeof first_name === "string" ? first_name.trim() : "";
  const lastStr  = typeof last_name === "string"  ? last_name.trim()  : "";
  const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
  const occupationStr = typeof occupation === "string" ? occupation.trim().slice(0, 200) : "";

  if (firstStr.length < 2) {
    return NextResponse.json({ error: "Please share your first name." }, { status: 400 });
  }
  if (!isValidEmail(emailStr)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }

  const ip = getRequestIp(req);
  if (!rateLimit(`en-signal-anon:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in an hour." },
      { status: 429 },
    );
  }

  if (!isValidAnswers(answers)) {
    return NextResponse.json(
      { error: "Please answer at least three of the five questions, with a sentence each." },
      { status: 400 },
    );
  }

  const db = createServerClient();
  const fullName = [firstStr, lastStr].filter(Boolean).join(" ");

  // Upsert lead by email. status=lead. First-touch UTM attribution rides the
  // insert (same capture as the Hebrew funnel) so EN leads don't land as
  // "direct/unknown" in the acquisition dashboards.
  const utmFields = await getUtmFromRequestCookies();
  let userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (db as any)
    .from("users")
    .select("id, name, occupation, utm_source")
    .eq("email", emailStr)
    .maybeSingle();

  if (existing?.id) {
    userId = existing.id as string;
    const patch: Record<string, string> = {};
    if (!existing.name && fullName) patch.name = fullName;
    if (!existing.occupation && occupationStr) patch.occupation = occupationStr;
    // fill attribution only when the row has none (first touch wins)
    if (!existing.utm_source && utmFields.utm_source) Object.assign(patch, utmFields);
    if (Object.keys(patch).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("users").update(patch).eq("id", userId);
    }
  } else {
    const insertPayload: Record<string, string> = {
      email:  emailStr,
      name:   fullName,
      status: "lead",
      ...utmFields,
    };
    if (occupationStr) insertPayload.occupation = occupationStr;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: insErr } = await (db as any)
      .from("users")
      .insert(insertPayload)
      .select("id")
      .single();
    if (insErr || !created?.id) {
      await db.from("error_logs").insert({
        context: "api/en/signal/extract POST - user upsert",
        error:   String(insErr?.message ?? insErr ?? "no row"),
        payload: { emailStr },
      });
      return NextResponse.json({ error: "We couldn't save your details. Try again." }, { status: 500 });
    }
    userId = created.id as string;
  }

  if (!rateLimit(`en-signal:${userId}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "You've reached the hourly limit. Try again later." },
      { status: 429 },
    );
  }

  // ── Claude call ─────────────────────────────────────────────────────────
  let parsed: SignalOutputEn;
  let rawJson: unknown = null;
  try {
    const client = new Anthropic();
    const requestParams = {
      model:      SIGNAL_ENGINE_EN_MODEL,
      max_tokens: SIGNAL_ENGINE_EN_MAX_TOKENS,
      system:     SIGNAL_ENGINE_EN_SYSTEM_PROMPT,
      messages: [{
        role:    "user" as const,
        content: buildSignalUserMessageEn(answers, firstStr || undefined, occupationStr || undefined),
      }],
    };

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

    if (!validateSignalOutputEn(rawJson)) {
      throw new Error("Model returned invalid signal shape");
    }
    parsed = rawJson;
  } catch (error) {
    await db.from("error_logs").insert({
      context: "api/en/signal/extract POST - claude call",
      error:   String(error),
      payload: { userId, raw: rawJson },
    });
    return NextResponse.json(
      { error: "The engine hit a temporary error. Try again in a moment." },
      { status: 502 },
    );
  }

  // English offer routing: premium shoot day for top-tier founders, else a
  // strategy session. The real bucket rides in the email payload (the bucket
  // column has a CHECK that predates "premium"); routing_signal is in the JSONB.
  const enBucket = bucketFromRoutingEn(parsed.routing_signal);

  const generatedAt = new Date().toISOString();
  let extractionId: string | null = null;
  try {
    const { data: inserted, error: saveError } = await safeFrom(db, "signal_extractions")
      .insert({
        user_id:      userId,
        answers,
        signal:       parsed,
        model_used:   SIGNAL_ENGINE_EN_MODEL,
        raw_response: parsed,
        generated_at: generatedAt,
        bucket:       "strategy", // valid column value; true premium/strategy is in routing_signal + payload
      })
      .select("id")
      .single();
    if (saveError) {
      await db.from("error_logs").insert({
        context: "api/en/signal/extract POST - db insert",
        error:   String(saveError.message ?? saveError),
        payload: { userId },
      });
    } else if (inserted?.id) {
      extractionId = inserted.id as string;
    }
  } catch (e) {
    await db.from("error_logs").insert({
      context: "api/en/signal/extract POST - db insert threw",
      error:   String(e),
      payload: { userId },
    });
  }

  // Fire SIGNAL_EXTRACTED_EN event + enqueue the English welcome email.
  // Separate event type from the Hebrew SIGNAL_EXTRACTED keeps the two
  // language welcomes from cross-firing through the email_sequences table.
  // Soft-fail throughout - the user already has their signal on screen.
  try {
    await db.from("events").insert({
      user_id:  userId,
      type:     "SIGNAL_EXTRACTED_EN",
      metadata: { source: "en_anonymous_gate", locale: "en", extraction_id: extractionId, bucket: enBucket },
    });

    // Lead heat for the admin/gold view (premium → hottest).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from("users").update({ signal_temperature: enBucket === "premium" ? "boiling" : "warm" }).eq("id", userId);

    // Enqueue the FULL English nurture chain (welcome 0h + day1/3/5/8/12). Each
    // job carries the bucket so the offer emails render the matched product.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seqs } = await (db as any)
      .from("email_sequences")
      .select("id, subject, template_key, delay_hours")
      .eq("trigger_event", "SIGNAL_EXTRACTED_EN")
      .eq("active", true);

    if (seqs && seqs.length) {
      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = seqs.map((seq: any) => ({
        type:    "SEND_EMAIL",
        payload: {
          user_id:       userId,
          email:         emailStr,
          name:          fullName,
          sequence_id:   seq.id,
          subject:       seq.subject,
          template_key:  seq.template_key,
          extraction_id: extractionId,
          bucket:        enBucket,
        },
        run_at: new Date(now + (seq.delay_hours ?? 0) * 60 * 60 * 1000).toISOString(),
        status: "pending",
      }));
      await db.from("jobs").insert(rows);
    }
  } catch (e) {
    await db.from("error_logs").insert({
      context: "api/en/signal/extract POST - SIGNAL_EXTRACTED_EN enqueue",
      error:   String(e),
      payload: { userId },
    });
  }

  return NextResponse.json({
    id:           extractionId,
    signal:       parsed,
    generated_at: generatedAt,
  });
}
