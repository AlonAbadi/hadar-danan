/**
 * Anthropic credit exhaustion alert.
 *
 * When the signal engine's Claude calls fail with "credit balance is too low",
 * the signal engine silently stops producing signals (it's happened twice). This
 * emails Alon the MOMENT it runs dry — deduped to once / 12h so a burst of
 * failures doesn't spam. Fully non-fatal: never throws into the caller.
 */

import { Resend } from "resend";
import type { createServerClient } from "@/lib/supabase/server";

const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

/** True when an error is the Anthropic "out of credit" 400. */
export function isCreditError(err: unknown): boolean {
  const s = String(err ?? "").toLowerCase();
  return s.includes("credit balance is too low") || s.includes("credit balance too low");
}

export async function alertCreditExhausted(
  supabase: ReturnType<typeof createServerClient>,
  context: string,
): Promise<void> {
  try {
    const to     = process.env.ADMIN_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (!to || !apiKey) return;

    // Dedup — already alerted in the last 12h? (marker row in error_logs)
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recent } = await (supabase as any)
      .from("error_logs")
      .select("id")
      .eq("context", "signal-credit-alert")
      .gte("created_at", since)
      .limit(1);
    if (recent && recent.length) return;

    // Write the marker FIRST so concurrent failures don't double-send.
    await supabase.from("error_logs").insert({
      context: "signal-credit-alert",
      error:   `Anthropic credit exhausted (first seen at ${context})`,
    });

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from:    `הדר דנן · התראת מערכת <${FROM_ADDRESS}>`,
      to,
      subject: "🔴 דחוף — הקרדיט באנטרופיק נגמר · מנוע האות מושבת",
      html: `<!DOCTYPE html><html dir="rtl" lang="he"><body style="margin:0;background:#0D1018;font-family:Arial,sans-serif;padding:24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <table role="presentation" width="560" style="max-width:560px;background:#141820;border:1px solid #E0726A;border-radius:14px"><tr><td style="padding:26px 28px;direction:rtl;color:#EDE9E1">
            <div style="font-size:20px;font-weight:800;color:#E0726A;margin-bottom:10px">🔴 הקרדיט באנטרופיק נגמר</div>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.7">מנוע האות מפסיק לייצר אותות ברגע זה — משתמשים שממלאים את השאלון לא מקבלים את האות שלהם.</p>
            <p style="margin:0 0 16px;font-size:14px;color:#9E9990;line-height:1.7">זוהתה שגיאת <b style="color:#EDE9E1">credit balance too low</b> ב-${context}.</p>
            <a href="https://console.anthropic.com/settings/billing" style="display:inline-block;background:linear-gradient(135deg,#E8B94A,#C9964A);color:#0D1018;font-weight:800;font-size:15px;text-decoration:none;padding:12px 24px;border-radius:999px">לטעינת קרדיט באנטרופיק ←</a>
            <p style="margin:16px 0 0;font-size:11px;color:#9E9990">התראה חד-פעמית (עד אחת ל-12 שעות). תוקן? התעלם.</p>
          </td></tr></table>
        </td></tr></table>
      </body></html>`,
    });
  } catch {
    // non-fatal — never break the caller's error path
  }
}
