import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import { TrackedCta } from "./TrackedCta";
import { PhilosophySection } from "@/components/landing/PhilosophySection";

// Reused ORIGINAL homepage elements (rendered as-is; their behavior is not
// changed for any other page). This restores the exact existing design.
const StatsSection     = dynamic(() => import("@/components/landing/StatsSection").then(m => ({ default: m.StatsSection })));
const SocialProofStrip = dynamic(() => import("@/components/SocialProofStrip"));

/**
 * /new — ISOLATED experimental homepage (two-doors concept).
 * Restores the ORIGINAL homepage design for every reused element: the hero
 * treatment of Hadar's photo (full-bleed + mask fade, mobile + desktop), the
 * gold button style, and the real StatsSection / SocialProofStrip / Philosophy
 * components. Only the layout intent (two doors) is new. Does not touch the
 * existing homepage, /kriah, /strategy, or any shared behavior. noindex.
 */
export const metadata: Metadata = {
  title: "הדר דנן",
  robots: { index: false, follow: false },
  alternates: {},
};

const TESTIMONIALS = [
  { text: "הצלחתם להפוך את הנקודה שהכי קשה לי בעסק לנקודת חוזקה, ואני אפילו נהנה מזה עכשיו. אין עליכם, תודה ענקית.", name: "רועי מנדלמן" },
  { text: "אחרי אכזבות מחברות אחרות, סוף סוף מצאתי צוות מקצועי וקשוב. הם לקחו את העסק שלי כמה צעדים קדימה עם תוכן מדויק שהביא לי הרבה פניות.", name: "גל מסס" },
];

const HEADLINE = "אם כולם יכולים להגיד את מה שאתה אומר,\nלמה שיבחרו דווקא בך?";
const LEDE = "מצא את המסר שאי אפשר להעתיק, והפוך אותו לתוכן, למותג וללקוחות.";

