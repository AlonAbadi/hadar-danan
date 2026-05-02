import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { linkAuthUser } from "@/lib/auth/link-user";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const email    = typeof body.email    === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check if auth user already exists for this email
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === email);

  let authId: string;

  if (existing) {
    // Update password on existing account
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password });
    if (error) {
      return NextResponse.json({ error: "שגיאה בעדכון הסיסמה" }, { status: 500 });
    }
    authId = existing.id;
  } else {
    // Create new auth account — email already verified (they just paid)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      return NextResponse.json({ error: "שגיאה ביצירת החשבון" }, { status: 500 });
    }
    authId = data.user.id;
  }

  // Link auth_id to public.users row
  await linkAuthUser(authId, email);

  return NextResponse.json({ ok: true });
}
