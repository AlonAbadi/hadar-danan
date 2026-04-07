"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { runPendingJobs } from "@/lib/jobs/runner";

export async function triggerCron(): Promise<string> {
  try {
    const result = await runPendingJobs();
    return `✓ ${result.processed} jobs - ${result.succeeded} הצליחו, ${result.failed} נכשלו`;
  } catch (err) {
    return `שגיאה: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function clearOldErrors(): Promise<string> {
  const supabase  = createServerClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // 1. Mark stuck failed jobs as permanently failed so they stop retrying
  const { count: jobsCleared } = await supabase
    .from("jobs")
    .update({ failed_permanently: true, status: "failed" }, { count: "exact" })
    .eq("failed_permanently", false)
    .neq("status", "done")
    .lt("created_at", oneHourAgo);

  // 2. Delete old error_log entries so the dashboard clears
  const { count: logsDeleted } = await supabase
    .from("error_logs")
    .delete({ count: "exact" })
    .lt("created_at", oneHourAgo);

  revalidatePath("/admin");

  const j = jobsCleared ?? 0;
  const l = logsDeleted ?? 0;
  return `✓ נוקו ${j} jobs ו-${l} שגיאות`;
}
