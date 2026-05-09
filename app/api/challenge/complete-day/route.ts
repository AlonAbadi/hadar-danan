/**
 * POST /api/challenge/complete-day
 *
 * Marks a challenge day as complete for the authenticated user.
 * Inserts into challenge_day_completions and advances enrollment.current_day.
 * If day 7 is completed, sets enrollment.completed_at.
 *
 * Returns: { ok: true, maxUnlockedDay: number }
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();

  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const dayNumber = Number(body.day_number);

  if (!Number.isInteger(dayNumber) || dayNumber < 0 || dayNumber > 8) {
    return NextResponse.json({ error: "Invalid day_number" }, { status: 400 });
  }

  const db = createServerClient();

  // Get CRM user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (db as any)
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get enrollment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollment } = await (db as any)
    .from("challenge_enrollments")
    .select("id, current_day")
    .eq("user_id", userData.id)
    .maybeSingle();

  if (!enrollment) return NextResponse.json({ error: "No enrollment found" }, { status: 404 });

  // Validate: only allow completing days up to current_day
  if (dayNumber > enrollment.current_day) {
    return NextResponse.json({ error: "Day not yet unlocked" }, { status: 403 });
  }

  // Insert completion (ignore conflict — already completed is fine)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from("challenge_day_completions")
    .upsert(
      { enrollment_id: enrollment.id, day_number: dayNumber },
      { onConflict: "enrollment_id,day_number", ignoreDuplicates: true }
    );

  // Advance current_day to dayNumber + 1 (only if it would be an increase)
  const nextDay = dayNumber + 1;
  const newCurrentDay = Math.max(enrollment.current_day, nextDay);

  const updatePayload: Record<string, unknown> = {
    current_day:      newCurrentDay,
    last_activity_at: new Date().toISOString(),
  };

  if (dayNumber === 7 && !enrollment.completed_at) {
    updatePayload.completed_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from("challenge_enrollments")
    .update(updatePayload)
    .eq("id", enrollment.id);

  return NextResponse.json({ ok: true, maxUnlockedDay: newCurrentDay });
}
