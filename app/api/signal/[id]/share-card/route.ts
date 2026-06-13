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
import {
  isReplicateConfigured,
  generateBackgroundImage,
  buildBackgroundPrompt,
} from "@/lib/replicate";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
// Replicate generation runs 5-10s, HCTI another 2-3s. 60s is plenty.
export const maxDuration = 60;

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

function buildHtml(signalText: string, bgUrl: string | null): { html: string; css: string } {
  const fontSize = signalFontSize(signalText);

  // When we have an AI-generated background, lay it down first under a dark
  // gradient overlay so the Hebrew text always stays readable regardless of
  // what the model came up with. Without a bg, the card falls back to the
  // pure dark Santosha background — the existing v1 look.
  const bgLayer = bgUrl
    ? `<div class="bg" style="background-image:url('${esc(bgUrl)}');"></div>
       <div class="bg-overlay"></div>`
    : "";

  // Designed as a public branding statement for the customer to post to
  // their own audience. No personal address. Discovery attribution lives
  // quietly at the bottom — turns into a soft funnel back to /signal when
  // their followers see it.
  const html = `
<div class="card">
  ${bgLayer}
  <div class="glow"></div>
  <img class="bee" src="https://www.beegood.online/beegood_logo.png" alt="" />
  <div class="signal-wrap">
    <div class="signal" style="font-size:${fontSize}px;">${esc(signalText)}</div>
  </div>
  <div class="divider"></div>
  <div class="attribution">התגלה באמצעות שיטת <span dir="ltr" style="unicode-bidi:embed">TrueSignal©</span></div>
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

/* AI-generated background image, full bleed */
.bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

/* Dark gradient overlay on top of the AI bg — keeps the Hebrew text always
   readable regardless of what the model came up with. Heavier at bottom
   where the attribution + footer live. */
.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(8,12,20,0.45) 0%,
    rgba(8,12,20,0.55) 35%,
    rgba(8,12,20,0.75) 65%,
    rgba(8,12,20,0.92) 100%
  );
  z-index: 1;
}

.glow {
  position: absolute;
  top: -25%;
  left: 50%;
  transform: translateX(-50%);
  width: 150%;
  height: 90%;
  background: radial-gradient(ellipse at center, rgba(232,185,74,0.20) 0%, rgba(232,185,74,0.08) 35%, transparent 70%);
  z-index: 2;
}

.bee {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: auto;
  z-index: 3;
  /* Subtle glow to match the brand */
  filter: drop-shadow(0 0 24px rgba(232,185,74,0.25));
}

.signal-wrap {
  position: absolute;
  top: 50%;
  left: 80px;
  right: 80px;
  transform: translateY(-50%);
  text-align: center;
  direction: rtl;
  z-index: 3;
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
  bottom: 180px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #C9964A, transparent);
  z-index: 3;
}

.attribution {
  position: absolute;
  bottom: 135px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #C9964A;
  opacity: 0.78;
  direction: rtl;
  letter-spacing: 0.5px;
  z-index: 3;
}

.footer {
  position: absolute;
  bottom: 85px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #C9964A;
  z-index: 3;
}
`;

  return { html, css };
}

export async function GET(
  req: NextRequest,
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

  // The card is a PUBLIC statement the customer posts to THEIR audience —
  // so the text must address that audience, never the diagnostic-taker
  // themselves. public_card_statement is the field specifically authored
  // for that voice. We fall back to the personal signal sentence only for
  // legacy extractions made before this field existed; new extractions
  // always include it (REQUIRED in validator).
  const cardText: string =
    typeof row.signal.public_card_statement === "string" && row.signal.public_card_statement.trim().length > 0
      ? row.signal.public_card_statement.trim()
      : String(row.signal.signal);

  // ── AI background gating ──────────────────────────────────────────────
  // The cinematic AI background is a Hive perk: members get a unique
  // Replicate-generated image behind the text; non-members get the existing
  // pure-dark v1 look. `?force_ai=1` is an escape hatch for manual testing
  // on any extraction regardless of the owner's status.
  const forceAi = req.nextUrl.searchParams.get("force_ai") === "1";
  let bgUrl: string | null =
    typeof row.signal.card_bg_url === "string" && row.signal.card_bg_url.startsWith("http")
      ? row.signal.card_bg_url
      : null;

  if (!bgUrl && isReplicateConfigured()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRow } = await (supabase as any)
      .from("users")
      .select("hive_status, occupation")
      .eq("id", row.user_id)
      .maybeSingle();

    const isHive  = userRow?.hive_status === "active";
    const allowAi = forceAi || isHive;

    if (allowAi) {
      const prompt = buildBackgroundPrompt({
        element:      String(row.signal.element       ?? ""),
        central_tool: String(row.signal.central_tool  ?? ""),
        occupation:   typeof userRow?.occupation === "string" ? userRow.occupation : null,
      });
      const gen = await generateBackgroundImage(prompt);
      if (gen.ok) {
        bgUrl = gen.imageUrl;
        // Persist on the extraction so future card views skip the regen.
        const updatedSignal = { ...row.signal, card_bg_url: bgUrl };
        await safeFrom(supabase, "signal_extractions")
          .update({ signal: updatedSignal })
          .eq("id", id);
      } else {
        await supabase.from("error_logs").insert({
          context: "api/signal/[id]/share-card — Replicate gen",
          error:   gen.error,
          payload: { extractionId: id },
        });
        // Soft-fail: render the v1 card without AI bg.
      }
    }
  }

  const { html, css } = buildHtml(cardText, bgUrl);

  const result = await createHctiImage({
    html,
    css,
    googleFonts:    "Assistant:wght@700",
    viewportWidth:  1080,
    viewportHeight: 1080,
    msDelay:        600,   // give the webfont + bee logo image time to load
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
      // Short cache — the underlying public_card_statement can be regenerated
      // (e.g. backfill on legacy extractions, or a future "regenerate card"
      // admin action). `immutable` would freeze stale PNGs in CDN/browser.
      "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
