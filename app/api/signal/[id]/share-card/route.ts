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
import { determineFraming } from "@/lib/signal/framing";
import { persistBackground, isPersistedUrl } from "@/lib/signal/persist-bg";

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

function buildHtml(signalText: string, bgUrl: string | null, clean: boolean, style: VisualStyle, palette: Palette, isDraft = false): { html: string; css: string } {
  // When we have an AI-generated background, lay it down first under a dark
  // gradient overlay so the Hebrew text always stays readable regardless of
  // what the model came up with. Without a bg, the card falls back to the
  // pure palette background.
  const bgLayer = bgUrl
    ? `<div class="bg" style="background-image:url('${esc(bgUrl)}');"></div>
       <div class="bg-overlay"></div>`
    : "";

  // Clean variant (Hive perk) strips the bee logo + brand footer so the
  // asset is the customer's own — no beegood watermark. Non-Hive users get
  // the full branded version.
  const beeBlock = clean ? "" : `
  <div class="bee-zone">
    <div class="bee-halo"></div>
    <img class="bee" src="https://www.beegood.online/beegood_logo.png" alt="" />
  </div>`;

  const footerBlock = clean ? "" : `
  <div class="footer-zone">
    <div class="method-line">התגלה באמצעות שיטת <span dir="ltr" style="unicode-bidi:embed">TrueSignal©</span></div>
    <div class="url-line">beegood.online</div>
  </div>`;

  // 4:5 portrait composition: bee zone top, quote zone center, footer bottom.
  // Inner L-shaped corner accents at 46px inset for a premium magazine frame.
  // The decorative quote mark above the statement uses the palette's accent
  // at low opacity as a graphic element, not as readable punctuation.
  // Draft treatment: a faint full-bleed watermark + a rotated rubber-stamp
  // badge, both in the palette accent. Signals "first version" without ruining
  // the card. Only present when isDraft.
  const draftBlock = isDraft ? `
  <div class="draft-ghost">טיוטה</div>
  <div class="draft-stamp"><div class="ds-t">טיוטה</div><div class="ds-s">גרסה ראשונית</div></div>` : "";

  const html = `
<div class="card">
  ${bgLayer}
  ${draftBlock}
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>
  ${beeBlock}
  <div class="quote-zone">
    <div class="quote-mark">&ldquo;</div>
    <div class="quote-text">${esc(signalText)}</div>
    <div class="divider"></div>
  </div>
  ${footerBlock}
</div>`;

  const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { margin: 0; padding: 0; }

.card {
  width: 1080px;
  height: 1350px;
  background: ${palette.bg};
  position: relative;
  overflow: hidden;
  direction: rtl;
}

.bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: ${overlayGradient(style)};
  z-index: 1;
}

/* Inner border — 4 L-shaped corner accents at 46px inset */
.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  z-index: 4;
  opacity: 0.5;
}
.corner-tl { top: 46px; left: 46px; border-top: 1px solid ${palette.accent}; border-left: 1px solid ${palette.accent}; }
.corner-tr { top: 46px; right: 46px; border-top: 1px solid ${palette.accent}; border-right: 1px solid ${palette.accent}; }
.corner-bl { bottom: 46px; left: 46px; border-bottom: 1px solid ${palette.accent}; border-left: 1px solid ${palette.accent}; }
.corner-br { bottom: 46px; right: 46px; border-bottom: 1px solid ${palette.accent}; border-right: 1px solid ${palette.accent}; }

/* Top zone — bee with a soft radial halo behind it */
.bee-zone {
  position: absolute;
  top: 130px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.bee-halo {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, ${palette.glow} 0%, transparent 65%);
  filter: blur(12px);
}

.bee {
  position: relative;
  width: 88px;
  height: auto;
  z-index: 1;
  filter: drop-shadow(0 0 24px ${palette.glow});
}

/* Center zone — decorative quote mark + statement + divider anchor */
.quote-zone {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 780px;
  text-align: center;
  direction: rtl;
  z-index: 3;
}

.quote-mark {
  font-family: 'Frank Ruhl Libre', 'Assistant', serif;
  font-size: 110px;
  font-weight: 500;
  line-height: 0.8;
  color: ${palette.accent};
  opacity: 0.3;
  margin: 0 0 18px;
  direction: ltr;
}

