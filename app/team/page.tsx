import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "הצוות | הדר דנן",
  description: "הצוות שמאחורי האות שלך - אנשי המקצוע שהופכים רעיון לתוצאה.",
  alternates: { canonical: "/team" },
};

const TEAM = [
  {
    name: "הדר דנן",
    role: "בעלת החברה",
    desc: "הדר היא בעלת החברה, הדר דנן בע\"מ, ומתמחה בהפקת סרטוני שיווק מקצועיים ובהדרכה ייחודית לבעלי עסקים בתחום השיווק הדיגיטלי. היא הובילה למעלה מ־3,500 עסקים וחברות בישראל להצלחה באמצעות וידאו מרקטינג.",
    photo: "/hadarprotrait.jpg",
    featured: true,
  },
  {
    name: "אוראל",
    role: "בימוי, אסטרטגיה וקריאייטיב",
    desc: "אוראל היא חלק מהמחלקה האמנותית ואחראית על בימוי, אסטרטגיה, קריאייטיב ויצירת תוכן. שותפה מלאה לפיצוח אסטרטגיות עם בעלי עסקים, מביאה שילוב של כישרון, חדות מחשבה ואינטליגנציה רגשית גבוהה.",
    photo: "/team/oral.jpg",
  },
  {
    name: "שחר",
    role: "בימוי, אסטרטגיה וקריאייטיב",
    desc: "שחר היא חלק מהמחלקה האמנותית ואחראית על בימוי, אסטרטגיה, קריאייטיב ויצירת תוכן. מתאפיינת בחשיבה חדה, יצירתיות ויכולת לחשוב מחוץ לקופסה, לצד חוש הומור וראייה מרחבית ואמנותית.",
    photo: "/team/shachar.jpg",
  },
  {
    name: "נאור",
    role: "עורך ראשי ומנהל צוות עריכה",
    desc: "נאור הוא העורך הראשי ומנהל צוות העורכים, עם רקע בלימודי משחק ותיאטרון. מתמחה בעולמות ה-AI וב-After Effects, מביא שילוב של יצירתיות, דיוק וטכנולוגיה מתקדמת לכל פרויקט.",
    photo: "/team/naor.jpg",
  },
  {
    name: "קטיה",
    role: "צלמת הבית",
    desc: "קטיה היא צלמת הבית שלנו עם שנים של ניסיון, המתמחה בצילום דוקומנטרי ותיעוד רגעים אותנטיים. מביאה גם חוש עיצוב מפותח ויודעת להתאים חללים בצורה מדויקת לצרכי הלקוח.",
    photo: "/team/katya.jpg",
  },
  {
    name: "שקד",
    role: "צלמת",
    desc: "שקד היא צלמת מוכשרת עם רקע בלימודי קולנוע ותסריטאות, מה שמעניק לה ראייה יצירתית וסיפורית בכל פרויקט. צילמה קליפים והייתה שותפה להפקות גדולות, עם דגש על דיוק ואסתטיקה.",
    photo: "/team/shaked.jpg",
  },
  {
    name: "מלכה",
    role: "מנהלת משרד ושירות לקוחות",
    desc: "מלכה היא מנהלת המשרד, אחראית על שירות הלקוחות והגבייה. מביאה גישה חרוצה, מסודרת ואמפתית, ודואגת שכל לקוח יקבל מענה מקצועי, אישי ומסור מתחילת התהליך ועד סופו.",
    photo: "/team/malka.jpg",
  },
  {
    name: "אלון",
    role: "איש צוות",
    desc: "אלון פועל מתוך חמלה אמיתית וראייה אנושית עמוקה. ליווה עסקים קטנים לצאת מתקופות מאתגרות, ומביא יכולת נדירה לזהות אנשים ולהתאים עבורם את הפתרון המדויק ביותר.",
    photo: "/team/alon.jpg",
  },
  {
    name: "נורית",
    role: "מכירות",
    desc: "נורית היא אשת מכירות מקצועית, אמינה ושירותית. יודעת לייצר חיבור מהיר עם אנשים, לזהות את הצורך המדויק שלהם ולהתאים עבורם את הפתרון הנכון ביותר.",
    photo: "/team/nurit.jpg",
  },
];

