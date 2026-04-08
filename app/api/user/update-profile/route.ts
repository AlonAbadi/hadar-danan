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

  // Only update fields that are explicitly present in the body - never wipe fields that aren't sent
  const rawBody = body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if ("name" in rawBody) {
    const name = typeof rawBody.name === "string" ? rawBody.name.trim() : null;
    updates.name = name || null;
  }
  if ("phone" in rawBody) {
    const phone = typeof rawBody.phone === "string" ? rawBody.phone.trim() : null;
    updates.phone = phone || null;
  }
  if ("marketing_consent" in rawBody && typeof rawBody.marketing_consent === "boolean") {
    updates.marketing_consent = rawBody.marketing_consent;
    // Record the timestamp when consent is granted
    if (rawBody.marketing_consent) {
      updates.consent_at = new Date().toISOString();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const db = createServerClient();
  const { error } = await db
    .from("users")
    .update(updates)
    .eq("auth_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
