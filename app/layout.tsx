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
      <link rel="preload" href="/hadar1.jpg" as="image" type="image/jpeg" />
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
