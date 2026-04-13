import type { Metadata } from "next";
import ProductLandingPage from "@/components/landing/ProductLandingPage";
import { SignupForm } from "@/components/landing/SignupForm";

export const metadata: Metadata = {
  title: "הדרכה חינמית | הדר דנן",
  description: "גלה למה השיווק שלך לא עובד - ומה לעשות עם זה. הדרכה חינמית של הדר דנן, 20 דקות שמשנות גישה.",
  alternates: { canonical: "/training" },
};

export default function TrainingPage() {
  return (
    <ProductLandingPage
      productName="הדרכה חינמית"
      price={0}
      checkoutHref="#cta"

      headline={<>הדרכה חינמית. <em>הצעד הראשון</em> לבידול שלך.</>}
      heroSub="הדרכה של 20 דקות. בלי ציוד, בלי ניסיון, בלי תקציב. רק בהירות אמיתית על הפער בין מי שאתה לבין מה שהעסק שלך משדר."
      stats={[
        { val: "20",  label: "דקות" },
        { val: "0",   label: "עלות" },
        { val: "250+", label: "עסקים השתמשו" },
      ]}

      problemItems={[
        { icon: "🧭", text: "מה גורם לשיווק להרגיש מאולץ - ואיך לתקן את זה בלי להחליף הכל." },
        { icon: "🎯", text: "איך לזהות את המסר האמיתי שלך ולדבר אליו ישר - בלי לנחש." },
        { icon: "📱", text: "הצעד הראשון שאפשר לעשות כבר היום - בלי תקציב ובלי ציוד." },
      ]}
      agitationText="שיווק שמרגיש מאולץ לא נובע מחוסר יצירתיות - הוא נובע מחוסר בהירות. ה-20 דקות האלה ייתנו לך את הבהירות."

      solutionTitle="מה תלמד ב-20 הדקות?"
      solutionItems={[
        { num: "1", title: "למה השיווק מרגיש מאולץ",  desc: "נסביר את הפער הנפוץ בין מה שעסק עושה לבין מה שהלקוח רואה - ואיך לגשר עליו." },
        { num: "2", title: "איך מוצאים את המסר האמיתי", desc: "תרגיל פשוט שעוזר לזהות את החוזקה הייחודית שלך - זו שהלקוחות הכי מדברים עליה." },
        { num: "3", title: "הצעד הראשון לשינוי",       desc: "פעולה אחת שאפשר לעשות מחר בבוקר - שמייצרת תוצאה גלויה תוך 7 ימים." },
      ]}

      notForItems={[
        "מי שרוצה פתרון מהיר ללא מאמץ",
        "עסקים שמחפשים תבניות גנריות",
      ]}
      forItems={[
        "בעלי עסקים שמרגישים שהשיווק לא משקף אותם",
        "מי שרוצה בהירות לפני שמשקיעים כסף",
        "מי שמוכן לצעד ראשון",
      ]}

      whoName="הדר דנן"
      whoRole="אסטרטגיסטית שיווק ותוכן"
      whoText="יצרתי את ההדרכה הזו כנקודת כניסה לשיטת TrueSignal. 20 דקות שמראות למה רוב השיווק מרגיש מזויף - ואיך לתקן את זה."

      proofStats={[
        { val: "250+", label: "עסקים" },
        { val: "97%",  label: "ממליצים" },
      ]}
      testimonials={[
        { text: "ב-20 דקות הבנתי יותר על השיווק שלי מאשר בחצי שנה של קורסים.", author: "מיכל ר.", role: "מאמנת אישית" },
        { text: "הדרכה פשוטה שנתנה לי כיוון ברור. עשיתי את הצעד הראשון עוד באותו יום.", author: "יואב ס.", role: "יועץ עסקי" },
      ]}

      faqs={[
        { q: "האם זה באמת חינם?",               a: "כן. ללא תשלום עכשיו ואחר כך. הדרכה מלאה כמתנה." },
        { q: "לאן שולחים את ההדרכה?",           a: "ישר לאימייל שלך, תוך 5 דקות מהרישום." },
        { q: "כמה זמן ההדרכה?",                  a: "20 דקות. לומדים בקצב שלך - ניתן לעצור ולחזור." },
        { q: "מה קורה אחרי ההדרכה?",            a: "ממשיכים לשלב הבא בקצב שלך. אין לחץ, אין התחייבות." },
      ]}

      finalTitle="מוכן/ת לגלות את המסר האמיתי שלך?"
      finalSub="20 דקות. חינם לגמרי. ללא התחייבות."

      hideMicroCommitment

      priceSectionSlot={
        <section style={{ padding: "48px 20px", maxWidth: 640, margin: "0 auto" }}>

          {/* Video embed */}
          <div style={{
            position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden",
            borderRadius: 16, marginBottom: 36,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}>
            <iframe
              src="https://player.vimeo.com/video/1182619874?badge=0&autopause=0&player_id=0&app_id=58479"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
              title="השיעור במתנה - הדר דנן"
            />
          </div>

          <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{
            background: "#191F2B", border: "1px solid #2C323E",
            borderRadius: 20, padding: "32px 28px",
          }}>
            <p style={{ fontWeight: 900, fontSize: 20, textAlign: "center", color: "#EDE9E1", margin: "0 0 24px" }}>
              שלח/י לי את ההדרכה
            </p>
            <SignupForm ctaLabel="שלח לי את ההדרכה" />
            <p style={{ textAlign: "center", fontSize: 12, color: "#9E9990", marginTop: 14 }}>
              ללא ספאם. ניתן להסרה בכל עת.
            </p>
            <div style={{
              marginTop: 16, padding: "12px 14px",
              background: "rgba(201,150,74,0.07)", border: "1px solid rgba(201,150,74,0.1)",
              borderRadius: 10, fontSize: 13, color: "#F0C564", lineHeight: 1.5, textAlign: "right",
            }}>
              כל שקל שתשקיע בהמשך נחשב לשלב הבא - גישה מלאה למסלול השלם.
            </div>
          </div>
          </div>
        </section>
      }
    />
  );
}
