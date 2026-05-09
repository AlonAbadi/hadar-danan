import { createServerClient } from "@/lib/supabase/server";
import ChallengeAdminClient from "./client";

export const dynamic = "force-dynamic";

export default async function ChallengeAdminPage() {
  const db = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settingsRes, enrollmentsRes, logsRes] = await Promise.all([
    (db as any).from("challenge_settings").select("*").limit(1).maybeSingle(),

    (db as any).from("challenge_enrollments").select(`
      id,
      enrolled_at,
      current_day,
      completed_at,
      last_activity_at,
      users!inner ( name, email, phone ),
      challenge_day_completions ( day_number )
    `).order("enrolled_at", { ascending: false }),

    (db as any).from("challenge_whatsapp_logs").select(`
      enrollment_id,
      day_number,
      sent_at,
      status,
      challenge_enrollments!inner (
        users!inner ( name, phone )
      )
    `).order("sent_at", { ascending: false }).limit(50),
  ]);

  return (
    <ChallengeAdminClient
      settings={settingsRes.data}
      enrollments={enrollmentsRes.data ?? []}
      logs={logsRes.data ?? []}
    />
  );
}
