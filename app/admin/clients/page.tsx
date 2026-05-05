import { createServerClient } from "@/lib/supabase/server";
import ClientsListClient from "./ClientsListClient";

export const dynamic = "force-dynamic";

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197: "אתגר", workshop_1080: "סדנה", course_1800: "קורס",
  strategy_4000: "אסטרטגיה", premium_14000: "פרמיום", test_1: "בדיקה",
};

export default async function ClientsPage() {
  const supabase = createServerClient();

  // Get all completed purchases
  const { data: purchases } = await supabase
    .from("purchases")
    .select("user_id, amount_paid, product, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (!purchases?.length) {
    return (
      <div dir="rtl" style={{ fontFamily: "Assistant, sans-serif", padding: "40px 48px", background: "#080C14", minHeight: "100vh", color: "#9E9990" }}>
        אין לקוחות עדיין
      </div>
    );
  }

  // Group by user_id
  const userMap: Record<string, { total: number; products: string[]; lastPurchase: string; count: number }> = {};
  for (const p of purchases) {
    if (!p.user_id) continue;
    if (!userMap[p.user_id]) userMap[p.user_id] = { total: 0, products: [], lastPurchase: p.created_at, count: 0 };
    userMap[p.user_id].total += p.amount_paid ?? 0;
    userMap[p.user_id].count += 1;
    const label = PRODUCT_LABELS[p.product as string] ?? p.product;
    if (!userMap[p.user_id].products.includes(label)) userMap[p.user_id].products.push(label);
    if (p.created_at > userMap[p.user_id].lastPurchase) userMap[p.user_id].lastPurchase = p.created_at;
  }

  const userIds = Object.keys(userMap);
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, phone, status, created_at")
    .in("id", userIds);

  const clients = (users ?? [])
    .map((u) => ({ ...u, ...userMap[u.id] }))
    .sort((a, b) => (b.lastPurchase ?? "").localeCompare(a.lastPurchase ?? ""));

  return <ClientsListClient clients={clients} />;
}
