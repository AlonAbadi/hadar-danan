/**
 * GET /api/signal/[id]/share-card
 *
 * Returns a 1080×1350 PNG (IG portrait / feed + story crop) of the
 * signal sentence styled in the brand palette. Used by ShareButton via
 * navigator.share() to send to WhatsApp / IG / Camera Roll, and doubles
 * as the Open Graph image if someone shares the result URL directly.
 *
 * Edge runtime — `next/og` ImageResponse renders the JSX into a PNG with
 * minimal cold-start cost. Public (UUIDs are unguessable; share-cards are
 * by definition meant to be shared).
 *
 * Hebrew fonts: we fetch the Assistant woff2 from Google Fonts via the
 * server-side UA workaround. Falls back to the default Noto Sans if the
 * font fetch fails — text still renders, just with a less branded look.
 */
import { ImageResponse } from "next/og";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // needs supabase server client + service role
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const W = 1080;
const H = 1350;

// Fetch the Assistant Bold woff2 from Google Fonts. The CSS endpoint
// returns different font formats based on User-Agent — we ask for a UA
// that gets woff2 with Hebrew subset.
async function loadAssistantBold(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Assistant:wght@700&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } },
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    // Pick the latin subset for safety — it's the last @font-face block and
    // Google Fonts uses overlapping subsets that cover Hebrew when set
    // unicode-range covers Hebrew chars. We grab the FIRST woff2 url.
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return new Response("missing id", { status: 400 });
  }

  // ── Fetch the signal ────────────────────────────────────────────────────
  const supabase = createServerClient();
  const { data: row } = await safeFrom(supabase, "signal_extractions")
    .select("signal")
    .eq("id", id)
    .maybeSingle();

  if (!row?.signal?.signal) {
    return new Response("signal not found", { status: 404 });
  }
  const sentence = String(row.signal.signal);

  // ── Load Hebrew font (best-effort) ──────────────────────────────────────
  const fontData = await loadAssistantBold();
  const fonts = fontData
    ? [{ name: "Assistant", data: fontData, weight: 700 as const, style: "normal" as const }]
    : undefined;

  // ── Render ──────────────────────────────────────────────────────────────
  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: "#080C14",
          color: "#EDE9E1",
          position: "relative",
          fontFamily: "Assistant, sans-serif",
        }}
      >
        {/* Ambient gold radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 1400,
            height: 900,
            background:
              "radial-gradient(ellipse at center, rgba(232,185,74,0.18) 0%, rgba(232,185,74,0.06) 35%, transparent 70%)",
          }}
        />

        {/* Top brand strip */}
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 24,
            letterSpacing: 4,
            color: "#C9964A",
            fontWeight: 700,
          }}
        >
          TRUESIGNAL©
        </div>

        {/* Center stage — the signal sentence */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 60,
            right: 60,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {/* "האות" small marker */}
          <div
            style={{
              fontSize: 22,
              letterSpacing: 3,
              color: "#C9964A",
              marginBottom: 36,
              fontWeight: 700,
            }}
          >
            ה א ו ת
          </div>

          {/* The sentence */}
          <div
            style={{
              fontSize: sentence.length > 140 ? 50 : 62,
              fontWeight: 700,
              lineHeight: 1.32,
              color: "#EDE9E1",
              textAlign: "center",
              direction: "rtl",
              maxWidth: 920,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {sentence}
          </div>

          {/* Subtle gold divider */}
          <div
            style={{
              width: 72,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #C9964A, transparent)",
              marginTop: 56,
            }}
          />
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 72,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 28,
            color: "#C9964A",
            letterSpacing: 1,
            fontWeight: 700,
          }}
        >
          beegood.online
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts,
      headers: {
        // Cache aggressively — the signal for a given id is immutable
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    },
  );
}
