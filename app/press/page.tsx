import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export const metadata: Metadata = {
  title: "הדר דנן בתקשורת | כתבות, פודקאסטים ורשתות חברתיות",
  description: "הדר דנן בתקשורת הישראלית: כתבות ב-ynet, N12 ווואלה, פודקאסט עצמאי וריאיונות בפודקאסטים מובילים.",
  alternates: { canonical: "/press" },
};

const pressSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "name": "הדר דנן בתקשורת",
  "url": `${APP_URL}/press`,
  "mainEntity": {
    "@type": "Person",
    "name": "הדר דנן",
    "url": APP_URL,
    "sameAs": [
      "https://www.instagram.com/hadar_danan",
      "https://www.tiktok.com/@hadardanann",
      "https://open.spotify.com/show/12EPZoAiHLq63tiq6GjreC",
      "https://podcasts.apple.com/il/podcast/id1829722848",
    ],
  },
};

const ARTICLES = [
  {
    outlet: "ynet",
    icon: "📰",
    color: "#E8001D",
    title: "המשרדים החדשים והפוטוגניים של מלכת הסרטונים",
    date: "נובמבר 2024",
    href: null,
  },
  {
    outlet: "N12",
    icon: "📺",
    color: "#0057A8",
    title: "היזמים הצעירים שפיצחו את הרשת",
    date: "נובמבר 2024",
    href: null,
  },
  {
    outlet: "וואלה",
    icon: "🌐",
    color: "#FF6600",
    title: "איך להתגבר על הפחד ולעשות סרטונים",
    date: "מאי 2024",
    href: null,
  },
];

const PODCASTS = [
  {
    title: "הדר דנן - הכל על במה אחת",
    role: "המארחת",
    note: "הפודקאסט הרשמי",
    spotifyHref: "https://open.spotify.com/show/12EPZoAiHLq63tiq6GjreC",
    appleHref: "https://podcasts.apple.com/il/podcast/id1829722848",
    icon: "🎙️",
  },
  {
    title: "גבולות הגיון עם עידן שלי",
    role: "אורחת",
    note: "פרק 51",
    spotifyHref: null,
    appleHref: null,
    icon: "🎧",
  },
  {
    title: "תעביר לדרייב",
    role: "אורחת",
    note: null,
    spotifyHref: null,
    appleHref: null,
    icon: "🎧",
  },
];

const SOCIAL = [
  {
    platform: "אינסטגרם",
    handle: "@hadar_danan",
    href: "https://www.instagram.com/hadar_danan",
    icon: "📸",
    color: "#E1306C",
    desc: "תוכן יומי, עדכונים ומאחורי הקלעים",
  },
  {
    platform: "TikTok",
    handle: "@hadardanann",
    href: "https://www.tiktok.com/@hadardanann",
    icon: "🎵",
    color: "#EDE9E1",
    desc: "טיפים קצרים על שיווק אותנטי",
  },
];

