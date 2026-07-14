import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, fromNameFor } from "@/lib/email/templates";
import { suppressTestEmail } from "@/lib/isolation";
import { generateMagicLink, magicLinkFooterHtml } from "@/lib/email/magic-link";
import { pickPrimaryExtractionId } from "@/lib/signal/primary-extraction";
import { kaveretLink } from "@/lib/signal/kaveret-token";
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

  // ── Stop pitching once the lead is handled ──
  // Any offer/pitch email (the concierge meeting chain day5/8/12, the ₪590
  // kriah offer, the strategy fallback) backs off the moment Hadar owns the
  // lead — she opened a personal WhatsApp thread, booked a meeting, or dismissed
  // it — or the status advanced, or they already bought. An automated pitch
  // landing mid-conversation reads robotic; her thread owns the lead now.
  // (day1/day3 stay: they're value/story, and fire before Hadar can act.)
  const SUPPRESS_IF_HANDLED = new Set([
    "signal_day5", "signal_day8", "signal_day12",
    "kriah_hive_offer", "kriah_hive_offer_en",
    "signal_strategy_fallback", "signal_strategy_fallback_en",
  ]);
  if (SUPPRESS_IF_HANDLED.has(template_key)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: u } = await (supabase as any)
      .from("users")
      .select("status, handoff_stage")
      .eq("id", user_id)
      .maybeSingle();
    if (u?.handoff_stage === "meeting_booked" || u?.handoff_stage === "dismissed" || u?.handoff_stage === "whatsapp_sent") return;
    if (["booked", "buyer", "handled", "not_relevant"].includes(u?.status ?? "")) return;
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

  // ── Kaveret link (the unified home) ───────────────────────
  // When the kaveret switchover is on, signal emails stop carrying content
  // and point at the lead's locked kaveret: signed token link, computed
  // from their primary extraction. Best-effort — templates keep their
  // pre-kaveret CTAs when absent.
  // English templates (identified by the `_en` key suffix) get the ENGLISH
  // locked page (/en/kaveret/i). kriah_hive_offer_en is included even though
  // its Hebrew twin isn't a signal_ key — its CTA IS the kaveret page.
  // Hebrew behavior is unchanged.
  let kaveretUrl: string | undefined;
  const isEnTemplate = template_key.endsWith("_en");
  const wantsKaveret = template_key.startsWith("signal_") || template_key === "kriah_hive_offer_en";
  if (wantsKaveret && process.env.KAVERET_RESULT_ENABLED === "1") {
    try {
      const primary = await pickPrimaryExtractionId(supabase, user_id);
      if (primary) kaveretUrl = kaveretLink(primary.id, isEnTemplate ? "en" : undefined);
    } catch {
      // observability only
    }
  }

  // ── Render template ───────────────────────────────────────
  const rendered = renderTemplate(template_key, { ...payload, name, email, magicLink, kaveretUrl });
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
