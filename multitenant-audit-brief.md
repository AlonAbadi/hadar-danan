# beegood.online - Multi-Tenant Audit Brief
Created: Fri Apr 17 14:40:15 IDT 2026
Commit: 056554c51c32555be626101ef90dc3e89bc6cbf2
Branch: feature/atelier

---

## package.json
```json
{
  "name": "hadar-danan",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.86.1",
    "@supabase/ssr": "^0.10.0",
    "@supabase/supabase-js": "^2.100.1",
    "lucide-react": "^1.7.0",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.8.1",
    "resend": "^6.9.4",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## middleware.ts (CURRENT - exists)
```ts
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
```

## next.config
```
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

## app/layout.tsx
```tsx
import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Pixels }              from "@/components/analytics/Pixels";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { MobileNavServer }     from "@/components/MobileNavServer";
import { DesktopNavServer }    from "@/components/DesktopNavServer";
import { LayoutShell }         from "@/components/LayoutShell";
import { SchemaMarkup }        from "@/components/SchemaMarkup";

const assistant = Assistant({
  subsets:  ["hebrew", "latin"],
  variable: "--font-assistant",
  display:  "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const OG_IMAGE = "https://beegood.online/og-image.jpg";

const TITLE       = "הדר דנן | שיטת TrueSignal by BeeGood - שיווק אותנטי לעסקים";
const DESCRIPTION = "הדר דנן, מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal by BeeGood. קורסים, סדנאות וליווי אישי לבעלי עסקים שרוצים לשווק בלי לאבד את עצמם.";

export const metadata: Metadata = {
  title: {
    default:  TITLE,
    template: "%s | הדר דנן",
  },
  description: DESCRIPTION,
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type:        "website",
    locale:      "he_IL",
    siteName:    "הדר דנן | BeeGood",
    title:       TITLE,
    description: DESCRIPTION,
    url:         APP_URL,
    images:      [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESCRIPTION,
    images:      [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${assistant.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-assistant antialiased" style={{ background: "#101520", color: "#EDE9E1" }}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-L76SZ1SCS1" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-L76SZ1SCS1');
        `}</Script>
        <SchemaMarkup />
        <a href="#main-content" className="skip-link">דלג לתוכן הראשי</a>
        <Pixels />
        <AccessibilityWidget />
        <LayoutShell nav={<><MobileNavServer /><DesktopNavServer /></>}>
          <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
```

## app/page.tsx (homepage)
```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { parseVariant, AB_CONTENT } from "@/lib/ab";
import { createServerClient } from "@/lib/supabase/server";
import { PageTracker } from "@/components/landing/PageTracker";
import { CarouselWithDots } from "@/components/landing/CarouselWithDots";
import { PhilosophySection } from "@/components/landing/PhilosophySection";
import { StatsSection } from "@/components/landing/StatsSection";
import { ProductsSection } from "@/components/ProductsSection";
import HomeStickyBar from "@/components/home/HomeStickyBar";
import SocialProofStrip from "@/components/SocialProofStrip";
import { BookOpen, Zap, Target, GraduationCap, Compass, Video, Users, Star, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "הדר דנן | אסטרטגיה שיווקית שמביאה תוצאות",
  description: "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת - ולבנות שיווק שמרגיש טבעי ומביא תוצאות",
  alternates: { canonical: "/" },
};

async function getUserCount(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}


const ROW1_PRODUCTS = [
  { title: "הדרכה חינמית",    who: "לכל מי שרוצה להבין למה השיווק שלו לא עובד",                      price: "חינם",          cta: "התחל כאן ←",         href: "/training",    icon: BookOpen },
  { title: "אתגר 7 ימים",     who: "לכל מי שרוצה לצאת לדרך ולייצר תוכן שמביא לקוחות",              price: "₪197",          cta: "להתחיל ←", href: "/challenge",   icon: Zap },
  { title: "סדנה יום אחד",    who: "לכל מי שמייצר תוכן אבל לא רואה תוצאות",                        price: "₪1,080",        cta: "קבע יום ←",          href: "/workshop",    icon: Target },
  { title: "קורס דיגיטלי",    who: "לכל מי שרוצה ללמוד לעומק - לא רק לצלם אלא להבין",              price: "₪1,800",        cta: "לקורס ←",            href: "/course",      icon: GraduationCap },
  { title: "פגישת אסטרטגיה",  who: "לכל מי שרוצה לשבת עם הדר ולבנות אסטרטגיה מדויקת",            price: "₪4,000",        cta: "קבע פגישה ←",        href: "/strategy",    icon: Compass },
];

const ROW2_PRODUCTS = [
  { title: "יום צילום פרמיום",  who: "לעסקים שרוצים תוצאה מלאה: אסטרטגיה + הפקה + עריכה",           price: "₪14,000",        priceNote: "+ מע״מ",  cta: "לפרטים ←",         href: "/premium",     icon: Video,     tag: "יום הפקה" },
  { title: "שותפות אסטרטגית",   who: "למשפיעניות וחברות שרוצות שותף לדרך - לא ספק שירות",           price: "₪10,000-30,000", priceNote: "/ חודש",  cta: "בדוק התאמה ←",     href: "/partnership", icon: Users,     tag: "על בסיס מקום פנוי" },
  { title: "beegood atelier",   who: "למשפיעניות שרוצות להפוך למנהיגות תרבותיות - עולם שלם תחת הדומיין שלך", price: "בהתאמה אישית", priceNote: "", cta: "לבדיקת התאמה ←", href: "/atelier",     icon: Sparkles,  tag: "בוטיק · מספר מקומות מוגבל" },
];

