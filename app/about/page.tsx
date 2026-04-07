import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "אודות הדר דנן | אסטרטגית שיווק ובונת מערכות Signal",
  description: "הסיפור מאחורי השיטה - מי היא הדר דנן, מה היא גילתה, ולמה TrueSignal© עובד.",
  alternates: { canonical: "/about" },
};

const CARDS = [
  {
    title: "Signal",
    text: "ה־Signal שלך הוא לא מה שאתה אומר. זה מה שאנשים מרגישים ברגע שהם נוגעים בעסק שלך.",
  },
  {
    title: "יכולת",
    text: "אפשר למכור רק את מה שאתה באמת מסוגל להחזיק. כשיש פער - הקהל מרגיש את זה לפני שהוא מבין למה.",
  },
  {
    title: "דיוק",
    text: "אנחנו לא בונים תוכן. אנחנו מדייקים את ה־Signal עד שהלקוחות הנכונים מזהים אותך מיד.",
  },
];

export default function AboutPage() {
  return (
    <div
      dir="rtl"
      className="font-assistant min-h-screen"
      style={{ background: "#0D1018", color: "#EDE9E1", paddingTop: 64 }}
    >

      {/* ══ SECTION 1 - HERO WITH OVERLAY ════════════════════════ */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          maxHeight: 700,
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <Image
          src="/hadarimage.jpg"
          alt="הדר דנן"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center top" }}
        />

        {/* Desktop gradient overlay - left to right */}
        <div
          className="hero-overlay-desktop"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to left, rgba(13,16,24,0.15) 0%, rgba(13,16,24,0.85) 55%, rgba(13,16,24,0.97) 100%)",
          }}
        />

        {/* Mobile gradient overlay - bottom to top */}
        <div
          className="hero-overlay-mobile"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(13,16,24,0.97) 0%, rgba(13,16,24,0.75) 40%, rgba(13,16,24,0.35) 70%, rgba(13,16,24,0.15) 100%)",
          }}
        />

        {/* Mobile vignette overlay */}
        <div
          className="hero-overlay-mobile"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(13,16,24,0.4) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Text container */}
        <div
          dir="rtl"
          className="hero-text"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 48px",
            maxWidth: 520,
            textAlign: "right",
          }}
        >
          <p
            style={{
              color: "#C9964A",
              fontSize: 11,
              letterSpacing: "0.2em",
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            אודות
          </p>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 3.8rem)",
              fontWeight: 800,
              color: "#EDE9E1",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            הדר דנן
          </h1>

          <p
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.2rem)",
              fontWeight: 600,
              color: "#C9964A",
              lineHeight: 1.4,
              marginBottom: 24,
            }}
          >
            אסטרטגית שיווק ובונה מערכות Signal
          </p>

          <div
            className="hidden sm:block"
            style={{
              fontSize: "clamp(0.9rem, 1.8vw, 1rem)",
              lineHeight: 1.75,
              color: "#EDE9E1",
              opacity: 0.9,
              marginBottom: 32,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <p>לפני שבניתי שיטה, הייתי עסק שמרגיש את הפער בעצמי.</p>
            <p>ידעתי מה אני מסוגלת להחזיק - אבל מה שיצא החוצה לא שיקף את זה.</p>
            <p>הבנתי שהבעיה אף פעם לא הייתה התוכן - היא הייתה ה־Signal.</p>
          </div>

          {/* Spacer on mobile (body hidden) */}
          <div className="block sm:hidden" style={{ marginBottom: 24 }} />

          <Link
            href="/quiz"
            className="about-cta-primary"
            style={{
              display: "inline-block",
              alignSelf: "flex-start",
              background: "linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
              color: "#1A1206",
              fontWeight: 700,
              borderRadius: 9999,
              padding: "14px 32px",
              fontSize: "1rem",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
          >
            גלי את הצעד הנכון ←
          </Link>
        </div>
      </section>

      {/* ══ SECTION 2 - THE METHOD ════════════════════════════════ */}
      <section style={{ background: "#141820", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p
              style={{
                color: "#C9964A",
                fontSize: 12,
                letterSpacing: "0.15em",
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              השיטה
            </p>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#EDE9E1",
                lineHeight: 1.2,
              }}
            >
              למה{" "}
              <span dir="ltr" style={{ unicodeBidi: "embed", color: "#E8B94A", fontWeight: 700 }}>
                TrueSignal©
              </span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
            className="method-grid"
          >
            {CARDS.map((card) => (
              <div
                key={card.title}
                style={{
                  background: "linear-gradient(145deg, #1D2430, #111620)",
                  border: "1px solid rgba(201,150,74,0.16)",
                  borderRadius: 16,
                  padding: 32,
                }}
              >
                <p
                  style={{
                    color: "#C9964A",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    marginBottom: 12,
                  }}
                >
                  {card.title}
                </p>
                <p
                  style={{
                    color: "#9E9990",
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                  }}
                >
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 - CTA BANNER ════════════════════════════════ */}
      <section
        style={{
          background: "linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 800,
            color: "#1A1206",
            marginBottom: 32,
            lineHeight: 1.25,
          }}
        >
          רוצה לדעת איפה ה־Signal שלך נשבר?
        </h2>
        <Link
          href="/quiz"
          className="about-cta-secondary"
          style={{
            display: "inline-block",
            background: "#0D1018",
            color: "#C9964A",
            fontWeight: 700,
            borderRadius: 9999,
            padding: "14px 32px",
            fontSize: "1rem",
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
        >
          התחל כאן - 3 שאלות בלבד ←
        </Link>
      </section>

      {/* ══ RESPONSIVE STYLES ════════════════════════════════════ */}
      <style>{`
        /* Desktop: show left-to-right overlay, hide bottom overlay */
        .hero-overlay-desktop { display: block; }
        .hero-overlay-mobile  { display: none; }

        /* Desktop: text on left side */
        .hero-text {
          top: 0; left: 0; bottom: 0; right: auto;
          padding: 64px 48px;
          max-width: 520px;
          justify-content: center;
        }

        @media (max-width: 640px) {
          /* Mobile: show bottom overlay, hide left-to-right */
          .hero-overlay-desktop { display: none; }
          .hero-overlay-mobile  { display: block; }

          /* Mobile: text anchored to bottom */
          .hero-text {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            max-width: 100% !important;
            padding: 32px 24px !important;
            justify-content: flex-end !important;
          }
        }

        .method-grid { }
        @media (max-width: 768px) {
          .method-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .about-cta-primary:hover  { opacity: 0.9; }
        .about-cta-secondary:hover { opacity: 0.85; }
      `}</style>

    </div>
  );
}
