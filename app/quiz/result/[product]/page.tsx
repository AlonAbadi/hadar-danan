import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import { QuizClient } from "../../QuizClient";
import type { Database } from "@/lib/supabase/types";

const VALID_PRODUCTS = [
  "free_training",
  "challenge",
  "workshop",
  "course",
  "strategy",
  "premium",
  "partnership",
];

export const metadata: Metadata = {
  title: "התוצאה שלך | הדר דנן",
  description: "התוצאה שלך מהקוויז.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/quiz" },
};

export default async function QuizResultPage({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  if (!VALID_PRODUCTS.includes(product)) {
    redirect("/quiz");
  }

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
  let initialQuizResult: { answers: Record<string, string>; recommendedProduct: string; matchPercent: number } | null = null;

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

      const { data: quizData } = await db
        .from("quiz_results")
        .select("answers, recommended_product, match_percent")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (quizData?.answers && quizData.recommended_product) {
        initialQuizResult = {
          answers:            quizData.answers as Record<string, string>,
          recommendedProduct: quizData.recommended_product,
          matchPercent:       quizData.match_percent ?? 86,
        };
      }
    }
  }

  return (
    <QuizClient
      initialUser={initialUser}
      initialQuizResult={initialQuizResult}
      initialProductFromUrl={product}
    />
  );
}
