import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "אזור החברים | הדר דנן",
};

const DAYS = [
  "זיהוי הלקוח האידיאלי",
  "יצירת תוכן ראשון",
  "פרסום חכם בלי תקציב",
  "בניית סמכות מהירה",
  "שיחת מכירה בוואצאפ",
  "המרת עוקבים ללקוחות",
  "מערכת אוטומטית",
];

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const secret = process.env.MEMBERS_SECRET;
  const groupUrl = process.env.WHATSAPP_GROUP_URL ?? "";
  const cookieStore = await cookies();
  const params = await searchParams;

  // Check token from query param first, then cookie
  const tokenFromQuery = params.t;
  const tokenFromCookie = cookieStore.get("members_access")?.value;
  const token = tokenFromQuery ?? tokenFromCookie;

  const isAuthorized = secret && token === secret;

  if (!isAuthorized) {
    redirect("/challenge");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 font-assistant text-white">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-gray-800 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">ה</div>
            <span className="font-bold">אזור החברים</span>
          </div>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition">
            דף הבית
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">

        {/* ── Welcome ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black">ברוך הבא לצ׳אלנג׳! 🎉</h1>
          <p className="text-gray-400">יש לך גישה מלאה לכל 7 הימים. התחל מיד.</p>
        </div>

        {/* ── WhatsApp Group CTA ──────────────────────────────── */}
        <div className="bg-gradient-to-l from-green-900/40 to-green-800/20 border border-green-700/40 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <p className="font-black text-xl text-white">הצעד הראשון: הצטרף לקבוצה</p>
            <p className="text-green-300 text-sm leading-relaxed">
              כל המשתתפים, השאלות, והפידבק האישי שלי - הכל קורה בקבוצת הוואצאפ.
              זה לב הצ׳אלנג׳. אל תחמיץ.
            </p>
          </div>
          {groupUrl ? (
            <a
              href={groupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black px-6 py-3 rounded-xl transition active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              הצטרף לקבוצה
            </a>
          ) : (
            <div className="flex-shrink-0 bg-gray-800 text-gray-500 px-6 py-3 rounded-xl text-sm">
              הקישור יישלח עוד מעט בוואצאפ
            </div>
          )}
        </div>

        {/* ── 7-Day Checklist ─────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-black">7 הימים שלך</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DAYS.map((day, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">יום {i + 1}</p>
                  <p className="font-bold text-white text-sm">{day}</p>
                </div>
              </div>
            ))}

            {/* Workshop upsell card */}
            <div className="flex items-center gap-4 bg-gradient-to-l from-blue-900/40 to-blue-800/20 border border-blue-600/40 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wide">הצעד הבא</p>
                <p className="font-bold text-white text-sm">וורקשופ מתקדם ב-₪1,080</p>
              </div>
              <Link
                href="/workshop"
                className="flex-shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
              >
                פרטים →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Support ─────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center flex flex-col gap-3">
          <p className="font-bold text-white">יש שאלה? תקוע?</p>
          <p className="text-gray-400 text-sm">כתוב לי ישירות בוואצאפ - אני עונה תוך שעה בימי עסקים.</p>
          <a
            href={`https://wa.me/${process.env.WHATSAPP_PHONE ?? "972501234567"}?text=${encodeURIComponent("היי הדר, אני בצ׳אלנג׳ ויש לי שאלה:")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-green-400 hover:text-green-300 font-bold transition text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            כתוב לי בוואצאפ
          </a>
        </div>
      </main>
    </div>
  );
}
