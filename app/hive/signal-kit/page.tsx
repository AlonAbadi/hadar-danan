/**
 * /hive/signal-kit — folded into the kaveret (the unified member home).
 *
 * Every capability this hub had now lives on /kaveret (the designed assets
 * carousel absorbed the kit's visual controls). Old links keep working via
 * this redirect, including tab deep-links mapped to the kaveret's anchors.
 * The broadcast room stays at /hive/signal-kit/broadcast/* — its own
 * full-screen route, unaffected by this page.
 */
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TAB_TO_ANCHOR: Record<string, string> = {
  signal: "",
  challenge: "#z-challenge",
  visual: "#z-visual",
  shoot_day: "#z-filming",
  content: "#z-mine",
};

export default async function SignalKitPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect(`/kaveret${(tab && TAB_TO_ANCHOR[tab]) || ""}`);
}
