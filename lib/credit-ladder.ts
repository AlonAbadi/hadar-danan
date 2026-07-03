/**
 * The controlled credit ladder — ONE credit system (BUILD_SPEC §9, AUDIT §ב).
 *
 * Static, one-time products only. One credit per purchase (the highest
 * available), never stacked, capped at the target's list price. The source
 * must be a completed purchase whose credit was never consumed
 * (credited_toward IS NULL). Coupons override credits (existing behavior).
 *
 * Replaces BOTH legacy systems: lib/credit.ts (getUserCredit — the
 * exploitable "2×paid−list" formula) and the ad-hoc signal-hive block that
 * lived in /api/checkout.
 */

import type { createServerClient } from "@/lib/supabase/server";

export const CREDIT_LADDER: Record<string, { from: string; amount: number }[]> = {
  workshop_1080: [
    { from: "signal_hive_590", amount: 590 },
    { from: "challenge_197",   amount: 197 },
  ],
  course_1800: [
    { from: "workshop_1080",   amount: 1080 },
    { from: "signal_hive_590", amount: 590 },
  ],
  strategy_4000: [
    { from: "course_1800",     amount: 1800 },
  ],
};

export interface CreditResult {
  credit:            number;
  sourcePurchaseId:  string | null;
  sourceProduct:     string | null;
  sourceInvoice:     string | null;
}

const NO_CREDIT: CreditResult = { credit: 0, sourcePurchaseId: null, sourceProduct: null, sourceInvoice: null };

/**
 * The single highest unconsumed credit this user holds toward `target`.
 * The client never sends an amount — this is the only source of truth.
 */
export async function computeCredit(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  target: string,
  listPrice: number,
): Promise<CreditResult> {
  const rungs = CREDIT_LADDER[target];
  if (!rungs || rungs.length === 0) return NO_CREDIT;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sources } = await (supabase as any)
      .from("purchases")
      .select("id, product, invoice_number")
      .eq("user_id", userId)
      .eq("status", "completed")
      .is("credited_toward", null)
      .in("product", rungs.map((r) => r.from));

    if (!sources || sources.length === 0) return NO_CREDIT;

    // Highest rung first (rungs are declared in descending credit order).
    for (const rung of rungs) {
      const src = (sources as { id: string; product: string; invoice_number: string | null }[])
        .find((s) => s.product === rung.from);
      if (src) {
        return {
          credit:           Math.min(rung.amount, listPrice),
          sourcePurchaseId: src.id,
          sourceProduct:    rung.from,
          sourceInvoice:    src.invoice_number ?? null,
        };
      }
    }
    return NO_CREDIT;
  } catch {
    // Credit is a discount, never a blocker — failure degrades to full price.
    return NO_CREDIT;
  }
}

/**
 * Atomic consumption at completion time (webhook). Returns true if this call
 * won the mark; false means the credit was consumed by a concurrent purchase
 * (Race A) — the caller must STILL fulfill (the customer already paid the
 * discounted net) and alert admins about the undercharge.
 */
export async function consumeCredit(
  supabase: ReturnType<typeof createServerClient>,
  sourcePurchaseId: string,
  targetPurchaseId: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("purchases")
    .update({ credited_toward: targetPurchaseId })
    .eq("id", sourcePurchaseId)
    .is("credited_toward", null)
    .select("id");
  return Array.isArray(data) && data.length === 1;
}
