/**
 * /en/kaveret — The Signal Hive member home, English edition.
 *
 * A focused port of the Hebrew /kaveret (app/kaveret/page.tsx): same gating,
 * same primary-extraction picker, same data plumbing — but only the zones the
 * English membership ships with: signal board, series shelf, episode scripts,
 * social texts, designed assets. The Hebrew challenge zone, live-meeting card
 * and chat are intentionally omitted.
 *
 * Gate chain is IDENTICAL to the Hebrew page: Supabase auth session → users
 * row by auth_id → hive_status === "active" (else /en/hive) → primary
 * extraction (else /en/reading). If the member's primary extraction happens to
 * be a Hebrew one (edge case), we still render whatever text is there.
 */
import { redirect } from "next/navigation";
import { SEASON_CAP_EN_FREE } from "@/lib/broadcast/season-cap";
import { cookies } from "next/headers";
import type { Metadata, Viewport } from "next";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { pickPrimaryExtractionId } from "@/lib/signal/primary-extraction";
import { collectShootDayVideos } from "@/lib/signal/shoot-day-slices";
import { HiveHomeClient, type HiveHomeData } from "./HiveHomeClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Hive",
  description: "The Signal Hive - your member home.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0C0A",
};

export default async function EnKaveretPage() {
  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
  if (!authUser) redirect("/en/login?next=/en/kaveret");

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (db as any)
    .from("users")
    .select("id, name, email, hive_status")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!userData) redirect("/account");
  if (userData.hive_status !== "active") redirect("/en/hive");

  const primary = await pickPrimaryExtractionId(db, userData.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ext } = primary
    ? await (db as any)
        .from("signal_extractions")
        .select("id, signal")
        .eq("id", primary.id)
        .maybeSingle()
    : { data: null };
  if (!ext) redirect("/en/reading");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signal = (ext.signal ?? {}) as any;
  const kit = signal.content_kit ?? {};
  const identity =
    signal.shoot_day?.identity_statement ??
    signal.shoot_day_phase1?.identity_statement ??
    signal.signal ??
    "";

  // Filming caps — same math as the Hebrew page. filmedNumbers = the set of
  // video_numbers with a ready edit; takesPerScript = non-failed edits per
  // video; seasonUsed = non-failed edits across the season. Server enforces
  // the same limits at /api/broadcast/takes — showing them here just saves
  // the member from starting a take that will fail on upload.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: readyEdits } = await (db as any)
    .from("broadcast_edits")
    .select("video_number, status")
    .eq("extraction_id", ext.id)
    .neq("status", "failed");
  const readyEditRows = (readyEdits ?? []) as { video_number: number; status: string }[];
  const filmedNumbers = Array.from(
    new Set(readyEditRows.filter((e) => e.status === "ready").map((e) => e.video_number))
  ) as number[];
  const takesPerScript: Record<number, number> = {};
  for (const e of readyEditRows) {
    takesPerScript[e.video_number] = (takesPerScript[e.video_number] ?? 0) + 1;
  }
  const seasonUsed = readyEditRows.length;
  // Episodes with an edit mid-pipeline (filmed, not yet ready) — the row must
  // read as "in the editing room", never as season-locked.
  const pendingNumbers = Array.from(
    new Set(readyEditRows.filter((e) => e.status !== "ready").map((e) => e.video_number))
  ) as number[];

  // Episode scripts: shoot_day.videos merged with the per-video slices
  // (v1..v7) — slices win on conflict, same stitch as the Hebrew page.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toScript = (v: any) => ({
    number: v.number,
    title: String(v.title ?? ""),
    hook: String(v.script?.hook ?? ""),
    body: String(v.script?.body ?? ""),
    cta: v.script?.cta ? String(v.script.cta) : "",
    interviewQuestions: Array.isArray(v.client_interview_questions)
      ? v.client_interview_questions.filter((q: unknown) => typeof q === "string" && q.length > 0)
      : undefined,
  });
  const scripts = collectShootDayVideos(signal).map(toScript);

  const data: HiveHomeData = {
    firstName: userData.name?.split(" ")[0] ?? "",
    // Signal board — raw signal fields. English extractions carry
    // element / signal_promise / central_tool / people; a Hebrew primary
    // extraction (edge case) renders whatever text exists.
    signal: String(signal.signal ?? ""),
    element: String(signal.element ?? ""),
    promise: String(signal.signal_promise ?? ""),
    tool: String(signal.central_tool ?? ""),
    people: String(signal.people ?? ""),
    // Outward-facing texts come ONLY from the content kit — the kit is the
    // translation layer from the inward diagnostic to audience-facing copy.
    bioInstagram: String(kit.bio_short ?? ""),
    linkedinHeadline: String(kit.linkedin_headline ?? ""),
    facebookAbout: String(kit.bio_medium ?? ""),
    aboutSite: String(kit.bio_long ?? ""),
    manifesto: String(kit.manifesto ?? ""),
    identity: String(identity),
    scripts,
    extractionId: ext.id,
    filmedNumbers,
    pendingNumbers,
    takesPerScript,
    seasonUsed,
    seasonCap: SEASON_CAP_EN_FREE,
    email: userData.email ?? "",
    takesCap: 3,
  };

  return <HiveHomeClient data={data} />;
}
