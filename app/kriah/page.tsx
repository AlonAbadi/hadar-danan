import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { unifiedFunnelEnabled } from "@/lib/isolation";
import { createServerClient } from "@/lib/supabase/server";
import { KriahClient } from "./KriahClient";
import type { Database } from "@/lib/supabase/types";

// Hidden v2 funnel (BUILD_SPEC_KRIAH_V2 §1). Three isolation layers:
// flag / preview-secret gate, noindex, robots DISALLOW. Zero inbound links.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "כולם מייצרים תוכן. למה שיבחרו דווקא בכם?",
  description: "כשאין תשובה ברורה לשאלה למה דווקא אתם, שום תוכן לא יחזיק. כאן מגיעים לשורש: הסיבה שלקוחות בוחרים דווקא בכם. חינם.",
};

export default async function KriahPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const sp = await searchParams;
  // Alon's decision (2026-07-03): no secret, no cookie. The page is unreachable
  // organically (zero inbound links, noindex, robots DISALLOW) — obscurity is
  // the gate. While the launch flag is OFF, every run is stamped is_test and
  // lands in the dedicated /admin/kriah/tests list.
  const key = sp?.key ?? "";

  // A registered user redoing the diagnosis must never hit the S8 sign-in
  // gate again — read the session server-side (same pattern as /signal) and
  // hand the client everything the gates would have asked for.
  let initialUser: { email: string; name?: string; phone?: string } | null = null;
  const cookieStore = await cookies();
  const supabase = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const db = createServerClient();
    const { data: userData } = await db
      .from("users")
      .select("name, email, phone")
      .eq("auth_id", user.id)
      .maybeSingle();
    const email = userData?.email ?? user.email;
    if (email) {
      initialUser = {
        email,
        ...(userData?.name?.trim() ? { name: userData.name.trim() } : {}),
        ...(userData?.phone?.trim() ? { phone: userData.phone.trim() } : {}),
      };
    }
  }

  return (
    <KriahClient
      previewKey={key}
      initialUser={initialUser}
      // During the hidden phase every run is a test run — the flag being off
      // means the only way in is the preview secret, i.e. a tester.
      isTest={!unifiedFunnelEnabled()}
    />
  );
}