export default function NewHome() {
  return (
    <div dir="rtl" className="nh-root">
      <style>{NH_CSS}</style>

      {/* Top banner (global nav) + footer are the site's originals — restored
          per Alon. Nav comes from the global layout (LayoutShell no longer hides
          /new); the footer below mirrors the existing homepage footer. */}

      <main>
        {/* ══ HERO — original treatment restored ══ */}
        <section style={{ overflow: "hidden", background: "#0B1220" }}>

          {/* MOBILE: full-bleed photo, bottom-anchored content (original design) */}
          <div className="md:hidden" style={{ position: "relative", height: "88svh" }}>
            <Image src="/hadar1.jpg" alt="הדר דנן" fill priority sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "center 10%" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080C14 0%, rgba(8,12,20,0.95) 22%, rgba(8,12,20,0.85) 38%, rgba(8,12,20,0.6) 56%, rgba(8,12,20,0.3) 70%, transparent 85%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #080C14 0%, rgba(8,12,20,0.6) 25%, transparent 55%)" }} />
            <div style={{ position: "absolute", bottom: "40px", left: 0, right: 0, padding: "0 24px", direction: "rtl", textAlign: "right" }}>
              <div className="nh-eyebrow"><span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span> · הדרך</div>
              <h1 style={{ color: "#EDE9E1", fontWeight: 900, fontSize: "clamp(2.1rem, 8vw, 3rem)", lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 12, whiteSpace: "pre-line" }}>{HEADLINE}</h1>
              <p style={{ color: "#AAB0BD", fontSize: "clamp(0.95rem, 2.2vw, 1.05rem)", lineHeight: 1.65, marginBottom: 16 }}>{LEDE}</p>
              <TrackedCta dest="kriah" placement="hero" className="nh-gold nh-gold-hero" style={{ width: "100%", marginBottom: 10 }}>לגלות את ה־TrueSignal שלי — בחינם</TrackedCta>
              <TrackedCta dest="strategy" placement="hero" className="nh-out nh-out-hero" style={{ width: "100%" }}>לעבוד ישירות עם הדר</TrackedCta>
              <div className="nh-priceline" style={{ textAlign: "center", marginTop: 7 }}>פגישת אסטרטגיה אישית החל מ־4,000 ₪</div>
              <div className="nh-trust">קריאה אישית · ללא עלות · ללא כרטיס אשראי</div>
            </div>
          </div>

          {/* DESKTOP: full-bleed photo left with mask fade, text panel right (original design) */}
          <div className="hidden md:block" style={{ position: "relative", minHeight: "100vh" }}>
            <div style={{ position: "absolute", top: 0, left: "-5%", height: "163%", width: "auto", display: "inline-block" }}>
              <Image src="/hadar1.jpg" alt="הדר דנן" width={842} height={1264} priority sizes="50vw" quality={80}
                style={{ height: "100%", width: "auto", maxWidth: "none", display: "block",
                  WebkitMaskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                  maskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)" }} />
            <div style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", width: "46%", padding: "0 72px 0 0", direction: "rtl", textAlign: "right" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)", borderRadius: 9999, padding: "5px 14px", marginBottom: 22 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                <span style={{ color: "#E8B94A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>הדרך של <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
              </div>
              <h1 style={{ color: "#EDE9E1", fontWeight: 800, fontSize: "clamp(2rem, 2.6vw, 3rem)", lineHeight: 1.2, marginBottom: 18, whiteSpace: "pre-line" }}>{HEADLINE}</h1>
              <p style={{ color: "#AAB0BD", fontSize: "1rem", lineHeight: 1.78, marginBottom: 30, maxWidth: "42ch" }}>{LEDE}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
                <TrackedCta dest="kriah" placement="hero" className="nh-gold nh-gold-hero">לגלות את ה־TrueSignal שלי — בחינם</TrackedCta>
                <TrackedCta dest="strategy" placement="hero" className="nh-out nh-out-hero">לעבוד ישירות עם הדר</TrackedCta>
                <div className="nh-priceline" style={{ textAlign: "center" }}>פגישת אסטרטגיה אישית החל מ־4,000 ₪</div>
              </div>
              <div className="nh-trust">קריאה אישית · ללא עלות · ללא כרטיס אשראי</div>
            </div>
          </div>
        </section>

        {/* ══ Proof — reused original components ══ */}
        <StatsSection />
        <SocialProofStrip />

        {/* ══ Two paths ══ */}
        <section className="nh-section">
          <h2 className="nh-h2">שתי דרכים. אותה מטרה: מסר שאנשים מזהים וזוכרים.</h2>
          <div className="nh-cards">
            <article className="nh-card">
              <h3 className="nh-card-t">אני צריך להבין מה האות שלי</h3>
              <p className="nh-card-d">מתחילים בכמה שאלות קצרות על העסק, ממשיכים לקריאה האישית ומגלים מה אנשים מקבלים דווקא מכם.</p>
              <p className="nh-card-note">האבחון הקיים נשאר בדיוק כפי שהוא.</p>
              <TrackedCta dest="kriah" placement="path_card" className="nh-out nh-card-cta">לקריאת האות — ללא עלות</TrackedCta>
            </article>
            <article className="nh-card nh-card-gold">
              <h3 className="nh-card-t">אני כבר רוצה לעבוד עם הדר</h3>
              <p className="nh-card-d">למי שכבר רוצה להפוך ניסיון, מסר ורעיונות לאסטרטגיה ולנכסים שאפשר לצאת איתם החוצה.</p>
              <p className="nh-card-note nh-gold-note">פגישת אסטרטגיה אישית: 4,000 ₪</p>
              <TrackedCta dest="strategy" placement="path_card" className="nh-gold nh-card-cta">לראות איך עובדים עם הדר</TrackedCta>
            </article>
          </div>
        </section>

        {/* ══ Approach — reused original PhilosophySection ══ */}
        <section className="nh-approach-sec">
          <div className="nh-approach-head">
            <h2 className="nh-h2" style={{ marginBottom: 8 }}>הגישה שלנו</h2>
            <p className="nh-approach-lede">כי אפשר למכור רק את מה שאתם באמת — זה הבסיס של <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>.</p>
          </div>
          <PhilosophySection />
          <p className="nh-approach-punch">אנחנו לא מוכרים סרטונים.<br />אנחנו בונים את הבהירות שגורמת לתוכן לעבוד.</p>
        </section>

        {/* ══ Testimonials ══ */}
        <section className="nh-section">
          <div className="nh-tgrid">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="nh-testi">
                <div className="nh-stars">★★★★★</div>
                <blockquote className="nh-testi-q">{t.text}</blockquote>
                <figcaption className="nh-testi-n">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ══ Final CTA ══ */}
        <section className="nh-section nh-final">
          <h2 className="nh-h2">איך נכון לכם להתקדם עכשיו?</h2>
          <div className="nh-final-grid">
            <div className="nh-final-opt">
              <div className="nh-final-lbl">אני רוצה לגלות את האות שלי</div>
              <TrackedCta dest="kriah" placement="final_cta" className="nh-gold nh-final-cta">להתחיל את הקריאה — חינם</TrackedCta>
            </div>
            <div className="nh-final-opt">
              <div className="nh-final-lbl">אני רוצה לעבוד ישירות עם הדר</div>
              <TrackedCta dest="strategy" placement="final_cta" className="nh-out nh-final-cta">לראות את פגישת האסטרטגיה</TrackedCta>
              <div className="nh-priceline" style={{ textAlign: "center" }}>4,000 ₪</div>
            </div>
          </div>
        </section>
      </main>

      {/* ══ Footer — mirrors the existing homepage footer ══ */}
      <footer className="px-6 py-12" style={{ background: "#101520", paddingBottom: "48px" }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "#AAB0BD" }}>
            {[
              { label: "בית",        href: "/" },
              { label: "הדרכה",      href: "/training" },
              { label: "אתגר",       href: "/challenge" },
              { label: "כוורת האות", href: "/signal-hive" },
              { label: "סדנה",       href: "/workshop" },
              { label: "אסטרטגיה",   href: "/strategy" },
              { label: "פרימיום",    href: "/premium" },
              { label: "שותפות",     href: "/partnership" },
              { label: "אזור אישי",  href: "/my" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition" style={{ color: "#E8B94A" }}>{link.label}</a>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "#AAB0BD" }}>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-white transition">מדיניות פרטיות</a>
              <a href="/terms" className="hover:text-white transition">תנאי שימוש</a>
              <a href="/accessibility" className="hover:text-white transition">הצהרת נגישות</a>
            </div>
            <p className="font-medium">אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></p>
            <p>© 2026 הדר דנן בע״מ | ח.פ. 516791555 · כל הזכויות שמורות</p>
            <p>החילזון 5, רמת גן | 053-9566961</p>
            <p className="mt-1"><a href="/unsubscribe" className="hover:text-white transition">לביטול הסכמה לדיוור</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Scoped under .nh-* — used ONLY on /new. Gold button matches the original homepage exactly.
const NH_CSS = `
.nh-root{--bg:#080C14;--bg2:#0D1018;--card:#141820;--soft:#1D2430;--border:#2C323E;--line:#232936;--gold:#C9964A;--gold-l:#E8B94A;--fg:#EDE9E1;--muted:#AAB0BD;background:var(--bg);color:var(--fg);min-height:100vh;overflow-x:hidden}
.nh-root *{box-sizing:border-box}
.nh-gold{background:linear-gradient(180deg,#f4d27a 0%,#e8b942 52%,#d59b1f 100%);color:#2a1d05;font-weight:800;text-decoration:none;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;line-height:1.2;box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 -10px 22px rgba(157,110,12,.35) inset,0 18px 34px -12px rgba(214,155,31,.55),0 6px 14px -6px rgba(0,0,0,.55)}
.nh-gold-sm{padding:9px 18px;font-size:14px}
.nh-gold-hero{padding:16px 40px;font-size:1.05rem}
.nh-out{background:transparent;color:var(--gold-l);font-weight:700;text-decoration:none;border:1px solid rgba(201,150,74,.55);border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;line-height:1.2}
.nh-out-hero{padding:15px 40px;font-size:1rem}

.nh-header{position:sticky;top:0;z-index:50;background:rgba(8,12,20,.86);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nh-hwrap{max-width:1200px;margin:0 auto;height:64px;padding:0 22px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nh-logo{font-size:19px;font-weight:800;color:var(--fg);text-decoration:none;letter-spacing:-.3px;white-space:nowrap}
.nh-nav{display:flex;gap:22px}
.nh-navlink{color:var(--muted);font-size:14.5px;text-decoration:none}
.nh-navlink:hover{color:var(--fg)}
.nh-hcta{display:flex;align-items:center;gap:16px}
.nh-quiet{color:var(--muted);font-size:14px;text-decoration:none}
.nh-quiet:hover{color:var(--fg)}

.nh-eyebrow{font-size:11px;letter-spacing:2px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:12px}
.nh-priceline{font-size:12.5px;color:var(--muted)}
.nh-trust{margin-top:16px;font-size:12px;color:var(--muted);opacity:.85;text-align:center}

.nh-section{max-width:1080px;margin:0 auto;padding:64px 22px}
.nh-h2{font-size:clamp(22px,3.2vw,30px);font-weight:800;line-height:1.3;letter-spacing:-.3px;text-align:center;margin:0 0 30px;text-wrap:balance;color:var(--fg)}

.nh-cards{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.nh-card{border:1px solid var(--border);background:var(--card);border-radius:16px;padding:26px 24px;display:flex;flex-direction:column}
.nh-card-gold{border-color:rgba(201,150,74,.55);background:linear-gradient(160deg,rgba(201,150,74,.08),var(--card) 55%)}
.nh-card-t{font-size:20px;font-weight:800;margin:0 0 10px;color:var(--fg)}
.nh-card-d{font-size:14.5px;line-height:1.7;color:var(--muted);margin:0 0 14px;flex:1}
.nh-card-note{font-size:13px;color:var(--fg);margin:0 0 18px;opacity:.9}
.nh-gold-note{color:var(--gold-l);font-weight:700;opacity:1}
.nh-card-cta{width:100%;padding:13px;font-size:15px}

.nh-approach-sec{background:#101520;padding:72px 22px}
.nh-approach-head{max-width:900px;margin:0 auto 8px;text-align:center}
.nh-approach-lede{font-size:16px;color:var(--gold-l);font-weight:600;max-width:60ch;margin:0 auto 8px;line-height:1.7}
.nh-approach-punch{font-size:clamp(18px,2.6vw,24px);font-weight:800;line-height:1.5;margin:34px auto 0;color:var(--fg);text-align:center;max-width:40ch}

.nh-tgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.nh-testi{border:1px solid var(--border);background:var(--card);border-radius:14px;padding:24px;margin:0}
.nh-stars{color:var(--gold-l);font-size:15px;letter-spacing:2px;margin-bottom:12px}
.nh-testi-q{font-size:15.5px;line-height:1.75;margin:0 0 14px;color:var(--fg)}
.nh-testi-n{font-size:13.5px;font-weight:700;color:var(--muted)}

.nh-final-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:760px;margin:0 auto}
.nh-final-opt{border:1px solid var(--border);background:var(--card);border-radius:16px;padding:24px;text-align:center;display:flex;flex-direction:column;gap:14px}
.nh-final-lbl{font-size:16px;font-weight:700;color:var(--fg)}
.nh-final-cta{width:100%;padding:13px;font-size:15px}

.nh-footer{border-top:1px solid var(--line);background:var(--bg2);padding:34px 22px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}
.nh-footer-brand{font-size:17px;font-weight:800;color:var(--fg)}
.nh-footer-micro{font-size:12.5px;color:var(--muted)}
.nh-footer-links{display:flex;gap:9px;flex-wrap:wrap;justify-content:center;font-size:12.5px}
.nh-footer-links a{color:var(--gold-l);text-decoration:none}
.nh-footer-links span{color:var(--border)}

@media(max-width:900px){
  .nh-nav{display:none}
  .nh-cards,.nh-tgrid,.nh-final-grid{grid-template-columns:1fr}
}
@media(max-width:430px){
  .nh-hwrap{padding:0 16px;gap:10px}
  .nh-logo{font-size:17px}
  .nh-section{padding:48px 18px}
  .nh-approach-sec{padding:56px 18px}
}
`;
