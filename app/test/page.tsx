import Link from "next/link";
import { TestCTA } from "./TestCTA";

export const metadata = {
  title: "מוצר טסט | הדר דנן",
  robots: { index: false, follow: false },
};

export default function TestPage() {
  return (
    <div dir="rtl" style={{ background: "#101520", color: "#EDE9E1" }} className="min-h-screen font-assistant">
      <main>
        {/* ── Hero ── */}
        <section className="px-4 pt-20 pb-16">
          <div className="max-w-md mx-auto flex flex-col items-center gap-6 text-center">
            <h1 className="text-4xl font-black" style={{ color: "#EDE9E1" }}>מוצר טסט</h1>
            <p className="text-lg" style={{ color: "#9E9990" }}>עמוד טסט לבדיקת מערכת התשלום. מחיר: ₪1.</p>

            <div
              className="w-full rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: "linear-gradient(145deg, #1D2430, #111620)", border: "1px solid rgba(201,150,74,0.16)" }}
            >
              <div
                className="flex justify-between items-center pb-4"
                style={{ borderBottom: "1px solid #2C323E" }}
              >
                <span style={{ color: "#9E9990" }}>מוצר טסט</span>
                <div className="text-right">
                  <p className="font-black text-2xl" style={{ color: "#EDE9E1" }}>₪1</p>
                  <p className="text-xs" style={{ color: "#9E9990" }}>כולל מע״מ</p>
                </div>
              </div>

              <TestCTA />
            </div>
          </div>
        </section>
      </main>

      <footer
        className="border-t px-4 py-6 text-center text-xs"
        style={{ borderColor: "#2C323E", background: "#101520", color: "#9E9990" }}
      >
        <p className="mb-1 font-medium" style={{ color: "rgba(158,153,144,0.6)" }}>
          אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. |{" "}
          <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
        </p>
        <p>© {new Date().getFullYear()} הדר דנן בע״מ ·{" "}
          <Link href="/privacy" className="transition hover:text-[#EDE9E1]">מדיניות פרטיות</Link>
          {" · "}
          <Link href="/terms" className="transition hover:text-[#EDE9E1]">תנאי שימוש</Link>
          {" · "}
          <Link href="/accessibility" className="transition hover:text-[#EDE9E1]">הצהרת נגישות</Link>
        </p>
      </footer>
    </div>
  );
}
