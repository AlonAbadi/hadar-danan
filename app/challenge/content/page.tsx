import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { dayVideoId, TOTAL_DAYS } from "@/lib/challenge-config";
import ChallengePlayer from "./ChallengePlayer";
import type { Database } from "@/lib/supabase/types";

/** Returns today's date string in Israel timezone (UTC+3), e.g. "2026-04-07" */
function israelToday(): string {
  return new Date(
    new Date().toLocaleString("en-CA", { timeZone: "Asia/Jerusalem" }).split(",")[0]
  )
    .toISOString()
    .slice(0, 10);
}

/** Returns YYYY-MM-DD string offset by `days` calendar days */
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function ChallengeContentPage() {
  const cookieStore = await cookies();

  // 1. Verify session
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
  if (!user) redirect("/login?redirect=/challenge/content");

  const db = createServerClient();

  // 2. Get CRM user row
  const { data: userData } = await db
    .from("users")
    .select("id, email")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!userData) redirect("/challenge?access=denied");

  // 3. Check for completed challenge purchase
  const { data: purchase } = await db
    .from("purchases")
    .select("id, created_at")
    .eq("user_id", userData.id)
    .eq("product", "challenge_197")
    .eq("status", "completed")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!purchase) redirect("/challenge?access=denied");

  // 4. Compute which days are unlocked based on purchase date (Israel timezone)
  const purchaseDateStr = new Date(purchase.created_at)
    .toLocaleString("en-CA", { timeZone: "Asia/Jerusalem" })
    .split(",")[0];
  const today = israelToday();

  // dayX unlocks when purchaseDate + X <= today
  const unlockedDays = Array.from({ length: TOTAL_DAYS }, (_, i) => i).filter(
    (day) => addDays(purchaseDateStr, day) <= today
  );

  // 5. Fetch completed days from video_events
  const allVideoIds = Array.from({ length: TOTAL_DAYS }, (_, i) => dayVideoId(i));

  const { data: videoEvents } = await db
    .from("video_events")
    .select("video_id")
    .eq("user_email", userData.email)
    .eq("event_type", "completed")
    .in("video_id", allVideoIds);

  const completedVideoIds = (videoEvents ?? []).map((e) => e.video_id);

  // 6. Next unlock date (for countdown timer): earliest locked day's unlock date
  const nextUnlockDate = (() => {
    for (let day = 0; day < TOTAL_DAYS; day++) {
      if (!unlockedDays.includes(day)) {
        return addDays(purchaseDateStr, day);
      }
    }
    return null;
  })();

  return (
    <ChallengePlayer
      completedVideoIds={completedVideoIds}
      unlockedDays={unlockedDays}
      nextUnlockDate={nextUnlockDate}
      userEmail={userData.email}
    />
  );
}
