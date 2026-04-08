import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify auth using SSR client (anon key + session cookies)
  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Service role client for all DB operations
  const db = createServerClient();

  // Resolve auth user → public users.id
  const { data: userData } = await db
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!userData) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  // Mark purchase as failed — only if it belongs to this user AND is still pending.
  // No updated_at column on purchases table.
  // Status 'failed' is used for user-cancelled purchases (no 'cancelled' enum value).
  const { data, error } = await db
    .from("purchases")
    .update({ status: "failed" })
    .eq("id", id)
    .eq("user_id", userData.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    await db.from("error_logs").insert({
      context: "/api/purchases/[id]/cancel",
      error: error.message,
      payload: { purchase_id: id, user_id: userData.id },
    });
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "not found or already processed" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
