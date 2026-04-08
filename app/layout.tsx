import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";
import { Pixels }              from "@/components/analytics/Pixels";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { MobileNavServer }     from "@/components/MobileNavServer";
import { DesktopNav }          from "@/components/DesktopNav";

const assistant = Assistant({
  subsets:  ["hebrew", "latin"],
  variable: "--font-assistant",
  display:  "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hadar-danan.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const OG_IMAGE = "https://beegood.online/og-image.jpg";

export const metadata: Metadata = {
  title: {
    default:  "הדר דנן | אסטרטגיה שיווקית שמביאה תוצאות",
    template: "%s | הדר דנן",
  },
  description: "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת - ולבנות שיווק שמרגיש טבעי ומביא תוצאות",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type:        "website",
    locale:      "he_IL",
    siteName:    "הדר דנן",
    title:       "הדר דנן | אסטרטגיה שיווקית שמביאה תוצאות",
    description: "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת - ולבנות שיווק שמרגיש טבעי ומביא תוצאות",
    url:         APP_URL,
    images:      [{ url: OG_IMAGE, width: 1200, height: 630, alt: "הדר דנן | אסטרטגיה שיווקית שמביאה תוצאות" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "הדר דנן | אסטרטגיה שיווקית שמביאה תוצאות",
    description: "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת - ולבנות שיווק שמרגיש טבעי ומביא תוצאות",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "הדר דנן",
            "url": APP_URL,
            "jobTitle": "אסטרטגית שיווק ותוכן",
            "description": "מייסדת שיטת TrueSignal© - אסטרטגיה שיווקית שמביאה לקוחות אמיתיים.",
            "knowsAbout": ["שיווק דיגיטלי", "אסטרטגיה עסקית", "יצירת תוכן", "מיתוג אישי"],
            "offers": [
              { "@type": "Offer", "name": "אתגר 7 ימים", "price": "197", "priceCurrency": "ILS", "url": `${APP_URL}/challenge` },
              { "@type": "Offer", "name": "סדנה יום אחד", "price": "1080", "priceCurrency": "ILS", "url": `${APP_URL}/workshop` },
              { "@type": "Offer", "name": "קורס דיגיטלי", "price": "1800", "priceCurrency": "ILS", "url": `${APP_URL}/course` },
              { "@type": "Offer", "name": "פגישת אסטרטגיה", "price": "4000", "priceCurrency": "ILS", "url": `${APP_URL}/strategy` },
            ],
          })}}
        />
        <a href="#main-content" className="skip-link">דלג לתוכן הראשי</a>
        <Pixels />
        <AccessibilityWidget />
        <MobileNavServer />
        <DesktopNav />
        <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
        <div style={{ paddingTop: 64 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
