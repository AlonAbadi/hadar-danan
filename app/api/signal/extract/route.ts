import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { waitUntil } from "@vercel/functions";
import { isCreditError, alertCreditExhausted } from "@/lib/signal/credit-alert";
import { Resend } from "resend";
import { generateAndStoreResultTeasers } from "@/lib/signal/result-teasers";
import { kaveretLink } from "@/lib/signal/kaveret-token";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { kriahPreviewAllowed } from "@/lib/isolation";
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
import {
  SIGNAL_ENGINE_V2_SYSTEM_PROMPT,
  SIGNAL_QUESTIONS_V2,
  buildSignalUserMessageV2,
  isValidAnswersV2,
} from "@/lib/prompts/signal-engine-v2";
import {
  SIGNAL_ENGINE_EN_V2_SYSTEM_PROMPT,
  buildSignalUserMessageEnV2,
  crisisFloorEn,
} from "@/lib/prompts/signal-engine-en-v2";
import { bucketFromRoutingEn } from "@/lib/prompts/signal-engine-en";
import { detectGender, type Gender } from "@/lib/gender/detect";
import { determineBucket, type Bucket } from "@/lib/signal/score";
import { determineFraming } from "@/lib/signal/framing";
import { conversionScore } from "@/lib/signal/conversion-score";
import { extractEvidence, routeV2Ending, type V2Ending } from "@/lib/signal/evidence";
import { sendCapiEvent } from "@/lib/meta-capi";
import { crisisFloor } from "@/lib/prompts/gap-engine";

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
    .select("id, signal, answers, generated_at, gender, bucket")
    .eq("user_id", userRow.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return NextResponse.json({ signal: null });
  const latestSignal = latest.signal as SignalOutput;
  return NextResponse.json({
    signal:        latestSignal,
    // Return the last answers so the user can restart/update from where they
    // were — editing or adding, not retyping from scratch.
    answers:       latest.answers ?? null,
    generated_at:  latest.generated_at,
    id:            latest.id,
    gender:        (latest.gender as Gender | null) ?? null,
    bucket:        (latest.bucket as string | null) ?? null,
    suggest_refine: determineFraming(latestSignal?.routing_signal).suggestRefine,
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

  // ── v2 isolation plumbing ──
  // is_test is honored ONLY with the preview secret — a public caller can't
  // stamp rows as test (hide from admin) or claim the v2 instrument version.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyAny = body as any;
  const isTestRun = bodyAny?.is_test === true &&
    (kriahPreviewAllowed(req.headers.get("x-kriah-preview")) ||
     process.env.UNIFIED_FUNNEL_ENABLED !== "true");
  const instrumentVersion: string =
    (isTestRun || process.env.UNIFIED_FUNNEL_ENABLED === "true") &&
    typeof bodyAny?.instrument_version === "string"
      ? String(bodyAny.instrument_version).slice(0, 32)
      : "v1_5q";
  // key 1 of the two-key gate: the declared business state (S2 tap).
  const key1Declared: "A" | "B" | "C" | "D" | null =
    ["A", "B", "C", "D"].includes(bodyAny?.key1) ? bodyAny.key1 : null;

  const occupationStr = typeof occupation === "string"
    ? occupation.trim().slice(0, 200)
    : "";
  // name + phone are supplied by anonymous leads AND by authenticated users who
  // completed the gate because their profile was incomplete (e.g. Google sign-up).
  const nameStr  = typeof name === "string" ? name.trim() : "";
  const phoneStr = typeof phone === "string" ? phone.trim() : "";
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
      .select("id, name, phone, occupation, status, hive_status, gender")
      .eq("auth_id", authUser.id)
      .maybeSingle();
    if (!userRow) {
      return NextResponse.json({ error: "לא נמצא פרופיל משתמש" }, { status: 404 });
    }
    userId = userRow.id as string;
    const storedName = typeof userRow.name === "string" ? userRow.name.trim() : "";
    // Prefer the stored name; fall back to the name the user just gave in the gate.
    const effectiveName = storedName || nameStr;
    if (effectiveName.length > 0) {
      userNameForPrompt = effectiveName.split(" ")[0];
    }
    const storedOcc = typeof userRow.occupation === "string" ? userRow.occupation.trim() : "";
    occupationForPrompt = occupationStr || storedOcc || undefined;
    userStatus     = (userRow.status as string | null) ?? null;
    userHiveActive = userRow.hive_status === "active";
    storedGender   = (userRow.gender as Gender | null) ?? null;

    // Backfill profile details the gate just collected, without overwriting
    // existing values. This is the fix for authenticated (e.g. Google) sign-ups
    // who reach the diagnostic with an incomplete profile.
    const patch: Record<string, unknown> = {};
    if (!storedName && nameStr)                          patch.name       = nameStr;
    if (!userRow.phone && phoneStr)                      patch.phone      = phoneStr;
    if (!storedOcc && occupationStr)                     patch.occupation = occupationStr;
    if (consentGranted) {
      patch.marketing_consent = true;
      patch.consent_at        = new Date().toISOString();
    }
    if (Object.keys(patch).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("users").update(patch).eq("id", userId);
    }
  } else {
    // Anonymous path — require email + name + phone, upsert lead
    const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!isValidEmail(emailStr)) {
      return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });
    }
    // v2 funnels (/kriah + /en/reading) soft-capture email-only leads,
    // collect phone at S15 and treat occupation as optional — name, phone
    // and occupation all stay REQUIRED for the live v1 funnel.
    const isV2 = instrumentVersion === "v2_funnel" || instrumentVersion === "v2_funnel_en";
    if (!isV2 && nameStr.length < 2) {
      return NextResponse.json({ error: "נדרש שם" }, { status: 400 });
    }
    if (!isV2 && !/^[0-9+\-\s()]{9,20}$/.test(phoneStr)) {
      return NextResponse.json({ error: "טלפון לא תקין" }, { status: 400 });
    }
    if (isV2 && phoneStr && !/^[0-9+\-\s()]{9,20}$/.test(phoneStr)) {
      return NextResponse.json({ error: "טלפון לא תקין" }, { status: 400 });
    }
    if (!isV2 && occupationStr.length < 2) {
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
      .select("id, name, phone, occupation, status, hive_status, gender, is_test")
      .eq("email", emailStr)
      .maybeSingle();

    if (existing?.id) {
      // Isolation: a test run must NEVER attach an extraction + email chain +
      // boiling alert to a real user's row. Testers use +tag aliases.
      if (isTestRun && existing.is_test !== true) {
        return NextResponse.json(
          { error: "בדיקת v2 לא יכולה להשתמש במייל של משתמש אמיתי. השתמשו בכתובת עם +v2test." },
          { status: 403 },
        );
      }
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
      if (isTestRun) insertPayload.is_test = true;
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

      // Meta CAPI Lead for a v2 lead created HERE (the skipper path skips
      // /api/signup entirely). eventId mirrors signup's scheme (user.id /
      // reg_<id>) so if the same user ever flows through signup too, Meta
      // dedups instead of double-counting.
      if (instrumentVersion === "v2_funnel" || instrumentVersion === "v2_funnel_en") {
        const enRun = instrumentVersion === "v2_funnel_en";
        const capiUser = {
          email:            emailStr,
          phone:            phoneStr || undefined,
          fbp:              req.cookies.get("_fbp")?.value,
          fbc:              req.cookies.get("_fbc")?.value,
          clientUserAgent:  req.headers.get("user-agent") ?? undefined,
        };
        // event_source_url lets a URL-filtered Custom Conversion isolate /kriah
        // completions from ordinary site registrations. Prefer the real page
        // (Referer) and fall back to the canonical funnel URL. English leads
        // report to the dedicated US pixel (pixel: "en").
        const sourceUrl = req.headers.get("referer")
          || `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online"}${enRun ? "/en/reading" : "/kriah"}`;
        const pixel = enRun ? ("en" as const) : undefined;
        void sendCapiEvent({ eventName: "Lead", eventId: userId, sourceUrl, userData: capiUser, isTest: isTestRun, pixel });
        void sendCapiEvent({ eventName: "CompleteRegistration", eventId: `reg_${userId}`, sourceUrl, userData: capiUser, isTest: isTestRun, pixel });
      }
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

  // English unified funnel: same six keys and v2 mechanics, English engine.
  const isV2En = instrumentVersion === "v2_funnel_en";
  const isV2Run = instrumentVersion === "v2_funnel" || isV2En;
  if (isV2Run ? !isValidAnswersV2(answers) : !isValidAnswers(answers)) {
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
    const baseUserMessage = (isV2En
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? buildSignalUserMessageEnV2(answers as any, nameForPrompt, occupationForPrompt)
      : isV2Run
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? buildSignalUserMessageV2(answers as any, nameForPrompt, occupationForPrompt, genderForPrompt)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : buildSignalUserMessage(answers as any, nameForPrompt, occupationForPrompt, genderForPrompt))
      + (isV2En
        ? "\n\nReturn ONLY the JSON object. No text before it, no text after it, no code fences. Start with { and end with }."
        : "\n\nהחזר אך ורק את אובייקט ה-JSON. בלי טקסט לפניו, בלי טקסט אחריו, בלי גושי קוד. התחל את התשובה בתו { וסיים בתו }.");

    // Inner helper: one full LLM call + parse + validate. Throws on any
    // failure so the outer logic can decide whether to retry.
    async function callAndParse(userContent: string): Promise<SignalOutput> {
      const requestParams = {
        model:      SIGNAL_ENGINE_MODEL,
        max_tokens: SIGNAL_ENGINE_MAX_TOKENS,
        system:     isV2En ? SIGNAL_ENGINE_EN_V2_SYSTEM_PROMPT
          : isV2Run ? SIGNAL_ENGINE_V2_SYSTEM_PROMPT
          : SIGNAL_ENGINE_SYSTEM_PROMPT,
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
        + (isV2En
          ? "\n\nThe previous response was not valid JSON or was missing required fields. Return now ONLY the full JSON object, exactly per the schema. Start with { and end with }. No other text."
          : "\n\nהתשובה הקודמת לא הייתה JSON תקין או הייתה חסרה שדות חובה. החזר עכשיו אך ורק את אובייקט ה-JSON המלא, על פי הסכמה במדויק, התחל בתו { וסיים בתו }. בלי שום טקסט נוסף.");
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
    if (isCreditError(error)) await alertCreditExhausted(db, "api/signal/extract");
    return NextResponse.json(
      { error: "מנוע האות נתקל בשגיאה זמנית. נסה שוב בעוד רגע." },
      { status: 502 },
    );
  }

  // v2: the engine infers occupation from the answers (change 3). Backfill it
  // onto the user when empty so the send gate can show it for confirmation
  // and the handoff context strip picks it up.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inferredOccupation = typeof (parsed as any).occupation === "string" && (parsed as any).occupation.trim()
    ? String((parsed as any).occupation).trim().slice(0, 200) : null;
  if (isV2Run && inferredOccupation && !occupationForPrompt) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: occRow } = await (db as any).from("users").select("occupation").eq("id", userId).maybeSingle();
      if (!occRow?.occupation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any).from("users").update({ occupation: inferredOccupation }).eq("id", userId);
      }
    } catch { /* best effort */ }
  }

  // ── v2 two-key routing (kriah only) — evidence + crisis + truth table ───
  // Best-effort: any failure degrades to the hive ending, never blocks the
  // reading. Runs BEFORE the save so the routing columns ride the insert.
  let v2Route: { ending: V2Ending; cell: string } | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let v2Evidence: any = null;
  if (instrumentVersion === "v2_funnel") {
    try {
      const ansRec = answers as Record<string, string | undefined>;
      const answered = Object.values(ansRec).filter((a) => typeof a === "string" && a.trim().length >= 8).length;
      const totalChars = Object.values(ansRec).filter(Boolean).join("").length;
      const crisis = crisisFloor(
        Object.fromEntries(Object.entries(ansRec).map(([k, v]) => [k, v ?? ""])),
      );
      v2Evidence = await extractEvidence(ansRec, answered, totalChars);
      v2Route = routeV2Ending({
        crisis,
        key1:       key1Declared,
        evidence:   v2Evidence.evidence,
        years:      Math.min(Math.max(v2Evidence.llm?.years_in_business ?? 0, 0), 40),
        phoneGiven: phoneStr.length > 0,
      });
    } catch {
      v2Route = { ending: "hive", cell: "route_error" };
    }
  } else if (isV2En) {
    // English routing: no Hebrew evidence LLM — the routing_signal read only.
    // The Signal Hive is THE English product and it is FREE (launch model),
    // so there is no crisis gate here: nothing is sold, and the questionnaire
    // explicitly invites hard chapters — a heavy word in an answer must not
    // hide the product (field case 2026-07-13: "abusive" in a past-chapter
    // answer routed a healthy lead to the WhatsApp-only screen). The keyword
    // floor is kept as a metadata flag for admin eyes only.
    try {
      const ansRec = answers as Record<string, string | undefined>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enBucket = bucketFromRoutingEn(parsed.routing_signal as any);
      const crisisFlag = crisisFloorEn(ansRec);
      v2Route = enBucket === "premium"
        ? { ending: "concierge", cell: crisisFlag ? "en_premium_flagged" : "en_premium" }
        : { ending: "hive", cell: crisisFlag ? "en_hive_flagged" : "en_hive" };
    } catch {
      v2Route = { ending: "hive", cell: "en_route_error" };
    }
  }

  // ── Compute bucket (drives the conditional CTA on the result page) ──────
  // LLM's routing_signal (if returned and valid) drives the decision; rules
  // are the guardrail. Missing/invalid routing_signal degrades gracefully.
  const bucketDecision = determineBucket({
    // v2 answers share the depth/commit heuristics; the key superset is safe here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: answers as any,
    occupation:    occupationForPrompt ?? null,
    userStatus,
    hiveActive:    userHiveActive,
    routingSignal: parsed.routing_signal,
  });

  // Conversion-ease score — powers the real-time "gold lead" alert (and the
  // /admin gold list). Heuristic; predicts fit, not proven conversion.
  const convScore = conversionScore({
    routingSignal: parsed.routing_signal,
    bucket:        bucketDecision.bucket,
    status:        userStatus,
  });

  // ── Save to DB — soft-fail (return signal even if save fails) ────────────
  // Attribution (P0): capture the UTM chain from the proxy-set cookies so
  // v1↔v2 cohort comparison is possible. Missing before — 201/225 extractions
  // had no attribution.
  let sourceUtm: Record<string, string> | null = null;
  try {
    const utmStore = await cookies();
    const utmObj: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_adset", "utm_ad", "utm_term", "fbclid", "gclid"]) {
      const v = utmStore.get(k)?.value;
      if (v) utmObj[k] = v.slice(0, 200);
    }
    if (Object.keys(utmObj).length > 0) sourceUtm = utmObj;
  } catch { /* attribution is best-effort */ }

  // Language rides inside the signal jsonb (no schema change needed): every
  // downstream reader — teasers, emails, member home, broadcast room — keys
  // its language off sig.language === "en".
  if (isV2En) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (parsed as any).language = "en";
  }

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
        is_test:      isTestRun,
        instrument_version: instrumentVersion,
        source_utm:   sourceUtm,
        ...(v2Route ? {
          key1_declared:  key1Declared,
          evidence_score: v2Evidence?.evidence ?? null,
          llm_evidence:   v2Evidence?.llm ?? null,
          regex_staff:    v2Evidence?.regex_staff ?? null,
          regex_money:    v2Evidence?.regex_money ?? null,
          distress_money: v2Evidence?.distress ?? null,
          truth_cell:     v2Route.cell,
          routed_ending:  v2Route.ending,
          phone_given:    phoneStr.length > 0,
        } : {}),
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

  // Locked-kaveret teasers (public card sentence + first script hook) —
  // generated in the background so the reveal is never delayed. Gated by env
  // until the visitor-state page ships; failures never touch the funnel.
  if (extractionId && process.env.KAVERET_RESULT_ENABLED === "1") {
    waitUntil(generateAndStoreResultTeasers(extractionId));
  }

  // ── Increment landing_headline A/B conversion counter ───────────────────
  // Only count when the visitor actually SAW the homepage copy in THIS
  // browser session. Reads `landing_home_session` — a session-scoped cookie
  // set by PageTracker.tsx the moment a visitor lands on /. The persistent
  // `ab_variant` cookie (30 days) was the wrong source: users with stale
  // buckets from old copy versions who land on /signal via email/quiz/
  // bookmark would still get counted, inflating conversions to >100% CVR.
  try {
    const cookieStore = await cookies();
    const homeVariant = cookieStore.get("landing_home_session")?.value;
    if (!isTestRun && (homeVariant === "A" || homeVariant === "B")) {
      await db.rpc("increment_experiment", {
        p_name:   "landing_headline",
        p_column: homeVariant === "A" ? "conversions_a" : "conversions_b",
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from("events").insert({
      user_id:  userId,
      type:     isV2En ? "SIGNAL_EXTRACTED_EN" : "SIGNAL_EXTRACTED",
      metadata: { source: authUser ? "authenticated" : "anonymous_gate", ...(isV2En ? { locale: "en" } : {}) },
      is_test:  isTestRun,
    });

    // Enqueue the FULL signal nurture chain (welcome 0h + day1/3/5/8/12). Each
    // job carries the bucket so the offer emails render the matched product.
    // "אסור למכור לכאב טרי": a crisis-floor lead gets no commercial chain at
    // all — the reading stays a gift, the human door handles the rest.
    const suppressChain = v2Route?.ending === "crisis_soft";
    const isConcierge  = v2Route?.ending === "concierge";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawSeqs } = suppressChain ? { data: [] } : await (db as any)
      .from("email_sequences")
      .select("id, subject, template_key, delay_hours")
      .eq("trigger_event", isV2En ? "SIGNAL_EXTRACTED_EN" : "SIGNAL_EXTRACTED")
      .eq("active", true);
    // Concierge (meeting-worthy) leads get the FULL nurture chain — every email
    // points at the ₪4,000 meeting (bucket forced to "strategy" below). They get
    // no ₪590 kriah offer, so there's no collision. Other v2 leads (hive /
    // pre-revenue) still get ONLY the welcome: their day1-12 would pitch the old
    // bucket and collide with the day-2 kriah ₪590 offer.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seqs = (isV2Run && !isConcierge)
      ? (rawSeqs ?? []).filter((q: any) =>
          q.template_key === (isV2En ? "signal_welcome_en" : "signal_welcome"))
      : rawSeqs;

    if (seqs && seqs.length) {
      // Pull email + name fresh so the job has what it needs even if the
      // anonymous path didn't keep it in scope.
      const { data: u } = await db
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .maybeSingle();

      if (u?.email) {
        const now = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = seqs.map((seq: any) => ({
          type:    "SEND_EMAIL",
          payload: {
            user_id:      userId,
            email:        u.email,
            name:         u.name ?? "",
            sequence_id:  seq.id,
            subject:      seq.subject,
            template_key: seq.template_key,
            // Concierge → the meeting track (signalOffer branches on bucket).
            bucket:       isConcierge ? "strategy" : bucketDecision.bucket,
            is_test:      isTestRun,
          },
          run_at: new Date(now + (seq.delay_hours ?? 0) * 60 * 60 * 1000).toISOString(),
          status: "pending",
        }));
        await db.from("jobs").insert(rows);

        // v2 core lane: the ₪590 offer arrives by email ~40h later (moved
        // off the ending screen by decision). Carries the user's sentence.
        if (v2Route?.ending === "hive") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: offerSeqs } = await (db as any)
            .from("email_sequences")
            .select("id, subject, template_key, delay_hours")
            .eq("trigger_event", isV2En ? "KRIAH_CORE_LEAD_EN" : "KRIAH_CORE_LEAD")
            .eq("active", true);
          if (offerSeqs && offerSeqs.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const offerRows = offerSeqs.map((seq: any) => ({
              type:    "SEND_EMAIL",
              payload: {
                user_id:         userId,
                email:           u.email,
                name:            u.name ?? "",
                sequence_id:     seq.id,
                subject:         seq.subject,
                template_key:    seq.template_key,
                signal_sentence: parsed.signal,
                is_test:         isTestRun,
              },
              run_at: new Date(now + (seq.delay_hours ?? 40) * 60 * 60 * 1000).toISOString(),
              status: "pending",
            }));
            await db.from("jobs").insert(offerRows);
          }
        }

        // Boiling leads get the concierge promise ("הדר תיצור קשר"). If no
        // meeting happens within 3 days, the SIGNAL_STRATEGY_LEAD fallback
        // email re-opens the conversation + carries כוורת האות so the lead
        // never cools with nothing to buy. Suppressed at send time if by
        // then they booked / were dismissed / purchased (see send-email.ts).
        if (v2Route ? v2Route.ending === "concierge" : bucketDecision.bucket === "strategy") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: fallbackSeqs } = await (db as any)
            .from("email_sequences")
            .select("id, subject, template_key, delay_hours")
            .eq("trigger_event", isV2En ? "SIGNAL_STRATEGY_LEAD_EN" : "SIGNAL_STRATEGY_LEAD")
            .eq("active", true);
          if (fallbackSeqs && fallbackSeqs.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fbRows = fallbackSeqs.map((seq: any) => ({
              type:    "SEND_EMAIL",
              payload: {
                user_id:      userId,
                email:        u.email,
                name:         u.name ?? "",
                sequence_id:  seq.id,
                subject:      seq.subject,
                template_key: seq.template_key,
                bucket:       isConcierge ? "strategy" : bucketDecision.bucket,
                is_test:      isTestRun,
              },
              run_at: new Date(now + (seq.delay_hours ?? 72) * 60 * 60 * 1000).toISOString(),
              status: "pending",
            }));
            await db.from("jobs").insert(fbRows);
          }
        }
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
    // v2 runs: the two-key routing (not the legacy bucket) owns the machine.
    // concierge = the boiling promise; hive = warm; pre_revenue/crisis = nurture
    // (crisis never gets commercial pressure — nurture temperature only marks
    // the row, the chain suppression already happened above).
    const temperature = v2Route
      ? (v2Route.ending === "concierge" ? "boiling"
        : v2Route.ending === "hive" ? "warm" : "nurture")
      : bucketToTemperature(bucketDecision.bucket);
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

    // Fire the real-time alert for a strategy/boiling lead OR any high
    // conversion-ease score (>= 8) — the latter also catches a strong lead that
    // wasn't routed to strategy (e.g. a mature, high-fit challenge lead).
    const isGold = convScore.score >= 8;
    // Isolation: test runs never page Alon+Hadar in real time.
    if (!isTestRun && (temperature === "boiling" || isGold)) {
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

        const answerLines = (isV2Run ? SIGNAL_QUESTIONS_V2 : SIGNAL_QUESTIONS)
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
    <p style="margin:8px 0 4px"><strong style="color:#9E7C3A">ציון קלות-המרה:</strong> <span style="font-weight:700;color:#222">${convScore.score}</span> <span style="color:#888">(${convScore.tier === "hot" ? "זהב" : convScore.tier === "warm" ? "חם" : "רגיל"})</span>${convScore.reasons.length ? ` &middot; <span style="color:#666;font-size:13px">${esc(convScore.reasons.join(" · "))}</span>` : ""}</p>
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
          subject: `${isGold ? "🏆 ליד זהב" : "🔥 ליד רותח"} (ציון ${convScore.score}) — ${name}${occupation ? ` (${occupation})` : ""}`,
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
    id:            extractionId,
    signal:        parsed,
    ...(v2Route ? { v2_ending: v2Route.ending } : {}),
    // Mirror the CAPI CompleteRegistration event_id so the browser pixel can
    // fire the same standard event with the same id → Meta dedups the pair.
    ...(v2Route ? { reg_event_id: `reg_${userId}` } : {}),
    generated_at:  generatedAt,
    gender:        genderForPrompt,
    bucket:        bucketDecision.bucket,
    // B2 — soft refine suggestion. Inert unless SIGNAL_FRAMING_ENABLED + a
    // high-confidence "raw" read. Derived flag only; raw maturity never leaks.
    suggest_refine: determineFraming(parsed.routing_signal).suggestRefine,
    // The unified home: when the kaveret switchover is on, the result screen
    // hands everything below the reveal to the lead's locked kaveret.
    ...(extractionId && process.env.KAVERET_RESULT_ENABLED === "1"
      ? { kaveret_url: kaveretLink(extractionId, isV2En ? "en" : "he") }
      : {}),
  });
}
