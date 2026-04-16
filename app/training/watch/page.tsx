import type { Metadata } from "next";
import Script from "next/script";
import { ProductsSection } from "@/components/ProductsSection";
import { PageViewTracker } from "./PageViewTracker";
import { VimeoTracker } from "./VimeoTracker";
import { WatchGreeting } from "./WatchPersonalized";
import { ViewTracker } from "./ViewTracker";

export const metadata: Metadata = {
  title: "הדרכה חינמית - צפייה | הדר דנן",
  description: "צפה בהדרכה החינמית של הדר דנן: למה השיווק שלך לא עובד - ומה לעשות עם זה.",
  alternates: { canonical: "/training/watch" },
};

export default function TrainingWatchPage() {
  return (
    <main dir="rtl" className="min-h-screen font-assistant" style={{ background: "#0D1018" }}>
      <PageViewTracker />
      {/* Records +1 view on every page load — count displayed on /training */}
      <ViewTracker />

      {/* ══════════════════════════════════════════════════════
          1. VIDEO HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#0D1018", padding: "48px 24px 32px", textAlign: "center" }} className="pt-16">

        {/* Label pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,150,74,0.1)", border: "1px solid rgba(201,150,74,0.28)", borderRadius: 9999, padding: "5px 16px", marginBottom: 16 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A" }} />
          <span style={{ color: "#C9964A", fontSize: 11, letterSpacing: "0.12em", fontWeight: 700 }}>הדרכה חינמית · 20 דקות</span>
        </div>

        {/* Personalized greeting — renders only for quiz users */}
        <WatchGreeting />

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.6rem)", fontWeight: 800, color: "#EDE9E1", lineHeight: 1.2, marginBottom: 12 }}>
          למה השיווק שלך לא עובד -<br />ומה לעשות עם זה
        </h1>

        {/* Subheadline */}
        <p style={{ color: "#9E9990", fontSize: "1rem", marginBottom: 32 }}>
          הדרכה של כ־20 דקות. למה השיווק שלך לא עובד - ומה עושים עם זה.
        </p>

        {/* Vimeo embed */}
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
            <iframe
              id="vimeo-training"
              src="https://player.vimeo.com/video/1178865564?badge=0&autopause=0&loop=0&player_id=0&app_id=58479&texttrack=he"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              title="שיעור במתנה עם הדר"
            />
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════
          2. ALL PRODUCTS
      ══════════════════════════════════════════════════════ */}
      <ProductsSection excludeTraining={true} />

      <VimeoTracker iframeId="vimeo-training" />
      <Script src="https://player.vimeo.com/api/player.js" />
    </main>
  );
}
