/**
 * Server-side credit helper.
 *
 * Credit = SUM of purchases.amount for all completed purchases.
 * This is the actual money paid (not list prices), so every shekel ever
 * paid counts toward the next purchase.
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
    .select("amount")
    .eq("user_id", user.id)
    .eq("status", "completed");

  return (purchases ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
}
