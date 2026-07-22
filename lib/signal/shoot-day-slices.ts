/**
 * Shoot-day per-video slice parser.
 *
 * The /shoot-day/videos endpoint persists each generated video via the
 * atomic `signal_merge_field` RPC, which stores the payload as a JSON
 * STRING inside the JSONB signal column. Meanwhile /finish writes video
 * #1 directly onto the row as an object. So downstream readers see a
 * mix: signal.shoot_day.videos[0] is an object, but signal.shoot_day_v3
 * is a JSON string.
 *
 * Every reader that dereferences `.script.hook`, `.title`, `.number`
 * etc. off `signal.shoot_day_v${n}` needs to parse first. Alon 2026-07-11
 * flagged: after generating videos 2-7 via "צור את הפרק", tapping
 * "לצלם עכשיו" on any of them redirected to /hive/signal-kit → back to
 * /kaveret ("the page restarted"), because the broadcast page saw a
 * string and `.script?.hook` was undefined. Same bug bit the initial
 * plan assembly on /kaveret (only video 1 showed after a refresh, even
 * though 2-7 were cached in the DB).
 *
 * Use `parseSlice` on any raw signal[`shoot_day_v${n}`] before you
 * dereference it. Use `collectShootDayVideos` when you want the full
 * list stitched from both shapes.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function parseSlice<T = unknown>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return null; }
  }
  return v as T;
}

/**
 * Merge the per-video slices (shoot_day_v1..v7) with shoot_day.videos into
 * one deduplicated, number-sorted array. Per-slice wins on conflict — that
 * matches the "regenerate a specific row" flow where /videos writes a fresh
 * slice while shoot_day.videos still holds the older copy.
 */
export function collectShootDayVideos(signal: any): any[] {
  const byNumber = new Map<number, any>();
  const planVideos = Array.isArray(signal?.shoot_day?.videos) ? signal.shoot_day.videos : [];
  for (const v of planVideos) {
    if (v && typeof v.number === "number") byNumber.set(v.number, v);
  }
  for (let n = 1; n <= 12; n++) {
    const slice = parseSlice<any>(signal?.[`shoot_day_v${n}`]);
    if (slice && typeof slice.number === "number") byNumber.set(slice.number, slice);
    else if (slice) byNumber.set(n, { ...slice, number: n });
  }
  return [...byNumber.values()].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
}

/**
 * Convenience: look up a single video by number, parsing the slice on the
 * way out. Prefers the per-slice value; falls back to shoot_day.videos.
 */
export function findShootDayVideo(signal: any, videoNumber: number): any | null {
  const slice = parseSlice<any>(signal?.[`shoot_day_v${videoNumber}`]);
  if (slice) return slice;
  const planVideos = Array.isArray(signal?.shoot_day?.videos) ? signal.shoot_day.videos : [];
  return planVideos.find((v: any) => v?.number === videoNumber) ?? null;
}

/**
 * Season 2 · "אני בפעולה" — slices land on signal.shoot_day_s2_v21..v26
 * (see /api/signal/[id]/shoot-day-s2/videos). Same parsing dance as the
 * Season 1 collector, but scoped to that number range and independent
 * of shoot_day.videos (Season 2 doesn't compose a `plan` — it's slices
 * only, per Alon 2026-07-22).
 */
export function collectShootDayS2Videos(signal: any): any[] {
  const byNumber = new Map<number, any>();
  for (let n = 21; n <= 26; n++) {
    const slice = parseSlice<any>(signal?.[`shoot_day_s2_v${n}`]);
    if (slice && typeof slice.number === "number") byNumber.set(slice.number, slice);
    else if (slice) byNumber.set(n, { ...slice, number: n });
  }
  return [...byNumber.values()].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
}
