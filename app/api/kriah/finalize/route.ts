/**
 * POST /api/kriah/finalize — the send-gate submit of the /kriah funnel.
 *
 * The email gate moved from after-the-snapshot to before-the-letter (the
 * gated asset is the personal letter, not the free snapshot). This endpoint
 * receives the gate's final values and:
 *   1. Patches the lead: name (fills/replaces the empty provisional one),
 *      occupation (the user-confirmed value — inferred by the engine,
 *      editable at the gate), and email (only for a provisional soft-capture
 *      lead that never purchased — never rewires a paying customer).
 *   2. Delivers the full reading by email through the SAME template + path
 *      as /api/signal/[id]/email-result (signal_result_full via Resend).
 *
 * Body: { extraction_id, email, name?, occupation? }
 * v2-only: refuses extractions that aren't instrument_version=v2_funnel.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { renderTemplate } from "@/lib/email/templates";
import { suppressTestEmail } from "@/lib/isolation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const FROM_NAME    = "הדר דנן";
const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`kriah-finalize:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות. נסו שוב בעוד שעה." }, { status: 429 });
  }

  let body: { extraction_id?: unknown; email?: unknown; name?: unknown; occupation?: unknown } = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const extractionId = typeof body.extraction_id === "string" ? body.extraction_id : "";
  const email        = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name         = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const occupation   = typeof body.occupation === "string" ? body.occupation.trim().slice(0, 200) : "";

  if (!extractionId) return NextResponse.json({ error: "missing extraction_id" }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "שם חייב להכיל לפחות 2 תווים" }, { status: 400 });

  const db = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, user_id, signal, is_test, instrument_version")
    .eq("id", extractionId)
    .maybeSingle();

  if (!ext) return NextResponse.json({ error: "האות לא נמצא" }, { status: 404 });
  if (ext.instrument_version !== "v2_funnel") {
    return NextResponse.json({ error: "לא נתמך" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user } = await (db as any)
    .from("users")
    .select("id, email, name, occupation")
    .eq("id", ext.user_id)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: "לא נמצא ליד" }, { status: 404 });

  // ── Patch the lead with the gate's final values ──────────────────────────
  const patch: Record<string, unknown> = {};
  if (name && name !== user.name) patch.name = name;
  // Occupation: the user-confirmed value wins (even over the inferred one).
  // Empty stays empty — never blocks.
  if (occupation && occupation !== user.occupation) patch.occupation = occupation;
  // Email correction is allowed ONLY for a lead that never paid — a typo'd
  // soft-capture is common; rewiring a customer account is not allowed here.
  if (email !== (user.email ?? "").toLowerCase()) {
    const { data: paid } = await db
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();
    if (paid) {
      return NextResponse.json({ error: "האימייל לא תואם לבעל האות" }, { status: 403 });
    }
    patch.email = email;
  }
  if (Object.keys(patch).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from("users").update(patch).eq("id", user.id);
  }

  // ── Deliver the reading — same template + path as email-result ───────────
  if (ext.is_test === true && suppressTestEmail(true, email)) {
    return NextResponse.json({ ok: true, suppressed: true });
  }

  const rendered = renderTemplate("signal_result_full", {
    name,
    email,
    signal: ext.signal,
  });
  if (!rendered) return NextResponse.json({ error: "תקלה בתבנית האימייל" }, { status: 500 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "שירות אימייל לא מוגדר" }, { status: 503 });

  try {
    const resend = new Resend(resendKey);
    const sendRes = await resend.emails.send({
      from:    `${FROM_NAME} <${FROM_ADDRESS}>`,
      to:      email,
      subject: rendered.subject,
      html:    rendered.html,
    });
    if (sendRes.error) {
      await db.from("error_logs").insert({
        context: "api/kriah/finalize — Resend",
        error:   String(sendRes.error.message ?? sendRes.error),
        payload: { extractionId },
      });
      // The letter still shows on screen — email failure is non-fatal.
      return NextResponse.json({ ok: true, emailed: false });
    }

    // Log to email_logs so the reading delivery shows up in /admin/email —
    // no sequence_id since this isn't a sequence send. Soft-fail.
    const { error: logErr } = await db.from("email_logs").insert({
      user_id:     user.id,
      sequence_id: null,
      status:      "sent",
      sent_at:     new Date().toISOString(),
    });
    if (logErr) {
      await db.from("error_logs").insert({
        context: "api/kriah/finalize — email_logs insert",
        error:   String(logErr.message ?? logErr),
        payload: { extractionId },
      });
    }
  } catch (e) {
    await db.from("error_logs").insert({
      context: "api/kriah/finalize — send threw",
      error:   String(e),
      payload: { extractionId },
    });
    return NextResponse.json({ ok: true, emailed: false });
  }

  return NextResponse.json({ ok: true, emailed: true });
}
