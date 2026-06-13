import type { Metadata } from "next";
import { SignalEnClient } from "./SignalEnClient";

export const metadata: Metadata = {
  title: "TrueSignal© diagnostic",
  description:
    "Five questions reveal the one signal that is yours alone. Around ten minutes. Free.",
  alternates: { canonical: "/en/signal" },
};

export default function EnSignalPage() {
  return <SignalEnClient />;
}
