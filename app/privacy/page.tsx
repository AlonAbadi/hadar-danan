import Link from "next/link";

export const metadata = {
  title: "מדיניות פרטיות | הדר דנן",
};

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/" className="font-black text-xl" style={{ color: "#2563eb" }}>הדר דנן</Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-gray-900">מדיניות פרטיות</h1>
            <p className="text-gray-400 text-sm">עדכון אחרון: ינואר 2025</p>
          </div>

          <div className="flex flex-col gap-6 text-gray-700 leading-relaxed">

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">1. כללי</h2>
              <p>
                הדר דנן בע״מ ("החברה", "אנחנו") מחויבת להגן על פרטיותך.
                מדיניות זו מסבירה אילו מידע אנחנו אוספים, כיצד אנחנו משתמשים בו,
                ומהן זכויותיך לגביו.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">2. מידע שאנחנו אוספים</h2>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm">
                <li><strong>פרטי הרשמה:</strong> שם, כתובת אימייל, מספר טלפון</li>
                <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, דפים שנצפו, זמן שהייה</li>
                <li><strong>עוגיות (Cookies):</strong> לזיהוי מבקרים חוזרים ולשיפור חוויית השימוש</li>
                <li><strong>מידע שיווקי:</strong> מקור ההגעה לאתר (UTM parameters)</li>
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">3. שימוש במידע</h2>
              <p>אנחנו משתמשים במידע שנאסף כדי:</p>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm">
                <li>לשלוח לך את ההדרכה ותכנים שביקשת</li>
                <li>לשלוח עדכונים ותכנים שיווקיים (ניתן לבטל בכל עת)</li>
                <li>לשפר את השירותים שלנו</li>
                <li>לעמוד בדרישות חוקיות</li>
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">4. שיתוף מידע עם צדדים שלישיים</h2>
              <p>
                אנחנו לא מוכרים ולא משכירים את פרטיך לצדדים שלישיים.
                אנחנו עשויים לשתף מידע עם ספקי שירות הפועלים מטעמנו (כגון: ספקי שליחת אימייל,
                ספקי עיבוד תשלומים), בכפוף להסכמי סודיות.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">5. עוגיות</h2>
              <p>
                האתר משתמש בעוגיות לצרכי ניתוח וזיהוי. ניתן לבטל עוגיות דרך הגדרות הדפדפן,
                אך הדבר עשוי לפגוע בחלק מפונקציות האתר.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">6. אבטחת מידע</h2>
              <p>
                אנחנו נוקטים באמצעי אבטחה סבירים להגנה על המידע שלך, כולל הצפנת SSL.
                עם זאת, אין אפשרות להבטיח אבטחה מוחלטת בסביבה מקוונת.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">7. זכויותיך</h2>
              <p>בהתאם לחוק הגנת הפרטיות, תשמ״א-1981, יש לך זכות:</p>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm">
                <li>לעיין במידע שנאסף עליך</li>
                <li>לבקש תיקון של מידע שגוי</li>
                <li>לבקש מחיקת המידע שלך</li>
                <li>לבטל הסכמה לקבלת דיוור שיווקי בכל עת</li>
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-gray-900">8. יצירת קשר</h2>
              <p>
                לשאלות בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו בכתובת האימייל המופיעה באתר.
              </p>
            </section>

          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition">חזרה לדף הבית</Link>
        {" · "}
        <Link href="/terms" className="hover:text-gray-600 transition">תנאי שימוש</Link>
        {" · "}
        <Link href="/accessibility" className="hover:text-gray-600 transition">הצהרת נגישות</Link>
      </footer>
    </div>
  );
}
