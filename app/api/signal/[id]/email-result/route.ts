/**
 * POST /api/signal/[id]/email-result
 *
 * Sends the full signal output to the owner's email. Triggered by the
 * "שלח לי את כל האות באימייל" button on the /signal result page. Immediate
 * send via Resend — no jobs queue delay since the user clicked just now.
 *
 * Security model:
 * - Anonymous: must POST `{ email }` matching the email on file for this
 *   extraction's user. Prevents anyone with the UUID from emailing the
 *   signal to a third party.
 * - Authenticated: the email must match the signed-in user's email.
 *
 * Rate-limit: 5/hour per extraction id — generous; the user may legitimately
 * resend (lost the email, forwarding to a partner) but not infinitely.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { suppressTestEmail } from "@/lib/isolation";
import { createServerClient } from "@/lib/supabase/server";
import { renderTemplate, FROM_NAME } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // Rate-limit per extraction id (covers the same lead spamming the button)
  if (!rateLimit(`signal-email:${id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי שליחות. נסה שוב בעוד שעה." }, { status: 429 });
  }

  let body: { email?: unknown } = {};
  try { body = await req.json(); } catch {}
  const claimedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const supabase = createServerClient();

  const { data: row, error: fetchErr } = await safeFrom(supabase, "signal_extractions")
    .select("id, user_id, signal, is_test")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "האות לא נמצא" }, { status: 404 });
  }

  // v2 isolation: test extractions use the allowlist rule like every send
  const { data: user } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", row.user_id)
    .maybeSingle();

  if (row.is_test === true && suppressTestEmail(true, user?.email)) {
    return NextResponse.json({ ok: true, suppressed: true });
  }

  if (!user?.email) {
    return NextResponse.json({ error: "לא נמצא נמען לשליחה" }, { status: 404 });
  }

  // Email must match the owner — defense against UUID-leaks routing the
  // signal elsewhere. Comparison is case-insensitive.
  if (!claimedEmail || claimedEmail !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "האימייל לא תואם לבעל האות" },
      { status: 403 },
    );
  }

  const rendered = renderTemplate("signal_result_full", {
    name:   user.name ?? "",
    email:  user.email,
    signal: row.signal,
  });

  if (!rendered) {
    return NextResponse.json({ error: "תקלה בתבנית האימייל" }, { status: 500 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "שירות אימייל לא מוגדר" }, { status: 503 });
  }

  try {
    const resend = new Resend(resendKey);
    const sendRes = await resend.emails.send({
      from:    `${FROM_NAME} <${FROM_ADDRESS}>`,
      to:      user.email,
      subject: rendered.subject,
      html:    rendered.html,
    });

    if (sendRes.error) {
      await supabase.from("error_logs").insert({
        context: "api/signal/[id]/email-result — Resend",
        error:   String(sendRes.error.message ?? sendRes.error),
        payload: { extractionId: id, userId: row.user_id },
      });
      return NextResponse.json({ error: "לא הצלחנו לשלוח. נסה שוב בעוד רגע." }, { status: 502 });
    }

    // Log to email_logs so it shows up in /admin/email — no sequence_id since
    // this isn't a sequence send. Soft-fail; doesn't block the response.
    try {
      await safeFrom(supabase, "email_logs").insert({
        user_id:     row.user_id,
        sequence_id: null,
        status:      "sent",
        subject:     rendered.subject,
        sent_at:     new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/email-result threw",
      error:   String(e),
      payload: { extractionId: id, userId: row.user_id },
    });
    return NextResponse.json({ error: "תקלה בשליחה" }, { status: 500 });
  }
}
