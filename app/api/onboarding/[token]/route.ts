import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("atelier_applications")
    .select("id, name, instagram, whatsapp, niche, target_audience, tone_keywords, products, testimonials, business_type, business_id, business_address, documents, onboarding_submitted_at")
    .eq("onboarding_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "קישור לא תקף או שפג תוקפו" }, { status: 404 });
  }

  return NextResponse.json({ app: data });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchErr } = await (supabase as any)
    .from("atelier_applications")
    .select("id")
    .eq("onboarding_token", token)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "קישור לא תקף" }, { status: 404 });
  }

  const body = await req.json();
  const {
    whatsapp, niche, target_audience, tone_keywords,
    products, testimonials, documents,
    business_type, business_id, business_address,
  } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (supabase as any)
    .from("atelier_applications")
    .update({
      whatsapp,
      niche,
      target_audience,
      tone_keywords,
      products,
      testimonials,
      documents,
      business_type,
      business_id,
      business_address,
      onboarding_submitted_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (updateErr) {
    return NextResponse.json({ error: "שגיאת שמירה" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
