import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";
import { AccountSetupStep } from "@/components/AccountSetupStep";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "גישה לקורס מוכנה! | הדר דנן",
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

export default async function CourseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string }>;
}) {
  const { oid } = await searchParams;
  const { email, hasAuth } = await getEmailFromOid(oid);
  const needsSetup = !!email && !hasAuth;

  return (
    <div dir="rtl" style={{ background: "#080C14", minHeight: "100vh" }}>
      {needsSetup && (
        <div className="font-assistant flex justify-center px-4 pt-16 pb-0">
          <div className="w-full max-w-lg">
            <AccountSetupStep email={email} redirectTo="/course/content" />
          </div>
        </div>
      )}
      <Suspense>
        <SuccessPage
          productName="קורס דיגיטלי"
          emoji="🎓"
          confirmationTitle="גישה לקורס מוכנה!"
          confirmationDesc="16 שיעורים מחכים לך. התחל מתי שנוח לך."
          nextStepLabel="התחל את הקורס"
          nextStepHref="/course/content"
          nextStepDesc="כל השיעורים פתוחים - לך בקצב שלך"
          trackingProduct="course_1800"
          trackingValue={1800}
        />
      </Suspense>
    </div>
  );
}
