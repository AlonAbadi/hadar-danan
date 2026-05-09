import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const TARGET_EMAILS = ["alonabadi9@gmail.com", "hadard1113@gmail.com"];

export async function GET() {
  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  const log: string[] = [];

  // 1. Find users
  const { data: users } = await d
    .from("users")
    .select("id, email, name, phone")
    .in("email", TARGET_EMAILS);

  log.push(`users: ${JSON.stringify(users?.map((u: {email:string,id:string}) => ({ email: u.email, id: u.id })))}`);
  if (!users?.length) return NextResponse.json({ log, error: "no users found" });

  const userIds = users.map((u: { id: string }) => u.id);

  // 2. Get existing enrollment IDs (to delete completions + wa logs)
  const { data: enrollments } = await d
    .from("challenge_enrollments")
    .select("id, user_id")
    .in("user_id", userIds);

  const enrollmentIds = (enrollments ?? []).map((e: { id: string }) => e.id);

  if (enrollmentIds.length > 0) {
    const { error: e1 } = await d.from("challenge_day_completions").delete().in("enrollment_id", enrollmentIds);
    log.push(`delete completions: ${e1 ? e1.message : "ok"}`);
    const { error: e2 } = await d.from("challenge_whatsapp_logs").delete().in("enrollment_id", enrollmentIds);
    log.push(`delete wa_logs: ${e2 ? e2.message : "ok"}`);
  }

  const now = new Date().toISOString();

  // 3. For each user: ensure completed purchase + upsert enrollment with now()
  for (const user of users as { id: string; email: string }[]) {
    // Ensure completed purchase
    const { data: purchase } = await d
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product", "challenge_197")
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) {
      const { error: ep } = await d.from("purchases").insert({
        user_id:     user.id,
        product:     "challenge_197",
        status:      "completed",
        amount:      0,
        cardcom_ref: `admin_reset_${Date.now()}_${user.id.slice(0, 8)}`,
      });
      log.push(`create purchase for ${user.email}: ${ep ? ep.message : "ok"}`);
    } else {
      log.push(`purchase exists for ${user.email}`);
    }

    // Upsert enrollment with enrolled_at = now()
    const { error: ee } = await d.from("challenge_enrollments").upsert(
      { user_id: user.id, enrolled_at: now, current_day: 0, completed_at: null, last_activity_at: now },
      { onConflict: "user_id", ignoreDuplicates: false }
    );
    log.push(`upsert enrollment for ${user.email}: ${ee ? ee.message : "ok"}`);
  }

  // 4. Verify
  const { data: after } = await d
    .from("challenge_enrollments")
    .select("id, user_id, enrolled_at, current_day")
    .in("user_id", userIds);
  log.push(`enrollments after: ${JSON.stringify(after)}`);

  return NextResponse.json({ ok: true, log });
}
