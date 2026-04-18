import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const { data, error } = await safeFrom(supabase, "atelier_applications")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
    return NextResponse.json({ application: data });
  }

  const { data, error } = await safeFrom(supabase, "atelier_applications")
    .select("id, name, phone, instagram, story, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/atelier/applications] DB error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ applications: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const supabase = createServerClient();

  const { error } = await safeFrom(supabase, "atelier_applications")
    .update(body)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
