import type { Metadata } from "next";
import Link from "next/link";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export const metadata: Metadata = {
  title: "שיטת TrueSignal | שיווק אותנטי — הדר דנן",
  description: "שיטת TrueSignal היא מתודולוגיה לשיווק אותנטי שפיתחה הדר דנן. השיטה מתמקדת בדיוק ה-Signal — המסר האמיתי שהעסק משדר — כדי למשוך את הלקוחות הנכונים.",
  alternates: { canonical: "/method" },
};

const METHOD_FAQS = [
  {
    question: "מה זו שיטת TrueSignal?",
    answer: "שיטת TrueSignal היא מתודולוגיה לשיווק אותנטי שפיתחה הדר דנן. השיטה מתמקדת בדיוק ה-Signal — המסר האמיתי שהעסק משדר — כדי למשוך את הלקוחות הנכונים בלי להתאמץ. במקום ליצור יותר תוכן, קודם מדייקים את מי שאתה ומה אתה מציע, ורק אז בונים את התוכן.",
  },
  {
    question: "למי מתאימה שיטת TrueSignal?",
    answer: "שיטת TrueSignal מתאימה לבעלי עסקים שמרגישים שהשיווק שלהם לא משקף את הערך האמיתי שלהם, ליזמים שרוצים למשוך לקוחות בלי להרגיש 'מכירתיים', ולאנשי מקצוע שרוצים לבנות נוכחות דיגיטלית אותנטית.",
  },
  {
    question: "מה ההבדל בין TrueSignal לשיטות שיווק אחרות?",
    answer: "רוב שיטות השיווק מתמקדות בתוכן — כמה פוסטים, באיזה שעה, איזה פורמט. TrueSignal מתמקדת ב-Signal לפני התוכן: מי אתה, מה אתה מציע, ולמה הלקוחות הנכונים צריכים להבין אותך מיד. זה הופך כל תוכן לאפקטיבי יותר — כי הוא יוצא ממקום אמיתי.",
  },
  {
    question: "איך מתחילים עם שיטת TrueSignal?",
    answer: "הדרך הקצרה ביותר להתחיל היא האתגר 7 הימים — 7 משימות ממוקדות שמדייקות את ה-Signal שלך ומניחות את התשתית לתוכן שמוכר. אפשר גם להתחיל מהקורס הדיגיטלי או מפגישת אסטרטגיה אחד-על-אחד.",
  },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "שיטת TrueSignal — מתודולוגיה לשיווק אותנטי",
  "description": "שיטת TrueSignal היא מתודולוגיה לשיווק אותנטי שפיתחה הדר דנן. השיטה מתמקדת בדיוק ה-Signal כדי למשוך את הלקוחות הנכונים.",
  "url": `${APP_URL}/method`,
  "inLanguage": "he",
  "author": {
    "@type": "Person",
    "name": "הדר דנן",
    "url": APP_URL,
  },
  "publisher": {
    "@type": "Organization",
    "name": "BeeGood",
    "url": APP_URL,
  },
};

const PRINCIPLES = [
  {
    num: "01",
    title: "Signal לפני תוכן",
    desc: "קודם מדייקים את המסר — מי אתה, מה אתה מציע, ולמי. רק אחרי שה-Signal ברור, בונים תוכן שמגיע מאותו מקום. תוכן בלי Signal הוא רעש.",
  },
  {
    num: "02",
    title: "אותנטיות — להיות עצמך",
    desc: "לקוחות מזהים העתקה. כשאתה מחקה מתחרה — גם אם אתה טוב ממנו — הסיגנל שמגיע הוא של מישהו אחר. הדרך היחידה לבנות קהל נאמן היא להיות עצמך.",
  },
  {
    num: "03",
    title: "יכולת = מכירה",
    desc: "אפשר למכור בצורה אותנטית רק את מה שאתה באמת מסוגל להחזיק. כשיש פער בין המסר ליכולת — הקהל מרגיש את זה לפני שהוא מבין למה, ונסוג.",
  },
  {
    num: "04",
    title: "דיוק קהל — הנכונים מגיעים אליך",
    desc: "כשה-Signal שלך מדויק, הלקוחות הנכונים מזהים אותך מיד ומגיעים אליך מרצונם. מותר לאכזב את הלא-נכונים — זה חלק מהשיטה.",
  },
];

