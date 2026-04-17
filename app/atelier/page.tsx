import type { Metadata } from "next";
import { AtelierLandingClient } from "./AtelierLandingClient";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "beegood atelier - ממשפיענית למנהיגה תרבותית",
  description: "סדנת אמן לאסטרטגיה ותוכן. עובדים עם מספר מצומצם של משפיעניות נבחרות - בונים איתן אסטרטגיה, נרטיב ופלטפורמה דיגיטלית מלאה.",
  alternates: { canonical: "/atelier" },
};

const ATELIER_FAQS = [
  { question: "כמה זה עולה?", answer: "המחיר מותאם אישית לכל לקוחה בהתאם להיקף העבודה. המודל כולל דמי כניסה חד פעמיים + עמלה חודשית מהכנסות הפלטפורמה. את המחיר המדויק נדבר בשיחת ההיכרות, כשנבין טוב יותר מה בדיוק את צריכה." },
  { question: "כמה זמן לוקח מההתחלה ועד שהאתר עולה?", answer: "בדרך כלל 3-6 שבועות מהסיום של שלוש פגישות האסטרטגיה ועד השקה. את הפלטפורמה הטכנית אנחנו מקימים בימים, אבל הדיוק של הנרטיב והבנייה של התכנים לוקחים זמן שיצא נכון." },
  { question: "מה הבעלות שלי על האתר והתכנים?", answer: "מלאה. התכנים שלך, הדומיין הוא שלך (אנחנו מארחים אותו תחת beegood.online), חשבון Cardcom הוא שלך, הכסף נכנס אלייך ישירות. אנחנו שותפים להצלחה דרך עמלה חודשית, לא בעלים." },
  { question: "האם אני יכולה לצאת מהשותפות?", answer: "כן. אנחנו מאמינים ששותפות אמיתית נבנית על בחירה, לא על חוזים מגבילים. התנאים המדויקים של יציאה הדדית יהיו חלק מההסכם שנבנה ביחד." },
  { question: "איך אדע שזה מתאים לי?", answer: "בדיוק בשביל זה קיימת שיחת ההיכרות של 20 הדקות. אנחנו לא מנסים למכור - אנחנו בודקים התאמה. אם נראה שזה לא הזמן, או לא המודל, נגיד לך בפה מלא." },
];

export default async function AtelierPage() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  return (
    <>
      <ProductSchema
        type="Service"
        name="beegood atelier - אסטרטגיה ופלטפורמה למשפיעניות"
        description="סדנת אמן לאסטרטגיה ותוכן. עובדים עם מספר מצומצם של משפיעניות נבחרות - דיוק בידול לפי שיטת TrueSignal, בניית נרטיב, הקמת פלטפורמה דיגיטלית מלאה תחת beegood.online, וליווי מתמשך."
        url={`${APP_URL}/atelier`}
        price={0}
        imageUrl={`${APP_URL}/atelier-og.jpg`}
      />
      <FAQSchema items={ATELIER_FAQS} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "beegood atelier", url: `${APP_URL}/atelier` },
      ]} />
      <AtelierLandingClient faqs={ATELIER_FAQS} />
    </>
  );
}
