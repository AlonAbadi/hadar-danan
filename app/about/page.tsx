import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export const metadata: Metadata = {
  title: "אודות הדר דנן | מומחית שיווק אותנטי, יוצרת שיטת TrueSignal",
  description: "הדר דנן — מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal. מ-50,000+ עוקבים ועד מאות עסקים שגדלו: הסיפור, המספרים והשיטה.",
  alternates: { canonical: "/about" },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "הדר דנן",
  "url": APP_URL,
  "jobTitle": "מומחית שיווק אותנטי ויוצרת שיטת TrueSignal",
  "description": "הדר דנן היא מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal. עבדה עם מאות בעלי עסקים ובנתה קהילה של מעל 50,000 עוקבים.",
  "alumniOf": {
    "@type": "EducationalOrganization",
    "name": "בית הספר למשחק גודמן",
  },
  "knowsAbout": [
    "שיווק אותנטי",
    "עמידה מול מצלמה",
    "יצירת תוכן וידאו",
    "בניית מערכות Signal",
    "בניית מותג אישי",
    "אסטרטגיה עסקית",
    "TrueSignal",
  ],
  "sameAs": ["https://www.instagram.com/hadar_danan"],
  "worksFor": {
    "@type": "Organization",
    "name": "BeeGood",
    "url": APP_URL,
  },
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

const STATS = [
  { val: "70,000+", label: "עוקבים" },
  { val: "3,500+",  label: "לקוחות" },
  { val: "50,000+", label: "סרטונים" },
  { val: "80+",     label: "תחומים" },
];

const JOURNEY = [
  {
    year: "לפני",
    title: "בוגרת בית הספר למשחק גודמן",
    text: "ההכשרה שהכניסה אותי לעולם הבמה ולימדה אותי דבר אחד קריטי: האותנטיות על הבמה היא אותה אותנטיות שמוכרת עסק.",
  },
  {
    year: "2020",
    title: "נקודת המפנה — קורונה",
    text: "בתקופת הקורונה, בזמן שעבדתי כבייביסיטר, הבנתי שאני יכולה לעזור לעסקים לשווק את עצמם נכון. בנתי מה שרציתי לראות.",
  },
  {
    year: "4 חודשים",
    title: "מחברה בע״מ למותג מוביל",
    text: "תוך 4 חודשים מהפריצה הראשונה הפכתי לאחת מהקולות המרכזיים בשיווק אותנטי לעסקים קטנים בישראל.",
  },
  {
    year: "היום",
    title: "מומחית ויוצרת שיטת TrueSignal",
    text: "מאות עסקים, 50,000+ עוקבים, פודקאסט פעיל וקהילה גדלה — כולם בנויים על עיקרון אחד: Signal אמיתי מנצח תוכן מלאכותי.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "אודות", url: `${APP_URL}/about` },
      ]} />

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
          <Image
            src="/hadarimage.jpg"
            alt="הדר דנן — מומחית שיווק אותנטי ויוצרת שיטת TrueSignal"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />

          <div
            className="hero-overlay-desktop"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to left, rgba(13,16,24,0.15) 0%, rgba(13,16,24,0.85) 55%, rgba(13,16,24,0.97) 100%)",
            }}
          />
          <div
            className="hero-overlay-mobile"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(13,16,24,0.97) 0%, rgba(13,16,24,0.75) 40%, rgba(13,16,24,0.35) 70%, rgba(13,16,24,0.15) 100%)",
            }}
          />
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
              מומחית שיווק אותנטי, יוצרת שיטת TrueSignal
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

        {/* ══ SECTION 2 - STATS ══════════════════════════════════════ */}
        <section style={{ background: "#080C14", padding: "56px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                textAlign: "center",
              }}
              className="stats-grid"
            >
              {STATS.map((s) => (
                <div key={s.label}>
                  <p
                    style={{
                      fontSize: "clamp(2rem, 5vw, 2.8rem)",
                      fontWeight: 900,
                      background: "linear-gradient(135deg, #E8B94A, #C9964A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      margin: 0,
                    }}
                  >
                    {s.val}
                  </p>
                  <p style={{ color: "#9E9990", fontSize: 13, marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 3 - THE JOURNEY ════════════════════════════════ */}
        <section style={{ background: "#0D1018", padding: "80px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
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
                המסע שלי
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                  fontWeight: 800,
                  color: "#EDE9E1",
                  lineHeight: 1.2,
                }}
              >
                מבמה לבמה אחרת
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {JOURNEY.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr",
                    gap: 24,
                    paddingBottom: 40,
                    position: "relative",
                  }}
                  className="journey-row"
                >
                  {/* Timeline line */}
                  {i < JOURNEY.length - 1 && (
                    <div
                      className="journey-line"
                      style={{
                        position: "absolute",
                        right: "calc(100% - 40px)",
                        top: 28,
                        bottom: 0,
                        width: 1,
                        background: "rgba(201,150,74,0.2)",
                      }}
                    />
                  )}

                  {/* Year badge */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "inline-block",
                        background: "rgba(201,150,74,0.12)",
                        border: "1px solid rgba(201,150,74,0.3)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#C9964A",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {step.year}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#EDE9E1",
                        marginBottom: 8,
                        marginTop: 6,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p style={{ color: "#9E9990", lineHeight: 1.7, fontSize: "0.95rem" }}>
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 4 - THE METHOD ════════════════════════════════ */}
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
              <p style={{ color: "#9E9990", marginTop: 12, fontSize: "0.95rem" }}>
                <Link href="/method" style={{ color: "#C9964A", textDecoration: "none" }}>
                  קרא/י עוד על שיטת TrueSignal ←
                </Link>
              </p>
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

        {/* ══ SECTION 5 - EXPERTISE ════════════════════════════════ */}
        <section style={{ background: "#0D1018", padding: "72px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
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
                מומחיות
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#EDE9E1",
                  lineHeight: 1.2,
                }}
              >
                תחומי המומחיות שלי
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
              }}
              className="expertise-grid"
            >
              {[
                { icon: "📡", title: "שיווק אותנטי", desc: "בניית מסר שמשקף את הערך האמיתי של העסק — לא מה שנראה טוב, מה שאמיתי." },
                { icon: "🎥", title: "עמידה מול מצלמה", desc: "ממשחק לתוכן: הפיכת בעלי עסקים לנוכחות וידאו שמושכת לקוחות נכונים." },
                { icon: "⚡", title: "יצירת תוכן וידאו", desc: "שיטות לייצר תוכן מהיר, אמיתי ואפקטיבי — בלי ציוד יקר ובלי לאבד את הקול." },
                { icon: "🔧", title: "בניית מערכות Signal", desc: "מערכות שמביאות לקוחות נכונים בצורה עקבית — לא פוסטים מקריים, מנגנון שרץ." },
              ].map((ex) => (
                <div
                  key={ex.title}
                  style={{
                    background: "#141820",
                    border: "1px solid #2C323E",
                    borderRadius: 14,
                    padding: "24px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{ex.icon}</span>
                  <p style={{ fontWeight: 700, color: "#EDE9E1", fontSize: "1rem", margin: 0 }}>
                    {ex.title}
                  </p>
                  <p style={{ color: "#9E9990", fontSize: "0.9rem", lineHeight: 1.65, margin: 0 }}>
                    {ex.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 6 - CTA BANNER ════════════════════════════════ */}
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
          .hero-overlay-desktop { display: block; }
          .hero-overlay-mobile  { display: none; }

          .hero-text {
            top: 0; left: 0; bottom: 0; right: auto;
            padding: 64px 48px;
            max-width: 520px;
            justify-content: center;
          }

          @media (max-width: 640px) {
            .hero-overlay-desktop { display: none; }
            .hero-overlay-mobile  { display: block; }
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

          .stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          @media (max-width: 640px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }

          .method-grid { }
          @media (max-width: 768px) {
            .method-grid { grid-template-columns: 1fr !important; }
          }

          .expertise-grid { }
          @media (max-width: 640px) {
            .expertise-grid { grid-template-columns: 1fr !important; }
          }

          .journey-row { grid-template-columns: 80px 1fr !important; }
          @media (max-width: 480px) {
            .journey-row { grid-template-columns: 60px 1fr !important; }
          }
          .journey-line { display: none !important; }

          .about-cta-primary:hover  { opacity: 0.9; }
          .about-cta-secondary:hover { opacity: 0.85; }
        `}</style>

      </div>
    </>
  );
}
