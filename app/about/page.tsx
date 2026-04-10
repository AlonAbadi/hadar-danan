import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export const metadata: Metadata = {
  title: "אודות הדר דנן | מומחית שיווק אותנטי, יוצרת שיטת TrueSignal",
  description: "הדר דנן — מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal. מ-50,000+ עוקבים ועד מאות עסקים שגדלו: הסיפור, המספרים והשיטה.",
  alternates: { canonical: "/about" },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "הדר דנן",
  "url": APP_URL,
  "jobTitle": "מומחית שיווק אותנטי ויוצרת שיטת TrueSignal",
  "description": "הדר דנן היא מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal. עבדה עם מאות בעלי עסקים ובנתה קהילה של מעל 70,000 עוקבים.",
  "alumniOf": {
    "@type": "EducationalOrganization",
    "name": "בית הספר למשחק גודמן",
  },
  "knowsAbout": [
    "שיווק אותנטי",
    "עמידה מול מצלמה",
    "יצירת תוכן וידאו",
    "בניית מערכות Signal",
    "בניית מותג אישי",
    "אסטרטגיה עסקית",
    "TrueSignal",
  ],
  "sameAs": [
    "https://www.instagram.com/hadar_danan",
    "https://www.tiktok.com/@hadardanann",
    "https://open.spotify.com/show/12EPZoAiHLq63tiq6GjreC",
    "https://podcasts.apple.com/il/podcast/id1829722848",
  ],
  "worksFor": {
    "@type": "Organization",
    "name": "הדר דנן בע״מ",
    "url": APP_URL,
  },
};

