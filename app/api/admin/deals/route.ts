import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await (supabase as any)
    .from("deals")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { data, error } = await (supabase as any)
    .from("deals")
    .insert({
      brand_name: body.brand_name,
      brand_logo_url: body.brand_logo_url || null,
      category: body.category || "כללי",
      product_description: body.product_description,
      discount_text: body.discount_text,
      coupon_code: body.coupon_code,
      store_url: body.store_url || null,
      expires_at: body.expires_at || null,
      is_featured: body.is_featured ?? false,
      is_active: body.is_active ?? true,
      display_order: body.display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
