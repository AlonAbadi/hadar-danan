/**
 * POST /api/user/update-phone
 * Saves phone number for the currently logged-in user.
 * Called before checkout when auth user has no phone on file.
 * Body: { phone: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Database } from "@/lib/supabase/types";

const Body = z.object({
  phone: z.string().min(9).max(20),
});

export async function POST(req: NextRequest) {
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

  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });

  const db = createServerClient();
  await db
    .from("users")
    .update({ phone: body.data.phone })
    .eq("auth_id", user.id);

  return NextResponse.json({ ok: true });
}
