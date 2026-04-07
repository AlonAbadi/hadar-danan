import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UNAUTHORIZED = new Response("Unauthorized", {
  status: 401,
  headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
});

function checkBasicAuth(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }

  const colon = decoded.indexOf(":");
  if (colon === -1) return false;
  const username = decoded.slice(0, colon);
  const password = decoded.slice(colon + 1);

  const validUser = process.env.ADMIN_USERNAME ?? "admin";
  const validPass = process.env.ADMIN_PASSWORD ?? "";

  // Constant-time comparison to avoid timing attacks
  const userOk =
    username.length === validUser.length &&
    username.split("").every((c, i) => c === validUser[i]);
  const passOk =
    password.length === validPass.length &&
    password.split("").every((c, i) => c === validPass[i]);

  return userOk && passOk;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Basic Auth for /admin/* ──────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!checkBasicAuth(request)) return UNAUTHORIZED;
  }

  const response = NextResponse.next();

  // ── Anonymous ID ─────────────────────────────────────────
  if (!request.cookies.get("anon_id")) {
    response.cookies.set("anon_id", crypto.randomUUID(), {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    });
  }

  // ── A/B Variant ──────────────────────────────────────────
  if (!request.cookies.get("ab_variant")) {
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set("ab_variant", variant, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });
  }

  // ── UTM params → cookie ──────────────────────────────────
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_adset", "utm_ad", "fbclid", "gclid"];
  for (const key of utmKeys) {
    const value = searchParams.get(key);
    if (value && !request.cookies.get(key)) {
      response.cookies.set(key, value, {
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
