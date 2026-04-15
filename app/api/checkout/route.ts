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
import { PRODUCT_MAP } from "@/lib/products";

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

const BodySchema = z.object({
  product: z.enum([
    "challenge_197",
    "workshop_1080",
    "course_1800",
    "strategy_4000",
    "premium_14000",
    "test_1",
  ]),
  user_id: z.string().uuid(),
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

  const { product, user_id } = body.data;
  const listPrice = PRICES[product];
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";

  const supabase = createServerClient();

  // Fetch user details for customer info and invoice
  const { data: userRow } = await supabase
    .from("users")
    .select("name, email, phone")
    .eq("id", user_id)
    .single();

  // Permanent per-email discounts (fraction to deduct, e.g. 0.99 = 99% off)
  const PERMANENT_DISCOUNTS: Record<string, number> = {
    "alonabadi9@gmail.com":  0.99,
    "goodtoseeya1@gmail.com": 0.999,
  };
  const discountRate    = PERMANENT_DISCOUNTS[userRow?.email ?? ""] ?? 0;
  const effectivePrice  = discountRate > 0
    ? Math.max(1, Math.round(listPrice * (1 - discountRate)))
    : listPrice;

  // Cancel any existing pending purchases for this user+product combo
  // before creating a new one (prevents duplicate pending rows on retry)
  await supabase
    .from("purchases")
    .update({ status: "failed" })
    .eq("user_id", user_id)
    .eq("product", product as "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000")
    .eq("status", "pending");

  // Credit = SUM of actual amounts paid across all completed purchases
  const { data: completedPurchases } = await supabase
    .from("purchases")
    .select("amount")
    .eq("user_id", user_id)
    .eq("status", "completed");

  const credit = (completedPurchases ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  // When a personal discount is active, credit is not applied —
  // the user always pays the discounted price (minimum ₪1).
  const amount = discountRate > 0
    ? effectivePrice
    : Math.max(0, effectivePrice - credit);

  // If fully covered by credit, no payment needed — complete directly
  if (amount === 0) {
    const { data: freePurchase, error: freeErr } = await supabase
      .from("purchases")
      .insert({
        user_id,
        product: product as "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000",
        amount: 0,
        currency: "ILS",
        status: "completed",
      })
      .select("id")
      .single();

    if (freeErr || !freePurchase) {
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    await supabase.from("events").insert({
      user_id,
      type: "PURCHASE_COMPLETED",
      metadata: { product, amount: 0, credit_applied: credit },
    });

    const productEvent =
      product === "challenge_197" ? "CHALLENGE_PURCHASED"  :
      product === "workshop_1080" ? "WORKSHOP_PURCHASED"   :
      product === "course_1800"   ? "COURSE_PURCHASED"     : null;

    if (productEvent) {
      await supabase.from("events").insert({
        user_id,
        type: productEvent,
        metadata: { product, amount: 0 },
      });
    }

    await supabase.from("users").update({ status: "buyer" }).eq("id", user_id).eq("status", "high_intent");

    return NextResponse.json({
      url: `${appUrl}/${product.replace("_197", "").replace("_1080", "").replace("_1800", "").replace("_4000", "")}/success?purchase=${freePurchase.id}`,
      free: true,
    });
  }

  // Create a pending purchase record for idempotency
  const { data: purchase, error: purchaseErr } = await supabase
    .from("purchases")
    .insert({
      user_id,
      product: product as "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000",
      amount,
      currency: "ILS",
      status: "pending",
    })
    .select("id")
    .single();

  if (purchaseErr) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
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
    SuccessRedirectUrl: product === "challenge_197"
      ? `${appUrl}/challenge/thank-you`
      : `${appUrl}/${product.split("_")[0]}/success`,
    ErrorRedirectUrl: `${appUrl}/checkout-error`,

    // Webhook — Cardcom calls this server-to-server BEFORE redirecting the user
    // We pass order= so the GET handler can identify the purchase immediately
    IndicatorUrl: `${appUrl}/api/cardcom/webhook?order=${purchase.id}`,

    // Customer details — pre-fills the Cardcom payment form
    CardOwnerName:       customerName,
    CardOwnerEmail:      customerEmail,
    ShowCardOwnerEmail:  "true",
    ReqCardOwnerEmail:   "true",
    ShowCardOwnerPhone:  "true",
    CardOwnerPhone:      customerPhone,

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

  const cardcomRes = await fetch(
    "https://secure.cardcom.solutions/Interface/LowProfile.aspx",
    {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    }
  );

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
    url: `https://secure.cardcom.solutions/External/lowProfileClearing/${terminal}.aspx?LowProfileCode=${lowProfileCode}`,
  });
}
