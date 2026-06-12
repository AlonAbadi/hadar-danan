/**
 * htmlcsstoimage.com (HCTI) client — HTML/CSS → PNG via managed Chrome.
 *
 * Why this stack: HCTI runs real headless Chrome on their side, so Hebrew BiDi
 * renders correctly (unlike Satori). All the design lives in our codebase as
 * a string of HTML+CSS — no external visual editor, no template UID to track.
 *
 * Required env vars:
 *   HCTI_USER_ID  — User ID from Settings → API Credentials
 *   HCTI_API_KEY  — API Key from same place
 *
 * Auth model: HTTP Basic with `user_id:api_key`.
 *
 * Caching: HCTI hashes the (html, css, viewport, fonts) payload and returns
 * the same URL for identical inputs. So requesting the same signal twice
 * costs them one render — and we set our own cache-control on the proxy
 * response, so beegood.online serves repeats from CDN.
 *
 * Docs: https://docs.htmlcsstoimage.com/
 */

const HCTI_URL = "https://hcti.io/v1/image";

export interface HctiInput {
  html:             string;
  css:              string;
  googleFonts?:     string;        // e.g. "Assistant:wght@700"
  viewportWidth?:   number;        // default 1080
  viewportHeight?:  number;        // default 1080
  msDelay?:         number;        // wait this long after page load (font fetch)
  deviceScale?:     number;        // 1 = standard, 2 = retina; default 1
}

export type HctiResult =
  | { ok: true;  imageUrl: string }
  | { ok: false; error: string; status?: number; raw?: unknown };

export function isHctiConfigured(): boolean {
  return Boolean(process.env.HCTI_USER_ID && process.env.HCTI_API_KEY);
}

export async function createHctiImage(input: HctiInput): Promise<HctiResult> {
  const userId = process.env.HCTI_USER_ID;
  const apiKey = process.env.HCTI_API_KEY;
  if (!userId || !apiKey) {
    return { ok: false, error: "HCTI_USER_ID / HCTI_API_KEY not set" };
  }

  // Basic auth: base64("userId:apiKey")
  const auth = Buffer.from(`${userId}:${apiKey}`).toString("base64");

  let res: Response;
  try {
    res = await fetch(HCTI_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        html:            input.html,
        css:             input.css,
        google_fonts:    input.googleFonts,
        viewport_width:  input.viewportWidth  ?? 1080,
        viewport_height: input.viewportHeight ?? 1080,
        ms_delay:        input.msDelay        ?? 250,
        device_scale:    input.deviceScale    ?? 1,
      }),
    });
  } catch (e) {
    return { ok: false, error: `HCTI request failed: ${String(e)}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "HCTI returned non-JSON", status: res.status };
  }

  if (!res.ok) {
    return { ok: false, error: `HCTI ${res.status}`, status: res.status, raw: data };
  }

  const obj = data as Record<string, unknown>;
  const imageUrl = typeof obj.url === "string" ? obj.url : null;
  if (!imageUrl) return { ok: false, error: "HCTI response missing url", raw: data };

  return { ok: true, imageUrl };
}