const TESTIMONIALS = [
  {
    text: "מי שרוצה שירות פרימיום יחס מעולה ושיוציאו אותך הכי אותנטי זה המקום!!",
    name: "ניסן אלנקווה",
    date: "לפני 11 חודשים",
    initial: "נ",
  },
  {
    text: "שירות מעולה, הבנה מאוד רצינית ומעמיקה על איך לשווק נכון עסק ואיזה סרטונים טובים לו. מומלץ בחום.",
    name: "נטע מרום",
    date: "לפני שנה",
    initial: "נ",
  },
  {
    text: "הגעתי לצילומים אצל הדר דנן עם קצת חשש ופרפרים אבל תוך רגע כל הלחץ הסתיים. הצוות שם פשוט תותחים מהרגע שנכנסתי, הייתה אווירה כיפית, נעימה ומקצועית בטירוף.",
    name: "נטלי גדקר",
    date: "לפני שנה",
    initial: "נ",
  },
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const variant = parseVariant(cookieStore.get("ab_variant")?.value);
  const content = AB_CONTENT[variant];
  const userCount = await getUserCount();
  const displayCount = Math.max(userCount + 250, 3500);

  return (
    <>
      <PageTracker abVariant={variant} />

      <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "#080C14" }}>



        <main className="flex-1">

          {/* ══════════════════════════════════════════════════════
              1. HERO
          ══════════════════════════════════════════════════════ */}
          <section style={{ overflow: "hidden", background: "#0B1220" }}>

            {/* ── MOBILE: full-bleed overlay, thumb-zone optimized ── */}
            <div className="md:hidden" style={{ position: "relative", height: "93svh" }}>
              <Image
                src="/hadar1.png"
                alt="הדר דנן"
                fill
                priority
                style={{ objectFit: "cover", objectPosition: "center 10%" }}
              />
              {/* Bottom-to-top overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, #080C14 0%, rgba(8,12,20,0.95) 20%, rgba(8,12,20,0.85) 35%, rgba(8,12,20,0.6) 55%, rgba(8,12,20,0.3) 70%, transparent 85%)",
              }} />
              {/* Top fade - navbar blend */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)",
              }} />
              {/* Left side fade */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to right, #080C14 0%, rgba(8,12,20,0.6) 25%, transparent 55%)",
              }} />
              {/* Content anchored from bottom */}
              <div style={{
                position: "absolute", bottom: "32px", left: 0, right: 0,
                padding: "0 24px", direction: "rtl", textAlign: "right",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)",
                  borderRadius: 9999, padding: "5px 14px", marginBottom: 12,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                  <span style={{ color: "#C9964A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>
                    <span style={{ direction: "rtl" }}>שיטת <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
                  </span>
                </div>
                <h1 style={{ color: "#EDE9E1", fontWeight: 800, fontSize: "clamp(1.7rem, 4.5vw, 2rem)", lineHeight: 1.18, marginBottom: 12, whiteSpace: "pre-line" }}>
                  {content.headline}
                </h1>
                <p style={{ color: "#9E9990", fontSize: "clamp(0.9rem, 2vw, 1rem)", lineHeight: 1.72, marginBottom: 16 }}>
                  {content.description}
                </p>
                <a href="/quiz" data-home-hero-cta="" style={{
                  display: "block", textAlign: "center",
                  background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                  color: "#1A1206", fontWeight: 800, fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
                  borderRadius: 9999, padding: "14px", marginBottom: 14, textDecoration: "none",
                  width: "100%",
                }}>
                  {content.cta}
                </a>
              </div>
            </div>

            {/* ── DESKTOP: full-bleed overlay, seamless fade ─────── */}
            <div className="hidden md:block" style={{ position: "relative", minHeight: "100vh" }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: "-5%",
                height: "163%",
                width: "auto",
                display: "inline-block",
              }}>
                <Image
                  src="/hadar1.png"
                  alt="הדר דנן"
                  width={842}
                  height={1264}
                  priority
                  quality={90}
                  style={{
                    height: "100%",
                    width: "auto",
                    maxWidth: "none",
                    display: "block",
                    WebkitMaskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                    maskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                  }}
                />
              </div>
              {/* Top fade - navbar blend */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)",
              }} />
              {/* Text floats over right side */}
              <div style={{
                position: "absolute", top: "50%", right: 0,
                transform: "translateY(-50%)",
                width: "45%", padding: "0 72px 0 0",
                direction: "rtl", textAlign: "right",
              }}>

                {/* Tag pill */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)",
                  borderRadius: 9999, padding: "5px 14px", marginBottom: 22,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                  <span style={{ color: "#C9964A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>
                    <span style={{ direction: "rtl" }}>שיטת <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
                  </span>
                </div>

                {/* Headline */}
                <h1 style={{
                  color: "#EDE9E1", fontWeight: 800,
                  fontSize: "clamp(2rem, 2.6vw, 3rem)",
                  lineHeight: 1.2, marginBottom: 18, whiteSpace: "pre-line",
                }}>
                  {content.headline}
                </h1>

                {/* Body */}
                <p style={{
                  color: "#9E9990", fontSize: "1rem",
                  lineHeight: 1.78, marginBottom: 36,
                }}>
                  {content.description}
                </p>

                {/* CTA */}
                <a href="/quiz" data-home-hero-cta="" style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                  color: "#1A1206", fontWeight: 800, fontSize: "1.05rem",
                  borderRadius: 9999, padding: "16px 52px",
                  textDecoration: "none", marginBottom: 22,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 6px rgba(0,0,0,0.25), 0 10px 28px rgba(0,0,0,0.35), 0 0 40px rgba(201,150,74,0.15)",
                }}>
                  {content.cta}
                </a>


              </div>
            </div>

          </section>

          {/* ══════════════════════════════════════════════════════
              2. STATS
          ══════════════════════════════════════════════════════ */}
          <StatsSection />

          <SocialProofStrip />

          {/* ══════════════════════════════════════════════════════
              3. PHILOSOPHY
          ══════════════════════════════════════════════════════ */}
          <section
            className="px-6 py-20 md:py-28"
            style={{ background: "#101520" }}
          >
            <div className="max-w-5xl mx-auto flex flex-col gap-14">
              <div className="text-center flex flex-col gap-3">
                <h2 className="text-3xl md:text-4xl font-black" style={{ color: "#EDE9E1" }}>
                  הגישה שלנו
                </h2>
                <p className="text-base font-semibold" style={{ color: "#C9964A" }}>
                  כי אפשר למכור רק את מה שאתה באמת - זה הבסיס של <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span>
                </p>
              </div>

              <PhilosophySection />

              <div
                className="rounded-3xl px-8 py-7 text-center"
                style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.12)" }}
              >
                <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: "#EDE9E1" }}>
                  ״אנחנו לא מוכרים סרטונים.<br className="hidden md:block" />
                  אנחנו מוכרים את הבהירות שגורמת לתוכן לעבוד.״
                </p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              4. PRODUCTS - LADDER + NETFLIX
          ══════════════════════════════════════════════════════ */}
          <ProductsSection />

          {/* ══════════════════════════════════════════════════════
              5. BINGE CTA
          ══════════════════════════════════════════════════════ */}
          <section style={{ background: "#080C14", padding: "40px 24px" }}>
            <div
              className="rounded-2xl"
              style={{
                maxWidth: 480,
                margin: "0 auto",
                background: "#141820",
                border: "1px solid #2C323E",
                padding: "32px 28px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Image src="/beegood_logo.png" alt="Bee Good" width={36} height={28} />
              <p style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
                background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontFamily: "var(--font-assistant), Assistant, sans-serif",
              }}>
                בינג׳
              </p>
              <p style={{ margin: 0, fontSize: 15, color: "#9E9990", fontFamily: "var(--font-assistant), Assistant, sans-serif" }}>
                כל התכנים של הדר במקום אחד
              </p>
              <a
                href="/binge"
                style={{
                  marginTop: 4,
                  display: "inline-block",
                  background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                  color: "#080C14",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "10px 28px",
                  borderRadius: 24,
                  textDecoration: "none",
                  fontFamily: "var(--font-assistant), Assistant, sans-serif",
                }}
              >
                לכל התכנים ←
              </a>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              6. SOCIAL PROOF
          ══════════════════════════════════════════════════════ */}
          <section className="px-6 py-24 md:py-36" style={{ background: "#080C14" }}>
            <div className="max-w-5xl mx-auto flex flex-col gap-16">

              {/* Header */}
              <div className="text-center flex flex-col items-center gap-5">
                {/* Google badge */}
                <div
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Google">
                    <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.4 7.3-17.3z" />
                    <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.4v6.2C6.4 42.6 14.6 48 24 48z" />
                    <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.4 10.8l8.1-6.2z" />
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.1 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l8.1 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: "#9E9990" }}>ביקורות Google</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="w-4 h-4" fill="#E8B94A" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#EDE9E1" }}>5.0</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-black leading-tight" style={{ color: "#EDE9E1" }}>
                  מעל {displayCount.toLocaleString("he-IL")} עסקים כבר מצאו<br className="hidden md:block" /> את הבהירות שלהם עם הדר
                </h2>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-3xl p-8 flex flex-col gap-6"
                    style={{
                      background: "linear-gradient(145deg,#131c2e,#0d1520)",
                      border: "1px solid rgba(201,150,74,0.15)",
                      boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
                    }}
                  >
                    {/* Stars + Google logo */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} className="w-4 h-4" fill="#E8B94A" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Google" style={{ opacity: 0.7 }}>
                        <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.4 7.3-17.3z" />
                        <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.4v6.2C6.4 42.6 14.6 48 24 48z" />
                        <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.4 10.8l8.1-6.2z" />
                        <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.1 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l8.1 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
                      </svg>
                    </div>

                    {/* Quote */}
                    <p className="text-base md:text-lg leading-relaxed flex-1" style={{ color: "#D8D4CC" }}>
                      &ldquo;{t.text}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-5" style={{ borderTop: "1px solid rgba(201,150,74,0.12)" }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, rgba(232,185,74,0.2), rgba(158,124,58,0.2))",
                          color: "#C9964A",
                          border: "1px solid rgba(201,150,74,0.3)",
                        }}
                      >
                        {t.initial}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#EDE9E1" }}>{t.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#6B7080" }}>{t.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

        </main>

        {/* ══════════════════════════════════════════════════════
            7. FOOTER
        ══════════════════════════════════════════════════════ */}
        <footer className="px-6 py-12" style={{ background: "#101520", paddingBottom: "100px" }}>
          <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Credit CTA */}
            <div className="text-center">
              <a
                href="/my"
                className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
                style={{ color: "#C9964A" }}
              >
                יש לך זיכוי? בדוק באזור האישי שלך ←
              </a>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "#9E9990" }}>
              {[
                { label: "בית",       href: "/" },
                { label: "הדרכה",     href: "/training" },
                { label: "אתגר",      href: "/challenge" },
                { label: "סדנה",      href: "/workshop" },
                { label: "קורס",      href: "/course" },
                { label: "אסטרטגיה",  href: "/strategy" },
                { label: "הכוורת",    href: "/hive" },
                { label: "פרימיום",   href: "/premium" },
                { label: "שותפות",    href: "/partnership" },
                { label: "אזור אישי", href: "/my" },
              ].map((link) => (
                <a key={link.href} href={link.href} className="hover:text-white transition" style={{ color: "#C9964A" }}>
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Legal */}
            <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "rgba(158,153,144,0.5)" }}>
              <div className="flex gap-4">
                <a href="/privacy" className="hover:text-white transition">מדיניות פרטיות</a>
                <a href="/terms" className="hover:text-white transition">תנאי שימוש</a>
                <a href="/accessibility" className="hover:text-white transition">הצהרת נגישות</a>
              </div>
              <p className="font-medium" style={{ color: "rgba(158,153,144,0.6)" }}>אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span></p>
              <p>© 2026 הדר דנן בע״מ | ח.פ. 516791555 · כל הזכויות שמורות</p>
              <p>החילזון 5, רמת גן | 053-9566961</p>
              <p className="mt-1">
                <a href="/unsubscribe" className="hover:text-white transition">לביטול הסכמה לדיוור</a>
              </p>
            </div>

          </div>
        </footer>

      </div>
      <HomeStickyBar ctaText={content.cta} />
    </>
  );
}
```

## app/globals.css
```css
@import "tailwindcss";