export default function PressPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pressSchema) }}
      />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "בתקשורת", url: `${APP_URL}/press` },
      ]} />

      <div
        dir="rtl"
        className="font-assistant min-h-screen"
        style={{ background: "#0D1018", color: "#EDE9E1", paddingTop: 64 }}
      >

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section style={{ background: "#080C14", padding: "64px 24px 56px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <p style={{
              color: "#C9964A", fontSize: 11, letterSpacing: "0.2em",
              fontWeight: 600, textTransform: "uppercase", marginBottom: 16,
            }}>
              תקשורת ונוכחות
            </p>
            <h1 style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900, color: "#EDE9E1", lineHeight: 1.15, marginBottom: 20,
            }}>
              הדר דנן בתקשורת
            </h1>
            <p style={{
              color: "#9E9990", fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
              lineHeight: 1.75, maxWidth: 560, margin: "0 auto",
            }}>
              כתבות בתקשורת הישראלית, פודקאסטים ונוכחות דיגיטלית —
              על שיווק אותנטי, TrueSignal ועל הדרך מבייביסיטר לבניית מותג.
            </p>
          </div>
        </section>

        {/* ── כתבות ────────────────────────────────────────────── */}
        <section style={{ padding: "64px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <SectionLabel>כתבות</SectionLabel>
            <h2 style={h2Style}>כתבו עלינו</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {ARTICLES.map((a, i) => (
                <ArticleCard key={i} article={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── פודקאסטים ────────────────────────────────────────── */}
        <section style={{ background: "#141820", padding: "64px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <SectionLabel>פודקאסטים</SectionLabel>
            <h2 style={h2Style}>שמעו אותנו</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {PODCASTS.map((p, i) => (
                <PodcastCard key={i} podcast={p} />
              ))}
            </div>
          </div>
        </section>

        {/* ── רשתות חברתיות ────────────────────────────────────── */}
        <section style={{ padding: "64px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <SectionLabel>רשתות חברתיות</SectionLabel>
            <h2 style={h2Style}>עקבו אחרינו</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {SOCIAL.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    background: "linear-gradient(145deg, #1D2430, #111620)",
                    border: "1px solid #2C323E",
                    borderRadius: 16,
                    padding: "24px 24px",
                    textDecoration: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,150,74,0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2C323E"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, color: "#EDE9E1", fontSize: "1rem", margin: 0 }}>{s.platform}</p>
                      <p style={{ color: "#C9964A", fontSize: 13, margin: "2px 0 0", fontWeight: 600 }}>{s.handle}</p>
                    </div>
                  </div>
                  <p style={{ color: "#9E9990", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{
          background: "linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
          padding: "56px 24px", textAlign: "center",
        }}>
          <h2 style={{ fontSize: "clamp(1.3rem, 3.5vw, 2rem)", fontWeight: 800, color: "#1A1206", marginBottom: 10 }}>
            מעוניינים בשיתוף פעולה תקשורתי?
          </h2>
          <p style={{ color: "rgba(26,18,6,0.65)", marginBottom: 28, fontSize: "0.95rem" }}>
            ריאיונות, כתבות, הרצאות ופודקאסטים
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "972539566961"}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#0D1018",
              color: "#C9964A",
              fontWeight: 700,
              borderRadius: 9999,
              padding: "13px 32px",
              fontSize: "0.95rem",
              textDecoration: "none",
            }}
          >
            צרו קשר בוואטסאפ ←
          </a>
        </section>

      </div>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

const h2Style: CSSProperties = {
  fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
  fontWeight: 800,
  color: "#EDE9E1",
  marginBottom: 32,
  lineHeight: 1.2,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: "#C9964A", fontSize: 11, letterSpacing: "0.18em",
      fontWeight: 600, textTransform: "uppercase", marginBottom: 10,
    }}>
      {children}
    </p>
  );
}

function ArticleCard({ article }: { article: typeof ARTICLES[0] }) {
  const inner = (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 20,
      background: "linear-gradient(145deg, #1D2430, #111620)",
      border: "1px solid #2C323E",
      borderRadius: 14,
      padding: "20px 24px",
      transition: "border-color 0.2s ease",
      textDecoration: "none",
    }}>
      {/* Outlet badge */}
      <div style={{
        flexShrink: 0,
        width: 52, height: 52,
        borderRadius: 12,
        background: "#0D1018",
        border: "1px solid #2C323E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
      }}>
        {article.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: article.color,
            background: `${article.color}18`, borderRadius: 6,
            padding: "2px 8px", letterSpacing: "0.05em",
          }}>
            {article.outlet}
          </span>
          <span style={{ color: "#9E9990", fontSize: 12 }}>{article.date}</span>
        </div>
        <p style={{ color: "#EDE9E1", fontWeight: 600, fontSize: "0.95rem", margin: 0, lineHeight: 1.4 }}>
          {article.title}
        </p>
      </div>

      {article.href && (
        <span style={{ color: "#C9964A", fontSize: 18, flexShrink: 0 }}>←</span>
      )}
    </div>
  );

  if (article.href) {
    return (
      <a
        href={article.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block" }}
        onMouseEnter={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.borderColor = "rgba(201,150,74,0.4)"; }}
        onMouseLeave={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.borderColor = "#2C323E"; }}
      >
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

function PodcastCard({ podcast }: { podcast: typeof PODCASTS[0] }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #1D2430, #111620)",
      border: "1px solid #2C323E",
      borderRadius: 16,
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{podcast.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: "#EDE9E1", fontSize: "0.95rem", margin: 0, lineHeight: 1.4 }}>
            {podcast.title}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: podcast.role === "המארחת" ? "#C9964A" : "#9E9990",
              background: podcast.role === "המארחת" ? "rgba(201,150,74,0.12)" : "rgba(158,153,144,0.1)",
              borderRadius: 20, padding: "2px 10px",
            }}>
              {podcast.role}
            </span>
            {podcast.note && (
              <span style={{
                fontSize: 11, color: "#9E9990",
                background: "rgba(44,50,62,0.6)", borderRadius: 20, padding: "2px 10px",
              }}>
                {podcast.note}
              </span>
            )}
          </div>
        </div>
      </div>

      {(podcast.spotifyHref || podcast.appleHref) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {podcast.spotifyHref && (
            <a
              href={podcast.spotifyHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#1DB954", color: "#000",
                fontSize: 12, fontWeight: 700, borderRadius: 20,
                padding: "6px 14px", textDecoration: "none",
              }}
            >
              🎵 Spotify
            </a>
          )}
          {podcast.appleHref && (
            <a
              href={podcast.appleHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#FC3C44", color: "#fff",
                fontSize: 12, fontWeight: 700, borderRadius: 20,
                padding: "6px 14px", textDecoration: "none",
              }}
            >
              🎧 Apple Podcasts
            </a>
          )}
        </div>
      )}
    </div>
  );
}
