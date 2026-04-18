import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getTenant }              from "@/lib/tenant";
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

// Fallbacks used if getTenant() fails (DB down, hadar row missing).
const FALLBACK_TITLE    = "הדר דנן | שיטת TrueSignal by BeeGood - שיווק אותנטי לעסקים";
const FALLBACK_DESC     = "הדר דנן, מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal by BeeGood. קורסים, סדנאות וליווי אישי לבעלי עסקים שרוצים לשווק בלי לאבד את עצמם.";
const FALLBACK_OG_IMAGE = "https://beegood.online/og-image.jpg";
const FALLBACK_TEMPLATE = "%s | הדר דנן";
const FALLBACK_GTM      = "G-L76SZ1SCS1";

export async function generateMetadata(): Promise<Metadata> {
  let title    = FALLBACK_TITLE;
  let desc     = FALLBACK_DESC;
  let ogImage  = FALLBACK_OG_IMAGE;
  let template = FALLBACK_TEMPLATE;
  let siteName = "הדר דנן | BeeGood";
  let locale   = "he_IL";

  try {
    const tenant  = await getTenant();
    const content = tenant.content ?? {};
    const brand   = tenant.branding ?? {};
    title    = (content["title"]          as string) ?? FALLBACK_TITLE;
    desc     = (content["description"]    as string) ?? FALLBACK_DESC;
    ogImage  = (brand["og_image"]         as string) ?? FALLBACK_OG_IMAGE;
    template = (content["title_template"] as string) ?? FALLBACK_TEMPLATE;
    siteName = (content["site_name"]      as string) ?? siteName;
    locale   = (content["locale"]         as string) ?? locale;
  } catch (err) {
    console.error("[layout] getTenant() failed, using fallback metadata:", err);
  }

  return {
    title: {
      default:  title,
      template,
    },
    description: desc,
    metadataBase: new URL(APP_URL),
    alternates: {
      canonical: APP_URL,
    },
    openGraph: {
      type:        "website",
      locale,
      siteName,
      title,
      description: desc,
      url:         APP_URL,
      images:      [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description: desc,
      images:      [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let gtmId = FALLBACK_GTM;
  try {
    const tenant    = await getTenant();
    const analytics = tenant.analytics ?? {};
    gtmId = (analytics["gtm_id"] as string) ?? FALLBACK_GTM;
  } catch {
    // GTM falls back silently — analytics loss, not a broken page
  }

  return (
    <html
      lang="he"
      dir="rtl"
      className={`${assistant.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-assistant antialiased" style={{ background: "#101520", color: "#EDE9E1" }}>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtmId}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtmId}');
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
