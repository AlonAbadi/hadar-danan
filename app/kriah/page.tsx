import { notFound } from "next/navigation";
import { cookies } from "next/headers";
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
  // Tester convenience: one visit with ?key= plants a device cookie (set
  // client-side by KriahClient), and from then on a bare /kriah works on
  // that device. Everyone else still gets a 404 — the funnel stays hidden.
  const cookieStore = await cookies();
  const cookieKey = cookieStore.get("kriah_preview")?.value ?? "";
  const key = kriahPreviewAllowed(sp?.key) ? (sp?.key ?? "") : cookieKey;

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
