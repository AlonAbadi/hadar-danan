/**
 * Permanent re-hosting for AI background images.
 *
 * Replicate's `replicate.delivery` URLs are EPHEMERAL — they 404 within ~a day.
 * We cache the background URL permanently on the signal JSONB, so a cached
 * Replicate URL silently goes dead and the card renders blank forever (the cache
 * check sees "there's a URL" and never regenerates). The fix: download the freshly
 * generated image and re-host it in Supabase Storage, then cache THAT permanent
 * URL. On any failure we fall back to the original URL so the current render still
 * works — better a card that's good today than a guaranteed-blank one.
 */

const BUCKET = "signal-bg";

export async function persistBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sourceUrl: string,
  path: string,
): Promise<string> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return sourceUrl;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (error) return sourceUrl;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return (data?.publicUrl as string) || sourceUrl;
  } catch {
    return sourceUrl;
  }
}

/**
 * A cached background is only trustworthy if it's permanently hosted. Replicate
 * delivery URLs expire, so we treat them as a cache MISS — that auto-heals every
 * old extraction (regenerate + re-host on next view, no manual backfill).
 */
export function isPersistedUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("http") && !url.includes("replicate.delivery");
}
