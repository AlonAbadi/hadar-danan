/**
 * POST /api/hive/join
 *
 * Starts a Hive subscription. Creates a pending purchase row, opens a
 * Cardcom LowProfile session with Operation=2 (charge + tokenize), and
 * returns the redirect URL.
 *
 * Hive activation (hive_status / hive_tier / hive_started_at / cardcom_token /
 * cardcom_recurring_id) is set by /api/cardcom/webhook on payment success.
 * This route never activates hive on its own — keeps the source of truth
 * single and protects against pre-payment access.
 *
 * Body:     { email, name, tier: "basic_59" | "full_149" }
 * Response: { url: string, purchaseId: string }
 *         | { status: "pending_payment", message: string }   // Cardcom creds missing
 *         | { errors: {...} } | { error: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sendCapiEvent } from "@/lib/meta-capi";
import { createHiveLowProfileSession } from "@/lib/cardcom/lowprofile";

const TIER_PRICE: Record<string, number> = {
  basic_59: 59,
  full_149: 149,
};

const TIER_PRODUCT: Record<string, "hive_basic_59" | "hive_full_149"> = {
  basic_59: "hive_basic_59",
  full_149: "hive_full_149",
};

const TIER_PRODUCT_NAME: Record<string, string> = {
  basic_59: "הכוורת — מסלול בסיסי",
  full_149: "הכוורת — מסלול מלא",
};

const BodySchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  name:  z.string().min(1, "נדרש שם"),
  tier:  z.enum(["basic_59", "full_149"]),
});

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      errors[field] = issue.message;
    }
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { email, name, tier } = parsed.data;
  const price       = TIER_PRICE[tier];
  const product     = TIER_PRODUCT[tier];
  const productName = TIER_PRODUCT_NAME[tier];

  const supabase = createServerClient();

  try {
    // ── Upsert user (no hive activation yet — that happens in the webhook) ──
    const { data: user, error: upsertErr } = await supabase
      .from("users")
      .upsert(
        {
          email,
          name,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: "email,tenant_id",
          ignoreDuplicates: false,
        }
      )
      .select("id, name, phone")
      .single();

    if (upsertErr || !user) throw upsertErr ?? new Error("Upsert returned no user");

    // Track which tier the user is attempting — used by the webhook to know
    // which tier to activate. We store on the purchase metadata via product.
    // The pending purchase is the source of truth.
    // ── Create pending purchase row ────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: purchase, error: purchaseErr } = await (supabase as any)
      .from("purchases")
      .insert({
        user_id:      user.id,
        product,
        amount:       price,
        currency:     "ILS",
        status:       "pending",
        is_recurring: true,
      })
      .select("id")
      .single();

    if (purchaseErr || !purchase) throw purchaseErr ?? new Error("Could not create purchase row");

    // ── If Cardcom creds aren't set, keep the legacy "pending_payment" path ─
    if (!process.env.CARDCOM_TERMINAL || !process.env.CARDCOM_API_NAME) {
      return NextResponse.json({
        status:  "pending_payment",
        message: "נדרש תשלום — יתווסף בקרוב",
      });
    }

    // ── Fire InitiateCheckout CAPI (mirrors /api/checkout pattern) ─────────
    const icUserData = {
      email,
      phone:           user.phone ?? undefined,
      fbp:             req.cookies.get("_fbp")?.value,
      fbc:             req.cookies.get("_fbc")?.value,
      clientUserAgent: req.headers.get("user-agent") ?? undefined,
    };
    const icCustomData = {
      value:       price,
      currency:    "ILS",
      contentName: product,
      contentIds:  [product],
    };
    await sendCapiEvent({
      eventName:  "InitiateCheckout",
      eventId:    `ic_${purchase.id}`,
      userData:   icUserData,
      customData: icCustomData,
    });

    // ── Open Cardcom LowProfile session (Operation=2 → charge + tokenize) ──
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";
    const session = await createHiveLowProfileSession({
      purchaseId:    purchase.id,
      amount:        price,
      productName,
      customerName:  user.name ?? name,
      customerEmail: email,
      customerPhone: user.phone ?? "",
      appUrl,
    });

    if (!session.ok) {
      await supabase.from("error_logs").insert({
        context: "api/hive/join — lowprofile",
        error:   session.error,
        payload: { purchaseId: purchase.id, email, tier, raw: "raw" in session ? session.raw : undefined },
      });
      return NextResponse.json(
        { error: "תקלה זמנית בפתיחת התשלום. נסה שוב בעוד רגע." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      url:        session.redirectUrl,
      purchaseId: purchase.id,
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    try {
      await supabase.from("error_logs").insert({
        context: "api/hive/join",
        error:   message,
        payload: { email, tier },
      });
    } catch {}

    return NextResponse.json({ error: "שגיאת שרת, נסה שוב" }, { status: 500 });
  }
}
