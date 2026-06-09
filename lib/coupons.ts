/**
 * URL-based coupon validation.
 *
 * Used in two places — both server-side, same logic:
 *   1. Workshop page render: decides what price to display when ?code= present
 *   2. /api/checkout: decides what to bill via Cardcom + write to purchases
 *
 * Returns null if the code is missing, unknown, inactive, expired, exhausted,
 * or for a different product. Returns the resolved amounts when valid.
 *
 * The caller passes the product so a workshop coupon can't accidentally
 * discount a course purchase.
 */
import { createServerClient } from "@/lib/supabase/server";
import { PRODUCT_MAP, type ProductKey } from "@/lib/products";

export type ValidatedCoupon = {
  code:           string;
  discountAmount: number;   // ILS off the list price
  listPrice:      number;   // product's full price
  finalPrice:     number;   // listPrice - discountAmount, what to charge
};

export async function validateCoupon(
  code:    string | null | undefined,
  product: ProductKey,
): Promise<ValidatedCoupon | null> {
  if (!code) return null;

  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coupon } = await (supabase as any)
    .from("coupons")
    .select("code, product, discount_percent, max_uses, used_count, expires_at, active")
    .eq("code", code)
    .maybeSingle();

  if (!coupon)                            return null;
  if (!coupon.active)                     return null;
  if (coupon.product !== product)         return null;
  if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) return null;
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return null;

  const listPrice      = PRODUCT_MAP[product].price;
  const discountAmount = Math.round(listPrice * coupon.discount_percent / 100);
  const finalPrice     = listPrice - discountAmount;

  return { code: coupon.code, discountAmount, listPrice, finalPrice };
}
