import type { Metadata } from "next";
import { SignalExperience } from "./SignalExperience";

/**
 * /new/live — ISOLATED full-page prototype of the winning design concept
 * "קו האות · The Signal Line": one scroll-driven oscilloscope trace behind the
 * whole page that resolves from noise to signal. Touches nothing else. noindex.
 */
export const metadata: Metadata = {
  title: "האות החי",
  robots: { index: false, follow: false },
  alternates: {},
};

export default function LivePage() {
  return <SignalExperience />;
}
