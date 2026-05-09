import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const TARGET_EMAILS = ["alonabadi9@gmail.com", "hadard1113@gmail.com"];

export async function GET() {
  const db = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  const log: string[] = [];

  // 1. Find user IDs
  const { data: users } = await d
    .from("users")
    .select("id, email, name, phone")
    .in("email", TARGET_EMAILS);

  log.push(`users found: ${JSON.stringify(users?.map((u: {email:string,id:string}) => ({ email: u.email, id: u.id })))}`);

  if (!users?.length) return NextResponse.json({ log, error: "no users found" });

  const userIds = users.map((u: { id: string }) => u.id);

  // 2. Get enrollment IDs
  const { data: enrollments } = await d
    .from("challenge_enrollments")
    .select("id, user_id, enrolled_at")
    .in("user_id", userIds);

  log.push(`enrollments before: ${JSON.stringify(enrollments)}`);

  const enrollmentIds = (enrollments ?? []).map((e: { id: string }) => e.id);

  if (enrollmentIds.length > 0) {
    // 3. Delete day completions
    const { error: e1 } = await d
      .from("challenge_day_completions")
      .delete()
      .in("enrollment_id", enrollmentIds);
    log.push(`delete completions: ${e1 ? e1.message : "ok"}`);

    // 4. Delete whatsapp logs
    const { error: e2 } = await d
      .from("challenge_whatsapp_logs")
      .delete()
      .in("enrollment_id", enrollmentIds);
    log.push(`delete whatsapp_logs: ${e2 ? e2.message : "ok"}`);
  }

  // 5. Update enrollments → reset enrolled_at to now
  const now = new Date().toISOString();
  const { error: e3 } = await d
    .from("challenge_enrollments")
    .update({ enrolled_at: now, current_day: 0, completed_at: null, last_activity_at: now })
    .in("user_id", userIds);
  log.push(`update enrollments enrolled_at=now: ${e3 ? e3.message : "ok"}`);

  // 6. Verify
  const { data: after } = await d
    .from("challenge_enrollments")
    .select("id, user_id, enrolled_at, current_day")
    .in("user_id", userIds);
  log.push(`enrollments after: ${JSON.stringify(after)}`);

  return NextResponse.json({ ok: true, log });
}
