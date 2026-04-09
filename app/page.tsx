import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { parseVariant, AB_CONTENT } from "@/lib/ab";
import { createServerClient } from "@/lib/supabase/server";
import { PageTracker } from "@/components/landing/PageTracker";
import { CarouselWithDots } from "@/components/landing/CarouselWithDots";
import { PhilosophySection } from "@/components/landing/PhilosophySection";
import { StatsSection } from "@/components/landing/StatsSection";
import { ProductsSection } from "@/components/ProductsSection";
import { BookOpen, Zap, Target, GraduationCap, Compass, Video, Users, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "הדר דנן | אסטרטגיה שיווקית שמביאה תוצאות",
  description: "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת - ולבנות שיווק שמרגיש טבעי ומביא תוצאות",
  alternates: { canonical: "/" },
};

async function getUserCount(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}


const ROW1_PRODUCTS = [
  { title: "הדרכה חינמית",    who: "לכל מי שרוצה להבין למה השיווק שלו לא עובד",                      price: "חינם",          cta: "התחל כאן ←",         href: "/training",    icon: BookOpen },
  { title: "אתגר 7 ימים",     who: "לכל מי שרוצה לצאת לדרך ולייצר תוכן שמביא לקוחות",              price: "₪197",          cta: "להתחיל ←", href: "/challenge",   icon: Zap },
  { title: "סדנה יום אחד",    who: "לכל מי שמייצר תוכן אבל לא רואה תוצאות",                        price: "₪1,080",        cta: "קבע יום ←",          href: "/workshop",    icon: Target },
  { title: "קורס דיגיטלי",    who: "לכל מי שרוצה ללמוד לעומק - לא רק לצלם אלא להבין",              price: "₪1,800",        cta: "לקורס ←",            href: "/course",      icon: GraduationCap },
  { title: "פגישת אסטרטגיה",  who: "לכל מי שרוצה לשבת עם הדר ולבנות אסטרטגיה מדויקת",            price: "₪4,000",        cta: "קבע פגישה ←",        href: "/strategy",    icon: Compass },
];

const ROW2_PRODUCTS = [
  { title: "יום צילום פרמיום",  who: "לעסקים שרוצים תוצאה מלאה: אסטרטגיה + הפקה + עריכה",           price: "₪14,000",        priceNote: "+ מע״מ",  cta: "לפרטים ←",      href: "/premium",     icon: Video, tag: "יום הפקה" },
  { title: "שותפות אסטרטגית",   who: "למשפיעניות וחברות שרוצות שותף לדרך - לא ספק שירות",           price: "₪10,000-30,000", priceNote: "/ חודש",  cta: "בדוק התאמה ←",  href: "/partnership", icon: Users, tag: "על בסיס מקום פנוי" },
];

