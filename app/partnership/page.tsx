import Link from "next/link";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { PartnershipBookingFlow } from "./PartnershipBookingFlow";
import { ViewContentTracker } from "@/components/analytics/ViewContentTracker";

export const metadata = {
  title: "שותפות אסטרטגית | הדר דנן",
  description: "שותפות שיווקית אסטרטגית לטווח ארוך - לעסקים שרוצים נוכחות דיגיטלית שמייצרת תוצאות אמיתיות.",
  alternates: { canonical: "/partnership" },
};

export default async function PartnershipPage() {

  return (
    <>
    <ViewContentTracker product="partnership_lead" value={0} />

    {/* On-ramp banner — for visitors who aren't ready to commit to a retainer */}
    <section style={{ background: "#080C14", padding: "20px 16px", borderBottom: "1px solid rgba(232,185,74,0.12)" }}>
      <Link
        href="/apply"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          maxWidth: 960,
          margin: "0 auto",
          padding: "14px 22px",
          borderRadius: 14,
          background: "linear-gradient(145deg, rgba(232,185,74,0.06), rgba(232,185,74,0.02))",
          border: "1px solid rgba(232,185,74,0.25)",
          textDecoration: "none",
          direction: "rtl",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 280 }}>
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              padding: "4px 10px",
              borderRadius: 999,
              color: "#080C14",
              background: "linear-gradient(90deg, #9E7C3A, #E8B94A)",
            }}
          >
            מסלול חלופי
          </span>
          <div style={{ color: "#EDE9E1", fontSize: 14, lineHeight: 1.5 }}>
            <strong style={{ fontWeight: 700, color: "#EDE9E1" }}>לא בטוח ששותפות מלאה זה בשבילך?</strong>{" "}
            <span style={{ color: "#AAB0BD" }}>
              יש מסלול מועמדות — שלושה ימים אינטנסיביים, תשלום בסיסי + אחוז מההצלחה. אם יעבוד, נמשיך לשותפות.
            </span>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            color: "#E8B94A",
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          להגשת מועמדות ←
        </span>
      </Link>
    </section>

    <ProductLandingPage
      productName="שותפות אסטרטגית"
      price={0}
      checkoutHref="#apply"

      vimeoId="1184810808"
      ctaLabel="בדוק התאמה"
      headline={<>שותפות אסטרטגית. <em>צמיחה משותפת.</em></>}
      heroSub="שותפות שיווקית לטווח ארוך - לא עוד ספק, אלא מישהי שיושבת לצדכם ומבינה את העסק. לא רק כותבת תוכן, אלא חושבת איתכם אסטרטגיה."
      stats={[
        { val: "10k-30k", label: "שקל לחודש" },
        { val: "3",        label: "עסקים פעילים" },
        { val: "4 שנים",   label: "ניסיון" },
        { val: "TrueSignal", label: "מבוסס שיטה" },
      ]}

      problemItems={[
        { icon: "✍️", text: "ספק חיצוני כותב תוכן בלי להבין את הלקוחות שלך - ומקבלים תוכן גנרי שלא מייצג אתכם." },
        { icon: "🔄", text: "כל חודש מתחילים מחדש - אין זיכרון ארגוני, אין חוט אדום, אין בנייה מצטברת." },
        { icon: "🎯", text: "האסטרטגיה מנותקת מהביצוע. מה שתכננו ומה שיוצא - שתי מציאויות שונות." },
      ]}
      agitationText="שותפות אסטרטגית עובדת אחרת. אני לומדת את העסק לעומק - ובונה מנגנון שמתפתח לאורך זמן."

      solutionTitle="מה כלול בכל חודש"
      solutionDesc="לא חבילה. שותפות מותאמת אישית."
      solutionItems={[
        { num: "1", title: "אסטרטגיית תוכן חודשית",  desc: "תכנון קמפיינים, נרטיב, ומסרים מרכזיים - מותאם לעסק שלך ולמה שקורה עכשיו בשוק." },
        { num: "2", title: "כתיבת תוכן שיווקי",       desc: "פוסטים, ניוזלטרים, דפי נחיתה, תסריטי וידאו - בקול שלך, לא בקול שלי." },
        { num: "3", title: "ניתוח ואופטימיזציה",       desc: "מה עובד, מה לא, ואיך משפרים - דוח חודשי ברור עם המלצות מעשיות." },
        { num: "4", title: "ליווי שוטף",               desc: "זמינות בוואטסאפ לשאלות, בדיקת תכנים, ופידבק מהיר לאורך כל החודש." },
        { num: "5", title: "ייעוץ אסטרטגי",           desc: "שיחת עומק חודשית - לא רק טקטיקות, אלא כיוון עסקי ובחינת ההנחות הבסיסיות." },
      ]}

      notForItems={[
        "עסקים שרוצים תוצאות מיידיות בחודש אחד",
        "מי שלא מוכן לשתף מידע עסקי לעומק",
        "עסקים שמחפשים ספק, לא שותף",
      ]}
      forItems={[
        "חברות ומותגים שמחפשים קול דיגיטלי מדויק",
        "בעלי עסקים מבוססים שרוצים לצמוח בשיטה",
        "בעלי עסקים שמוכנים להשקיע לטווח ארוך",
        "מי שמחפש שותפה, לא עוד ספקית",
      ]}

      whoName="הדר דנן"
      whoRole="אסטרטגיסטית שיווק ותוכן"
      whoText="לא מחפשת עוד לקוח. מחפשת שותפות שתיצור ערך אמיתי לשני הצדדים. לכן אני עובדת עם מעט עסקים בכל פעם - ונותנת לכל אחד תשומת לב מלאה. כל שותפות מבוססת שיטת TrueSignal."

      proofStats={[
        { val: "500+", label: "עסקים" },
        { val: "4 שנים", label: "ניסיון" },
        { val: "3",    label: "שותפויות פעילות" },
      ]}
      testimonials={[
        { text: "הדר לא רק כותבת לנו תוכן - היא חושבת איתנו על העסק. זה שינה את כל הדרך שבה אנחנו מתקשרים.", author: "אבי ל.", role: "מנכ״ל חברת ייעוץ" },
        { text: "תוך 3 חודשים הפכנו ממותג שאיש לא הכיר לנוכחות שמייצרת פניות איכותיות מדי שבוע.", author: "שני מ.", role: "בעלת עסק" },
      ]}

      faqs={[
        { q: "מה כולל שיחת ההיכרות?",              a: "20 דקות - ללא עלות וללא התחייבות. נבדוק אם יש התאמה ואיזה מסגרת מתאימה לכם." },
        { q: "מה המינימום שמות לשותפות?",           a: "3 חודשים - כי תוצאות שיווקיות בונות מומנטום. שיחת ההיכרות תבהיר מה מתאים." },
        { q: "כמה שותפויות אתם מנהלים בו-זמנית?",  a: "3 בלבד. כדי לשמור על עומק ואיכות - לא מרחיבים יותר מזה." },
        { q: "מה הדרישות מהצד שלנו?",              a: "פתיחות, זמינות לשיחה חודשית, ואמון. בלי כניסה לעומק - אי אפשר לבנות שפה אמיתית." },
      ]}

      finalTitle="בדוק/י אם יש התאמה"
      finalSub="השאר פרטים ונחזור אליך תוך 24–48 שעות."

      hideMicroCommitment

      bottomSlot={
        <section id="apply" style={{ padding: "48px 20px", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontWeight: 900, fontSize: 28, color: "#EDE9E1", margin: "0 0 10px" }}>
              בדוק/י אם יש התאמה
            </h2>
            <p style={{ color: "#AAB0BD", fontSize: 15 }}>
              מלא/י את הפרטים ונחזור אליך תוך 24–48 שעות לשיחת היכרות קצרה.
            </p>
            <p style={{ color: "rgba(158,153,144,0.5)", fontSize: 13, marginTop: 8 }}>
              10,000-30,000 שקל + מע״מ לחודש - על בסיס מקום פנוי
            </p>
          </div>
          <div style={{ background: "#191F2B", border: "1px solid #2C323E", borderRadius: 20, padding: "28px 24px" }}>
            <PartnershipBookingFlow />
          </div>
        </section>
      }
    />
    </>
  );
}
