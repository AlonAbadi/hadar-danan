/**
 * POST /api/admin/challenge-reset
 *
 * Resets challenge progress for a list of emails and re-simulates purchase.
 * Idempotent — safe to call multiple times: will not resend WhatsApp if already sent.
 *
 * Body: { emails: string[] }
 *
 * Per email:
 *  1. Find public.users row
 *  2. Delete challenge_day_completions (resets progress badges)
 *  3. UPSERT enrollment with enrolled_at = now() (preserves ID → preserves wa log dedup)
 *  4. Ensure a completed challenge_197 purchase exists
 *  5. Send WhatsApp for day 0 only if not already sent (checked via challenge_whatsapp_logs)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  const results: Record<string, string> = {};
  const now = new Date().toISOString();

  for (const email of emails as string[]) {
    try {
      // 1. Find user
      const { data: userData } = await d
        .from("users")
        .select("id, name, phone")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (!userData) { results[email] = "user not found"; continue; }

      const userId: string = userData.id;

      // 2. Get existing enrollment (to clear completions without losing the ID)
      const { data: existing } = await d
        .from("challenge_enrollments")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await d.from("challenge_day_completions").delete().eq("enrollment_id", existing.id);
        // Do NOT delete whatsapp_logs — they protect against double-send
      }

      // 3. UPSERT enrollment with enrolled_at = now() (resets 24h unlock clock)
      const { data: enrollment } = await d
        .from("challenge_enrollments")
        .upsert(
          { user_id: userId, enrolled_at: now, current_day: 0, completed_at: null, last_activity_at: now },
          { onConflict: "user_id", ignoreDuplicates: false }
        )
        .select("id")
        .maybeSingle();

      // Fallback: re-fetch if upsert didn't return row
      const enrollmentId: string =
        enrollment?.id ??
        (await d.from("challenge_enrollments").select("id").eq("user_id", userId).maybeSingle()).data?.id;

      if (!enrollmentId) { results[email] = "enrollment upsert failed"; continue; }

      // 4. Ensure completed purchase
      const { data: existingPurchase } = await db
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("product", "challenge_197")
        .eq("status", "completed")
        .maybeSingle();

      if (!existingPurchase) {
        await d.from("purchases").insert({
          user_id:     userId,
          product:     "challenge_197",
          status:      "completed",
          amount:      0,
          cardcom_ref: `admin_reset_${Date.now()}_${userId.slice(0, 8)}`,
        });
      }

      // 5. Send WhatsApp only if not already sent for day 0
      if (!userData.phone) {
        results[email] = "reset ok — no phone, whatsapp skipped";
        continue;
      }

      const { data: alreadySent } = await d
        .from("challenge_whatsapp_logs")
        .select("id")
        .eq("enrollment_id", enrollmentId)
        .eq("day_number", 0)
        .eq("status", "sent")
        .maybeSingle();

      if (alreadySent) {
        results[email] = "reset ok — whatsapp day0: already sent (skipped)";
        continue;
      }

      const waStatus = await sendChallengeWhatsApp(userData.phone, userData.name ?? "", 0)
        .then(() => "sent" as const)
        .catch(() => "failed" as const);

      await d.from("challenge_whatsapp_logs").upsert(
        { enrollment_id: enrollmentId, day_number: 0, status: waStatus },
        { onConflict: "enrollment_id,day_number", ignoreDuplicates: false }
      );

      results[email] = `reset ok — whatsapp day0: ${waStatus}`;
    } catch (e) {
      results[email] = `error: ${String(e)}`;
    }
  }

  return NextResponse.json({ ok: true, results });
}
