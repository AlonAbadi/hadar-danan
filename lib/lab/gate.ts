/**
 * Shoot Day Lab — access gate.
 *
 * The lab is an *isolated prototype*. It must never be reachable by real
 * customers until Alon flips this list. Both the /shoot-day-lab page and
 * every /api/lab/* route call this gate before doing anything.
 */
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Emails allowed to see and use the lab. Never remove Alon. */
export const LAB_ALLOWED_EMAILS = new Set<string>([
  "alonabadi9@gmail.com",
]);

export type LabUser = {
  id:       string;
  authId:   string;
  email:    string;
  name:     string | null;
  gender:   "m" | "f" | null;
};

/** Server-component gate. Returns null if the caller isn't allowed. */
export async function resolveLabUser(): Promise<LabUser | null> {
  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
  );
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
  if (!authUser) return null;

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (db as any)
    .from("users")
    .select("id, name, email, gender")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!userRow?.email) return null;
  if (!LAB_ALLOWED_EMAILS.has(userRow.email)) return null;

  return {
    id:     userRow.id,
    authId: authUser.id,
    email:  userRow.email,
    name:   userRow.name ?? null,
    gender: userRow.gender === "m" || userRow.gender === "f" ? userRow.gender : null,
  };
}

/** Route-handler gate. Returns { ok:true, user } or { ok:false, response }. */
export async function requireLabUser(_req: NextRequest):
  Promise<{ ok: true; user: LabUser } | { ok: false; response: NextResponse }> {
  const user = await resolveLabUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: "lab_forbidden" }, { status: 403 }) };
  return { ok: true, user };
}
