/**
 * GET /api/cron/send-daily-challenge-whatsapp
 *
 * Runs daily at 09:00 Israel time (06:00 UTC summer / 07:00 UTC winter).
 * Sends a WhatsApp reminder to every active challenge enrollment.
 *
 * Template: hadar_challenge_daily (4 params)
 *   {{1}} = first name
 *   {{2}} = day number (1-7)
 *   {{3}} = day title
 *   {{4}} = link to challenge content
 *
 * Dedup: challenge_whatsapp_logs UNIQUE (enrollment_id, day_number)
 * Skip: enrollments completed, no phone, already sent today, current_day = 0.
 * Batch: 20 concurrent sends to stay under Vercel Hobby 10s limit.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { CHALLENGE_DAYS } from "@/lib/challenge-config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";
const CHALLENGE_URL = `${APP_URL}/challenge/content`;
const TEMPLATE_NAME = "hadar_challenge_daily";
const NAMESPACE = "a01b08e8_1852_422e_bba2_25f0d05dcafa";
const BATCH_SIZE = 20;

interface Enrollment {
  id:          string;
  current_day: number;
  user_id:     string;
  name:        string | null;
  phone:       string | null;
}

function normalizePhone(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("972") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 10) return "972" + d.slice(1);
  return null;
}

async function sendWhatsapp(phone: string, params: string[]): Promise<void> {
  const apiKey = process.env.UCHAT_API_KEY;
  if (!apiKey) throw new Error("UCHAT_API_KEY not set");

  const paramMap: Record<string, string> = {};
  params.forEach((text, i) => { paramMap[`BODY_{{${i + 1}}}`] = text; });

  const res = await fetch(
    "https://www.uchat.com.au/api/subscriber/send-whatsapp-template-by-user-id",
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:             `+${phone}`,
        create_if_not_found: "yes",
        content: { namespace: NAMESPACE, name: TEMPLATE_NAME, lang: "he", params: paramMap },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`UChat ${res.status}: ${body}`);
  }
}

export async function GET(req: NextRequest) {
  // Auth: Vercel cron sends this header automatically; external cron must pass it too
  const auth = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.UCHAT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "UCHAT_API_KEY not configured" }, { status: 503 });
  }

  const db = createServerClient();

  // Fetch active enrollments (not completed, current_day 1-7)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollments, error } = await (db as any)
    .from("challenge_enrollments")
    .select(`
      id,
      current_day,
      user_id,
      users!inner ( name, phone )
    `)
    .is("completed_at", null)
    .gte("current_day", 1)
    .lte("current_day", 7);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const flat: Enrollment[] = (enrollments ?? []).map((e: Record<string, unknown>) => {
    const u = e.users as { name: string | null; phone: string | null };
    return { id: e.id as string, current_day: e.current_day as number, user_id: e.user_id as string, name: u?.name ?? null, phone: u?.phone ?? null };
  });

  // Filter: skip already-sent today
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: alreadySent } = await (db as any)
    .from("challenge_whatsapp_logs")
    .select("enrollment_id")
    .in("enrollment_id", flat.map((e) => e.id))
    .eq("status", "sent")
    .in("day_number", flat.map((e) => e.current_day));

  const sentIds = new Set((alreadySent ?? []).map((r: { enrollment_id: string }) => r.enrollment_id));
  const toSend = flat.filter((e) => !sentIds.has(e.id) && e.phone);

  let sent = 0, failed = 0, skipped = 0;

  // Process in batches
  for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
    const batch = toSend.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (enrollment) => {
      const phone = normalizePhone(enrollment.phone!);
      if (!phone) { skipped++; return; }

      const dayInfo = CHALLENGE_DAYS.find((d) => d.day === enrollment.current_day);
      if (!dayInfo) { skipped++; return; }

      const firstName = (enrollment.name ?? "").split(" ")[0] || "שלום";
      const params = [
        firstName,
        String(enrollment.current_day),
        dayInfo.title,
        CHALLENGE_URL,
      ];

      let status: "sent" | "failed" = "sent";
      try {
        await sendWhatsapp(phone, params);
        sent++;
      } catch {
        status = "failed";
        failed++;
      }

      // Log the attempt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("challenge_whatsapp_logs")
        .upsert(
          { enrollment_id: enrollment.id, day_number: enrollment.current_day, status },
          { onConflict: "enrollment_id,day_number", ignoreDuplicates: false }
        );
    }));
  }

  return NextResponse.json({
    ok:      true,
    sent,
    failed,
    skipped,
    total:   toSend.length,
  });
}
