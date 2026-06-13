import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";
import { createServerClient } from "@/lib/supabase/server";
import { validateSignalOutputEn } from "@/lib/prompts/signal-engine-en";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
          background: "#F4EFE4",
          color: "#211B12",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#111113",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {beeDataUri && (
              <img src={beeDataUri} width={36} height={36} alt="" style={{ display: "block" }} />
            )}
          </div>
          <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", display: "flex" }}>
            beegood
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ width: 42, height: 1, background: "#BE9540" }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#6F521A",
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
              color: "#211B12",
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
            color: "#988D7B",
          }}
        >
          <div style={{ display: "flex" }}>beegood.online/en</div>
          <div style={{ width: 60, height: 1, background: "#BE9540" }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
