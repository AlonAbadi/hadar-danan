/**
 * GET /api/user/me
 * Returns the current logged-in user's profile from public.users.
 * Used by CTA components to detect auth session without needing form re-entry.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function GET() {
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
  if (!user) return NextResponse.json({ id: null });

  const db = createServerClient();
  const { data } = await db
    .from("users")
    .select("id, name, email, phone")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!data) return NextResponse.json({ id: null });

  return NextResponse.json({
    id:    data.id,
    name:  data.name,
    email: data.email,
    phone: data.phone,
  });
}
