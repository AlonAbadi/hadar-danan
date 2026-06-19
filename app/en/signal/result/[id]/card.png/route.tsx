import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { validateSignalOutputEn } from "@/lib/prompts/signal-engine-en";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Plus Jakarta Sans Italic 500 - fetched once per warm instance from Google
// Fonts CSS API. NO User-Agent so Google returns truetype (satori can't
// decode woff2).
let cachedJakartaItalic: ArrayBuffer | null = null;
async function loadJakartaItalic(): Promise<ArrayBuffer | null> {
  if (cachedJakartaItalic) return cachedJakartaItalic;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@1,500&display=swap",
      { headers: {} }
    ).then((r) => r.text());
    const match = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)\s*format\('truetype'\)/);
    if (!match) return null;
    const fontData = await fetch(match[1]).then((r) => r.arrayBuffer());
    cachedJakartaItalic = fontData;
    return fontData;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from("signal_extractions")
    .select("signal")
    .eq("id", id)
    .maybeSingle();

  if (!data?.signal || !validateSignalOutputEn(data.signal)) {
    return new Response("Not found", { status: 404 });
  }

  const cardText: string = data.signal.public_card_statement;

  let beeDataUri: string | null = null;
  try {
    const beeBuf = await fs.readFile(path.join(process.cwd(), "public", "beegood_logo.png"));
    beeDataUri = `data:image/png;base64,${beeBuf.toString("base64")}`;
  } catch {}

  const jakartaItalic = await loadJakartaItalic();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "90px 100px",
          background: "#0D0C0A",
          color: "#F2EDE4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {beeDataUri && (
            <img src={beeDataUri} width={70} height={56} alt="" style={{ display: "block", height: 56, width: "auto" }} />
          )}
          <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", display: "flex", color: "#F2EDE4" }}>
            beegood
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ width: 42, height: 1, background: "#C2973F" }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#C2973F",
              fontWeight: 700,
              display: "flex",
            }}
          >
            TrueSignal©
          </div>
          <div
            style={{
              fontSize: 58,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              color: "#F2EDE4",
              fontFamily: jakartaItalic ? "Jakarta" : "Georgia, serif",
              fontStyle: "italic",
              display: "flex",
            }}
          >
            {cardText}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            letterSpacing: 1.5,
            color: "rgba(242,237,228,0.48)",
          }}
        >
          <div style={{ display: "flex" }}>beegood.online/en</div>
          <div style={{ width: 60, height: 1, background: "#C2973F" }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      fonts: jakartaItalic
        ? [
            {
              name: "Jakarta",
              data: jakartaItalic,
              style: "italic" as const,
              weight: 500 as const,
            },
          ]
        : undefined,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