/* ══ Santosha brand tokens ════════════════════════════════════ */
:root {
  --bg:         #0D1018;
  --card:       #141820;
  --card-soft:  #181D26;
  --border:     #2C323E;
  --muted:      #272D38;
  --gold:       #C9964A;
  --gold-light: #E8B94A;
  --gold-dark:  #9E7C3A;

  /* brand scale (Gold-1 = high-emphasis, Gold-2 = base, Gold-3 = dark) */
  --brand-gold-1: #E8B94A;
  --brand-gold-2: #C9964A;
  --brand-gold-3: #9E7C3A;
  --fg:         #EDE9E1;
  --fg-muted:   #9E9990;
  --cream:      #EBE4D6;

  --grad-gold:      linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%);
  --grad-hero:      linear-gradient(180deg, hsl(220,20%,8%) 0%, hsl(220,18%,12%) 100%);
  --grad-card:      linear-gradient(145deg, hsl(220,18%,14%), hsl(220,20%,10%));
  --grad-text-gold: linear-gradient(135deg, #E8B94A 0%, #C9964A 100%);

  --glow-gold:   0 0 60px rgba(201,150,74,0.15);
  --shadow-card: 0 8px 40px rgba(0,0,0,0.4);

  /* legacy compat */
  --background:    var(--bg);
  --foreground:    var(--fg);
  --color-primary: var(--gold);
}

@theme inline {
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --font-assistant:   var(--font-assistant);
  --color-gold:       var(--gold);
  --color-fg:         var(--fg);
  --color-fg-muted:   var(--fg-muted);
  --color-card:       var(--card);
  --color-border:     var(--border);
  --color-bg:         var(--bg);
}

/* ══ Base ════════════════════════════════════════════════════ */
* { box-sizing: border-box; }

html, body { overflow-x: hidden; max-width: 100%; }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-assistant), "Assistant", Arial, sans-serif;
}

/* ══ Brand utility classes ════════════════════════════════════ */
.text-gradient-gold {
  background: var(--grad-text-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.bg-gradient-gold  { background: var(--grad-gold); }
.bg-gradient-card  { background: var(--grad-card); }
.bg-gradient-hero  { background: var(--grad-hero); }

.glow-gold {
  box-shadow: 0 0 40px rgba(201,150,74,0.18), 0 0 80px rgba(201,150,74,0.08);
}

.shadow-card { box-shadow: var(--shadow-card); }

/* ══ Hero CTA button — full depth + glow + lift ══════════════ */
.btn-cta-hero {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%);
  color: #1A1206;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 0 -2px 6px rgba(0,0,0,0.25),
    0 10px 28px rgba(0,0,0,0.35),
    0 0 40px rgba(201,150,74,0.15);
  transition: all 0.25s ease;
}
.btn-cta-hero:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #F0C35A 0%, #D1A14C 50%, #A8843C 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    inset 0 -2px 8px rgba(0,0,0,0.28),
    0 12px 30px rgba(0,0,0,0.38),
    0 0 50px rgba(201,150,74,0.18);
}
.btn-cta-hero:active {
  transform: translateY(0) scale(0.98);
}

