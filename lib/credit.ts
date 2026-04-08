/**
 * Server-side credit helper.
 *
 * Credit = deposits minus withdrawals, excluding hive products.
 * - Deposit per purchase = amount_paid (what the user actually paid)
 * - Withdrawal per purchase = discount used = amount - amount_paid
 * - Net per purchase = 2 * amount_paid - amount
 *
 * Example: paid 197 for challenge (no discount) → earns 197.
 *          paid 1603 for course (197 discount used) → earns 1603, spent 197.
 *          Net = 197 + 1603 - 197 = 1603.
 *
 * Hive subscriptions do not earn or spend credit.
 */
import { createServerClient } from "@/lib/supabase/server";

export async function getUserCredit(email: string): Promise<number> {
  if (!email) return 0;
  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (!user) return 0;

  const { data: purchases } = await supabase
    .from("purchases")
    .select("amount, amount_paid")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .not("product", "like", "hive_%");

  return (purchases ?? []).reduce((sum, p) => {
    const paid = p.amount_paid ?? p.amount ?? 0;
    const list = p.amount ?? 0;
    return sum + (2 * paid - list);
  }, 0);
}
