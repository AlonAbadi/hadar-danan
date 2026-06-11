import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { SignalClient } from "./SignalClient";
import type { Database } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "מנוע האות — TrueSignal© — beegood",
  description:
    "אבחון אישי לפי שיטת TrueSignal©. חמש שאלות, אות מותגי אחד שמחזיר לך את הבידול האמיתי שלך.",
  alternates: { canonical: "/signal" },
};

export default async function SignalPage() {
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
  if (!user) redirect("/login?next=/signal");

  const db = createServerClient();
  const { data: userData } = await db
    .from("users")
    .select("name")
    .eq("auth_id", user.id)
    .maybeSingle();

  const firstName =
    typeof userData?.name === "string" && userData.name.trim().length > 0
      ? userData.name.split(" ")[0]
      : undefined;

  return <SignalClient firstName={firstName} />;
}
