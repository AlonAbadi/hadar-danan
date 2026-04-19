import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const { data, error } = await (supabase as any)
    .from("deals")
    .update({
      brand_name: body.brand_name,
      brand_logo_url: body.brand_logo_url || null,
      category: body.category,
      product_description: body.product_description,
      discount_text: body.discount_text,
      coupon_code: body.coupon_code,
      store_url: body.store_url || null,
      expires_at: body.expires_at || null,
      is_featured: body.is_featured,
      is_active: body.is_active,
      display_order: body.display_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await (supabase as any).from("deals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
