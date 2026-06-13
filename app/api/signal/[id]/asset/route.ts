/**
 * GET /api/signal/[id]/asset?type=<asset>&clean=1&style=<style>
 *
 * Multi-format Hive asset generator. Beyond the standard 1080×1080
 * share-card (/share-card), this endpoint produces:
 *
 *   linkedin-banner  1584×396  — header image for LinkedIn profile
 *   instagram-story  1080×1920 — 9:16 vertical for IG/WhatsApp stories
 *   quote-promise    1080×1080 — quote card featuring signal_promise
 *   quote-people     1080×1080 — quote card featuring the people field
 *   quote-content-1  1080×1080 — quote card featuring content_directions[0]
 *   quote-content-2  1080×1080 — quote card featuring content_directions[1]
 *   quote-content-3  1080×1080 — quote card featuring content_directions[2]
 *
 * Each asset gets its own Flux background generation (via the same prompter
 * as the main share-card) and HCTI text overlay, with the appropriate
 * aspect ratio and typographic layout for the format.
 *
 * Backgrounds are cached per (extraction, type, style) on
 * signal.asset_bg_url_<type>_<style>.
 *
 * Gated to hive_status='active' (with ?force_ai=1 escape hatch for QA).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createHctiImage, isHctiConfigured } from "@/lib/htmlcsstoimage";
import { isReplicateConfigured, generateBackgroundImage, type FluxAspectRatio } from "@/lib/replicate";
import { buildVisualPrompt, isValidStyle, DEFAULT_STYLE, type VisualStyle } from "@/lib/signal-visual-prompter";
import { writeCardText, needsCardWriter } from "@/lib/signal-card-writer";

// Per-style overlay. v2: very light tint only. White text legibility is owned
// by the multi-layer text-shadow on .signal — the overlay is just for visual
// unification, not for hiding the photo. For banners (horizontal), the text
// sits on the right so the tint runs right→left and softens that side only.
function overlayGradient(style: VisualStyle, isBanner: boolean): string {
  if (style === "luminous") {
    if (isBanner) {
      return `linear-gradient(
        to right,
        rgba(8,12,20,0.45) 0%,
        rgba(8,12,20,0.18) 55%,
        rgba(8,12,20,0.00) 100%
      )`;
    }
    return `linear-gradient(
      to bottom,
      rgba(8,12,20,0.00) 0%,
      rgba(8,12,20,0.05) 55%,
      rgba(8,12,20,0.20) 100%
    )`;
  }
  if (isBanner) {
    return `linear-gradient(
      to right,
      rgba(8,12,20,0.62) 0%,
      rgba(8,12,20,0.28) 55%,
      rgba(8,12,20,0.08) 100%
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
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

type AssetType =
  | "linkedin-banner"
  | "instagram-story"
  | "quote-promise"
  | "quote-people"
  | "quote-content-1"
  | "quote-content-2"
  | "quote-content-3";

interface AssetSpec {
  width:    number;
  height:   number;
  aspect:   FluxAspectRatio;
  fieldFor: (signal: Record<string, unknown>) => string;
}

const ASSET_SPECS: Record<AssetType, AssetSpec> = {
  "linkedin-banner": {
    width: 1584, height: 396, aspect: "16:9",
    fieldFor: (s) => String(s.public_card_statement ?? s.signal ?? ""),
  },
  "instagram-story": {
    width: 1080, height: 1920, aspect: "9:16",
    fieldFor: (s) => String(s.public_card_statement ?? s.signal ?? ""),
  },
  "quote-promise": {
    width: 1080, height: 1080, aspect: "1:1",
    fieldFor: (s) => String(s.signal_promise ?? ""),
  },
  "quote-people": {
    width: 1080, height: 1080, aspect: "1:1",
    fieldFor: (s) => String(s.people ?? ""),
  },
  "quote-content-1": {
    width: 1080, height: 1080, aspect: "1:1",
    fieldFor: (s) => Array.isArray(s.content_directions) && s.content_directions[0] ? String(s.content_directions[0]) : "",
  },
  "quote-content-2": {
    width: 1080, height: 1080, aspect: "1:1",
    fieldFor: (s) => Array.isArray(s.content_directions) && s.content_directions[1] ? String(s.content_directions[1]) : "",
  },
  "quote-content-3": {
    width: 1080, height: 1080, aspect: "1:1",
    fieldFor: (s) => Array.isArray(s.content_directions) && s.content_directions[2] ? String(s.content_directions[2]) : "",
  },
};

function isValidAssetType(s: string): s is AssetType {
  return s in ASSET_SPECS;
}

function fontSizeFor(text: string, baseWidth: number): number {
  // Scale a 1080-tuned font ladder to the asset width so banners scale down nicely
  const scale = baseWidth / 1080;
  const len = text.length;
  let base: number;
  if (len < 70)  base = 56;
  else if (len < 110) base = 48;
  else if (len < 160) base = 42;
  else if (len < 220) base = 36;
  else                base = 32;
  return Math.round(base * scale);
}

function buildHtml(args: {
  text:    string;
  bgUrl:   string | null;
  clean:   boolean;
  width:   number;
  height:  number;
  type:    AssetType;
  style:   VisualStyle;
}): { html: string; css: string } {
  const isBanner = args.type === "linkedin-banner";
  const isStory  = args.type === "instagram-story";

  const fontSize = fontSizeFor(args.text, args.width);

  const bgLayer = args.bgUrl
    ? `<div class="bg" style="background-image:url('${esc(args.bgUrl)}');"></div>
       <div class="bg-overlay"></div>`
    : "";

  const brandingBlock = args.clean ? "" : (isBanner ? `
  <div class="footer-banner">beegood.online · <span dir="ltr" style="unicode-bidi:embed">TrueSignal©</span></div>
` : `
  <img class="bee" src="https://www.beegood.online/beegood_logo.png" alt="" />
  <div class="divider"></div>
  <div class="attribution">התגלה באמצעות שיטת <span dir="ltr" style="unicode-bidi:embed">TrueSignal©</span></div>
  <div class="footer">beegood.online</div>`);

  // For banners the accent line would compete with the asymmetric right-aligned
  // text, so we omit it there. Square + story formats get the gold divider.
  const accentLine = isBanner ? "" : `<div class="accent-line"></div>`;

  const html = `
<div class="card">
  ${bgLayer}
  <div class="glow"></div>${brandingBlock}
  <div class="signal-wrap">
    ${accentLine}
    <div class="signal" style="font-size:${fontSize}px;">${esc(args.text)}</div>
  </div>
</div>`;

  // Layout per format
  const beeTop      = isStory ? 140 : 100;
  const dividerBot  = isStory ? 280 : 180;
  const attrBot     = isStory ? 220 : 135;
  const footerBot   = isStory ? 140 : 85;
  const signalLeft  = isBanner ? 60 : 80;
  const signalRight = isBanner ? 60 : 80;

  const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { margin: 0; padding: 0; }

.card {
  width: ${args.width}px;
  height: ${args.height}px;
  background: #080C14;
  position: relative;
  font-family: 'Assistant', 'Heebo', system-ui, sans-serif;
  overflow: hidden;
  direction: rtl;
}

.bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center; background-repeat: no-repeat;
  z-index: 0;
}

.bg-overlay {
  position: absolute; inset: 0;
  background: ${overlayGradient(args.style, isBanner)};
  z-index: 1;
}

.glow {
  position: absolute; top: -25%; left: 50%;
  transform: translateX(-50%);
  width: 150%; height: 90%;
  background: radial-gradient(ellipse at center, rgba(232,185,74,0.20) 0%, rgba(232,185,74,0.08) 35%, transparent 70%);
  z-index: 2;
}

.bee {
  position: absolute; top: ${beeTop}px; left: 50%;
  transform: translateX(-50%);
  width: ${isStory ? 80 : 72}px; height: auto;
  z-index: 3;
  opacity: 0.95;
  filter: drop-shadow(0 0 32px rgba(232,185,74,0.35));
}

.signal-wrap {
  position: absolute; top: 50%;
  left: ${signalLeft}px; right: ${signalRight}px;
  transform: translateY(-50%);
  text-align: ${isBanner ? "right" : "center"};
  direction: rtl;
  z-index: 3;
}

.accent-line {
  width: ${isStory ? 72 : 56}px;
  height: 2px;
  margin: 0 auto ${isStory ? 40 : 32}px;
  background: linear-gradient(90deg, transparent, #E8B94A, transparent);
  opacity: 0.85;
}

/* Premium typography — multi-layer text-shadow guarantees legibility on ANY
   background, so we can keep the overlay very light and let the photo breathe. */