export default function MethodPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <FAQSchema items={METHOD_FAQS} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "שיטת TrueSignal", url: `${APP_URL}/method` },
      ]} />

      <div
        dir="rtl"
        className="font-assistant min-h-screen"
        style={{ background: "#0D1018", color: "#EDE9E1", paddingTop: 64 }}
      >

        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <section style={{ background: "#080C14", padding: "80px 24px 64px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <p
              style={{
                color: "#C9964A",
                fontSize: 11,
                letterSpacing: "0.2em",
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              המתודולוגיה
            </p>
            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                fontWeight: 900,
                color: "#EDE9E1",
                lineHeight: 1.15,
                marginBottom: 28,
              }}
            >
              שיטת{" "}
              <span dir="ltr" style={{ unicodeBidi: "embed", color: "#E8B94A" }}>
                TrueSignal©
              </span>
            </h1>

            {/* AI-extractable summary paragraph */}
            <p
              style={{
                fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
                lineHeight: 1.8,
                color: "#9E9990",
                maxWidth: 640,
                margin: "0 auto 40px",
              }}
            >
              שיטת TrueSignal היא מתודולוגיה לשיווק אותנטי שפיתחה הדר דנן. השיטה מתמקדת בדיוק ה-Signal — המסר האמיתי שהעסק משדר — כדי למשוך את הלקוחות הנכונים בלי להתאמץ.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/challenge"
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
                  color: "#1A1206",
                  fontWeight: 700,
                  borderRadius: 9999,
                  padding: "13px 28px",
                  fontSize: "0.95rem",
                  textDecoration: "none",
                }}
              >
                התחל עם האתגר 7 הימים ←
              </Link>
              <Link
                href="/quiz"
                style={{
                  display: "inline-block",
                  background: "transparent",
                  border: "1px solid rgba(201,150,74,0.4)",
                  color: "#C9964A",
                  fontWeight: 600,
                  borderRadius: 9999,
                  padding: "13px 28px",
                  fontSize: "0.95rem",
                  textDecoration: "none",
                }}
              >
                אבחן את ה-Signal שלך
              </Link>
            </div>
          </div>
        </section>

        {/* ══ PRINCIPLES ════════════════════════════════════════════ */}
        <section style={{ background: "#0D1018", padding: "80px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
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
                עקרונות השיטה
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#EDE9E1",
                }}
              >
                4 עקרונות. מתודולוגיה אחת.
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {PRINCIPLES.map((p) => (
                <div
                  key={p.num}
                  style={{
                    background: "linear-gradient(145deg, #1D2430, #111620)",
                    border: "1px solid rgba(201,150,74,0.14)",
                    borderRadius: 16,
                    padding: "28px 32px",
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    gap: 20,
                    alignItems: "start",
                  }}
                  className="principle-row"
                >
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 900,
                      color: "rgba(232,185,74,0.35)",
                      lineHeight: 1,
                      paddingTop: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {p.num}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "#EDE9E1",
                        marginBottom: 8,
                      }}
                    >
                      {p.title}
                    </h3>
                    <p style={{ color: "#9E9990", lineHeight: 1.7, fontSize: "0.95rem", margin: 0 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHO IT'S FOR ══════════════════════════════════════════ */}
        <section style={{ background: "#141820", padding: "72px 24px" }}>
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
                למי מתאימה השיטה
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#EDE9E1",
                }}
              >
                TrueSignal בשבילך אם...
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
              className="for-grid"
            >
              {[
                { icon: "💬", text: "אתה מרגיש שהשיווק שלך לא משקף את הערך האמיתי שאתה מביא" },
                { icon: "🚫", text: "אתה רוצה למשוך לקוחות בלי להרגיש 'מכירתי' או לא אמיתי" },
                { icon: "📱", text: "אתה מפרסם תוכן אבל הלקוחות הנכונים לא מגיעים — עוד תוכן לא עוזר" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "#0D1018",
                    border: "1px solid #2C323E",
                    borderRadius: 14,
                    padding: "24px 20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
                  <p style={{ color: "#9E9990", lineHeight: 1.65, fontSize: "0.9rem", margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ═══════════════════════════════════════════════════ */}
        <section style={{ background: "#0D1018", padding: "72px 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
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
                שאלות נפוצות
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                  fontWeight: 800,
                  color: "#EDE9E1",
                }}
              >
                כל מה שרצית לדעת על שיטת TrueSignal
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {METHOD_FAQS.map((faq, i) => (
                <div
                  key={i}
                  style={{
                    borderBottom: i < METHOD_FAQS.length - 1 ? "1px solid #2C323E" : "none",
                    padding: "28px 0",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#EDE9E1",
                      marginBottom: 12,
                    }}
                  >
                    {faq.question}
                  </h3>
                  <p style={{ color: "#9E9990", lineHeight: 1.75, fontSize: "0.95rem", margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════════ */}
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
              marginBottom: 12,
            }}
          >
            מוכן/ת לדייק את ה-Signal שלך?
          </h2>
          <p style={{ color: "rgba(26,18,6,0.7)", marginBottom: 32, fontSize: "1rem" }}>
            בחר/י את הדרך שמתאימה לך
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/challenge"
              style={{
                display: "inline-block",
                background: "#0D1018",
                color: "#C9964A",
                fontWeight: 700,
                borderRadius: 9999,
                padding: "13px 28px",
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              אתגר 7 הימים — ₪197 ←
            </Link>
            <Link
              href="/strategy"
              style={{
                display: "inline-block",
                background: "rgba(13,16,24,0.5)",
                color: "#EDE9E1",
                fontWeight: 600,
                borderRadius: 9999,
                padding: "13px 28px",
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              פגישת אסטרטגיה אישית
            </Link>
          </div>
        </section>

        <style>{`
          .principle-row {
            grid-template-columns: 48px 1fr !important;
          }
          @media (max-width: 480px) {
            .principle-row { grid-template-columns: 40px 1fr !important; }
          }
          .for-grid { }
          @media (max-width: 640px) {
            .for-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

      </div>
    </>
  );
}