/* ══ Primary gold CTA button ══════════════════════════════════ */
.btn-cta-gold {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%);
  color: #1A1206;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 0 -2px 6px rgba(0,0,0,0.25),
    0 10px 28px rgba(0,0,0,0.35);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.btn-cta-gold:hover:not(:disabled) {
  background: linear-gradient(135deg, #F0C35A 0%, #D1A14C 50%, #A8843C 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    inset 0 -2px 8px rgba(0,0,0,0.28),
    0 12px 30px rgba(0,0,0,0.38);
}
.btn-cta-gold:active {
  transform: scale(0.98);
}

/* ══ Dark navy secondary button (inside light cards) ══════════ */
.btn-navy-secondary {
  background: #0F172A;
  color: #F5F1E8;
  border: 1px solid rgba(201,150,74,0.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 4px 14px rgba(0,0,0,0.18);
  transition: background 0.2s ease, border-color 0.15s ease;
}
.btn-navy-secondary:hover {
  background: #162033;
  border-color: rgba(201,150,74,0.35);
}

/* ══ Card hover — subtle gold rim on interaction ══════════════ */
.card-hover {
  transition: box-shadow 0.2s ease;
}
.card-hover:hover {
  box-shadow: 0 0 0 1px rgba(201,150,74,0.32), 0 8px 32px rgba(0,0,0,0.3);
}

/* ══ Gradient border animation ═══════════════════════════════ */
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.border-brand { border-color: var(--border); }

/* ══ Skip link ════════════════════════════════════════════════ */
.skip-link {
  position: fixed;
  top: -999px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 0.75rem 2rem;
  background: var(--gold);
  color: var(--bg);
  font-weight: 700;
  font-size: 1rem;
  border-radius: 0 0 0.75rem 0.75rem;
  text-decoration: none;
  white-space: nowrap;
  transition: top 0.15s;
}
.skip-link:focus {
  top: 0;
  outline: 3px solid var(--fg);
  outline-offset: -3px;
}

/* ══ Keyboard focus indicator ════════════════════════════════ */
:focus-visible {
  outline: 3px solid var(--gold) !important;
  outline-offset: 2px !important;
  border-radius: 4px;
}

/* ══ Accessibility modes ═════════════════════════════════════ */
html.a11y-high-contrast body  { background: #000 !important; color: #fff !important; }
html.a11y-high-contrast a     { color: #ffff00 !important; }
html.a11y-high-contrast button,
html.a11y-high-contrast [role="button"] { border: 2px solid #fff !important; }

html.a11y-highlight-links a {
  text-decoration: underline !important;
  text-underline-offset: 3px !important;
  outline: 2px solid currentColor !important;
  outline-offset: 2px !important;
  border-radius: 2px;
}

html.a11y-stop-animations *,
html.a11y-stop-animations *::before,
html.a11y-stop-animations *::after {
  animation-duration:      0.001ms !important;
  animation-iteration-count: 1   !important;
  transition-duration:     0.001ms !important;
  scroll-behavior:         auto   !important;
}

html.a11y-reading-mode body {
  background: #fffef5 !important;
  color: #1a1a1a  !important;
}
html.a11y-reading-mode main,
html.a11y-reading-mode [role="main"] {
  max-width:     720px      !important;
  margin-inline: auto       !important;
  padding:       2rem 1.5rem !important;
  background:    #ffffff    !important;
  box-shadow:    0 0 0 100vmax #fffef5 !important;
  font-size:     1.1rem     !important;
  line-height:   1.9        !important;
}
html.a11y-reading-mode img { max-width: 100% !important; }

/* ══ Product landing pages ═══════════════════════════════════════ */
.lp-section { padding: 56px 20px; max-width: 720px; margin: 0 auto; }
.lp-divider { height: 1px; background: var(--border); }

/* Sticky bar — bottom fixed */
.lp-sticky { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(8,12,20,0.97); backdrop-filter: blur(12px); border-top: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; z-index: 100; transform: translateY(100%); transition: transform 0.3s ease; }
.lp-sticky.visible { transform: translateY(0); }
.lp-sticky-text { font-size: 13px; color: var(--fg-muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-sticky-text strong { color: var(--fg); font-size: 15px; }
.lp-sticky-cta { background: var(--grad-gold); border: none; border-radius: 10px; padding: 10px 24px; font-size: 14px; font-weight: 800; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; white-space: nowrap; flex-shrink: 0; }

/* Content placeholders */
.content-placeholder { background: rgba(232,185,74,0.08); border: 2px dashed rgba(232,185,74,0.25); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px; }
.cp-icon { font-size: 28px; margin-bottom: 8px; }
.cp-title { font-size: 14px; font-weight: 800; color: var(--gold-light); margin-bottom: 6px; }
.cp-desc { font-size: 12px; color: var(--fg-muted); line-height: 1.6; }
.cp-action { display: inline-block; margin-top: 10px; background: rgba(232,185,74,0.15); border: 1px solid rgba(232,185,74,0.3); border-radius: 6px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: var(--gold-light); letter-spacing: 0.5px; }

/* Hero */
.hero-section { background: #080C14; padding: 44px 20px 40px; text-align: center; position: relative; overflow: hidden; border-bottom: 1px solid var(--border); }
.hero-section::before { content: ''; position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(201,150,74,0.08) 0%, transparent 65%); pointer-events: none; }
.hero-hook { font-size: clamp(24px, 5vw, 40px); font-weight: 900; color: var(--fg); line-height: 1.15; letter-spacing: -1px; margin-bottom: 20px; max-width: 600px; margin-left: auto; margin-right: auto; }
.hero-hook em { background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-style: normal; }

/* VSL */
.vsl-wrap { max-width: 260px; margin: 0 auto 20px; }
.vsl-inner { border-radius: 16px; overflow: hidden; border: 1px solid var(--border); aspect-ratio: 9/16; background: var(--card); position: relative; }
.vsl-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; cursor: pointer; }
.vsl-play { width: 56px; height: 56px; border-radius: 50%; background: var(--grad-gold); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #080C14; transition: transform 0.2s; }
.vsl-placeholder:hover .vsl-play { transform: scale(1.1); }
.vsl-label { font-size: 12px; color: var(--fg-muted); font-weight: 600; }
.vsl-time { font-size: 10px; color: rgba(158,153,144,0.5); }
.vsl-badge { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border-radius: 5px; padding: 2px 8px; font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; letter-spacing: 1px; }

/* Hero CTA + stats */
.hero-cta { display: inline-block; background: var(--grad-gold); border: none; border-radius: 14px; padding: 15px 36px; font-size: 17px; font-weight: 800; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; text-decoration: none; transition: opacity 0.2s; margin-bottom: 10px; }
.hero-cta:hover { opacity: 0.85; }
.hero-note { font-size: 12px; color: rgba(158,153,144,0.45); }
.stats-strip { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border); }
.hero-eyebrow { display: inline-block; background: rgba(201,150,74,0.1); border: 1px solid rgba(201,150,74,0.2); border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
.hero-stats { display: flex; justify-content: center; gap: 36px; flex-wrap: wrap; }
.stat-val { font-size: 28px; font-weight: 900; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 11px; color: var(--fg-muted); }

/* Section labels */
.lp-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
.lp-section-title { font-size: clamp(22px, 4vw, 30px); font-weight: 900; color: var(--fg); line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 14px; }
.lp-section-title em { background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-style: normal; }
.lp-section-desc { font-size: 15px; color: var(--fg-muted); line-height: 1.75; margin-bottom: 24px; }

/* Problem */
.problem-list { display: flex; flex-direction: column; gap: 10px; }
.problem-item { display: flex; gap: 14px; align-items: flex-start; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }
.problem-icon { font-size: 20px; flex-shrink: 0; }
.problem-text { font-size: 14px; color: var(--fg-muted); line-height: 1.65; }
.problem-text strong { color: var(--fg); font-weight: 700; }
.lp-agitation { background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.2); border-right: 3px solid #E05555; border-radius: 12px; padding: 18px 22px; margin-top: 14px; }
.lp-agitation-title { font-size: 11px; font-weight: 700; color: #E05555; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 7px; }
.lp-agitation-text { font-size: 14px; color: var(--fg-muted); line-height: 1.7; }
.lp-agitation-text strong { color: var(--fg); font-weight: 700; }

/* Modules accordion */
.modules-list { display: flex; flex-direction: column; gap: 6px; }
.module-acc { background: linear-gradient(145deg, #1D2430, #111620); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.module-acc-btn { width: 100%; background: none; border: none; padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; font-family: 'Assistant', sans-serif; }
.module-acc-left { display: flex; align-items: center; gap: 12px; }
.module-num-badge { background: rgba(201,150,74,0.12); border: 1px solid rgba(201,150,74,0.2); border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: 700; color: var(--gold); flex-shrink: 0; }
.module-acc-title { font-size: 14px; font-weight: 800; color: var(--fg); text-align: right; }
.module-acc-icon { font-size: 16px; color: var(--gold); transition: transform 0.3s; flex-shrink: 0; display: inline-block; }
.module-acc.open .module-acc-icon { transform: rotate(45deg); }
.module-acc-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.module-acc.open .module-acc-body { max-height: 140px; }
.module-acc-desc { padding: 12px 18px 16px; font-size: 13px; color: var(--fg-muted); line-height: 1.6; border-top: 1px solid rgba(44,50,62,0.4); }

/* NFE (not for everyone) */
.nfe-box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 26px; }
.nfe-box-title { font-size: 20px; font-weight: 900; color: var(--fg); margin-bottom: 18px; line-height: 1.3; }
.nfe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.nfe-col-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
.nfe-col-title.red { color: #E05555; }
.nfe-col-title.green { color: #4CAF82; }
.nfe-item { display: flex; gap: 8px; font-size: 13px; color: var(--fg-muted); margin-bottom: 8px; line-height: 1.5; }

/* Hadar box */
.hadar-box { background: linear-gradient(145deg, #1D2430, #111620); border: 1px solid var(--border); border-radius: 16px; padding: 26px; display: flex; gap: 18px; align-items: flex-start; flex-wrap: wrap; }
.hadar-photo-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.hadar-photo-placeholder { font-size: 11px; color: var(--fg-muted); text-align: center; padding: 8px; line-height: 1.3; }
.hadar-name { font-size: 16px; font-weight: 800; color: var(--fg); margin-bottom: 2px; }
.hadar-role { font-size: 11px; color: var(--gold); font-weight: 700; letter-spacing: 0.5px; margin-bottom: 10px; }
.hadar-text { font-size: 13px; color: var(--fg-muted); line-height: 1.7; }
.hadar-text strong { color: var(--fg); font-weight: 700; }

/* Proof */
.proof-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
.proof-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; text-align: center; }
.proof-val { font-size: 24px; font-weight: 900; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 4px; }
.proof-label { font-size: 11px; color: var(--fg-muted); line-height: 1.4; }
.testimonials-list { display: flex; flex-direction: column; gap: 10px; }
.testimonial-card { background: var(--card); border: 1px solid var(--border); border-right: 3px solid var(--gold); border-radius: 12px; padding: 18px 20px; }
.testimonial-photo { width: 40px; height: 40px; border-radius: 50%; background: var(--card-soft); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--fg-muted); text-align: center; flex-shrink: 0; margin-bottom: 10px; }
.testimonial-text { font-size: 14px; color: var(--fg-muted); line-height: 1.7; font-style: italic; margin-bottom: 10px; }
.testimonial-text strong { color: var(--fg); font-style: normal; font-weight: 700; }
.testimonial-author { font-size: 12px; font-weight: 700; color: var(--gold); }
.testimonial-role { font-size: 11px; color: var(--fg-muted); }

/* Price box */
.price-box-new { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 14px; }
.price-top { padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid var(--border); position: relative; }
.price-top::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A); }
.price-tag-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--fg-muted); margin-bottom: 12px; }
.price-amount { display: flex; align-items: flex-start; justify-content: center; gap: 4px; line-height: 1; margin-bottom: 8px; }
.price-currency { font-size: 24px; font-weight: 700; color: var(--gold); margin-top: 10px; }
.price-number { font-size: 72px; font-weight: 900; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -3px; line-height: 1; }
.price-desc { font-size: 13px; color: var(--fg-muted); }
.price-includes { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; border-bottom: 1px solid var(--border); }
.include-item { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--fg-muted); }
.include-check { width: 22px; height: 22px; border-radius: 50%; background: rgba(76,175,130,0.1); border: 1px solid rgba(76,175,130,0.25); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; color: #4CAF82; }
.include-val { font-size: 13px; font-weight: 700; color: var(--gold); flex-shrink: 0; }
.daily-reframe { background: rgba(201,150,74,0.06); padding: 14px 24px; text-align: center; font-size: 14px; color: var(--fg-muted); line-height: 1.6; }
.daily-reframe strong { color: var(--gold); font-weight: 800; }

/* Micro-commitment */
.micro-wrap { margin-top: 8px; }
.progress-container { margin-bottom: 20px; }
.progress-header { display: flex; justify-content: space-between; font-size: 11px; color: var(--fg-muted); margin-bottom: 8px; }
.progress-pct { color: var(--gold); font-weight: 700; }
.progress-track { background: var(--border); border-radius: 99px; height: 5px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--grad-gold); border-radius: 99px; transition: width 0.5s ease; }
.micro-step { display: none; }
.micro-step.active { display: block; animation: stepIn 0.35s ease both; }
@keyframes stepIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
.micro-card { background: var(--card-soft); border: 1px solid var(--border); border-radius: 14px; padding: 22px; text-align: center; }
.micro-step-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
.micro-question { font-size: 16px; font-weight: 800; color: var(--fg); margin-bottom: 18px; line-height: 1.3; }
.micro-options { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 14px; }
.micro-option { background: var(--card); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 600; color: var(--fg-muted); cursor: pointer; font-family: 'Assistant', sans-serif; transition: all 0.2s; border: none; }
.micro-option:hover, .micro-option.selected { outline: 1.5px solid var(--gold); color: var(--gold); background: rgba(201,150,74,0.08); }
.micro-next { display: none; background: var(--grad-gold); border: none; border-radius: 10px; padding: 11px 28px; font-size: 14px; font-weight: 800; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; }
.micro-next.show { display: inline-block; }
.micro-skip { display: block; margin-top: 12px; font-size: 12px; color: var(--fg-muted); text-decoration: underline; cursor: pointer; background: none; border: none; font-family: 'Assistant', sans-serif; width: 100%; text-align: center; }
.micro-result { background: rgba(76,175,130,0.1); border: 1px solid rgba(76,175,130,0.2); border-radius: 10px; padding: 14px 16px; text-align: center; margin-bottom: 14px; font-size: 14px; color: #4CAF82; font-weight: 700; line-height: 1.5; }

/* CTA button */
.lp-cta-btn { display: block; width: 100%; background: var(--grad-gold); border: none; border-radius: 14px; padding: 18px; font-size: 18px; font-weight: 900; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; text-align: center; text-decoration: none; transition: opacity 0.2s; margin-bottom: 10px; line-height: 1.3; }
.lp-cta-btn:hover { opacity: 0.85; }
.lp-cta-note { font-size: 11px; color: var(--fg-muted); text-align: center; line-height: 1.5; }

/* FAQ */
.faq-items { }
.faq-item { border-bottom: 1px solid var(--border); overflow: hidden; }
.faq-q { width: 100%; background: none; border: none; padding: 16px 0; font-size: 15px; font-weight: 700; color: var(--fg); text-align: right; cursor: pointer; font-family: 'Assistant', sans-serif; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.faq-icon { font-size: 18px; color: var(--gold); flex-shrink: 0; transition: transform 0.3s; display: inline-block; }
.faq-item.open .faq-icon { transform: rotate(45deg); }
.faq-a { font-size: 14px; color: var(--fg-muted); line-height: 1.7; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s; }
.faq-item.open .faq-a { max-height: 300px; padding-bottom: 16px; }

/* Final + Footer */
.lp-final { background: #080C14; border-top: 1px solid var(--border); padding: 52px 20px; text-align: center; }
.lp-final-title { font-size: clamp(20px, 4vw, 28px); font-weight: 900; color: var(--fg); line-height: 1.3; margin-bottom: 10px; }
.lp-final-sub { font-size: 14px; color: var(--fg-muted); margin-bottom: 24px; }
.lp-footer { background: #060A10; border-top: 1px solid var(--border); padding: 26px 20px 60px; text-align: center; }
.lp-footer-logo { font-size: 16px; font-weight: 800; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 6px; }
.lp-footer-signal { font-size: 13px; color: rgba(158,153,144,0.3); direction: ltr; }
.lp-footer-signal span { color: var(--gold); }
.lp-footer-links { display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.lp-footer-links a { color: var(--fg-muted); font-size: 12px; text-decoration: none; }
.lp-footer-company { font-size: 11px; color: rgba(158,153,144,0.4); margin-top: 4px; }

@media (max-width: 580px) {
  .proof-grid { grid-template-columns: 1fr 1fr; }
  .nfe-grid { grid-template-columns: 1fr; }
  .hero-stats { gap: 24px; }
  .hadar-box { flex-direction: column; align-items: center; text-align: center; }
}

/* ═══ Atelier landing page ═══ */

/* Hero */
.hero {
  background: #080C14;
  padding: 80px 24px 64px;
  text-align: center;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
}
.hero::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(201,150,74,0.10) 0%, transparent 60%);
  pointer-events: none;
}
.hero-inner { max-width: 720px; margin: 0 auto; position: relative; }

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(201,150,74,0.12);
  border: 1px solid rgba(201,150,74,0.32);
  border-radius: 999px;
  padding: 7px 18px;
  margin-bottom: 28px;
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
  flex-shrink: 0;
}
.eyebrow-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-headline {
  font-size: clamp(32px, 6vw, 56px);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin-bottom: 24px;
  color: var(--fg);
}
.hero-headline em {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-style: normal;
}

.hero-sub {
  font-size: clamp(16px, 2.2vw, 19px);
  color: var(--fg-muted);
  line-height: 1.7;
  margin-bottom: 40px;
  max-width: 580px;
  margin-inline: auto;
}

.hero-cta {
  display: inline-block;
  background: var(--grad-gold);
  color: #1A1206;
  font-size: 16px;
  font-weight: 800;
  padding: 16px 44px;
  border-radius: 999px;
  transition: all 0.25s;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 0 -2px 6px rgba(0,0,0,0.25),
    0 10px 28px rgba(0,0,0,0.35),
    0 0 40px rgba(201,150,74,0.15);
}
.hero-cta:hover { transform: translateY(-2px); }

.hero-note {
  margin-top: 14px;
  font-size: 12px;
  color: rgba(158,153,144,0.6);
  letter-spacing: 0.02em;
}

/* Shared section layout */
.section { padding: 88px 24px; }
.section-inner { max-width: 720px; margin: 0 auto; }
.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 14px;
  text-align: center;
}
.section-title {
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.5px;
  color: var(--fg);
  text-align: center;
  margin-bottom: 20px;
}
.section-title em {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-style: normal;
}
.section-lead {
  font-size: 17px;
  color: var(--fg-muted);
  line-height: 1.75;
  text-align: center;
  margin-bottom: 48px;
  max-width: 580px;
  margin-inline: auto;
}

/* The Shift */
.shift {
  background: linear-gradient(180deg, var(--bg) 0%, #101520 100%);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.shift-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 32px;
  align-items: stretch;
  margin-top: 20px;
}
.shift-col {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px 26px;
}
.shift-col.before { opacity: 0.75; }
.shift-col.after {
  border-color: rgba(201,150,74,0.32);
  background: linear-gradient(145deg, #1D2430, #111620);
}
.shift-col-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.shift-col.before .shift-col-label { color: var(--fg-muted); }
.shift-col.after .shift-col-label { color: var(--gold); }
.shift-col-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--fg);
  margin-bottom: 20px;
  line-height: 1.3;
}
.shift-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.shift-list li {
  font-size: 14px;
  color: var(--fg-muted);
  line-height: 1.6;
  padding-inline-end: 20px;
  position: relative;
}
.shift-col.before .shift-list li::before {
  content: '-';
  position: absolute;
  right: 0;
  top: 0;
  color: rgba(158,153,144,0.4);
}
.shift-col.after .shift-list li::before {
  content: '✦';
  position: absolute;
  right: 0;
  top: 0;
  color: var(--gold);
  font-size: 12px;
}
.shift-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--gold);
}

@media (max-width: 760px) {
  .shift-grid { grid-template-columns: 1fr; gap: 16px; }
  .shift-arrow { transform: rotate(90deg); font-size: 24px; padding: 4px 0; }
}

/* What is atelier */
.what { background: var(--bg); }
.what-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.what-step {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px 26px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  transition: border-color 0.25s;
}
.what-step:hover { border-color: rgba(201,150,74,0.3); }
.what-step-num {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(201,150,74,0.1);
  border: 1px solid rgba(201,150,74,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: var(--gold);
}
.what-step-body { flex: 1; }
.what-step-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--fg);
  margin-bottom: 8px;
}
.what-step-desc {
  font-size: 14px;
  color: var(--fg-muted);
  line-height: 1.7;
}

/* Shiri - living proof */
.shiri {
  background: #101520;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 96px 24px;
}
.shiri-inner { max-width: 760px; margin: 0 auto; }
.shiri-badge {
  display: inline-block;
  background: rgba(201,150,74,0.08);
  border: 1px solid rgba(201,150,74,0.2);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 10px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.shiri-headline {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 20px;
  color: var(--fg);
}
.shiri-headline em {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-style: normal;
}
.shiri-journey {
  margin: 40px 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
}
.shiri-journey-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 28px;
}
.shiri-journey-row:last-child { margin-bottom: 0; }
.shiri-journey-side { text-align: center; }
.shiri-journey-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--fg-muted);
  margin-bottom: 6px;
}
.shiri-journey-text {
  font-size: 15px;
  color: var(--fg);
  font-weight: 600;
  line-height: 1.4;
}
.shiri-journey-text.after { color: var(--gold); }
.shiri-journey-arrow {
  font-size: 20px;
  color: var(--gold);
  opacity: 0.6;
}
.shiri-body {
  font-size: 16px;
  color: var(--fg-muted);
  line-height: 1.85;
  margin-bottom: 24px;
}
.shiri-body strong { color: var(--fg); font-weight: 700; }
.shiri-quote {
  border-right: 3px solid var(--gold);
  padding: 16px 24px;
  background: rgba(201,150,74,0.04);
  border-radius: 0 12px 12px 0;
  margin: 32px 0;
}
.shiri-quote-text {
  font-size: 17px;
  color: var(--fg);
  line-height: 1.75;
  font-style: italic;
  margin-bottom: 12px;
}
.shiri-quote-author {
  font-size: 13px;
  color: var(--gold);
  font-weight: 700;
}
.shiri-visit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--gold);
  font-weight: 700;
  padding: 10px 20px;
  border: 1px solid rgba(201,150,74,0.3);
  border-radius: 999px;
  transition: all 0.2s;
}
.shiri-visit:hover {
  background: rgba(201,150,74,0.08);
  border-color: rgba(201,150,74,0.5);
}

