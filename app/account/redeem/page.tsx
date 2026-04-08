import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

const HIVE_PRODUCTS = new Set(["hive_starter_160", "hive_pro_280", "hive_elite_480"]);

const PRODUCT_MAP = [
  { key: "challenge_197",  name: "אתגר 7 ימים",      price: 197,   href: "/challenge" },
  { key: "workshop_1080",  name: "סדנה יום אחד",      price: 1080,  href: "/workshop" },
  { key: "course_1800",    name: "קורס דיגיטלי",      price: 1800,  href: "/course" },
  { key: "strategy_4000",  name: "פגישת אסטרטגיה",   price: 4000,  href: "/strategy" },
  { key: "premium_14000",  name: "פרימיום",            price: 14000, href: "/premium" },
];

export default async function RedeemPage() {
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
  if (!user) redirect("/login?redirect=/account/redeem");

  const db = createServerClient();

  const { data: userData } = await db
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!userData) redirect("/account");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPurchases } = await (db as any)
    .from("purchases")
    .select("id, product, amount, amount_paid, status, created_at")
    .eq("user_id", userData.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchases: any[] = rawPurchases ?? [];

  const mostRecentNonHive = purchases.find(
    (p) => p.status === "completed" && !HIVE_PRODUCTS.has(p.product)
  );
  const credit: number = mostRecentNonHive
    ? (mostRecentNonHive.amount_paid ?? mostRecentNonHive.amount)
    : 0;

  const purchasedKeys = new Set(
    purchases.filter((p) => p.status === "completed").map((p) => p.product as string)
  );

  return (
    <div
      dir="rtl"
      lang="he"
      style={{
        minHeight: "100vh",
        background: "#080C14",
        color: "#EDE9E1",
        fontFamily: "Assistant, sans-serif",
        padding: "32px 16px 64px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Back */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/account" style={{ fontSize: 13, fontWeight: 700, color: "#9E9990", textDecoration: "none" }}>
            חזור לחשבון שלי
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#EDE9E1", margin: "0 0 6px" }}>
            מימוש קרדיט
          </h1>
          <p style={{ fontSize: 14, color: "#9E9990", margin: 0 }}>
            הקרדיט שצברת ניתן לשימוש לרכישת כל מוצר
          </p>
        </div>

        {/* Credit badge */}
        <div style={{
          background: "rgba(232,185,74,0.08)",
          border: "1px solid rgba(232,185,74,0.25)",
          borderRadius: 12,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 13, color: "#9E9990" }}>קרדיט זמין לשימוש</div>
          <div style={{
            fontSize: 26,
            fontWeight: 800,
            background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            direction: "ltr",
          }}>
            {credit > 0 ? `₪${credit.toLocaleString("he-IL")}` : "אין קרדיט"}
          </div>
        </div>

        {/* Product list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PRODUCT_MAP.map((product) => {
            const purchased = purchasedKeys.has(product.key);
            const toPay = Math.max(0, product.price - credit);
            const free = toPay === 0;

            return (
              <div
                key={product.key}
                style={{
                  background: "#141820",
                  border: `1px solid ${purchased ? "#1D2430" : "#2C323E"}`,
                  borderRadius: 12,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: purchased ? 0.5 : 1,
                }}
              >
                {/* Left side: CTA or "נרכש" badge */}
                <div style={{ flexShrink: 0 }}>
                  {purchased ? (
                    <span style={{
                      display: "inline-block",
                      padding: "5px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: "rgba(52,168,83,0.12)",
                      color: "#34A853",
                    }}>
                      נרכש
                    </span>
                  ) : (
                    <Link
                      href={product.href}
                      style={{
                        display: "inline-block",
                        padding: "9px 20px",
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                        color: "#080C14",
                        fontSize: 14,
                        fontWeight: 800,
                        textDecoration: "none",
                        fontFamily: "Assistant, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      רכוש
                    </Link>
                  )}
                </div>

                {/* Right side: name + pricing */}
                <div style={{ textAlign: "right", flex: 1, marginRight: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", marginBottom: 6 }}>
                    {!purchased && free && (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 10,
                        background: "rgba(52,168,83,0.12)", color: "#34A853",
                      }}>
                        ללא תשלום
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1" }}>
                      {product.name}
                    </span>
                  </div>

                  {!purchased && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      {/* Full price strikethrough */}
                      <span style={{ fontSize: 12, color: "#4A5060", textDecoration: "line-through", direction: "ltr" }}>
                        ₪{product.price.toLocaleString("he-IL")}
                      </span>
                      {/* Credit line */}
                      {credit > 0 && (
                        <span style={{ fontSize: 12, color: "#C9964A", direction: "ltr" }}>
                          קרדיט: ₪{Math.min(credit, product.price).toLocaleString("he-IL")}
                        </span>
                      )}
                      {/* To pay */}
                      <span style={{
                        fontSize: 16, fontWeight: 800,
                        color: free ? "#34A853" : "#EDE9E1",
                        direction: "ltr",
                      }}>
                        {free ? "ללא תשלום" : `לתשלום: ₪${toPay.toLocaleString("he-IL")}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
