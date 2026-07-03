/**
 * /hive/signal-kit
 *
 * The Hive perk hub: every text + visual asset generated from the member's
 * signal, in one place, with copy/download buttons. Gated to
 * hive_status='active' + must have a signal extraction (member is sent to
 * /signal to take the diagnostic if missing).
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { SignalKitClient } from "./SignalKitClient";

export const dynamic = "force-dynamic";

export default async function SignalKitPage() {
  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
  if (!authUser) redirect("/login?next=/hive/signal-kit");

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (db as any)
    .from("users")
    .select("id, email, name, hive_status, hive_tier, occupation")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (!userData) redirect("/account");
  if (userData.hive_status !== "active") redirect("/hive");

  // Latest extraction (if any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, signal, generated_at")
    .eq("user_id", userData.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Paid member with no diagnostic yet (bought directly from /signal-hive):
  // send them straight into the diagnostic instead of an empty kit. /signal
  // shows a "payment received, one step left" banner via ?from=kit, and its
  // hive-active completion path routes back here.
  if (!ext) redirect("/signal?from=kit");

  return (
    <SignalKitClient
      firstName={userData.name?.split(" ")[0] ?? ""}
      occupation={userData.occupation ?? null}
      tier={userData.hive_tier ?? null}
      extraction={ext}
    />
  );
}
