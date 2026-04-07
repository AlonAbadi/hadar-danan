/**
 * POST /api/cardcom/webhook
 *
 * Receives payment confirmation from Cardcom.
 * Idempotent - safe to receive the same webhook multiple times.
 *
 * Cardcom posts a form-encoded body with transaction details.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const {
    ResponseCode,        // "0" = success
    InternalDealNumber,  // Cardcom's unique ref
    ReturnValue,         // our purchase.id echoed back
    ExtShvaParams,       // extra transaction info (optional)
  } = body;

  const supabase = createServerClient();

  // Only process successful payments
  if (ResponseCode !== "0") {
    // Mark purchase as failed
    if (ReturnValue) {
      await supabase
        .from("purchases")
        .update({ status: "failed" })
        .eq("id", ReturnValue)
        .eq("status", "pending");
    }
    return NextResponse.json({ ok: true });
  }

  // Idempotency: if we've already processed this InternalDealNumber, skip
  if (InternalDealNumber) {
    const { data: existing } = await supabase
      .from("purchases")
      .select("id, user_id, product")
      .eq("cardcom_ref", InternalDealNumber)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true }); // already handled
    }
  }

  // Mark purchase as completed
  const { data: purchase, error: purchaseErr } = await supabase
    .from("purchases")
    .update({
      status: "completed",
      cardcom_ref: InternalDealNumber ?? null,
    })
    .eq("id", ReturnValue)
    .eq("status", "pending") // only update pending - prevents overwriting refunds
    .select("id, user_id, product, amount")
    .single();

  if (purchaseErr || !purchase) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook",
      error: purchaseErr?.message ?? "Purchase not found",
      payload: body,
    });
    // Return 200 so Cardcom doesn't retry - we logged the issue
    return NextResponse.json({ ok: true });
  }

  // Fire PURCHASE_COMPLETED event → triggers state machine (high_intent → buyer)
  await supabase.from("events").insert({
    user_id: purchase.user_id,
    type: "PURCHASE_COMPLETED",
    metadata: {
      product: purchase.product,
      amount: purchase.amount,
      cardcom_ref: InternalDealNumber,
    },
  });

  // Fire product-specific event so per-product sequences are triggered
  const productEvent =
    purchase.product === "challenge_197"  ? "CHALLENGE_PURCHASED"  :
    purchase.product === "workshop_1080"  ? "WORKSHOP_PURCHASED"   :
    purchase.product === "course_1800"    ? "COURSE_PURCHASED"     : null;

  if (productEvent) {
    await supabase.from("events").insert({
      user_id: purchase.user_id,
      type: productEvent,
      metadata: { product: purchase.product, amount: purchase.amount },
    });
  }

  // Enqueue purchase_confirmation email immediately
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
        type: "SEND_EMAIL",
        payload: {
          user_id: purchase.user_id,
          email: user.email,
          name: user.name ?? "",
          sequence_id: confirmSeq.id,
          subject: confirmSeq.subject,
          template_key: confirmSeq.template_key,
          product: purchase.product,
          amount: purchase.amount,
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

  return NextResponse.json({ ok: true });
}
