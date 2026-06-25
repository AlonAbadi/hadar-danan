import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import WorkshopClient from "./client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "סדנה — 30.7 | אדמין",
};

export default async function UpcomingWorkshopPage() {
  const db = createServerClient();

  // Workshop buyers from the past 90 days — they're booked for whatever the next
  // scheduled date is. Past attendees fall outside this window.
  const since = new Date(Date.now() - 90 * 86400_000).toISOString();

  const { data: purchasesRaw } = await db
    .from("purchases")
    .select("user_id, amount, status, created_at, amount_paid")
    .eq("product", "workshop_1080")
    .eq("status", "completed")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const purchases = purchasesRaw ?? [];
  const userIds = [...new Set(purchases.map((p) => p.user_id).filter(Boolean))];

  const { data: users } = userIds.length
    ? await db.from("users").select("id, name, email, phone").in("id", userIds)
    : { data: [] };

  const userMap: Record<string, { name: string | null; email: string | null; phone: string | null }> = {};
  for (const u of users ?? []) {
    userMap[u.id] = {
      name:  u.name as string | null,
      email: u.email as string | null,
      phone: u.phone as string | null,
    };
  }

  // Keep only the most-recent purchase per user (in case of edge-case duplicates).
  const seenUsers = new Set<string>();
  const rows: Array<{
    id:           string;
    name:         string | null;
    email:        string | null;
    phone:        string | null;
    purchased_at: string;
    amount_paid:  number | null;
  }> = [];

  for (const p of purchases) {
    if (!p.user_id || seenUsers.has(p.user_id)) continue;
    seenUsers.add(p.user_id);
    const u = userMap[p.user_id] ?? { name: null, email: null, phone: null };
    rows.push({
      id:           p.user_id,
      name:         u.name,
      email:        u.email,
      phone:        u.phone,
      purchased_at: p.created_at,
      amount_paid:  (p.amount_paid ?? p.amount) as number | null,
    });
  }

  return <WorkshopClient rows={rows} />;
}