@media (max-width: 580px) {
  .shiri-journey-row { grid-template-columns: 1fr; gap: 12px; }
  .shiri-journey-arrow { transform: rotate(90deg); }
}

/* For whom */
.forwhom { background: var(--bg); }
.forwhom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.forwhom-col {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 26px;
}
.forwhom-col.yes { border-color: rgba(76,175,130,0.22); }
.forwhom-col.no  { border-color: rgba(224,85,85,0.22); }
.forwhom-col-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.forwhom-col.yes .forwhom-col-label { color: #4CAF82; }
.forwhom-col.no  .forwhom-col-label { color: #E05555; }
.forwhom-col-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--fg);
  margin-bottom: 20px;
  line-height: 1.3;
}
.forwhom-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.forwhom-list li {
  font-size: 14px;
  color: var(--fg-muted);
  line-height: 1.6;
  padding-inline-end: 24px;
  position: relative;
}
.forwhom-col.yes li::before {
  content: '✓';
  position: absolute;
  right: 0;
  color: #4CAF82;
  font-weight: 900;
}
.forwhom-col.no li::before {
  content: '×';
  position: absolute;
  right: 0;
  color: #E05555;
  font-weight: 900;
  font-size: 18px;
  line-height: 1;
  top: 1px;
}

@media (max-width: 720px) {
  .forwhom-grid { grid-template-columns: 1fr; }
}

