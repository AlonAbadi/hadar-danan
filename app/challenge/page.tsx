import { ViewContentTracker } from "@/components/analytics/ViewContentTracker";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { ChallengeCTA } from "./ChallengeCTA";
import { ChallengeGreeting } from "./ChallengeGreeting";
import { NextChallengeBadge } from "./NextChallengeBadge";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { getUserCredit } from "@/lib/credit";
import { PRODUCT_MAP } from "@/lib/products";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const CHALLENGE_FAQS = [
  { question: "מה זה אתגר 7 הימים?", answer: "אתגר 7 הימים הוא קורס on-demand שבו כל יום מקבלים סרטון מהדר + אתגר יומי לצלם ולהעלות לאינסטגרם. המטרה: לצאת לדרך עם סרטונים איכותיים שמקדמים מכירות ומטפחים קהילה סביב המותג האישי." },
  { question: "מה מקבלים?", answer: "מפגש פתיחה, 7 סרטונים יומיים מהדר על סוג תוכן שמקדם מכירות, אתגר יומי לביצוע ולהעלאה לאינסטגרם, ומפגש סיום: איך להפוך את הסרטונים לסיסטם מכירות." },
  { question: "למי מתאים האתגר?", answer: "לכל מי שמבולבל וכבר מרגיש שעידן השיווק מיצה את עצמו מכל הכיוונים — ורוצה ללמוד איך בעולם של רעש יוצרים משהו שניתן להקשיב לו." },
  { question: "מה ההבדל בין האתגר לסדנה?", answer: "האתגר הוא שבוע on-demand של בניית הרגלי וידאו ואסטרטגיה — צופים, מיישמים, מעלים. הסדנה (יום אחד פיזי) היא השלב הבא — עומק על ביטוי, נוכחות ומשפך שיווקי שלם." },
  { question: "מה אם יש לי שאלה תוך כדי האתגר?", answer: "ניתן לפנות דרך הטופס בפלטפורמה ולקבל מענה ישיר." },
];

export const metadata = {
  title: "אתגר 7 הימים | הדר דנן",
  description: "7 ימים, 7 סרטונים שמייצרים מכירות. קורס on-demand עם הדרכה יומיומית מהדר דנן. 197 שקל בלבד.",
  alternates: { canonical: "/challenge" },
};

