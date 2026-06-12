/**
 * GET /api/signal/[id]/share-card
 *
 * Renders a branded share-card PNG of the signal sentence via Bannerbear,
 * proxied through our own URL so the user-facing endpoint stays on
 * beegood.online (not bannerbear.com). Used by ShareButton to feed
 * navigator.share() on mobile or trigger a direct download on desktop.
 *
 * Returns 503 if Bannerbear isn't configured yet — the ShareButton hides
 * itself in that case (the route check via `isBannerbearConfigured()`
 * surfaces as a button-visibility flag in the page server component).
 *
 * Modifications expected on the Bannerbear template:
 *   - text layer named "signal_text"  → the signal sentence
 *   - text layer named "first_name"   → optional, the lead's first name
 *
 * If the template uses different layer names, change them here.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createBannerbearImage, isBannerbearConfigured } from "@/lib/bannerbear";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return new NextResponse("missing id", { status: 400 });

  if (!isBannerbearConfigured()) {
    return new NextResponse("share-card disabled", { status: 503 });
  }

  // Fetch the signal + the owner's first name
  const supabase = createServerClient();
  const { data: row } = await safeFrom(supabase, "signal_extractions")
    .select("signal, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!row?.signal?.signal) {
    return new NextResponse("signal not found", { status: 404 });
  }

  let firstName = "";
  if (row.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", row.user_id)
      .maybeSingle();
    if (typeof user?.name === "string" && user.name.trim().length > 0) {
      firstName = user.name.split(" ")[0];
    }
  }

  const templateUid = process.env.BANNERBEAR_TEMPLATE_ID!;
  const result = await createBannerbearImage({
    templateUid,
    modifications: [
      { name: "signal_text", text: String(row.signal.signal) },
      { name: "first_name",  text: firstName },
    ],
    metadata: `extraction:${id}`,
  });

  if (!result.ok) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/share-card — Bannerbear",
      error:   result.error,
      payload: { extractionId: id, status: result.status },
    });
    return new NextResponse("render failed", { status: 502 });
  }

  // Proxy the Bannerbear-hosted PNG so the client sees a beegood.online URL
  let imgRes: Response;
  try {
    imgRes = await fetch(result.imageUrl);
  } catch (e) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/share-card — fetch upstream",
      error:   String(e),
      payload: { imageUrl: result.imageUrl },
    });
    return new NextResponse("upstream fetch failed", { status: 502 });
  }

  if (!imgRes.ok || !imgRes.body) {
    return new NextResponse("upstream returned no body", { status: 502 });
  }

  return new NextResponse(imgRes.body, {
    status: 200,
    headers: {
      "content-type":  "image/png",
      // Signals are immutable per id — Bannerbear caches on their end too
      "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
