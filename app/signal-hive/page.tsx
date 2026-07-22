import type { Metadata } from "next";
import Link from "next/link";
import { SignalHiveCTA } from "./SignalHiveCTA";
import { BroadcastShowcase } from "@/components/landing/BroadcastShowcase";

export const metadata: Metadata = {
  title: "כוורת האות — עכשיו מוציאים את האות לעולם | beegood",
  description:
    "גילית את האות שלך. כוורת האות היא שכבת ההפעלה: אתגר 7 הימים, ערכת תוכן, ערכת ויזואל ו-7 בימויים אישיים — הכל נגזר מהאות שלך. ₪590, מתקזז מהסדנה.",
};

const C = {
  bg: "#080C14", card: "#141820", soft: "#1D2430", line: "#2C323E",
  gold: "#C9964A", goldL: "#E8B94A", fg: "#EDE9E1", mut: "#9E9990", green: "#7FD49B",
};

// The 5 stages. Copy revised by Alon 2026-07-11 — every stage now carries
// a subtitle (one-line hook) and an "outcome" micro-copy line so the visitor
// can picture the transformation at the end of each step, not just the
// feature list.
const FOLDERS = [
  {
    n:        "0",
    title:    "לוח האות",
    hook:     "כדי שלא תאבד את מה שגילית.",
    body:     "האות שלך, הכאב שהוא פותר, ההבטחה, הקהל וקו-המיצוב — במקום אחד. זה העוגן שממנו הכל יוצא.",
    outcome:  "בסוף השלב הזה: האות שלך מסודר במקום אחד.",
  },
  {
    n:        "1",
    title:    "אתגר האות · 7 ימים",
    hook:     "כל יום לוקח את האות שלך עוד צעד אחד החוצה.",
    body:     "שבעה שיעורי עומק עם הדר, הפעם ממוסגרים סביב האות שלך. כל שיעור מגיע עם רפלקציה קצרה: איך זה מתחבר אליי.",
    outcome:  "בסוף השבוע: שבעה שיעורים שהוציאו את האות שלך צעד אחד החוצה.",
  },
  {
    n:        "2",
    title:    "ערכת תוכן",
    hook:     "כבר לא שואל ״מה לפרסם?״ אתה יודע מה נכון לפרסם.",
    body:     "7 כיווני-תוכן (כאב · אמונה · סמכות · סיפור · התנגדות · טרנספורמציה · הזמנה) וספריית פתיחות — כולם נגזרים מהאות שלך, לא גנריים.",
    outcome:  "בסוף השלב הזה: יש לך מאגר של תוכן שכולו יוצא מהאות שלך.",
  },
  {
    n:        "3",
    title:    "ערכת ויזואל",
    hook:     "גם כשהמסר נכון, הוא צריך להיראות נכון.",
    body:     "כרטיסי האות שלך (מוכנים לשיתוף) ו-7 כיווני-צילום — מה לצלם, מאיזה מקום, ואיך זה נראה.",
    outcome:  "בסוף השלב הזה: המסר שלך גם נראה כמו שהוא נשמע.",
  },
  {
    n:        "4",
    title:    "הבמאית",
    hook:     "החלק שאנשים הכי זוכרים. תלמד לדבר כמו עצמך, גם מול מצלמה.",
    body:     "7 בימויים אישיים: לא רק מה להגיד — איך להיות מול המצלמה כאדם הזה. זה ה-IP של הדר, בשבילך.",
    outcome:  "בסוף השלב הזה: אתה יודע לעמוד מול מצלמה כמו עצמך.",
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
            לא עוד תוכן, לא עוד קורס. שכבת ההפעלה שלוקחת אותך מ<b style={{ color: C.fg }}>״גיליתי את האות״</b> ל<b style={{ color: C.fg }}>״האות שלי יוצא לעולם״</b> — עם ערכה שלמה שנגזרת מהאות שלך.
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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16.5, fontWeight: 800, marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.goldL, fontStyle: "italic", marginBottom: 6, lineHeight: 1.55 }}>{f.hook}</div>
                <div style={{ fontSize: 14.5, color: C.mut, lineHeight: 1.65 }}>{f.body}</div>
                <div style={{ fontSize: 13, color: C.green, marginTop: 8, lineHeight: 1.5, fontWeight: 600 }}>{f.outcome}</div>
              </div>
            </div>
          ))}
        </div>

        {/* The digital product, shown running — same showcase as the homepage
            (teleprompter phone mock + pipeline + seasons tease). No CTA here:
            the price card below is this page's single call to action. */}
        <BroadcastShowcase showCta={false} />

        {/* What comes after — links to the monthly subscription roadmap */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", marginTop: 22, textAlign: "start" }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: C.goldL, fontWeight: 800, marginBottom: 6 }}>
            ומה אחרי?
          </div>
          <div style={{ fontSize: 14.5, color: C.fg, lineHeight: 1.7 }}>
            כוורת האות היא <b>הצעד הראשון</b>. אחרי שמסיימים את חמשת השלבים, מי שרוצה להמשיך עובר למנוי החודשי — עונה חדשה בכל חודש, אותה אות, זווית אחרת. 10 עונות שכבר מחכות בפייפליין, וממשיכות להיווצר.
          </div>
        </div>

        {/* Credit to workshop */}
        <div style={{ background: "rgba(127,212,155,0.06)", border: "1px solid rgba(127,212,155,0.3)", borderRadius: 14, padding: "16px 20px", margin: "18px 0", textAlign: "center" }}>
          <div style={{ fontWeight: 800, color: C.green, marginBottom: 6, fontSize: 15 }}>ממשיכים איתנו? הכסף לא הולך לאיבוד.</div>
          <div style={{ fontSize: 14, color: C.mut, lineHeight: 1.65 }}>
            אם תבחר להמשיך לסדנת כוורת האות, כל סכום ההצטרפות מתקזז ממחיר הסדנה.
          </div>
        </div>

        {/* Where it sits — reduced from "איפה זה יושב במסע" to a plain progress line */}
        <div style={{ textAlign: "center", marginTop: 34, marginBottom: 10 }}>
          <div style={{ color: C.mut, fontSize: 14, marginBottom: 10 }}>זה הצעד הראשון.</div>
          <div style={{ display: "inline-flex", flexDirection: "column", gap: 5, textAlign: "start", fontSize: 14, lineHeight: 1.7 }}>
            <span style={{ color: C.green }}>גילוי האות <span style={{ marginInlineStart: 4 }}>✓</span></span>
            <span style={{ color: C.goldL, fontWeight: 700 }}>כוורת האות <span style={{ marginInlineStart: 4, fontSize: 13 }}>← אתה כאן</span></span>
            <span style={{ color: C.mut }}>סדנה</span>
            <span style={{ color: C.mut }}>אסטרטגיה</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 18, padding: "26px 24px", marginTop: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 800, color: C.goldL, background: "rgba(232,185,74,0.12)", border: "1px solid rgba(232,185,74,0.32)", borderRadius: 999, padding: "4px 12px", marginBottom: 10, letterSpacing: 0.5 }}>
              מחיר למשתתפים הראשונים
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 18, color: C.mut, textDecoration: "line-through" }}>₪880</span>
              <span style={{ fontSize: 38, fontWeight: 800, color: C.goldL }}>₪590</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: 13.5, color: C.fg, lineHeight: 1.9 }}>
              <li><span style={{ color: C.green, marginInlineEnd: 6 }}>✔</span>גישה מיידית</li>
              <li><span style={{ color: C.green, marginInlineEnd: 6 }}>✔</span>פעם אחת בלבד</li>
              <li><span style={{ color: C.green, marginInlineEnd: 6 }}>✔</span>שלך לתמיד</li>
            </ul>
          </div>
          <SignalHiveCTA whatsappPhone={wa} />
          <div style={{ textAlign: "center", fontSize: 12, color: C.mut, marginTop: 10 }}>
            מתחילים כבר היום.
          </div>
          <div style={{ textAlign: "center", fontSize: 12.5, color: C.mut, marginTop: 18, lineHeight: 1.6, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
            עוד לא עברת את גילוי האות?{" "}
            <Link href="/signal" style={{ color: C.gold, textDecoration: "underline", textUnderlineOffset: 3 }}>מתחילים כאן →</Link>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 19, color: C.fg, lineHeight: 1.55, marginTop: 44, maxWidth: 520, marginInline: "auto", fontWeight: 700 }}>
          גילית מי אתה.<br />
          <span style={{ color: C.goldL }}>עכשיו תן לעולם לפגוש אותך.</span>
        </p>

      </div>
    </main>
  );
}
