// Season cap by plan. Hebrew members hold the paid כוורת האות package —
// seven episodes a season. English members are on the free launch model
// (2026-07-13, Alon): the first filmed episode is free, nothing is sold yet,
// so the cap is ONE — the paid tier comes later, slowly.
/* eslint-disable @typescript-eslint/no-explicit-any */

export const SEASON_CAP_HE = 7;
export const SEASON_CAP_EN_FREE = 1;

// Per-extraction grant (signal.season_cap_override, a number): opens a full
// season for a specific member — team filming, gifts, early access, or the
// lifetime tier (2026-07-22) — without touching the plan defaults. Set via
// the merge_signal RPC or a direct signal update. Values above the paid
// cap are trusted — that's the whole point of the override, and it can
// only be set server-side or by admin scripts.
export const LIFETIME_SEASON_CAP = 999;

export function overrideCap(signal: unknown): number | null {
  const o = (signal as { season_cap_override?: unknown } | null)?.season_cap_override;
  // signal_merge_field stores values as text — accept "7" as well as 7.
  const n = typeof o === "number" ? o : typeof o === "string" ? Number(o) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(n, LIFETIME_SEASON_CAP) : null;
}

export async function seasonCapFor(db: any, extractionId: string): Promise<number> {
  try {
    const { data: ext } = await db
      .from("signal_extractions")
      .select("signal")
      .eq("id", extractionId)
      .maybeSingle();
    const granted = overrideCap(ext?.signal);
    if (granted !== null) return granted;
    return ext?.signal?.language === "en" ? SEASON_CAP_EN_FREE : SEASON_CAP_HE;
  } catch {
    return SEASON_CAP_HE;
  }
}
