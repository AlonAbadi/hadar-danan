import { ViewContentTracker } from "@/components/analytics/ViewContentTracker";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { WorkshopCTA } from "./WorkshopCTA";
import { NextWorkshopBadge } from "./NextWorkshopBadge";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { getUserCredit } from "@/lib/credit";
import { PRODUCT_MAP } from "@/lib/products";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const WORKSHOP_FAQS = [
  { question: "מה זה סדנת יום אחד?", answer: "סדנת יום אחד היא וורקשופ אינטנסיבי של 5 שעות מבוסס שיטת TrueSignal. בסדנה בונים ביחד את תשתית השיווק של העסק — מאסטרטגיית תוכן שנתית, מיתוג אישי, משפך מכירות אוטומטי ועד מדידה ואופטימיזציה. יוצאים עם מערכת שיווק שעובדת." },
  { question: "למי מתאימה סדנת יום אחד?", answer: "מתאימה לבעלי עסקים שרוצים מערכת שיווק שרצה לבד, למי שסיים את האתגר 7 הימים ורוצה לבנות יותר, ולמי שמרגיש שהשיווק שלו לא עקבי." },
  { question: "מה ההבדל בין הסדנה לאתגר 7 הימים?", answer: "האתגר הוא שבוע להנחת יסודות ה-Signal. הסדנה (יום אחד) היא השלב המתקדם: 5 שעות שבונות מערכת שיווק מלאה — כולל אוטומציה, פרסום ממומן ולוח שנה שלם לשנה." },
  { question: "מתי מתקיימת הסדנה?", answer: "תאריכים קרובים מופיעים בבאג 'הסדנה הקרובה' למעלה. ניתן לרשום מקום עכשיו." },
  { question: "איפה מתקיימת הסדנה?", answer: "פיזי — בבית ציוני אמריקה, תל אביב. ימי חמישי לקראת סוף כל חודש." },
];

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

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  return (
    <>
      <ProductSchema
        type="Course"
        name="סדנה יום אחד - שיטת TrueSignal"
        description="יום אחד אינטנסיבי שבונה מערכת שיווק שרצה לבד. מתודולוגיה קונקרטית עם הדר דנן."
        url={`${APP_URL}/workshop`}
        price={1080}
        imageUrl={`${APP_URL}/sadna.png`}
      />
      <FAQSchema items={WORKSHOP_FAQS} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "סדנה יום אחד", url: `${APP_URL}/workshop` },
      ]} />
      <ViewContentTracker product="workshop_1080" value={1080} />
      <ProductLandingPage
        productName="סדנה יום אחד"
        price={PRODUCT_MAP.workshop_1080.price}
        originalPrice={1980}
        checkoutHref="#cta"

        headline={<>יום אחד. <em>בידול שמשנה</em> את כל השאר.</>}
        heroSub="וורקשופ אינטנסיבי של 5 שעות שבונה את תשתית השיווק של העסק שלך - מאסטרטגיה ועד אוטומציה. יוצאים עם מערכת שעובדת."
        vimeoId="1186650827"
        definitionBlock="סדנת יום אחד היא וורקשופ אינטנסיבי של 5 שעות מבוסס שיטת TrueSignal. 5 מודולים שבונים ביחד את מערכת השיווק של העסק — אסטרטגיית תוכן לשנה, מיתוג אישי, משפך מכירות אוטומטי ופרסום ממומן. 500+ עסקים כבר יישמו את השיטה עם 40% גידול ממוצע בהכנסה."
        stats={[
          { val: "5",     label: "שעות אינטנסיביות" },
          { val: "97%",   label: "ממליצים" },
        ]}
        heroExtra={<NextWorkshopBadge />}

        problemItems={[
          { icon: "🗓", text: "כל שבוע מתחיל מחדש: מה לפרסם? לאן? עם לוח שנה ריק ובלי כיוון." },
          { icon: "🎯", text: "יש לך עסק טוב - אבל השוק לא יודע. כי אין מסר ברור שמגיע לאנשים הנכונים." },
          { icon: "⚙️", text: "כל לקוח מגיע ממפה לפה. אין מנגנון אוטומטי שמייצר לידים חדשים כל חודש." },
        ]}
        agitationText="יום אחד שבו עוצרים, מסתכלים על העסק מבחוץ, ובונים את השפה שתגרום לאנשים להבין אותך - ולרצות לעבוד איתך."

        solutionTitle="5 מודולים - 5 שעות - מערכת שלמה"
        solutionDesc="בנויים יחד, מותאמים לעסק שלך"
        solutionItems={[
          { num: "01", title: "אסטרטגיית תוכן שנה קדימה",   desc: "נבנה ביחד לוח תוכן ל-12 חודשים - נושאים, פורמטים ותדירות. לא תצטרך לחשוב מה לפרסם." },
          { num: "02", title: "מיתוג אישי חד ובלתי נשכח",    desc: "הסיפור שלך, הקול שלך, הוויז'ואל שלך - הכל מתואם ועקבי. ייחוד שאנשים זוכרים." },
          { num: "03", title: "משפך מכירות אוטומטי",          desc: "רצף שמביא ליד - שיחה - עסקה, בלי שתיגע בזה כל יום. אוטומציה שעובדת בשבילך." },
          { num: "04", title: "פרסום ממומן בתקציב קטן",       desc: "פייסבוק ואינסטגרם: מה עובד ב-2026 - עם דוגמאות חיות וטיפים ישירים." },
          { num: "05", title: "מדידה ואופטימיזציה",           desc: "אילו מספרים חשובים, אילו מבלבלים - ואיך להחליט נכון מה להמשיך ומה לעצור." },
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
          { val: "500+", label: "עסקים" },
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

        faqSectionTitle="שאלות נפוצות על הסדנה"
        faqs={WORKSHOP_FAQS.map(f => ({ q: f.question, a: f.answer }))}

        finalTitle="מוכן/ת לבנות מערכת שיווק שעובדת?"
        finalSub="5 שעות שבונות לך את תשתית השיווק לשנה הקרובה."

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
