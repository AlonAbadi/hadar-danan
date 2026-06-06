import { NextRequest, NextResponse } from "next/server";
import { runDailyCallList } from "@/lib/daily-call-list/send";

/**
 * GET /api/cron/daily-call-list
 *
 * Triggered by cron-job.org every weekday (Sun–Thu) at 09:00 Asia/Jerusalem.
 * The handler still re-checks the Israel weekday/hour as defense-in-depth,
 * so spurious triggers are safely no-ops.
 *
 * Force a test send (skip weekday/hour gate + skip dedup):
 *   curl -H "Authorization: Bearer <CRON_SECRET>" \
 *        "https://www.beegood.online/api/cron/daily-call-list?force=1"
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const startedAt = Date.now();
  const result = await runDailyCallList({ force });
  const durationMs = Date.now() - startedAt;

  return NextResponse.json({ ...result, durationMs });
}
