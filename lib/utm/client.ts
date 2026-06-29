/**
 * Client-side helper that reads first-touch UTM attribution from the cookies
 * proxy.ts sets on the visitor's first page load.
 *
 * Every signup-style form on the site (Challenge / Workshop / Course /
 * Strategy / Test / SignupForm / QuizClient) must call this and spread the
 * result into the body of POST /api/signup. Without this, /api/signup writes
 * the user with utm_source = null and every paid email click shows up as
 * "Direct" in /admin/acquisition.
 *
 * The keys mirror exactly what proxy.ts stores, and the field shape matches
 * what /api/signup unpacks (`utm_source`, `utm_medium`, ..., `click_id`).
 * fbclid + gclid are normalized to `click_id` to match the users table column.
 */

const UTM_COOKIE_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_adset",
  "utm_ad",
] as const;

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

export interface UtmAttribution {
  utm_source?:   string;
  utm_medium?:   string;
  utm_campaign?: string;
  utm_content?:  string;
  utm_term?:     string;
  utm_adset?:    string;
  utm_ad?:       string;
  click_id?:     string;
}

/**
 * Returns a plain object with whichever UTM fields the visitor has. Keys
 * with no cookie are omitted (not set to null) so spreading this into a
 * fetch body doesn't overwrite anything server-side. Values are URL-decoded
 * because cookie writes use raw values; if a campaign name had a space it
 * would arrive as "%20" otherwise.
 */
export function getUtmFromCookies(): UtmAttribution {
  const out: UtmAttribution = {};
  for (const key of UTM_COOKIE_KEYS) {
    const raw = readCookie(key);
    if (raw) out[key] = decodeURIComponent(raw);
  }
  // fbclid / gclid → click_id (single column on users table)
  const fbclid = readCookie("fbclid");
  const gclid  = readCookie("gclid");
  if (fbclid) out.click_id = decodeURIComponent(fbclid);
  else if (gclid) out.click_id = decodeURIComponent(gclid);
  return out;
}