const TESTIMONIALS = [
  {
    text: "הבנתי לראשונה למה הלקוחות שלי לא מבינים מה אני מוכר",
    name: "מיכל ל.",
    role: "מאמנת כושר",
  },
  {
    text: "אחרי פגישה אחת ידעתי בדיוק מה לומר ואיך",
    name: "רון ש.",
    role: "יועץ עסקי",
  },
  {
    text: "זה לא היה עוד יום צילום. זה היה שינוי בדרך שאני מסתכל על העסק שלי",
    name: "ענת מ.",
    role: "מעצבת גרפית",
  },
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const variant = parseVariant(cookieStore.get("ab_variant")?.value);
  const content = AB_CONTENT[variant];
  const userCount = await getUserCount();
  const displayCount = Math.max(userCount + 250, 3500);

  return (
    <>
      <PageTracker abVariant={variant} />

      <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "#080C14" }}>



        <main className="flex-1">

          {/* ══════════════════════════════════════════════════════
              1. HERO
          ══════════════════════════════════════════════════════ */}
          <section style={{ overflow: "hidden", background: "#0B1220" }}>

            {/* ── MOBILE: full-bleed overlay, thumb-zone optimized ── */}
            <div className="md:hidden" style={{ position: "relative", height: "100svh" }}>
              <Image
                src="/hadar1.png"
                alt="הדר דנן"
                fill
                priority
                style={{ objectFit: "cover", objectPosition: "center 10%" }}
              />
              {/* Bottom-to-top overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, #080C14 0%, rgba(8,12,20,0.95) 20%, rgba(8,12,20,0.85) 35%, rgba(8,12,20,0.6) 55%, rgba(8,12,20,0.3) 70%, transparent 85%)",
              }} />
              {/* Top fade - navbar blend */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)",
              }} />
              {/* Left side fade */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to right, #080C14 0%, rgba(8,12,20,0.6) 25%, transparent 55%)",
              }} />
              {/* Content anchored from 52svh */}
              <div style={{
                position: "absolute", top: "52svh", left: 0, right: 0,
                padding: "0 24px", direction: "rtl", textAlign: "right",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)",
                  borderRadius: 9999, padding: "5px 14px", marginBottom: 12,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                  <span style={{ color: "#C9964A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>
                    <span style={{ direction: "rtl" }}>שיטת <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
                  </span>
                </div>
                <h1 style={{ color: "#EDE9E1", fontWeight: 800, fontSize: "clamp(1.7rem, 4.5vw, 2rem)", lineHeight: 1.18, marginBottom: 12 }}>
                  {content.headline}
                </h1>
                <p style={{ color: "#9E9990", fontSize: "clamp(0.9rem, 2vw, 1rem)", lineHeight: 1.72, marginBottom: 16 }}>
                  {content.description}
                </p>
                <a href="/quiz" style={{
                  display: "block", textAlign: "center",
                  background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                  color: "#1A1206", fontWeight: 800, fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
                  borderRadius: 9999, padding: "14px", marginBottom: 14, textDecoration: "none",
                  width: "100%",
                }}>
                  {content.cta}
                </a>
                <p style={{ textAlign: "center", color: "#4A4540", fontSize: "0.8rem" }}>
                  +3,500 עסקים כבר מצאו את הבהירות שלהם
                </p>
              </div>
            </div>

            {/* ── DESKTOP: full-bleed overlay, seamless fade ─────── */}
            <div className="hidden md:block" style={{ position: "relative", minHeight: "100vh" }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: "-5%",
                height: "163%",
                width: "auto",
                display: "inline-block",
              }}>
                <Image
                  src="/hadar1.png"
                  alt="הדר דנן"
                  width={842}
                  height={1264}
                  priority
                  quality={90}
                  style={{
                    height: "100%",
                    width: "auto",
                    maxWidth: "none",
                    display: "block",
                    WebkitMaskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                    maskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                  }}
                />
              </div>
              {/* Top fade - navbar blend */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)",
              }} />
              {/* Text floats over right side */}
              <div style={{
                position: "absolute", top: "50%", right: 0,
                transform: "translateY(-50%)",
                width: "45%", padding: "0 72px 0 0",
                direction: "rtl", textAlign: "right",
              }}>

                {/* Tag pill */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)",
                  borderRadius: 9999, padding: "5px 14px", marginBottom: 22,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                  <span style={{ color: "#C9964A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>
                    <span style={{ direction: "rtl" }}>שיטת <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
                  </span>
                </div>

                {/* Headline */}
                <h1 style={{
                  color: "#EDE9E1", fontWeight: 800,
                  fontSize: "clamp(2rem, 2.6vw, 3rem)",
                  lineHeight: 1.2, marginBottom: 18,
                }}>
                  {content.headline}
                </h1>

                {/* Body */}
                <p style={{
                  color: "#9E9990", fontSize: "1rem",
                  lineHeight: 1.78, marginBottom: 36,
                }}>
                  {content.description}
                </p>

                {/* CTA */}
                <a href="/quiz" style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                  color: "#1A1206", fontWeight: 800, fontSize: "1.05rem",
                  borderRadius: 9999, padding: "16px 52px",
                  textDecoration: "none", marginBottom: 22,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 6px rgba(0,0,0,0.25), 0 10px 28px rgba(0,0,0,0.35), 0 0 40px rgba(201,150,74,0.15)",
                }}>
                  {content.cta}
                </a>

                {/* Social proof */}
                <p style={{ color: "#4A4540", fontSize: "0.82rem" }}>
                  +3,500 עסקים כבר מצאו את הבהירות שלהם
                </p>

              </div>
            </div>

          </section>

          {/* ══════════════════════════════════════════════════════
              2. STATS
          ══════════════════════════════════════════════════════ */}
          <StatsSection />

          {/* ══════════════════════════════════════════════════════
              3. PHILOSOPHY
          ══════════════════════════════════════════════════════ */}
          <section
            className="px-6 py-20 md:py-28"
            style={{ background: "#101520" }}
          >
            <div className="max-w-5xl mx-auto flex flex-col gap-14">
              <div className="text-center flex flex-col gap-3">
                <h2 className="text-3xl md:text-4xl font-black" style={{ color: "#EDE9E1" }}>
                  הגישה שלנו
                </h2>
                <p className="text-base font-semibold" style={{ color: "#C9964A" }}>
                  כי אפשר למכור רק את מה שאתה באמת - זה הבסיס של <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span>
                </p>
              </div>

              <PhilosophySection />

              <div
                className="rounded-3xl px-8 py-7 text-center"
                style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.12)" }}
              >
                <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: "#EDE9E1" }}>
                  ״אנחנו לא מוכרים סרטונים.<br className="hidden md:block" />
                  אנחנו מוכרים את הבהירות שגורמת לתוכן לעבוד.״
                </p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              4. PRODUCTS - LADDER + NETFLIX
          ══════════════════════════════════════════════════════ */}
          <ProductsSection />

          {/* ══════════════════════════════════════════════════════
              5. BINGE CTA
          ══════════════════════════════════════════════════════ */}
          <section style={{ background: "#080C14", padding: "40px 24px" }}>
            <div
              className="rounded-2xl"
              style={{
                maxWidth: 480,
                margin: "0 auto",
                background: "#141820",
                border: "1px solid #2C323E",
                padding: "32px 28px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Image src="/beegood_logo.png" alt="Bee Good" width={36} height={28} />
              <p style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
                background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontFamily: "var(--font-assistant), Assistant, sans-serif",
              }}>
                בינג׳
              </p>
              <p style={{ margin: 0, fontSize: 15, color: "#9E9990", fontFamily: "var(--font-assistant), Assistant, sans-serif" }}>
                כל התכנים של הדר במקום אחד
              </p>
              <a
                href="/binge"
                style={{
                  marginTop: 4,
                  display: "inline-block",
                  background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                  color: "#080C14",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "10px 28px",
                  borderRadius: 24,
                  textDecoration: "none",
                  fontFamily: "var(--font-assistant), Assistant, sans-serif",
                }}
              >
                לכל התכנים ←
              </a>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              6. SOCIAL PROOF
          ══════════════════════════════════════════════════════ */}
          <section className="px-6 py-20 md:py-28" style={{ background: "#080C14" }}>
            <div className="max-w-4xl mx-auto flex flex-col gap-12">

              <div className="text-center flex flex-col gap-3">
                <div className="flex justify-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="#C9964A" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <h2 className="text-3xl md:text-4xl font-black" style={{ color: "#EDE9E1" }}>
                  מעל {displayCount.toLocaleString("he-IL")} עסקים כבר מצאו<br className="hidden md:block" /> את הבהירות שלהם עם הדר
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TESTIMONIALS.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-2xl p-7 flex flex-col gap-5"
                    style={{ background: "linear-gradient(145deg,#111928,#0D1520)", border: "1px solid #1E2838" }}
                  >
                    <p
                      className="text-base leading-relaxed flex-1 font-medium"
                      style={{ color: "#EDE9E1" }}
                    >
                      ״{t.text}״
                    </p>
                    <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #1E2838" }}>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: "rgba(201,150,74,0.12)", color: "#C9964A", border: "1px solid rgba(201,150,74,0.25)" }}
                      >
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#EDE9E1" }}>{t.name}</p>
                        <p className="text-xs" style={{ color: "#6B7080" }}>{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

        </main>

        {/* ══════════════════════════════════════════════════════
            7. FOOTER
        ══════════════════════════════════════════════════════ */}
        <footer className="px-6 py-12" style={{ background: "#101520" }}>
          <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Credit CTA */}
            <div className="text-center">
              <a
                href="/my"
                className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
                style={{ color: "#C9964A" }}
              >
                יש לך זיכוי? בדוק באזור האישי שלך ←
              </a>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "#9E9990" }}>
              {[
                { label: "בית",       href: "/" },
                { label: "הדרכה",     href: "/training" },
                { label: "אתגר",      href: "/challenge" },
                { label: "סדנה",      href: "/workshop" },
                { label: "קורס",      href: "/course" },
                { label: "אסטרטגיה",  href: "/strategy" },
                { label: "הכוורת",    href: "/hive" },
                { label: "פרימיום",   href: "/premium" },
                { label: "שותפות",    href: "/partnership" },
                { label: "אזור אישי", href: "/my" },
              ].map((link) => (
                <a key={link.href} href={link.href} className="hover:text-white transition" style={{ color: "#C9964A" }}>
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Legal */}
            <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "rgba(158,153,144,0.5)" }}>
              <div className="flex gap-4">
                <a href="/privacy" className="hover:text-white transition">מדיניות פרטיות</a>
                <a href="/terms" className="hover:text-white transition">תנאי שימוש</a>
                <a href="/accessibility" className="hover:text-white transition">הצהרת נגישות</a>
              </div>
              <p className="font-medium" style={{ color: "rgba(158,153,144,0.6)" }}>אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span></p>
              <p>© {new Date().getFullYear()} הדר דנן בע״מ · כל הזכויות שמורות</p>
              <p className="mt-1">לביטול הסכמה:{" "}
                <a href="mailto:hadar@beegood.online" className="hover:text-white transition">hadar@beegood.online</a>
              </p>
            </div>

          </div>
        </footer>

      </div>
    </>
  );
}
