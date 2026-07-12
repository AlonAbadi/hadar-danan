// /en/hive/success — the Cardcom SuccessRedirectUrl for signal_hive_en_149
// (see app/api/checkout/route.ts). Server wrapper for metadata; the tracking
// and UI live in the English client (components/SuccessPage is Hebrew/ILS-
// hardcoded, so the EN page is built inline).
import type { Metadata } from "next";
import { SuccessEnClient } from "./SuccessEnClient";

export const metadata: Metadata = {
  title: "Welcome to The Signal Hive",
  robots: { index: false, follow: false },
};

export default function EnHiveSuccessPage() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "972539566961";
  return <SuccessEnClient whatsappPhone={wa} />;
}
