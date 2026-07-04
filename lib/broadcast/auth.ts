// חדר השידור — shared session resolution for the /api/broadcast/* routes.
//
// Two-ID rule: authUserId (auth.users.id) verifies the session and names the
// storage path prefix; userId (public.users.id) is the FK for every table row.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export interface BroadcastSession {
  authUserId: string;
  userId: string;
  hiveActive: boolean;
  isTest: boolean;
}

export async function resolveBroadcastSession(): Promise<BroadcastSession | null> {
  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return null;

  const db = createServerClient();
  const { data: userData } = await (db as any)
    .from("users")
    .select("id, hive_status, is_test")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!userData) return null;

  return {
    authUserId: user.id,
    userId: userData.id,
    hiveActive: userData.hive_status === "active",
    isTest: userData.is_test === true,
  };
}

export async function logBroadcastError(context: string, error: unknown): Promise<void> {
  try {
    const db = createServerClient();
    await (db as any).from("error_logs").insert({
      context,
      error: error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000),
    });
  } catch {
    // last-resort: never let logging mask the original failure
  }
}
