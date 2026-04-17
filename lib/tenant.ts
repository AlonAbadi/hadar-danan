export function parseHostToTenantSlug(host: string | null): string {
  if (!host) return "hadar";

  // Strip IPv6 brackets, lowercase, strip port
  let h = host.replace(/^\[.*?\]/, "ipv6").toLowerCase().replace(/:\d+$/, "");

  // localhost and loopback → hadar
  if (h === "localhost" || h === "127.0.0.1") return "hadar";

  // Vercel preview URLs → hadar
  if (h.endsWith(".vercel.app")) return "hadar";

  // Exact beegood.online domains → hadar
  if (h === "beegood.online" || h === "www.beegood.online") return "hadar";

  // Subdomain of beegood.online → use subdomain label as slug
  if (h.endsWith(".beegood.online")) {
    const sub = h.slice(0, h.length - ".beegood.online".length);
    // Only single-label subdomains (no dots) are valid tenant slugs
    if (sub && !sub.includes(".")) return sub;
  }

  // Fallback for unrecognised hosts
  return "hadar";
}

// ---------------------------------------------------------------------------
// Test cases — plug into vitest when ready
// Format: [host, expectedSlug]
// ---------------------------------------------------------------------------

export const TENANT_SLUG_TEST_CASES: [string | null, string][] = [
  // Null / empty
  [null,                              "hadar"],
  ["",                                "hadar"],

  // Localhost variants
  ["localhost",                       "hadar"],
  ["localhost:3000",                  "hadar"],
  ["127.0.0.1",                       "hadar"],

  // Vercel preview URLs
  ["foo.vercel.app",                  "hadar"],
  ["hadar-danan-abc.vercel.app",      "hadar"],

  // Canonical beegood.online domains
  ["beegood.online",                  "hadar"],
  ["www.beegood.online",              "hadar"],
  ["BEEGOOD.ONLINE",                  "hadar"],  // uppercased — must normalise

  // Tenant subdomain
  ["shirifadlon.beegood.online",      "shirifadlon"],

  // Tenant subdomain with port
  ["shirifadlon.beegood.online:3000", "shirifadlon"],

  // Double subdomain — no valid single label, fallback to hadar
  ["weird.sub.beegood.online",        "hadar"],

  // Unrelated domain — fallback to hadar
  ["notbeegood.com",                  "hadar"],
];

// ---------------------------------------------------------------------------
// Tenant type
// ---------------------------------------------------------------------------

export type Tenant = {
  id:                        string;
  slug:                      string;
  name:                      string;
  domains:                   string[];
  status:                    "setup" | "active" | "paused" | "archived";
  branding:                  Record<string, unknown> | null;
  content:                   Record<string, unknown> | null;
  products:                  string[] | null;
  cardcom_terminal_number:   string | null;
  cardcom_username:          string | null;
  cardcom_api_key_encrypted: string | null;
  analytics:                 Record<string, unknown> | null;
  legal:                     Record<string, unknown> | null;
  created_at:                string;
  updated_at:                string;
};

// ---------------------------------------------------------------------------
// In-memory cache (per Node process — intentional, see CLAUDE.md notes)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60_000;

type CacheEntry = { tenant: Tenant; expiresAt: number };
const tenantCache = new Map<string, CacheEntry>();

// ---------------------------------------------------------------------------
// getTenantBySlug — DB lookup with cache
// ---------------------------------------------------------------------------

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) return cached.tenant;

  try {
    // Dynamic import: lib/supabase/server transitively imports next/headers,
    // which is unsafe in middleware context. lib/tenant.ts is imported by
    // middleware.ts, so a static import here would break middleware at startup.
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = createServerClient();
    // TODO: remove cast once lib/supabase/types.ts is regenerated to include tenants table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[tenant] DB error fetching slug:", slug, error.message);
      return null;
    }
    if (!data) return null;

    tenantCache.set(slug, { tenant: data as Tenant, expiresAt: Date.now() + CACHE_TTL_MS });
    return data as Tenant;
  } catch (err) {
    console.error("[tenant] Unexpected error fetching slug:", slug, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// getTenant — reads host from next/headers, returns active tenant
// ---------------------------------------------------------------------------

export async function getTenant(): Promise<Tenant> {
  const { headers } = await import("next/headers");
  const host = (await headers()).get("host");
  const slug = parseHostToTenantSlug(host);

  const tenant = await getTenantBySlug(slug);
  if (tenant) return tenant;

  // Unknown subdomain or inactive tenant — fall back to hadar
  const fallback = await getTenantBySlug("hadar");
  if (fallback) return fallback;

  // hadar tenant missing or inactive — fatal config error
  throw new Error("[tenant] Fatal: hadar tenant not found or not active in DB");
}

// ---------------------------------------------------------------------------
// clearTenantCache — for dev/testing
// ---------------------------------------------------------------------------

export function clearTenantCache(): void {
  tenantCache.clear();
}
