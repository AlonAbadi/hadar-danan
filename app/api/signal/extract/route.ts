import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
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
import { detectGender, type Gender } from "@/lib/gender/detect";
import { determineBucket, type Bucket } from "@/lib/signal/score";

// Same recipients as /api/stage/apply and /api/quiz-result. Hardcoded by
// design — we never want a config typo to silently lose hot-lead alerts.
const HOT_LEAD_RECIPIENTS = ["alonabadi9@gmail.com", "hadard1113@gmail.com"] as const;

function bucketToTemperature(bucket: Bucket): "boiling" | "warm" | "nurture" | null {
  if (bucket === "strategy")  return "boiling";
  if (bucket === "challenge") return "warm";
  if (bucket === "nurture")   return "nurture";
  return null; // hive (existing customer) and none (too thin) — no temperature
}

// Typed escape hatch — signal_extractions isn't in the generated Database types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// Pull the first balanced JSON object out of `text`. Tolerates any prose
// preamble/suffix from the model ("I'll analyze...", trailing ```), strings
// containing `{`/`}`, and escaped quotes. Returns `null` if no balanced
// object is present (e.g. truncated output mid-object).
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth    = 0;
  let inString = false;
  let escape   = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (c === "\\") { escape = true; continue; }
      if (c === '"')  { inString = false; }
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === "{") { depth++; continue; }
    if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
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
    .select("id, signal, generated_at, gender, bucket")
    .eq("user_id", userRow.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return NextResponse.json({ signal: null });
  return NextResponse.json({
    signal:       latest.signal as SignalOutput,
    generated_at: latest.generated_at,
    id:           latest.id,
    gender:       (latest.gender as Gender | null) ?? null,
    bucket:       (latest.bucket as string | null) ?? null,
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

  const { answers, first_name, email, name, phone, occupation, marketing_consent, gender: requestedGender } = (body ?? {}) as {
    answers?:           unknown;
    first_name?:        unknown;
    email?:             unknown;
    name?:              unknown;
    phone?:             unknown;
    occupation?:        unknown;
    marketing_consent?: unknown;
    gender?:            unknown;
  };

  const occupationStr = typeof occupation === "string"
    ? occupation.trim().slice(0, 200)
    : "";
  const consentGranted = marketing_consent === true;
  // Client-supplied gender (from the LeadGate radio). When present, it
  // overrides server-side detection and any stored value — the user just
  // explicitly told us how they want to be addressed.
  const explicitGender: Gender | null = requestedGender === "m" || requestedGender === "f"
    ? requestedGender
    : null;

  const db = createServerClient();
  const authUser = await getSessionUser();

  let userId:        string;
  let userNameForPrompt: string | undefined;
  let occupationForPrompt: string | undefined;
  let userStatus: string | null = null;
  let userHiveActive: boolean = false;
  let storedGender: Gender | null = null;

  if (authUser) {
    // Authenticated path — find their public.users row.
    // Pull stored occupation, status, hive_status, and gender as well.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRow } = await (db as any)
      .from("users")
      .select("id, name, occupation, status, hive_status, gender")
      .eq("auth_id", authUser.id)
      .maybeSingle();
    if (!userRow) {
      return NextResponse.json({ error: "לא נמצא פרופיל משתמש" }, { status: 404 });
    }
    userId = userRow.id as string;
    if (typeof userRow.name === "string" && userRow.name.trim().length > 0) {
      userNameForPrompt = userRow.name.split(" ")[0];
    }
    const storedOcc = typeof userRow.occupation === "string" ? userRow.occupation.trim() : "";
    occupationForPrompt = occupationStr || storedOcc || undefined;
    userStatus     = (userRow.status as string | null) ?? null;
    userHiveActive = userRow.hive_status === "active";
    storedGender   = (userRow.gender as Gender | null) ?? null;
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
    if (occupationStr.length < 2) {
      return NextResponse.json({ error: "נדרש לתאר את תחום העיסוק" }, { status: 400 });
    }
    if (!consentGranted) {
      return NextResponse.json({ error: "יש לאשר קבלת עדכונים כדי להמשיך" }, { status: 400 });
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
      .select("id, name, phone, occupation, status, hive_status, gender")
      .eq("email", emailStr)
      .maybeSingle();

    if (existing?.id) {
      userId = existing.id as string;
      userStatus     = (existing.status as string | null) ?? null;
      userHiveActive = existing.hive_status === "active";
      storedGender   = (existing.gender as Gender | null) ?? null;
      // Backfill missing fields without overwriting existing values
      const patch: Record<string, unknown> = {};
      if (!existing.name  && nameStr)        patch.name        = nameStr;
      if (!existing.phone && phoneStr)       patch.phone       = phoneStr;
      if (!existing.occupation && occupationStr) patch.occupation = occupationStr;
      if (consentGranted) {
        patch.marketing_consent = true;
        patch.consent_at        = new Date().toISOString();
      }
      if (Object.keys(patch).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any).from("users").update(patch).eq("id", userId);
      }
      const storedOcc = typeof existing.occupation === "string" ? existing.occupation.trim() : "";
      occupationForPrompt = occupationStr || storedOcc || undefined;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertPayload: Record<string, unknown> = {
        email:  emailStr,
        name:   nameStr,
        phone:  phoneStr,
        status: "lead",
      };
      if (occupationStr) insertPayload.occupation = occupationStr;
      if (consentGranted) {
        insertPayload.marketing_consent = true;
        insertPayload.consent_at        = new Date().toISOString();
      }
      // Detect gender from first name and persist it on the new lead row so
      // future re-extractions and personalized emails get it for free.
      const detectedAtCreate = detectGender(nameStr.split(" ")[0]);
      insertPayload.gender = detectedAtCreate;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: insErr } = await (db as any)
        .from("users")
        .insert(insertPayload)
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
      occupationForPrompt = occupationStr || undefined;
      storedGender = detectedAtCreate;
      // Note: we intentionally do NOT fire USER_SIGNED_UP here. The generic
      // welcome pitches the full ladder, which doesn't fit a lead who just
      // generated their signal. Instead, SIGNAL_EXTRACTED fires below for
      // every successful extraction (new and existing users) and triggers
      // the signal_welcome template.
    }

    userNameForPrompt = nameStr.split(" ")[0];
  }

  // Resolve the gender we'll address the visitor with. Order:
  //   1. Explicit value from the LeadGate radio (user just picked)
  //   2. Existing stored value on the users row (authoritative for return visits)
  //   3. Detection from the first name (best-effort fallback)
  //   4. 'f' as a safe default (handled inside detectGender)
  const genderForPrompt: Gender = explicitGender
    ?? storedGender
    ?? detectGender(userNameForPrompt);

  // Persist the resolved gender on the users row when:
  //   - the row has none yet (legacy auth users from before migration 051), OR
  //   - the user explicitly picked one in the gate (override stored detection)
  if (!storedGender || (explicitGender && explicitGender !== storedGender)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("users").update({ gender: genderForPrompt }).eq("id", userId);
    } catch {
      // Non-fatal; we still pass it to Claude for this extraction.
    }
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
  let rawTextForDiag: string | null = null;
  let parseRetryUsed = false;
  try {
    const client = new Anthropic();
    // Sonnet 4.6 rejects assistant-message prefill ("This model does not
    // support assistant message prefill"), so the earlier {"role:assistant",
    // content:"{"} workaround for the "I need to analyze..." preambles
    // started returning 400. Replacement strategy:
    //   1. Append a hard JSON-only instruction to the user message
    //   2. Use extractJsonObject() to pull the first balanced {...} block
    //      out of whatever the model returns, ignoring prose around it
    //   3. If parse/validation still fails, retry ONCE with a sharper
    //      follow-up message — covers max_tokens truncation, malformed
    //      JSON, and missing-required-field cases
    const baseUserMessage = buildSignalUserMessage(answers, nameForPrompt, occupationForPrompt, genderForPrompt)
      + "\n\nהחזר אך ורק את אובייקט ה-JSON. בלי טקסט לפניו, בלי טקסט אחריו, בלי גושי קוד. התחל את התשובה בתו { וסיים בתו }.";

    // Inner helper: one full LLM call + parse + validate. Throws on any
    // failure so the outer logic can decide whether to retry.
    async function callAndParse(userContent: string): Promise<SignalOutput> {
      const requestParams = {
        model:      SIGNAL_ENGINE_MODEL,
        max_tokens: SIGNAL_ENGINE_MAX_TOKENS,
        system:     SIGNAL_ENGINE_SYSTEM_PROMPT,
        messages: [{ role: "user" as const, content: userContent }],
      };

      // Network-level retry on 429/529. 5 attempts with exponential backoff
      // + ±30% jitter: 1s, 2s, 4s, 8s. Total max wait before final failure
      // ≈15s, which gives Anthropic's overload window a real chance to clear.
      // Each attempt is also logged on failure so we can see in error_logs
      // how deep into the retry chain we got.
      const MAX_ATTEMPTS = 5;
      let aiResponse: Awaited<ReturnType<typeof client.messages.create>> | null = null;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          aiResponse = await client.messages.create(requestParams);
          break;
        } catch (e: unknown) {
          lastErr = e;
          const status = (e as { status?: number })?.status;
          if (status !== 429 && status !== 529) throw e;
          if (attempt === MAX_ATTEMPTS - 1) throw e;
          const base   = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s, 8s
          const jitter = base * (Math.random() * 0.6 - 0.3); // ±30%
          await new Promise((r) => setTimeout(r, base + jitter));
        }
      }
      if (!aiResponse) throw lastErr ?? new Error("Anthropic call failed");

      const firstBlock = aiResponse.content[0];
      if (!firstBlock || firstBlock.type !== "text") {
        throw new Error("Model returned non-text block");
      }
      rawTextForDiag = firstBlock.text;

      const jsonSlice = extractJsonObject(firstBlock.text);
      if (!jsonSlice) throw new Error("No JSON object found in model output");
      const obj = JSON.parse(jsonSlice);
      rawJson = obj;

      if (!validateSignalOutput(obj)) {
        throw new Error("Model returned invalid signal shape");
      }
      return obj;
    }

    try {
      parsed = await callAndParse(baseUserMessage);
    } catch (firstErr: unknown) {
      // Don't retry on auth/billing/permission errors — only on parse/shape
      // failures and Anthropic-side hiccups.
      const status = (firstErr as { status?: number })?.status;
      if (status === 401 || status === 403 || status === 400) throw firstErr;

      parseRetryUsed = true;
      const sharperMessage = baseUserMessage
        + "\n\nהתשובה הקודמת לא הייתה JSON תקין או הייתה חסרה שדות חובה. החזר עכשיו אך ורק את אובייקט ה-JSON המלא, על פי הסכמה במדויק, התחל בתו { וסיים בתו }. בלי שום טקסט נוסף.";
      parsed = await callAndParse(sharperMessage);
    }
  } catch (error) {
    // Verbose error capture so we can diagnose what's actually failing.
    // Common causes after the schema grew: max_tokens truncation (parsed
    // text ends mid-JSON), schema-validation failures, transient Anthropic
    // 5xx, prompt-too-long, or model-name typos.
    const err = error as { name?: string; message?: string; status?: number; constructor?: { name?: string } };
    await db.from("error_logs").insert({
      context: "api/signal/extract POST — claude call",
      error:   String(error),
      payload: {
        userId,
        errName:    err?.name ?? err?.constructor?.name ?? "unknown",
        errMessage: err?.message ?? "",
        errStatus:  err?.status ?? null,
        parseRetryUsed,
        rawTextPreview: typeof rawTextForDiag === "string" ? (rawTextForDiag as string).slice(0, 600) : null,
        parsedPreview: typeof rawJson === "string"
          ? (rawJson as string).slice(0, 400)
          : rawJson,
      },
    });
    return NextResponse.json(
      { error: "מנוע האות נתקל בשגיאה זמנית. נסה שוב בעוד רגע." },
      { status: 502 },
    );
  }

  // ── Compute bucket (drives the conditional CTA on the result page) ──────
  // LLM's routing_signal (if returned and valid) drives the decision; rules
  // are the guardrail. Missing/invalid routing_signal degrades gracefully.
  const bucketDecision = determineBucket({
    answers,
    occupation:    occupationForPrompt ?? null,
    userStatus,
    hiveActive:    userHiveActive,
    routingSignal: parsed.routing_signal,
  });

  // ── Save to DB — soft-fail (return signal even if save fails) ────────────
  const generatedAt = new Date().toISOString();
  let extractionId: string | null = null;
  try {
    const { data: inserted, error: saveError } = await safeFrom(db, "signal_extractions")
      .insert({
        user_id:      userId,
        answers,
        signal:       parsed,
        model_used:   SIGNAL_ENGINE_MODEL,
        raw_response: parsed,
        generated_at: generatedAt,
        gender:       genderForPrompt,
        bucket:       bucketDecision.bucket,
      })
      .select("id")
      .single();
    if (saveError) {
      await db.from("error_logs").insert({
        context: "api/signal/extract POST — db insert",
        error:   String(saveError.message ?? saveError),
        payload: { userId },
      });
    } else if (inserted?.id) {
      extractionId = inserted.id as string;
    }
  } catch (e) {
    await db.from("error_logs").insert({
      context: "api/signal/extract POST — db insert threw",
      error:   String(e),
      payload: { userId },
    });
  }

  // ── Increment landing_headline A/B conversion counter ───────────────────
  // Hero CTA on / leads here. If the visitor was bucketed into a tracked
  // variant on first visit, count this completed extraction as their
  // conversion. Mirrors the Cardcom-webhook pattern: server-side, RPC,
  // soft-fail. We read the cookie fresh here rather than threading it
  // through the request body so the client can't spoof a variant.
  try {
    const cookieStore = await cookies();
    const abVariant   = cookieStore.get("ab_variant")?.value;
    if (abVariant === "A" || abVariant === "B") {
      await db.rpc("increment_experiment", {
        p_name:   "landing_headline",
        p_column: abVariant === "A" ? "conversions_a" : "conversions_b",
      });
    }
  } catch {
    // Non-fatal — the signal is already returned to the user.
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

  // ── Lead temperature + boiling-lead notification ────────────────────────
  // This is the "lead machine" — every signal extraction stamps a temperature
  // on the user row so /admin can sort by heat. Strategy bucket → boiling →
  // immediate email to Alon + Hadar with the full signal so they can act on
  // it within minutes. Soft-fail throughout (the user already has their
  // signal on screen — alert misses must not break their UX).
  try {
    const temperature = bucketToTemperature(bucketDecision.bucket);
    if (temperature) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("users")
        .update({
          signal_temperature:    temperature,
          signal_temperature_at: generatedAt,
        })
        .eq("id", userId);
    }

    if (temperature === "boiling") {
      // Pull full lead details for the alert. We already know userId and
      // bucketDecision; just need contact info + name.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leadRow } = await (db as any)
        .from("users")
        .select("name, email, phone, occupation, gender")
        .eq("id", userId)
        .maybeSingle();

      const resendKey = process.env.RESEND_API_KEY;
      const fromAddr  = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";
      const resend    = resendKey ? new Resend(resendKey) : null;

      if (resend && leadRow) {
        const name       = (leadRow.name as string | null) ?? "ללא שם";
        const email      = (leadRow.email as string | null) ?? "";
        const phone      = (leadRow.phone as string | null) ?? "";
        const occupation = (leadRow.occupation as string | null) ?? "";
        const waLink     = phone ? `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "972")}` : "";

        const esc = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const directionLines = (parsed.content_directions ?? [])
          .map((d, i) => `<li style="margin:4px 0">${i + 1}. ${esc(d)}</li>`)
          .join("");

        const answerLines = SIGNAL_QUESTIONS
          .map((q) => {
            const a = (answers as Record<string, string | undefined>)[q.key];
            if (!a) return "";
            return `<p style="margin:8px 0"><strong style="color:#9E7C3A">${esc(q.label)}</strong><br/><span style="color:#444">${esc(a).replace(/\n/g, "<br/>")}</span></p>`;
          })
          .filter(Boolean)
          .join("");

        const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;max-width:640px;color:#222">
  <div style="background:#7c0a02;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0">
    <div style="font-size:13px;letter-spacing:1px;opacity:.85">ליד רותח — פגישת אסטרטגיה</div>
    <div style="font-size:22px;font-weight:700;margin-top:4px">${esc(name)}</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px">
    ${email ? `<p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>` : ""}
    ${phone ? `<p style="margin:4px 0"><strong>טלפון:</strong> <a href="tel:${esc(phone)}">${esc(phone)}</a>${waLink ? ` &middot; <a href="${waLink}">WhatsApp</a>` : ""}</p>` : ""}
    ${occupation ? `<p style="margin:4px 0"><strong>תחום:</strong> ${esc(occupation)}</p>` : ""}
    <p style="margin:4px 0;color:#888;font-size:13px">${esc(bucketDecision.reason)}</p>

    <hr style="border:none;border-top:1px solid #eee;margin:14px 0"/>
    <div style="background:#fdf6e7;border-right:3px solid #C9964A;padding:12px 14px;border-radius:6px;margin:10px 0">
      <div style="color:#9E7C3A;font-size:12px;letter-spacing:1px;margin-bottom:6px">האות</div>
      <div style="font-size:17px;color:#222;font-weight:600">${esc(parsed.signal ?? "")}</div>
    </div>

    ${parsed.element ? `<p style="margin:10px 0"><strong style="color:#9E7C3A">האלמנט:</strong><br/>${esc(parsed.element)}</p>` : ""}
    ${parsed.signal_promise ? `<p style="margin:10px 0"><strong style="color:#9E7C3A">מה האות מבטיח:</strong><br/>${esc(parsed.signal_promise)}</p>` : ""}
    ${parsed.central_tool ? `<p style="margin:10px 0"><strong style="color:#9E7C3A">הכלי המרכזי:</strong><br/>${esc(parsed.central_tool)}</p>` : ""}
    ${parsed.people ? `<p style="margin:10px 0"><strong style="color:#9E7C3A">הקהל:</strong><br/>${esc(parsed.people)}</p>` : ""}
    ${directionLines ? `<p style="margin:10px 0"><strong style="color:#9E7C3A">3 כיווני תוכן:</strong></p><ol style="margin:4px 0 10px 0;padding-right:20px">${directionLines}</ol>` : ""}

    <hr style="border:none;border-top:1px solid #eee;margin:14px 0"/>
    <div style="color:#666;font-size:13px;margin-bottom:6px">התשובות המקוריות:</div>
    ${answerLines}

    <hr style="border:none;border-top:1px solid #eee;margin:14px 0"/>
    <a href="https://www.beegood.online/admin/users/${userId}" style="display:inline-block;background:#C9964A;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח פרופיל ב-CRM ←</a>
    ${waLink ? `<a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;margin-right:8px">פתח WhatsApp ←</a>` : ""}
  </div>
</div>`;

        const sendResult = await resend.emails.send({
          from:    `הדר דנן <${fromAddr}>`,
          to:      Array.from(HOT_LEAD_RECIPIENTS),
          subject: `🔥 ליד רותח — ${name}${occupation ? ` (${occupation})` : ""}`,
          html,
        });
        if (sendResult.error) {
          await db.from("error_logs").insert({
            context: "api/signal/extract POST — boiling lead email",
            error:   `Resend rejected: ${sendResult.error.name ?? "unknown"} — ${sendResult.error.message ?? ""}`,
            payload: { userId, extractionId },
          });
        }
      } else if (!resend) {
        await db.from("error_logs").insert({
          context: "api/signal/extract POST — boiling lead email",
          error:   "RESEND_API_KEY missing — boiling alert skipped",
          payload: { userId, extractionId },
        });
      }
    }
  } catch (e) {
    // Never fail the user flow over a notification error.
    await db.from("error_logs").insert({
      context: "api/signal/extract POST — temperature/alert",
      error:   String(e),
      payload: { userId, extractionId, bucket: bucketDecision.bucket },
    });
  }

  return NextResponse.json({
    id:           extractionId,
    signal:       parsed,
    generated_at: generatedAt,
    gender:       genderForPrompt,
    bucket:       bucketDecision.bucket,
  });
}
