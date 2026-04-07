/**
 * Job runner - called by GET /api/cron/jobs every 5 minutes.
 *
 * Design:
 * - Atomically claims each job with an optimistic lock (UPDATE WHERE status='pending')
 *   so parallel invocations can't double-process the same job.
 * - Processes each job independently - one failure never blocks others.
 * - After MAX_ATTEMPTS failures → failed_permanently=true + admin alert.
 * - All times are UTC; Asia/Jerusalem offset is encoded in run_at by callers.
 */

import { createServerClient } from "@/lib/supabase/server";
import {
  handleSendEmail,
  type SendEmailPayload,
} from "@/lib/jobs/handlers/send-email";
import {
  handleNotifyAdmin,
  type NotifyAdminPayload,
} from "@/lib/jobs/handlers/notify-admin";

const MAX_ATTEMPTS = 3;

export interface RunResult {
  processed: number;
  succeeded: number;
  failed: number;
  permanentlyFailed: number;
  errors: string[];
}

export async function runPendingJobs(): Promise<RunResult> {
  const supabase = createServerClient();
  const result: RunResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    permanentlyFailed: 0,
    errors: [],
  };

  // ── Fetch due pending jobs ────────────────────────────────
  const { data: jobs, error: fetchErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "pending")
    .eq("failed_permanently", false)
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(50); // process at most 50 per cron tick to stay within Vercel timeout

  if (fetchErr) {
    result.errors.push(`fetch: ${fetchErr.message}`);
    return result;
  }

  // ── Inactive user check (runs every tick, idempotent) ────
  await checkInactiveUsers(supabase);

  if (!jobs?.length) return result;

  for (const job of jobs) {
    // ── Atomic claim: only proceed if we win the optimistic lock ──
    const { data: claimed } = await supabase
      .from("jobs")
      .update({
        status: "running",
        attempts: job.attempts + 1,
      })
      .eq("id", job.id)
      .eq("status", "pending") // optimistic lock - another worker may have grabbed it
      .select("id")
      .maybeSingle();

    if (!claimed) continue; // another invocation claimed this job first

    result.processed++;

    try {
      await executeJob(
        job.id,
        job.type,
        job.payload as Record<string, unknown>,
        supabase
      );

      // ── Mark done ───────────────────────────────────────
      await supabase
        .from("jobs")
        .update({ status: "done" })
        .eq("id", job.id);

      result.succeeded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const newAttempts = job.attempts + 1;
      const goingPermanent = newAttempts >= MAX_ATTEMPTS;

      // ── Mark failed ─────────────────────────────────────
      await supabase
        .from("jobs")
        .update({
          status: "failed",
          last_error: message,
          failed_permanently: goingPermanent,
        })
        .eq("id", job.id);

      await supabase.from("error_logs").insert({
        context: `cron/jobs:${job.type}`,
        error: message,
        payload: { job_id: job.id, attempts: newAttempts },
      });

      result.errors.push(`[${job.id}] ${job.type}: ${message}`);

      if (goingPermanent) {
        result.permanentlyFailed++;
        // Fire admin alert (non-blocking - don't await to avoid cascading failure)
        handleNotifyAdmin({
          job_id: job.id,
          job_type: job.type,
          error: message,
          attempts: newAttempts,
        }).catch((e) =>
          console.error("[runner] notify-admin failed:", e)
        );
      } else {
        result.failed++;
      }
    }
  }

  return result;
}

// ── Inactive user re-engagement ──────────────────────────────
// Finds users idle for 3+ days (status lead/engaged) who haven't
// received a re-engagement email in the past 7 days, and enqueues one.
async function checkInactiveUsers(
  supabase: ReturnType<typeof createServerClient>
): Promise<void> {
  try {
    const threeDaysAgo  = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Find users who haven't been seen in 3+ days and are lead/engaged
    const { data: inactiveUsers } = await supabase
      .from("users")
      .select("id, email, name")
      .in("status", ["lead", "engaged"])
      .lt("last_seen_at", threeDaysAgo)
      .limit(20); // process at most 20 per tick

    if (!inactiveUsers?.length) return;

    // Find the reengagement sequence
    const { data: seq } = await supabase
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "INACTIVE_3_DAYS")
      .eq("delay_hours", 0)
      .eq("active", true)
      .maybeSingle();

    if (!seq) return;

    for (const user of inactiveUsers) {
      // Check if we already sent a reengagement job in the last 7 days
      const { data: existing } = await supabase
        .from("jobs")
        .select("id")
        .eq("type", "SEND_EMAIL")
        .eq("status", "done")
        .gte("created_at", sevenDaysAgo)
        .filter("payload->template_key", "eq", "reengagement")
        .filter("payload->user_id", "eq", user.id)
        .maybeSingle();

      if (existing) continue; // already re-engaged recently

      await supabase.from("jobs").insert({
        type: "SEND_EMAIL",
        payload: {
          user_id: user.id,
          email: user.email,
          name: user.name ?? "",
          sequence_id: seq.id,
          subject: seq.subject,
          template_key: seq.template_key,
        },
        run_at: new Date().toISOString(),
        status: "pending",
      });
    }
  } catch {
    // Non-fatal - don't block main job processing
  }
}

// ── Job type dispatcher ───────────────────────────────────────
async function executeJob(
  jobId: string,
  type: string,
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createServerClient>
): Promise<void> {
  switch (type) {
    case "SEND_EMAIL":
      await handleSendEmail(payload as SendEmailPayload, supabase);
      break;

    case "NOTIFY_ADMIN":
      await handleNotifyAdmin(payload as unknown as NotifyAdminPayload);
      break;

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}
