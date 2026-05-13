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
import { sendCapiEvent } from "@/lib/meta-capi";
import { sendChallengeWhatsApp } from "@/lib/challenge-whatsapp";

// ── Shared fulfillment logic ───────────────────────────────────────────────

async function fulfillPurchase(
  supabase:            ReturnType<typeof createServerClient>,
  purchaseId:          string,
  internalDealNumber:  string | undefined,
  invoiceNumber:       string | null,
  invoiceLink:         string | null,
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

  console.log("InvoiceNumber from Cardcom:", invoiceNumber);
  console.log("InvoiceLink from Cardcom:", invoiceLink);

  // Mark purchase as completed — include invoice fields in same update
  // (invoice_number/invoice_link columns added in migrations 018/019, cast as any for TS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchase, error: purchaseErr } = await (supabase as any)
    .from("purchases")
    .update({
      status:         "completed",
      cardcom_ref:    internalDealNumber ?? null,
      invoice_number: invoiceNumber ?? null,
      invoice_link:   invoiceLink   ?? null,
    })
    .eq("id", purchaseId)
    .eq("status", "pending")   // only update pending — prevents overwriting refunds
    .select("id, user_id, product, amount, meta_fbp, meta_fbc, meta_client_ip, meta_user_agent")
    .single();

  if (purchaseErr || !purchase) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook fulfillPurchase",
      error:   purchaseErr?.message ?? "Purchase not found or not pending",
      payload: { purchaseId, internalDealNumber, invoiceNumber },
    });
    return { ok: false };
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

  // Determine product-specific trigger event
  const productEvent =
    purchase.product === "challenge_197" ? "CHALLENGE_PURCHASED" :
    purchase.product === "workshop_1080" ? "WORKSHOP_PURCHASED"  :
    purchase.product === "course_1800"   ? "COURSE_PURCHASED"    :
    purchase.product === "sadna_500"     ? "SADNA_PURCHASED"     : null;

  // Fetch user data once (shared by all email enqueuing below)
  const { data: user } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", purchase.user_id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";

  // Create challenge enrollment + auth account immediately on purchase
  let challengeMagicLink: string | null = null;
  let challengeEnrollmentId: string | null = null;
  if (purchase.product === "challenge_197") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("challenge_enrollments")
      .upsert(
        { user_id: purchase.user_id, enrolled_at: new Date().toISOString(), current_day: 0 },
        { onConflict: "user_id", ignoreDuplicates: true }
      );

    // Fetch enrollment ID for WhatsApp log dedup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: enrollRow } = await (supabase as any)
      .from("challenge_enrollments")
      .select("id")
      .eq("user_id", purchase.user_id)
      .maybeSingle();
    challengeEnrollmentId = enrollRow?.id ?? null;

    // Generate a magic link so the buyer can access challenge content without
    // manually creating a password. generateLink auto-creates the auth.users row
    // if the email isn't registered yet.
    if (user?.email) {
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type:    "magiclink",
          email:   user.email,
          options: { redirectTo: `${appUrl}/challenge/content` },
        });
        challengeMagicLink = linkData?.properties?.action_link ?? null;
      } catch {
        // non-fatal — email will fall back to static link
      }
    }
  }

  if (productEvent) {
    // Insert product-specific event into event log
    await supabase.from("events").insert({
      user_id:  purchase.user_id,
      type:     productEvent,
      metadata: { product: purchase.product, amount: purchase.amount },
    });

    // Enqueue all product-specific email sequences (immediate access email + timed upsell)
    if (user) {
      const { data: productSeqs } = await supabase
        .from("email_sequences")
        .select("id, delay_hours, subject, template_key")
        .eq("trigger_event", productEvent)
        .eq("active", true);

      if (productSeqs?.length) {
        await supabase.from("jobs").insert(
          productSeqs.map(seq => ({
            type:    "SEND_EMAIL",
            payload: {
              user_id:      purchase.user_id,
              email:        user.email,
              name:         user.name ?? "",
              sequence_id:  seq.id,
              subject:      seq.subject,
              template_key: seq.template_key,
              product:      purchase.product,
              amount:       purchase.amount,
              // Inject magic link only into the immediate challenge access email
              ...(challengeMagicLink && seq.delay_hours === 0
                ? { access_link: challengeMagicLink }
                : {}),
            },
            run_at: new Date(Date.now() + seq.delay_hours * 60 * 60 * 1000).toISOString(),
            status: "pending" as const,
          }))
        );
      }
    }
  } else {
    // No product-specific sequence: send generic purchase confirmation
    const { data: confirmSeq } = await supabase
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "PURCHASE_COMPLETED")
      .eq("delay_hours", 0)
      .eq("active", true)
      .maybeSingle();

    if (confirmSeq && user) {
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
        status: "pending" as const,
      });
    }
  }

  // Advance state machine: high_intent → buyer
  await supabase
    .from("users")
    .update({ status: "buyer" })
    .eq("id", purchase.user_id)
    .eq("status", "high_intent");

  // Fire Purchase to Meta Conversions API (server-side, not blocked by iOS/adblockers)
  // event_id = purchase.id — deduplicates with browser pixel firing on success page
  const { data: userForCapi } = await supabase
    .from("users")
    .select("email, phone, name, click_id")
    .eq("id", purchase.user_id)
    .single();

  if (userForCapi) {
    // Build fbc from stored fbclid if the browser cookie wasn't captured at checkout
    const fbc = purchase.meta_fbc
      ?? (userForCapi.click_id ? `fb.1.${Date.now()}.${userForCapi.click_id}` : undefined);

    const firstName = userForCapi.name?.trim().split(" ")[0] || undefined;

    const sharedUserData = {
      email:           userForCapi.email ?? undefined,
      phone:           userForCapi.phone ?? undefined,
      firstName,
      externalId:      purchase.user_id,
      fbp:             purchase.meta_fbp  ?? undefined,
      fbc,
      clientIpAddress: purchase.meta_client_ip   ?? undefined,
      clientUserAgent: purchase.meta_user_agent  ?? undefined,
    };

    const sharedCustomData = {
      value:       purchase.amount ?? undefined,
      currency:    "ILS",
      contentName: purchase.product,
      contentIds:  [purchase.product],
    };

    // Standard Purchase event
    await sendCapiEvent({
      eventName:  "Purchase",
      eventId:    purchase.id,
      userData:   sharedUserData,
      customData: sharedCustomData,
    });

    // Product-specific custom event for per-product campaign optimization
    const PRODUCT_CUSTOM_EVENT: Record<string, string> = {
      challenge_197:  "PurchaseChallenge",
      workshop_1080:  "PurchaseWorkshop",
      course_1800:    "PurchaseCourse",
      strategy_4000:  "PurchaseStrategy",
      premium_14000:  "PurchasePremium",
      test_1:         "PurchaseTest",
    };
    const customEventName = PRODUCT_CUSTOM_EVENT[purchase.product];
    if (customEventName) {
      await sendCapiEvent({
        eventName:  customEventName,
        eventId:    `${customEventName.toLowerCase()}_${purchase.id}`,
        userData:   sharedUserData,
        customData: sharedCustomData,
      });
    }

    // Send opening-session WhatsApp immediately on challenge purchase
    if (purchase.product === "challenge_197" && challengeEnrollmentId && userForCapi.phone) {
      const waStatus = await sendChallengeWhatsApp(
        userForCapi.phone,
        userForCapi.name ?? "",
        0,
      ).then(() => "sent" as const).catch(() => "failed" as const);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("challenge_whatsapp_logs")
        .upsert(
          { enrollment_id: challengeEnrollmentId, day_number: 0, status: waStatus },
          { onConflict: "enrollment_id,day_number", ignoreDuplicates: false }
        );
    }
  }

  return { ok: true };
}

