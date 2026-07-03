import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, fromNameFor } from "@/lib/email/templates";
import { suppressTestEmail } from "@/lib/isolation";
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

  // ── Isolation valve (v2 test runs) — MUST stay first: the magic-link call
  // below creates a real auth.users row, so a test job may not get past here.
  if (suppressTestEmail(payload.is_test, email)) {
    console.warn(`[isolation] suppressed test email ${template_key} → ${email}`);
    return;
  }

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

  // ── Suppress the boiling-lead fallback once it's no longer needed ──
  // signal_strategy_fallback exists ONLY for a strategy lead who, 3 days in,
  // still hasn't moved: skip it if a meeting was booked, the lead was
  // dismissed, the status advanced past "lead machine" territory, or they
  // already bought something (any purchase means the funnel worked).
  if (template_key === "signal_strategy_fallback") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: u } = await (supabase as any)
      .from("users")
      .select("status, handoff_stage")
      .eq("id", user_id)
      .maybeSingle();
    if (u?.handoff_stage === "meeting_booked" || u?.handoff_stage === "dismissed") return;
    // Hadar already opened a personal WhatsApp thread — an automated email
    // landing mid-conversation reads robotic. Her thread owns the lead now.
    if (u?.handoff_stage === "whatsapp_sent") return;
    if (["booked", "buyer", "handled", "not_relevant"].includes(u?.status ?? "")) return;
    const { data: purchased } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user_id)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();
    if (purchased) return;
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

  // ── UTM tagging for internal links ────────────────────────
  // So clicks from emails are attributed in /admin/acquisition. utm_content =
  // template_key, so we see WHICH email in the chain drove the visit/conversion.
  const isSignal = template_key.startsWith("signal_");
  const addUtm = (href: string): string => {
    if (!href.startsWith(APP_URL)) return href; // only our own pages
    if (href.includes("utm_source=")) return href; // already tagged — don't double
    const params = new URLSearchParams({
      utm_source:   "email",
      utm_medium:   "email",
      utm_campaign: isSignal ? "signal_nurture" : "lifecycle",
      utm_content:  template_key, // which email in the chain drove the visit
    });
    return href + (href.includes("?") ? "&" : "?") + params.toString();
  };

  // Asset URLs (web-font stylesheet, images) must never be wrapped — email
  // clients prefetch them, which otherwise fires fake EMAIL_OPENED/LINK_CLICKED
  // and wrongly promotes the recipient lead→engaged.
  const isAsset = (href: string): boolean =>
    href.includes("fonts.googleapis") ||
    href.includes("fonts.gstatic") ||
    /\.(css|js|woff2?|ttf|otf|eot|png|jpe?g|svg|gif|ico|webp)(\?|$)/i.test(href);

  // ── Wrap all links through click tracker ─────────────────
  // Click = confirmed open. More reliable than pixel for text-only emails.
  const uid = encodeURIComponent(user_id);
  const sid = encodeURIComponent(sequence_id);
  const trackedHtml = rendered.html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_, href: string) => {
      // Don't wrap unsubscribe, WhatsApp, mailto, auth, or asset links
      if (
        href.includes("/unsubscribe") ||
        href.includes("wa.me") ||
        href.startsWith("mailto:") ||
        href.includes("supabase.co/auth") ||
        isAsset(href)
      ) {
        return `href="${href}"`;
      }
      const dest = addUtm(href);
      const clickUrl = `${APP_URL}/api/email/click?uid=${uid}&sid=${sid}&url=${encodeURIComponent(dest)}`;
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
