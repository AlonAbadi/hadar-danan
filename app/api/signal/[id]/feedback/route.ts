/**
 * POST /api/signal/[id]/feedback
 *
 * Captures the user's quality rating on their just-generated signal.
 * Body: { rating: 'precise' | 'close' | 'missed', note?: string }
 *
 * Public endpoint — the extractionId UUID acts as an unguessable handle.
 * Re-submitting is allowed (overwrite). Note is optional and capped at 2000
 * chars to bound the column size.
 *
 * The rating drives prompt iteration: once we have a few hundred ratings
 * we can pull the "missed" extractions, look at the answers + signal output
 * pairs, and either adjust the system prompt or flag patterns for Hadar to
 * review.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type Rating = "precise" | "close" | "missed";

function isValidRating(value: unknown): value is Rating {
  return value === "precise" || value === "close" || value === "missed";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "missing extraction id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rating, note } = (body ?? {}) as { rating?: unknown; note?: unknown };

  if (!isValidRating(rating)) {
    return NextResponse.json(
      { error: "rating must be 'precise', 'close', or 'missed'" },
      { status: 400 },
    );
  }

  // Note is optional; if present, normalize and cap.
  const noteStr =
    typeof note === "string" && note.trim().length > 0
      ? note.trim().slice(0, 2000)
      : null;

  const supabase = createServerClient();

  // Verify the extraction exists before writing — gives a clean 404
  // for typos / replay attacks against random UUIDs.
  const { data: existing } = await safeFrom(supabase, "signal_extractions")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "extraction not found" }, { status: 404 });
  }

  const { error: updateError } = await safeFrom(supabase, "signal_extractions")
    .update({
      feedback_rating: rating,
      feedback_note:   noteStr,
      feedback_at:     new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/feedback POST",
      error:   String(updateError.message ?? updateError),
      payload: { id, rating, hasNote: !!noteStr },
    });
    return NextResponse.json({ error: "feedback save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
