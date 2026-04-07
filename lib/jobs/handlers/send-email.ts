import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, FROM_NAME } from "@/lib/email/templates";
import type { Database } from "@/lib/supabase/types";

const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "onboarding@resend.dev";

export interface SendEmailPayload {
  user_id: string;
  email: string;
  name: string;
  sequence_id: string;
  subject: string;
  template_key: string;
  [key: string]: unknown; // extra context forwarded to the template
}

export async function handleSendEmail(
  payload: SendEmailPayload,
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { user_id, email, name, sequence_id, template_key } = payload;

  // ── Dedup: skip if already sent for this user + sequence ──
  const { data: existing } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", user_id)
    .eq("sequence_id", sequence_id)
    .eq("status", "sent")
    .maybeSingle();

  if (existing) return; // already sent - idempotent

  // ── Render template ───────────────────────────────────────
  const rendered = renderTemplate(template_key, { ...payload, name, email });
  if (!rendered) throw new Error(`Unknown template key: ${template_key}`);

  // ── Send via Resend ───────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to: email,
    subject: rendered.subject,
    html: rendered.html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);

  // ── Log the send ─────────────────────────────────────────
  await supabase.from("email_logs").insert({
    user_id,
    sequence_id,
    status: "sent",
    sent_at: new Date().toISOString(),
  });
}
