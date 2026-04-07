import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware-client";

// Routes that require a valid Supabase session
const PROTECTED_PREFIXES = ["/account", "/course/content", "/challenge/content", "/hive/members"];
// Auth routes that redirect to /account if already logged in
const AUTH_ROUTES = ["/login", "/signup"];

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

  const userOk =
    username.length === validUser.length &&
    username.split("").every((c, i) => c === validUser[i]);
  const passOk =
    password.length === validPass.length &&
    password.split("").every((c, i) => c === validPass[i]);

  return userOk && passOk;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Basic Auth for /admin/* ──────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!checkBasicAuth(request)) return UNAUTHORIZED;
  }

  // ── Supabase session refresh ─────────────────────────────────
  // `response` may be replaced inside setAll() to forward updated request
  // cookies. All subsequent cookie writes go onto the final `response`.
  let response = NextResponse.next({ request });

  const supabase = createMiddlewareClient({
    getCookies() {
      return request.cookies.getAll();
    },
    setCookies(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
      );
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Custom cookies (set on the final response) ───────────────

  // Anonymous ID
  if (!request.cookies.get("anon_id")) {
    response.cookies.set("anon_id", crypto.randomUUID(), {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    });
  }

  // A/B variant
  if (!request.cookies.get("ab_variant")) {
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set("ab_variant", variant, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });
  }

  // UTM params → cookie (first touch only)
  const utmKeys = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content",
    "utm_adset", "utm_ad", "fbclid", "gclid",
  ];
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

  // ── Route protection ─────────────────────────────────────────

  // Protected routes: no session → redirect to /login
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Auth routes: already logged in → redirect to /account
  if (AUTH_ROUTES.includes(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
