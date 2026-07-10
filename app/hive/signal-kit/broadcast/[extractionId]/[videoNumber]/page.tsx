/**
 * /hive/signal-kit/broadcast/[extractionId]/[videoNumber] — חדר השידור
 *
 * Full-viewport self-filming teleprompter room for one shoot-day script.
 * Gate mirrors /hive/signal-kit exactly, plus an OWNERSHIP check on the
 * extraction (the id arrives via the URL here, not via "latest") and script
 * existence for the requested video number.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Viewport } from "next";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { BroadcastRoomClient } from "./BroadcastRoomClient";
import { findShootDayVideo } from "@/lib/signal/shoot-day-slices";

export const dynamic = "force-dynamic";

// Camera room: lock the page scale. Without this, iOS Safari's double-tap /
// focus zoom leaves the user zoomed-in over the viewfinder with the
// teleprompter off-screen (first iPhone QA finding).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

interface ScriptShape {
  hook: string;
  body: string;
  cta?: string;
}

export default async function BroadcastRoomPage({
  params,
}: {
  params: Promise<{ extractionId: string; videoNumber: string }>;
}) {
  const { extractionId, videoNumber: videoNumberRaw } = await params;
  const videoNumber = Number(videoNumberRaw);
  const self = `/hive/signal-kit/broadcast/${extractionId}/${videoNumberRaw}`;

  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
  if (!authUser) redirect(`/login?next=${encodeURIComponent(self)}`);

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (db as any)
    .from("users")
    .select("id, name, hive_status, gender")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (!userData) redirect("/account");
  if (userData.hive_status !== "active") redirect("/hive");
  if (!Number.isInteger(videoNumber) || videoNumber < 1 || videoNumber > 12) {
    redirect("/hive/signal-kit");
  }

  // Ownership + script resolution from the JSONB plan.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, user_id, signal")
    .eq("id", extractionId)
    .maybeSingle();
  if (!ext || ext.user_id !== userData.id) redirect("/hive/signal-kit");

  // Per-video slices land as JSON strings via signal_merge_field, plan
  // videos land as objects. findShootDayVideo hides the shape difference —
  // without it (Alon 2026-07-11), tapping לצלם עכשיו on any generated
  // video 2-7 redirected here → back to /hive/signal-kit → back to /kaveret.
  const video = findShootDayVideo(ext.signal, videoNumber);
  if (!video?.script?.hook) redirect("/kaveret");

  const script: ScriptShape = {
    hook: String(video.script.hook),
    body: String(video.script.body ?? ""),
    cta: video.script.cta ? String(video.script.cta) : undefined,
  };

  return (
    <BroadcastRoomClient
      extractionId={extractionId}
      videoNumber={videoNumber}
      videoTitle={String(video.title ?? "")}
      script={script}
      firstName={userData.name?.split(" ")[0] ?? ""}
      gender={userData.gender === "m" ? "m" : userData.gender === "f" ? "f" : null}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
    />
  );
}
