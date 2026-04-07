import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { PartnershipBookingFlow } from "./PartnershipBookingFlow";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "שותפות אסטרטגית | הדר דנן",
  description: "שותפות שיווקית אסטרטגית לטווח ארוך - לעסקים שרוצים נוכחות דיגיטלית שמייצרת תוצאות אמיתיות.",
  alternates: { canonical: "/partnership" },
};

export default async function PartnershipPage() {
  const supabase = createServerClient();
  const { data: bookedSlots } = await supabase
    .from("bookings")
    .select("slot_date, slot_time")
    .eq("status", "confirmed");

  return (
    <ProductLandingPage
      productName="שותפות אסטרטגית"
      price={0}
      checkoutHref="#apply"

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
        "משפיעניות ויוצרות תוכן שרוצות להפוך קהל להכנסה",
        "חברות ומותגים שמחפשים קול דיגיטלי מדויק",
        "בעלי עסקים שמוכנים להשקיע לטווח ארוך",
        "מי שמחפש שותפה, לא עוד ספקית",
      ]}

      whoName="הדר דנן"
      whoRole="אסטרטגיסטית שיווק ותוכן"
      whoText="לא מחפשת עוד לקוח. מחפשת שותפות שתיצור ערך אמיתי לשני הצדדים. לכן אני עובדת עם מעט עסקים בכל פעם - ונותנת לכל אחד תשומת לב מלאה. כל שותפות מבוססת שיטת TrueSignal."

      proofStats={[
        { val: "250+", label: "עסקים" },
        { val: "4 שנים", label: "ניסיון" },
        { val: "3",    label: "שותפויות פעילות" },
      ]}
      testimonials={[
        { text: "הדר לא רק כותבת לנו תוכן - היא חושבת איתנו על העסק. זה שינה את כל הדרך שבה אנחנו מתקשרים.", author: "אבי ל.", role: "מנכ״ל חברת ייעוץ" },
        { text: "תוך 3 חודשים הפכנו ממותג שאיש לא הכיר לנוכחות שמייצרת פניות איכותיות מדי שבוע.", author: "שני מ.", role: "יוצרת תוכן" },
      ]}

      faqs={[
        { q: "מה כולל שיחת ההיכרות?",              a: "20 דקות - ללא עלות וללא התחייבות. נבדוק אם יש התאמה ואיזה מסגרת מתאימה לכם." },
        { q: "מה המינימום שמות לשותפות?",           a: "3 חודשים - כי תוצאות שיווקיות בונות מומנטום. שיחת ההיכרות תבהיר מה מתאים." },
        { q: "כמה שותפויות אתם מנהלים בו-זמנית?",  a: "3 בלבד. כדי לשמור על עומק ואיכות - לא מרחיבים יותר מזה." },
        { q: "מה הדרישות מהצד שלנו?",              a: "פתיחות, זמינות לשיחה חודשית, ואמון. בלי כניסה לעומק - אי אפשר לבנות שפה אמיתית." },
      ]}

      finalTitle="בדוק/י אם יש התאמה"
      finalSub="שיחת היכרות של 20 דקות - ללא עלות וללא התחייבות."

      hideMicroCommitment

      bottomSlot={
        <section id="apply" style={{ padding: "48px 20px", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontWeight: 900, fontSize: 28, color: "#EDE9E1", margin: "0 0 10px" }}>
              בדוק/י אם יש התאמה
            </h2>
            <p style={{ color: "#9E9990", fontSize: 15 }}>
              מלא/י את הפרטים ובחר/י מועד לשיחת היכרות קצרה - 20 דקות, ללא עלות וללא התחייבות.
            </p>
            <p style={{ color: "rgba(158,153,144,0.5)", fontSize: 13, marginTop: 8 }}>
              10,000-30,000 שקל + מע״מ לחודש - על בסיס מקום פנוי
            </p>
          </div>
          <div style={{ background: "#191F2B", border: "1px solid #2C323E", borderRadius: 20, padding: "28px 24px" }}>
            <PartnershipBookingFlow bookedSlots={bookedSlots ?? []} />
          </div>
        </section>
      }
    />
  );
}
