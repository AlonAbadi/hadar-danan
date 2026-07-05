import { unifiedFunnelEnabled } from "@/lib/isolation";
import { KriahClient } from "./KriahClient";

// Hidden v2 funnel (BUILD_SPEC_KRIAH_V2 §1). Three isolation layers:
// flag / preview-secret gate, noindex, robots DISALLOW. Zero inbound links.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "הסיבה שבוחרים דווקא בכם",
  description: "הסיבה שלקוחות בוחרים דווקא בכם כבר קיימת. כאן מגלים אותה, מהמילים שלכם. חינם, מתחילים בשלוש שאלות קצרות.",
};

export default async function KriahPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const sp = await searchParams;
  // Alon's decision (2026-07-03): no secret, no cookie. The page is unreachable
  // organically (zero inbound links, noindex, robots DISALLOW) — obscurity is
  // the gate. While the launch flag is OFF, every run is stamped is_test and
  // lands in the dedicated /admin/kriah/tests list.
  const key = sp?.key ?? "";

  return (
    <KriahClient
      previewKey={key}
      // During the hidden phase every run is a test run — the flag being off
      // means the only way in is the preview secret, i.e. a tester.
      isTest={!unifiedFunnelEnabled()}
    />
  );
}
