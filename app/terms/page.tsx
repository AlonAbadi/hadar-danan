import Link from "next/link";

export const metadata = {
  title: "תנאי שימוש | הדר דנן",
};

export default function TermsPage() {
  return (
    <div
      dir="rtl"
      className="font-assistant min-h-screen"
      style={{ background: "#080C14", color: "#9E9990" }}
    >
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#EDE9E1", marginBottom: 8 }}>
            תנאי שימוש
          </h1>
          <p style={{ fontSize: 14, color: "#9E9990" }}>עדכון אחרון: אפריל 2026</p>
        </div>

        <Section title="1. הסכמה לתנאים">
          <p>
            השימוש באתר beegood.online ובשירותים המוצעים על ידי הדר דנן בע״מ ("החברה") מהווה הסכמה מלאה לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש באתר.
          </p>
        </Section>

        <Section title="2. השירותים">
          <p>החברה מציעה את השירותים הדיגיטליים הבאים:</p>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <li><B>אתגר 7 ימים</B> - תוכן וידאו ל-7 ימים, פורמט Reels</li>
            <li><B>סדנה יום אחד</B> - סדנה פיזית או מקוונת</li>
            <li><B>קורס דיגיטלי</B> - 16 שיעורי וידאו ב-8 מודולים</li>
            <li><B>פגישת אסטרטגיה</B> - פגישה אישית עם הדר דנן</li>
            <li><B>פרימיום</B> - ליווי אישי מורחב</li>
            <li><B>הכוורת</B> - מנוי קהילה חודשי בשלוש רמות (Starter, Pro, Elite)</li>
          </ul>
        </Section>

        <Section title="3. חשבון משתמש">
          <p><B>3.1 יצירת חשבון:</B> ניתן להירשם עם אימייל וסיסמה, או דרך Google Sign-In. אתה אחראי לשמור את פרטי הגישה לחשבונך בסודיות.</p>
          <p><B>3.2 דיוק המידע:</B> אתה מתחייב לספק מידע מדויק ועדכני בעת ההרשמה.</p>
          <p><B>3.3 סגירת חשבון:</B> ניתן לסגור את חשבונך בכל עת דרך הגדרות הפרופיל. סגירת חשבון לא מזכה בהחזר כספי על רכישות שבוצעו.</p>
        </Section>

        <Section title="4. תשלום, קרדיט וביטולים">
          <p><B>4.1 מחירים:</B> כל המחירים מצוינים בשקלים חדשים וכוללים מע״מ בהתאם לחוק.</p>
          <p>
            <B>4.2 מערכת קרדיט:</B> כל רכישה מזכה בקרדיט השווה לסכום ששולם בפועל. הקרדיט מנוצל ברכישה הבאה ומפחית את המחיר לתשלום. הקרדיט אינו ניתן להמרה למזומן ואינו צובר ריבית.
          </p>
          <p><B>4.3 תנאי ביטול לפי מוצר:</B></p>
          <div
            style={{
              background: "#141820",
              border: "1px solid #2C323E",
              borderRadius: 8,
              padding: 16,
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <p style={{ color: "#EDE9E1", fontWeight: 700, marginBottom: 4 }}>אתגר 7 ימים (197 ש"ח)</p>
              <p>ביטול תוך 48 שעות מרגע הרכישה - החזר מלא ללא שאלות.</p>
            </div>
            <div>
              <p style={{ color: "#EDE9E1", fontWeight: 700, marginBottom: 4 }}>סדנה יום אחד (1,080 ש"ח)</p>
              <p>ביטול עד 48 שעות לפני מועד הסדנה - החזר מלא. ביטול פחות מ-48 שעות לפני המועד - אין החזר, אך ניתן להעביר את המקום לאדם אחר.</p>
            </div>
            <div>
              <p style={{ color: "#EDE9E1", fontWeight: 700, marginBottom: 4 }}>קורס דיגיטלי (1,800 ש"ח)</p>
              <p>ביטול תוך 48 שעות מרגע הרכישה - החזר מלא, בתנאי שנצפו פחות מ-3 שיעורים. לאחר 48 שעות או לאחר צפייה ב-3 שיעורים ומעלה - אין החזר.</p>
            </div>
            <div>
              <p style={{ color: "#EDE9E1", fontWeight: 700, marginBottom: 4 }}>פגישת אסטרטגיה (4,000 ש"ח)</p>
              <p>ביטול עד 24 שעות לפני המועד - החזר מלא. ביטול פחות מ-24 שעות לפני המועד - אין החזר. ערבות תוצאה: אם לא קיבלת לפחות 3 אינסייטים ישימים - החזר מלא, בכפוף לפנייה בכתב תוך 48 שעות מסיום הפגישה.</p>
            </div>
            <div>
              <p style={{ color: "#EDE9E1", fontWeight: 700, marginBottom: 4 }}>פרימיום (14,000 ש"ח)</p>
              <p>ביטול תוך 7 ימים מרגע הרכישה - החזר מלא בניכוי 10% דמי טיפול. לאחר 7 ימים - אין החזר.</p>
            </div>
            <div>
              <p style={{ color: "#EDE9E1", fontWeight: 700, marginBottom: 4 }}>הכוורת - מנוי חוזר</p>
              <p>ביטול בכל עת דרך האזור האישי. הגישה נשמרת עד סוף תקופת החיוב הנוכחית. אין החזר על תקופות שכבר חויבו.</p>
            </div>
          </div>
          <p style={{ marginTop: 8 }}><B>4.4 אופן ההחזר:</B> החזרים יינתנו לאמצעי התשלום המקורי תוך 14 ימי עסקים.</p>
        </Section>

        <Section title="5. גישה לתוכן דיגיטלי">
          <p>
            <B>5.1 רישיון שימוש:</B> ברכישת מוצר דיגיטלי, ניתנת לך רישיון אישי, לא-בלעדי ולא-עביר לצפייה בתכנים לשימוש אישי בלבד.
          </p>
          <p><B>5.2 הגבלות - אסור:</B></p>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <li>לשתף פרטי גישה עם אחרים</li>
            <li>להקליט, להעתיק או להפיץ תכנים</li>
            <li>לעשות שימוש מסחרי בתכנים</li>
          </ul>
          <p>
            <B>5.3 זמינות תוכן:</B> התכנים זמינים כל עוד החשבון פעיל. החברה שומרת לעצמה את הזכות לעדכן ולשנות תכנים מעת לעת.
          </p>
        </Section>

        <Section title="6. קניין רוחני">
          <p>
            כל התכנים באתר, לרבות טקסטים, תמונות, סרטונים, מצגות, שם המותג "הדר דנן", "Bee Good" ו-"TrueSignal", הינם רכושה הבלעדי של החברה ומוגנים בזכויות יוצרים ובדיני קניין רוחני. אין להעתיק, לשכפל, להפיץ או לעשות כל שימוש מסחרי בתכנים ללא אישור מפורש בכתב.
          </p>
        </Section>

        <Section title="7. הגבלת אחריות">
          <p>
            החברה אינה אחראית לתוצאות עסקיות שיצמחו או לא יצמחו מהשימוש בתכנים ובשירותים. התוצאות תלויות במאמץ, בנסיבות ובגורמים רבים שאינם בשליטת החברה. האחריות המקסימלית של החברה לא תעלה על הסכום ששולם בפועל עבור השירות הספציפי נשוא התביעה.
          </p>
        </Section>

        <Section title="8. שינויים בשירות ובתנאים">
          <p>
            החברה רשאית לעדכן תנאים אלה ולשנות את השירותים המוצעים מעת לעת. במקרה של שינוי מהותי, תישלח הודעה לכתובת האימייל הרשומה לפחות 14 ימים מראש. שימוש באתר לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
          </p>
        </Section>

        <Section title="9. דין וסמכות שיפוט">
          <p>
            תנאים אלה כפופים לדיני מדינת ישראל. סמכות השיפוט הבלעדית לכל סכסוך הנובע מתנאים אלה תהיה לבתי המשפט המוסמכים במחוז תל אביב.
          </p>
        </Section>

        <Section title="10. יצירת קשר">
          <p>הדר דנן בע״מ</p>
          <p>אימייל: billing@hadardanan.co.il</p>
          <p>אתר: beegood.online</p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #2C323E", textAlign: "center", fontSize: 13 }}>
          <Link href="/" style={{ color: "#E8B94A", textDecoration: "none" }}>חזרה לדף הבית</Link>
          {" | "}
          <Link href="/privacy" style={{ color: "#E8B94A", textDecoration: "none" }}>מדיניות פרטיות</Link>
          {" | "}
          <Link href="/accessibility" style={{ color: "#E8B94A", textDecoration: "none" }}>הצהרת נגישות</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#EDE9E1", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "#EDE9E1" }}>{children}</strong>;
}
