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
} from "@/lib/replicate";
import {
  buildVisualPrompt,
  isValidStyle,
  DEFAULT_STYLE,
  type VisualStyle,
} from "@/lib/signal-visual-prompter";
import { resolvePalette, type Palette } from "@/lib/signal/palettes";

// Per-style overlay. Premium v2: very light tint across the whole card — just
// enough to unify color and ground the image visually. White text legibility is
// guaranteed by an aggressive multi-layer text-shadow on the .signal class (see
// CSS below), not by darkening the image. This lets the Ultra-quality photo
// actually show through.
function overlayGradient(style: VisualStyle): string {
  if (style === "luminous") {
    return `linear-gradient(
      to bottom,
      rgba(8,12,20,0.00) 0%,
      rgba(8,12,20,0.05) 55%,
      rgba(8,12,20,0.20) 100%
    )`;
  }
  return `linear-gradient(
    to bottom,
    rgba(8,12,20,0.08) 0%,
    rgba(8,12,20,0.18) 55%,
    rgba(8,12,20,0.42) 100%
  )`;
}

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
// Replicate generation runs 5-10s, HCTI another 2-3s. 60s is plenty.
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// Atomic JSONB single-field merge — see asset route for the race-condition
// context. Requires migration 049 (signal_merge_field Postgres function).
async function mergeSignalField(
  supabase: ReturnType<typeof createServerClient>,
  id:    string,
  field: string,
  value: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("signal_merge_field", {
    p_id:    id,
    p_field: field,
    p_value: value,
  });
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

function buildHtml(signalText: string, bgUrl: string | null, clean: boolean, style: VisualStyle, palette: Palette): { html: string; css: string } {
  const fontSize = signalFontSize(signalText);

  // When we have an AI-generated background, lay it down first under a dark
  // gradient overlay so the Hebrew text always stays readable regardless of
  // what the model came up with. Without a bg, the card falls back to the
  // pure dark Santosha background — the existing v1 look.
  const bgLayer = bgUrl
    ? `<div class="bg" style="background-image:url('${esc(bgUrl)}');"></div>
       <div class="bg-overlay"></div>`
    : "";

  // Clean variant (Hive perk) strips the bee logo + brand attribution + the
  // beegood.online footer. The asset becomes the customer's own — a polished
  // editorial post they can put on Instagram without our marks. Non-Hive
  // users get the watermarked version with full branding (the bee, the
  // attribution, the footer URL).
  const brandingBlock = clean ? "" : `
  <img class="bee" src="https://www.beegood.online/beegood_logo.png" alt="" />
  <div class="divider"></div>
  <div class="attribution">התגלה באמצעות שיטת <span dir="ltr" style="unicode-bidi:embed">TrueSignal©</span></div>
  <div class="footer">beegood.online</div>`;

  // Designed as a public branding statement for the customer to post to
  // their own audience. No personal address. The accent-line above the text
  // is a thin gold divider that frames the quote magazine-style.
  const html = `
<div class="card">
  ${bgLayer}
  <div class="glow"></div>${brandingBlock}
  <div class="signal-wrap">
    <div class="accent-line"></div>
    <div class="signal" style="font-size:${fontSize}px;">${esc(signalText)}</div>
  </div>
</div>`;

  const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { margin: 0; padding: 0; }

.card {
  width: 1080px;
  height: 1080px;
  background: ${palette.bg};
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
  background: ${overlayGradient(style)};
  z-index: 1;
}

/* Radial glow behind the bee logo — uses the palette's accent at low opacity
   so each palette has its own atmospheric glow color. */
.glow {
  position: absolute;
  top: -25%;
  left: 50%;
  transform: translateX(-50%);
  width: 150%;
  height: 90%;
  background: radial-gradient(ellipse at center, ${palette.glow} 0%, transparent 70%);
  z-index: 2;
}

.bee {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: auto;
  z-index: 3;
  opacity: 0.95;
  filter: drop-shadow(0 0 32px ${palette.glow});
}

.signal-wrap {
  position: absolute;
  top: 50%;
  left: 100px;
  right: 100px;
  transform: translateY(-50%);
  text-align: center;
  direction: rtl;
  z-index: 3;
}

.accent-line {
  width: 64px;
  height: 2px;
  margin: 0 auto 36px;
  background: linear-gradient(90deg, transparent, ${palette.accent}, transparent);
  opacity: 0.85;
}

/* Statement text uses the palette's text color. All 11 curated palettes ship
   with dark backgrounds + light text (validated AAA contrast), so the dark
   text-shadow halo always works for legibility on AI backgrounds. */
.signal {
  font-weight: 700;
  color: ${palette.text};
  line-height: 1.38;
  letter-spacing: -0.005em;
  direction: rtl;
  unicode-bidi: plaintext;
  text-shadow:
    0 2px 14px rgba(0,0,0,0.85),
    0 4px 28px rgba(0,0,0,0.65),
    0 0 48px rgba(0,0,0,0.45);
}

.divider {
  position: absolute;
  bottom: 168px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${palette.accent}, transparent);
  opacity: 0.7;
  z-index: 3;
}

.attribution {
  position: absolute;
  bottom: 124px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  color: ${palette.accent};
  opacity: 0.72;
  direction: rtl;
  letter-spacing: 0.6px;
  z-index: 3;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

.footer {
  position: absolute;
  bottom: 78px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: ${palette.accent};
  z-index: 3;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
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

  // ── Query parameters ──────────────────────────────────────────────────
  // ?style=editorial|warm|minimal  — visual direction (default: editorial)
  // ?clean=1                       — strip bee logo + attribution + footer
  //                                  (Hive perk: their card, no watermarks)
  // ?force_ai=1                    — escape hatch for manual testing on any
  //                                  extraction regardless of hive_status
  // ?palette=<id>                  — override the LLM-chosen palette for
  //                                  testing (otherwise pulls signal.palette_id)
  const styleParam = req.nextUrl.searchParams.get("style") ?? "";
  const style: VisualStyle = isValidStyle(styleParam) ? styleParam : DEFAULT_STYLE;
  const cleanParam = req.nextUrl.searchParams.get("clean") === "1";
  const forceAi    = req.nextUrl.searchParams.get("force_ai") === "1";
  const paletteOverride = req.nextUrl.searchParams.get("palette");

  // Resolve palette: query override beats stored value beats default.
  // resolvePalette() always returns a valid palette (falls back to midnight
  // on missing/invalid input), so the card never fails to render on bad data.
  const palette = resolvePalette(
    paletteOverride ?? (typeof row.signal.palette_id === "string" ? row.signal.palette_id : null)
  );

  // ── User permissions ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (supabase as any)
    .from("users")
    .select("hive_status, occupation")
    .eq("id", row.user_id)
    .maybeSingle();

  const isHive  = userRow?.hive_status === "active";
  const allowAi    = forceAi || isHive;
  const allowClean = forceAi || isHive;  // clean variant is also a Hive perk
  const clean      = cleanParam && allowClean;

  // ── AI background generation (per-style cache) ───────────────────────
  // Each visual style is generated and cached independently. Reading the
  // already-cached URL for a style is free; only the first request per
  // (extraction, style) pair pays the Replicate cost.
  // Cache key v2 — bumped when we upgraded to Flux 1.1 Pro Ultra + the rewritten
  // visual prompter. v1 URLs (lower-quality Pro model, dim prompt) are orphaned
  // in the JSONB but stop being read. Each style still caches independently.
  const cacheKey = `card_bg_url_v2_${style}`;
  let bgUrl: string | null =
    typeof row.signal[cacheKey] === "string" && row.signal[cacheKey].startsWith("http")
      ? row.signal[cacheKey]
      : null;

  if (!bgUrl && allowAi && isReplicateConfigured()) {
    // Stage 1: Claude writes the visual prompt with full occupation context.
    const promptResult = await buildVisualPrompt({
      signal:         String(row.signal.signal         ?? ""),
      signal_promise: String(row.signal.signal_promise ?? ""),
      element:        String(row.signal.element        ?? ""),
      central_tool:   String(row.signal.central_tool   ?? ""),
      occupation:     typeof userRow?.occupation === "string" ? userRow.occupation : null,
      style,
    });

    if (!promptResult.ok) {
      await supabase.from("error_logs").insert({
        context: "api/signal/[id]/share-card — visual prompter",
        error:   promptResult.error,
        payload: { extractionId: id, style },
      });
    } else {
      // Stage 2: Flux renders the scene from Claude's prompt.
      const gen = await generateBackgroundImage(promptResult.prompt);
      if (gen.ok) {
        bgUrl = gen.imageUrl;
        // Persist per-style so future requests skip the regen.
        await mergeSignalField(supabase, id, cacheKey, bgUrl);
      } else {
        await supabase.from("error_logs").insert({
          context: "api/signal/[id]/share-card — Replicate gen",
          error:   gen.error,
          payload: { extractionId: id, style, prompt: promptResult.prompt },
        });
        // Soft-fail: render the v1 card without AI bg.
      }
    }
  }

  const { html, css } = buildHtml(cardText, bgUrl, clean, style, palette);

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
