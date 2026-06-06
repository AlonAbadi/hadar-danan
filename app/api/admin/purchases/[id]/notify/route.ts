/**
 * POST /api/admin/purchases/[id]/notify
 *
 * Re-send the "💰 עסקה חדשה" admin alert for a specific purchase.
 * For one-off recovery when the original webhook notification was lost
 * (Resend rejection, network blip, code bug that's since been fixed, etc.).
 *
 * Basic-auth gated like the rest of /api/admin/*.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buildPurchaseEmail } from "@/app/api/cardcom/webhook/route";
import { Resend } from "resend";

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

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: purchaseId } = await ctx.params;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchase, error: purchaseErr } = await (supabase as any)
    .from("purchases")
    .select("id, user_id, product, amount, status, invoice_link, invoice_number")
    .eq("id", purchaseId)
    .single();

  if (purchaseErr || !purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }
  if (purchase.status !== "completed") {
    return NextResponse.json({ error: `Purchase is ${purchase.status}, not completed` }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, email, phone")
    .eq("id", purchase.user_id)
    .single();

  const { subject, html } = buildPurchaseEmail({
    userId:        purchase.user_id,
    name:          user?.name ?? null,
    email:         user?.email ?? null,
    phone:         user?.phone ?? null,
    product:       purchase.product,
    amount:        purchase.amount,
    invoiceLink:   purchase.invoice_link ?? null,
    invoiceNumber: purchase.invoice_number ?? null,
  });

  try {
    const result = await new Resend(apiKey).emails.send({
      from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
      to:   ["alonabadi9@gmail.com", "hadard1113@gmail.com"],
      subject: `[שליחה חוזרת] ${subject}`,
      html,
    });
    if (result.error) {
      return NextResponse.json({
        ok: false,
        error: `Resend rejected: ${result.error.name ?? "unknown"} — ${result.error.message ?? ""}`,
      }, { status: 502 });
    }
    return NextResponse.json({ ok: true, resendId: result.data?.id });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
