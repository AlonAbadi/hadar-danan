import type { Metadata } from "next";
import Link from "next/link";
import { SignalHiveCTA } from "./SignalHiveCTA";

export const metadata: Metadata = {
  title: "כוורת האות — עכשיו מוציאים את האות לעולם | beegood",
  description:
    "גילית את האות שלך. כוורת האות היא שכבת ההפעלה: אתגר 7 הימים, ערכת תוכן, ערכת ויזואל ו-7 בימויים אישיים — הכל נגזר מהאות שלך. ₪590, מתקזז מהסדנה.",
};

const C = {
  bg: "#080C14", card: "#141820", soft: "#1D2430", line: "#2C323E",
  gold: "#C9964A", goldL: "#E8B94A", fg: "#EDE9E1", mut: "#9E9990", green: "#7FD49B",
};

const FOLDERS = [
  {
    n: "0", title: "לוח האות",
    body: "האות שלך, הכאב שהוא פותר, ההבטחה, הקהל וקו-המיצוב — במקום אחד. זה העוגן שממנו הכל יוצא.",
  },
  {
    n: "1", title: "אתגר האות · 7 ימים",
    body: "שבעה שיעורי עומק עם הדר, הפעם ממוסגרים סביב האות שלך. כל יום מתחיל מהאות, ומסתיים ברפלקציה קצרה: איך זה מתחבר אליי.",
  },
  {
    n: "2", title: "ערכת תוכן",
    body: "7 כיווני-תוכן (כאב · אמונה · סמכות · סיפור · התנגדות · טרנספורמציה · הזמנה) וספריית פתיחות — כולם נגזרים מהאות שלך, לא גנריים.",
  },
  {
    n: "3", title: "ערכת ויזואל",
    body: "כרטיסי האות שלך (מוכנים לשיתוף) ו-7 כיווני-צילום — מה לצלם, מאיזה מקום, ואיך זה נראה.",
  },
  {
    n: "4", title: "הבמאית",
    body: "7 בימויים אישיים: לא רק מה להגיד — איך להיות מול המצלמה כאדם הזה. זה ה-IP של הדר, בשבילך.",
  },
];

export default function SignalHivePage() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";
  return (
    <main dir="rtl" className="font-assistant" style={{ background: C.bg, color: C.fg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 22px 100px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: C.goldL, fontSize: 12.5, letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 18 }}>
            כוורת האות
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.25, fontWeight: 800, margin: "0 0 16px" }}>
            גילית את האות שלך.<br />עכשיו מתחילים לשדר אותו.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: C.mut, maxWidth: 560, margin: "0 auto" }}>
            לא עוד תוכן, לא עוד קורס. שכבת ההפעלה שלוקחת אותך מ<b style={{ color: C.fg }}>"גיליתי את האות"</b> ל<b style={{ color: C.fg }}>"האות שלי יוצא לעולם"</b> — עם ערכה שלמה שנגזרת מהאות שלך.
          </p>
        </div>

        {/* What's inside */}
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "52px 0 18px", textAlign: "center" }}>מה יש בפנים</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FOLDERS.map((f) => (
            <div key={f.n} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: "rgba(232,185,74,0.1)", border: "1px solid rgba(232,185,74,0.3)", color: C.goldL, fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {f.n}
              </div>
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 800, marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 14.5, color: C.mut, lineHeight: 1.65 }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Credit to workshop */}
        <div style={{ background: "rgba(127,212,155,0.06)", border: "1px solid rgba(127,212,155,0.3)", borderRadius: 14, padding: "16px 20px", margin: "18px 0", textAlign: "center" }}>
          <div style={{ fontWeight: 800, color: C.green, marginBottom: 3 }}>וגם: ₪590 מתקזזים מהסדנה</div>
          <div style={{ fontSize: 14, color: C.mut, lineHeight: 1.6 }}>
            אם תמשיכי לסדנת ההמשך (₪1,800), מלוא מחיר כוורת האות מתקזז. זה הצעד הראשון, לא בזבוז.
          </div>
        </div>

        {/* Where it sits */}
        <div style={{ textAlign: "center", color: C.mut, fontSize: 14, margin: "34px 0 10px", lineHeight: 1.8 }}>
          איפה זה יושב במסע:<br />
          <span style={{ color: C.fg }}>גילוי האות (חינם) → <b style={{ color: C.goldL }}>כוורת האות</b> → סדנה → אסטרטגיה</span>
        </div>

        {/* Price + CTA */}
        <div style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 18, padding: "26px 24px", marginTop: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 800, color: C.goldL, background: "rgba(232,185,74,0.12)", border: "1px solid rgba(232,185,74,0.32)", borderRadius: 999, padding: "4px 12px", marginBottom: 10 }}>
              33% הנחה
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 18, color: C.mut, textDecoration: "line-through" }}>₪880</span>
              <span style={{ fontSize: 38, fontWeight: 800, color: C.goldL }}>₪590</span>
            </div>
            <div style={{ fontSize: 13.5, color: C.mut, marginTop: 2 }}>תשלום חד-פעמי · גישה מלאה · מתקזז מהסדנה</div>
          </div>
          <SignalHiveCTA whatsappPhone={wa} />
          <div style={{ textAlign: "center", fontSize: 12.5, color: C.mut, marginTop: 14, lineHeight: 1.6 }}>
            עדיין לא גילית את האות שלך?{" "}
            <Link href="/signal" style={{ color: C.gold, textDecoration: "underline", textUnderlineOffset: 3 }}>מתחילים כאן, חינם ←</Link>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 16, color: C.fg, lineHeight: 1.7, marginTop: 44, maxWidth: 520, marginInline: "auto" }}>
          לא מספיק לגלות את האות.<br />צריך להתחיל לשדר אותו.
        </p>

      </div>
    </main>
  );
}
