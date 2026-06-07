import { cookies } from "next/headers";
import { ViewContentTracker } from "@/components/analytics/ViewContentTracker";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import ChallengeProofWall from "@/components/landing/ChallengeProofWall";
import { ChallengeCTA } from "./ChallengeCTA";
import { ChallengeGreeting } from "./ChallengeGreeting";
import { InstantAccessStrip } from "./InstantAccessStrip";
import { CreditBanner } from "@/components/landing/CreditBanner";
import { ChallengeHeroText } from "@/components/landing/ChallengeHeroText";
import { ChallengeHeroTracker } from "./ChallengeHeroTracker";
import { getUserCredit } from "@/lib/credit";
import { PRODUCT_MAP, CHALLENGE_ORIGINAL_PRICE } from "@/lib/products";
import { computeNextLiveMeetingDate } from "@/lib/challenge-config";
import { parseVariant, CHALLENGE_HERO_AB } from "@/lib/ab";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

/**
 * Format the next live closing meeting in Israel time as:
 *   "יום שלישי, 23 ביוני, בשעה 17:00"
 * Pinned to Asia/Jerusalem so the string doesn't drift if rendered on a
 * non-Israel Vercel region.
 */
function formatClosingMeeting(d: Date): string {
  const dayPart = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday:  "long",
    day:      "numeric",
    month:    "long",
  }).format(d).replace(/,?\s*\d{4}$/, ""); // strip year if locale appends it
  const timePart = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   false,
  }).format(d);
  return `${dayPart}, בשעה ${timePart}`;
}

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

  // Next live closing-meeting date, formatted for display in Israel time.
  const closingMeetingText = formatClosingMeeting(computeNextLiveMeetingDate());

  const CHALLENGE_FAQS = [
    { question: "מתי מתחילים? צריך לחכות למחזור?", answer: "מתחילים מיד, תוך שניות אחרי התשלום. שיעור הפתיחה המוקלט פתוח לצפייה בו ברגע, ובו לומדים לעומק איך נראה שיווק ב-2026 ואיך להגדיר את העסק שלכם מחדש. כל יום נפתח לפי הקצב שלכם. אין מחזורים ואין המתנה לקבוצה." },
    { question: "מה זה אתגר 7 הימים?", answer: "אתגר 7 הימים הוא קורס on-demand שבו כל יום מקבלים סרטון מהדר + אתגר יומי לצלם ולהעלות לאינסטגרם. המטרה: לצאת לדרך עם סרטונים איכותיים שמקדמים מכירות ומטפחים קהילה סביב המותג האישי." },
    { question: "מה מקבלים?", answer: `שיעור פתיחה מוקלט ועמוק על שיווק ב-2026 (כדי שתוכלו להתחיל מיד), 7 סרטונים יומיים מהדר על סוג תוכן שמקדם מכירות, אתגר יומי לביצוע ולהעלאה לאינסטגרם, ומפגש סיום חי בזום ${closingMeetingText}: איך להפוך את הסרטונים לסיסטם מכירות. מפגש הסיום פתוח רק למי שסיימו את כל 7 הימים.` },
    { question: "למי מתאים האתגר?", answer: "לכל מי שמבולבל וכבר מרגיש שעידן השיווק מיצה את עצמו מכל הכיוונים, ורוצה ללמוד איך בעולם של רעש יוצרים משהו שניתן להקשיב לו." },
    { question: "מה ההבדל בין האתגר לסדנה?", answer: "האתגר הוא שבוע on-demand של בניית הרגלי וידאו ואסטרטגיה. צופים, מיישמים, מעלים. הסדנה (יום אחד פיזי) היא השלב הבא: עומק על ביטוי, נוכחות ומשפך שיווקי שלם." },
    { question: "האם האתגר מתאים גם למי שעסוק?", answer: "כן. האתגר on-demand. צופים בקצב שלכם, מבצעים את האתגר היומי בזמן שנוח לכם, ומעלים לאינסטגרם. אין מחויבות לשעה קבועה." },
  ];

  // A/B test: hero video vs designed text block
  const cookieStore  = await cookies();
  const abVariant    = parseVariant(cookieStore.get("ab_variant")?.value);
  const heroContent  = CHALLENGE_HERO_AB[abVariant];
  const useTextHero  = heroContent.type === "text";

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  return (
    <>
      <ProductSchema
        type="Course"
        name="אתגר 7 הימים - הדר דנן"
        description="7 ימים, 7 סרטונים שמייצרים מכירות. קורס on-demand עם הדרכה יומיומית מהדר דנן."
        url={`${APP_URL}/challenge`}
        price={197}
        imageUrl={`${APP_URL}/etgar.jpg`}
      />
      <FAQSchema items={CHALLENGE_FAQS} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "אתגר 7 הימים", url: `${APP_URL}/challenge` },
      ]} />
      <ViewContentTracker product="challenge_197" value={197} />
      <ChallengeHeroTracker variant={abVariant} />
      <ProductLandingPage
        productName="אתגר 7 הימים"
        price={PRODUCT_MAP.challenge_197.price}
        originalPrice={CHALLENGE_ORIGINAL_PRICE}
        checkoutHref="#cta"

        headline={<>7 ימים, 7 סרטונים<br /><em>שמייצרים מכירות</em></>}
        heroSub="לגרום לכל משתתף לצאת לדרך עם סרטונים איכותיים שמקדמים מכירות ומטפחים קהילה איכותית סביב המותג האישי"
        vimeoId={useTextHero ? undefined : heroContent.vimeoId}
        heroSlot={useTextHero ? (
          <ChallengeHeroText
            content={heroContent}
            priceNow={PRODUCT_MAP.challenge_197.price}
            priceOriginal={CHALLENGE_ORIGINAL_PRICE}
          />
        ) : undefined}
        definitionBlock="הקהל לא קונה את השירות שלך. הוא קונה את מי שאת בתוך השירות. 7 ימים של הכוונה יומיומית שיגרמו לך לצאת לדרך עם ודאות: לדעת בדיוק מה לצלם, למה זה עובד, ואיך הופכים סרטונים לסיסטם שמביא לקוחות חדשים, חודש אחרי חודש."
        stats={[
          { val: "3,500+", label: "בעלי עסקים" },
          { val: "97%",    label: "ממליצים" },
        ]}
        heroExtra={<><ChallengeGreeting />{!useTextHero && <InstantAccessStrip />}</>}

        problemItems={[
          { icon: "🎥", text: "רוצה לצלם, אבל לא מסתדר/ת עם עצמך מול המצלמה. לא אוהב/ת את מה שאת/ה רואה, ומוותר/ת לפני שמתחיל/ה." },
          { icon: "📉", text: "כבר מצלם/ת ומעלה/ה, אבל אין פניות, אין לידים. הסרטונים עולים ונעלמים, והעסק לא זז." },
          { icon: "💭", text: "יש לידים, אבל אזל לך החומר. לא יודע/ת מה עוד לאמר, ומרגיש/ת שהקהל כבר שמע ממך הכל." },
        ]}
        agitationText="הבעיה היא לא שאין לך מה לאמר. הבעיה היא שאין לך ודאות. ודאות לגבי מי את/ה, מה המסר שלך, ואיך הסרטונים שלך הופכים לצינור מכירות שעובד גם כשאת/ה לא מעלה/ה."

        solutionTitle="במשך 7 ימים, כל משתתף מקבל:"
        solutionDesc="הכוונה יומיומית ממוקדת, עם תוצאות שרואים"
        solutionItems={[
          { num: "⚡", title: "גישה מיידית לשיעור הפתיחה",     desc: "תוך שניות אחרי התשלום, שיעור הפתיחה המוקלט פתוח לצפייה. שיעור עמוק על איך נראה שיווק ב-2026, ואיך להגדיר את העסק שלכם מחדש בעידן מוצף בוידאו. אין מחזורים. אין המתנה. מתחילים מתי שמתאים לכם." },
          { num: "🎥", title: "7 סרטונים יומיים מהדר",       desc: "הדרכה ממוקדת על סוג תוכן שמקדם מכירות. כל יום נושא אחר, מיושם ישר." },
          { num: "✏️", title: "אתגר יומי",                   desc: "ליצור וידאו מסוג מסוים ולהעלות אותו לאינסטגרם. מתרגלים בזמן אמת." },
          { num: "🏆", title: "מפגש סיום חי בזום",            desc: `מפגש מסכם בלייב — ${closingMeetingText}. איך להפוך את הסרטונים שלך לסיסטם מכירות. פתוח רק למשתתפים/ות שסיימו את כל 7 הימים.` },
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
        whoText={'3,500 בעלי עסקים עברו דרכי. ראיתי את אותן תקיעויות חוזרות, לא חוסר ביכולת אלא חוסר בודאות. האתגר בנוי על אותה מתודולוגיה שעבדה עבורם: להבין מי את/ה בתוך השירות שלך, ולבנות מסביב לזה תוכן שמוכר. בלי מניפולציות, בלי פטנטים.'}

        proofStats={[
          { val: "מאות", label: "משתתפים באתגר" },
          { val: "7",    label: "ימים, סרטונים, פעולה" },
          { val: "4",    label: "שנות ניסיון" },
        ]}
        testimonials={[]}
        proofSlot={<ChallengeProofWall />}

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
          "לא יודע מה לאמר": "האתגר ייתן לך הדרכה יומיומית: כל יום סוג תוכן אחר שמקדם מכירות, עם ביצוע בזמן אמת.",
          "אין לי זמן":       "האתגר בנוי לאנשים עסוקים. כל יום וידאו מהדר + אתגר קצר לביצוע. 7 ימים ויש לך הרגל.",
          "ניסיתי":           "הפעם יש אסטרטגיה אמיתית מאחורי הווידאו. לא רק 'לצלם' אלא 'מה מייצר מכירות'.",
          "לא יודע":          "בדיוק לזה האתגר. כל יום הדרכה ממוקדת + אתגר ברור, ואתה/את יוצא/ת עם סרטונים אמיתיים.",
        }}

        creditNote={credit > 0 ? `יש לך זיכוי של ${credit} שקל מרכישות קודמות - מקוזז אוטומטית` : undefined}

        faqSectionTitle="שאלות נפוצות על אתגר 7 הימים"
        faqs={CHALLENGE_FAQS.map(f => ({ q: f.question, a: f.answer }))}

        finalTitle="עכשיו תורך!"
        finalSub="7 ימים, 7 סרטונים, וסיסטם מכירות שעובד חודשים קדימה."

        whatsappNumber={whatsappPhone}

        ctaSlot={
          <>
            <CreditBanner credit={credit} listPrice={PRODUCT_MAP.challenge_197.price} productName="האתגר 7 הימים" dark />
            <ChallengeCTA price={price} originalPrice={CHALLENGE_ORIGINAL_PRICE} whatsappPhone={whatsappPhone} credit={credit} />
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
