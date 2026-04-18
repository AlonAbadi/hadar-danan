import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { StrategyBookFlow } from "./StrategyBookFlow";
import { getUserCredit } from "@/lib/credit";
import { getTenant } from "@/lib/tenant";

export const metadata = {
  title: "קביעת פגישת אסטרטגיה | הדר דנן",
  description: "בחר/י מועד נוח לפגישת אסטרטגיה אחד-על-אחד - 90 דקות, תוכנית שנה קדימה.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  const credit = email ? await getUserCredit(email) : 0;

  const supabase = createServerClient();
  const { data: bookedSlots } = await supabase
    .from("bookings")
    .select("slot_date, slot_time")
    .eq("status", "confirmed");

  const price       = process.env.NEXT_PUBLIC_PRICE_CALL ?? "4000";
  let whatsappPhone = process.env.WHATSAPP_PHONE ?? "";
  try {
    const tenant = await getTenant();
    const legal  = tenant.legal ?? {};
    whatsappPhone = (legal["whatsapp_phone"] as string) ?? whatsappPhone;
  } catch { /* use fallbacks */ }

  return (
    <div dir="rtl" className="min-h-screen font-assistant" style={{ background: "#0D1018", color: "#EDE9E1" }}>

      {/* Nav */}
      <header
        className="sticky top-0 z-50 border-b px-4"
        style={{ background: "rgba(13,16,24,0.95)", backdropFilter: "blur(12px)", borderColor: "#2C323E" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
          <Link href="/" className="font-black text-xl" style={{ color: "#EDE9E1" }}>
            הדר דנן
          </Link>
          <Link href="/strategy" className="text-sm transition" style={{ color: "#9E9990" }}>
            ← חזור לעמוד הפגישה
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">

          {/* Page header */}
          <div className="flex flex-col gap-4">

            <h1 className="text-3xl md:text-4xl font-black" style={{ color: "#EDE9E1" }}>
              קבע/י פגישת אסטרטגיה
            </h1>
            <p className="text-lg leading-relaxed max-w-lg" style={{ color: "#9E9990" }}>
              שיחה אחד-על-אחד של 90 דקות שבונה את מפת הדרכים השיווקית של העסק שלך.
              מה שבונים ביחד — מוכן ליישום מיד למחרת.
            </p>

            {/* Guarantee */}
            <p className="text-sm font-semibold" style={{ color: "#C9964A" }}>
              ✓ לא פיצחנו בפגישה הראשונה? פגישה נוספת עלינו — ללא עלות
            </p>
          </div>

          {/* Two-step flow: pick slot → pay */}
          <StrategyBookFlow
            bookedSlots={bookedSlots ?? []}
            price={price}
            credit={credit}
            whatsappPhone={whatsappPhone}
          />

        </div>
      </main>

      <footer
        className="border-t px-4 py-6 text-center text-xs"
        style={{ borderColor: "#2C323E", background: "#0D1018", color: "#9E9990" }}
      >
        <p className="mb-1 font-medium" style={{ color: "rgba(158,153,144,0.6)" }}>
          אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. |{" "}
          <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
        </p>
        <p>
          © {new Date().getFullYear()} הדר דנן בע״מ ·{" "}
          <Link href="/privacy" className="transition hover:text-[#EDE9E1]">מדיניות פרטיות</Link>
          {" · "}
          <Link href="/accessibility" className="transition hover:text-[#EDE9E1]">הצהרת נגישות</Link>
          {" · "}
          <Link href="/hive/terms" className="transition hover:text-[#EDE9E1]">תנאי מנוי הכוורת</Link>
        </p>
      </footer>

    </div>
  );
}
