import { unifiedFunnelEnabled } from "@/lib/isolation";
import { ReadingClient } from "./ReadingClient";

// Hidden English unified funnel — the /en twin of /kriah. Same three
// isolation layers: flag / preview-secret gate, noindex, zero inbound links
// while hidden. While the launch flag is OFF, every run is stamped is_test.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Everyone makes content. Why would they choose you?",
  description:
    "When there is no clear answer to why you specifically, no content holds. Here we get to the root: the reason clients choose you. Free.",
  robots: { index: false, follow: false },
};

export default async function ReadingPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const sp = await searchParams;
  // Same decision as /kriah (2026-07-03): no secret wall, no cookie gate.
  // The page is unreachable organically while hidden — obscurity is the gate.
  // While the launch flag is OFF, every run is stamped is_test.
  const key = sp?.key ?? "";

  return (
    <ReadingClient
      previewKey={key}
      // During the hidden phase every run is a test run — the flag being off
      // means the only way in is the preview secret, i.e. a tester.
      isTest={!unifiedFunnelEnabled()}
    />
  );
}
