// Season cap by plan. Hebrew members hold the paid כוורת האות package —
// seven episodes a season. English members are on the free launch model
// (2026-07-13, Alon): the first filmed episode is free, nothing is sold yet,
// so the cap is ONE — the paid tier comes later, slowly.
/* eslint-disable @typescript-eslint/no-explicit-any */

export const SEASON_CAP_HE = 7;
export const SEASON_CAP_EN_FREE = 1;

export async function seasonCapFor(db: any, extractionId: string): Promise<number> {
  try {
    const { data: ext } = await db
      .from("signal_extractions")
      .select("signal")
      .eq("id", extractionId)
      .maybeSingle();
    return ext?.signal?.language === "en" ? SEASON_CAP_EN_FREE : SEASON_CAP_HE;
  } catch {
    return SEASON_CAP_HE;
  }
}
