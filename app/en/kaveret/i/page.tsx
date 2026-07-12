/**
 * /en/kaveret/i — the English visitor (locked) state of the kaveret.
 *
 * A lead lands here from the English reading result or from an email,
 * carrying a signed token (?t=<extractionId.hmac>) — no auth account needed.
 * Mirrors the Hebrew /kaveret/i data build (same tables, same fields); the
 * offer routing is the English one:
 *   sensitive — distress_money or crisis/crisis_soft ending → warm path, no sale
 *   concierge — routed_ending "concierge" → working-session framing
 *   hive      — everyone else → The Signal Hive at $149
 */
import { redirect } from "next/navigation";
import type { Metadata, Viewport } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { readResultTeasers } from "@/lib/signal/result-teasers";
import { KaveretVisitorClientEn, type VisitorDataEn } from "../KaveretVisitorClientEn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your signal, saved",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0C0A",
};

// Sensitive routings (crisis endings / money distress) get the warm path
// with no sale layer at all.
async function buildVisitorData(extractionId: string, token: string): Promise<VisitorDataEn | null> {
  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, user_id, signal, bucket, gender, routed_ending, distress_money")
    .eq("id", extractionId)
    .maybeSingle();
  if (!ext?.signal?.signal) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leadUser } = ext.user_id
    ? await (db as any).from("users").select("name, gender").eq("id", ext.user_id).maybeSingle()
    : { data: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sig = ext.signal as any;
  const sensitive =
    ext.distress_money === true ||
    ext.routed_ending === "crisis" ||
    ext.routed_ending === "crisis_soft";
  const offer: VisitorDataEn["offer"] = sensitive
    ? "sensitive"
    : ext.routed_ending === "concierge"
      ? "concierge"
      : "hive";

  return {
    firstName: leadUser?.name?.split(" ")[0] ?? "",
    signalText: String(sig.signal),
    element: String(sig.element ?? ""),
    promise: String(sig.signal_promise ?? ""),
    tool: String(sig.central_tool ?? ""),
    people: String(sig.people ?? ""),
    directions: Array.isArray(sig.content_directions) ? sig.content_directions.map(String) : [],
    publicSentence: readResultTeasers(sig).public_sentence ?? null,
    firstScriptHook: readResultTeasers(sig).first_script_hook ?? null,
    extractionId: ext.id,
    offer,
    waPhone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "972539566961",
    token,
  };
}

export default async function KaveretVisitorPageEn({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const extractionId = verifyKaveretToken(t);
  if (!extractionId) redirect("/en/reading");
  const visitor = await buildVisitorData(extractionId, t!);
  if (!visitor) redirect("/en/reading");
  return <KaveretVisitorClientEn data={visitor} />;
}
