import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { dayVideoId, TOTAL_DAYS, computeMaxUnlockedDay, computeNextLiveMeetingDate } from "@/lib/challenge-config";
import ChallengePlayer from "./ChallengePlayer";
import type { Database } from "@/lib/supabase/types";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (db as any)
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

  // 4. Find or create enrollment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: enrollment } = await (db as any)
    .from("challenge_enrollments")
    .select("id, current_day, enrolled_at")
    .eq("user_id", userData.id)
    .maybeSingle();

  if (!enrollment) {
    // Auto-create enrollment for existing buyers (backward compat).
    // Seed completions from video_events so returning users don't lose progress.
    const allVideoIds = Array.from({ length: TOTAL_DAYS }, (_, i) => dayVideoId(i));
    const { data: videoEvents } = await db
      .from("video_events")
      .select("video_id")
      .eq("user_email", userData.email)
      .eq("event_type", "completed")
      .in("video_id", allVideoIds);

    const completedDays = (videoEvents ?? [])
      .map((e) => allVideoIds.indexOf(e.video_id))
      .filter((i) => i >= 0);

    const maxCompletedDay = completedDays.length > 0 ? Math.max(...completedDays) : -1;
    const currentDay = maxCompletedDay + 1; // next day to unlock

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newEnrollment } = await (db as any)
      .from("challenge_enrollments")
      .insert({
        user_id:     userData.id,
        current_day: currentDay,
        enrolled_at: purchase.created_at,
      })
      .select("id, current_day, enrolled_at")
      .single();

    // Seed completed days
    if (newEnrollment && completedDays.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("challenge_day_completions")
        .insert(
          completedDays.map((d) => ({
            enrollment_id: newEnrollment.id,
            day_number:    d,
          }))
        );
    }

    enrollment = newEnrollment;
  }

  if (!enrollment) redirect("/challenge?access=denied");

  // 5. Fetch completed days from challenge_day_completions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: completions } = await (db as any)
    .from("challenge_day_completions")
    .select("day_number")
    .eq("enrollment_id", enrollment.id);

  const completedDayNumbers: number[] = (completions ?? []).map(
    (c: { day_number: number }) => c.day_number
  );

  // maxUnlockedDay is time-based: one new day every 24h from enrollment (skipping Saturday).
  // Day 0 is always accessible; day 8 becomes visible once day 7 is unlocked.
  const maxUnlockedDay: number = computeMaxUnlockedDay(enrollment.enrolled_at);

  // Next live closing meeting date (15th of month, Fri/Sat → Sun)
  const liveMeetingDate: string = computeNextLiveMeetingDate().toISOString();

  return (
    <ChallengePlayer
      enrollmentId={enrollment.id}
      maxUnlockedDay={maxUnlockedDay}
      completedDayNumbers={completedDayNumbers}
      liveMeetingDate={liveMeetingDate}
    />
  );
}
