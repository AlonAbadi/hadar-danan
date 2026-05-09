/**
 * Temp one-shot: reset + send opening WhatsApp for the 3 test users.
 * Deletes after use.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendChallengeWhatsApp } from "@/lib/challenge-whatsapp";

const USERS = [
  { email: "alonabadi9@gmail.com",  phone: null },
  { email: "hadard1113@gmail.com",  phone: null },
  { email: "meitaladi90@gmail.com", phone: "0542268860" },
];

export async function GET() {
  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d  = db as any;
  const log: string[] = [];
  const now = new Date().toISOString();

  for (const u of USERS) {
    // 1. Find user
    const { data: userData } = await d
      .from("users")
      .select("id, name, phone")
      .eq("email", u.email)
      .maybeSingle();

    if (!userData) { log.push(`${u.email}: NOT FOUND`); continue; }

    // 2. Update phone if provided
    if (u.phone) {
      await d.from("users").update({ phone: u.phone }).eq("id", userData.id);
      userData.phone = u.phone;
      log.push(`${u.email}: phone updated → ${u.phone}`);
    }

    // 3. Find existing enrollment IDs (for cascade-delete of logs)
    const { data: enrollment } = await d
      .from("challenge_enrollments")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (enrollment) {
      await d.from("challenge_day_completions").delete().eq("enrollment_id", enrollment.id);
      await d.from("challenge_whatsapp_logs").delete().eq("enrollment_id", enrollment.id);
      log.push(`${u.email}: completions + wa_logs cleared`);
    }

    // 4. Ensure completed purchase
    const { data: purchase } = await d
      .from("purchases")
      .select("id")
      .eq("user_id", userData.id)
      .eq("product", "challenge_197")
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) {
      await d.from("purchases").insert({
        user_id:     userData.id,
        product:     "challenge_197",
        status:      "completed",
        amount:      0,
        cardcom_ref: `test_${Date.now()}_${userData.id.slice(0, 8)}`,
      });
      log.push(`${u.email}: purchase created`);
    } else {
      log.push(`${u.email}: purchase exists`);
    }

    // 5. Upsert enrollment — enrolled_at = now() resets the 24h clock
    const { data: newEnrollment, error: ee } = await d
      .from("challenge_enrollments")
      .upsert(
        { user_id: userData.id, enrolled_at: now, current_day: 0, completed_at: null, last_activity_at: now },
        { onConflict: "user_id", ignoreDuplicates: false }
      )
      .select("id")
      .maybeSingle();

    if (ee) { log.push(`${u.email}: enrollment error — ${ee.message}`); continue; }
    const enrollmentId = newEnrollment?.id ?? enrollment?.id;
    log.push(`${u.email}: enrollment reset (enrolled_at=${now})`);

    // 6. Send WhatsApp for day 0 (opening session)
    const phone = userData.phone;
    if (!phone || !enrollmentId) {
      log.push(`${u.email}: no phone — WhatsApp skipped`);
      continue;
    }

    const waStatus = await sendChallengeWhatsApp(phone, userData.name ?? "", 0)
      .then(() => "sent" as const)
      .catch((err: unknown) => { log.push(`${u.email}: WA error — ${String(err)}`); return "failed" as const; });

    await d.from("challenge_whatsapp_logs").upsert(
      { enrollment_id: enrollmentId, day_number: 0, status: waStatus },
      { onConflict: "enrollment_id,day_number", ignoreDuplicates: false }
    );

    log.push(`${u.email}: WhatsApp day0 → ${waStatus}`);
  }

  return NextResponse.json({ ok: true, log });
}
