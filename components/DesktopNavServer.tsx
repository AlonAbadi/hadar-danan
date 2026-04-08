import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { DesktopNav } from "./DesktopNav";
import type { Database } from "@/lib/supabase/types";

export async function DesktopNavServer() {
  let userInitial: string | null = null;

  try {
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
    if (user) {
      const db = createServerClient();
      const { data: userData } = await db
        .from("users")
        .select("name, email")
        .eq("auth_id", user.id)
        .maybeSingle();

      const displayName = userData?.name || userData?.email || user.email || "?";
      userInitial = displayName.charAt(0).toUpperCase();
    }
  } catch {
    // Session read failed — show logged-out state
  }

  return <DesktopNav userInitial={userInitial} />;
}
