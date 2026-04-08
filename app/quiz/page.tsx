import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { QuizClient } from "./QuizClient";
import type { Database } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "גלה את הצעד הנכון עבורך | הדר דנן",
  description: "6 שאלות. 2 דקות. תשובה מדויקת על הצעד הנכון לשיווק העסק שלך.",
  alternates: { canonical: "/quiz" },
};

export default async function QuizPage() {
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

  type InitialUser = {
    id: string;
    name: string | null;
    phone: string | null;
    email: string;
    marketing_consent: boolean;
  } | null;

  let initialUser: InitialUser = null;

  if (user) {
    const db = createServerClient();
    const { data: userData } = await db
      .from("users")
      .select("id, name, phone, email, marketing_consent")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (userData) {
      initialUser = {
        id:                 userData.id,
        name:               userData.name,
        phone:              userData.phone,
        email:              userData.email,
        marketing_consent:  userData.marketing_consent,
      };
    }
  }

  return <QuizClient initialUser={initialUser} />;
}
