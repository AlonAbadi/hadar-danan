/**
 * POST /api/checkout
 *
 * Creates a Cardcom LowProfile payment page and returns the redirect URL.
 * Returns 503 until CARDCOM_TERMINAL + CARDCOM_API_NAME are set.
 *
 * Body: { product: ProductKey | "test_1", user_id: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { PRODUCT_MAP, EN_HIVE_FALLBACK_ILS, type ProductKey } from "@/lib/products";
import { sendCapiEvent } from "@/lib/meta-capi";
import { kriahPreviewAllowed } from "@/lib/isolation";
import { computeCredit } from "@/lib/credit-ladder";
import { getClientIp } from "@/lib/rate-limit";
import { validateCoupon } from "@/lib/coupons";

// Invoice description per product (more descriptive than the short UI name)
const INVOICE_DESCRIPTIONS: Record<string, string> = {
  challenge_197:  "אתגר 7 הימים - הדר דנן",
  workshop_1080:  "סדנה יום אחד - הדר דנן",
  course_1800:    "קורס דיגיטלי - הדר דנן",
  strategy_4000:  "פגישת אסטרטגיה - הדר דנן",
  premium_14000:  "יום צילום פרמיום - הדר דנן",
  test_1:         "מוצר טסט - הדר דנן",
};

const PRICES: Record<string, number> = {
  ...Object.fromEntries(
    Object.entries(PRODUCT_MAP).map(([k, v]) => [k, v.price])
  ),
  test_1: 1,
};

const NAMES: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(PRODUCT_MAP).map(([k, v]) => [k, v.name])
  ),
  test_1: "מוצר טסט",
};

// Per-product custom InitiateCheckout event names — let Meta optimize each
// product campaign on its own audience signal (different price points,
// different audiences, would otherwise dilute each other).
const PRODUCT_IC_EVENT: Record<string, string> = {
  challenge_197:  "InitiateChallengeCheckout",
  workshop_1080:  "InitiateWorkshopCheckout",
  course_1800:    "InitiateCourseCheckout",
  strategy_4000:  "InitiateStrategyCheckout",
  premium_14000:  "InitiatePremiumCheckout",
};

const BodySchema = z.object({
  product: z.enum([
    "challenge_197",
    "signal_hive_590",
    "signal_hive_en_149",
    "workshop_1080",
    "strategy_4000",
    "premium_14000",
    "test_1",
  ]),
  user_id:     z.string().uuid(),
  coupon_code: z.string().optional(),
  is_test:     z.boolean().optional(), // honored only with the kriah preview secret
});

export async function POST(req: NextRequest) {
  const terminal = process.env.CARDCOM_TERMINAL;
  const apiName  = process.env.CARDCOM_API_NAME;

  if (!terminal || !apiName) {
    return NextResponse.json(
      { error: "Cardcom credentials not configured. Use WhatsApp to complete purchase." },
      { status: 503 }
    );
  }

  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { product: requestedProduct, user_id, coupon_code } = body.data;

  // The Signal Hive (English edition): charged in USD on an English Cardcom
  // page. The DB product_type enum has no EN value (DDL is manual), so the
  // purchase row stores the Hebrew twin `signal_hive_590` — currency "USD"
  // is the English marker (webhook uses it for the /en redirect).
  const isEnHive = requestedProduct === "signal_hive_en_149";
  const product = isEnHive ? "signal_hive_590" : requestedProduct;
  const enHiveUsd = isEnHive ? PRICES["signal_hive_en_149"] : null;

  // ── v2 isolation ──
  // A test checkout may NEVER open a live Cardcom session for a real product.
  // Only test_1 (₪1) is allowed through with the preview secret; everything
  // else is refused before any CAPI event or Cardcom fetch fires.
  const isTestRun = (body.data as { is_test?: unknown }).is_test === true &&
    (kriahPreviewAllowed(req.headers.get("x-kriah-preview")) ||
     process.env.UNIFIED_FUNNEL_ENABLED !== "true");
  if (isTestRun && product !== "test_1") {
    return NextResponse.json(
      { error: "בדיקת v2: תשלום אמיתי חסום. השתמשו במוצר test_1 בלבד." },
      { status: 403 },
    );
  }

  const listPrice = PRICES[product];
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";

  // Server-side coupon validation. The page rendered the discounted price,
  // the CTA forwarded the code — but we re-validate here so a buyer who
  // tampers with the request body can't fake a discount.
  // PRODUCT_MAP keys exclude test_1; validateCoupon returns null
  // when the product key isn't in the map, which is the safe default.
  const coupon = coupon_code
    ? await validateCoupon(coupon_code, product as ProductKey).catch(() => null)
    : null;

  const supabase = createServerClient();

  // Fetch user details for customer info and invoice
  const { data: userRow } = await supabase
    .from("users")
    .select("name, email, phone")
    .eq("id", user_id)
    .single();

  // Cancel any existing pending purchases for this user+product combo
  // before creating a new one (prevents duplicate pending rows on retry)
  await supabase
    .from("purchases")
    .update({ status: "failed" })
    .eq("user_id", user_id)
    .eq("product", product as "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000")
    .eq("status", "pending");

  // The controlled credit ladder (lib/credit-ladder.ts) — ONE credit system.
  // Computed server-side; the client never sends an amount. Coupon overrides
  // credit (a coupon price is already final).
  const grossBase = product === "premium_14000" ? Math.round(listPrice * 1.18) : listPrice;
  const creditRes = coupon
    ? { credit: 0, sourcePurchaseId: null, sourceProduct: null, sourceInvoice: null }
    : await computeCredit(supabase, user_id, product, grossBase);

  // `amount` stays the BILLED amount (net), same semantics as always — the
  // gross is derivable from the price list; credit_applied records the delta.
  const amount = isEnHive
    ? (enHiveUsd as number) // USD list price; coupons/credit are ILS-domain and do not apply
    : coupon
    ? coupon.finalPrice
    : Math.max(0, grossBase - creditRes.credit);

  // Capture current-session UTM from cookies so attribution survives even when
  // the buyer's user row has null utm (organic signup, returned via Meta ad).
  const utmCookie = (name: string) => req.cookies.get(name)?.value ?? null;

  // Create a pending purchase record for idempotency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchase, error: purchaseErr } = await (supabase as any)
    .from("purchases")
    .insert({
      user_id,
      is_test: isTestRun,
      product: product as "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000",
      amount,
      credit_applied:            creditRes.credit,
      credit_source_purchase_id: creditRes.sourcePurchaseId,
      currency: isEnHive ? "USD" : "ILS",
      status: "pending",
      meta_fbp:         req.cookies.get("_fbp")?.value ?? null,
      meta_fbc:         req.cookies.get("_fbc")?.value ?? null,
      meta_client_ip:   getClientIp(req),
      meta_user_agent:  req.headers.get("user-agent") ?? null,
      utm_source:       utmCookie("utm_source"),
      utm_medium:       utmCookie("utm_medium"),
      utm_campaign:     utmCookie("utm_campaign"),
      utm_content:      utmCookie("utm_content"),
      utm_term:         utmCookie("utm_term"),
      utm_adset:        utmCookie("utm_adset"),
      utm_ad:           utmCookie("utm_ad"),
      click_id:         utmCookie("fbclid") ?? utmCookie("gclid"),
    })
    .select("id")
    .single();

  if (purchaseErr) {
    await supabase.from("error_logs").insert({
      context: "api/checkout",
      error:   "Purchase insert failed",
      payload: { product, user_id, message: purchaseErr.message, code: purchaseErr.code },
    });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Record coupon redemption + increment used_count.
  // unique(coupon_code, purchase_id) constraint prevents double-insert if
  // the user retries checkout for the same purchase row. Failure here must
  // not block the payment — log and continue.
  if (coupon) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: redemptionErr } = await (supabase as any)
      .from("coupon_redemptions")
      .insert({
        coupon_code: coupon.code,
        user_id,
        purchase_id: purchase.id,
      });
    if (redemptionErr) {
      await supabase.from("error_logs").insert({
        context: "api/checkout coupon redemption",
        error:   redemptionErr.message,
        payload: { coupon_code: coupon.code, user_id, purchase_id: purchase.id, code: redemptionErr.code },
      });
    } else {
      // Atomic increment via RPC would be ideal — for now a fetch-then-update
      // race is acceptable since max_uses is null (unlimited).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: c } = await (supabase as any)
        .from("coupons")
        .select("used_count")
        .eq("code", coupon.code)
        .single();
      if (c) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("coupons")
          .update({ used_count: (c.used_count ?? 0) + 1 })
          .eq("code", coupon.code);
      }
    }
  }

  const customerName  = userRow?.name  ?? "";
  const customerEmail = userRow?.email ?? "";
  const customerPhone = userRow?.phone ?? "";
  const baseDesc    = isEnHive ? "The Signal Hive - beegood" : (INVOICE_DESCRIPTIONS[product] ?? NAMES[product]);
  const invoiceDesc = creditRes.credit > 0
    ? `${baseDesc} ₪${grossBase.toLocaleString("en-US")} בקיזוז ₪${creditRes.credit}${creditRes.sourceInvoice ? ` (חשבונית #${creditRes.sourceInvoice})` : ""}, לחיוב ₪${amount.toLocaleString("en-US")}`
    : baseDesc;

  // Cardcom LowProfile API — Name=Value form-encoded POST
  const params = new URLSearchParams({
    // Required
    TerminalNumber: terminal,
    UserName:       apiName,
    SumToBill:      String(amount),
    CoinId:         isEnHive ? "2" : "1",          // 2 = USD (EN hive), 1 = ILS
    Language:       isEnHive ? "en" : "he",
    APILevel:       "10",
    Codepage:       "65001",
    Operation:      "1",          // charge only (no tokenization needed)

    // ReturnValue is echoed back in the webhook — used to find this purchase row
    ReturnValue: purchase.id,

    // Redirect URLs (NEVER rely on these alone — webhook is the source of truth)
    // oid= passed for Meta Pixel browser/CAPI event_id deduplication
    SuccessRedirectUrl: isEnHive
      ? `${appUrl}/en/hive/success?oid=${purchase.id}`
      : product === "challenge_197"
      ? `${appUrl}/challenge/thank-you?oid=${purchase.id}`
      : product === "signal_hive_590"
      ? `${appUrl}/signal-hive/success?oid=${purchase.id}`
      : `${appUrl}/${product.split("_")[0]}/success?oid=${purchase.id}`,
    ErrorRedirectUrl: `${appUrl}/checkout-error`,

    // Webhook — Cardcom calls this server-to-server BEFORE redirecting the user
    // We pass order= so the GET handler can identify the purchase immediately
    // wt= is a shared secret that validates the call came from Cardcom
    IndicatorUrl: `${appUrl}/api/cardcom/webhook?order=${purchase.id}&wt=${process.env.CARDCOM_WEBHOOK_TOKEN ?? ""}`,

    // Product name shown on the Cardcom payment page
    ProductName: invoiceDesc,

    // Customer details — pre-fills the Cardcom payment form
    CardOwnerName:       customerName,
    CardOwnerEmail:      customerEmail,
    ShowCardOwnerEmail:   "true",
    ReqCardOwnerEmail:    "true",
    ShowCardOwnerPhone:   "true",
    ReqCardOwnerPhone:    "true",
    CardOwnerPhone:       customerPhone,
    ShowInvoiceHead:      "true",
    HideCreditCardUserId: "false",

    // Installments — premium gets up to 6, others up to 3
    MaxNumOfPayments:     product === "premium_14000" ? "6" : "3",
    MinNumOfPayments:     "1",
    DefaultNumOfPayments: "1",
    CreditTipe:           "1",

    // Invoice generation
    // InvoiceHeadOperation=1: generate invoice alongside the charge
    // DocTypeToCreate=1: חשבונית מס קבלה — includes product lines and VAT
    InvoiceHeadOperation:       "1",
    DocTypeToCreate:             "1",
    "InvoiceHead.CustName":      customerName,
    "InvoiceHead.SendByEmail":   "true",
    "InvoiceHead.Email":         customerEmail,
    "InvoiceHead.Language":      isEnHive ? "en" : "he",
    "InvoiceHead.CoinID":        isEnHive ? "2" : "1",
    "InvoiceLines.Description":  invoiceDesc,
    "InvoiceLines.Price":        String(amount),
    "InvoiceLines.Quantity":     "1",
    "InvoiceLines.IsVatFree":    "false",
  });

  // Fire CAPI + Cardcom in parallel — both are independent external calls
  const icUserData = {
    email:            userRow?.email   ?? undefined,
    phone:            userRow?.phone   ?? undefined,
    fbp:              req.cookies.get("_fbp")?.value,
    fbc:              req.cookies.get("_fbc")?.value,
    clientUserAgent:  req.headers.get("user-agent") ?? undefined,
  };
  const icCustomData = { value: amount, currency: isEnHive ? "USD" : "ILS", contentName: requestedProduct, contentIds: [requestedProduct] };
  const productIcEvent = PRODUCT_IC_EVENT[product];

  const [, , cardcomRes] = await Promise.all([
    sendCapiEvent({
      eventName:  "InitiateCheckout",
      eventId:    `ic_${purchase.id}`,
      userData:   icUserData,
      customData: icCustomData,
      isTest:     isTestRun,
    }),
    productIcEvent
      ? sendCapiEvent({
          eventName:  productIcEvent,
          eventId:    `${productIcEvent.toLowerCase()}_${purchase.id}`,
          userData:   icUserData,
          customData: icCustomData,
          isTest:     isTestRun,
        })
      : Promise.resolve(),
    fetch(
      "https://secure.cardcom.solutions/Interface/LowProfile.aspx",
      {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    params.toString(),
      }
    ),
  ]);

  const text         = await cardcomRes.text();
  let resultParams   = new URLSearchParams(text);
  let responseCode   = resultParams.get("ResponseCode");
  let lowProfileCode = resultParams.get("LowProfileCode");

  // USD terminal support is a Cardcom account setting we cannot verify from
  // here. If the USD page-create is refused, retry ONCE in ILS at the
  // documented fallback price (the payment page stays in English) and stamp
  // the purchase row accordingly, so the buyer is never dead-ended.
  if (isEnHive && (responseCode !== "0" || !lowProfileCode)) {
    await supabase.from("error_logs").insert({
      context: "api/checkout en-hive usd fallback",
      error:   `USD create refused (code ${responseCode}) — retrying in ILS`,
      payload: { responseCode, description: resultParams.get("Description") },
    });
    params.set("CoinId", "1");
    params.set("InvoiceHead.CoinID", "1");
    params.set("SumToBill", String(EN_HIVE_FALLBACK_ILS));
    params.set("InvoiceLines.Price", String(EN_HIVE_FALLBACK_ILS));
    const retryRes = await fetch("https://secure.cardcom.solutions/Interface/LowProfile.aspx", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    });
    resultParams   = new URLSearchParams(await retryRes.text());
    responseCode   = resultParams.get("ResponseCode");
    lowProfileCode = resultParams.get("LowProfileCode");
    if (responseCode === "0" && lowProfileCode) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("purchases")
        .update({ amount: EN_HIVE_FALLBACK_ILS, currency: "ILS" })
        .eq("id", purchase.id);
    }
  }

  if (responseCode !== "0" || !lowProfileCode) {
    await supabase.from("error_logs").insert({
      context: "api/checkout",
      error:   "Cardcom create failed",
      payload: { responseCode, description: resultParams.get("Description"), text },
    });
    return NextResponse.json({ error: "Payment provider error" }, { status: 502 });
  }

  return NextResponse.json({
    url:         `https://secure.cardcom.solutions/External/lowProfileClearing/${terminal}.aspx?LowProfileCode=${lowProfileCode}`,
    purchase_id: purchase.id,
  });
}