export default function TeamPage() {
  const featured = TEAM[0];
  const rest = TEAM.slice(1);

  return (
    <main
      dir="rtl"
      className="min-h-screen font-assistant"
      style={{ background: "#0D1018", color: "#EDE9E1" }}
    >
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
        <p
          className="text-sm font-semibold tracking-widest uppercase mb-5"
          style={{ color: "#C9964A" }}
        >
          הצוות
        </p>
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5" style={{ color: "#EDE9E1" }}>
          הצוות שמאחורי האות שלך
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "#9E9990" }}>
          אנשי מקצוע שמאמינים שתוכן טוב מתחיל בהבנה עמוקה — לא בכלים, לא בטרנדים.
          ביחד אנחנו הופכים את הידע שלך לסיפור שמושך את הלקוחות הנכונים.
        </p>
      </section>

      {/* ── Featured — הדר ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div
          className="rounded-3xl overflow-hidden flex flex-col md:flex-row"
          style={{
            background: "linear-gradient(145deg, #1D2430, #111620)",
            border: "1px solid rgba(201,150,74,0.22)",
          }}
        >
          {/* Photo */}
          <div className="relative md:w-72 flex-shrink-0" style={{ minHeight: 340 }}>
            <Image
              src={featured.photo!}
              alt={featured.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 288px"
            />
            <div
              className="absolute inset-0 md:hidden"
              style={{ background: "linear-gradient(to top, #111620 20%, transparent 70%)" }}
            />
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center px-8 py-8 gap-3">
            <div>
              <p
                className="text-xs font-bold tracking-widest uppercase mb-2"
                style={{ color: "#C9964A" }}
              >
                בעלת החברה
              </p>
              <h2 className="text-3xl font-black" style={{ color: "#EDE9E1" }}>
                {featured.name}
              </h2>
            </div>
            <p className="text-base leading-relaxed" style={{ color: "#9E9990" }}>
              {featured.desc}
            </p>
            <div
              className="inline-flex items-center gap-2 mt-2 w-fit px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: "rgba(201,150,74,0.12)",
                border: "1px solid rgba(201,150,74,0.3)",
                color: "#C9964A",
              }}
            >
              <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span> מייסדת
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 mb-16">
        <div style={{ height: 1, background: "#2C323E" }} />
      </div>

      {/* ── Team grid ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {rest.map((member) => (
            <div
              key={member.name}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "linear-gradient(145deg, #1D2430, #111620)",
                border: "1px solid rgba(44,50,62,0.8)",
              }}
            >
              {/* Photo area */}
              <div className="relative flex-shrink-0" style={{ height: 220 }}>
                {member.photo ? (
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "linear-gradient(145deg, #1a2035, #0d1220)" }}
                  >
                    <span
                      className="text-5xl font-black"
                      style={{ color: "rgba(201,150,74,0.4)" }}
                    >
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Bottom gradient overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 h-16"
                  style={{ background: "linear-gradient(to top, #111620, transparent)" }}
                />
              </div>

              {/* Text */}
              <div className="px-4 py-4 flex flex-col gap-1.5 flex-1">
                <p className="font-black text-sm leading-snug" style={{ color: "#EDE9E1" }}>
                  {member.name}
                </p>
                <p className="text-xs font-semibold" style={{ color: "#C9964A" }}>
                  {member.role}
                </p>
                <p className="text-xs leading-relaxed mt-1" style={{ color: "#9E9990" }}>
                  {member.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ height: 1, background: "#2C323E" }} />
      </div>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-black mb-4" style={{ color: "#EDE9E1" }}>
          רוצה להצטרף לצוות?
        </h2>
        <p className="mb-8" style={{ color: "#9E9990" }}>
          אנחנו תמיד מחפשים אנשי מקצוע שמאמינים בשיטה ורוצים לעשות עבודה שמשנה.
          שלח/י מייל עם הניסיון שלך.
        </p>
        <a
          href="mailto:hadar@beegood.online"
          className="inline-block rounded-full px-8 py-4 text-lg font-bold transition hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
            color: "#1A1206",
          }}
        >
          שלח/י מייל ←
        </a>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer
        className="text-center py-10 text-sm border-t"
        style={{ borderColor: "#2C323E", color: "#9E9990" }}
      >
        <p className="font-medium mb-1" style={{ color: "rgba(158,153,144,0.6)" }}>
          אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. |{" "}
          <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
        </p>
        <p>© {new Date().getFullYear()} הדר דנן בע״מ · כל הזכויות שמורות</p>
        <div className="flex justify-center gap-4 mt-3 flex-wrap">
          <Link href="/privacy"       className="hover:text-[#EDE9E1] transition">מדיניות פרטיות</Link>
          <Link href="/terms"         className="hover:text-[#EDE9E1] transition">תנאי שימוש</Link>
          <Link href="/accessibility" className="hover:text-[#EDE9E1] transition">הצהרת נגישות</Link>
          <Link href="/hive/terms"    className="hover:text-[#EDE9E1] transition">תנאי מנוי הכוורת</Link>
        </div>
        <p className="mt-3 text-xs">
          לביטול הסכמה:{" "}
          <a href="mailto:hadar@beegood.online" className="hover:text-[#EDE9E1] transition">
            hadar@beegood.online
          </a>
        </p>
      </footer>
    </main>
  );
}
