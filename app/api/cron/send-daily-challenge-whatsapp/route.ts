/**
 * GET /api/cron/send-daily-challenge-whatsapp
 *
 * Runs daily at 09:00 Israel time (06:00 UTC summer / 07:00 UTC winter).
 * Sends a WhatsApp reminder to every active challenge enrollment.
 *
 * Template: hadar_challenge_daily (4 params)
 *   {{1}} = first name
 *   {{2}} = "פתיחה" for day 0, or "1"–"7" for days 1-7
 *   {{3}} = day title
 *   {{4}} = link to challenge content
 *
 * Day 0 (opening session) is sent on the first morning after enrollment.
 * Days 1-7 are sent each subsequent morning.
 * Saturday: skipped entirely.
 * Dedup: challenge_whatsapp_logs UNIQUE (enrollment_id, day_number)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { computeMaxUnlockedDay } from "@/lib/challenge-config";
import { sendChallengeWhatsApp, normalizePhone } from "@/lib/challenge-whatsapp";

const BATCH_SIZE = 20;

interface Enrollment {
  id:          string;
  enrolled_at: string;
  user_id:     string;
  name:        string | null;
  phone:       string | null;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.UCHAT_API_KEY) {
    return NextResponse.json({ error: "UCHAT_API_KEY not configured" }, { status: 503 });
  }

  // Skip Saturday — no challenge messages on Shabbat
  if (new Date().getDay() === 6) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, total: 0, note: "Saturday" });
  }

  const db = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollments, error } = await (db as any)
    .from("challenge_enrollments")
    .select(`
      id,
      enrolled_at,
      user_id,
      users!inner ( name, phone )
    `)
    .is("completed_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const flat: Enrollment[] = (enrollments ?? []).map((e: Record<string, unknown>) => {
    const u = e.users as { name: string | null; phone: string | null };
    return {
      id:          e.id as string,
      enrolled_at: e.enrolled_at as string,
      user_id:     e.user_id as string,
      name:        u?.name ?? null,
      phone:       u?.phone ?? null,
    };
  });

  // Compute today's unlocked day for each enrollment (0–7, time-based)
  const withDay = flat
    .map((e) => ({ ...e, todayDay: computeMaxUnlockedDay(e.enrolled_at) }))
    .filter((e) => e.todayDay >= 0 && e.todayDay <= 7 && e.phone && normalizePhone(e.phone!));

  if (withDay.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, skipped: 0, total: 0 });
  }

  // Filter: skip already-sent for this (enrollment, day) pair
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: alreadySent } = await (db as any)
    .from("challenge_whatsapp_logs")
    .select("enrollment_id, day_number")
    .in("enrollment_id", withDay.map((e) => e.id))
    .eq("status", "sent");

  const sentSet = new Set(
    (alreadySent ?? []).map(
      (r: { enrollment_id: string; day_number: number }) => `${r.enrollment_id}:${r.day_number}`
    )
  );

  const toSend = withDay.filter((e) => !sentSet.has(`${e.id}:${e.todayDay}`));

  let sent = 0, failed = 0, skipped = 0;

  for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
    const batch = toSend.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (enrollment) => {
      let status: "sent" | "failed" = "sent";
      try {
        await sendChallengeWhatsApp(enrollment.phone!, enrollment.name ?? "", enrollment.todayDay);
        sent++;
      } catch {
        status = "failed";
        failed++;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("challenge_whatsapp_logs")
        .upsert(
          { enrollment_id: enrollment.id, day_number: enrollment.todayDay, status },
          { onConflict: "enrollment_id,day_number", ignoreDuplicates: false }
        );

      skipped; // suppress unused warning
    }));
  }

  return NextResponse.json({ ok: true, sent, failed, skipped, total: toSend.length });
}
