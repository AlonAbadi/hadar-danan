import Link from "next/link";

export const metadata = {
  title: "תנאי שימוש | הדר דנן",
};

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/" className="font-black text-xl" style={{ color: "#2563eb" }}>הדר דנן</Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-gray-900">תנאי שימוש</h1>
            <p className="text-gray-400 text-sm">עדכון אחרון: ינואר 2025</p>
          </div>

          <div className="flex flex-col gap-6 text-gray-700 leading-relaxed">

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">1. הסכמה לתנאים</h2>
              <p>
                השימוש באתר זה ובשירותים המוצעים על ידי הדר דנן בע״מ ("החברה") מהווה הסכמה מלאה
                לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש באתר.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">2. השירותים</h2>
              <p>
                החברה מציעה הדרכות, סדנאות ושירותי ייעוץ בתחום השיווק הדיגיטלי.
                התכנים המוצגים באתר הינם לצורכי מידע כללי בלבד ואינם מהווים ייעוץ מקצועי מחייב.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">3. תשלום וביטולים</h2>
              <ul className="flex flex-col gap-2 text-sm">
                <li><strong>אתגר 7 ימים (₪197):</strong> ביטול תוך 48 שעות מההצטרפות - החזר מלא ללא שאלות.</li>
                <li><strong>סדנה יום אחד (₪1,080):</strong> ביטול עד 48 שעות לפני מועד הסדנה - החזר מלא.</li>
                <li><strong>פגישת אסטרטגיה (₪4,000):</strong> ביטול עד 24 שעות לפני המועד - החזר מלא.
                  ערבות תוצאה: אם לא קיבלת לפחות 3 אינסייטים ישימים - החזר מלא.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">4. קניין רוחני</h2>
              <p>
                כל התכנים באתר, לרבות טקסטים, תמונות, סרטונים ומצגות, הינם רכושה הבלעדי של החברה
                ומוגנים בזכויות יוצרים. אין להעתיק, לשכפל, להפיץ או לעשות כל שימוש מסחרי בתכנים
                ללא אישור מפורש בכתב.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">5. הגבלת אחריות</h2>
              <p>
                החברה אינה אחראית לתוצאות עסקיות שיצמחו (או לא יצמחו) מהשימוש בתכנים ובשירותים.
                התוצאות תלויות במאמץ, בנסיבות ובגורמים רבים שאינם בשליטת החברה.
                האחריות המקסימלית של החברה לא תעלה על הסכום ששולם בפועל עבור השירות.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">6. שינויים בתנאים</h2>
              <p>
                החברה רשאית לעדכן תנאים אלה מעת לעת. שימוש באתר לאחר עדכון התנאים
                מהווה הסכמה לתנאים המעודכנים.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">7. דין וסמכות שיפוט</h2>
              <p>
                תנאים אלה כפופים לדיני מדינת ישראל. סמכות השיפוט הבלעדית לכל סכסוך
                הנובע מתנאים אלה תהיה לבתי המשפט המוסמכים במחוז תל אביב.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">8. יצירת קשר</h2>
              <p>
                לכל שאלה בנוגע לתנאי שימוש אלה, ניתן לפנות אלינו דרך הצ׳אט או האימייל המופיע באתר.
              </p>
            </section>

          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition">חזרה לדף הבית</Link>
        {" · "}
        <Link href="/privacy" className="hover:text-gray-600 transition">מדיניות פרטיות</Link>
        {" · "}
        <Link href="/accessibility" className="hover:text-gray-600 transition">הצהרת נגישות</Link>
      </footer>
    </div>
  );
}