/* Process */
.process {
  background: linear-gradient(180deg, var(--bg) 0%, #101520 100%);
  border-top: 1px solid var(--border);
}
.process-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.process-step {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 18px;
  text-align: center;
}
.process-step-num {
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  background: var(--grad-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.3;
  margin-bottom: 10px;
}
.process-step-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--fg);
  margin-bottom: 8px;
  line-height: 1.3;
}
.process-step-desc {
  font-size: 12px;
  color: var(--fg-muted);
  line-height: 1.55;
}

@media (max-width: 720px) {
  .process-steps { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 420px) {
  .process-steps { grid-template-columns: 1fr; }
}

/* Team */
.team {
  background: var(--bg);
  border-top: 1px solid var(--border);
}
.team-card {
  background: linear-gradient(145deg, #1D2430, #111620);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px 32px;
}
.team-duo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}
.team-person { text-align: center; }
.team-photo-placeholder {
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(232,185,74,0.15), rgba(158,124,58,0.15));
  border: 2px solid rgba(201,150,74,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--fg-muted);
  text-align: center;
  padding: 12px;
  line-height: 1.4;
}
.team-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--fg);
  margin-bottom: 4px;
}
.team-role {
  font-size: 12px;
  color: var(--gold);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.team-desc {
  font-size: 13px;
  color: var(--fg-muted);
  line-height: 1.6;
}
.team-together {
  padding-top: 28px;
  border-top: 1px solid var(--border);
  text-align: center;
}
.team-together-text {
  font-size: 16px;
  color: var(--fg);
  line-height: 1.75;
  font-weight: 500;
}
.team-together-text em {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-style: normal;
  font-weight: 800;
}

@media (max-width: 580px) {
  .team-duo { grid-template-columns: 1fr; gap: 28px; }
}

/* FAQ */
.faq { background: var(--bg); }
.faq-items {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
}
.faq-item { border-bottom: 1px solid var(--border); }
.faq-q {
  width: 100%;
  padding: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  text-align: right;
  font-size: 16px;
  font-weight: 700;
  color: var(--fg);
  font-family: inherit;
  background: none;
  border: none;
  cursor: pointer;
}
.faq-icon {
  font-size: 20px;
  color: var(--gold);
  transition: transform 0.3s;
  flex-shrink: 0;
}
.faq-item.open .faq-icon { transform: rotate(45deg); }
.faq-a {
  font-size: 15px;
  color: var(--fg-muted);
  line-height: 1.8;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, padding 0.35s ease;
}
.faq-item.open .faq-a {
  max-height: 400px;
  padding-bottom: 20px;
}

/* Form */
.form-section {
  background: #080C14;
  border-top: 1px solid var(--border);
  padding: 96px 24px;
}
.form-inner {
  max-width: 540px;
  margin: 0 auto;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 44px 36px;
  position: relative;
  overflow: hidden;
}
.form-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--grad-gold);
}
.form-title {
  font-size: 26px;
  font-weight: 900;
  color: var(--fg);
  margin-bottom: 12px;
  text-align: center;
  line-height: 1.3;
}
.form-desc {
  font-size: 15px;
  color: var(--fg-muted);
  line-height: 1.7;
  text-align: center;
  margin-bottom: 32px;
}
.form-field { margin-bottom: 16px; }
.form-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--fg-muted);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}
.form-input,
.form-textarea {
  width: 100%;
  background: #080C14;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--fg);
  font-size: 15px;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(201,150,74,0.5);
}
.form-textarea {
  min-height: 100px;
  resize: vertical;
}
.form-submit {
  width: 100%;
  background: var(--grad-gold);
  color: #1A1206;
  font-size: 16px;
  font-weight: 900;
  padding: 16px;
  border-radius: 12px;
  margin-top: 8px;
  transition: all 0.25s;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.form-submit:hover:not(:disabled) { transform: translateY(-2px); }
.form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.form-privacy {
  font-size: 12px;
  color: rgba(158,153,144,0.55);
  text-align: center;
  margin-top: 14px;
  line-height: 1.6;
}

/* Footer note */
.footer-note {
  background: #080C14;
  padding: 28px 24px 40px;
  text-align: center;
  font-size: 12px;
  color: rgba(158,153,144,0.4);
}
.footer-note p { margin-bottom: 4px; }
```

---

## All Supabase migrations
```
total 160
drwxr-xr-x  21 work  staff   672 Apr 17 11:34 .
drwxr-xr-x   5 work  staff   160 Mar 28 01:23 ..
-rw-r--r--   1 work  staff  2222 Mar 28 01:23 002_email_sequences.sql
-rw-r--r--   1 work  staff  1085 Mar 28 01:45 003_bookings.sql
-rw-r--r--   1 work  staff  1031 Mar 28 03:23 004_course.sql
-rw-r--r--   1 work  staff   359 Mar 28 09:15 005_partnership.sql
-rw-r--r--   1 work  staff   228 Mar 28 10:38 006_consent.sql
-rw-r--r--   1 work  staff  1189 Mar 28 16:35 007_hive.sql
-rw-r--r--   1 work  staff   252 Mar 31 16:08 008_product_enum.sql
-rw-r--r--   1 work  staff   658 Mar 31 18:05 009_video_analytics.sql
-rw-r--r--   1 work  staff  6642 Apr  1 11:26 010_ab_proposals.sql
-rw-r--r--   1 work  staff   864 Apr  1 15:30 011_video_events.sql
-rw-r--r--   1 work  staff   897 Apr  1 16:55 012_quiz_results.sql
-rw-r--r--   1 work  staff  1182 Apr  3 19:08 013_crm.sql
-rw-r--r--   1 work  staff   748 Apr  7 23:23 014_auth.sql
-rw-r--r--   1 work  staff   648 Apr  8 02:07 015_hive_content.sql
-rw-r--r--   1 work  staff   259 Apr  8 02:58 016_amount_paid.sql
-rw-r--r--   1 work  staff   938 Apr  9 21:12 017_user_insights.sql
-rw-r--r--   1 work  staff   210 Apr 14 12:26 018_invoice_number.sql
-rw-r--r--   1 work  staff   202 Apr 15 08:26 019_invoice_link.sql
-rw-r--r--   1 work  staff  1215 Apr 17 11:34 020_atelier_applications.sql
```

## First migration (for structure reference)
```sql
-- ============================================================
-- Migration 002: Email automation sequences
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Sequence 2: Challenge buyers (immediate access + day-7 workshop upsell)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
VALUES
  ('CHALLENGE_PURCHASED',  0,    'הגישה שלך לצ׳אלנג׳ 7 הימים מוכנה!',       'challenge_access'),
  ('CHALLENGE_PURCHASED',  168,  'יום 7: מה השגת? + ההצעה הבאה שלך',          'challenge_upsell_workshop');

-- Sequence 3: Workshop buyers (immediate confirmation + day-7 strategy upsell)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
VALUES
  ('WORKSHOP_PURCHASED',   0,    'ההרשמה לסדנה אושרה! הנה כל הפרטים',         'workshop_confirmation'),
  ('WORKSHOP_PURCHASED',   168,  'שבוע אחרי הסדנה — מה עכשיו?',               'workshop_upsell_strategy');

-- Sequence 4: Abandoned checkout (1h + 24h with coupon)
-- Only insert if they don't already exist from schema.sql
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
SELECT 'CHECKOUT_STARTED', 1,  'שכחת משהו... המקום עדיין שמור לך',            'cart_abandon_1h'
WHERE NOT EXISTS (
  SELECT 1 FROM email_sequences
  WHERE trigger_event = 'CHECKOUT_STARTED' AND delay_hours = 1
);

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
SELECT 'CHECKOUT_STARTED', 24, 'אחרון — קוד הנחה 10% בפנים',                  'cart_abandon_24h'
WHERE NOT EXISTS (
  SELECT 1 FROM email_sequences
  WHERE trigger_event = 'CHECKOUT_STARTED' AND delay_hours = 24
);

-- Sequence 5: Re-engagement (fired by job runner for 3-day inactive users)
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key)
VALUES
  ('INACTIVE_3_DAYS',      0,    'התגעגענו אליך',                               'reengagement');

-- Verify
SELECT trigger_event, delay_hours, template_key, active
FROM email_sequences
ORDER BY trigger_event, delay_hours;
```

## Latest migration (020 atelier applications)
```sql
-- beegood atelier - application submissions from /atelier page
-- These are prospective clients requesting a discovery call, NOT paying customers.

create table public.atelier_applications (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  phone               text not null,
  instagram           text not null,
  story               text not null,
  status              text not null default 'new',
  source_utm          jsonb,
  ip_address          text,
  user_agent          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  reviewed_at         timestamptz,
  call_scheduled_at   timestamptz,
  notes               text,
  constraint atelier_status_valid check (
    status in ('new', 'reviewing', 'call_scheduled', 'accepted', 'rejected', 'not_a_fit')
  )
);

