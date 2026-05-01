import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, FROM_NAME } from "@/lib/email/templates";
import type { Database } from "@/lib/supabase/types";

const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

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

  // ── Wrap all links through click tracker ─────────────────
  // Click = confirmed open. More reliable than pixel for text-only emails.
  const uid = encodeURIComponent(user_id);
  const sid = encodeURIComponent(sequence_id);
  const trackedHtml = rendered.html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_, href: string) => {
      // Don't wrap unsubscribe, WhatsApp, or mailto links
      if (
        href.includes("/unsubscribe") ||
        href.includes("wa.me") ||
        href.startsWith("mailto:")
      ) {
        return `href="${href}"`;
      }
      const clickUrl = `${APP_URL}/api/email/click?uid=${uid}&sid=${sid}&url=${encodeURIComponent(href)}`;
      return `href="${clickUrl}"`;
    }
  );

  // ── Send via Resend ───────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to: email,
    subject: rendered.subject,
    html: trackedHtml,
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
