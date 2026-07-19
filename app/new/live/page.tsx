import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { TrackedCta } from "../TrackedCta";
import { SignalCanvas } from "./SignalCanvas";
import { LiveClient } from "./LiveClient";

/**
 * /new/live — mobile-first marketing page built on the winning "קו האות" concept,
 * rebuilt per the expert-panel spec: the signal is a CONTAINED, time-driven hero
 * (alive on first paint, never scroll-gated), copy sits on solid panels, and the
 * page actually functions — dual CTAs + sticky bottom bar. Isolated. noindex.
 */
export const metadata: Metadata = {
  title: "האות החי — הדר דנן",
  robots: { index: false, follow: false },
  alternates: {},
};

const StatsSection     = dynamic(() => import("@/components/landing/StatsSection").then((m) => ({ default: m.StatsSection })));
const SocialProofStrip = dynamic(() => import("@/components/SocialProofStrip"));

const PAINS = ["שאלת את ה-AI.", "חשבת להעתיק מהמתחרים.", "כבר לא יודע איזה תוכן להעלות."];
const BEATS = [
  { t: "רעש", on: false }, { t: "דפוסים", on: false }, { t: "סיגנל", on: true }, { t: "צמיחה", on: true },
];
const CHIPS = [
  { t: "אסטרטגיה", d: "על מה להתמקד" },
  { t: "תוכן", d: "מה להעלות" },
  { t: "דאטה", d: "מה עובד" },
];
const VALUES = ["האדם במרכז", "נבנה להחזיק", "מדע ונשמה"];

