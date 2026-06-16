import Link from "next/link";

export const metadata = {
  title: "תקנון תחרות מנוע האות | הדר דנן",
  description: "תקנון תחרות מנוע האות החודשית של BeeGood — איך משתתפים, מתי בודקים, מה הפרס.",
};

export default function ContestTermsPage() {
  return (
    <div
      dir="rtl"
      className="font-assistant min-h-screen"
      style={{ background: "#080C14", color: "#AAB0BD" }}
    >
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display:       "inline-block",
            fontSize:      11,
            fontWeight:    800,
            color:         "#C9964A",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            marginBottom:  16,
            padding:       "4px 12px",
            background:    "rgba(232,185,74,0.06)",
            border:        "1px solid rgba(232,185,74,0.25)",
            borderRadius:  999,
          }}>
            תקנון תחרות
          </div>
          <h1 style={{
            fontFamily:   "'Frank Ruhl Libre', Georgia, serif",
            fontSize:     34,
            fontWeight:   500,
            lineHeight:   1.25,
            color:        "#EDE9E1",
            marginBottom: 12,
          }}>
            תחרות מנוע האות החודשית
          </h1>
          <p style={{ color: "#AAB0BD", fontSize: 15, lineHeight: 1.6, maxWidth: 540, margin: "0 auto" }}>
            חוקי המשחק. כל מה שצריך לדעת לפני שמשתתפים, ולפני שמכריזים על זוכה.
          </p>
        </div>

        {/* TL;DR */}
        <div style={{
          background:   "linear-gradient(145deg, rgba(232,185,74,0.06), rgba(232,185,74,0.02))",
          border:       "1px solid rgba(232,185,74,0.25)",
          borderRadius: 14,
          padding:      "22px 26px",
          marginBottom: 44,
        }}>
          <h3 style={{
            fontSize:      12,
            fontWeight:    800,
            color:         "#E8B94A",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom:  12,
          }}>
            בקצרה
          </h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <Bullet>שתפו את הכרטיס של מנוע האות שלכם באינסטגרם, פייסבוק, טיקטוק או לינקדאין</Bullet>
            <Bullet>תייגו את <B>@hadar_danan</B> בפוסט</Bullet>
            <Bullet>מי שאסף הכי הרבה תגובות ולייקים החודש — מקבל הפקת 3 סרטונים מהדר</Bullet>
            <Bullet>בדיקה ב-1 לכל חודש קלנדרי</Bullet>
            <Bullet>ניתן לזכות פעם אחת בכל 12 חודשים</Bullet>
          </ul>
        </div>

        <Section title="1. מטרת התחרות">
          <p>
            תחרות חודשית של BeeGood שמטרתה לחגוג את האות הייחודי של עוסקים, יזמים ובעלי עסקים שגילו אותו דרך מנוע האות באתר beegood.online.
          </p>
          <p>
            התחרות מעודדת שיתוף ציבורי של האות באמצעות הכרטיס שיוצר מנוע האות, ומכירה בכך שהמשתתפים שאספו את ההכי הרבה אינטראקציה עם הקהל שלהם החודש.
          </p>
        </Section>

        <Section title="2. מי יכול להשתתף">
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 0 }}>
            <li>מי שמילא/ה את 5 השאלות של מנוע האות באתר beegood.online וקיבל/ה את הכרטיס האישי שלו/ה</li>
            <li>בני 18 ומעלה</li>
            <li>כל אדם פרטי או בעל עסק שעומד בשני התנאים לעיל</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            עובדי BeeGood, בני משפחותיהם, ויועצים בתשלום של החברה — אינם רשאים להשתתף.
          </p>
        </Section>

        <Section title="3. איך משתתפים">
          <p>שתפו את הכרטיס שיצרתם במנוע האות באחת או יותר מהפלטפורמות הבאות:</p>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <li>אינסטגרם</li>
            <li>פייסבוק</li>
            <li>טיקטוק</li>
            <li>לינקדאין</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            בכל פוסט יש לתייג את <B>@hadar_danan</B> באופן ברור (תיוג תקני בפוסט עצמו, לא בתגובה).
          </p>
          <p>
            הפוסט חייב להיות ציבורי (פתוח לכל המבקרים בפרופיל), אחרת לא ניתן יהיה לזהות ולספור אותו.
          </p>
        </Section>

        <Section title="4. איך נקבע הזוכה">
          <p>
            זוכה החודש נקבע לפי <B>סך כל התגובות והלייקים</B> על הפוסטים המתויגים שלו/ה, מצטברים מכל הפלטפורמות יחד.
          </p>
          <p>
            במקרה של שני משתתפים עם תוצאה זהה — הדר תכריע לפי שיקול דעתה, בהתבסס על איכות השיחה שהפוסט עורר.
          </p>
        </Section>

        <Section title="5. מתי הבדיקה וההכרזה">
          <p><B>בדיקה:</B> ב-1 של כל חודש קלנדרי, בודקים את כל הפוסטים מהחודש הקודם שתויגו עם <B>@hadar_danan</B>.</p>
          <p><B>הודעה לזוכה:</B> עד 5 ימי עסקים מהבדיקה, דרך הודעה ישירה (DM) בפלטפורמה שדרכה התויגו, או דרך מייל אם הזוכה השאיר/ה במנוע האות.</p>
          <p><B>פרסום:</B> שם הזוכה והכרטיס שלו/ה יפורסמו בערוצי BeeGood (בהסכמת הזוכה).</p>
        </Section>

        <Section title="6. הפרס">
          <p>תהליך הפקת תוכן מלא עם הדר דנן:</p>
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <li>שלושה סרטונים שלמים</li>
            <li>כולל קונספט, צילום ועריכה מקצועיים</li>
            <li>בשווי אלפי שקלים</li>
            <li>הפקה מתואמת עם לוח הזמנים של הדר, תוך 90 יום מהזכייה</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            הפרס אישי, לא ניתן להעברה, ולא ניתן להמרה במזומן או בשירותים אחרים.
          </p>
        </Section>

        <Section title="7. כמה פעמים אפשר לזכות">
          <p>
            ניתן לזכות בתחרות <B>פעם אחת בלבד בכל תקופה של 12 חודשים</B>. אם זכיתם, תוכלו להשתתף שוב 12 חודשים אחרי מועד הזכייה הקודמת.
          </p>
        </Section>

        <Section title="8. תנאים נוספים">
          <ul style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 0 }}>
            <li>הדר וצוות BeeGood רשאים לפסול פוסט שאינו עומד בקריטריונים, או שמכיל תוכן פוגעני / לא רלוונטי</li>
            <li>במקרה של תקלה טכנית או מקרים חריגים — הדר תכריע על דרך הפעולה</li>
            <li>הזוכה מסכים/ה שהפוסטים והכרטיס שלו/ה יוכלו להופיע בערוצי השיווק של BeeGood</li>
            <li>תקנון זה ניתן לעדכון. שינויים יפורסמו בדף זה ויחולו ממועד הפרסום</li>
            <li>BeeGood רשאית להשהות או לבטל את התחרות בכל עת, מסיבות מיוחדות</li>
          </ul>
        </Section>

        <Section title="9. פרטיות">
          <p>
            פרטים אישיים שייאספו במהלך התחרות יישמרו לפי <Link href="/privacy" style={{ color: "#E8B94A" }}>מדיניות הפרטיות של BeeGood</Link> ולא יועברו לצד שלישי ללא הסכמת המשתתפ/ת.
          </p>
        </Section>

        <Section title="10. דין החל">
          <p>
            על תחרות זו חל הדין הישראלי. סמכות שיפוט בלעדית — בית המשפט בתל אביב.
          </p>
        </Section>

        {/* Footer */}
        <div style={{
          marginTop:    60,
          paddingTop:   28,
          borderTop:    "1px solid rgba(232,185,74,0.16)",
          textAlign:    "center",
          fontSize:     13,
          color:        "#AAB0BD",
          lineHeight:   1.7,
        }}>
          <div style={{ marginBottom: 12 }}>
            <Link href="/" style={{ color: "#E8B94A", textDecoration: "none" }}>חזרה לדף הבית</Link>
            {" | "}
            <Link href="/signal" style={{ color: "#E8B94A", textDecoration: "none" }}>מנוע האות</Link>
            {" | "}
            <Link href="/privacy" style={{ color: "#E8B94A", textDecoration: "none" }}>מדיניות פרטיות</Link>
          </div>
          <div style={{ fontSize: 11, color: "#6a7080" }}>עודכן לאחרונה: יוני 2026</div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#EDE9E1", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li style={{
      paddingInlineStart: 22,
      position:           "relative",
      fontSize:           14,
      color:              "#EDE9E1",
      lineHeight:         1.65,
    }}>
      <span style={{
        position:         "absolute",
        insetInlineStart: 6,
        color:            "#C9964A",
        fontWeight:       800,
        fontSize:         18,
        top:              -4,
      }}>·</span>
      {children}
    </li>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "#EDE9E1" }}>{children}</strong>;
}
