import type { Metadata } from "next";
import { Space_Grotesk, Hanken_Grotesk, Spectral } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  variable: "--font-spectral",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
const OG_IMAGE = "https://beegood.online/og-image.jpg";

const TITLE = "BeeGood · The TrueSignal© Method";
const DESCRIPTION =
  "Five questions reveal the one signal that is yours alone - the way you already help people, named clearly enough to build on.";

export const metadata: Metadata = {
  title: { absolute: TITLE, template: "%s · BeeGood" },
  description: DESCRIPTION,
  metadataBase: new URL(APP_URL),
  alternates: { canonical: `${APP_URL}/en`, languages: { "he-IL": APP_URL, "en": `${APP_URL}/en` } },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BeeGood",
    title: TITLE,
    description: DESCRIPTION,
    url: `${APP_URL}/en`,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      lang="en"
      dir="ltr"
      className={`${spaceGrotesk.variable} ${hankenGrotesk.variable} ${spectral.variable}`}
      style={{
        minHeight: "100vh",
        background: "#FBFBF9",
        color: "#0F1011",
        fontFamily: "var(--font-hanken-grotesk), -apple-system, system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </div>
  );
}
