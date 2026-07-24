/**
 * /shoot-day-lab — Hadar-as-director prototype.
 *
 * Isolated route. Only accessible to emails in LAB_ALLOWED_EMAILS.
 * Everything the lab reads/writes lives under signal.lab in the user's
 * signal_extractions row. Production /kaveret, /hive/signal-kit, and the
 * broadcast room are untouched.
 */
import { redirect } from "next/navigation";
import { resolveLabUser } from "@/lib/lab/gate";
import { createServerClient } from "@/lib/supabase/server";
import { LAB_EPISODES } from "@/lib/lab/episodes";
import { ShootDayLabClient, type LabInitialData, type LabEpisodeState } from "./ShootDayLabClient";

export const dynamic = "force-dynamic";

export default async function ShootDayLabPage() {
  const user = await resolveLabUser();
  if (!user) redirect("/");

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ext } = await (db as any)
    .from("signal_extractions")
    .select("id, signal")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ext) {
    return (
      <main dir="rtl" style={{ padding: 40, fontFamily: "Assistant, system-ui" }}>
        <p>אין אצלך אות שמור. גש ל־<a href="/signal" style={{ color: "#C9964A" }}>/signal</a> קודם.</p>
      </main>
    );
  }

  const labState = (ext.signal?.lab ?? {}) as Record<string, unknown>;
  const episodes: LabEpisodeState[] = LAB_EPISODES.map((e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slot: any = (labState as any)[String(e.number)] ?? {};
    return {
      episode: e,
      questions:          Array.isArray(slot.questions) ? slot.questions : null,
      answers:            Array.isArray(slot.answers)   ? slot.answers   : null,
      script:             slot.script ?? null,
      move:               slot.move ?? null,
      critique:           slot.critique ?? null,
      questionsAt:        slot.questions_generated_at ?? null,
      scriptAt:           slot.script_generated_at ?? null,
    };
  });

  const initial: LabInitialData = {
    extractionId: ext.id,
    userName:     user.name,
    signalStatement: String(ext.signal?.signal ?? ""),
    signalPromise:   String(ext.signal?.signal_promise ?? ""),
    episodes,
  };

  return <ShootDayLabClient initial={initial} />;
}
