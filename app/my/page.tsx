"use client";

import { useState, useEffect } from "react";

export default function MyPage() {
  const [email, setEmail]   = useState("");
  const [credit, setCredit] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/credit?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      setCredit(data.credit ?? 0);
      setChecked(true);
    } catch {
      setCredit(0);
      setChecked(true);
    } finally {
      setLoading(false);
    }
  }

  const PRODUCTS = [
    { name: "הדרכה חינמית", href: "/training", price: 0 },
    { name: "אתגר 7 ימים", href: "/challenge", price: 197 },
    { name: "סדנה יום אחד", href: "/workshop", price: 1080 },
    { name: "קורס דיגיטלי", href: "/course", price: 1800 },
    { name: "פגישת אסטרטגיה", href: "/strategy", price: 4000 },
    { name: "יום צילום פרמיום", href: "/premium", price: 14000 },
  ];

  return (
    <main dir="rtl" className="min-h-screen font-assistant flex flex-col" style={{ background: "#101520" }}>

      {/* Nav */}
      <header
        className="px-6"
        style={{ borderBottom: "1px solid #2C323E", background: "rgba(16,21,32,0.95)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16">
          <a href="/" className="font-black text-xl" style={{ color: "#EDE9E1" }}>הדר דנן</a>
          <p className="text-sm" style={{ color: "#9E9990" }}>אזור אישי</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg flex flex-col gap-8">

          <div className="text-center flex flex-col gap-3">
            <h1 className="text-3xl font-black" style={{ color: "#EDE9E1" }}>האזור האישי שלך</h1>
            <p className="text-base" style={{ color: "#9E9990" }}>
              הזן את האימייל שלך כדי לראות את הזיכוי הצבור שלך
            </p>
          </div>

          <div
            className="rounded-3xl p-8"
            style={{ background: "#191F2B", border: "1px solid #2C323E" }}
          >
            <form onSubmit={handleCheck} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="my-email" className="text-sm font-semibold" style={{ color: "#9E9990" }}>
                  כתובת אימייל
                </label>
                <input
                  id="my-email"
                  type="email"
                  dir="ltr"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setChecked(false); setCredit(null); }}
                  className="w-full rounded-xl px-4 py-3 text-base outline-none transition"
                  style={{ borderColor: "#2C323E", border: "1px solid #2C323E", background: "#1D2430", color: "#EDE9E1" }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#C9964A"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#2C323E"; }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full py-3.5 text-base font-bold disabled:opacity-60 btn-cta-gold"
              >
                {loading ? "בודק..." : "בדוק זיכוי ←"}
              </button>
            </form>

            {/* Results */}
            {checked && credit !== null && (
              <div className="mt-6 flex flex-col gap-4">
                {credit === 0 ? (
                  <div
                    className="rounded-2xl p-5 text-center"
                    style={{ background: "#101520", border: "1px solid #2C323E" }}
                  >
                    <p className="font-semibold" style={{ color: "#9E9990" }}>אין זיכוי צבור עדיין</p>
                    <p className="text-sm mt-1" style={{ color: "#9E9990" }}>
                      כל רכישה מצטברת לזיכוי לשלב הבא
                    </p>
                    <a
                      href="/training"
                      className="inline-block mt-4 text-sm font-bold"
                      style={{ color: "#C9964A" }}
                    >
                      התחל מהדרכה חינמית ←
                    </a>
                  </div>
                ) : (
                  <>
                    <div
                      className="rounded-2xl p-6 text-center"
                      style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.08)" }}
                    >
                      <p className="text-sm font-semibold mb-1" style={{ color: "#F0C564" }}>הזיכוי הצבור שלך</p>
                      <p className="text-4xl font-black" style={{ color: "#C9964A" }}>
                        ₪{credit.toLocaleString("he-IL")}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "#F0C564" }}>
                        כל שקל שהשקעת נחשב לשלב הבא
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold mb-1" style={{ color: "#EDE9E1" }}>
                        הזיכוי שלך ביחס למוצרים:
                      </p>
                      {PRODUCTS.filter((p) => p.price > 0).map((p) => {
                        const toPay = Math.max(0, p.price - credit);
                        const covered = toPay === 0;
                        return (
                          <a
                            key={p.href}
                            href={`${p.href}?email=${encodeURIComponent(email.trim())}`}
                            className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:opacity-80"
                            style={{
                              background: covered ? "rgba(201,150,74,0.08)" : "#101520",
                              border: covered ? "1px solid rgba(201,150,74,0.08)" : "1px solid #2C323E",
                            }}
                          >
                            <span className="text-sm font-medium" style={{ color: "#EDE9E1" }}>{p.name}</span>
                            <span className="text-sm font-black" style={{ color: covered ? "#C9964A" : "#EDE9E1" }}>
                              {covered ? "✅ חינם עבורך" : `₪${toPay.toLocaleString("he-IL")} בלבד`}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-xs" style={{ color: "#9E9990" }}>
            הזיכוי מחושב אוטומטית מסכום כל הרכישות שלך
          </p>

          {checked && (
            <HiveCancelSection email={email.trim()} />
          )}

        </div>
      </div>

    </main>
  );
}

function HiveCancelSection({ email }: { email: string }) {
  const [hiveStatus, setHiveStatus] = useState<"loading" | "active" | "none" | "cancelled">("loading");
  const [tier, setTier] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    fetch(`/api/hive/status?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        setHiveStatus(data.status ?? "none");
        setTier(data.tier ?? "");
      })
      .catch(() => setHiveStatus("none"));
  }, [email]);

  if (hiveStatus === "loading") return <p style={{ color: "#9E9990" }}>בודק מנוי כוורת...</p>;
  if (hiveStatus !== "active") return null;

  async function handleCancel() {
    setCancelling(true);
    const res = await fetch("/api/hive/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setCancelled(true);
      setShowModal(false);
    }
    setCancelling(false);
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
      <div className="flex items-center gap-2">
        <span>🐝</span>
        <p className="font-bold" style={{ color: "#EDE9E1" }}>מנוי הכוורת פעיל</p>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: "#C9964A" }}>
          {tier === "discounted_29" ? "₪29/חודש" : "₪97/חודש"}
        </span>
      </div>
      {cancelled ? (
        <p className="text-sm" style={{ color: "#9E9990" }}>המנוי בוטל. תוכל ליהנות מהכוורת עד סוף החודש.</p>
      ) : (
        <>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-semibold rounded-xl py-2 transition hover:opacity-80"
            style={{ border: "1px solid #2C323E", color: "#9E9990" }}
          >
            בטל מנוי כוורת
          </button>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="rounded-2xl p-7 max-w-sm w-full mx-4 flex flex-col gap-5" style={{ background: "#191F2B", border: "1px solid #2C323E" }}>
                <h3 className="font-black text-lg" style={{ color: "#EDE9E1" }}>ביטול מנוי הכוורת</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9E9990" }}>
                  המנוי יסתיים בסוף החודש הנוכחי. האם אתה בטוח?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 rounded-full py-3 text-sm font-bold disabled:opacity-60 btn-cta-gold"
                  >
                    {cancelling ? "מבטל..." : "כן, בטל מנוי"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl py-3 text-sm font-bold transition hover:opacity-80"
                    style={{ border: "1px solid #2C323E", color: "#9E9990" }}
                  >
                    חזור
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
