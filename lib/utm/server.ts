/**
 * Server-side counterpart of lib/utm/client.ts — reads the first-touch UTM
 * cookies that proxy.ts sets, from inside a route handler / server action.
 *
 * Used by signup paths that create `users` rows WITHOUT going through
 * POST /api/signup (which receives UTM in its body from the client helper):
 *   - /api/signal/extract  — the main funnel's lead creation
 *   - lib/auth/link-user   — Google OAuth / email-password signups
 *
 * Without this, those rows are written with utm_source = null and show up
 * as "ישיר / לא ידוע" in /admin/acquisition and /admin/activity.
 *
 * Returns the users-table field shape (utm_* + click_id). Keys with no
 * cookie are omitted so the result can be spread into an insert/patch
 * without overwriting anything. Values are URL-decoded — campaign names in
 * Hebrew otherwise persist as percent-encoded garbage ("%D7%90...").
 */
import { cookies } from "next/headers";

const UTM_COOKIE_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_adset",
  "utm_ad",
] as const;

export interface UtmUserFields {
  utm_source?:   string;
  utm_medium?:   string;
  utm_campaign?: string;
  utm_content?:  string;
  utm_term?:     string;
  utm_adset?:    string;
  utm_ad?:       string;
  click_id?:     string;
}

function decode(raw: string): string {
  try {
    return decodeURIComponent(raw).slice(0, 200);
  } catch {
    return raw.slice(0, 200);
  }
}

export async function getUtmFromRequestCookies(): Promise<UtmUserFields> {
  const out: UtmUserFields = {};
  try {
    const store = await cookies();
    for (const key of UTM_COOKIE_KEYS) {
      const raw = store.get(key)?.value;
      if (raw) out[key] = decode(raw);
    }
    // fbclid / gclid → click_id (single column on users table)
    const clickId = store.get("fbclid")?.value ?? store.get("gclid")?.value;
    if (clickId) out.click_id = clickId.slice(0, 200);
  } catch {
    // outside a request scope — attribution is best-effort
  }
  return out;
}
