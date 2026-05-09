import { ViewContentTracker } from "@/components/analytics/ViewContentTracker";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { WorkshopCTA } from "./WorkshopCTA";
import { NextWorkshopBadge } from "./NextWorkshopBadge";
import { WorkshopTestimonials } from "./WorkshopTestimonials";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { getUserCredit } from "@/lib/credit";
import { PRODUCT_MAP } from "@/lib/products";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const WORKSHOP_FAQS = [
  { question: "מה זה סדנת יום אחד?", answer: "סדנת עומק פעילה בלייב — יום שלם שמתרגלים בו יכולות ביטוי, השפעה וכריזמה. לומדים לבוא עם מי שאנחנו מול מצלמה ומול קהל, ויוצאים עם מערך שיווקי ברור ומותג אישי שמוכר." },
  { question: "למי מתאימה הסדנה?", answer: "לבעלי עסקים, מנכ\"לים ויוצרי תוכן שרוצים לבלוט במסך ולחיות שיווק — כאלה שמרגישים שהם מתאמצים מול מצלמה ולא מביאים את עצמם באמת." },
  { question: "מה ההבדל בין הסדנה לאתגר 7 הימים?", answer: "האתגר הוא שבוע דיגיטלי של בניית הרגלי תוכן. הסדנה היא יום פיזי אינטנסיבי שעובד על הביטוי, הנוכחות והמסר — חוויה קבוצתית עמוקה שמשנה איך אתה מופיע בעולם." },
  { question: "מתי ואיפה מתקיימת הסדנה?", answer: "בבית ציוני אמריקה, תל אביב. תאריכים קרובים מופיעים בבאג 'הסדנה הקרובה' למעלה." },
  { question: "מה יוצאים עם זה?", answer: "יכולת לבנות מערך שיווקי לשירות שלך, הופעה מול קהל ומצלמה, הבנה אמיתית של מה אתה מוכר, ומשפך וידאו שמכניס כסף." },
];

