import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const token = formData.get("token") as string | null;

  if (!file || !token) {
    return NextResponse.json({ error: "חסרים שדות" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Validate token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app, error: tokenErr } = await (supabase as any)
    .from("atelier_applications")
    .select("id")
    .eq("onboarding_token", token)
    .single();

  if (tokenErr || !app) {
    return NextResponse.json({ error: "קישור לא תקף" }, { status: 403 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `docs/${app.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: uploadErr } = await (supabase as any).storage
    .from("atelier-uploads")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadErr) {
    return NextResponse.json({ error: "שגיאת העלאה" }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (supabase as any).storage
    .from("atelier-uploads")
    .getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl, name: file.name, type: file.type });
}
