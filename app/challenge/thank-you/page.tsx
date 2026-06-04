import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { AccountSetupStep } from "@/components/AccountSetupStep";
import { createServerClient } from "@/lib/supabase/server";


export const metadata: Metadata = {
  title: "תודה על ההצטרפות לאתגר | הדר דנן",
  description: "ההרשמה לאתגר 7 הימים הושלמה בהצלחה.",
  robots: { index: false, follow: false },
};

async function getEmailFromOid(oid: string | undefined): Promise<{ email: string | null; hasAuth: boolean }> {
  if (!oid) return { email: null, hasAuth: false };
  try {
    const supabase = createServerClient();
    const { data: purchase } = await supabase
      .from("purchases")
      .select("user_id")
      .eq("id", oid)
      .maybeSingle();
    if (!purchase) return { email: null, hasAuth: false };

    const { data: user } = await supabase
      .from("users")
      .select("email, auth_id")
      .eq("id", purchase.user_id)
      .maybeSingle();

    return {
      email: user?.email ?? null,
      hasAuth: !!user?.auth_id,
    };
  } catch {
    return { email: null, hasAuth: false };
  }
}

export default async function ChallengeThankyouPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string }>;
}) {
  const { oid } = await searchParams;
  const { email, hasAuth } = await getEmailFromOid(oid);
  const needsSetup = !!email && !hasAuth;

  return (
    <>
      <Suspense><PurchaseTracker product="challenge_197" value={197} /></Suspense>
      <main
        dir="rtl"
        className="font-assistant min-h-screen flex items-center justify-center px-6 py-20"
        style={{ background: "#080C14" }}
      >
        <div className="w-full max-w-lg flex flex-col items-center gap-8 text-center">

          {/* Checkmark */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #E8B94A, #9E7C3A)" }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="#0D1018" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl md:text-4xl font-black" style={{ color: "#EDE9E1" }}>
              ברוכים הבאים לאתגר
            </h1>
            <p className="text-lg font-medium" style={{ color: "#EDE9E1" }}>
              ההרשמה הושלמה בהצלחה.
            </p>
          </div>

          {/* Account setup — shown only if user doesn't have auth yet */}
          {needsSetup && (
            <div className="w-full text-right">
              <AccountSetupStep email={email} redirectTo="/challenge/content" />
            </div>
          )}

          <div className="w-full h-px" style={{
            background: "linear-gradient(to left, transparent, rgba(201,150,74,0.3), transparent)"
          }} />

          {/* Start watching section */}
          <div className="flex flex-col items-center gap-4 w-full">
            <h2 className="text-xl font-bold" style={{ color: "#EDE9E1" }}>
              {needsSetup ? "ואחרי זה —" : "השלב הבא —"} התחילו לצפות בשיעור הפתיחה
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#9E9990" }}>
              האתגר זמין לצפייה עכשיו. התחילו עם שיעור הפתיחה והתקדמו בקצב שלכם.
            </p>

            <Link
              href="/challenge/content"
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-full font-black text-base transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                color: "#0D1018",
                textDecoration: "none",
              }}
            >
              התחילו לצפות ←
            </Link>
          </div>

          <Link href="/" className="text-sm transition-colors hover:underline" style={{ color: "#9E9990" }}>
            חזרה לעמוד הבית
          </Link>

        </div>
      </main>
    </>
  );
}
