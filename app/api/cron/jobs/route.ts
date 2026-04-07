import { NextRequest, NextResponse } from "next/server";
import { runPendingJobs } from "@/lib/jobs/runner";

/**
 * GET /api/cron/jobs
 *
 * Called by Vercel Cron every 5 minutes (see vercel.json).
 * Vercel automatically injects: Authorization: Bearer <CRON_SECRET>
 *
 * Also callable manually during development:
 *   curl -H "Authorization: Bearer dev" http://localhost:3000/api/cron/jobs
 *   (set CRON_SECRET=dev in .env.local)
 */
export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret) {
    // Production: verify the Vercel-injected bearer token
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Production with no secret configured - block the request
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }
  // Development with no CRON_SECRET set: allow all calls

  const startedAt = Date.now();

  try {
    const result = await runPendingJobs();
    const duration = Date.now() - startedAt;

    console.log(
      `[cron/jobs] done in ${duration}ms -`,
      `processed=${result.processed}`,
      `ok=${result.succeeded}`,
      `failed=${result.failed}`,
      `permanent=${result.permanentlyFailed}`
    );

    return NextResponse.json({
      ok: true,
      duration_ms: duration,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/jobs] fatal:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