create index atelier_applications_status_idx   on public.atelier_applications(status);
create index atelier_applications_created_idx  on public.atelier_applications(created_at desc);

-- No RLS policies - accessed only via service role from API routes
alter table public.atelier_applications enable row level security;
```

---

## lib/ structure (all files)
```
lib/ab.ts
lib/admin/ab-agent.ts
lib/admin/queries.ts
lib/admin/types.ts
lib/analytics.ts
lib/auth/link-user.ts
lib/challenge-config.ts
lib/course-config.ts
lib/credit.ts
lib/email/templates.ts
lib/jobs/handlers/notify-admin.ts
lib/jobs/handlers/send-email.ts
lib/jobs/runner.ts
lib/products.ts
lib/quiz-config.ts
lib/quiz-narrative.ts
lib/quiz-session.ts
lib/rate-limit.ts
lib/supabase/browser.ts
lib/supabase/middleware-client.ts
lib/supabase/server.ts
lib/supabase/types.ts
lib/training-views.ts
lib/validations.ts
```

## lib/supabase/server.ts
```ts
/**
 * Server-side Supabase client - uses the SERVICE ROLE key.
 * Never import this in client components. Only use in:
 *   - Route Handlers (app/api/**)
 *   - Server Actions
 *   - Server Components that need elevated access
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

## All pages in app/ (list)
```
app/about/page.tsx
app/accessibility/page.tsx
app/account/page.tsx
app/account/redeem/page.tsx
app/admin/abtesting/page.tsx
app/admin/acquisition/page.tsx
app/admin/atelier/page.tsx
app/admin/bookings/page.tsx
app/admin/community/page.tsx
app/admin/crm/page.tsx
app/admin/email/page.tsx
app/admin/funnel/page.tsx
app/admin/leads/page.tsx
app/admin/mmm/page.tsx
app/admin/page.tsx
app/admin/products/page.tsx
app/admin/sales/page.tsx
app/admin/system/page.tsx
app/admin/users/[id]/page.tsx
app/admin/video/page.tsx
app/atelier/page.tsx
app/binge/page.tsx
app/call/page.tsx
app/challenge/content/page.tsx
app/challenge/page.tsx
app/challenge/success/page.tsx
app/challenge/thank-you/page.tsx
app/course/content/page.tsx
app/course/page.tsx
app/course/success/page.tsx
app/forgot-password/page.tsx
app/hive/members/page.tsx
app/hive/page.tsx
app/hive/terms/page.tsx
app/login/page.tsx
app/members/page.tsx
app/method/page.tsx
app/my/page.tsx
app/page.tsx
app/partnership/page.tsx
app/premium/page.tsx
app/premium/success/page.tsx
app/press/page.tsx
app/privacy/page.tsx
app/quiz/page.tsx
app/reset-password/page.tsx
app/signup/page.tsx
app/strategy/book/page.tsx
app/strategy/page.tsx
app/strategy/success/page.tsx
app/team/page.tsx
app/terms/page.tsx
app/test/page.tsx
app/test/success/page.tsx
app/thank-you/page.tsx
app/training/page.tsx
app/training/watch/page.tsx
app/unsubscribe/page.tsx
app/workshop/page.tsx
app/workshop/success/page.tsx
```

---

## HARDCODED REFERENCES AUDIT

### 'הדר דנן' occurrences in app/
```
app/atelier/AtelierLandingClient.tsx:319:                  <img src="/hadarprotrait.png" alt="הדר דנן" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
app/atelier/AtelierLandingClient.tsx:321:                <div className="team-name">הדר דנן</div>
app/workshop/success/page.tsx:4:  title: "נרשמת לסדנה! | הדר דנן",
app/workshop/page.tsx:18:  title: "סדנה יום אחד | הדר דנן",
app/workshop/page.tsx:33:        description="יום אחד אינטנסיבי שבונה מערכת שיווק שרצה לבד. מתודולוגיה קונקרטית עם הדר דנן."
app/workshop/page.tsx:89:        whoName="הדר דנן"
app/course/success/page.tsx:4:  title: "גישה לקורס מוכנה! | הדר דנן",
app/course/CourseLandingClient.tsx:284:        <h2 className="lp-section-title">הדר דנן - מעורבת אישית</h2>
app/course/CourseLandingClient.tsx:290:            <div className="hadar-name">הדר דנן</div>
app/course/CourseLandingClient.tsx:517:        <div className="lp-footer-logo">הדר דנן</div>
app/course/page.tsx:8:  title: "קורס בידול מותג אישי - 8 מודולים | הדר דנן",
app/course/page.tsx:30:        description="8 מודולים, 16 שיעורים. שיטת TrueSignal של הדר דנן שעברו דרכה 3,500+ עסקים."
app/privacy/page.tsx:4:  title: "מדיניות פרטיות | הדר דנן",
app/privacy/page.tsx:24:            הדר דנן בע״מ, המפעילה את האתר beegood.online ("החברה", "אנחנו", "אנו"), מחויבת להגן על פרטיותך. מדיניות זו מסבירה אילו מידע אנחנו אוספים, כיצד אנחנו משתמשים בו, עם מי אנחנו משתפים אותו, ומהן זכויותיך לגביו. השימוש באתר ובשירותים מהווה הסכמה למדיניות פרטיות זו.
app/privacy/page.tsx:152:          <p>הדר דנן בע״מ | ח.פ. 516791555</p>
app/thank-you/page.tsx:4:  title: "נרשמת בהצלחה | הדר דנן",
app/thank-you/page.tsx:8:  "הצטרפתי להדרכה החינמית של הדר דנן - למד איך לייצר סרטונים שמביאים לקוחות. כדאי לך להצטרף גם: " +
app/thank-you/page.tsx:21:        <span className="font-black text-xl" style={{ color: "#C9964A" }}>הדר דנן</span>
app/test/success/page.tsx:4:  title: "תשלום הטסט עבר! | הדר דנן",
app/test/page.tsx:5:  title: "מוצר טסט | הדר דנן",
app/test/page.tsx:48:        <p>© {new Date().getFullYear()} הדר דנן בע״מ ·{" "}
app/training/watch/page.tsx:10:  title: "הדרכה חינמית - צפייה | הדר דנן",
app/training/watch/page.tsx:11:  description: "צפה בהדרכה החינמית של הדר דנן: למה השיווק שלך לא עובד - ומה לעשות עם זה.",
app/training/page.tsx:8:  title: "הדרכה חינמית | הדר דנן",
app/training/page.tsx:9:  description: "גלה למה השיווק שלך לא עובד - ומה לעשות עם זה. הדרכה חינמית של הדר דנן, 20 דקות שמשנות גישה.",
app/training/page.tsx:56:      whoName="הדר דנן"
app/press/page.tsx:7:  title: "הדר דנן בתקשורת | כתבות, פודקאסטים ורשתות חברתיות",
app/press/page.tsx:8:  description: "הדר דנן בתקשורת הישראלית: כתבות ב-ynet, N12 ווואלה, פודקאסט עצמאי וריאיונות בפודקאסטים מובילים.",
app/press/page.tsx:15:  "name": "הדר דנן בתקשורת",
app/press/page.tsx:19:    "name": "הדר דנן",
app/press/page.tsx:106:              הדר דנן בתקשורת
app/press/page.tsx:150:            <h2 className="press-h2">הפודקאסט של הדר דנן — הכל על במה אחת</h2>
app/terms/page.tsx:4:  title: "תנאי שימוש | הדר דנן",
app/terms/page.tsx:24:            השימוש באתר beegood.online ובשירותים המוצעים על ידי הדר דנן בע״מ ("החברה") מהווה הסכמה מלאה לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש באתר.
app/terms/page.tsx:34:            <li><B>פגישת אסטרטגיה</B> - פגישה אישית עם הדר דנן</li>
app/terms/page.tsx:109:            כל התכנים באתר, לרבות טקסטים, תמונות, סרטונים, מצגות, שם המותג "הדר דנן", "Bee Good" ו-"TrueSignal", הינם רכושה הבלעדי של החברה ומוגנים בזכויות יוצרים ובדיני קניין רוחני. אין להעתיק, לשכפל, להפיץ או לעשות כל שימוש מסחרי בתכנים ללא אישור מפורש בכתב.
app/terms/page.tsx:132:          <p>הדר דנן בע״מ | ח.פ. 516791555</p>
app/admin/users/[id]/actions.ts:52:      subject:      subjects[templateKey] ?? "הודעה מהדר דנן",
app/admin/page.tsx:154:        <div className="hub-header">ניהול - הדר דנן</div>
app/quiz/page.tsx:9:  title: "גלה את הצעד הנכון עבורך | הדר דנן",
```

### 'beegood.online' occurrences in app/
```
app/robots.ts:3:const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/atelier/AtelierLandingClient.tsx:165:                <div className="what-step-desc">אתר מלא תחת הדומיין שלך תחת beegood.online - קוויז, קורסים, סדנאות, מנויים, קהילה. הכל בבעלותך המלאה. הכל חי תוך ימים, לא חודשים.</div>
app/atelier/AtelierLandingClient.tsx:216:            href="https://shirifadlon.beegood.online"
app/atelier/AtelierLandingClient.tsx:285:              <div className="process-step-desc">אתר מלא תחת beegood.online, נרטיב, מוצרים, הכל בעבודה צמודה איתך.</div>
app/atelier/page.tsx:16:  { question: "מה הבעלות שלי על האתר והתכנים?", answer: "מלאה. התכנים שלך, הדומיין הוא שלך (אנחנו מארחים אותו תחת beegood.online), חשבון Cardcom הוא שלך, הכסף נכנס אלייך ישירות. אנחנו שותפים להצלחה דרך עמלה חודשית, לא בעלים." },
app/atelier/page.tsx:22:  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/atelier/page.tsx:29:        description="סדנת אמן לאסטרטגיה ותוכן. עובדים עם מספר מצומצם של משפיעניות נבחרות - דיוק בידול לפי שיטת TrueSignal, בניית נרטיב, הקמת פלטפורמה דיגיטלית מלאה תחת beegood.online, וליווי מתמשך."
app/workshop/page.tsx:26:  const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/course/page.tsx:23:  const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/privacy/page.tsx:24:            הדר דנן בע״מ, המפעילה את האתר beegood.online ("החברה", "אנחנו", "אנו"), מחויבת להגן על פרטיותך. מדיניות זו מסבירה אילו מידע אנחנו אוספים, כיצד אנחנו משתמשים בו, עם מי אנחנו משתפים אותו, ומהן זכויותיך לגביו. השימוש באתר ובשירותים מהווה הסכמה למדיניות פרטיות זו.
app/privacy/page.tsx:156:          <p>אתר: beegood.online</p>
app/press/page.tsx:4:const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/terms/page.tsx:24:            השימוש באתר beegood.online ובשירותים המוצעים על ידי הדר דנן בע״מ ("החברה") מהווה הסכמה מלאה לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש באתר.
app/terms/page.tsx:136:          <p>אתר: beegood.online</p>
app/about/page.tsx:4:const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/team/page.tsx:112:          href="mailto:hadar@beegood.online"
app/team/page.tsx:140:          <a href="mailto:hadar@beegood.online" className="hover:text-[#EDE9E1] transition">
app/team/page.tsx:141:            hadar@beegood.online
app/sitemap.ts:3:const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/layout.tsx:18:const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/layout.tsx:26:const OG_IMAGE = "https://beegood.online/og-image.jpg";
app/hive/HivePricingSection.tsx:386:                  href="mailto:hive@beegood.online"
app/hive/HivePricingSection.tsx:390:                  hive@beegood.online
app/hive/HiveJoinForm.tsx:292:                  href="mailto:hive@beegood.online"
app/hive/HiveJoinForm.tsx:296:                  hive@beegood.online
app/hive/terms/page.tsx:124:                  href="mailto:hive@beegood.online"
app/hive/terms/page.tsx:128:                  hive@beegood.online
app/hive/terms/page.tsx:170:              href="mailto:hive@beegood.online"
app/hive/terms/page.tsx:174:              hive@beegood.online
app/api/checkout/route.ts:68:  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";
app/challenge/page.tsx:27:  const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/accessibility/page.tsx:130:                  href="mailto:נגישות@beegood.online"
app/accessibility/page.tsx:134:                  נגישות@beegood.online
app/accessibility/page.tsx:142:                  href="mailto:hadar@beegood.online"
app/accessibility/page.tsx:146:                  hadar@beegood.online
app/premium/page.tsx:34:  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/method/page.tsx:6:const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
app/strategy/page.tsx:25:  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
```

### 'TrueSignal' occurrences in app/
```
app/atelier/AtelierLandingClient.tsx:151:                <div className="what-step-desc">שיטת TrueSignal - שלוש פגישות עם הדר שמוציאות החוצה את מה שאת באמת. לא מה שהשוק רוצה לשמוע, לא מה שעובד ברשת - את. זה הלב של כל מה שיבוא אחרי.</div>
app/atelier/AtelierLandingClient.tsx:280:              <div className="process-step-desc">שלוש פגישות עם הדר. שיטת TrueSignal. מוציאים את מי שאת באמת.</div>
app/atelier/AtelierLandingClient.tsx:324:                  חדה, אינטואיטיבית, יודעת לאסוף נקודות ולחבר אותן לתמונה שלמה. 70K עוקבים ו-3,500 עסקים שעברו דרכה יודעים: היא שומעת מה שלא אומרים, ומחזירה לך את מי שאת בבהירות שלא היתה שם קודם. יוצרת שיטת TrueSignal.
app/atelier/page.tsx:29:        description="סדנת אמן לאסטרטגיה ותוכן. עובדים עם מספר מצומצם של משפיעניות נבחרות - דיוק בידול לפי שיטת TrueSignal, בניית נרטיב, הקמת פלטפורמה דיגיטלית מלאה תחת beegood.online, וליווי מתמשך."
app/workshop/page.tsx:10:  { question: "מה זה סדנת יום אחד?", answer: "סדנת יום אחד היא וורקשופ אינטנסיבי של 6 שעות מבוסס שיטת TrueSignal. בסדנה בונים ביחד את תשתית השיווק של העסק — מאסטרטגיית תוכן שנתית, מיתוג אישי, משפך מכירות אוטומטי ועד מדידה ואופטימיזציה. יוצאים עם מערכת שיווק שעובדת." },
app/workshop/page.tsx:32:        name="סדנה יום אחד - שיטת TrueSignal"
app/workshop/page.tsx:50:        definitionBlock="סדנת יום אחד היא וורקשופ אינטנסיבי של 6 שעות מבוסס שיטת TrueSignal. 6 מודולים שבונים ביחד את מערכת השיווק של העסק — אסטרטגיית תוכן לשנה, מיתוג אישי, משפך מכירות אוטומטי ופרסום ממומן. 250+ עסקים כבר יישמו את השיטה עם 40% גידול ממוצע בהכנסה."
app/course/content/CoursePlayer.tsx:318:            קורס TrueSignal דיגיטלי
app/course/CourseLandingClient.tsx:9:  { num: '01', title: 'למה אתה באמת שונה',    desc: 'מגלים את ה-TrueSignal שלך - הדבר שאף אחד אחר לא עושה כמוך.' },
app/course/CourseLandingClient.tsx:291:            <div className="hadar-role">מייסדת TrueSignal - מומחית בידול מותג אישי</div>
app/course/CourseLandingClient.tsx:518:        <div className="lp-footer-signal">אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr">TrueSignal©</span></div>
app/course/page.tsx:29:        name="קורס בידול מותג אישי - שיטת TrueSignal"
app/course/page.tsx:30:        description="8 מודולים, 16 שיעורים. שיטת TrueSignal של הדר דנן שעברו דרכה 3,500+ עסקים."
app/course/page.tsx:52:        קורס בידול מותג אישי הוא קורס דיגיטלי של 8 מודולים ו-16 שיעורים המבוסס על שיטת TrueSignal. הקורס מלמד בעלי עסקים לאתר את הבידול האמיתי שלהם, לבנות מסר שמוכר ולהפוך תוכן ללידים. 3,500+ עסקים כבר יישמו את השיטה. גישה לנצח, ₪1,800 תשלום חד-פעמי.
app/test/page.tsx:46:          <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
app/training/page.tsx:58:      whoText="יצרתי את ההדרכה הזו כנקודת כניסה לשיטת TrueSignal. 20 דקות שמראות למה רוב השיווק מרגיש מזויף - ואיך לתקן את זה."
app/press/page.tsx:113:              על שיווק אותנטי, TrueSignal ועל הדרך מבייביסיטר לבניית מותג.
app/terms/page.tsx:109:            כל התכנים באתר, לרבות טקסטים, תמונות, סרטונים, מצגות, שם המותג "הדר דנן", "Bee Good" ו-"TrueSignal", הינם רכושה הבלעדי של החברה ומוגנים בזכויות יוצרים ובדיני קניין רוחני. אין להעתיק, לשכפל, להפיץ או לעשות כל שימוש מסחרי בתכנים ללא אישור מפורש בכתב.
app/admin/users/[id]/TrueSignalCard.tsx:54:export function TrueSignalCard({ userId }: { userId: string }) {
app/admin/users/[id]/TrueSignalCard.tsx:80:        console.warn("[TrueSignal] initial cache load failed:", e);
app/admin/users/[id]/TrueSignalCard.tsx:189:                תיק אבחון <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
app/admin/users/[id]/TrueSignalCard.tsx:279:              תיק אבחון <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
app/admin/users/[id]/page.tsx:7:import { TrueSignalCard } from "./TrueSignalCard";
app/admin/users/[id]/page.tsx:484:          {/* ── TrueSignal diagnosis ──────────────────────────────────── */}
app/admin/users/[id]/page.tsx:485:          <TrueSignalCard userId={user.id} />
```

### Santosha color occurrences count
```
E8B94A:      157
C9964A:      142
9E7C3A:       74
080C14:       68
141820:       43
```

### Email templates count
```
lib/jobs/handlers/send-email.ts
lib/email
lib/email/templates.ts
```
