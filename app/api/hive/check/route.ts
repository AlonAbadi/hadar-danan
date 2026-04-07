/**
 * POST /api/hive/check
 *
 * Checks if an email is eligible for the discounted ₪29 Hive tier.
 * Qualifying products: challenge_197, workshop_1080, course_1800, strategy_4000, premium_14000
 *
 * Body: { email: string }
 * Response: { eligible: boolean, message?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const QUALIFYING_PRODUCTS = [
  "challenge_197",
  "workshop_1080",
  "course_1800",
  "strategy_4000",
  "premium_14000",
] as const;

export async function POST(req: NextRequest) {
  let email: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "נדרש שדה אימייל" }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // Look up user by email
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (userErr) throw userErr;

    if (!user) {
      return NextResponse.json({ eligible: false, message: "לא נמצא משתמש עם כתובת אימייל זו" });
    }

    // Check for at least one completed purchase in a qualifying product
    const { data: purchases, error: purchasesErr } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .in("product", QUALIFYING_PRODUCTS)
      .limit(1);

    if (purchasesErr) throw purchasesErr;

    const eligible = (purchases ?? []).length > 0;

    return NextResponse.json({
      eligible,
      message: eligible
        ? "זכאי למחיר מיוחד ₪29 לחודש"
        : "לא נמצאה רכישה קודמת - המחיר הרגיל הוא ₪97 לחודש",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    try {
      await supabase.from("error_logs").insert({
        context: "api/hive/check",
        error: message,
        payload: { email },
      });
    } catch {}

    return NextResponse.json({ error: "שגיאת שרת, נסה שוב" }, { status: 500 });
  }
}
