import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import HiveMembersClient from "./HiveMembersClient";
import type { Database } from "@/lib/supabase/types";

export interface HiveContent {
  id: string;
  title: string;
  body: string | null;
  tier_required: string;
  content_type: string;
  url: string | null;
  created_at: string;
}

export default async function HiveMembersPage() {
  const cookieStore = await cookies();

  // 1. Verify session
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
  if (!user) redirect("/login?redirect=/hive/members");

  const db = createServerClient();

  // 2. Get CRM user row
  const { data: userData } = await db
    .from("users")
    .select("id, email, name, hive_status, hive_tier, hive_next_billing_date, hive_started_at")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!userData || userData.hive_status !== "active") {
    redirect("/hive?access=denied");
  }

  // 3. Purchases for credit calculation
  const { data: rawPurchases } = await db
    .from("purchases")
    .select("id, product, amount, status, created_at")
    .eq("user_id", userData.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const purchases = rawPurchases ?? [];
  const credit = purchases.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // 4. Hive content (graceful - table may not exist yet)
  let hiveContent: HiveContent[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db as any)
      .from("hive_content")
      .select("id, title, body, tier_required, content_type, url, created_at")
      .order("created_at", { ascending: false });
    hiveContent = data ?? [];
  } catch {
    hiveContent = [];
  }

  return (
    <HiveMembersClient
      userEmail={userData.email}
      userName={userData.name}
      hiveTier={userData.hive_tier}
      hiveNextBilling={userData.hive_next_billing_date}
      hiveStartedAt={userData.hive_started_at}
      credit={credit}
      hiveContent={hiveContent}
      whatsappUrl={process.env.NEXT_PUBLIC_WHATSAPP_HIVE_URL ?? null}
      zoomNextDate={process.env.NEXT_PUBLIC_ZOOM_NEXT_DATE ?? null}
    />
  );
}
