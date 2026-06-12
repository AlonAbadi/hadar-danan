/**
 * GET /api/admin/meta/preview/[adId]?format=INSTAGRAM_STANDARD
 *
 * Server-side proxy to Meta's official ad-preview iframe — the same renderer
 * Ads Manager uses. Returns a tiny HTML document containing an iframe pointed
 * at Meta's preview_iframe URL, so the access_token never reaches the client.
 *
 * Supported formats (passed through to Meta verbatim):
 *   INSTAGRAM_STANDARD    — 1:1 feed square (default)
 *   INSTAGRAM_STORY       — 9:16 stories
 *   INSTAGRAM_REELS       — 9:16 reels
 *   MOBILE_FEED_STANDARD  — Facebook mobile feed
 *   DESKTOP_FEED_STANDARD — Facebook desktop feed
 *
 * The card on /admin/meta embeds this endpoint via <iframe src="...">, so
 * what the operator sees is exactly what end-users see on Instagram/Facebook —
 * not a low-res thumbnail upscaled into a giant pixelated mess.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

const API_VERSION = "v19.0";

const ALLOWED_FORMATS = new Set([
  "INSTAGRAM_STANDARD",
  "INSTAGRAM_STORY",
  "INSTAGRAM_REELS",
  "MOBILE_FEED_STANDARD",
  "DESKTOP_FEED_STANDARD",
]);

function metaToken(): string | null {
  return process.env.META_ADS_ACCESS_TOKEN || process.env.META_CAPI_TOKEN || null;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function frameDoc(innerHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:#0A0E16;width:100%;height:100%;overflow:hidden}
    body{display:flex;align-items:center;justify-content:center}
    iframe{border:0;width:100%;height:100%;display:block}
    .msg{color:#AAB0BD;font-family:system-ui;font-size:13px;text-align:center;padding:24px}
  </style></head><body>${innerHtml}</body></html>`;
}

function errorDoc(label: string): NextResponse {
  return new NextResponse(
    frameDoc(`<div class="msg">${escapeHtml(label)}</div>`),
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adId: string }> },
) {
  const { adId } = await params;
  if (!adId) return errorDoc("missing adId");

  const token = metaToken();
  if (!token) return errorDoc("Meta token not configured");

  const requestedFormat = req.nextUrl.searchParams.get("format") || "INSTAGRAM_STANDARD";
  const format = ALLOWED_FORMATS.has(requestedFormat) ? requestedFormat : "INSTAGRAM_STANDARD";

  let metaJson: { data?: Array<{ body?: string }> } | null = null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${encodeURIComponent(adId)}/previews?ad_format=${format}&access_token=${token}`,
      // Cache for 1 hour at the Meta layer — previews don't change often. The
      // outer NextResponse cache-control below controls browser/CDN caching.
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return errorDoc(`Meta API ${res.status}: ${detail.slice(0, 200)}`);
    }
    metaJson = await res.json();
  } catch (e) {
    return errorDoc(`Network error: ${String(e).slice(0, 200)}`);
  }

  const body = metaJson?.data?.[0]?.body;
  if (typeof body !== "string" || body.length === 0) {
    return errorDoc("Meta returned no preview body");
  }

  // Meta's body is itself an iframe element. Extract the src attribute and
  // re-emit a clean iframe in our own minimal wrapper, so styling is
  // consistent with the rest of the admin UI.
  const srcMatch = body.match(/src\s*=\s*"([^"]+)"/);
  if (!srcMatch) {
    return errorDoc("could not extract preview iframe src");
  }
  const iframeSrc = srcMatch[1].replace(/&amp;/g, "&");

  const html = frameDoc(`<iframe src="${escapeHtml(iframeSrc)}" allow="autoplay" referrerpolicy="no-referrer"></iframe>`);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type":  "text/html; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
      // Allow this endpoint to be iframed from the same origin (admin pages)
      "x-frame-options": "SAMEORIGIN",
    },
  });
}
