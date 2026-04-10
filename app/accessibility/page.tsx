import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "הצהרת נגישות | הדר דנן",
  description: "הצהרת נגישות האתר של הדר דנן בע״מ - עמידה בתקן ישראלי 5568 ו-WCAG 2.1 AA",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen font-assistant" style={{ background: "#101520", color: "#EDE9E1" }} dir="rtl">
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">

        <h1 className="text-3xl font-black mb-2" style={{ color: "#EDE9E1" }}>הצהרת נגישות</h1>
        <p className="text-sm mb-10" style={{ color: "#9E9990" }}>תאריך עדכון אחרון: מרץ 2026</p>

        {/* Legal statement */}
        <section aria-labelledby="legal-heading" className="mb-10 rounded-2xl p-6" style={{ background: "rgba(201,150,74,0.1)", border: "1px solid rgba(201,150,74,0.08)" }}>
          <h2 id="legal-heading" className="text-lg font-bold mb-3" style={{ color: "#F0C564" }}>הצהרה לפי חוק</h2>
          <p className="leading-relaxed" style={{ color: "#EDE9E1" }}>
            אתר זה עומד בדרישות{" "}
            <strong>תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות) תשע״ג 2013</strong>.
            הנגשת האתר בוצעה בהתאם לתקן הישראלי{" "}
            <strong>ת״י 5568</strong> ולתקן הבינלאומי <strong>WCAG 2.1 ברמה AA</strong>.
          </p>
        </section>

        {/* Conformance level */}
        <section aria-labelledby="conformance-heading" className="mb-10">
          <h2 id="conformance-heading" className="text-xl font-bold mb-4" style={{ color: "#EDE9E1" }}>רמת נגישות</h2>
          <dl className="flex flex-col gap-3">
            {[
              { term: "תקן",            def: "ת״י 5568 / WCAG 2.1" },
              { term: "רמת עמידה",      def: "AA" },
              { term: "תאריך הנגשה",   def: "מרץ 2026" },
              { term: "גורם מנגיש",     def: "הדר דנן בע״מ" },
            ].map(({ term, def }) => (
              <div key={term} className="flex gap-4 items-baseline pb-3" style={{ borderBottom: "1px solid #2C323E" }}>
                <dt className="text-sm font-semibold w-36 flex-shrink-0" style={{ color: "#9E9990" }}>{term}</dt>
                <dd className="font-medium" style={{ color: "#EDE9E1" }}>{def}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Accessibility features */}
        <section aria-labelledby="features-heading" className="mb-10">
          <h2 id="features-heading" className="text-xl font-bold mb-4" style={{ color: "#EDE9E1" }}>תכונות הנגישות באתר</h2>
          <ul className="flex flex-col gap-2 leading-relaxed" role="list" style={{ color: "#EDE9E1" }}>
            {[
              "כפתור נגישות קבוע בפינת המסך - מאפשר שינוי גודל טקסט, ניגודיות גבוהה, גווני אפור, הדגשת קישורים, עצירת אנימציות ומצב קריאה",
              "קישור דילוג לתוכן הראשי (Skip to main content) בכל עמוד",
              "מבנה כותרות היררכי תקין (H1 ← H2 ← H3) בכל עמוד",
              "כל שדות הטופס מוגדרים עם תוויות (labels) נגישות",
              "כל הכפתורים כוללים תיאור aria-label",
              "כל תמונות האתר כוללות תיאור טקסטואלי alt",
              "ניווט מלא באמצעות מקלדת",
              "מדד ניגודיות צבעים עומד בתקן AA (4.5:1 מינימום)",
              "תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver)",
              "ממשק מלא בעברית עם כיווניות RTL תקינה",
              "תגית lang='he' על תגית ה-HTML הראשית",
              "הגדרות הנגישות נשמרות בדפדפן לביקורים עתידיים",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 flex-shrink-0" style={{ color: "#C9964A" }} aria-hidden="true">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Supported browsers */}
        <section aria-labelledby="browsers-heading" className="mb-10">
          <h2 id="browsers-heading" className="text-xl font-bold mb-4" style={{ color: "#EDE9E1" }}>דפדפנים ותוכנות נתמכות</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" aria-label="דפדפנים ותוכנות נתמכות">
              <thead>
                <tr style={{ background: "#191F2B" }}>
                  <th scope="col" className="text-right px-4 py-2 font-semibold" style={{ color: "#9E9990", border: "1px solid #2C323E" }}>דפדפן / תוכנה</th>
                  <th scope="col" className="text-right px-4 py-2 font-semibold" style={{ color: "#9E9990", border: "1px solid #2C323E" }}>מערכת הפעלה</th>
                  <th scope="col" className="text-right px-4 py-2 font-semibold" style={{ color: "#9E9990", border: "1px solid #2C323E" }}>גרסה מינימלית</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Chrome",  "Windows / macOS / Android", "עדכנית"],
                  ["Firefox", "Windows / macOS",            "עדכנית"],
                  ["Safari",  "macOS / iOS",                "גרסה 15+"],
                  ["Edge",    "Windows",                    "עדכנית"],
                  ["NVDA + Chrome",  "Windows",             "NVDA 2022+"],
                  ["VoiceOver + Safari", "macOS / iOS",     "מובנה במערכת"],
                ].map(([browser, os, version], idx) => (
                  <tr key={browser} style={{ background: idx % 2 === 0 ? "#191F2B" : "#101520" }}>
                    <td className="px-4 py-2 font-medium" style={{ border: "1px solid #2C323E", color: "#EDE9E1" }}>{browser}</td>
                    <td className="px-4 py-2" style={{ border: "1px solid #2C323E", color: "#9E9990" }}>{os}</td>
                    <td className="px-4 py-2" style={{ border: "1px solid #2C323E", color: "#9E9990" }}>{version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Known limitations */}
        <section aria-labelledby="limitations-heading" className="mb-10">
          <h2 id="limitations-heading" className="text-xl font-bold mb-4" style={{ color: "#EDE9E1" }}>מגבלות ידועות</h2>
          <ul className="flex flex-col gap-2 leading-relaxed" role="list" style={{ color: "#EDE9E1" }}>
            <li className="flex gap-2">
              <span className="text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true">⚠</span>
              <span>תוכן וידאו חיצוני (יוטיוב) עשוי שלא לכלול כתוביות - מוגבלות של הפלטפורמה החיצונית.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true">⚠</span>
              <span>עמוד סליקת האשראי (Cardcom) הוא שירות צד-שלישי ונגישותו נמצאת באחריות הספק.</span>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section aria-labelledby="contact-heading" className="mb-10 rounded-2xl p-6" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
          <h2 id="contact-heading" className="text-xl font-bold mb-3" style={{ color: "#EDE9E1" }}>יצירת קשר בנושא נגישות</h2>
          <p className="leading-relaxed mb-4" style={{ color: "#EDE9E1" }}>
            נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן. ניתן לפנות אלינו:
          </p>
          <dl className="flex flex-col gap-2" style={{ color: "#EDE9E1" }}>
            <div className="flex gap-3">
              <dt className="font-semibold flex-shrink-0">אימייל נגישות:</dt>
              <dd>
                <a
                  href="mailto:נגישות@beegood.online"
                  className="underline hover:opacity-70 transition"
                  style={{ color: "#C9964A" }}
                >
                  נגישות@beegood.online
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-semibold flex-shrink-0">אימייל כללי:</dt>
              <dd>
                <a
                  href="mailto:hadar@beegood.online"
                  className="underline hover:opacity-70 transition"
                  style={{ color: "#C9964A" }}
                >
                  hadar@beegood.online
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-semibold flex-shrink-0">טלפון:</dt>
              <dd>
                <a
                  href="tel:+972539566961"
                  className="underline hover:opacity-70 transition"
                  style={{ color: "#C9964A" }}
                >
                  053-9566961
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-semibold flex-shrink-0">זמן מענה:</dt>
              <dd>עד 5 ימי עסקים</dd>
            </div>
          </dl>
        </section>

        {/* Complaint process */}
        <section aria-labelledby="complaint-heading" className="mb-12">
          <h2 id="complaint-heading" className="text-xl font-bold mb-3" style={{ color: "#EDE9E1" }}>הגשת תלונה</h2>
          <p className="leading-relaxed" style={{ color: "#EDE9E1" }}>
            אם לא קיבלתם מענה מספק לאחר פנייתכם אלינו, ניתן לפנות לנציב שוויון זכויות לאנשים עם
            מוגבלות במשרד המשפטים.
          </p>
        </section>

        {/* Footer nav */}
        <nav aria-label="ניווט בתחתית הצהרת הנגישות" className="pt-6 flex gap-4 text-sm" style={{ borderTop: "1px solid #2C323E", color: "#9E9990" }}>
          <Link href="/" className="hover:opacity-70 transition" style={{ color: "#9E9990" }}>דף הבית</Link>
          <Link href="/privacy" className="hover:opacity-70 transition" style={{ color: "#9E9990" }}>מדיניות פרטיות</Link>
          <Link href="/terms" className="hover:opacity-70 transition" style={{ color: "#9E9990" }}>תנאי שימוש</Link>
        </nav>

      </main>
    </div>
  );
}
