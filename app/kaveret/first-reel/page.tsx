/**
 * /kaveret/first-reel — the free first-reel experience.
 *
 * A diagnosed lead records video #1 of season 1 (15 seconds) with a
 * teleprompter-lite: front camera + their generated script, fully
 * client-side. Nothing is uploaded — the raw file stays on their device.
 * The contrast between this raw selfie and the polished member pipeline
 * (captions, cuts, the stamp) is the sales pitch for כוורת האות.
 *
 * Auth: the same signed kaveret token as /kaveret/i. Nav is hidden via
 * LayoutShell (full-screen camera surface, like the broadcast room).
 */
import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { FirstReelClient } from "./FirstReelClient";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080C14",
};

export default async function FirstReelPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  if (!process.env.FIRST_REEL_CAMERA_ENABLED) redirect("/kriah");
  const { t } = await searchParams;
  const extractionId = verifyKaveretToken(t);
  if (!extractionId || !t) redirect("/kriah");
  return <FirstReelClient extractionId={extractionId} token={t} />;
}
