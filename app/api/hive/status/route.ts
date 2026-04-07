import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ status: "none", tier: null }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("users")
      .select("hive_status, hive_tier")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!data || !data.hive_status) {
      return NextResponse.json({ status: "none", tier: null });
    }

    return NextResponse.json({
      status: data.hive_status as string,
      tier: data.hive_tier as string | null,
    });
  } catch {
    return NextResponse.json({ status: "none", tier: null });
  }
}
