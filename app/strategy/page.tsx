import Link from "next/link";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { CallForm } from "@/app/call/CallForm";
import { AbandonCheckoutPopup } from "@/components/landing/AbandonCheckoutPopup";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { getUserCredit } from "@/lib/credit";
import { PRODUCT_MAP } from "@/lib/products";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const STRATEGY_FAQS = [
  { question: "מה זו פגישת אסטרטגיה עם הדר דנן?", answer: "פגישת אסטרטגיה היא שיחת זום אינטנסיבית של 90 דקות אחד-על-אחד עם הדר דנן. בפגישה בונים ביחד את מפת הדרכים השיווקית של העסק — ניתוח מצב קיים, מיפוי קהל יעד, בניית משפך מכירות ולוח תוכן ל-90 יום. יוצאים עם מסמך מסודר לביצוע מיידי." },
  { question: "למי מתאימה פגישת האסטרטגיה?", answer: "מתאימה לבעלי עסקים שרוצים תוכנית שנה קדימה, למי שעשה הכל נכון ועדיין לא צומח, ולמי שרוצה עיניים מבחוץ שמבינות עסקים. לא מתאימה לעסקים שרק התחילו — עדיף להתחיל מהאתגר." },
  { question: "מה ההבדל בין פגישת האסטרטגיה לאתגר 7 הימים?", answer: "האתגר מלמד שיטה לבד בקצב שלך. פגישת האסטרטגיה היא עבודה אישית ישירה עם הדר — 90 דקות שמרכזות את כל הניסיון שלה עם 250+ עסקים, מותאמות בדיוק לעסק שלך. כוללת ערבות תוצאה מלאה." },
  { question: "איך מתקיימת הפגישה?", answer: "זום — 90 דקות אינטנסיביות. תיאום המועד תוך 24 שעות מהאישור." },
  { question: "מה ערבות התוצאה?", answer: "אם בסוף השיחה לא קיבלת לפחות 3 אינסייטים שאפשר ליישם — החזר מלא, ללא שאלות." },
];

export const metadata = {
  title: "פגישת אסטרטגיה | הדר דנן",
  description: "90 דקות אחד-על-אחד שבונות את האסטרטגיה השיווקית של העסק שלך לשנה הקרובה.",
  alternates: { canonical: "/strategy" },
};

