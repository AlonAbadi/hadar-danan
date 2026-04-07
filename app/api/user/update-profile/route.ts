import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  // Verify session
  const cookieStore = await cookies();
  const supabase = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name  = typeof (body as Record<string, unknown>).name  === "string" ? ((body as Record<string, unknown>).name  as string).trim() : null;
  const phone = typeof (body as Record<string, unknown>).phone === "string" ? ((body as Record<string, unknown>).phone as string).trim() : null;

  const db = createServerClient();
  const { error } = await db
    .from("users")
    .update({ name: name || null, phone: phone || null })
    .eq("auth_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
