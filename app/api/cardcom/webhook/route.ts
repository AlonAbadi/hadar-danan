/**
 * /api/cardcom/webhook
 *
 * Receives payment confirmation from Cardcom.
 * Supports two modes:
 *
 * GET — new verification flow (Cardcom appends ?lowprofilecode=... to our IndicatorUrl)
 *   1. Receive lowprofilecode from Cardcom
 *   2. Call BillGoldGetLowProfileIndicator.aspx to verify payment independently
 *   3. Check OperationResponse=0
 *   4. Fulfill purchase + fire events
 *
 * POST — legacy flow (Cardcom posts full transaction data as form-encoded body)
 *   Kept for backward compatibility with any existing Cardcom configuration.
 *
 * CRITICAL: Always return HTTP 200 to Cardcom even on errors — any non-200
 * causes Cardcom to retry up to 7 times.
 *
 * Idempotent — safe to receive the same webhook multiple times.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// ── Shared fulfillment logic ───────────────────────────────────────────────

async function fulfillPurchase(
  supabase:            ReturnType<typeof createServerClient>,
  purchaseId:          string,
  internalDealNumber:  string | undefined,
  invoiceNumber:       string | null,
): Promise<{ ok: boolean; alreadyProcessed?: boolean }> {
  // Idempotency: skip if InternalDealNumber already recorded
  if (internalDealNumber) {
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("cardcom_ref", internalDealNumber)
      .maybeSingle();

    if (existing) return { ok: true, alreadyProcessed: true };
  }

  // Mark purchase as completed
  const { data: purchase, error: purchaseErr } = await supabase
    .from("purchases")
    .update({
      status:      "completed",
      cardcom_ref: internalDealNumber ?? null,
    })
    .eq("id", purchaseId)
    .eq("status", "pending")   // only update pending — prevents overwriting refunds
    .select("id, user_id, product, amount")
    .single();

  if (purchaseErr || !purchase) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook fulfillPurchase",
      error:   purchaseErr?.message ?? "Purchase not found or not pending",
      payload: { purchaseId, internalDealNumber },
    });
    return { ok: false };
  }

  // Save invoice number separately (column added in migration 018,
  // not yet in generated types — cast as any)
  if (invoiceNumber) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("purchases")
      .update({ invoice_number: invoiceNumber })
      .eq("id", purchase.id);
  }

  // Fire PURCHASE_COMPLETED — drives state machine + downstream sequences
  await supabase.from("events").insert({
    user_id:  purchase.user_id,
    type:     "PURCHASE_COMPLETED",
    metadata: {
      product:      purchase.product,
      amount:       purchase.amount,
      cardcom_ref:  internalDealNumber,
    },
  });

  // Fire product-specific event so per-product email sequences trigger
  const productEvent =
    purchase.product === "challenge_197" ? "CHALLENGE_PURCHASED" :
    purchase.product === "workshop_1080" ? "WORKSHOP_PURCHASED"  :
    purchase.product === "course_1800"   ? "COURSE_PURCHASED"    : null;

  if (productEvent) {
    await supabase.from("events").insert({
      user_id:  purchase.user_id,
      type:     productEvent,
      metadata: { product: purchase.product, amount: purchase.amount },
    });
  }

  // Enqueue purchase confirmation email (delay_hours=0, trigger=PURCHASE_COMPLETED)
  const { data: confirmSeq } = await supabase
    .from("email_sequences")
    .select("id, subject, template_key")
    .eq("trigger_event", "PURCHASE_COMPLETED")
    .eq("delay_hours", 0)
    .eq("active", true)
    .maybeSingle();

  if (confirmSeq) {
    const { data: user } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", purchase.user_id)
      .single();

    if (user) {
      await supabase.from("jobs").insert({
        type:    "SEND_EMAIL",
        payload: {
          user_id:      purchase.user_id,
          email:        user.email,
          name:         user.name ?? "",
          sequence_id:  confirmSeq.id,
          subject:      confirmSeq.subject,
          template_key: confirmSeq.template_key,
          product:      purchase.product,
          amount:       purchase.amount,
        },
        run_at: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  // Advance state machine: high_intent → buyer
  await supabase
    .from("users")
    .update({ status: "buyer" })
    .eq("id", purchase.user_id)
    .eq("status", "high_intent");

  return { ok: true };
}

// ── GET handler — verification flow ───────────────────────────────────────
// Cardcom appends ?lowprofilecode=<code> to our IndicatorUrl
// We independently verify with BillGoldGetLowProfileIndicator.aspx

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Cardcom sends lowprofilecode (lowercase) appended to our IndicatorUrl
  const lowProfileCode =
    searchParams.get("lowprofilecode") ?? searchParams.get("LowProfileCode");
  // Our own purchase ID embedded in IndicatorUrl: ?order=<purchase.id>
  const orderId = searchParams.get("order");

  if (!lowProfileCode) {
    // Return 400 so we know something is wrong, but Cardcom ignores non-200 content
    return new Response("missing lowprofilecode", { status: 400 });
  }

  const terminal = process.env.CARDCOM_TERMINAL;
  const apiName  = process.env.CARDCOM_API_NAME;

  if (!terminal || !apiName) {
    // Log but return 200 so Cardcom retries (credentials will be set)
    console.error("[webhook GET] Cardcom credentials not configured");
    return new Response("OK", { status: 200 });
  }

  // ── Step 1: Verify payment with Cardcom ─────────────────────────────────
  const verifyParams = new URLSearchParams({
    TerminalNumber: terminal,
    UserName:       apiName,
    LowProfileCode: lowProfileCode,
    codepage:       "65001",
  });

  let data: Record<string, string>;
  try {
    const verifyRes = await fetch(
      `https://secure.cardcom.solutions/Interface/BillGoldGetLowProfileIndicator.aspx?${verifyParams}`,
      { method: "GET" }
    );
    const verifyText = await verifyRes.text();
    data = Object.fromEntries(new URLSearchParams(verifyText));
  } catch (e) {
    await createServerClient().from("error_logs").insert({
      context: "api/cardcom/webhook GET",
      error:   String(e),
      payload: { lowProfileCode, orderId },
    });
    return new Response("OK", { status: 200 }); // return 200 — Cardcom will retry
  }

  // ── Step 2: Check payment result ────────────────────────────────────────
  // OperationResponse=0 means the overall operation succeeded
  if (data.OperationResponse !== "0") {
    const purchaseId = data.ReturnValue || orderId;
    if (purchaseId) {
      await createServerClient()
        .from("purchases")
        .update({ status: "failed" })
        .eq("id", purchaseId)
        .eq("status", "pending");
    }
    console.warn("[webhook GET] Payment failed:", data.OperationResponse, data.OperationResponseDescription);
    return new Response("OK", { status: 200 });
  }

  const internalDealNumber = data.InternalDealNumber;
  const invoiceNumber      = data.InvoiceNumber      ?? null;
  const invoiceResponseCode = data.InvoiceResponseCode;
  // ReturnValue is our purchase.id echoed back by Cardcom
  const returnValue = data.ReturnValue || orderId;

  if (!returnValue) {
    await createServerClient().from("error_logs").insert({
      context: "api/cardcom/webhook GET",
      error:   "No ReturnValue or order param — cannot identify purchase",
      payload: { lowProfileCode, data },
    });
    return new Response("OK", { status: 200 });
  }

  // Log invoice failure without blocking payment confirmation
  if (invoiceResponseCode && invoiceResponseCode !== "0") {
    console.warn(
      "[webhook GET] Invoice creation failed:",
      invoiceResponseCode,
      data.InvoiceResponseDescription ?? ""
    );
  }

  // ── Step 3: Fulfill the purchase ────────────────────────────────────────
  await fulfillPurchase(
    createServerClient(),
    returnValue,
    internalDealNumber,
    invoiceNumber,
  );

  return new Response("OK", { status: 200 });
}

// ── POST handler — legacy flow ─────────────────────────────────────────────
// Cardcom posts full transaction data as form-encoded body.
// Kept for backward compatibility.

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const {
    ResponseCode,
    InternalDealNumber,
    ReturnValue,
  } = body;

  const supabase = createServerClient();

  // Only process successful payments
  if (ResponseCode !== "0") {
    if (ReturnValue) {
      await supabase
        .from("purchases")
        .update({ status: "failed" })
        .eq("id", ReturnValue)
        .eq("status", "pending");
    }
    return NextResponse.json({ ok: true });
  }

  if (!ReturnValue) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook POST",
      error:   "No ReturnValue in Cardcom POST body",
      payload: body,
    });
    return NextResponse.json({ ok: true });
  }

  await fulfillPurchase(supabase, ReturnValue, InternalDealNumber, null);

  return NextResponse.json({ ok: true });
}