// ── GET handler — verification flow ───────────────────────────────────────
// Cardcom appends ?lowprofilecode=<code> to our IndicatorUrl
// We independently verify with BillGoldGetLowProfileIndicator.aspx

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Validate shared secret — rejects spoofed requests before any DB work
  const webhookToken = process.env.CARDCOM_WEBHOOK_TOKEN;
  if (webhookToken) {
    const receivedToken = searchParams.get("wt");
    if (receivedToken !== webhookToken) {
      await createServerClient().from("error_logs").insert({
        context: "api/cardcom/webhook GET",
        error:   "invalid webhook token",
        payload: { url: req.url },
      });
      return new Response("OK", { status: 200 }); // 200 to avoid Cardcom retries on our own requests
    }
  }

  // Cardcom sends lowprofilecode (lowercase) appended to our IndicatorUrl
  const lowProfileCode =
    searchParams.get("lowprofilecode") ?? searchParams.get("LowProfileCode");
  // Our own purchase ID embedded in IndicatorUrl: ?order=<purchase.id>
  const orderId = searchParams.get("order");

  if (!lowProfileCode) {
    // Must return 200 — Cardcom retries on non-200. Log to error_logs instead.
    await createServerClient().from("error_logs").insert({
      context: "api/cardcom/webhook GET",
      error:   "missing lowprofilecode",
      payload: { orderId, url: req.url },
    });
    return new Response("OK", { status: 200 });
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
    console.log("=== FULL CARDCOM RESPONSE ===", JSON.stringify(data));
    const invoiceRelated = Object.entries(data).filter(([k]) =>
      k.toLowerCase().includes("invoice") ||
      k.toLowerCase().includes("link") ||
      k.toLowerCase().includes("url")
    );
    console.log("Invoice/Link fields from Cardcom:", JSON.stringify(invoiceRelated));
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

  console.log("Cardcom webhook data keys:", Object.keys(data));
  console.log("Cardcom InvoiceLink:", data.InvoiceLink);
  console.log("Cardcom Link:", data.Link);

  const internalDealNumber  = data.InternalDealNumber;
  const invoiceNumber       = data.InvoiceNumber ?? null;
  const invoiceLink         = data.InvoiceLink ?? data.Link ?? null;
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
    invoiceLink,
  );

  return new Response("OK", { status: 200 });
}

// ── POST handler — legacy flow ─────────────────────────────────────────────
// Cardcom posts full transaction data as form-encoded body.
// Kept for backward compatibility.

export async function POST(req: NextRequest) {
  // Validate webhook token from query string
  const webhookToken = process.env.CARDCOM_WEBHOOK_TOKEN;
  if (webhookToken) {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("wt") !== webhookToken) {
      return new Response("OK", { status: 200 });
    }
  }

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

  await fulfillPurchase(supabase, ReturnValue, InternalDealNumber, null, null);

  return NextResponse.json({ ok: true });
}
