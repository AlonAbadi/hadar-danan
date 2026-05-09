/**
 * POST /api/admin/challenge-reset
 *
 * Resets challenge progress for a list of emails and re-simulates purchase.
 * Sends the opening-session WhatsApp immediately.
 *
 * Body: { emails: string[] }
 *
 * Per email:
 *  1. Find public.users row
 *  2. Delete challenge_enrollments (CASCADE → completions + whatsapp_logs)
 *  3. Ensure a completed challenge_197 purchase exists (creates one if needed)
 *  4. Create fresh enrollment (enrolled_at = now)
 *  5. Send WhatsApp for day 0 + log result
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendChallengeWhatsApp } from "@/lib/challenge-whatsapp";

export async function POST(req: NextRequest) {
  const { emails } = await req.json().catch(() => ({ emails: [] }));
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails[] required" }, { status: 400 });
  }

  const db = createServerClient();
  const results: Record<string, string> = {};

  for (const email of emails as string[]) {
    try {
      // 1. Find user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userData } = await (db as any)
        .from("users")
        .select("id, name, phone")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (!userData) { results[email] = "user not found"; continue; }

      const userId: string = userData.id;

      // 2. Delete existing enrollment (CASCADE removes completions + whatsapp_logs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("challenge_enrollments")
        .delete()
        .eq("user_id", userId);

      // 3. Ensure completed challenge_197 purchase exists
      const { data: existingPurchase } = await db
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("product", "challenge_197")
        .eq("status", "completed")
        .maybeSingle();

      if (!existingPurchase) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any)
          .from("purchases")
          .insert({
            user_id:     userId,
            product:     "challenge_197",
            status:      "completed",
            amount:      0,
            cardcom_ref: `admin_reset_${Date.now()}_${userId.slice(0, 8)}`,
          });
      }

      // 4. Create fresh enrollment
      const enrolledAt = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newEnrollment } = await (db as any)
        .from("challenge_enrollments")
        .insert({ user_id: userId, enrolled_at: enrolledAt, current_day: 0 })
        .select("id")
        .single();

      if (!newEnrollment) { results[email] = "enrollment create failed"; continue; }

      // 5. Send WhatsApp for opening session
      if (userData.phone) {
        const waStatus = await sendChallengeWhatsApp(userData.phone, userData.name ?? "", 0)
          .then(() => "sent" as const)
          .catch(() => "failed" as const);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any)
          .from("challenge_whatsapp_logs")
          .insert({ enrollment_id: newEnrollment.id, day_number: 0, status: waStatus });

        results[email] = `reset ok — whatsapp day0: ${waStatus}`;
      } else {
        results[email] = "reset ok — no phone, whatsapp skipped";
      }
    } catch (e) {
      results[email] = `error: ${String(e)}`;
    }
  }

  return NextResponse.json({ ok: true, results });
}
