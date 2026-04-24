/**
 * POST /api/admin/atelier/orchestrate
 *
 * ProjectManagerAgent — orchestrates the full Atelier site-creation pipeline
 * using Claude's tool_use agentic loop.
 *
 * State machine advanced per call:
 *   pending → analyzing → onboarding_sent
 *   onboarding_sent → (check) → onboarding_complete
 *   onboarding_complete → generating → awaiting_palette
 *   awaiting_palette → generating_code → awaiting_approval
 *   awaiting_approval → (admin triggers /deploy separately)
 *
 * Stops and notifies admin whenever human input is required.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { validateClientTs } from "@/lib/validateClientTs";

export const maxDuration = 300;

// ── Auth ──────────────────────────────────────────────────────────────────────

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

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_application",
    description: "Read the full application record from the database including all fields, pipeline_status, and orchestration_log",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string", description: "The application UUID" },
      },
      required: ["application_id"],
    },
  },
  {
    name: "update_status",
    description: "Update pipeline_status and append a timestamped message to orchestration_log",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
        status: {
          type: "string",
          enum: ["analyzing", "onboarding_sent", "onboarding_complete", "generating", "awaiting_palette", "generating_code", "awaiting_approval", "deploying", "deployed", "live", "error"],
        },
        log_message: { type: "string", description: "Short human-readable message describing this step" },
      },
      required: ["application_id", "status", "log_message"],
    },
  },
  {
    name: "analyze_lead",
    description: "Run Claude lead analysis (fit score, niche, strengths). Saves result to DB.",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
      },
      required: ["application_id"],
    },
  },
  {
    name: "send_onboarding_email",
    description: "Send the onboarding form email to the client. Reads email from DB. Fails if no email is set.",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
      },
      required: ["application_id"],
    },
  },
  {
    name: "check_onboarding_status",
    description: "Check if the client has submitted their onboarding form. Returns submitted=true/false and when.",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
      },
      required: ["application_id"],
    },
  },
  {
    name: "generate_content",
    description: "Run Claude content generation (hero, about, palettes, emails, quiz). Saves to DB. Takes ~45 seconds.",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
      },
      required: ["application_id"],
    },
  },
  {
    name: "generate_client_ts",
    description: "Generate the complete lib/client.ts file using the saved content and selected palette. Takes ~45 seconds.",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
      },
      required: ["application_id"],
    },
  },
  {
    name: "validate_client_ts",
    description: "Validate a generated client.ts string — checks for FILL placeholders, TODO tokens, required structure, and WhatsApp format.",
    input_schema: {
      type: "object" as const,
      properties: {
        code: { type: "string", description: "The full TypeScript source to validate" },
      },
      required: ["code"],
    },
  },
  {
    name: "save_generated_code",
    description: "Save the validated generated client.ts code to the database",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
        code: { type: "string" },
      },
      required: ["application_id", "code"],
    },
  },
  {
    name: "notify_admin",
    description: "Send an email notification to the BeeGood admin",
    input_schema: {
      type: "object" as const,
      properties: {
        subject: { type: "string" },
        message: { type: "string", description: "HTML or plain-text body" },
      },
      required: ["subject", "message"],
    },
  },
  {
    name: "finish_orchestration",
    description: "End the orchestration loop. Call this when a stage is complete, when human input is needed, or on error.",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string" },
        summary: { type: "string", description: "One or two sentences summarising what was done this run" },
        paused_for_human: { type: "boolean", description: "true if stopped because admin action is needed" },
        next_action: { type: "string", description: "What the admin should do next (if paused_for_human is true)" },
      },
      required: ["application_id", "summary", "paused_for_human"],
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the ProjectManagerAgent for BeeGood Atelier — an internal tool that creates personalised Next.js sales websites for Israeli influencer/coach clients.

Your task: orchestrate the site-creation pipeline by advancing the application through these states:
  pending → analyzing → onboarding_sent
  onboarding_sent → onboarding_complete
  onboarding_complete → generating → awaiting_palette
  awaiting_palette → generating_code → awaiting_approval

Strict rules:
1. Always start with read_application to get the current pipeline_status and all data.
2. Only execute the step that corresponds to the current state — never skip states.
3. After EVERY state-changing tool call, immediately call update_status with the new status.
4. When human input is required, call notify_admin, then call finish_orchestration with paused_for_human=true and a clear next_action for the admin.
5. If any tool returns an error, call update_status with status="error" and the error in log_message, then call finish_orchestration.
6. Never invent or modify content yourself — only use the provided tools.

State machine behaviour:
- pending:
    1. update_status → analyzing
    2. analyze_lead
    3. Check app.email: if missing → finish_orchestration(paused_for_human=true, next_action="Enter client email in admin UI, then run orchestrate again")
    4. send_onboarding_email
    5. update_status → onboarding_sent
    6. notify_admin: "Onboarding email sent to {name}"
    7. finish_orchestration(paused_for_human=true, next_action="Wait for client to submit onboarding form, then run orchestrate again")

- onboarding_sent:
    1. check_onboarding_status
    2. If NOT submitted: finish_orchestration(paused_for_human=true, next_action="Client has not submitted the form yet. Try again later.")
    3. If submitted: update_status → onboarding_complete, then continue to onboarding_complete logic

- onboarding_complete:
    1. update_status → generating
    2. generate_content (this calls Claude and saves results — takes ~45s, be patient)
    3. update_status → awaiting_palette
    4. notify_admin: "Color palettes are ready for {name}. Please select a palette in the admin UI and run orchestrate again."
    5. finish_orchestration(paused_for_human=true, next_action="Select a color palette in the admin UI, then run orchestrate again")

- awaiting_palette:
    1. Check app.selected_palette: if missing → finish_orchestration(paused_for_human=true, next_action="Select a color palette in the admin UI, then run orchestrate again")
    2. update_status → generating_code
    3. generate_client_ts (this calls Claude and generates the full client.ts — takes ~45s)
    4. validate_client_ts on the returned code
    5. If validation fails: try generate_client_ts once more, then validate again. If still failing: update_status → error, finish_orchestration.
    6. save_generated_code
    7. update_status → awaiting_approval
    8. notify_admin: "client.ts is ready for {name}. Please review and deploy from the admin UI."
    9. finish_orchestration(paused_for_human=true, next_action="Review the generated client.ts in the admin UI and click Deploy")

- awaiting_approval / deploying / deployed / live:
    1. notify_admin current status
    2. finish_orchestration(paused_for_human=false, summary="Pipeline already at {status}")

- error:
    1. notify_admin about the error
    2. finish_orchestration(paused_for_human=true, next_action="Check error_detail in DB and fix before re-running")`;

// ── Tool executor ─────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createServerClient>;

async function executeTool(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>,
  supabase: SupabaseClient,
  baseUrl: string,
  authHeader: string,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  switch (name) {

    case "read_application": {
      const { data, error } = await sb
        .from("atelier_applications")
        .select("*")
        .eq("id", input.application_id)
        .single();
      if (error) return { error: error.message };
      return { application: data };
    }

    case "update_status": {
      const { data: current } = await sb
        .from("atelier_applications")
        .select("orchestration_log")
        .eq("id", input.application_id)
        .single();

      const existing: unknown[] = Array.isArray(current?.orchestration_log)
        ? current.orchestration_log
        : [];
      const newEntry = { status: input.status, msg: input.log_message, ts: new Date().toISOString() };

      const { error } = await sb
        .from("atelier_applications")
        .update({
          pipeline_status: input.status,
          orchestration_log: [...existing, newEntry],
          ...(input.status === "error" ? { error_detail: input.log_message } : {}),
        })
        .eq("id", input.application_id);

      if (error) return { error: error.message };
      return { ok: true, status: input.status };
    }

    case "analyze_lead": {
      const { data: app } = await sb
        .from("atelier_applications")
        .select("name, instagram, story")
        .eq("id", input.application_id)
        .single();

      if (!app) return { error: "Application not found" };

      const res = await fetch(`${baseUrl}/api/admin/atelier/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: authHeader },
        body: JSON.stringify({ name: app.name, instagram: app.instagram, story: app.story }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "analyze failed" };

      // Save analysis to DB
      await sb
        .from("atelier_applications")
        .update({ ai_analysis: json.analysis })
        .eq("id", input.application_id);

      return { ok: true, analysis: json.analysis };
    }

    case "send_onboarding_email": {
      const { data: app } = await sb
        .from("atelier_applications")
        .select("email")
        .eq("id", input.application_id)
        .single();

      if (!app?.email) {
        return { error: "No email address found for this application. Admin must enter the client email first." };
      }

      const res = await fetch(`${baseUrl}/api/admin/atelier/send-onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: authHeader },
        body: JSON.stringify({ application_id: input.application_id, email: app.email }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "send-onboarding failed" };
      return { ok: true, email: app.email };
    }

    case "check_onboarding_status": {
      const { data: app } = await sb
        .from("atelier_applications")
        .select("onboarding_submitted_at, niche, target_audience")
        .eq("id", input.application_id)
        .single();

      const submitted = !!app?.onboarding_submitted_at || !!app?.niche;
      return {
        submitted,
        onboarding_submitted_at: app?.onboarding_submitted_at ?? null,
        niche: app?.niche ?? null,
      };
    }

    case "generate_content": {
      const { data: app } = await sb
        .from("atelier_applications")
        .select("*")
        .eq("id", input.application_id)
        .single();

      if (!app) return { error: "Application not found" };
      if (!app.niche) return { error: "niche is required — client must submit onboarding form first" };

      const res = await fetch(`${baseUrl}/api/admin/atelier/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: authHeader },
        body: JSON.stringify({
          application_id: app.id,
          name: app.name,
          niche: app.niche,
          target_audience: app.target_audience ?? "",
          tone_keywords: app.tone_keywords ?? "",
          products: app.products ?? [],
          testimonials: app.testimonials ?? [],
          modules: app.modules ?? [],
          whatsapp: app.whatsapp ?? "",
          business_type: app.business_type ?? "",
          business_id: app.business_id ?? "",
          business_address: app.business_address ?? "",
          physical_products: app.physical_products ?? [],
          documents: app.documents ?? [],
        }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "generate failed" };
      return { ok: true, palette_count: json.generated?.palettes?.length ?? 0 };
    }

    case "generate_client_ts": {
      const { data: app } = await sb
        .from("atelier_applications")
        .select("*")
        .eq("id", input.application_id)
        .single();

      if (!app) return { error: "Application not found" };
      if (!app.generated_content) return { error: "No generated_content found — run generate_content first" };
      if (!app.selected_palette) return { error: "No selected_palette — admin must select a color palette first" };

      const abort = new AbortController();
      const abortTimer = setTimeout(() => abort.abort(), 240_000);
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/api/admin/atelier/generate-client`, {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json", authorization: authHeader },
          body: JSON.stringify({
          app: {
            id: app.id,
            name: app.name,
            instagram: app.instagram,
            niche: app.niche,
            target_audience: app.target_audience ?? "",
            tone_keywords: app.tone_keywords ?? "",
            whatsapp: app.whatsapp ?? "",
            business_type: app.business_type ?? "",
            business_id: app.business_id ?? "",
            domain: app.domain ?? "",
            products: app.products ?? [],
            modules: app.modules ?? [],
            testimonials: app.testimonials ?? [],
            documents: app.documents ?? [],
          },
          generated: app.generated_content,
          selectedPalette: app.selected_palette,
        }),
      });
      } catch (err: unknown) {
        clearTimeout(abortTimer);
        const msg = err instanceof Error ? err.message : String(err);
        return { error: `generate-client timed out or failed: ${msg}` };
      }
      clearTimeout(abortTimer);
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "generate-client failed" };
      return { ok: true, code: json.code };
    }

    case "validate_client_ts": {
      const result = validateClientTs(input.code as string);
      return result;
    }

    case "save_generated_code": {
      const { error } = await sb
        .from("atelier_applications")
        .update({
          generated_client_ts: input.code,
          generated_client_ts_at: new Date().toISOString(),
        })
        .eq("id", input.application_id);

      if (error) return { error: error.message };
      return { ok: true };
    }

    case "notify_admin": {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) return { error: "ADMIN_EMAIL env var not set" };

      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

      const { error } = await resend.emails.send({
        from: `BeeGood Atelier <${fromEmail}>`,
        to: adminEmail,
        subject: input.subject as string,
        html: `<div dir="rtl" style="font-family:sans-serif;padding:20px;max-width:600px">
          <h2 style="color:#C9964A">BeeGood Atelier</h2>
          <p style="white-space:pre-wrap;line-height:1.7">${(input.message as string).replace(/</g, "&lt;")}</p>
          <hr style="border:1px solid #eee;margin:20px 0"/>
          <p style="color:#999;font-size:12px">BeeGood Atelier · beegood.online</p>
        </div>`,
      });
      if (error) return { error: `Resend error: ${JSON.stringify(error)}` };
      return { ok: true, sent_to: adminEmail };
    }

    case "finish_orchestration": {
      return {
        done: true,
        summary: input.summary,
        paused_for_human: input.paused_for_human,
        next_action: input.next_action ?? null,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const body = await req.json();
  const { application_id } = body as { application_id?: string };
  if (!application_id) {
    return NextResponse.json({ error: "Missing application_id" }, { status: 400 });
  }

  const supabase = createServerClient();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const baseUrl   = new URL(req.url).origin;
  const authHeader = req.headers.get("authorization") ?? "";

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Orchestrate the Atelier pipeline for application ID: ${application_id}. Start by calling read_application to get the full data and current pipeline_status, then follow the state machine rules to advance the pipeline.`,
    },
  ];

  let finalResult: Record<string, unknown> = { ok: true, iterations: 0, summary: "" };
  let iterations = 0;

  for (let i = 0; i < 20; i++) {
    iterations = i + 1;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") break;
    if (response.stop_reason !== "tool_use") break;

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let finished = false;

    for (const toolUse of toolUses) {
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
        supabase,
        baseUrl,
        authHeader,
      );

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });

      if (toolUse.name === "finish_orchestration") {
        const r = result as Record<string, unknown>;
        finalResult = {
          ok: true,
          iterations,
          summary: r.summary ?? "",
          paused_for_human: r.paused_for_human ?? false,
          next_action: r.next_action ?? null,
        };
        finished = true;
      }
    }

    messages.push({ role: "user", content: toolResults });
    if (finished) break;
  }

  finalResult.iterations = iterations;
  return NextResponse.json(finalResult);
}
