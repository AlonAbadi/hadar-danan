import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import BingeClient from "./BingeClient";

export const metadata: Metadata = {
  title: "בינג׳ | ספריית התוכן של הכוורת — הדר דנן",
  description: "תהליכים מלאים, רילסים, ולקוחות אמיתיים שעברו את שיטת TrueSignal©. הספרייה המלאה פתוחה לחברי הכוורת.",
  alternates: { canonical: "/binge" },
};

export default async function BingePage() {
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

  let isMember = false;
  if (user) {
    const db = createServerClient();
    const { data: userData } = await db
      .from("users")
      .select("hive_status")
      .eq("auth_id", user.id)
      .maybeSingle();
    isMember = userData?.hive_status === "active";
  }

  return <BingeClient isMember={isMember} isLoggedIn={!!user} />;
}
