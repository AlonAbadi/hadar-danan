/**
 * Daily call-list orchestrator.
 *
 * Pipeline:
 *   1. Israel weekday/hour gate (defense-in-depth even though cron-job.org
 *      should only fire Sun-Thu at 09:00 Asia/Jerusalem)
 *   2. Fetch candidate leads (lib/daily-call-list/query)
 *   3. Score each candidate (lib/daily-call-list/scoring)
 *   4. Dedup against yesterday's list with hot-signal override
 *   5. Pick top 5–10
 *   6. Generate AI brief per lead in parallel (concurrency 4)
 *   7. Insert into daily_call_list (UNIQUE on (sent_on, user_id) → idempotent)
 *   8. Render + send via Resend to all recipients
 *
 * Sends a minimal Tao-only email if 0 qualified leads. Logs all failures to
 * error_logs but never throws — the route returns 200 unless the Resend send
 * itself fails (in which case the cron retries).
 */

import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { fetchCandidates } from "./query";
import { scoreLead, pickTopLeads, applyDedup } from "./scoring";
import { generateBrief } from "./brief";
import { renderDailyCallEmail } from "./template";
import { getTaoVerseForDate } from "./tao";
import type { ScoredLead, FinalLead } from "./types";

const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";
const FROM_NAME    = "הדר דנן · רשימת חיוגים";

function getRecipients(): string[] {
  const list = [
    process.env.ADMIN_EMAIL,
    process.env.HADAR_EMAIL,
  ].filter((x): x is string => !!x);
  return Array.from(new Set(list));
}

// Returns "YYYY-MM-DD" for current Asia/Jerusalem date.
function israelDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year:  "numeric",
    month: "2-digit",
    day:   "2-digit",
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

// 0=Sun, 6=Sat (Asia/Jerusalem)
function israelWeekday(): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday:  "short",
  }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

// Hour 0-23 (Asia/Jerusalem)
function israelHour(): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    hour:     "2-digit",
    hour12:   false,
  }).format(new Date());
  return parseInt(h, 10);
}

async function generateBriefsConcurrent(leads: ScoredLead[], concurrency = 4): Promise<FinalLead[]> {
  const out: FinalLead[] = new Array(leads.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, leads.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= leads.length) return;
      const lead = leads[i]!;
      const brief = await generateBrief(lead);
      out[i] = { ...lead, brief };
    }
  });
  await Promise.all(workers);
  return out;
}

export type SendResult =
  | { ok: true;  skipped: true;  reason: string }
  | { ok: true;  skipped: false; sentCount: number; recipients: string[] }
  | { ok: false; error: string };

export async function runDailyCallList(options: { force?: boolean } = {}): Promise<SendResult> {
  const supabase = createServerClient();

  // ── Gate 1: Israel weekday/hour (Sun-Thu, ~09:00) ───────────────────────
  // Skipped when force=true (for test sends).
  if (!options.force) {
    const wd = israelWeekday();
    if (wd === 5 || wd === 6) {
      return { ok: true, skipped: true, reason: `Israel weekday=${wd} (Fri/Sat)` };
    }
    const hr = israelHour();
    if (hr < 8 || hr > 10) {
      return { ok: true, skipped: true, reason: `Israel hour=${hr} (outside 08:00-10:00 window)` };
    }
  }

  const today = israelDateString();
  const recipients = getRecipients();
  const verse = getTaoVerseForDate(new Date());

  try {
    // ── Gate 2: already-sent for today? ─────────────────────────────────
    // Uses the daily_call_list_runs marker (single row per day) so we detect
    // "already sent" even on zero-leads days when daily_call_list itself has
    // no rows for today.
    if (!options.force) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingRun } = await (supabase as any)
        .from("daily_call_list_runs")
        .select("sent_on")
        .eq("sent_on", today)
        .maybeSingle();
      if (existingRun) {
        return { ok: true, skipped: true, reason: `already sent today (${today})` };
      }
    }

    // ── Yesterday's leads (for dedup) ────────────────────────────────────
    const yesterday = new Date(Date.parse(today + "T00:00:00Z") - 86400000)
      .toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: yesterdayRows } = await (supabase as any)
      .from("daily_call_list")
      .select("user_id")
      .eq("sent_on", yesterday);
    const yesterdayIds = new Set<string>((yesterdayRows ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean));

    // ── Find + score + pick ──────────────────────────────────────────────
    const candidates = await fetchCandidates(supabase);
    const scored = candidates.map(scoreLead);
    const deduped = applyDedup(scored, yesterdayIds);
    const top = pickTopLeads(deduped);

    // ── Generate briefs in parallel ──────────────────────────────────────
    const final = top.length > 0 ? await generateBriefsConcurrent(top, 4) : [];

    // ── Persist (idempotent via UNIQUE constraint) ───────────────────────
    if (final.length > 0) {
      const insertRows = final.map(f => ({
        sent_on: today,
        user_id: f.id,
        score:   Number(f.score.toFixed(2)),
        reasons: f.reasons,
        brief:   f.brief,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (supabase as any)
        .from("daily_call_list")
        .upsert(insertRows, { onConflict: "sent_on,user_id" });
      if (insertErr) {
        await supabase.from("error_logs").insert({
          context: "api/cron/daily-call-list",
          error:   "daily_call_list insert failed",
          payload: { message: insertErr.message, count: insertRows.length },
        });
      }
    }

    // ── Render + send ────────────────────────────────────────────────────
    const { subject, html } = renderDailyCallEmail({ verse, leads: final, recipients });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };

    const resend = new Resend(apiKey);
    const { error: sendErr } = await resend.emails.send({
      from:    `${FROM_NAME} <${FROM_ADDRESS}>`,
      to:      recipients,
      subject,
      html,
    });
    if (sendErr) {
      await supabase.from("error_logs").insert({
        context: "api/cron/daily-call-list",
        error:   `Resend send failed: ${sendErr.message}`,
        payload: { recipients, subject },
      });
      return { ok: false, error: sendErr.message };
    }

    // Marker — written only AFTER successful send so a failed send still
    // allows retry. Upsert because force=1 may re-run on the same day.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("daily_call_list_runs")
      .upsert({ sent_on: today, lead_count: final.length }, { onConflict: "sent_on" });

    return { ok: true, skipped: false, sentCount: final.length, recipients };

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("error_logs").insert({
      context: "api/cron/daily-call-list",
      error:   `Pipeline failure: ${msg}`,
    });
    return { ok: false, error: msg };
  }
}
