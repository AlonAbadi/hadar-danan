import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, fromNameFor } from "@/lib/email/templates";
import { generateMagicLink, magicLinkFooterHtml } from "@/lib/email/magic-link";
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

  // ── Suppress signal offer emails once the lead has converted ──
  // The value/story emails (day1/day3) are harmless, but stop pitching the
  // product (day5/8/12) to someone who already bought.
  const SUPPRESS_IF_PURCHASED = new Set(["signal_day5", "signal_day8", "signal_day12"]);
  if (SUPPRESS_IF_PURCHASED.has(template_key)) {
    const { data: purchased } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user_id)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();
    if (purchased) return; // already a customer — don't keep selling
  }

  // ── Magic link (passwordless login) ───────────────────────
  // Generated BEFORE render so signal templates can use it as their main
  // "your area" CTA — signal-takers usually never set a password, so a raw
  // /account link is a wall they can't pass.
  const magicLink = await generateMagicLink(email, supabase);

  // ── Render template ───────────────────────────────────────
  const rendered = renderTemplate(template_key, { ...payload, name, email, magicLink });
  if (!rendered) throw new Error(`Unknown template key: ${template_key}`);

  // ── Inject magic link footer ──────────────────────────────
  const footer = magicLinkFooterHtml(magicLink);
  rendered.html = rendered.html.replace("</body>", `${footer}</body>`);

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
        href.startsWith("mailto:") ||
        href.includes("supabase.co/auth")
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
    from: `${fromNameFor(template_key)} <${FROM_ADDRESS}>`,
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
