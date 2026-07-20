import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { HiveFloatBar } from "./HiveFloatBar";
import type { Database } from "@/lib/supabase/types";

export async function HiveFloatBarServer() {
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
    if (!user) return null;

    const db = createServerClient();
    const { data: userData } = await db
      .from("users")
      .select("hive_status")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (userData?.hive_status !== "active") return null;
  } catch {
    return null;
  }

  return <HiveFloatBar />;
}
