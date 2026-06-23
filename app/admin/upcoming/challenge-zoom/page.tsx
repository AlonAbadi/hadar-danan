import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { computeNextLiveMeetingDate } from "@/lib/challenge-config";
import ChallengeZoomClient from "./client";

export const dynamic = "force-dynamic";

function nextMeetingShortLabel(): string {
  const d = computeNextLiveMeetingDate();
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day:      "numeric",
    month:    "numeric",
  }).format(d);
}

export const metadata: Metadata = {
  title: `זום אתגר — ${nextMeetingShortLabel()} | אדמין`,
};

export default async function UpcomingChallengeZoomPage() {
  const db = createServerClient();

  // All paid challenge buyers — they are all entitled to attend the upcoming Zoom session.
  const { data: purchasesRaw } = await db
    .from("purchases")
    .select("user_id, amount, status, created_at")
    .eq("product", "challenge_197")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const purchases = purchasesRaw ?? [];

  // Earliest completed purchase per user — that's their first entry into the challenge cohort.
  const firstPurchaseByUser: Record<string, { created_at: string; amount: number | null }> = {};
  for (const p of purchases) {
    if (!p.user_id) continue;
    const existing = firstPurchaseByUser[p.user_id];
    if (!existing || new Date(p.created_at) < new Date(existing.created_at)) {
      firstPurchaseByUser[p.user_id] = { created_at: p.created_at, amount: p.amount };
    }
  }

  const userIds = Object.keys(firstPurchaseByUser);

  const { data: users } = userIds.length
    ? await db.from("users").select("id, name, email, phone").in("id", userIds)
    : { data: [] };

  const { data: enrollments } = userIds.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (db as any)
        .from("challenge_enrollments")
        .select("user_id, current_day, completed_at, last_activity_at")
        .in("user_id", userIds)
    : { data: [] };

  const enrollmentByUser: Record<
    string,
    { current_day: number; completed_at: string | null; last_activity_at: string | null }
  > = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of (enrollments ?? []) as any[]) {
    enrollmentByUser[e.user_id] = {
      current_day: e.current_day,
      completed_at: e.completed_at,
      last_activity_at: e.last_activity_at,
    };
  }

  const rows = (users ?? []).map((u) => {
    const purchase = firstPurchaseByUser[u.id];
    const enrollment = enrollmentByUser[u.id];
    return {
      id: u.id,
      name:           u.name as string | null,
      email:          u.email as string | null,
      phone:          u.phone as string | null,
      purchased_at:   purchase?.created_at ?? null,
      amount:         purchase?.amount ?? null,
      current_day:    enrollment?.current_day ?? 0,
      completed:      !!enrollment?.completed_at,
      last_activity:  enrollment?.last_activity_at ?? null,
    };
  });

  // Newest enrollee first.
  rows.sort((a, b) => {
    const ta = a.purchased_at ? new Date(a.purchased_at).getTime() : 0;
    const tb = b.purchased_at ? new Date(b.purchased_at).getTime() : 0;
    return tb - ta;
  });

  const meetingDateIso = computeNextLiveMeetingDate().toISOString();
  return <ChallengeZoomClient rows={rows} meetingDateIso={meetingDateIso} />;
}
