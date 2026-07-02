import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware-client";

// Routes that require a valid Supabase session
const PROTECTED_PREFIXES = ["/account", "/course/content", "/challenge/content", "/hive/members"];
// Auth routes that redirect away if already logged in
const AUTH_ROUTES = ["/login", "/signup"];

const UNAUTHORIZED = new Response("Unauthorized", {
  status: 401,
  headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
});

// ── Admin access ──────────────────────────────────────────────────
// Two ways in:
//   1. Google session (Supabase Auth) whose email is on this allowlist —
//      the human path for Alon + Hadar. Browsers with no access get
//      redirected to /login (Google button) instead of the Basic popup.
//   2. Basic Auth — kept for scripts (gap-eval, cron, curl) and as fallback.
//
// Order matters: index 0 maps to the ADMIN_USERNAME/PASSWORD Basic pair,
// index 1 to ADMIN_USERNAME_2/PASSWORD_2 — so downstream attribution
// (handoff_by etc.) distinguishes who acted. Env override (comma-separated)
// lets emails rotate without a deploy.
const ADMIN_GOOGLE_EMAILS = (
  process.env.ADMIN_GOOGLE_EMAILS ?? "alonabadi9@gmail.com,hadard1113@gmail.com"
)
  .toLowerCase()
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Translate a verified admin Google session into the Basic credentials that
 * the ~29 self-authenticating /api/admin/* route handlers already trust.
 * The synthesized header exists only on the forwarded server-side request —
 * it never reaches the browser. Returns null when no Basic pair is set.
 */
function basicHeaderFor(email: string): string | null {
  const idx = ADMIN_GOOGLE_EMAILS.indexOf(email);
  const pair =
    idx === 1 && process.env.ADMIN_USERNAME_2 && process.env.ADMIN_PASSWORD_2
      ? { u: process.env.ADMIN_USERNAME_2, p: process.env.ADMIN_PASSWORD_2 }
      : process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD
        ? { u: process.env.ADMIN_USERNAME, p: process.env.ADMIN_PASSWORD }
        : null;
  if (!pair) return null;
  return "Basic " + btoa(`${pair.u}:${pair.p}`);
}

function timingSafeEqual(a: string, b: string): boolean {
  return a.length === b.length && a.split("").every((c, i) => c === b[i]);
}

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

  const accounts = [
    { user: process.env.ADMIN_USERNAME ?? "admin", pass: process.env.ADMIN_PASSWORD ?? "" },
    { user: process.env.ADMIN_USERNAME_2 ?? "",    pass: process.env.ADMIN_PASSWORD_2 ?? "" },
  ];

  return accounts.some(
    ({ user, pass }) =>
      user.length > 0 &&
      timingSafeEqual(username, user) &&
      timingSafeEqual(password, pass)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi =
    pathname.startsWith("/api/admin") ||
    /^\/api\/signal\/[^/]+\/gap$/.test(pathname);

  // ── Request headers (finalized BEFORE the response is constructed) ──
  // NextResponse.next() snapshots forwarded request headers at construction,
  // so every header mutation — x-pathname AND the admin auth translation —
  // must happen before we build `response`.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // ── Supabase session (cookie writes deferred until response exists) ──
  const pendingCookies: { name: string; value: string; options?: unknown }[] = [];
  const supabase = createMiddlewareClient({
    getCookies() {
      return request.cookies.getAll();
    },
    setCookies(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set(name, value);
        pendingCookies.push({ name, value, options });
      });
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Admin gate: Google-session allowlist OR Basic Auth ──────────────
  if (isAdminPage || isAdminApi) {
    const email = user?.email?.toLowerCase() ?? "";
    const sessionAdmin = email.length > 0 && ADMIN_GOOGLE_EMAILS.includes(email);
    const basicOk = checkBasicAuth(request);

    if (sessionAdmin && !basicOk) {
      // Trusted session → synthesize the Basic header the downstream route
      // checks (and page-level fetches) expect. Overwrites any bogus
      // client-supplied value.
      const header = basicHeaderFor(email);
      if (header) requestHeaders.set("authorization", header);
    }

    if (!sessionAdmin && !basicOk) {
      if (isAdminApi) {
        // Let the route's own 401 handling answer API calls.
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
      // Browser navigation → Google login; anything else → Basic challenge
      // (curl, health checks, legacy tooling).
      const wantsHtml = (request.headers.get("accept") ?? "").includes("text/html");
      if (wantsHtml) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
      return UNAUTHORIZED;
    }
  }

  // ── Response (headers now final) + deferred cookie writes ───────────
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  );

  // API requests need none of the visitor-cookie machinery below.
  if (isAdminApi) return response;

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

  // A/B variant — 50% each
  // QA override: ?ab=A or ?ab=B forces a variant (sets the cookie) so we can
  // preview both sides on demand. Real visitors don't pass this param.
  const abOverride = searchParams.get("ab");
  if (abOverride === "A" || abOverride === "B") {
    response.cookies.set("ab_variant", abOverride, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });
  } else if (!request.cookies.get("ab_variant")) {
    const r = Math.random();
    const variant = r < 0.5 ? "A" : "B";
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
    "utm_adset", "utm_ad", "utm_term", "fbclid", "gclid",
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

  // Auth routes: already logged in → honor a safe relative ?redirect=
  // (e.g. an admin sent to /login?redirect=/admin while already holding a
  // session) — otherwise default to /account. An /admin target is only
  // honored for allowlisted admins; anyone else goes to /account, which
  // breaks the would-be /admin → /login → /admin redirect loop for
  // logged-in non-admin users.
  if (AUTH_ROUTES.includes(pathname) && user) {
    const target = searchParams.get("redirect");
    const email = user.email?.toLowerCase() ?? "";
    const isAdminTarget = !!target?.startsWith("/admin");
    const allowed =
      target && target.startsWith("/") && !target.startsWith("//") &&
      (!isAdminTarget || ADMIN_GOOGLE_EMAILS.includes(email));
    const url = request.nextUrl.clone();
    url.pathname = allowed ? (target as string) : "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
    "/api/admin/:path*",
    "/api/signal/:id/gap",
  ],
};
