import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

/**
 * First-party click tracker for the legacy reactivation campaign.
 * Resend's click tracking is deliberately OFF (link rewriting hurts
 * deliverability and hides the destination); instead every CTA in the
 * campaign emails points here, we record the click with the exact
 * contact, and 302 the visitor on to /signal with the full UTM chain.
 *
 * /api/legacy/c?e=<base64url email>&t=<hmac>&w=<wave>&n=<email#>
 *
 * The visitor must NEVER be blocked: on any validation failure we still
 * redirect to /signal (untracked) — a broken link in 35K sent emails is
 * worse than a lost datapoint.
 */

function sign(email: string): string {
  return createHmac("sha256", process.env.CRON_SECRET ?? "")
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const wave = (p.get("w") ?? "0").replace(/\D/g, "").slice(0, 3) || "0";
  const emailNum = (p.get("n") ?? "1").replace(/\D/g, "").slice(0, 1) || "1";
  const dest = new URL("https://www.beegood.online/signal");
  dest.searchParams.set("utm_source", "legacy");
  dest.searchParams.set("utm_medium", "email");
  dest.searchParams.set("utm_campaign", `reactivation-w${wave}`);
  dest.searchParams.set("utm_content", `email${emailNum}`);

  try {
    const email = Buffer.from(p.get("e") ?? "", "base64url").toString("utf8").trim().toLowerCase();
    const token = p.get("t") ?? "";
    const expected = Buffer.from(sign(email));
    const got = Buffer.from(token);
    if (email && expected.length === got.length && timingSafeEqual(expected, got)) {
      const supabase = createServerClient();
      await supabase.from("events").insert({
        type: "LEGACY_EMAIL_CLICKED",
        metadata: { email, wave: Number(wave), email_num: Number(emailNum), src: "first-party", at: new Date().toISOString() },
      });
    }
  } catch {
    // tracking is best-effort; the redirect below always happens
  }

  return NextResponse.redirect(dest, 302);
}