export default async function ChallengePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  const price         = String(PRODUCT_MAP.challenge_197.price);
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "972539566961";
  const credit        = email ? await getUserCredit(email) : 0;

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  return (
    <>
      <ProductSchema
        type="Course"
        name="אתגר 7 הימים - הדר דנן"
        description="7 ימים, 7 סרטונים שמייצרים מכירות. קורס on-demand עם הדרכה יומיומית מהדר דנן."
        url={`${APP_URL}/challenge`}
        price={197}
        imageUrl={`${APP_URL}/etgar.png`}
      />
      <FAQSchema items={CHALLENGE_FAQS} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "אתגר 7 הימים", url: `${APP_URL}/challenge` },
      ]} />
      <ViewContentTracker product="challenge_197" value={197} />
      <ProductLandingPage
        productName="אתגר 7 הימים"
        price={PRODUCT_MAP.challenge_197.price}
        originalPrice={397}
        checkoutHref="#cta"

        headline={<>7 ימים, 7 סרטונים<br /><em>שמייצרים מכירות</em></>}
        heroSub="לגרום לכל משתתף לצאת לדרך עם סרטונים איכותיים שמקדמים מכירות ומטפחים קהילה איכותית סביב המותג האישי"
        vimeoId="1184733084"
        definitionBlock="מטרת האתגר — לגרום לכל משתתף לצאת לדרך עם סרטונים איכותיים שמקדמים מכירות ומטפחים קהילה איכותית סביב המותג האישי. בזמן קצוב, ובהכוונה יומיומית — כדי שתתחילו להבין את האסטרטגיה של משפך שיווקי אמיתי מאחורי הווידאו."
        stats={[
          { val: "250+", label: "בעלי עסקים" },
          { val: "97%",  label: "ממליצים" },
        ]}
        heroExtra={
          <>
            <ChallengeGreeting />
            <NextChallengeBadge />
          </>
        }

        problemItems={[
          { icon: "📢", text: "מרגיש/ת שעידן השיווק מיצה את עצמו מכל הכיוונים — רעש בכל מקום, וקשה לדעת מה באמת עובד." },
          { icon: "🎥", text: "מצלם/ת ומעלה/ה סרטונים אבל הם לא מייצרים מכירות — חסרה האסטרטגיה שמאחורי הווידאו." },
          { icon: "💭", text: "רוצה ללמוד איך בעולם של רעש יוצרים משהו שניתן להקשיב לו — ושמביא לקוחות אמיתיים." },
        ]}
        agitationText="בעולם מוצף בוידאו — השאלה היא לא 'מה לצלם' אלא 'איך יוצרים משפך שיווקי אמיתי מאחורי הווידאו'."

        solutionTitle="במשך 7 ימים, כל משתתף מקבל:"
        solutionDesc="הכוונה יומיומית ממוקדת — עם תוצאות שרואים"
        solutionItems={[
          { num: "🧠", title: "מפגש פתיחה לאתגר",           desc: "\"איך נראה שיווק בעידן מוצף בוידאו\" — הבסיס האסטרטגי לפני שמתחילים." },
          { num: "🎥", title: "7 סרטונים יומיים מהדר",       desc: "הדרכה ממוקדת על סוג תוכן שמקדם מכירות — כל יום נושא אחר, מיושם ישר." },
          { num: "✏️", title: "אתגר יומי",                   desc: "ליצור וידאו מסוג מסוים ולהעלות אותו לאינסטגרם — מתרגלים בזמן אמת." },
          { num: "🏆", title: "סיום חגיגי בלייב",             desc: "מפגש זום מסכם: איך להפוך את הסרטונים שלך לסיסטם מכירות שעובד חודשים קדימה." },
        ]}

        notForItems={[
          "מי שרוצה תוצאות בלי לעשות שום דבר",
          "מי שמחפש פטנט להתעשר מהיר",
          "עסקים ללא מוצר או שירות פועל",
        ]}
        forItems={[
          "מי שמבולבל וכבר מרגיש שעידן השיווק מיצה את עצמו",
          "בעלי עסקים שרוצים ללמוד איך מייצרים מכירות בוידאו",
          "מי שרוצה לבנות קהילה איכותית סביב המותג האישי",
          "מי שמוכן להתאמץ 7 ימים ברצף ולצאת לדרך",
        ]}

        whoName="הדר דנן"
        whoRole="אסטרטגיסטית שיווק ותוכן"
        whoText={'מי שמכיר אותי יודע — לא תמצאו אצלי מוצרים זולים בדרך כלל. זו הפעם הראשונה שהחלטתי ליצור תהליך עומק קבוצתי בעלות נגישה לכולם — מתוך קריאה פנימית להפיץ את התובנות החשובות של עידן השיווק החדש וההכנה המתאימה לכמה שיותר אנשים.'}

        proofStats={[
          { val: "250+", label: "בעלי עסקים" },
          { val: "4",    label: "שנות ניסיון" },
          { val: "97%",  label: "ממליצים" },
        ]}
        testimonials={[
          { text: "חתיכת בעיטה בתחת, יצאתי מאזור הנוחות.", author: "משתתף/ת", role: "⭐⭐⭐⭐⭐" },
          { text: "מסתכלת על העסק בצורה אחרת, תודה שאתגרת אותי.", author: "משתתפת", role: "⭐⭐⭐⭐⭐" },
          { text: "הצלחת להכניס בי ביטחון שעוד לא היה לי.", author: "משתתף/ת", role: "⭐⭐⭐⭐⭐" },
          { text: "שינה לי משמעותית את הגישה בתהליך המכירה והשירות.", author: "משתתף/ת", role: "⭐⭐⭐⭐⭐" },
        ]}

        questions={[
          {
            q: "מה הכי עוצר אותך עכשיו?",
            options: ["לא יודע מה לאמר", "אין לי זמן", "ניסיתי ולא עבד", "לא יודע מאיפה להתחיל"],
          },
          {
            q: "מה הפלטפורמה הראשית שלך?",
            options: ["אינסטגרם", "פייסבוק", "לינקדאין", "עוד לא החלטתי"],
          },
        ]}
        resultMessages={{
          "לא יודע מה לאמר": "האתגר ייתן לך הדרכה יומיומית: כל יום סוג תוכן אחר שמקדם מכירות — עם ביצוע בזמן אמת.",
          "אין לי זמן":       "האתגר בנוי לאנשים עסוקים — כל יום וידאו מהדר + אתגר קצר לביצוע. 7 ימים ויש לך הרגל.",
          "ניסיתי":           "הפעם יש אסטרטגיה אמיתית מאחורי הווידאו — לא רק 'לצלם' אלא 'מה מייצר מכירות'.",
          "לא יודע":          "בדיוק לזה האתגר. כל יום הדרכה ממוקדת + אתגר ברור — ואתה/את יוצא/ת עם סרטונים אמיתיים.",
        }}

        creditNote={credit > 0 ? `יש לך זיכוי של ${credit} שקל מרכישות קודמות - מקוזז אוטומטית` : undefined}

        faqSectionTitle="שאלות נפוצות על אתגר 7 הימים"
        faqs={CHALLENGE_FAQS.map(f => ({ q: f.question, a: f.answer }))}

        finalTitle="עכשיו תורך!"
        finalSub="7 ימים, 7 סרטונים — וסיסטם מכירות שעובד חודשים קדימה."

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
