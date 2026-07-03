import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
//
// For Hive-active members who already have an extraction, this page would be a
// dead end (just shows their saved result with a misleading "see Hive pricing"
// CTA). We send them straight to /hive/signal-kit instead, where the result
// lives alongside all the derived artifacts. ?stay=1 escapes the redirect for
// admin/debug previews.
export default async function SignalPage({ searchParams }: { searchParams: Promise<{ stay?: string; from?: string }> }) {
  const sp = await searchParams;
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

  let firstName:  string | undefined;
  let lastName:   string | undefined;
  let email:      string | undefined;
  let phone:      string | undefined;
  let occupation: string | undefined;
  let prefGender: "m" | "f" | undefined;
  let hiveActive: boolean = false;

  if (user) {
    const db = createServerClient();
    // occupation/gender aren't in the generated Database types yet (same as the
    // extract route, which uses an untyped client for these columns).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (db as any)
      .from("users")
      .select("id, name, email, phone, occupation, gender, hive_status")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (typeof userData?.name === "string" && userData.name.trim().length > 0) {
      const parts = userData.name.trim().split(/\s+/);
      firstName = parts[0];
      if (parts.length > 1) lastName = parts.slice(1).join(" ");
    }
    if (typeof userData?.email === "string") {
      email = userData.email;
    }
    if (typeof userData?.phone === "string" && userData.phone.trim().length > 0) {
      phone = userData.phone.trim();
    }
    if (typeof userData?.occupation === "string" && userData.occupation.trim().length > 0) {
      occupation = userData.occupation.trim();
    }
    if (userData?.gender === "m" || userData?.gender === "f") {
      prefGender = userData.gender;
    }
    hiveActive = userData?.hive_status === "active";

    // Redirect Hive-active members with an existing extraction to the Signal
    // Kit — the page that turns their signal into actual usable artifacts.
    if (hiveActive && userData?.id && sp?.stay !== "1" && sp?.from !== "kit") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ext } = await (db as any)
        .from("signal_extractions")
        .select("id")
        .eq("user_id", userData.id)
        .limit(1)
        .maybeSingle();
      if (ext?.id) {
        redirect("/hive/signal-kit");
      }
    }
  }

  return (
    <SignalClient
      firstName={firstName}
      prefillLastName={lastName}
      isAuthenticated={!!user}
      prefillEmail={email}
      prefillPhone={phone}
      prefillOccupation={occupation}
      prefillGender={prefGender}
      hiveActive={hiveActive}
      fromKit={sp?.from === "kit" && hiveActive}
    />
  );
}
