import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import Script from "next/script";
import { headers, cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import "./globals.css";
import { Pixels }              from "@/components/analytics/Pixels";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { MobileNavServer }     from "@/components/MobileNavServer";
import { DesktopNavServer }    from "@/components/DesktopNavServer";
import { HiveFloatBarServer }  from "@/components/HiveFloatBarServer";
import { LayoutShell }         from "@/components/LayoutShell";
import { SignalReturnBannerServer } from "@/components/SignalReturnBannerServer";
import { SchemaMarkup }        from "@/components/SchemaMarkup";

function buildAamData(u: {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}): Record<string, string> {
  const data: Record<string, string> = { country: "il" };
  if (u.email) data.em = u.email.trim().toLowerCase();
  if (u.phone) {
    const digits = u.phone.replace(/\D/g, "");
    data.ph = digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  }
  if (u.name) {
    const parts = u.name.trim().toLowerCase().split(/\s+/);
    if (parts[0]) data.fn = parts[0];
    if (parts.length > 1) data.ln = parts.slice(1).join(" ");
  }
  if (u.id) data.external_id = u.id;
  return data;
}

const assistant = Assistant({
  subsets:  ["hebrew", "latin"],
  variable: "--font-assistant",
  display:  "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const OG_IMAGE = "https://beegood.online/og-image.jpg";

const TITLE       = "הדר דנן | שיטת TrueSignal© - שיווק אותנטי לעסקים";
const DESCRIPTION = "הדר דנן, מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal©. קורסים, סדנאות וליווי אישי לבעלי עסקים שרוצים לשווק בלי לאבד את עצמם.";

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
  icons: {
    icon:  [
      { url: "/favicon.ico",   sizes: "any" },
      { url: "/icon-192.png",  sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "/";
  const isEn = pathname.startsWith("/en");

  let aamData: Record<string, string> = {};
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createSSRClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
    if (authUser) {
      const db = createServerClient();
      const { data: u } = await db
        .from("users")
        .select("id, email, phone, name, marketing_consent")
        .eq("auth_id", authUser.id)
        .maybeSingle();
      if (u?.marketing_consent) aamData = buildAamData(u);
    }
  } catch {
    // Auth or DB lookup failed — fall back to empty AAM (anonymous behavior)
  }

  return (
    <html
      lang={isEn ? "en" : "he"}
      dir={isEn ? "ltr" : "rtl"}
      className={`${assistant.variable} h-full`}
    >
      <meta name="facebook-domain-verification" content="remqmo1rv45m6h18tkiu3r15mki3bs" />
      {!isEn && (
        <>
          {/* LCP preload — mobile hero image must be discovered before JS runs */}
          <link rel="preload" as="image" href="/_next/image?url=%2Fhadar1.jpg&w=828&q=80" media="(max-width: 767px)" fetchPriority="high" />
          <link rel="preload" as="image" href="/_next/image?url=%2Fhadar1.jpg&w=1080&q=80" media="(min-width: 768px)" fetchPriority="high" />
        </>
      )}
      {(() => {
        // /en pages report to the dedicated US pixel when configured — the
        // English funnel optimizes on its own audience, the Israeli pixel
        // stays clean. Falls back to the main pixel until the EN one is set.
        const activePixelId = isEn
          ? (process.env.NEXT_PUBLIC_META_PIXEL_ID_EN || process.env.NEXT_PUBLIC_META_PIXEL_ID)
          : process.env.NEXT_PUBLIC_META_PIXEL_ID;
        if (!activePixelId) return null;
        return (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${activePixelId}',${JSON.stringify(aamData)});fbq('track','PageView');`}</Script>
            <noscript><img height="1" width="1" style={{display:"none"}} src={`https://www.facebook.com/tr?id=${activePixelId}&ev=PageView&noscript=1`} alt="" /></noscript>
          </>
        );
      })()}
      <body
        className={`min-h-full flex flex-col antialiased ${isEn ? "" : "font-assistant"}`}
        style={{ background: isEn ? "#FBFBF9" : "#101520", color: isEn ? "#0F1011" : "#EDE9E1" }}
      >
        {!isEn && <SchemaMarkup />}
        {!isEn && <a href="#main-content" className="skip-link">דלג לתוכן הראשי</a>}
        <Pixels />
        {!isEn && <AccessibilityWidget />}
        {!isEn && <HiveFloatBarServer />}
        {!isEn && <SignalReturnBannerServer />}
        <LayoutShell nav={<><MobileNavServer /><DesktopNavServer /></>}>
          <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
