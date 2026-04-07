/**
 * GET /api/user/credit?user_id=<uuid>
 *
 * Returns the total credit a user has accumulated - defined as the SUM of
 * purchases.amount for all completed purchases (actual amounts paid, not list prices).
 *
 * Credit is applied at checkout: amount_to_charge = MAX(0, list_price - credit)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  let userId = req.nextUrl.searchParams.get("user_id");

  // Also support lookup by email
  const email = req.nextUrl.searchParams.get("email");
  if (!userId && email) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ credit: 0 });
  }

  const { data, error } = await supabase
    .from("purchases")
    .select("amount")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const credit = (data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return NextResponse.json({ credit });
}