.quote-text {
  font-family: 'Frank Ruhl Libre', 'Assistant', serif;
  font-size: 56px;
  font-weight: 500;
  line-height: 1.6;
  color: ${palette.text};
  direction: rtl;
  unicode-bidi: plaintext;
  text-wrap: pretty;
  text-shadow:
    0 2px 14px rgba(0,0,0,0.85),
    0 4px 28px rgba(0,0,0,0.65),
    0 0 48px rgba(0,0,0,0.45);
}

.divider {
  width: 58px;
  height: 2px;
  margin: 40px auto 0;
  background: linear-gradient(90deg, transparent, ${palette.accent}, transparent);
  opacity: 0.85;
}

/* Bottom zone — method line + URL, vertically stacked */
.footer-zone {
  position: absolute;
  bottom: 130px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  z-index: 3;
}

.method-line {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-size: 18px;
  font-weight: 300;
  color: ${palette.accent};
  opacity: 0.78;
  letter-spacing: 0.4px;
  direction: rtl;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

.url-line {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-size: 25px;
  font-weight: 700;
  color: ${palette.accent};
  letter-spacing: 1.8px;
  direction: ltr;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

/* Draft treatment — faint full-bleed watermark + rotated rubber-stamp badge */
.draft-ghost {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 360px;
  color: ${palette.accent};
  opacity: 0.05;
  transform: rotate(-18deg);
  pointer-events: none;
  white-space: nowrap;
}
.draft-stamp {
  position: absolute;
  top: 150px;
  left: 90px;
  z-index: 5;
  transform: rotate(-11deg);
  border: 4px solid ${palette.accent};
  border-radius: 14px;
  padding: 12px 28px 9px;
  opacity: 0.9;
  box-shadow: inset 0 0 0 2px ${palette.accent}55;
}
.draft-stamp .ds-t {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 700;
  font-size: 44px;
  letter-spacing: 6px;
  line-height: 1;
  color: ${palette.accent};
}
.draft-stamp .ds-s {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-size: 15px;
  letter-spacing: 5px;
  margin-top: 6px;
  text-align: center;
  color: ${palette.accent};
  opacity: 0.85;
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
  // Cache key v3 — bumped when canvas changed from 1:1 to 4:5 (1080×1350).
  // v2 URLs (square aspect) would stretch/crop on the new portrait canvas, so
  // we force a regen at the new 4:5 aspect. Each style still caches independently.
  const cacheKey = `card_bg_url_v3_${style}`;
  let bgUrl: string | null = isPersistedUrl(row.signal[cacheKey]) ? row.signal[cacheKey] : null;

  if (!bgUrl && allowAi && isReplicateConfigured()) {
    // Stage 1: Claude writes the visual prompt with full occupation context.
    const promptResult = await buildVisualPrompt({
      signal:         String(row.signal.signal         ?? ""),
      signal_promise: String(row.signal.signal_promise ?? ""),
      element:        String(row.signal.element        ?? ""),
      central_tool:   String(row.signal.central_tool   ?? ""),
      occupation:     typeof userRow?.occupation === "string" ? userRow.occupation : null,
      style,
      aspect:         "4:5",
    });

    if (!promptResult.ok) {
      await supabase.from("error_logs").insert({
        context: "api/signal/[id]/share-card — visual prompter",
        error:   promptResult.error,
        payload: { extractionId: id, style },
      });
    } else {
      // Stage 2: Flux renders the scene from Claude's prompt at 4:5 portrait.
      const gen = await generateBackgroundImage(promptResult.prompt, "4:5");
      if (gen.ok) {
        // Re-host the ephemeral Replicate URL permanently before caching it.
        bgUrl = await persistBackground(supabase, gen.imageUrl, `${id}/${cacheKey}.png`);
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

  // Draft stamp: when the framing flag is on AND this signal read as a
  // high-confidence "raw", the card is a first version — stamp it "טיוטה" so it
  // isn't published as final from inside the pain. Mature/uncertain → no stamp.
  const isDraft = determineFraming(row.signal.routing_signal).suggestRefine;

  const { html, css } = buildHtml(cardText, bgUrl, clean, style, palette, isDraft);

  const result = await createHctiImage({
    html,
    css,
    googleFonts:    "Frank+Ruhl+Libre:wght@500;700|Heebo:wght@300;700|Assistant:wght@700",
    viewportWidth:  1080,
    viewportHeight: 1350,
    msDelay:        700,   // give the 2 webfonts + bee logo image time to load
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
