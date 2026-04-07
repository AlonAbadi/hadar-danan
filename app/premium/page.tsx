import type { Metadata } from "next";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { PremiumBookingFlow } from "./PremiumBookingFlow";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { getUserCredit } from "@/lib/credit";
import { createServerClient } from "@/lib/supabase/server";
import { PRODUCT_MAP } from "@/lib/products";

export const metadata: Metadata = {
  title: "יום צילום פרמיום - 16 סרטונים שמוכרים | הדר דנן",
  description: "יום צילום מקצועי + אסטרטגיית תוכן = 16 סרטונים ערוכים שמייצרים לקוחות. שיטה שכבר עובדת ל-3,500+ עסקים.",
  alternates: { canonical: "/premium" },
};

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  const credit        = email ? await getUserCredit(email) : 0;
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "972539566961";
  const price         = String(PRODUCT_MAP.premium_14000.price);

  const supabase = createServerClient();
  const { data: bookedSlots } = await supabase
    .from("bookings")
    .select("slot_date, slot_time")
    .eq("status", "confirmed");

  return (
    <ProductLandingPage
      productName="יום צילום פרמיום"
      price={PRODUCT_MAP.premium_14000.price}
      checkoutHref="#cta"

      headline={<>יום צילום אחד. <em>תוכן לשנה</em> שלמה.</>}
      heroSub="יום אחד של צילום מקצועי עם הצוות שלנו - ותצא עם 16 סרטונים ערוכים, מוכנים לפרסום, שמייצרים פניות ולקוחות."
      stats={[
        { val: "3,500+", label: "עסקים עם השיטה" },
        { val: "16",     label: "סרטונים ביום" },
        { val: "3x",     label: "גידול ממוצע בפניות" },
        { val: "90",     label: "ימי ליווי" },
      ]}

      problemItems={[
        { icon: "📸", text: "צולמים מדי פעם - אבל הסרטונים לא מביאים לקוחות. כי בלי אסטרטגיה, גם סרטון מקצועי לא מוכר." },
        { icon: "⏳", text: "תוכן שוטף לוקח שעות בשבוע. אתה רוצה להתרכז בעסק, לא ביצירת תוכן." },
        { icon: "💡", text: "יודע שוידאו עובד - אבל לא יודע מה לצלם, מה לאמר, ואיך לגרום לאנשים לעצור." },
      ]}
      agitationText="יום הצילום הוא הכלי. האסטרטגיה שמגיעה לפניו היא הסיבה שהסרטונים עובדים - ולא נעלמים בפיד."

      solutionTitle="מה כלול ביום הצילום הפרמיום"
      solutionDesc="כל שלב מנוהל על ידי הצוות - אתה רק מצלם"
      solutionItems={[
        { num: "1", title: "אסטרטגיית תוכן מותאמת",  desc: "לפני יום הצילום נבנה יחד תוכנית תוכן מלאה - מה לצלם, לאיזה קהל, ועם איזה מסר שמוביל לרכישה." },
        { num: "2", title: "יום צילום מלא עם צוות",   desc: "צלם מקצועי, במאי תוכן ומפיקה - שלושה אנשי מקצוע לצדך ליום שלם, בלוקיישן שמתאים לך." },
        { num: "3", title: "16 סרטונים ערוכים",       desc: "16 סרטונים קצרים (Reels / TikTok) ערוכים, עם כתוביות ומוכנים לפרסום - בתוך שבועיים." },
        { num: "4", title: "3 חודשי ליווי אחרי",       desc: "לא נעלמים אחרי הצילום. 3 חודשים של ייעוץ, אופטימיזציה ומענה אישי לשיפור הנוכחות הדיגיטלית." },
      ]}

      notForItems={[
        "עסקים שלא מוכנים להשקיע בנוכחות דיגיטלית",
        "מי שרוצה תוכן חד-פעמי בלי אסטרטגיה",
        "עסקים ללא מוצר או שירות מוכח",
      ]}
      forItems={[
        "בעלי עסקים שרוצים נוכחות וידאו חזקה",
        "מי שיודע שוידאו עובד - ורוצה לעשות את זה נכון",
        "מי שרוצה 3 חודשי תוכן בפחות מיום",
        "מי שרוצה ליווי אחרי הצילום",
      ]}

      whoName="הדר דנן"
      whoRole="אסטרטגיסטית שיווק ותוכן"
      whoText="הובלתי 3,500+ עסקים לתוכן שמוכר. יום הצילום הפרמיום הוא השיטה המהירה והאפקטיבית ביותר לבנות נוכחות וידאו שמייצרת תוצאות - עם ליווי שמבטיח שהסרטונים יגיעו לאנשים הנכונים."

      proofStats={[
        { val: "3,500+", label: "עסקים" },
        { val: "16",     label: "סרטונים ביום" },
        { val: "3x",     label: "גידול בפניות" },
        { val: "90",     label: "ימי ליווי" },
      ]}
      testimonials={[
        { text: "אחרי יום הצילום האינסטגרם שלי פשוט הפך - 3 לקוחות חדשים בחודש הראשון.", author: "דנה כ.", role: "מאמנת עסקית" },
        { text: "16 סרטונים שיושבים לי וממשיכים להביא פניות. הכי טובה ההשקעה שעשיתי.", author: "אמיר ש.", role: "יועץ פיננסי" },
        { text: "הצוות של הדר הפתיע אותי - מקצועיות ברמה אחרת. הסרטונים נראים כמו של מותג גדול.", author: "מיטל ר.", role: "מאמנת כושר" },
      ]}

      anchorItems={[
        { val: "8,000+",    label: "הפקת תוכן חודשית (סוכנות)" },
        { val: "3,000 לסרט", label: "עריכה מקצועית לסרטון בודד" },
        { val: "6,000+",    label: "ייעוץ אסטרטגי תוכן (3 חודשים)" },
      ]}
      anchorTotal="17,000+"

      questions={[
        {
          q: "מה הסיבה העיקרית שאתה רוצה וידאו?",
          options: ["להביא לקוחות חדשים", "לחזק את המותג", "להגיע לקהל חדש", "לבנות סמכות בתחום"],
        },
        {
          q: "כמה תוכן אתה מפרסם עכשיו?",
          options: ["כמעט אין", "מדי פעם", "קבוע אבל לא מספיק", "הרבה אבל לא מוכר"],
        },
        {
          q: "מה הפלטפורמה שהכי חשובה לך?",
          options: ["אינסטגרם Reels", "TikTok", "לינקדאין", "יוטיוב"],
        },
      ]}
      resultMessages={{
        "להביא":    "יום הצילום ייצר לך תוכן מכירתי ישיר שמביא פניות - לא רק חשיפה.",
        "לחזק":     "16 סרטונים שמבטאים את הזהות שלך - מותג שאנשים זוכרים ורוצים לרכוש ממנו.",
        "קהל חדש":  "האסטרטגיה שנבנה לפני הצילום תפנה בדיוק לקהל שאתה רוצה להגיע אליו.",
        "סמכות":    "16 סרטונים מקצועיים שמציגים את הידע שלך - בניית סמכות שאי אפשר לצקצק.",
      }}

      creditNote={credit > 0 ? `יש לך זיכוי של ${credit} שקל - מקוזז אוטומטית` : undefined}

      faqs={[
        { q: "כמה זמן לוקחת ההפקה?",             a: "הסרטונים מוכנים תוך שבועיים מיום הצילום. האסטרטגיה מוכנה שבוע לפני." },
        { q: "מה כולל הליווי ל-3 חודשים?",       a: "3 שיחות וידאו חודשיות, ניתוח ביצועי הסרטונים, ועדכון אסטרטגיה לפי תוצאות." },
        { q: "מה קורה עם הלוקיישן?",             a: "אנחנו מגיעים אליך - לעסק, לבית, או לכל לוקיישן שמתאים לסיפור שלך." },
        { q: "כמה סרטונים אפשר לעשות ביום?",     a: "16 סרטונים קצרים (30-90 שניות) - מחולקים לנושאים ושמירת אנרגיה לאורך היום." },
        { q: "מה מדיניות ביטול?",                 a: "ביטול עד 7 ימים לפני הצילום - החזר מלא. לאחר מכן - זיכוי לתאריך חדש." },
      ]}

      finalTitle="מוכן/ת ל-16 סרטונים שמשנים את העסק?"
      finalSub="מקומות מוגבלים - יום צילום אחד בשבוע בלבד."

      whatsappNumber={whatsappPhone}

      hideMicroCommitment={false}

      priceSectionSlot={
        <section style={{ padding: "48px 20px", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ fontSize: 52, fontWeight: 900, color: "#EDE9E1", margin: "0 0 4px", direction: "ltr" }}>₪14,000</p>
            <p style={{ color: "#9E9990", margin: 0 }}>+ מע״מ - כולל הכל מהאסטרטגיה ועד 3 חודשי ליווי</p>
            <CreditBanner credit={credit} listPrice={PRODUCT_MAP.premium_14000.price} productName="יום הצילום הפרמיום" dark />
          </div>
          <PremiumBookingFlow
            bookedSlots={bookedSlots ?? []}
            price={price}
            credit={credit}
            whatsappPhone={whatsappPhone}
          />
        </section>
      }
    />
  );
}
