// חדר השידור — daily cleanup (vercel.json cron, CRON_SECRET bearer like
// /api/cron/jobs). Two duties:
//
// 1. Expired takes: delete the storage OBJECT first, then flip the row to
//    'expired' (an orphan row is visible; an orphan object is invisible cost).
//    Never touches a take referenced by a non-failed edit whose output the
//    user hasn't received — the approve route already re-dated selected takes.
// 2. Stuck-edit sweep: anything in transcribing/burning for >15 minutes is a
//    crashed or timed-out invocation — mark failed so the user gets a retry
//    path instead of an eternal "הבמאית עורכת".
//
// Batched (<=50) and index-backed — NANO instance discipline.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "broadcast-takes";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient() as any;
  const report = { expired: 0, kept_referenced: 0, swept_edits: 0, errors: 0 };

  try {
    const { data: takes } = await db
      .from("broadcast_takes")
      .select("id, storage_path")
      .lt("expires_at", new Date().toISOString())
      .in("status", ["recorded", "uploaded", "selected"])
      .limit(50);

    for (const take of takes ?? []) {
      // Guard: skip takes still referenced by an edit that isn't failed and
      // hasn't delivered its output yet.
      const { count } = await db
        .from("broadcast_edits")
        .select("id", { count: "exact", head: true })
        .eq("take_id", take.id)
        .neq("status", "failed")
        .neq("status", "ready");
      if ((count ?? 0) > 0) {
        report.kept_referenced++;
        continue;
      }
      const { error: rmError } = await db.storage.from(BUCKET).remove([take.storage_path]);
      // "not found" is fine — object already gone; anything else keeps the row
      // for the next run.
      if (rmError && !/not.*found/i.test(rmError.message ?? "")) {
        report.errors++;
        continue;
      }
      await db.from("broadcast_takes").update({ status: "expired" }).eq("id", take.id);
      report.expired++;
    }

    const { data: swept } = await db
      .from("broadcast_edits")
      .update({ status: "failed", error_detail: "sweep:stuck_over_15min" })
      .in("status", ["transcribing", "burning"])
      .lt("processing_started_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .select("id");
    report.swept_edits = swept?.length ?? 0;

    return NextResponse.json(report);
  } catch (e) {
    await db.from("error_logs").insert({
      context: "/api/cron/broadcast-cleanup",
      error: e instanceof Error ? e.message.slice(0, 1000) : String(e),
    });
    return NextResponse.json({ ...report, fatal: true }, { status: 500 });
  }
}
