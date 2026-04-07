import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "הצוות | הדר דנן",
  description: "הצוות שמאחורי האות שלך - אנשי המקצוע שהופכים רעיון לתוצאה.",
  alternates: { canonical: "/team" },
};

const TEAM = [
  {
    name: "הדר דנן",
    role: "מייסדת ואסטרטגית תוכן",
    desc: "מעל עשור של ניסיון בשיווק דיגיטלי, פיתחה את שיטת TrueSignal© ועבדה עם אלפי עסקים. מתמחה באסטרטגיה, מיצוב ובניית מותג אישי.",
    emoji: "🎯",
  },
  {
    name: "מיכל ל.",
    role: "מנהלת הפקה ובמאית תוכן",
    desc: "אחראית על ימי הצילום, ניהול הפקות והגשמת החזון האסטרטגי לתוכן ויזואלי. רקע בטלוויזיה ובפרסום.",
    emoji: "🎬",
  },
  {
    name: "יואב מ.",
    role: "עורך וידאו ומומחה פלטפורמות",
    desc: "מתמחה בעריכת Reels ו-TikTok, אופטימיזציה לאלגוריתמים, וניתוח ביצועי תוכן. הופך ימי צילום ל-16 סרטונים ערוכים.",
    emoji: "✂️",
  },
];

export default function TeamPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen font-assistant"
      style={{ background: "#0D1018", color: "#EDE9E1" }}
    >
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <p
          className="text-sm font-semibold tracking-widest uppercase mb-6"
          style={{ color: "#C9964A" }}
        >
          הצוות
        </p>
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6" style={{ color: "#EDE9E1" }}>
          הצוות שמאחורי האות שלך
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "#9E9990" }}>
          אנשי מקצוע שמאמינים שתוכן טוב מתחיל בהבנה עמוקה - לא בכלים, לא בטרנדים.
          ביחד אנחנו הופכים את הידע שלך לסיפור שמושך את הלקוחות הנכונים.
        </p>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6">
        <div style={{ height: 1, background: "#2C323E" }} />
      </div>

      {/* ── Team cards ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="rounded-2xl p-7 flex flex-col gap-4"
              style={{
                background: "linear-gradient(145deg, #1D2430, #111620)",
                border: "1px solid rgba(201,150,74,0.16)",
              }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: "rgba(201,150,74,0.1)",
                  border: "1px solid rgba(201,150,74,0.1)",
                }}
              >
                {member.emoji}
              </div>
              <div>
                <p className="font-black text-lg" style={{ color: "#EDE9E1" }}>
                  {member.name}
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "#C9964A" }}>
                  {member.role}
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#9E9990" }}>
                {member.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6">
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
          href="mailto:hadar@hadar-danan.co.il"
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
          אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span>
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
          <a href="mailto:hadar@hadar-danan.co.il" className="hover:text-[#EDE9E1] transition">
            hadar@hadar-danan.co.il
          </a>
        </p>
      </footer>
    </main>
  );
}
