/**
 * In-memory sliding-window rate limiter.
 * Works for single-instance deployments (local dev, single Vercel region).
 * For multi-region production replace with Upstash Redis:
 * https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

const store = new Map<string, number[]>();

// Prune old entries every 5 minutes to prevent memory leaks
setInterval(
  () => {
    const cutoff = Date.now() - 60_000;
    for (const [key, timestamps] of store) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) store.delete(key);
      else store.set(key, fresh);
    }
  },
  5 * 60 * 1000
);

/**
 * Returns true if the request is within limits, false if it should be blocked.
 * @param key   Unique identifier (e.g. IP address or anonymous_id)
 * @param limit Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) return false;

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
