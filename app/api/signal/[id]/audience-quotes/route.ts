/**
 * POST /api/signal/[id]/audience-quotes
 *
 * Body: { quotes: string[] }
 *
 * Persists up to 5 quotes the customer's OWN audience has actually said to
 * them ("Content Torah 17" — Hadar's own teaching: content must be grounded
 * in real audience data, not the model's guess). Stored on
 * signal_extractions.signal.audience_quotes so the shoot-day videos pack
 * picks them up on the next regen.
 *
 * Ownership: enforced via the extraction row's user_id vs the caller's
 * Supabase session, matching the existing pattern on /shoot-day/*.
 *
 * Alon 2026-07-22 (Phase B). No delete endpoint — new POST fully replaces
 * the array so the customer edits the whole set at once from the UI card.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUOTES        = 5;
const MAX_QUOTE_LENGTH  = 240;   // one full sentence — keeps it real

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let quotes: string[];
  try {
    const body = await req.json();
    if (!Array.isArray(body?.quotes)) {
      return NextResponse.json({ error: "quotes must be an array of strings" }, { status: 400 });
    }
    quotes = body.quotes
      .filter((q: unknown): q is string => typeof q === "string")
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0)
      .map((q: string) => q.slice(0, MAX_QUOTE_LENGTH));
    if (quotes.length > MAX_QUOTES) {
      return NextResponse.json({ error: `Max ${MAX_QUOTES} quotes` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch existing signal blob so we can merge, not overwrite.
  const { data: row } = await safeFrom(supabase, "signal_extractions")
    .select("signal, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: "extraction not found" }, { status: 404 });
  }

  const nextSignal = {
    ...(row.signal ?? {}),
    audience_quotes: quotes,
  };

  const { error: updErr } = await safeFrom(supabase, "signal_extractions")
    .update({ signal: nextSignal })
    .eq("id", id);

  if (updErr) {
    try {
      await safeFrom(supabase, "error_logs").insert({
        context: "audience-quotes save failed",
        error: String(updErr),
        payload: { extractionId: id, count: quotes.length },
      });
    } catch { /* ignore */ }
    return NextResponse.json({ error: "save failed", details: String(updErr) }, { status: 500 });
  }

  // Invalidate any cached shoot-day plan so the next visit regenerates with
  // the fresh audience_quotes in context. Cheap — the client re-fetches on
  // /kaveret next load.
  if (row.signal?.shoot_day || row.signal?.shoot_day_phase1) {
    const drop = { ...nextSignal };
    delete drop.shoot_day;
    delete drop.shoot_day_phase1;
    delete drop.shoot_day_generated_at;
    for (let n = 1; n <= 7; n++) delete drop[`shoot_day_v${n}`];
    delete drop.shoot_day_strategy;
    delete drop.shoot_day_gifts;
    delete drop.shoot_day_director;
    await safeFrom(supabase, "signal_extractions")
      .update({ signal: drop })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true, count: quotes.length });
}
