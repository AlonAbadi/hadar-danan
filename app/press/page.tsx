import type { Metadata } from "next";
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
    href: null as string | null,
  },
  {
    outlet: "N12",
    icon: "📺",
    color: "#0057A8",
    title: "היזמים הצעירים שפיצחו את הרשת",
    date: "נובמבר 2024",
    href: null as string | null,
  },
  {
    outlet: "וואלה",
    icon: "🌐",
    color: "#FF6600",
    title: "איך להתגבר על הפחד ולעשות סרטונים",
    date: "מאי 2024",
    href: null as string | null,
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
    spotifyHref: null as string | null,
    appleHref: null as string | null,
    icon: "🎧",
  },
  {
    title: "תעביר לדרייב",
    role: "אורחת",
    note: null as string | null,
    spotifyHref: null as string | null,
    appleHref: null as string | null,
    icon: "🎧",
  },
];

const SOCIAL = [
  {
    platform: "אינסטגרם",
    handle: "@hadar_danan",
    href: "https://www.instagram.com/hadar_danan",
    icon: "📸",
    desc: "תוכן יומי, עדכונים ומאחורי הקלעים",
  },
  {
    platform: "TikTok",
    handle: "@hadardanann",
    href: "https://www.tiktok.com/@hadardanann",
    icon: "🎵",
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
            <p className="press-label">כתבות</p>
            <h2 className="press-h2">כתבו עלינו</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {ARTICLES.map((a, i) => (
                <div key={i}>
                  {a.href ? (
                    <a
                      href={a.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press-card press-card-link"
                    >
                      <ArticleInner article={a} />
                    </a>
                  ) : (
                    <div className="press-card">
                      <ArticleInner article={a} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── פודקאסטים ────────────────────────────────────────── */}
        <section style={{ background: "#141820", padding: "64px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <p className="press-label">פודקאסטים</p>
            <h2 className="press-h2">שמעו אותנו</h2>
            <div className="press-pod-grid">
              {PODCASTS.map((p, i) => (
                <div key={i} className="press-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: "#EDE9E1", fontSize: "0.95rem", margin: 0, lineHeight: 1.4 }}>
                        {p.title}
                      </p>
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: p.role === "המארחת" ? "#C9964A" : "#9E9990",
                          background: p.role === "המארחת" ? "rgba(201,150,74,0.12)" : "rgba(158,153,144,0.1)",
                          borderRadius: 20, padding: "2px 10px",
                        }}>
                          {p.role}
                        </span>
                        {p.note && (
                          <span style={{
                            fontSize: 11, color: "#9E9990",
                            background: "rgba(44,50,62,0.6)", borderRadius: 20, padding: "2px 10px",
                          }}>
                            {p.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(p.spotifyHref || p.appleHref) && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {p.spotifyHref && (
                        <a href={p.spotifyHref} target="_blank" rel="noopener noreferrer" className="press-spotify-btn">
                          🎵 Spotify
                        </a>
                      )}
                      {p.appleHref && (
                        <a href={p.appleHref} target="_blank" rel="noopener noreferrer" className="press-apple-btn">
                          🎧 Apple Podcasts
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── רשתות חברתיות ────────────────────────────────────── */}
        <section style={{ padding: "64px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <p className="press-label">רשתות חברתיות</p>
            <h2 className="press-h2">עקבו אחרינו</h2>
            <div className="press-social-grid">
              {SOCIAL.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press-card press-card-link"
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
            className="press-cta-btn"
          >
            צרו קשר בוואטסאפ ←
          </a>
        </section>

      </div>

      <style>{`
        .press-label {
          color: #C9964A; font-size: 11px; letter-spacing: 0.18em;
          font-weight: 600; text-transform: uppercase; margin-bottom: 10px;
        }
        .press-h2 {
          font-size: clamp(1.5rem, 3.5vw, 2.2rem);
          font-weight: 800; color: #EDE9E1; margin-bottom: 32px; line-height: 1.2;
        }
        .press-card {
          background: linear-gradient(145deg, #1D2430, #111620);
          border: 1px solid #2C323E;
          border-radius: 14px;
          padding: 20px 24px;
          text-decoration: none;
          display: block;
          transition: border-color 0.2s ease;
        }
        .press-card-link:hover { border-color: rgba(201,150,74,0.45); }
        .press-pod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .press-social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .press-spotify-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #1DB954; color: #000;
          font-size: 12px; font-weight: 700; border-radius: 20px;
          padding: 6px 14px; text-decoration: none;
        }
        .press-apple-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #FC3C44; color: #fff;
          font-size: 12px; font-weight: 700; border-radius: 20px;
          padding: 6px 14px; text-decoration: none;
        }
        .press-cta-btn {
          display: inline-block;
          background: #0D1018; color: #C9964A;
          font-weight: 700; border-radius: 9999px;
          padding: 13px 32px; font-size: 0.95rem; text-decoration: none;
        }
        .press-cta-btn:hover { opacity: 0.88; }
      `}</style>
    </>
  );
}

function ArticleInner({ article }: { article: typeof ARTICLES[0] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{
        flexShrink: 0, width: 52, height: 52, borderRadius: 12,
        background: "#0D1018", border: "1px solid #2C323E",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
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
      {article.href && <span style={{ color: "#C9964A", fontSize: 18, flexShrink: 0 }}>←</span>}
    </div>
  );
}
