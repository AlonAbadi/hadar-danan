/**
 * POST /api/checkout
 *
 * Creates a Cardcom payment page and returns the redirect URL.
 * Currently returns 503 until CARDCOM_TERMINAL + CARDCOM_API_NAME are set.
 *
 * Body: { product: "challenge_197" | "workshop_1080" | "strategy_4000", user_id: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const PRICES: Record<string, number> = {
  challenge_197:  197,
  workshop_1080: 1080,
  course_1800:   1800,
  strategy_4000: 4000,
  premium_14000: 14000,
  test_1:        1,
};

const NAMES: Record<string, string> = {
  challenge_197:  "צ׳אלנג׳ 7 הימים",
  workshop_1080:  "וורקשופ מתקדם",
  course_1800:    "קורס דיגיטלי - 16 שיעורים",
  strategy_4000:  "שיחת אסטרטגיה",
  premium_14000:  "יום צילום פרמיום",
  test_1:         "מוצר טסט",
};

const BodySchema = z.object({
  product:  z.enum(["challenge_197", "workshop_1080", "course_1800", "strategy_4000", "premium_14000", "test_1"]),
  user_id:  z.string().uuid(),
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
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://hadar-danan.vercel.app";

  const supabase = createServerClient();

  // Cancel any existing pending purchases for this user+product combo
  // before creating a new one. This prevents duplicate pending rows when
  // a user clicks "complete payment" multiple times.
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
  const amount = Math.max(0, listPrice - credit);

  // If fully covered by credit, no payment needed
  if (amount === 0) {
    // Create a completed purchase directly - no payment required
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

    // Fire the same events that the webhook would fire
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

  // Cardcom LowProfile API
  const params = new URLSearchParams({
    TerminalNumber: terminal,
    UserName: apiName,
    SumToBill: String(amount),
    CoinId: "1",
    Language: "he",
    ProductName: NAMES[product],
    ReturnValue: purchase.id,
    SuccessRedirectUrl: product === "challenge_197"
      ? `${appUrl}/challenge/thank-you`
      : `${appUrl}/${product.split("_")[0]}/success`,
    ErrorRedirectUrl: `${appUrl}/checkout-error`,
    IndicatorUrl: `${appUrl}/api/cardcom/webhook`,
    Codepage: "65001",
    APILevel: "10",
    Operation: "1",
  });

  const cardcomRes = await fetch(
    `https://secure.cardcom.solutions/Interface/LowProfile.aspx?${params.toString()}`,
    { method: "POST" }
  );

  const text = await cardcomRes.text();
  const resultParams = new URLSearchParams(text);
  const responseCode = resultParams.get("ResponseCode");
  const lowProfileCode = resultParams.get("LowProfileCode");

  if (responseCode !== "0" || !lowProfileCode) {
    await supabase.from("error_logs").insert({
      context: "api/checkout",
      error: "Cardcom create failed",
      payload: { responseCode, description: resultParams.get("Description"), text },
    });
    return NextResponse.json({ error: "Payment provider error" }, { status: 502 });
  }

  return NextResponse.json({
    url: `https://secure.cardcom.solutions/External/lowProfileClearing/${terminal}.aspx?LowProfileCode=${lowProfileCode}`,
  });
}
