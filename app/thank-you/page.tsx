import Link from "next/link";
import { ThankYouTracker } from "./ThankYouTracker";

export const metadata = {
  title: "נרשמת בהצלחה | הדר דנן",
};

const WHATSAPP_TEXT = encodeURIComponent(
  "הצטרפתי להדרכה החינמית של הדר דנן - למד איך לייצר סרטונים שמביאים לקוחות. כדאי לך להצטרף גם: " +
    (process.env.NEXT_PUBLIC_APP_URL ?? "https://hadar-danan.vercel.app")
);

export default function ThankYouPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen flex flex-col font-assistant"
      style={{ background: "#101520" }}
    >
      <ThankYouTracker />
      {/* Nav */}
      <header className="px-6 py-4" style={{ borderBottom: "1px solid #2C323E", background: "rgba(16,21,32,0.9)" }}>
        <span className="font-black text-xl" style={{ color: "#C9964A" }}>הדר דנן</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg flex flex-col items-center gap-8 text-center">

          {/* Success icon */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)" }}
          >
            <svg className="w-12 h-12" fill="none" stroke="#101520" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-black" style={{ color: "#EDE9E1" }}>נרשמת בהצלחה! 🎉</h1>
            <p className="text-lg leading-relaxed" style={{ color: "#9E9990" }}>
              שלחנו לך אימייל עם הקישור להדרכה.<br />
              <span className="text-sm">בדוק גם את תיקיית הספאם אם לא רואה.</span>
            </p>
          </div>

          {/* Next step card */}
          <div
            className="w-full rounded-2xl p-6 flex flex-col gap-4 text-right"
            style={{ background: "linear-gradient(135deg, #C9964A, #9E7C3A)", color: "#101520" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(16,21,32,0.2)" }}>
                🚀
              </div>
              <p className="font-black text-lg">הצעד הבא שלך</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(16,21,32,0.75)" }}>
              צפה בהדרכה כבר היום ועקוב אחרי שלושת הצעדים הראשונים.
              90% מהאנשים שמיישמים רואים תוצאות תוך 7 ימים.
            </p>
          </div>

          {/* Upsell to challenge */}
          <div
            className="w-full rounded-2xl p-5 flex flex-col gap-3 text-right"
            style={{ background: "#191F2B", border: "1px solid #2C323E" }}
          >
            <p className="font-black" style={{ color: "#EDE9E1" }}>רוצה להאיץ את התוצאות?</p>
            <p className="text-sm leading-relaxed" style={{ color: "#9E9990" }}>
              הצ׳אלנג׳ של 7 הימים לוקח אותך צעד קדימה - עם פידבק אישי על הסרטונים שלך ולקוחות אמיתיים בסוף השבוע.
            </p>
            <Link
              href="/challenge"
              className="rounded-full py-3 text-sm font-bold text-center btn-cta-gold"
            >
              הצ׳אלנג׳ 7 הימים - ₪197 ←
            </Link>
          </div>

          {/* WhatsApp share */}
          <a
            href={`https://wa.me/?text=${WHATSAPP_TEXT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 rounded-2xl border-2 py-4 font-bold text-base transition hover:opacity-80"
            style={{ borderColor: "#22c55e", color: "#22c55e", background: "rgba(34,197,94,0.05)" }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            שתף חבר בוואצאפ
          </a>

          <Link href="/" className="text-sm transition hover:opacity-70" style={{ color: "#9E9990" }}>
            חזרה לדף הבית
          </Link>

        </div>
      </div>
    </main>
  );
}
