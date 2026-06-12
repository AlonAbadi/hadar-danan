/**
 * Bannerbear API client — synchronous image generation.
 *
 * We use the sync endpoint (POST /v2/images) which renders the image and
 * returns the URL in a single request (typical latency 2-5 sec). The async
 * path with webhook callback is available if we ever need it (templates that
 * render slowly, very high volume), but sync is the right fit for a click-to-
 * share button.
 *
 * Required env vars:
 *   BANNERBEAR_API_KEY      — Project API Key from the Bannerbear dashboard
 *   BANNERBEAR_TEMPLATE_ID  — the template uid (visible in the template URL)
 *
 * Modifications API:
 *   Each text/image layer in the template has a `name`. We pass a
 *   `modifications` array overriding the values we want to vary per render.
 *   Layers we don't list keep their template defaults.
 *
 * Docs: https://developers.bannerbear.com/#create-image
 */

const BANNERBEAR_API_URL = "https://api.bannerbear.com/v2/images";

export interface BannerbearModification {
  name:  string;
  text?: string;
  // Other supported fields (color, image_url, etc.) can be added when the
  // template needs them. Text-only is enough for the signal share-card.
}

export interface BannerbearCreateImageInput {
  templateUid:    string;
  modifications:  BannerbearModification[];
  metadata?:      string;   // echoed back, useful for correlation
}

export type BannerbearResult =
  | { ok: true;  imageUrl: string; renderedAt: string; uid: string }
  | { ok: false; error: string; status?: number; raw?: unknown };

export function isBannerbearConfigured(): boolean {
  return Boolean(
    process.env.BANNERBEAR_API_KEY && process.env.BANNERBEAR_TEMPLATE_ID,
  );
}

export async function createBannerbearImage(
  input: BannerbearCreateImageInput,
): Promise<BannerbearResult> {
  const apiKey = process.env.BANNERBEAR_API_KEY;
  if (!apiKey) return { ok: false, error: "BANNERBEAR_API_KEY not set" };

  let res: Response;
  try {
    res = await fetch(BANNERBEAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        template:      input.templateUid,
        modifications: input.modifications,
        metadata:      input.metadata ?? null,
      }),
    });
  } catch (e) {
    return { ok: false, error: `Bannerbear request failed: ${String(e)}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "Bannerbear returned non-JSON", status: res.status };
  }

  if (!res.ok) {
    return {
      ok:     false,
      error:  `Bannerbear ${res.status}`,
      status: res.status,
      raw:    data,
    };
  }

  // Sync endpoint returns { uid, status, image_url, created_at, ... }
  const obj = data as Record<string, unknown>;
  const imageUrl = typeof obj.image_url === "string" ? obj.image_url : null;
  const uid      = typeof obj.uid       === "string" ? obj.uid       : null;
  const renderedAt = typeof obj.rendered_at === "string"
    ? obj.rendered_at
    : new Date().toISOString();

  if (!imageUrl || !uid) {
    return { ok: false, error: "Bannerbear response missing image_url / uid", raw: data };
  }

  return { ok: true, imageUrl, uid, renderedAt };
}