export default function LivePage() {
  return (
    <div dir="rtl" className="live-root">
      <style>{LIVE_CSS}</style>

      <main>
        {/* ═══ HERO — contained living signal + copy + CTAs (above the fold) ═══ */}
        <section className="live-hero">
          <div className="live-eyebrow"><span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span> · הדרך</div>
          <SignalCanvas trigger="load" className="live-hero-band" />
          <h1 className="live-h1">
            מתחת לרעש, יש משהו עקבי.<br />
            <span className="live-gd">משהו שרק אתה יכול להביא.</span>
          </h1>
          <p className="live-sub">אנחנו מוצאים את האות שאי אפשר להעתיק — והופכים אותו לעסק שגדל, ללקוחות הנכונים ולתחושה טובה בעשייה.</p>
          <div className="live-cta-col">
            <TrackedCta dest="kriah" placement="hero" className="live-gold live-cta">לגלות את האות שלי — בחינם</TrackedCta>
            <TrackedCta dest="strategy" placement="hero" className="live-out live-cta">לעבוד ישירות עם הדר</TrackedCta>
            <div className="live-price">פגישת אסטרטגיה אישית החל מ־4,000 ₪</div>
            <div className="live-trust">קריאה אישית · ללא עלות · ללא כרטיס אשראי</div>
          </div>
          <span id="live-hero-sentinel" aria-hidden />
        </section>

        {/* ═══ TRUST ═══ */}
        <div className="live-rule" aria-hidden><span /></div>
        <StatsSection />
        <SocialProofStrip />

        {/* ═══ RECOGNITION ═══ */}
        <section className="live-sec live-recog">
          <div className="live-eyebrow2" data-reveal>הכרה</div>
          <h2 className="live-h2" data-reveal>עדיין לא בטוח <span className="live-gd">מה הצעד הבא?</span></h2>
          <p className="live-lede" data-reveal>ניסית כבר הרבה. אולי מה שחסר הוא בסיס אחד ברור — מתחת לכל הרעש.</p>
          <div className="live-pains">
            {PAINS.map((p, i) => (
              <div className="live-pain" data-reveal style={{ transitionDelay: `${i * 90}ms` }} key={p}>{p}</div>
            ))}
          </div>
        </section>

        {/* ═══ NOISE → SIGNAL (the metaphor's home) ═══ */}
        <section className="live-sec live-journey">
          <div className="live-eyebrow2" data-reveal>מרעש לסיגנל</div>
          <div className="live-beats" data-reveal>
            {BEATS.map((b, i) => (
              <span className="live-beat-wrap" key={b.t}>
                <span className={`live-beat${b.on ? " on" : ""}`}>{b.t}</span>
                {i < BEATS.length - 1 && <span className="live-beat-sep" aria-hidden />}
              </span>
            ))}
          </div>
          <SignalCanvas trigger="inview" className="live-journey-band" />
          <p className="live-journey-line" data-reveal>הרעש הוא של כולם. <span className="live-gd">האות הוא רק שלך.</span></p>
        </section>

        {/* ═══ SYSTEM ═══ */}
        <section className="live-sec live-sys">
          <div className="live-eyebrow2" data-reveal>בהירות הופכת למערכת</div>
          <h2 className="live-h2" data-reveal>הסיגנל שלך <span className="live-gd">מניע הכל.</span></h2>
          <p className="live-lede" data-reveal>אות אחד ברור. כל מה שנבנה ממנו מיושר לאותו כיוון — לא עוד רעיונות מפוזרים.</p>
          <div className="live-chips" data-reveal>
            {CHIPS.map((c) => (
              <div className="live-chip" key={c.t}><b>{c.t}</b><span>{c.d}</span></div>
            ))}
          </div>
        </section>

        {/* ═══ PRINCIPLES + punch ═══ */}
        <section className="live-sec live-princ">
          <div className="live-values" data-reveal>
            {VALUES.map((v, i) => (
              <span className="live-val-wrap" key={v}><span>{v}</span>{i < VALUES.length - 1 && <i aria-hidden>·</i>}</span>
            ))}
          </div>
          <p className="live-punch" data-reveal>אנחנו לא מוכרים סרטונים.<br /><span className="live-gd">אנחנו בונים את הבהירות שגורמת לתוכן לעבוד.</span></p>
        </section>

        {/* ═══ FINAL dual CTA ═══ */}
        <section className="live-sec live-final">
          <h2 className="live-h2" data-reveal>איך נכון לך להתחיל?</h2>
          <div className="live-final-col" data-reveal>
            <TrackedCta dest="kriah" placement="final_cta" className="live-gold live-cta">לגלות את האות שלי — בחינם</TrackedCta>
            <TrackedCta dest="strategy" placement="final_cta" className="live-out live-cta">לעבוד ישירות עם הדר</TrackedCta>
            <div className="live-price">פגישת אסטרטגיה אישית החל מ־4,000 ₪</div>
          </div>
        </section>
      </main>

      {/* Footer — mirrors the existing homepage footer */}
      <footer className="px-6 py-12" style={{ background: "#101520", paddingBottom: "96px" }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "#AAB0BD" }}>
            {[
              { label: "בית", href: "/" },
              { label: "הדרכה", href: "/training" },
              { label: "אתגר", href: "/challenge" },
              { label: "כוורת האות", href: "/signal-hive" },
              { label: "אסטרטגיה", href: "/strategy" },
              { label: "פרימיום", href: "/premium" },
              { label: "אזור אישי", href: "/my" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition" style={{ color: "#E8B94A" }}>{link.label}</a>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "#AAB0BD" }}>
            <p className="font-medium">אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></p>
            <p>© 2026 הדר דנן בע״מ · כל הזכויות שמורות</p>
          </div>
        </div>
      </footer>

      <LiveClient />
    </div>
  );
}

const LIVE_CSS = `
.live-root{--bg:#080C14;--bg2:#0D1018;--card:#141820;--border:#2C323E;--line:#232936;--gold:#C9964A;--gold-l:#E8B94A;--fg:#EDE9E1;--muted:#AAB0BD;background:var(--bg);color:var(--fg);overflow-x:hidden}
.live-root *{box-sizing:border-box}
.live-gd{color:var(--gold-l)}

/* reveal (opt-in via .js-reveal so text is visible if JS fails) */
.live-root [data-reveal]{opacity:1}
.live-root.js-reveal [data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .7s ease,transform .7s ease}
.live-root.js-reveal [data-reveal].in{opacity:1;transform:none}

/* buttons */
.live-cta{width:100%;padding:15px 22px;font-size:16px;border-radius:9999px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.2;text-decoration:none;min-height:52px}
.live-gold{background:linear-gradient(180deg,#f4d27a 0%,#e8b942 52%,#d59b1f 100%);color:#2a1d05;font-weight:800;box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 14px 30px -12px rgba(214,155,31,.55)}
.live-out{background:transparent;color:var(--gold-l);font-weight:700;border:1px solid rgba(201,150,74,.55)}
.live-cta-col,.live-final-col{display:flex;flex-direction:column;gap:11px;max-width:440px;margin:0 auto;width:100%}
.live-price{font-size:12.5px;color:var(--muted);text-align:center;margin-top:2px}
.live-trust{font-size:11.5px;color:var(--muted);opacity:.8;text-align:center}

/* hero */
.live-hero{max-width:620px;margin:0 auto;padding:26px 20px 40px;text-align:center}
.live-eyebrow{font-size:11px;letter-spacing:2px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:16px}
.sig-band{position:relative;width:100%;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:#080C14}
.sig-canvas{display:block;width:100%}
.live-hero-band{height:clamp(200px,42svh,360px);margin-bottom:22px}
.live-h1{font-size:clamp(25px,6.4vw,40px);font-weight:600;line-height:1.24;letter-spacing:-.01em;margin:0 0 14px;text-wrap:balance}
.live-sub{color:var(--muted);font-size:clamp(14.5px,2.2vw,16px);line-height:1.7;margin:0 auto 24px;max-width:42ch}

/* thin gold signal divider */
.live-rule{display:flex;justify-content:center;padding:8px 0 0}
.live-rule span{display:block;width:min(560px,82%);height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:.5}

/* generic section */
.live-sec{max-width:640px;margin:0 auto;padding:64px 20px}
.live-eyebrow2{font-size:11px;letter-spacing:3px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:14px;text-align:center}
.live-h2{font-size:clamp(22px,4.4vw,30px);font-weight:700;line-height:1.3;text-align:center;margin:0 0 14px;text-wrap:balance}
.live-lede{color:var(--muted);font-size:15px;line-height:1.7;text-align:center;margin:0 auto;max-width:44ch}

/* recognition */
.live-pains{display:flex;flex-direction:column;gap:12px;margin-top:30px}
.live-pain{border:1px solid var(--border);background:linear-gradient(180deg,var(--card),#0F131C);border-radius:14px;padding:18px 20px;font-size:15.5px;font-weight:600;text-align:right;position:relative;padding-right:44px}
.live-pain::before{content:"";position:absolute;right:20px;top:50%;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 10px 1px rgba(232,185,74,.55)}

/* journey */
.live-beats{display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:22px;flex-wrap:wrap}
.live-beat-wrap{display:inline-flex;align-items:center}
.live-beat{font-size:clamp(12px,3.2vw,14px);letter-spacing:2px;font-weight:700;color:var(--muted);text-transform:uppercase}
.live-beat.on{color:var(--gold-l)}
.live-beat-sep{width:clamp(16px,6vw,34px);height:1px;background:linear-gradient(90deg,rgba(201,150,74,.15),rgba(201,150,74,.6),rgba(201,150,74,.15));margin:0 8px}
.live-journey-band{height:clamp(150px,26svh,240px)}
.live-journey-line{text-align:center;font-size:clamp(18px,3.4vw,24px);font-weight:600;line-height:1.4;margin:24px auto 0;max-width:30ch}

/* system */
.live-chips{display:flex;flex-direction:column;gap:12px;margin-top:28px}
.live-chip{display:flex;align-items:baseline;justify-content:space-between;gap:14px;border:1px solid var(--border);background:var(--card);border-radius:14px;padding:16px 20px;text-align:right}
.live-chip b{font-size:16px;color:var(--fg)}
.live-chip span{font-size:13px;color:var(--muted)}

/* principles */
.live-values{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:26px}
.live-val-wrap{display:inline-flex;align-items:center;gap:14px}
.live-values i{color:var(--gold);font-style:normal}
.live-punch{text-align:center;font-size:clamp(19px,3.6vw,26px);font-weight:600;line-height:1.5;margin:0 auto;max-width:34ch}

/* final */
.live-final{padding-top:56px;padding-bottom:72px}
.live-final .live-h2{margin-bottom:24px}

/* sticky bottom CTA */
.live-sticky{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;padding:12px 16px calc(12px + env(safe-area-inset-bottom)) 84px;background:linear-gradient(180deg,rgba(8,12,20,0),rgba(8,12,20,.94) 30%);transform:translateY(130%);transition:transform .35s cubic-bezier(.2,.7,.2,1);pointer-events:none}
.live-sticky.show{transform:translateY(0);pointer-events:auto}
.live-sticky-btn{flex:1;min-height:52px;padding:14px 16px;font-size:15.5px;font-weight:800;border-radius:9999px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.15;text-decoration:none}

@media(min-width:760px){
  .live-hero{padding:36px 22px 56px}
  .live-cta-col,.live-final-col{flex-direction:column}
  .live-sticky{display:none}
}
@media(prefers-reduced-motion:reduce){
  .live-root.js-reveal [data-reveal]{opacity:1;transform:none;transition:none}
}
`;
