import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { SignalClient } from "./SignalClient";
import type { Database } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "מנוע האות — TrueSignal© — beegood",
  description:
    "אבחון אישי לפי שיטת TrueSignal©. חמש שאלות, אות מותגי אחד שמחזיר לך את הבידול האמיתי שלך.",
  alternates: { canonical: "/signal" },
};

// Open access — no auth required. Anonymous visitors can answer the 5 questions;
// email + name are captured just before the result is generated (lead gate).
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

  let firstName: string | undefined;
  let email:     string | undefined;

  if (user) {
    const db = createServerClient();
    const { data: userData } = await db
      .from("users")
      .select("name, email")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (typeof userData?.name === "string" && userData.name.trim().length > 0) {
      firstName = userData.name.split(" ")[0];
    }
    if (typeof userData?.email === "string") {
      email = userData.email;
    }
  }

  return <SignalClient firstName={firstName} isAuthenticated={!!user} prefillEmail={email} />;
}
