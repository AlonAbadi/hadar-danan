/**
 * GET /api/signal/[id]/share-card
 *
 * Renders the brand share-card PNG via htmlcsstoimage (real Chrome → perfect
 * Hebrew BiDi). The design is inline HTML/CSS in this file — iterate by
 * editing here, committing, and pushing. No external editor.
 *
 * Returns 503 if HCTI env vars aren't set (button hides itself client-side).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createHctiImage, isHctiConfigured } from "@/lib/htmlcsstoimage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// HTML-escape user-controlled strings going into the template
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Length-aware font sizing so long signals don't overflow the canvas
function signalFontSize(text: string): number {
  const len = text.length;
  if (len < 70)  return 64;
  if (len < 110) return 56;
  if (len < 160) return 48;
  if (len < 220) return 40;
  return 36;
}

function buildHtml(signalText: string, firstName: string): { html: string; css: string } {
  const fontSize = signalFontSize(signalText);
  const greeting = firstName ? `${esc(firstName)},` : "";

  const html = `
<div class="card">
  <div class="glow"></div>
  <div class="tag">TRUESIGNAL©</div>
  ${greeting ? `<div class="name">${greeting}</div>` : ""}
  <div class="signal-wrap">
    <div class="signal" style="font-size:${fontSize}px;">${esc(signalText)}</div>
  </div>
  <div class="divider"></div>
  <div class="footer">beegood.online</div>
</div>`;

  const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { margin: 0; padding: 0; }

.card {
  width: 1080px;
  height: 1080px;
  background: #080C14;
  position: relative;
  font-family: 'Assistant', 'Heebo', system-ui, sans-serif;
  overflow: hidden;
  direction: rtl;
}

.glow {
  position: absolute;
  top: -25%;
  left: 50%;
  transform: translateX(-50%);
  width: 150%;
  height: 90%;
  background: radial-gradient(ellipse at center, rgba(232,185,74,0.20) 0%, rgba(232,185,74,0.08) 35%, transparent 70%);
}

.tag {
  position: absolute;
  top: 90px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #C9964A;
}

.name {
  position: absolute;
  top: 145px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  color: #C9964A;
  opacity: 0.85;
}

.signal-wrap {
  position: absolute;
  top: 50%;
  left: 80px;
  right: 80px;
  transform: translateY(-50%);
  text-align: center;
  direction: rtl;
}

.signal {
  font-weight: 700;
  color: #EDE9E1;
  line-height: 1.4;
  direction: rtl;
  unicode-bidi: plaintext;
}

.divider {
  position: absolute;
  bottom: 195px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #C9964A, transparent);
}

.footer {
  position: absolute;
  bottom: 90px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #C9964A;
}
`;

  return { html, css };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return new NextResponse("missing id", { status: 400 });

  if (!isHctiConfigured()) {
    return new NextResponse("share-card disabled", { status: 503 });
  }

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

  const { html, css } = buildHtml(String(row.signal.signal), firstName);

  const result = await createHctiImage({
    html,
    css,
    googleFonts:    "Assistant:wght@700",
    viewportWidth:  1080,
    viewportHeight: 1080,
    msDelay:        300,   // give the Hebrew webfont time to load
  });

  if (!result.ok) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/share-card — HCTI",
      error:   result.error,
      payload: { extractionId: id, status: result.status },
    });
    return new NextResponse("render failed", { status: 502 });
  }

  // Proxy the HCTI-hosted PNG so the user-facing URL stays on beegood.online
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
      "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
