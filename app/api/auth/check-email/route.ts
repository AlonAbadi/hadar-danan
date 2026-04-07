import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Checks whether an email exists in the CRM and whether it has a linked auth account.
// Used by the login page to detect "found you" (lead without auth).
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof (body as Record<string, unknown>).email === "string"
    ? ((body as Record<string, unknown>).email as string).toLowerCase().trim()
    : null;

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, status, auth_id, created_at")
    .eq("email", email)
    .maybeSingle();

  if (!data) return NextResponse.json({ exists: false });
  if (data.auth_id) return NextResponse.json({ exists: true, hasAuth: true });

  return NextResponse.json({
    exists: true,
    hasAuth: false,
    name: data.name,
    status: data.status,
    created_at: data.created_at,
  });
}
