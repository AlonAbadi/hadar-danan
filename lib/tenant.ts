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
