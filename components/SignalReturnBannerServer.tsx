import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { kaveretLink } from "@/lib/signal/kaveret-token";
import { SignalReturnBanner } from "./SignalReturnBanner";
import type { Database } from "@/lib/supabase/types";

/**
 * Server gate for SignalReturnBanner. Renders only when the logged-in user:
 *   - has completed at least one signal diagnosis
 *   - is not already a buyer/booked (they converted; don't nag)
 *   - is not an active hive member (they get HiveFloatBar instead)
 * Link goes to the permanent locked result page (kaveretLink token).
 * Respects the KAVERET_RESULT_ENABLED kill switch.
 */
export async function SignalReturnBannerServer() {
  if (!process.env.KAVERET_RESULT_ENABLED) return null;

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

    const db = createServerClient() as any; // hive_status/status typing gap in hand-written types
    const { data: userData } = await db
      .from("users")
      .select("id, status, hive_status")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!userData?.id) return null;
    if (userData.hive_status === "active") return null;
    if (["buyer", "booked"].includes(userData.status)) return null;

    const { data: extraction } = await db
      .from("signal_extractions")
      .select("id, signal")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!extraction?.id) return null;

    const lang = extraction.signal?.language === "en" ? "en" : "he";
    return <SignalReturnBanner href={kaveretLink(extraction.id, lang)} />;
  } catch {
    return null;
  }
}
