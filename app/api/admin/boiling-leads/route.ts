/**
 * GET /api/admin/boiling-leads
 *
 * Returns up to N (default 20) users whose most recent signal extraction
 * routed them to the "strategy" bucket (signal_temperature = 'boiling').
 * Sorted by most recently extracted.
 *
 * Used by:
 *   - /admin homepage banner (top 10)
 *   - /admin/crm Dashboard tab (top 20)
 *
 * Basic Auth required — same as all /api/admin/*.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const url   = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 50);

  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("users")
    .select("id, name, email, phone, occupation, signal_temperature_at")
    .eq("signal_temperature", "boiling")
    .order("signal_temperature_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ users: [], error: error.message }, { status: 200 });
  }

  type Row = {
    id: string; name: string | null; email: string | null;
    phone: string | null; occupation: string | null;
    signal_temperature_at: string | null;
  };

  return NextResponse.json({
    users: (data as Row[] | null ?? []).map((u) => ({
      id:         u.id,
      name:       u.name ?? u.email ?? "—",
      phone:      u.phone ?? "",
      occupation: u.occupation ?? "",
      time:       u.signal_temperature_at ?? "",
    })),
  });
}
