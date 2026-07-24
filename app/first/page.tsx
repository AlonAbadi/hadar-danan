/**
 * /first — acquisition first-video experience (prototype).
 *
 * Gated to LAB_ALLOWED_EMAILS during validation. Once Alon approves the
 * output pattern, open to real prospects.
 *
 * Hard contract (Alon 2026-07-24): every prospect entering /first MUST
 * already have a signal extraction. There is no signal-less path. If
 * the caller has no extraction, redirect to /signal to build one.
 */
import { redirect } from "next/navigation";
import { resolveLabUser } from "@/lib/lab/gate";
import { createServerClient } from "@/lib/supabase/server";
import { FirstClient } from "./FirstClient";

export const dynamic = "force-dynamic";

export default async function FirstPage() {
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

  if (!ext?.signal?.signal) {
    // No signal yet — the caller can't produce a first-video without an
    // extracted identity. Send them to build one.
    redirect("/signal");
  }

  return <FirstClient userName={user.name} />;
}
