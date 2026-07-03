import { notFound } from "next/navigation";
import { unifiedFunnelEnabled, kriahPreviewAllowed } from "@/lib/isolation";
import { KriahClient } from "./KriahClient";

// Hidden v2 funnel (BUILD_SPEC_KRIAH_V2 §1). Three isolation layers:
// flag / preview-secret gate, noindex, robots DISALLOW. Zero inbound links.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "המשפט שכבר מבדל אתכם",
  robots: { index: false, follow: false },
};

export default async function KriahPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const sp = await searchParams;
  const key = sp?.key ?? "";

  if (!unifiedFunnelEnabled() && !kriahPreviewAllowed(key)) notFound();

  return (
    <KriahClient
      previewKey={key}
      // During the hidden phase every run is a test run — the flag being off
      // means the only way in is the preview secret, i.e. a tester.
      isTest={!unifiedFunnelEnabled()}
    />
  );
}
