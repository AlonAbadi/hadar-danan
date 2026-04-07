import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { ChallengeCTA } from "./ChallengeCTA";
import { ChallengeGreeting } from "./ChallengeGreeting";
import { NextChallengeBadge } from "./NextChallengeBadge";
import { AbandonCheckoutPopup } from "@/components/landing/AbandonCheckoutPopup";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { getUserCredit } from "@/lib/credit";
import { PRODUCT_MAP } from "@/lib/products";

export const metadata = {
  title: "אתגר 7 הימים | הדר דנן",
  description: "7 ימים. מסר אחד ביום. תהליך שמשנה את הדרך שאתה מציג את עצמך. 197 שקל בלבד.",
  alternates: { canonical: "/challenge" },
};

export default async function ChallengePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  const price         = String(PRODUCT_MAP.challenge_197.price);
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "972539566961";
  const credit        = email ? await getUserCredit(email) : 0;

  return (
    <>
      <AbandonCheckoutPopup product="challenge" />
      <ProductLandingPage
        productName="אתגר 7 הימים"
        price={PRODUCT_MAP.challenge_197.price}
        originalPrice={397}
        checkoutHref="#cta"

        headline={<>7 ימים. מסר אחד.<br /><em>תוצאות שאתה רואה.</em></>}
        heroSub="7 ימים - מסר אחד ביום - תהליך שמשנה את הדרך שאתה מציג את עצמך"
        stats={[
          { val: "7",    label: "ימי אתגר" },
          { val: "127",  label: "ביקורות" },
          { val: "4.9",  label: "דירוג ממוצע" },
          { val: "48h",  label: "ערבות החזר" },
        ]}
        heroExtra={
          <>
            <ChallengeGreeting />
            <NextChallengeBadge />
          </>
        }

        problemItems={[
          { icon: "📱", text: "מצלמים, מעלים, מקווים - ושום דבר לא קורה. כי בלי אסטרטגיה, תוכן הוא רעש ולא מכירה." },
          { icon: "🤷", text: "לא יודעים מה לאמר. יש עסק טוב, אבל המילים לא יוצאות כמו שצריך." },
          { icon: "⏰", text: "אין זמן. עסוקים בלספק שירות ללקוחות, ואין מרץ לתכנן תוכן." },
        ]}
        agitationText="הבעיה היא לא שאתם לא יצירתיים. הבעיה היא שאין לכם מערכת. בלי מערכת - כל פוסט מרגיש כמו התחלה מחדש."

        solutionTitle="מה קורה כל יום?"
        solutionDesc="7 משימות ממוקדות - 20-30 דקות ביום"
        solutionItems={[
          { num: "1", title: "זיהוי הלקוח האידיאלי",    desc: "תלמד לדבר בשפה של הלקוח שלך - ולהפסיק לדבר בשפה שלך" },
          { num: "2", title: "הסרטון הראשון שלך",        desc: "פוסט אחד, סרטון אחד - מה שנוח לך. הדר תראה לך בדיוק איך" },
          { num: "3", title: "פרסום חכם בלי תקציב",      desc: "הקבוצות, הפורומים, ה-hashtags שמביאים לקוחות בחינם" },
          { num: "4", title: "בניית סמכות מהירה",        desc: "שיטת ה-3 הפוסטים שהופכת אותך למומחה תוך 48 שעות" },
          { num: "5", title: "שיחת מכירה בוואטסאפ",     desc: "הסקריפט המדויק שסוגר עסקאות - בלי להרגיש כמו מוכר" },
          { num: "6", title: "המרת עוקבים ללקוחות",      desc: "איך להפוך כל אינטראקציה להזדמנות עסקית" },
          { num: "7", title: "מערכת שרצה לבד",           desc: "הגדרת תהליך שממשיך להביא לקוחות גם כשאתה ישן" },
        ]}

        notForItems={[
          "מי שרוצה תוצאות בלי לעשות שום דבר",
          "מי שמחפש פטנט להתעשר מהיר",
          "עסקים ללא מוצר או שירות פועל",
        ]}
        forItems={[
          "בעלי עסקים שרוצים להתחיל לשווק נכון",
          "מי שיש לו ניסיון ולא יודע איך לספר את זה",
          "מי שרוצה לקוחות חדשים תוך שבוע",
          "מי שעסוק מדי - 20 דקות ביום מספיקות",
        ]}

        whoName="הדר דנן"
        whoRole="אסטרטגיסטית שיווק ותוכן"
        whoText="יצרתי את שיטת TrueSignal לאחר 4 שנים של עבודה עם 250+ עסקים. למדתי שהבעיה אינה מה לאמר - אלא מי אתה ולמה זה חשוב לאחרים. האתגר הוא השלב הראשון לגלות את זה."

        proofStats={[
          { val: "250+", label: "עסקים שצמחו" },
          { val: "4",    label: "שנות ניסיון" },
          { val: "97%",  label: "ממליצים" },
          { val: "4.9",  label: "דירוג" },
        ]}
        testimonials={[
          { text: "ביום הרביעי של האתגר סגרתי את העסקה הראשונה. מעולם לא האמנתי שזה אפשרי כל כך מהר!", author: "דנה ר.", role: "מאמנת אישית" },
          { text: "האתגר שינה את הדרך שבה אני מציג את עצמי. הלקוחות הגיעו אלי - לא הייתי צריך לרדוף אחריהם.", author: "גיל מ.", role: "יועץ פיננסי" },
          { text: "בניתי קהל מאפס תוך שבוע. הפוסטים שכתבתי לפי המתודה קיבלו יותר תגובות מכל השנה.", author: "שיר כ.", role: "דיאטנית" },
          { text: "הייתי מפחד מהמצלמה. אחרי 7 ימים - 5 לקוחות חדשים ישירות מהסרטונים שלי.", author: "ניר ב.", role: "מאמן כושר" },
        ]}

        questions={[
          {
            q: "מה הכי עוצר אותך עכשיו?",
            options: ["לא יודע מה לאמר", "אין לי זמן", "ניסיתי ולא עבד", "לא יודע מאיפה להתחיל"],
          },
          {
            q: "כמה לקוחות חדשים אתה רוצה בחודש?",
            options: ["2-3 לקוחות", "4-6 לקוחות", "7 ומעלה", "כמה שיותר"],
          },
          {
            q: "מה הפלטפורמה הראשית שלך?",
            options: ["אינסטגרם", "פייסבוק", "לינקדאין", "עוד לא החלטתי"],
          },
        ]}
        resultMessages={{
          "לא יודע מה לאמר": "מבוסס על מה שאמרת - האתגר יתן לך את הנוסחה המדויקת: מה לאמר, למי, ומתי.",
          "אין לי זמן":       "20 דקות ביום. האתגר בנוי בדיוק לאנשים עסוקים כמוך.",
          "ניסיתי":           "הפעם יש מתודה. לא רק תוכן - אלא מערכת שמביאה לקוחות.",
          "לא יודע":          "בדיוק לזה האתגר. כל יום צעד ברור ומוגדר.",
        }}

        creditNote={credit > 0 ? `יש לך זיכוי של ${credit} שקל מרכישות קודמות - מקוזז אוטומטית` : undefined}

        faqs={[
          { q: "כמה זמן ביום זה לוקח?",       a: "20-30 דקות ביום. המשימות קצרות, ממוקדות, וניתנות לביצוע בין פגישה לפגישה." },
          { q: "מה אם אני ממש לא טכנולוגי?",  a: "זה בדיוק בשבילך. אין כאן טכנולוגיה - רק תוכן, שיחות ואנשים." },
          { q: "האם יש ליווי אישי?",           a: "יש קבוצת וואטסאפ פעילה עם כל המשתתפים. הדר שם כל יום לשאלות ופידבק." },
          { q: "מה אם לא מתאים לי?",           a: "תוך 48 שעות מהצטרפות - אם לא מרוצה, מחזיר לך הכל. בלי שאלות." },
          { q: "מתי מתחיל האתגר?",             a: "מיד לאחר ההצטרפות. אתה מקבל גישה מיידית לכל 7 הימים." },
        ]}

        finalTitle="עכשיו תורך"
        finalSub="7 ימים. 7 משימות. לקוח אמיתי - או כסף חזרה."

        whatsappNumber={whatsappPhone}

        ctaSlot={
          <>
            <CreditBanner credit={credit} listPrice={PRODUCT_MAP.challenge_197.price} productName="האתגר 7 הימים" dark />
            <ChallengeCTA price={price} whatsappPhone={whatsappPhone} credit={credit} />
            {credit > 0 && (
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(201,150,74,0.75)", marginTop: 8 }}>
                הזיכוי מרכישות קודמות מקוזז אוטומטית -{" "}
                <a href="/my" style={{ color: "rgba(201,150,74,0.75)", textDecoration: "underline" }}>בדוק באזור האישי</a>
              </p>
            )}
          </>
        }
      />
    </>
  );
}