export const metadata = {
  title: "סדנת יום אחד | הדר דנן",
  description: "סדנת עומק פעילה בלייב — יכולות ביטוי, השפעה וכריזמה מול מצלמה וקהל. 600+ בעלי עסקים כבר עברו אותה.",
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
        name="סדנת יום אחד - הדר דנן"
        description="סדנת עומק פעילה בלייב — יכולות ביטוי, השפעה וכריזמה מול מצלמה וקהל. 600+ בעלי עסקים כבר עברו אותה."
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

        headline={<>איך מביאים את <em>מי שאנחנו</em> ומפסיקים להתאמץ בוידאו?</>}
        heroSub="נתרגל יכולות ביטוי, השפעה וכריזמה — נביא את עצמנו בחופשיות ובאותנטיות מול מצלמה ונלמד להפוך את מי שאנחנו למותג אישי מצליח."
        vimeoId="1186650827"
        definitionBlock={'סדנת עומק פעילה בלייב — הדר דנן מציגה. מעל 600 בעלי עסקים, מנכ"לים ויוצרי תוכן שרצו ללמוד לבלוט במסך ולחיות שיווק כבר עברו את הסדנה בהצלחה.'}
        stats={[
          { val: "600+", label: "עברו את הסדנה" },
          { val: "97%",  label: "ממליצים" },
        ]}
        heroExtra={<NextWorkshopBadge />}

        problemItems={[
          { icon: "🎥", text: "מרגיש/ת שאתה/את מתאמץ/ת מול המצלמה ולא מביא/ה את עצמך באמת — הסרטונים יוצאים 'בסדר' אבל לא מביאים לקוחות." },
          { icon: "💭", text: "יש לך מה לתת לעולם אבל זה לא עובר כשאתה/את מקליט/ה — משהו נחסם ואתה/את יודע/ת שאתה/את לא מופיע/ה ב-100%." },
          { icon: "🔑", text: "כל כך הרבה פעמים מה שמרחיק אותנו מהשפע שמגיע לנו זה מחסומים שאנחנו לא מודעים אליהם אפילו." },
        ]}
        agitationText="מצאתי אנשים בוכים, מתחדשים, משתנים — וכשבסוף גם גילו שכל הטרנספורמציה הזו באה לידי ביטוי בלידים ובכסף. עם עבודת ביטוי עצמי + חווית למידה קבוצתית אינטנסיבית — אנשים יוצאים לחופשי ומגלים את מי שהם באמת."

        solutionTitle="עם מה תוכלו לצאת מהסדנה?"
        solutionDesc="5 שעות שמשנות את הדרך שבה אתם מופיעים בעולם"
        solutionItems={[
          { num: "01", title: "מערך אסטרטגי שיווקי",          desc: "היכולת לבנות מערך אסטרטגי שיווקי לשירות / מוצר שלכם — מהראש לידיים." },
          { num: "02", title: "הופעת חיים מול קהל ומצלמה",   desc: "לדעת לתת את הופעת חייכם מול קהל ומצלמה — בחופשיות ובאותנטיות." },
          { num: "03", title: "להבין מה ואיך אתם מוכרים",    desc: "אחת ולתמיד להבין מה ואיך אתם מוכרים באמת. (ולא, זה לא מה שאתם חושבים שאתם מוכרים.)" },
          { num: "04", title: "משפך וידאו שמכניס כסף",        desc: "ההבנה איך לייצר משפך שיווקי בוידאו שמכניס כסף — ועובד בשבילכם גם כשאתם ישנים." },
          { num: "05", title: "נוכחות וביטוי בחופש מוחלט",   desc: "שכלול הנוכחות שלכם והיכולת להתבטא בחופש מוחלט — כדי למכור בקלות ובטבעיות." },
        ]}

        notForItems={[
          "מי שאין לו עסק פועל",
          "מי שמחפש תוצאות בלי מאמץ אישי",
          "מי שלא מוכן/ה לעבוד על עצמו/ה בחוויה קבוצתית אינטנסיבית",
        ]}
        forItems={[
          "בעלי עסקים, מנכ\"לים ויוצרי תוכן שרוצים לבלוט במסך",
          "מי שמרגיש/ת שהוא/היא מתאמץ/ת מול מצלמה ולא מביא/ה את עצמו/ה",
          "מי שיש לו/ה מה לתת לעולם אבל זה לא עובר בוידאו",
          "מי שרוצה לחיות שיווק — ולא רק לפרסם",
        ]}

        whoName="הדר דנן"
        whoRole="אסטרטגיסטית שיווק ותוכן"
        whoText={'זה רק התחיל כסדנת שיווק… אנשים תיארו אותה כ"טיפול לנפש", "משהו שלא חוויתי עד היום", "הצלחת לקרוא אותי", "להיות אתה ב-100%", "להכיר את עצמי מחדש". ככה אנשים שעברו את הסדנה הגדירו מחדש את מה שחשבתי שאני נותנת לעולם. מצאתי אנשים בוכים, מתחדשים, משתנים — וכשבסוף גם גילו שכל הטרנספורמציה הזו באה לידי ביטוי בלידים ובכסף.'}

        proofStats={[
          { val: "600+", label: "עסקים" },
          { val: "40%",  label: "גידול ממוצע בהכנסה" },
          { val: "97%",  label: "ממליצים" },
        ]}
        testimonials={[]}
        proofSlot={<WorkshopTestimonials />}

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
          "תוכנית":   "בדיוק לזה הסדנה. תצא עם מערך אסטרטגי שיווקי מלא מהראש לידיים.",
          "כלים":     "הסדנה תלמד אותך איך לייצר משפך וידאו שמכניס כסף — ועובד גם כשאתה ישן.",
          "קהל":      "הסדנה תפתח את הביטוי, הנוכחות והכריזמה שלך — כדי שהקהל יגיע אליך.",
          "מסר":      "הסדנה תעזור לך להבין מה ואיך אתה מוכר באמת — מסר חד ובלתי נשכח.",
        }}

        creditNote={credit > 0 ? `יש לך זיכוי של ${credit} שקל - מקוזז אוטומטית` : undefined}

        faqSectionTitle="שאלות נפוצות על הסדנה"
        faqs={WORKSHOP_FAQS.map(f => ({ q: f.question, a: f.answer }))}

        finalTitle="מוכן/ת להפסיק להתאמץ ולהתחיל לבלוט?"
        finalSub="5 שעות שמשנות את הדרך שבה אתם מופיעים בעולם — ומביאים לקוחות."

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