const PRINCIPLES = [
  {
    n: "01",
    q: "מה באמת מייחד אותי?",
    body: "לא מה שאתה רוצה למכור - אלא מה שהלקוחות שלך קונים ממך שוב ושוב. ה-Signal שלך חי שם, לא בבריף.",
  },
  {
    n: "02",
    q: "מה אני יכול/ה להחזיק בלי להתאמץ?",
    body: "כשיש פער בין מה שאתה מציג לבין מה שאתה מחזיק - הקהל מרגיש את זה לפני שהוא מבין למה. אותנטיות היא מבנה, לא מצב רוח.",
  },
  {
    n: "03",
    q: "מה הלקוח הנכון שלי מחפש באמת?",
    body: "לא כל לקוח הוא הלקוח שלך. כשמדייקים את ה-Signal - הלקוחות הנכונים מגיעים, ואת הלא-נכונים לא צריך לשכנע.",
  },
  {
    n: "04",
    q: "מה הפעולה שתייצר תנועה אמיתית?",
    body: "טריק שיווקי עובד פעם אחת. Signal אמיתי בונה מומנטום שמתחזק עם הזמן - כי הוא נשען על מה שקיים, לא על מה שאפשר לבים.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "אודות", url: `${APP_URL}/about` },
      ]} />

      <div
        dir="rtl"
        className="font-assistant min-h-screen"
        style={{ background: "#080C14", color: "#EDE9E1", paddingTop: 64 }}
      >
        <div className="relative max-w-[1200px] mx-auto px-6 py-16 lg:px-20 lg:py-28">

          {/* Ambient honeycomb background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0 L56 16 L56 50 L28 66 L0 50 L0 16Z' fill='none' stroke='%23E8B94A' stroke-width='0.6'/%3E%3Cpath d='M28 66 L56 82 L56 100' fill='none' stroke='%23E8B94A' stroke-width='0.6'/%3E%3Cpath d='M28 66 L0 82 L0 100' fill='none' stroke='%23E8B94A' stroke-width='0.6'/%3E%3C/svg%3E")`,
              opacity: 0.07,
            }}
          />

          {/* All content above bg */}
          <div className="relative">

            {/* ── 1. HERO ─────────────────────────────────────────── */}
            <section>
              <p className="text-[#E8B94A] text-xs tracking-[0.4em] mb-8 lg:mb-12">
                א · ו · ד · ו · ת
              </p>
              <h1
                className="font-extrabold leading-[0.95] tracking-tight"
                style={{ fontSize: "clamp(46px, 8vw, 88px)" }}
              >
                יש שיווק שמוכר.
                <br />
                ויש שיווק{" "}
                <span className="text-[#E8B94A]">שמדהד.</span>
              </h1>
              <p className="text-[#9E9990] mt-8 text-base lg:text-lg">
                שיטת <strong className="text-[#EDE9E1]">TrueSignal</strong>{" "}
                · נבנתה ע״י הדר דנן
              </p>
            </section>

            {/* ── 2. מי אני ──────────────────────────────────────── */}
            <section className="mt-12 lg:mt-20 pt-10 lg:pt-14 border-t border-[#1f2530]">
              <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5 lg:gap-16">
                <p className="text-[#E8B94A] text-xs tracking-[0.2em] uppercase pt-1">
                  מי אני
                </p>
                <div className="flex flex-col gap-5 text-base lg:text-lg leading-relaxed">
                  <p>
                    הייתי בייביסיטר בזמן קורונה, בוגרת בית הספר למשחק גודמן, ועסק שידע מה הוא מחזיק - אבל לא ידע איך לגרום לעולם לראות את זה. לא חיפשתי להיות ״אינפלואנסרית״. חיפשתי שיטה שתגרום לאנשים לראות את מה שאני באמת.
                  </p>
                  <p className="text-[#9E9990]">
                    מתוך הצורך הזה נולדה שיטת TrueSignal - לא כמוצר, אלא כדרך עבודה. היום אני עובדת עם בעלי עסקים, יוצרים ומקצוענים שמרגישים שמה שהם מציגים לעולם לא משקף את מי שהם באמת. המטרה שלי היא תמיד אחת: לעזור לך למצוא את ה-Signal שלך ולבנות ממנו שיווק שמחזיק לאורך זמן.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 3. MANIFESTO + HIVE ────────────────────────────── */}
            <section className="mt-12 lg:mt-20 pt-10 lg:pt-14 border-t border-[#1f2530]">

              {/* Section label + H2 */}
              <p className="text-[#E8B94A] text-xs tracking-[0.2em] uppercase mb-5">
                העקרונות
              </p>
              <h2
                className="font-extrabold leading-tight tracking-tight mb-10 lg:mb-14"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}
              >
                שיטת TrueSignal לא נשענת על טריקים.
                <br />
                היא נשענת על{" "}
                <em className="not-italic text-[#E8B94A]">ארבע שאלות.</em>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-20 items-center">

                {/* Hive SVG */}
                <div className="max-w-[240px] mx-auto lg:max-w-none">
                  <svg
                    viewBox="0 0 220 240"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E8B94A" />
                        <stop offset="100%" stopColor="#9E7C3A" />
                      </linearGradient>
                      <filter id="hexGlow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Top center hex */}
                    <polygon
                      points="110,10 148,32 148,76 110,98 72,76 72,32"
                      fill="rgba(232,185,74,0.08)"
                      stroke="url(#hexGrad)"
                      strokeWidth="1.5"
                      filter="url(#hexGlow)"
                    />
                    {/* Middle left hex */}
                    <polygon
                      points="72,98 110,120 110,164 72,186 34,164 34,120"
                      fill="rgba(232,185,74,0.06)"
                      stroke="url(#hexGrad)"
                      strokeWidth="1.5"
                      filter="url(#hexGlow)"
                    />
                    {/* Middle right hex */}
                    <polygon
                      points="148,98 186,120 186,164 148,186 110,164 110,120"
                      fill="rgba(232,185,74,0.06)"
                      stroke="url(#hexGrad)"
                      strokeWidth="1.5"
                      filter="url(#hexGlow)"
                    />
                    {/* Bottom center hex */}
                    <polygon
                      points="110,164 148,186 148,230 110,252 72,230 72,186"
                      fill="rgba(232,185,74,0.04)"
                      stroke="rgba(232,185,74,0.35)"
                      strokeWidth="1"
                    />
                    {/* Center dot */}
                    <circle cx="110" cy="120" r="4" fill="#E8B94A" opacity="0.8" />
                    <circle cx="72"  cy="76"  r="3" fill="#E8B94A" opacity="0.5" />
                    <circle cx="148" cy="76"  r="3" fill="#E8B94A" opacity="0.5" />
                  </svg>
                </div>

                {/* 4 Principles */}
                <ol className="flex flex-col gap-7 lg:gap-9 list-none">
                  {PRINCIPLES.map((p) => (
                    <li key={p.n} className="flex gap-5 items-start">
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-full text-[#E8B94A] text-xs font-bold"
                        style={{
                          width: 38, height: 38,
                          border: "1px solid #E8B94A",
                          background: "rgba(232,185,74,0.05)",
                        }}
                      >
                        {p.n}
                      </div>
                      <div>
                        <h3 className="italic text-[#E8B94A] font-semibold mb-1.5 leading-snug">
                          {p.q}
                        </h3>
                        <p className="text-[#9E9990] text-sm leading-relaxed">
                          {p.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

              </div>
            </section>

            {/* ── 4. STATS ───────────────────────────────────────── */}
            <section className="mt-12 lg:mt-20 pt-10 lg:pt-14 border-t border-[#1f2530]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {[
                  { val: "7+",  label: "שנות ניסיון בשיווק וידאו" },
                  { val: "∞",   label: "עסקים שמצאו את ה-Signal שלהם" },
                  { val: "1",   label: "שיטה. TrueSignal" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-2">
                    <span
                      className="font-extrabold text-[#E8B94A] leading-none"
                      style={{ fontSize: "clamp(42px, 6vw, 56px)" }}
                    >
                      {s.val}
                    </span>
                    <span className="text-[#9E9990] text-sm">{s.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 5. SIGN-OFF ────────────────────────────────────── */}
            <section className="mt-12 lg:mt-20 pt-10 lg:pt-14 border-t border-[#1f2530] text-center">
              <p
                className="italic leading-relaxed mx-auto"
                style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)", maxWidth: 680 }}
              >
                הבעיה אף פעם לא הייתה התוכן.{" "}
                <span className="text-[#E8B94A]">היא הייתה ה-Signal.</span>
              </p>
              <p className="text-[#9E9990] mt-5 text-xs tracking-[0.2em] uppercase">
                - הדר דנן
              </p>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
