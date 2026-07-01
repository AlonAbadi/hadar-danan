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
import { PRODUCT_MAP, type ProductKey } from "@/lib/products";
import { sendCapiEvent } from "@/lib/meta-capi";
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
    "workshop_1080",
    "course_1800",
    "strategy_4000",
    "premium_14000",
    "test_1",
  ]),
  user_id:     z.string().uuid(),
  coupon_code: z.string().optional(),
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

  const { product, user_id, coupon_code } = body.data;
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

  // כוורת האות buyers get ₪590 credited toward the workshop. Checked server-side
  // against a completed signal_hive_590 purchase so it can't be faked from the client.
  let signalHiveCredit = 0;
  if (product === "workshop_1080") {
    const { count: shCount } = await supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("product", "signal_hive_590")
      .eq("status", "completed");
    if (shCount && shCount > 0) signalHiveCredit = 590;
  }

  // Premium includes VAT (18%) — charged at list price + VAT.
  // Coupon (when valid) overrides — final billed amount comes from validateCoupon
  // which already applied the discount to the product's list price.
  const amount = coupon
    ? coupon.finalPrice
    : (product === "premium_14000"
        ? Math.round(listPrice * 1.18)
        : Math.max(0, listPrice - signalHiveCredit));

  // Capture current-session UTM from cookies so attribution survives even when
  // the buyer's user row has null utm (organic signup, returned via Meta ad).
  const utmCookie = (name: string) => req.cookies.get(name)?.value ?? null;

  // Create a pending purchase record for idempotency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchase, error: purchaseErr } = await (supabase as any)
    .from("purchases")
    .insert({
      user_id,
      product: product as "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000",
      amount,
      currency: "ILS",
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
  const invoiceDesc   = INVOICE_DESCRIPTIONS[product] ?? NAMES[product];

  // Cardcom LowProfile API — Name=Value form-encoded POST
  const params = new URLSearchParams({
    // Required
    TerminalNumber: terminal,
    UserName:       apiName,
    SumToBill:      String(amount),
    CoinId:         "1",          // ILS
    Language:       "he",
    APILevel:       "10",
    Codepage:       "65001",
    Operation:      "1",          // charge only (no tokenization needed)

    // ReturnValue is echoed back in the webhook — used to find this purchase row
    ReturnValue: purchase.id,

    // Redirect URLs (NEVER rely on these alone — webhook is the source of truth)
    // oid= passed for Meta Pixel browser/CAPI event_id deduplication
    SuccessRedirectUrl: product === "challenge_197"
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
    "InvoiceHead.Language":      "he",
    "InvoiceHead.CoinID":        "1",
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
  const icCustomData = { value: amount, currency: "ILS", contentName: product, contentIds: [product] };
  const productIcEvent = PRODUCT_IC_EVENT[product];

  const [, , cardcomRes] = await Promise.all([
    sendCapiEvent({
      eventName:  "InitiateCheckout",
      eventId:    `ic_${purchase.id}`,
      userData:   icUserData,
      customData: icCustomData,
    }),
    productIcEvent
      ? sendCapiEvent({
          eventName:  productIcEvent,
          eventId:    `${productIcEvent.toLowerCase()}_${purchase.id}`,
          userData:   icUserData,
          customData: icCustomData,
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
  const resultParams = new URLSearchParams(text);
  const responseCode    = resultParams.get("ResponseCode");
  const lowProfileCode  = resultParams.get("LowProfileCode");

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
