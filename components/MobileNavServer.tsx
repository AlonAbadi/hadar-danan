import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { MobileNav } from "./MobileNav";
import type { Database } from "@/lib/supabase/types";

export async function MobileNavServer() {
  let userInitial: string | null = null;
  let hiveActive = false;

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
        .select("name, email, hive_status")
        .eq("auth_id", user.id)
        .maybeSingle();

      const displayName = userData?.name || userData?.email || user.email || "?";
      userInitial = displayName.split(" ")[0]; // first name (or email prefix)
      hiveActive = userData?.hive_status === "active";
    }
  } catch {
    // Session read failed — show logged-out state
  }

  return <MobileNav userInitial={userInitial} hiveActive={hiveActive} />;
}
