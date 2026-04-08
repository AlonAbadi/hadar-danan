import Link from "next/link";

export const metadata = {
  title: "מדיניות פרטיות | הדר דנן",
};

export default function PrivacyPage() {
  return (
    <div
      dir="rtl"
      className="font-assistant min-h-screen"
      style={{ background: "#080C14", color: "#9E9990" }}
    >
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#EDE9E1", marginBottom: 8 }}>
            מדיניות פרטיות
          </h1>
          <p style={{ fontSize: 14, color: "#9E9990" }}>עדכון אחרון: אפריל 2026</p>
        </div>

        <Section title="1. כללי">
          <p>
            הדר דנן בע״מ, המפעילה את האתר beegood.online ("החברה", "אנחנו", "אנו"), מחויבת להגן על פרטיותך. מדיניות זו מסבירה אילו מידע אנחנו אוספים, כיצד אנחנו משתמשים בו, עם מי אנחנו משתפים אותו, ומהן זכויותיך לגביו. השימוש באתר ובשירותים מהווה הסכמה למדיניות פרטיות זו.
          </p>
        </Section>

        <Section title="2. מידע שאנחנו אוספים">
          <SubTitle>2.1 מידע שאתה מספק לנו:</SubTitle>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <li><B>פרטי הרשמה:</B> שם מלא, כתובת אימייל, מספר טלפון</li>
            <li><B>פרטי חשבון:</B> סיסמה מוצפנת (אם נרשמת עם אימייל וסיסמה)</li>
            <li><B>פרטי תשלום:</B> מעובדים ישירות על ידי ספק התשלומים Cardcom ואינם נשמרים אצלנו</li>
            <li><B>תגובות וסקרים:</B> תשובות לשאלונים ולשאלות שהגשת</li>
          </ul>
          <SubTitle style={{ marginTop: 16 }}>2.2 מידע שנאסף אוטומטית:</SubTitle>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <li><B>מידע טכני:</B> כתובת IP, סוג דפדפן, מערכת הפעלה, דפים שנצפו, זמן שהייה</li>
            <li><B>עוגיות (Cookies):</B> לזיהוי מבקרים חוזרים, ניתוח שימוש ושיפור חוויית השימוש</li>
            <li><B>מידע שיווקי:</B> מקור ההגעה לאתר (UTM parameters)</li>
            <li><B>נתוני צפייה בתוכן:</B> התקדמות בקורסים, אחוזי צפייה בסרטונים</li>
          </ul>
          <SubTitle style={{ marginTop: 16 }}>2.3 מידע שנאסף דרך Google Sign-In:</SubTitle>
          <p style={{ marginTop: 8 }}>
            אם בחרת להתחבר לאתר דרך Google, אנחנו מקבלים מ-Google את הפרטים הבאים: שם מלא, כתובת אימייל, תמונת פרופיל (אם קיימת). איננו מקבלים גישה לסיסמת ה-Google שלך, לאנשי הקשר שלך, או לכל מידע אחר מחשבון ה-Google שלך שלא צוין לעיל.
          </p>
        </Section>

        <Section title="3. שימוש במידע">
          <p>אנחנו משתמשים במידע שנאסף כדי:</p>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <li>לאמת את זהותך ולנהל את חשבונך</li>
            <li>לספק גישה לתכנים שרכשת (קורס, אתגר, סדנה, כוורת)</li>
            <li>לשלוח לך את ההדרכה ותכנים שביקשת</li>
            <li>לשלוח עדכונים ותכנים שיווקיים (ניתן לבטל בכל עת)</li>
            <li>לעבד תשלומים ולנהל רכישות</li>
            <li>לחשב ולנהל את מערכת הקרדיט שלך</li>
            <li>לשפר את השירותים שלנו</li>
            <li>לעמוד בדרישות חוקיות</li>
          </ul>
        </Section>

        <Section title="4. שיתוף מידע עם צדדים שלישיים">
          <p>אנחנו לא מוכרים ולא משכירים את פרטיך לצדדים שלישיים. אנחנו משתפים מידע רק עם ספקי השירות הבאים:</p>
          <div
            style={{
              background: "#141820",
              border: "1px solid #2C323E",
              borderRadius: 8,
              padding: 8,
              marginTop: 12,
              overflowX: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#EDE9E1", fontWeight: 700, borderBottom: "1px solid #2C323E" }}>ספק</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#EDE9E1", fontWeight: 700, borderBottom: "1px solid #2C323E" }}>תפקיד</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#EDE9E1", fontWeight: 700, borderBottom: "1px solid #2C323E" }}>מיקום</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase", "אחסון נתוני חשבון ורכישות", "האיחוד האירופי"],
                  ["Resend", "שליחת אימיילים", 'ארה"מ'],
                  ["Cardcom", "עיבוד תשלומים", "ישראל"],
                  ["Google", "אימות זהות (Sign in with Google)", 'ארה"מ'],
                  ["Vercel", "אחסון ופריסת האתר", 'ארה"מ'],
                ].map(([name, role, location]) => (
                  <tr key={name}>
                    <td style={{ padding: "8px 12px", color: "#EDE9E1" }}>{name}</td>
                    <td style={{ padding: "8px 12px" }}>{role}</td>
                    <td style={{ padding: "8px 12px" }}>{location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="5. עוגיות">
          <p>האתר משתמש בסוגי עוגיות הבאים:</p>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <li><B>עוגיות הכרחיות:</B> נדרשות לתפקוד הבסיסי של האתר ואימות זהות</li>
            <li><B>עוגיות ניתוח:</B> לניתוח דפוסי שימוש ושיפור האתר</li>
            <li><B>עוגיות שיווקיות:</B> למדידת אפקטיביות הפרסום</li>
          </ul>
        </Section>

        <Section title="6. אבטחת מידע">
          <p>
            אנחנו נוקטים באמצעי אבטחה סבירים להגנה על המידע שלך: הצפנת SSL לכל התקשורת עם האתר, סיסמאות מוצפנות ולא נגישות גם לנו, גישה מוגבלת לנתונים לצוות מורשה בלבד, ניטור שוטף לאיתור פרצות אבטחה. עם זאת, אין אפשרות להבטיח אבטחה מוחלטת בסביבה מקוונת.
          </p>
        </Section>

        <Section title="7. שמירת מידע">
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li><B>נתוני חשבון:</B> עד 3 שנים מיום סגירת החשבון</li>
            <li><B>נתוני רכישות:</B> 7 שנים (לפי דרישות חוק חשבונאות)</li>
            <li><B>נתוני שיווק:</B> עד לביטול הסכמה או 3 שנים מיום האחרון שהשתמשת בשירות</li>
          </ul>
        </Section>

        <Section title="8. זכויותיך">
          <p>בהתאם לחוק הגנת הפרטיות, תשמ״א-1981 ותיקוניו, יש לך זכות:</p>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <li><B>עיון:</B> לעיין במידע שנאסף עליך</li>
            <li><B>תיקון:</B> לבקש תיקון של מידע שגוי</li>
            <li><B>מחיקה:</B> לבקש מחיקת המידע שלך ומחיקת חשבונך</li>
            <li><B>ניוד:</B> לקבל עותק של המידע שלך בפורמט קריא</li>
            <li><B>ביטול הסכמה:</B> לבטל הסכמה לקבלת דיוור שיווקי בכל עת</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            <B>מחיקת חשבון:</B> ניתן למחוק את חשבונך דרך הגדרות הפרופיל באזור האישי, או על ידי פנייה אלינו. מחיקת החשבון תסיר את נתוניך האישיים, אך נתוני רכישות יישמרו לתקופות הנדרשות על פי חוק.
          </p>
        </Section>

        <Section title="9. ילדים">
          <p>
            השירותים שלנו מיועדים לבני 18 ומעלה. אנחנו לא אוספים ביודעין מידע מילדים מתחת לגיל 18.
          </p>
        </Section>

        <Section title="10. שינויים במדיניות">
          <p>
            אנחנו רשאים לעדכן מדיניות זו מעת לעת. במקרה של שינוי מהותי, נשלח הודעה לכתובת האימייל הרשומה. שימוש באתר לאחר עדכון המדיניות מהווה הסכמה למדיניות המעודכנת.
          </p>
        </Section>

        <Section title="11. יצירת קשר">
          <p>הדר דנן בע״מ</p>
          <p>אימייל: billing@hadardanan.co.il</p>
          <p>אתר: beegood.online</p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #2C323E", textAlign: "center", fontSize: 13 }}>
          <Link href="/" style={{ color: "#E8B94A", textDecoration: "none" }}>חזרה לדף הבית</Link>
          {" | "}
          <Link href="/terms" style={{ color: "#E8B94A", textDecoration: "none" }}>תנאי שימוש</Link>
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

function SubTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontWeight: 700, color: "#EDE9E1", ...style }}>{children}</p>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "#EDE9E1" }}>{children}</strong>;
}
