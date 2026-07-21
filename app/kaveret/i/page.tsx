/**
 * /kaveret/i — the visitor (locked) state of the kaveret.
 *
 * A lead lands here from the diagnostic result or from an email, carrying a
 * signed token (?t=<extractionId.hmac>) — no auth account needed. Unlike the
 * member home at /kaveret (immersive, own tab bar), this page keeps the full
 * site chrome: the standard nav renders via LayoutShell, and the standard
 * site footer renders below the offer.
 */
import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { CHALLENGE_DAYS } from "@/lib/challenge-config";
import { verifyKaveretToken } from "@/lib/signal/kaveret-token";
import { readResultTeasers } from "@/lib/signal/result-teasers";
import { KaveretVisitorClient, type VisitorData } from "../KaveretVisitorClient";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080C14",
};

// Sensitive routings (crisis endings / money distress) get the warm path
// with no sale layer at all.
async function buildVisitorData(extractionId: string, token: string): Promise<VisitorData | null> {
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
  const offer: VisitorData["offer"] = sensitive
    ? "sensitive"
    : ext.bucket === "strategy"
      ? "strategy"
      : "hive";

  const day0 = CHALLENGE_DAYS.find((d) => d.day === 0);
  const g = ext.gender ?? leadUser?.gender;

  return {
    firstName: leadUser?.name?.split(" ")[0] ?? "",
    gender: g === "m" ? "m" : g === "f" ? "f" : null,
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
    day0VideoId: day0?.videoId ?? "1185862328",
    waPhone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "972539566961",
    token,
    firstReelEnabled: Boolean(process.env.FIRST_REEL_CAMERA_ENABLED),
  };
}

export default async function KaveretVisitorPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const extractionId = verifyKaveretToken(t);
  if (!extractionId) redirect("/kriah");
  const visitor = await buildVisitorData(extractionId, t!);
  if (!visitor) redirect("/kriah");
  return <KaveretVisitorClient data={visitor} />;
}
