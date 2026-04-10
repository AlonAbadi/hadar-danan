import type { Metadata } from "next";
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
  "description": "הדר דנן היא מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal. עבדה עם מאות בעלי עסקים ובנתה קהילה של מעל 70,000 עוקבים.",
  "alumniOf": { "@type": "EducationalOrganization", "name": "בית הספר למשחק גודמן" },
  "knowsAbout": ["שיווק אותנטי", "עמידה מול מצלמה", "יצירת תוכן וידאו", "בניית מערכות Signal", "בניית מותג אישי", "אסטרטגיה עסקית", "TrueSignal"],
  "sameAs": [
    "https://www.instagram.com/hadar_danan",
    "https://www.tiktok.com/@hadardanann",
    "https://open.spotify.com/show/12EPZoAiHLq63tiq6GjreC",
    "https://podcasts.apple.com/il/podcast/id1829722848",
  ],
  "worksFor": { "@type": "Organization", "name": "הדר דנן בע״מ", "url": APP_URL },
};

const PRINCIPLES = [
  {
    n: "1",
    q: '"מה באמת מייחד אותי?"',
    body: "לא מה שאתה רוצה למכור - אלא מה שהלקוחות שלך קונים ממך שוב ושוב. ה-Signal שלך חי שם, לא בבריף. לפני שמשנים משהו, מקשיבים - לא למה שאת אומרת, למה שמרגישים כשאת אומרת.",
  },
  {
    n: "2",
    q: '"מה אני יכול/ה להחזיק בלי להתאמץ?"',
    body: "כשיש פער בין מה שאתה מציג לבין מה שאתה מחזיק - הקהל מרגיש את זה לפני שהוא מבין למה. בכל יוצר יש משהו אחד שלא ניתן לדלל. אותנטיות היא מבנה, לא מצב רוח.",
  },
  {
    n: "3",
    q: '"איך זה נשמע במילים שלך?"',
    body: "תרגום הוא לא ניסוח מחדש. הוא מציאת השפה היחידה שמרגישה כמוך גם כשאת לא בחדר.",
  },
  {
    n: "4",
    q: '"מה הלקוח הנכון שלי מחפש באמת?"',
    body: "לא כל לקוח הוא הלקוח שלך. כשמדייקים את ה-Signal - הלקוחות הנכונים מגיעים, ואת הלא-נכונים לא צריך לשכנע. קהל לא בונים - קוראים בשמו.",
  },
  {
    n: "5",
    q: '"מה הפעולה שתייצר תנועה אמיתית?"',
    body: "טריק שיווקי עובד פעם אחת. Signal אמיתי בונה מומנטום שמתחזק עם הזמן - כי הוא נשען על מה שקיים, לא על מה שאפשר לבים.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "אודות", url: `${APP_URL}/about` },
      ]} />

      <div dir="rtl" className="font-assistant min-h-screen about-page" style={{ background: "#080C14", color: "#EDE9E1", lineHeight: 1.7 }}>
        <div className="about-wrap" style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 80px 100px", position: "relative" }}>

          {/* Ambient honeycomb bg */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='184' viewBox='0 0 160 184'%3E%3Cg fill='none' stroke='%23E8B94A' stroke-width='1' opacity='0.07'%3E%3Cpolygon points='80%2C8 148%2C48 148%2C136 80%2C176 12%2C136 12%2C48'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "160px 184px",
            }}
          />

          {/* Content */}
          <div style={{ position: "relative" }}>

            {/* ── HERO ─────────────────────────────────────────── */}
            <p className="about-tag" style={{ color: "#E8B94A", fontSize: 12, letterSpacing: 5, marginBottom: 48 }}>
              א · ו · ד · ו · ת
            </p>
            <h1 className="about-h1" style={{ fontSize: 88, fontWeight: 800, lineHeight: 0.95, marginBottom: 20, letterSpacing: -1 }}>
              יש שיווק שמוכר.
              <br />
              ויש שיווק <span style={{ color: "#E8B94A" }}>שמדהד.</span>
            </h1>
            <p className="about-byline" style={{ color: "#9E9990", fontSize: 18, marginTop: 32 }}>
              שיטת <strong style={{ color: "#EDE9E1", fontWeight: 600 }}>TrueSignal</strong> · נבנתה ע״י הדר דנן
            </p>

            {/* ── מי אני ─────────────────────────────────────── */}
            <section className="about-intro" style={{ marginTop: 80, paddingTop: 60, borderTop: "1px solid #1f2530", display: "grid", gridTemplateColumns: "180px 1fr", gap: 60 }}>
              <p style={{ color: "#E8B94A", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", paddingTop: 6 }}>
                מי אני
              </p>
              <div>
                <p className="about-intro-p" style={{ fontSize: 19, marginBottom: 22 }}>
                  הדר דנן. בניתי את שיטת TrueSignal אחרי שנים של עבודה עם עסקים שידעו להחזיק הרבה יותר ממה שהצליחו להעביר.
                </p>
                <p className="about-intro-p" style={{ color: "#9E9990", fontSize: 17 }}>
                  לא התחלתי משיטה - התחלתי מפער. הפער בין מי שאני בפנים לבין מה שהשיווק שלי שידר החוצה. ידעתי שאני לא לבד בזה. המטרה שלי היום היא לא להגדיל קהל - היא לחדד אות.
                </p>
              </div>
            </section>

            {/* ── MANIFESTO + HIVE ──────────────────────────── */}
            <section className="about-manifesto" style={{ marginTop: 100, paddingTop: 60, borderTop: "1px solid #1f2530" }}>
              <p style={{ color: "#E8B94A", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
                העקרונות
              </p>
              <h2 className="about-manifesto-h2" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, marginBottom: 60, maxWidth: 720 }}>
                שיטת TrueSignal לא נשענת על טריקים.
                <br />
                היא נשענת על <em style={{ fontStyle: "normal", color: "#E8B94A" }}>ארבע שאלות.</em>
              </h2>

              <div className="about-hive-grid" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 80, alignItems: "center" }}>

                {/* Hive SVG */}
                <div className="about-hive-svg" style={{ aspectRatio: "1" }}>
                  <svg
                    viewBox="0 0 400 400"
                    style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 40px rgba(232,185,74,0.15))" }}
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="hg" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0" stopColor="#E8B94A" />
                        <stop offset="1" stopColor="#9E7C3A" />
                      </linearGradient>
                    </defs>
                    <g fill="none" stroke="url(#hg)" strokeWidth="2">
                      <polygon points="200,60 280,106 280,198 200,244 120,198 120,106" />
                      <polygon points="280,106 360,152 360,244 280,290 200,244 200,152" opacity="0.7" />
                      <polygon points="120,106 200,152 200,244 120,290 40,244 40,152" opacity="0.7" />
                      <polygon points="200,244 280,290 280,382 200,428 120,382 120,290" opacity="0.5" />
                    </g>
                    <circle cx="200" cy="152" r="4" fill="#E8B94A" />
                    <circle cx="280" cy="198" r="4" fill="#E8B94A" />
                    <circle cx="120" cy="198" r="4" fill="#E8B94A" />
                    <circle cx="200" cy="290" r="4" fill="#E8B94A" />
                  </svg>
                </div>

                {/* Principles */}
                <div className="about-principles" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                  {PRINCIPLES.map((p) => (
                    <div key={p.n} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                      <div style={{
                        flexShrink: 0, width: 38, height: 38, borderRadius: "50%",
                        border: "1.5px solid #E8B94A", color: "#E8B94A",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 14, background: "rgba(232,185,74,0.04)",
                      }}>
                        {p.n}
                      </div>
                      <div>
                        <h3 className="about-principle-q" style={{ color: "#E8B94A", fontSize: 21, fontWeight: 600, marginBottom: 6, fontStyle: "italic" }}>
                          {p.q}
                        </h3>
                        <p className="about-principle-body" style={{ fontSize: 17, lineHeight: 1.6 }}>
                          {p.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* ── STATS ──────────────────────────────────────── */}
            <section className="about-stats" style={{ marginTop: 100, paddingTop: 60, borderTop: "1px solid #1f2530", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40 }}>
              {[
                { n: "7+", t: "שנות ניסיון בשיווק וידאו" },
                { n: "∞",  t: "עסקים שמצאו את ה-Signal שלהם" },
                { n: "1",  t: "שיטה - TrueSignal" },
              ].map((s) => (
                <div key={s.t}>
                  <div className="about-stat-n" style={{ fontSize: 56, fontWeight: 800, color: "#E8B94A", lineHeight: 1 }}>
                    {s.n}
                  </div>
                  <div style={{ color: "#9E9990", fontSize: 14, marginTop: 10, letterSpacing: "0.5px" }}>
                    {s.t}
                  </div>
                </div>
              ))}
            </section>

            {/* ── SIGN-OFF ───────────────────────────────────── */}
            <section className="about-sign" style={{ marginTop: 80, paddingTop: 50, borderTop: "1px solid #1f2530", textAlign: "center" }}>
              <p className="about-sign-p" style={{ fontSize: 24, fontStyle: "italic", maxWidth: 600, margin: "0 auto" }}>
                &quot;הבעיה אף פעם לא הייתה התוכן.
                <br />
                <span style={{ color: "#E8B94A" }}>היא הייתה ה-Signal.&quot;</span>
              </p>
              <div style={{ color: "#9E9990", fontSize: 14, letterSpacing: 3, marginTop: 24, textTransform: "uppercase" }}>
                - הדר דנן
              </div>
            </section>

          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-wrap              { padding: 80px 24px 60px !important; }
          .about-tag               { margin-bottom: 32px !important; }
          .about-h1                { font-size: 46px !important; }
          .about-byline            { font-size: 16px !important; }
          .about-intro             { grid-template-columns: 1fr !important; gap: 20px !important; margin-top: 50px !important; padding-top: 40px !important; }
          .about-intro-p           { font-size: 17px !important; }
          .about-manifesto         { margin-top: 60px !important; padding-top: 40px !important; }
          .about-manifesto-h2      { font-size: 30px !important; margin-bottom: 40px !important; }
          .about-hive-grid         { grid-template-columns: 1fr !important; gap: 40px !important; }
          .about-hive-svg          { max-width: 240px !important; margin: 0 auto !important; aspect-ratio: 1 !important; }
          .about-principles        { gap: 28px !important; }
          .about-principle-q       { font-size: 18px !important; }
          .about-principle-body    { font-size: 16px !important; }
          .about-stats             { grid-template-columns: 1fr !important; gap: 30px !important; margin-top: 60px !important; padding-top: 40px !important; }
          .about-stat-n            { font-size: 42px !important; }
          .about-sign              { margin-top: 60px !important; padding-top: 40px !important; }
          .about-sign-p            { font-size: 19px !important; }
        }
      `}</style>
    </>
  );
}