.signal {
  font-weight: 700;
  color: #FFFFFF;
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
  position: absolute; bottom: ${dividerBot}px; left: 50%;
  transform: translateX(-50%);
  width: 56px; height: 1px;
  background: linear-gradient(90deg, transparent, #C9964A, transparent);
  opacity: 0.7;
  z-index: 3;
}

.attribution {
  position: absolute; bottom: ${attrBot}px; left: 0; right: 0;
  text-align: center;
  font-size: ${isStory ? 22 : 18}px; font-weight: 500;
  color: #C9964A; opacity: 0.72;
  direction: rtl; letter-spacing: 0.6px;
  z-index: 3;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

.footer {
  position: absolute; bottom: ${footerBot}px; left: 0; right: 0;
  text-align: center;
  font-size: ${isStory ? 26 : 22}px; font-weight: 700;
  letter-spacing: 1.2px; color: #C9964A;
  z-index: 3;
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

.footer-banner {
  position: absolute; bottom: 28px; right: 60px;
  font-size: 18px; font-weight: 600;
  color: #C9964A; opacity: 0.82; letter-spacing: 0.5px;
  direction: rtl;
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
    return new NextResponse("asset disabled", { status: 503 });
  }

  const typeParam = req.nextUrl.searchParams.get("type") ?? "";
  if (!isValidAssetType(typeParam)) {
    return new NextResponse(`unknown type '${typeParam}'`, { status: 400 });
  }
  const styleParam = req.nextUrl.searchParams.get("style") ?? "";
  const style: VisualStyle = isValidStyle(styleParam) ? styleParam : DEFAULT_STYLE;
  const cleanParam = req.nextUrl.searchParams.get("clean") === "1";
  const forceAi    = req.nextUrl.searchParams.get("force_ai") === "1";

  const supabase = createServerClient();

  const { data: row } = await safeFrom(supabase, "signal_extractions")
    .select("signal, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!row?.signal?.signal) return new NextResponse("signal not found", { status: 404 });

  const spec = ASSET_SPECS[typeParam];
  const sourceText = spec.fieldFor(row.signal).trim();
  if (sourceText.length === 0) {
    return new NextResponse(`asset type '${typeParam}' has no source field on this signal`, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (supabase as any)
    .from("users")
    .select("hive_status, occupation")
    .eq("id", row.user_id)
    .maybeSingle();

  const isHive  = userRow?.hive_status === "active";
  const allowAi    = forceAi || isHive;
  const allowClean = forceAi || isHive;
  const clean      = cleanParam && allowClean;

  if (!allowAi) {
    return new NextResponse("Asset library is a Hive perk", { status: 403 });
  }

  // ── Card text resolution ──────────────────────────────────────────────
  // For quote-* card types, the source field is an internal meta description
  // ("האות שלך מצביע אל...", "פוסט על...") that reads like a description of
  // the card instead of the card's message. We run those through the card
  // writer to convert them into finished audience-facing copy, cached on the
  // signal JSONB so each (extraction, type) pair pays for one Haiku call.
  // For share-card-default / linkedin-banner / instagram-story the source is
  // already public_card_statement (audience-facing) so we use it directly.
  let text: string;
  if (needsCardWriter(typeParam)) {
    const textCacheKey = `card_text_v1_${typeParam}`;
    const cachedText = typeof row.signal[textCacheKey] === "string" && row.signal[textCacheKey].length > 0
      ? (row.signal[textCacheKey] as string)
      : null;

    if (cachedText) {
      text = cachedText;
    } else {
      const occupation = typeof userRow?.occupation === "string" ? userRow.occupation : null;
      const writeResult = await writeCardText({
        type:       typeParam,
        sourceText,
        signal:     String(row.signal.signal ?? ""),
        occupation,
      });

      if (writeResult.ok) {
        text = writeResult.text;
        const updatedSignal = { ...row.signal, [textCacheKey]: text };
        await safeFrom(supabase, "signal_extractions")
          .update({ signal: updatedSignal })
          .eq("id", id);
      } else {
        await supabase.from("error_logs").insert({
          context: "api/signal/[id]/asset — card writer",
          error:   writeResult.error,
          payload: { extractionId: id, type: typeParam },
        });
        // Soft fallback: render with the meta source so the card still works.
        text = sourceText;
      }
    }
  } else {
    text = sourceText;
  }

  // ── Background generation (per-type, per-style cache) ──────────────
  // v2 cache key — bumped when we moved to Flux 1.1 Pro Ultra + rewritten
  // prompter + lighter overlay. v1 URLs in the JSONB stop being read.
  const cacheKey = `asset_bg_url_v2_${typeParam}_${style}`;
  let bgUrl: string | null =
    typeof row.signal[cacheKey] === "string" && row.signal[cacheKey].startsWith("http")
      ? row.signal[cacheKey]
      : null;

  if (!bgUrl && isReplicateConfigured()) {
    const promptResult = await buildVisualPrompt({
      signal:         String(row.signal.signal         ?? ""),
      signal_promise: String(row.signal.signal_promise ?? ""),
      element:        String(row.signal.element        ?? ""),
      central_tool:   String(row.signal.central_tool   ?? ""),
      occupation:     typeof userRow?.occupation === "string" ? userRow.occupation : null,
      style,
    });

    if (promptResult.ok) {
      const gen = await generateBackgroundImage(promptResult.prompt, spec.aspect);
      if (gen.ok) {
        bgUrl = gen.imageUrl;
        const updatedSignal = { ...row.signal, [cacheKey]: bgUrl };
        await safeFrom(supabase, "signal_extractions")
          .update({ signal: updatedSignal })
          .eq("id", id);
      } else {
        await supabase.from("error_logs").insert({
          context: "api/signal/[id]/asset — Replicate gen",
          error:   gen.error,
          payload: { extractionId: id, type: typeParam, style },
        });
      }
    } else {
      await supabase.from("error_logs").insert({
        context: "api/signal/[id]/asset — visual prompter",
        error:   promptResult.error,
        payload: { extractionId: id, type: typeParam, style },
      });
    }
  }

  const { html, css } = buildHtml({
    text, bgUrl, clean,
    width: spec.width, height: spec.height,
    type: typeParam,
    style,
  });

  const result = await createHctiImage({
    html, css,
    googleFonts:    "Assistant:wght@700",
    viewportWidth:  spec.width,
    viewportHeight: spec.height,
    msDelay:        600,
  });
  if (!result.ok) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/asset — HCTI",
      error:   result.error,
      payload: { extractionId: id, type: typeParam, status: result.status },
    });
    return new NextResponse("render failed", { status: 502 });
  }

  let imgRes: Response;
  try {
    imgRes = await fetch(result.imageUrl);
  } catch (e) {
    await supabase.from("error_logs").insert({
      context: "api/signal/[id]/asset — fetch upstream",
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
      "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
      "content-disposition": `inline; filename="${typeParam}-${id.slice(0, 8)}.png"`,
    },
  });
}
