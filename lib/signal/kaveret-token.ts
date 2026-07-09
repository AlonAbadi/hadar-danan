// Signed access token for the visitor-state kaveret: leads have no auth
// account, so their locked page opens via a link carrying
// `?t=<extractionId>.<hmac>`. The HMAC proves the link was issued by us;
// the page is theirs for good ("שמרנו לך אותו") so tokens do not expire.
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.KAVERET_LINK_SECRET || process.env.CRON_SECRET || "";
}

function hmacFor(extractionId: string): string {
  return createHmac("sha256", secret()).update(`kaveret:${extractionId}`).digest("hex").slice(0, 32);
}

export function signKaveretToken(extractionId: string): string {
  return `${extractionId}.${hmacFor(extractionId)}`;
}

export function kaveretLink(extractionId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.beegood.online";
  return `${base}/kaveret?t=${signKaveretToken(extractionId)}`;
}

// Returns the extraction id when the token is authentic, else null.
export function verifyKaveretToken(token: string | null | undefined): string | null {
  if (!token || !secret()) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/.test(id) || mac.length !== 32) return null;
  const expected = hmacFor(id);
  try {
    if (timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return id;
  } catch {
    // length mismatch
  }
  return null;
}
