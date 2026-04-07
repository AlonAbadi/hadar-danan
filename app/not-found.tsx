import Link from "next/link";

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "#0a0a0f", color: "#ffffff" }}
    >
      <div className="flex flex-col items-center gap-6 max-w-md">
        {/* Big 404 */}
        <p className="text-8xl font-black" style={{ color: "#4ade80" }}>404</p>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-white">הדף לא נמצא</h1>
          <p className="text-gray-400 leading-relaxed">
            הכתובת שחיפשת לא קיימת. אולי הקישור ישן או שהדף הועבר.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link
            href="/"
            className="rounded-xl px-6 py-3 font-bold text-gray-900 transition hover:opacity-90"
            style={{ background: "#4ade80" }}
          >
            חזרה לדף הבית ←
          </Link>
          <Link
            href="/challenge"
            className="rounded-xl px-6 py-3 font-bold text-white border transition hover:border-white/40"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            לצ׳אלנג׳ 7 הימים
          </Link>
        </div>
      </div>
    </main>
  );
}
