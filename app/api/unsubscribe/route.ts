import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "נדרש אימייל" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await supabase
      .from("users")
      .update({ marketing_consent: false })
      .eq("id", user.id);

    await supabase.from("events").insert({
      user_id: user.id,
      type: "MARKETING_UNSUBSCRIBE",
      data: { source: "unsubscribe_page" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    try {
      await createServerClient()
        .from("error_logs")
        .insert({ context: "api/unsubscribe", error: String(err) });
    } catch { /* ignore */ }
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const base = req.nextUrl.origin;
  if (email) {
    return NextResponse.redirect(`${base}/unsubscribe?email=${encodeURIComponent(email)}`);
  }
  return NextResponse.redirect(`${base}/unsubscribe`);
}
