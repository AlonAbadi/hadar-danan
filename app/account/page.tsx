import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import AccountClient from "./AccountClient";
import type { Database } from "@/lib/supabase/types";

export default async function AccountPage() {
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
  if (!user) redirect("/login");

  const db = createServerClient();

  const { data: userData } = await db
    .from("users")
    .select("id, name, email, phone, status, hive_status, hive_tier, hive_next_billing_date, marketing_consent")
    .eq("auth_id", user.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPurchases } = userData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (db as any)
        .from("purchases")
        .select("id, product, amount, amount_paid, status, created_at")
        .eq("user_id", userData.id)
        .in("status", ["completed", "pending"])
        .order("created_at", { ascending: false })
    : { data: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPurchases: any[] = rawPurchases ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedPurchases: any[] = allPurchases.filter((p: any) => p.status === "completed");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingPurchases: any[]  = allPurchases.filter((p: any) => p.status === "pending");

  // Credit = amount paid on most recent completed non-hive purchase.
  const HIVE_PRODUCTS = new Set(["hive_starter_160", "hive_pro_280", "hive_elite_480"]);
  const mostRecentNonHive = completedPurchases.find(
    (p) => !HIVE_PRODUCTS.has(p.product)
  );
  const credit: number = mostRecentNonHive
    ? (mostRecentNonHive.amount_paid ?? mostRecentNonHive.amount)
    : 0;

  const { data: quizResult } = userData
    ? await db
        .from("quiz_results")
        .select("answers, scores, recommended_product, second_product, match_percent, created_at")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const isGoogleUser =
    user.app_metadata?.provider === "google" ||
    (user.identities ?? []).some((id) => id.provider === "google");

  return (
    <AccountClient
      authUser={{ id: user.id, email: user.email ?? "" }}
      userData={userData ?? null}
      completedPurchases={completedPurchases}
      pendingPurchases={pendingPurchases}
      credit={credit}
      isGoogleUser={isGoogleUser}
      quizResult={quizResult ?? null}
    />
  );
}