export default async function StrategyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  const price          = String(PRODUCT_MAP.strategy_4000.price);
  const credit         = email ? await getUserCredit(email) : 0;

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  return (
    <>
      <ProductSchema
        type="Service"
        name="פגישת אסטרטגיה שיווקית - הדר דנן"
        description="90 דקות אחד-על-אחד שבונות את האסטרטגיה השיווקית של העסק שלך לשנה הקרובה."
        url={`${APP_URL}/strategy`}
        price={4000}
        imageUrl={`${APP_URL}/strategymeeting.png`}
      />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "פגישת אסטרטגיה", url: `${APP_URL}/strategy` },
      ]} />
      <FAQSchema items={STRATEGY_FAQS} />
      <AbandonCheckoutPopup product="strategy" />
      <ProductLandingPage
        productName="פגישת אסטרטגיה"
        price={PRODUCT_MAP.strategy_4000.price}
        checkoutHref="/strategy/book"

        headline={<>שעתיים עם הדר. <em>תוכנית שעובדת</em> עבורך.</>}
        heroSub="שיחת אסטרטגיה אחד-על-אחד שבה בונים ביחד את מפת הדרכים השיווקית של העסק שלך - מותאמת בדיוק לך, לא תבנית גנרית."
        vimeoId="1183710499"
        definitionBlock="פגישת אסטרטגיה עם הדר דנן היא שיחת זום אינטנסיבית של 90 דקות שבונה את מפת הדרכים השיווקית של העסק. ניתוח מצב קיים, מיפוי קהל יעד, בניית משפך מכירות ולוח תוכן ל-90 יום — יוצאים עם מסמך מוכן לביצוע. ערבות תוצאה מלאה: 3 אינסייטים מיישמים — או החזר."
        stats={[
          { val: "90",    label: "דקות ריכוז" },
          { val: "4",     label: "מקומות בחודש" },
          { val: "100%",  label: "ערבות תוצאה" },
          { val: "24h",   label: "תיאום תוך" },
        ]}

        problemItems={[
          { icon: "🗺", text: "עסק טוב - אבל בלי מפה ברורה לאן. כל חודש קמפיין חדש, בלי חוט אדום." },
          { icon: "🔄", text: "עושים הכל לבד: תוכן, ניהול, מכירה - ואין זמן לחשוב על האסטרטגיה הגדולה." },
          { icon: "🎯", text: "פגשת יועצים שנתנו פתרונות גנריים. פגישת האסטרטגיה של הדר בנויה עבורך בלבד." },
        ]}
        agitationText="פגישה אחת עם הדר שווה שלושה חודשים של ניסוי וטעייה. יוצאים עם תוכנית שאפשר להתחיל ליישם מחר בבוקר."

        solutionTitle="מה קורה ב-90 הדקות?"
        solutionDesc="כל שלב מוגדר מראש - אין זמן מבוזבז"
        solutionItems={[
          { num: "1", title: "ניתוח מצב קיים",        desc: "נפרק ביחד מה עובד, מה לא - ולמה הלקוחות לא מגיעים בקצב שרצית." },
          { num: "2", title: "מיפוי קהל יעד מדויק",   desc: "נגדיר מי הלקוח האידיאלי שלך, מה הכאב שלו, ואיך לדבר אליו ישר לנקודה." },
          { num: "3", title: "בניית משפך מכירות",      desc: "תוכנית ממוקדת: מהיכרות ועד עסקה - כל שלב מוגדר ומתוזמן." },
          { num: "4", title: "לוח תוכן ל-90 יום",      desc: "יוצאים עם תוכנית מוכנה לביצוע - לא עוד עמוד ריק בבוקר." },
          { num: "5", title: "זיהוי צווארי הבקבוק",    desc: "נמצא מה עוצר את הצמיחה - ונבנה פתרון מעשי לכל חסם." },
          { num: "6", title: "סיכום כתוב ותוכנית",     desc: "אחרי השיחה מקבלים מסמך מסודר שאפשר להתחיל ליישם מיד למחרת." },
        ]}

        notForItems={[
          "עסקים שרק התחילו (עדיף להתחיל באתגר)",
          "מי שרוצה ביצוע ולא אסטרטגיה",
          "מי שמחפש תשובות מהירות ללא עומק",
        ]}
        forItems={[
          "בעלי עסקים שרוצים תוכנית שנה קדימה",
          "מי שעשה הכל נכון - ועדיין לא צומח",
          "מי שרוצה עיניים מבחוץ שמבינות עסקים",
          "מי שמוכן ליישם ורוצה מפת דרכים ברורה",
        ]}

        whoName="הדר דנן"
        whoRole="אסטרטגיסטית שיווק ותוכן"
        whoText="פגישת האסטרטגיה היא הפורמט האינטנסיבי ביותר שלי - 90 דקות שמרכזות את כל הניסיון שלי עם 250+ עסקים, מותאמות בדיוק לעסק שלך. ערבות תוצאה מלאה - לא פיצחנו? פגישה נוספת עלינו."

        proofStats={[
          { val: "250+",   label: "עסקים" },
          { val: "4 שנים", label: "ניסיון" },
          { val: "100%",   label: "ערבות תוצאה" },
        ]}
        testimonials={[
          { text: "שיחה אחת עם הדר שווה שלושה חודשים של ניסוי וטעייה. יצאתי עם תוכנית ברורה שקל ליישם.", author: "אורי ל.", role: "יועץ ארגוני" },
          { text: "הגעתי עם ראש מבולבל, יצאתי עם מפה. תוך שבועיים יישמתי את מה שדיברנו ונסגרו 4 לקוחות חדשים.", author: "מיה כ.", role: "מטפלת הוליסטית" },
          { text: "ראיתי ROI על ההשקעה תוך 10 ימים. הדר שמה את האצבע בדיוק על מה שלא עבד.", author: "דרור נ.", role: "מנהל שיווק" },
        ]}

        anchorItems={[
          { val: "8,000+",      label: "מנטור עסקי (רבעוני)" },
          { val: "12,000+",     label: "ייעוץ אסטרטגי עסקי (3 חודשים)" },
          { val: "6,000 לחודש", label: "מנהל שיווק שכיר (שכר מינימלי)" },
        ]}
        anchorTotal="20,000+"

        questions={[
          {
            q: "מה הכי דחוף לך עכשיו?",
            options: ["לייצר יותר לקוחות", "להבין מה לא עובד", "לבנות אסטרטגיה לצמיחה", "לקבל מפת דרכים ברורה"],
          },
          {
            q: "כמה זמן העסק שלך קיים?",
            options: ["פחות משנה", "1-3 שנים", "יותר מ-3 שנים", "מעל 5 שנים"],
          },
          {
            q: "מה התקציב החודשי שלך לשיווק?",
            options: ["עד 2,000 שקל", "2,000-5,000 שקל", "מעל 5,000 שקל", "עדיין לא הגדרתי"],
          },
        ]}
        resultMessages={{
          "לייצר":   "מבוסס על מה שאמרת - נבנה אסטרטגיית גיוס לקוחות ממוקדת ב-90 הדקות.",
          "להבין":   "ניתוח מצב קיים הוא השלב הראשון. נוציא תובנות שיפתיעו אותך.",
          "לבנות":   "תצא עם מפת דרכים לשנה קדימה - מלאה ומעשית.",
          "לקבל":    "בדיוק לזה הפגישה. תצא עם מסמך ברור ומוכן לביצוע.",
        }}

        creditNote={credit > 0 ? `יש לך זיכוי של ${credit} שקל - מקוזז אוטומטית` : undefined}

        faqSectionTitle="שאלות נפוצות על פגישת האסטרטגיה"
        faqs={STRATEGY_FAQS.map(f => ({ q: f.question, a: f.answer }))}

        finalTitle="שמור/י את המקום שלך"
        finalSub="4 מקומות בחודש. מי שפועל ראשון - מקבל מועד."

        ctaSlot={
          <Link
            href="/strategy/book"
            className="btn-cta-gold"
            style={{ display: "inline-block", padding: "15px 40px", borderRadius: 10, fontWeight: 800, fontSize: 17, textDecoration: "none" }}
          >
            קבע/י פגישה עכשיו - בחר/י מועד
          </Link>
        }

        bottomSlot={
          <section id="form" style={{ padding: "48px 20px", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "#2C323E" }} />
              <span style={{ fontSize: 13, color: "#9E9990" }}>או שלח/י פנייה ונחזור תוך 24 שעות</span>
              <div style={{ flex: 1, height: 1, background: "#2C323E" }} />
            </div>
            <div style={{ background: "#191F2B", border: "1px solid #2C323E", borderRadius: 16, padding: "28px 24px" }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: "#EDE9E1", marginBottom: 8, marginTop: 0 }}>שלח/י פנייה</h3>
              <p style={{ color: "#9E9990", fontSize: 14, marginBottom: 20 }}>מלא/י את הטופס - נחזור אליך תוך 24 שעות לתיאום.</p>
              <CreditBanner credit={credit} listPrice={PRODUCT_MAP.strategy_4000.price} productName="פגישת האסטרטגיה" dark />
              <CallForm price={price} />
              {credit > 0 && (
                <p style={{ textAlign: "center", fontSize: 11, color: "rgba(201,150,74,0.75)", marginTop: 8 }}>
                  הזיכוי מקוזז אוטומטית -{" "}
                  <a href="/my" style={{ color: "rgba(201,150,74,0.75)", textDecoration: "underline" }}>בדוק באזור האישי</a>
                </p>
              )}
            </div>
          </section>
        }
      />
    </>
  );
}
