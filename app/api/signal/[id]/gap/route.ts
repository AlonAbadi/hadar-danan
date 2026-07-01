/**
 * POST /api/signal/[id]/gap  — INTERNAL, admin-only, behind GAP_ENGINE_ENABLED.
 *
 * Runs the gap-detection pipeline on one extraction, persists the result to the
 * internal gap_* columns (migration 059), and returns it. NEVER exposed to a
 * user. Used by the internal review UI (/admin/signal/gap) so Hadar + human
 * experts validate before anything ships.
 *
 * Abstention-first: a result of present="abstain" (or safety="do_not_name") is
 * the correct, common outcome and is persisted like any other.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { detectGap } from "@/lib/signal/gap-detect";
import { GAP_ENGINE_ENABLED } from "@/lib/prompts/gap-engine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD) return true;
    if (user === process.env.ADMIN_USERNAME_2 && pass === process.env.ADMIN_PASSWORD_2) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!GAP_ENGINE_ENABLED) {
    return NextResponse.json({ error: "gap engine disabled" }, { status: 403 });
  }
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const supabase = createServerClient();

  try {
    const { data: ext, error } = await safeFrom(supabase, "signal_extractions")
      .select("id, answers")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!ext?.answers) return NextResponse.json({ error: "extraction not found" }, { status: 404 });

    const result = await detectGap(ext.answers as Record<string, string>);

    await safeFrom(supabase, "signal_extractions")
      .update({
        gap_present:        result.present,
        gap_seam:           result.seam,
        gap_safety:         result.safety,
        gap_confidence:     result.confidence,
        gap_signals:        result.signals,
        gap_reading:        result.reading,
        gap_crossing:       result.crossing,
        gap_evidence:       result.evidence,
        gap_engine_version: result.version,
        gap_computed_at:    new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ ok: true, result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await safeFrom(supabase, "error_logs").insert({
      context: "api/signal/[id]/gap", error: msg, payload: { id },
    });
    return NextResponse.json({ error: "gap detection failed" }, { status: 500 });
  }
}
