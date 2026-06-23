import Link from "next/link";
import { StrategyBookFlow } from "./StrategyBookFlow";
import { PRODUCT_MAP } from "@/lib/products";
import { validateCoupon } from "@/lib/coupons";

export const metadata = {
  title: "פגישת אסטרטגיה | הדר דנן",
  description: "פגישת אסטרטגיה אחד-על-אחד של 90 דקות. לאחר התשלום ניצור קשר לתיאום המועד.",
};

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = "" } = await searchParams;
  const listPrice     = PRODUCT_MAP.strategy_4000.price;
  const coupon        = await validateCoupon(code, "strategy_4000");
  const effectivePrice = coupon?.finalPrice ?? listPrice;
  const price         = String(effectivePrice);
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "";

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
          <Link href="/strategy" className="text-sm transition" style={{ color: "#AAB0BD" }}>
            ← חזור לעמוד הפגישה
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">

          {/* Page header */}
          <div className="flex flex-col gap-4">

            <h1 className="text-3xl md:text-4xl font-black" style={{ color: "#EDE9E1" }}>
              פגישת אסטרטגיה
            </h1>
            <p className="text-lg leading-relaxed max-w-lg" style={{ color: "#AAB0BD" }}>
              שיחה אחד-על-אחד של 90 דקות שבונה את מפת הדרכים השיווקית של העסק שלך.
              לאחר התשלום ניצור איתך קשר לתיאום המועד.
            </p>

            {/* Guarantee */}
            <p className="text-sm font-semibold" style={{ color: "#E8B94A" }}>
              ✓ לא פיצחנו בפגישה הראשונה? פגישה נוספת עלינו — ללא עלות
            </p>
          </div>

          {coupon && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(232,185,74,0.10), rgba(232,185,74,0.04))",
                border:     "1px solid rgba(232,185,74,0.32)",
                borderRadius: 12,
                padding:    "14px 18px",
                color:      "#E8B94A",
                fontSize:   15,
                fontWeight: 600,
                textAlign:  "right",
              }}
            >
              ✓ הנחה אישית של {coupon.discountAmount} ₪ מופעלת. מחיר סופי: {effectivePrice.toLocaleString("he-IL")} ₪ במקום {listPrice.toLocaleString("he-IL")} ₪
            </div>
          )}

          <StrategyBookFlow
            price={price}
            whatsappPhone={whatsappPhone}
            couponCode={coupon?.code}
          />

        </div>
      </main>

      <footer
        className="border-t px-4 py-6 text-center text-xs"
        style={{ borderColor: "#2C323E", background: "#0D1018", color: "#AAB0BD" }}
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
