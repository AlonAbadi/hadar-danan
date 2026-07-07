// The member's PRIMARY extraction — the one member-facing surfaces bind to.
//
// "Latest" is the wrong rule: funnel re-runs and QA runs create newer, thinner
// extractions with no content kit, and the kit pages then dress raw inward
// diagnostic text up as outward social copy (field bug, 2026-07-07). The
// rule here: the newest COMPLETE extraction wins — complete meaning it has a
// written content kit; failing that, the newest one with a shoot-day plan;
// failing that, plain newest. Scoring reads only three tiny JSON pointers, so
// no full-signal rows are scanned (NANO compute).
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PrimaryExtractionRef {
  id: string;
  generated_at: string;
}

export async function pickPrimaryExtractionId(
  db: any,
  userId: string
): Promise<PrimaryExtractionRef | null> {
  const { data: rows } = await db
    .from("signal_extractions")
    .select(
      "id, generated_at, kit_bio:signal->content_kit->>bio_short, plan_first:signal->shoot_day->videos->0->>number, legacy_v1:signal->shoot_day_v1->>number"
    )
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(10);
  if (!rows?.length) return null;

  const hasKit = (r: any) => typeof r.kit_bio === "string" && r.kit_bio.trim().length > 0;
  const hasShootDay = (r: any) => r.plan_first != null || r.legacy_v1 != null;

  const winner = rows.find(hasKit) ?? rows.find(hasShootDay) ?? rows[0];
  return { id: winner.id, generated_at: winner.generated_at };
}
