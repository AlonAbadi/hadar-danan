import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { WorkshopCTA } from "./WorkshopCTA";
import { NextWorkshopBadge } from "./NextWorkshopBadge";
import { AbandonCheckoutPopup } from "@/components/landing/AbandonCheckoutPopup";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { getUserCredit } from "@/lib/credit";
import { PRODUCT_MAP } from "@/lib/products";

export const metadata = {
  title: "סדנה יום אחד | הדר דנן",
  description: "יום אחד אינטנסיבי שבונה לך מערכת שיווק שרצה לבד. 1,080 שקל.",
  alternates: { canonical: "/workshop" },
};

export default async function WorkshopPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  const price         = String(PRODUCT_MAP.workshop_1080.price);
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "972539566961";
  const credit        = email ? await getUserCredit(email) : 0;

  return (
    <>
      <AbandonCheckoutPopup product="workshop" />
      <ProductLandingPage
        productName="סדנה יום אחד"
        price={PRODUCT_MAP.workshop_1080.price}
        originalPrice={1980}
        checkoutHref="#cta"

        headline={<>יום אחד. <em>בידול שמשנה</em> את כל השאר.</>}
        heroSub="וורקשופ אינטנסיבי של 6 שעות שבונה את תשתית השיווק של העסק שלך - מאסטרטגיה ועד אוטומציה. יוצאים עם מערכת שעובדת."
        stats={[
          { val: "6",     label: "שעות אינטנסיביות" },
          { val: "641",   label: "ערך בונוסים" },
          { val: "12",    label: "חודשי גישה להקלטה" },
          { val: "97%",   label: "ממליצים" },
        ]}
        heroExtra={<NextWorkshopBadge />}

        problemItems={[
          { icon: "🗓", text: "כל שבוע מתחיל מחדש: מה לפרסם? לאן? עם לוח שנה ריק ובלי כיוון." },
          { icon: "🎯", text: "יש לך עסק טוב - אבל השוק לא יודע. כי אין מסר ברור שמגיע לאנשים הנכונים." },
          { icon: "⚙️", text: "כל לקוח מגיע ממפה לפה. אין מנגנון אוטומטי שמייצר לידים חדשים כל חודש." },
        ]}
        agitationText="יום אחד שבו עוצרים, מסתכלים על העסק מבחוץ, ובונים את השפה שתגרום לאנשים להבין אותך - ולרצות לעבוד איתך."

        solutionTitle="6 מודולים - 6 שעות - מערכת שלמה"
        solutionDesc="בנויים יחד, מותאמים לעסק שלך"
        solutionItems={[
          { num: "01", title: "אסטרטגיית תוכן שנה קדימה",   desc: "נבנה ביחד לוח תוכן ל-12 חודשים - נושאים, פורמטים ותדירות. לא תצטרך לחשוב מה לפרסם." },
          { num: "02", title: "מיתוג אישי חד ובלתי נשכח",    desc: "הסיפור שלך, הקול שלך, הוויז'ואל שלך - הכל מתואם ועקבי. ייחוד שאנשים זוכרים." },
          { num: "03", title: "משפך מכירות אוטומטי",          desc: "רצף שמביא ליד - שיחה - עסקה, בלי שתיגע בזה כל יום. אוטומציה שעובדת בשבילך." },
          { num: "04", title: "פרסום ממומן בתקציב קטן",       desc: "פייסבוק ואינסטגרם: מה עובד ב-2026 - עם דוגמאות חיות וטיפים ישירים." },
          { num: "05", title: "מדידה ואופטימיזציה",           desc: "אילו מספרים חשובים, אילו מבלבלים - ואיך להחליט נכון מה להמשיך ומה לעצור." },
          { num: "06", title: "שאלות ותשובות ותוכנית אישית",  desc: "שעה שלמה של שאלות ותשובות + תוכנית פעולה אישית שאפשר ליישם מחר בבוקר." },
        ]}

        notForItems={[
          "מי שאין לו עסק פועל",
          "מי שמחפש תוצאות בלי מאמץ",
          "עסקים ורטיקלים מאוד נישתיים ללא קהל דיגיטלי",
        ]}
        forItems={[
          "בעלי עסקים שרוצים מערכת שיווק שרצה לבד",
          "מי שסיים את האתגר ורוצה לבנות יותר",
          "מי שמרגיש שהשיווק שלו לא עקבי",
          "מי שרוצה לוח שנה מלא לשנה הקרובה",
        ]}

        whoName="הדר דנן"
        whoRole="אסטרטגיסטית שיווק ותוכן"
        whoText="הסדנה היא יום עבודה אמיתי - לא הרצאה. אנחנו בונים ביחד את מערכת השיווק שלך בזמן אמת. כל משתתף יוצא עם תוכנית אישית מותאמת לעסק שלו."

        proofStats={[
          { val: "250+", label: "עסקים" },
          { val: "40%",  label: "גידול ממוצע בהכנסה" },
          { val: "97%",  label: "ממליצים" },
        ]}
        testimonials={[
          { text: "יצאתי מהסדנה עם מערכת שיווק שלמה. תוך שבועיים הכנסה גדלה ב-40%.", author: "רחל א.", role: "מאמנת אישית" },
          { text: "השקעתי יום אחד וחסכתי חצי שנה של ניסוי וטעייה. הכי שווה שהשקעתי בעסק.", author: "עמית ס.", role: "מעצב פנים" },
          { text: "הסדנה נתנה לי כלים ובעיקר בהירות. יש לי עכשיו תוכנית ולא רק רעיונות.", author: "לירון ב.", role: "נטורופתית" },
        ]}

        anchorItems={[
          { val: "5,000+",    label: "ייעוץ שיווקי פרטי (3 מפגשים)" },
          { val: "2,000 לחודש", label: "מנהל שיווק חלקי" },
          { val: "641",       label: "ערך הבונוסים הכלולים" },
        ]}
        anchorTotal="7,000+"

        questions={[
          {
            q: "מה הכי חסר לך עכשיו?",
            options: ["תוכנית ברורה", "כלים ואוטומציה", "קהל שמגיע אלי", "מסר ברור לשוק"],
          },
          {
            q: "כמה לקוחות חדשים אתה רוצה בחודש?",
            options: ["2-4", "5-10", "יותר מ-10", "כמה שיותר"],
          },
          {
            q: "מה שלב השיווק שלך עכשיו?",
            options: ["מתחיל", "יש לי קצת נוכחות", "פעיל אבל לא צומח", "צמחתי ורוצה יותר"],
          },
        ]}
        resultMessages={{
          "תוכנית":   "בדיוק לזה הסדנה. תצא עם לוח שנה מלא ל-12 חודשים.",
          "כלים":     "מודול 3 בסדנה עוסק בדיוק בזה - אוטומציה שעובדת בשבילך.",
          "קהל":      "הסדנה תגדיר מי הקהל שלך ואיך לגרום לו להגיע - בלי לרדוף אחריו.",
          "מסר":      "מודול 2 בסדנה בונה את המיתוג האישי שלך - מסר חד ובלתי נשכח.",
        }}

        creditNote={credit > 0 ? `יש לך זיכוי של ${credit} שקל - מקוזז אוטומטית` : undefined}

        faqs={[
          { q: "מתי מתקיימת הסדנה?",              a: "תאריכים קרובים מופיעים בבאג 'הסדנה הקרובה' למעלה. ניתן לרשום מקום עכשיו." },
          { q: "האם זה וירטואלי או פיזי?",         a: "זום - כדי לאפשר השתתפות מכל הארץ. ההקלטה נשמרת ל-12 חודשים." },
          { q: "כמה משתתפים בכל סדנה?",            a: "קבוצה קטנה עד 15 איש - כדי שכל אחד מקבל תשומת לב אישית." },
          { q: "מה כולל כל בונוס?",                a: "50 תבניות תוכן, מאגר פרומפטים ל-AI, וגישה להקלטה ל-12 חודשים - הכל נשלח לאחר הסדנה." },
          { q: "מה מדיניות ביטול?",                a: "ניתן לבטל עד 48 שעות לפני הסדנה - החזר מלא. ביטול מאוחר יותר - זיכוי לסדנה עתידית." },
        ]}

        finalTitle="מוכן/ת לבנות מערכת שיווק שעובדת?"
        finalSub="6 שעות שבונות לך את תשתית השיווק לשנה הקרובה."

        whatsappNumber={whatsappPhone}

        ctaSlot={
          <>
            <CreditBanner credit={credit} listPrice={PRODUCT_MAP.workshop_1080.price} productName="הסדנה יום אחד" dark />
            <WorkshopCTA price={price} whatsappPhone={whatsappPhone} credit={credit} />
            {credit > 0 && (
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(201,150,74,0.75)", marginTop: 8 }}>
                הזיכוי מקוזז אוטומטית -{" "}
                <a href="/my" style={{ color: "rgba(201,150,74,0.75)", textDecoration: "underline" }}>בדוק באזור האישי</a>
              </p>
            )}
          </>
        }
      />
    </>
  );
}
