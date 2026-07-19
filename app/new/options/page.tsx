import type { Metadata } from "next";
import Image from "next/image";
import { Copy, HelpCircle, Sparkles, LayoutGrid, Share2, Activity, TrendingUp, Target, PenLine, BarChart3, Heart, Leaf, Flower2, ChevronDown } from "lucide-react";

/**
 * /new/options — ISOLATED design-direction lab. Renders the four "lower"
 * sections (recognition / journey / system / principles) in THREE distinct
 * visual directions so Alon can compare in the browser and pick one.
 * Touches nothing else. noindex.
 */
export const metadata: Metadata = {
  title: "כיווני עיצוב — /new",
  robots: { index: false, follow: false },
  alternates: {},
};

// Shared content (same copy across all directions — only the design changes).
const RECOG = [
  { Icon: Sparkles,   t: "שאלת את ה-AI." },
  { Icon: Copy,       t: "חשבת להעתיק מהמתחרים." },
  { Icon: HelpCircle, t: "כבר לא יודע איזה תוכן להעלות." },
];
const STEPS = [
  { Icon: LayoutGrid, t: "רעש",    d: "הכל. בכל מקום." },
  { Icon: Share2,     t: "דפוסים", d: "מזהים את מה שחוזר." },
  { Icon: Activity,   t: "סיגנל",  d: "בהירות על מה שרק אתה." },
  { Icon: TrendingUp, t: "צמיחה",  d: "אתה צומח. אתה מוביל." },
];
const KIDS = [
  { Icon: Target,    t: "אסטרטגיה", d: "על מה להתמקד. מה חשוב עכשיו." },
  { Icon: PenLine,   t: "תוכן",     d: "איך הסיגנל הופך לתקשורת." },
  { Icon: BarChart3, t: "דאטה",     d: "מה עובד. מה מצטבר." },
];
const PRINC = [
  { Icon: Heart,   t: "האדם במרכז", d: "אנחנו מאמינים באנשים. הטכנולוגיה כאן כדי לשרת אותם, לא להפך." },
  { Icon: Leaf,    t: "נבנה להחזיק", d: "בהירות היום, צמיחה מחר. השפעה שנשארת, לא טרנד שחולף." },
  { Icon: Flower2, t: "מדע ונשמה",   d: "דאטה ופסיכולוגיה. אסטרטגיה ואינטואיציה. ביחד, לא בנפרד." },
];

export default function OptionsLab() {
  return (
    <div dir="rtl" className="opt-root">
      <style>{OPT_CSS}</style>

      <header className="opt-hero">
        <div className="opt-eyebrow">מעבדת עיצוב · /new</div>
        <h1>שלושה כיוונים לאותם ארבעה קטעים</h1>
        <p>אותו תוכן, שלוש שפות עיצוב. גלול, השווה, ותגיד לי מה הכי מדבר אליך.</p>
      </header>

      {/* ══════════ DIRECTION 1 — HONEYCOMB ══════════ */}
      <DirLabel n="1" name="חלת-דבש" desc="משושים · קו-אות זורם · מובנה ומאוזן" />
      <DirA />

      {/* ══════════ DIRECTION 2 — EDITORIAL LUMINOUS ══════════ */}
      <DirLabel n="2" name="עריכתי-זוהר" desc="טיפוגרפי · טבעות דקות · קווי-אור · יוקרתי ומרווח" />
      <DirB />

      {/* ══════════ DIRECTION 3 — IMMERSIVE HONEYCOMB ══════════ */}
      <DirLabel n="3" name="חלת-דבש עוטף" desc="רקע חלת-דבש · מילויי זהב חמים · מותג רווי" />
      <DirC />

      <footer className="opt-foot">שלושת הכיוונים מבודדים ל-/new/options בלבד · noindex</footer>
    </div>
  );
}

function DirLabel({ n, name, desc }: { n: string; name: string; desc: string }) {
  return (
    <div className="opt-divider">
      <div className="opt-divider-in">
        <span className="opt-badge">כיוון {n}</span>
        <span className="opt-dname">{name}</span>
        <span className="opt-ddesc">{desc}</span>
      </div>
    </div>
  );
}

/* ─────────────────────── DIRECTION 1 — HONEYCOMB ─────────────────────── */
function DirA() {
  return (
    <div className="o1">
      <section className="o1-recog">
        <span className="o1-bee" aria-hidden><Image src="/beegood_logo.png" alt="" width={230} height={181} /></span>
        <div className="o1-in">
          <div className="o1-eye">הכרה</div>
          <h3 className="o1-h">עדיין לא בטוח <span className="o1-gd">מה הצעד הבא?</span></h3>
          <p className="o1-sub">ניסית כבר הרבה. אולי מה שחסר הוא בסיס אחד ברור.</p>
          <div className="o1-recog-items">
            {RECOG.map((r) => (
              <div className="o1-recog-item" key={r.t}><span className="o1-hex o1-hex-sm"><r.Icon size={20} strokeWidth={1.7} /></span><span>{r.t}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="o1-journey">
        <span className="o1-bee o1-bee-c" aria-hidden><Image src="/beegood_logo.png" alt="" width={400} height={315} /></span>
        <div className="o1-jhead">
          <div className="o1-eye">מרעש לסיגנל</div>
          <h3 className="o1-h">מתחת לרעש, יש משהו עקבי.<br /><span className="o1-gd">משהו שרק אתה יכול להביא.</span></h3>
        </div>
        <div className="o1-flow">
          <span className="o1-line" aria-hidden />
          {STEPS.map((s, i) => (
            <div className="o1-step" key={s.t}>
              <span className={`o1-hex o1-hex-md${i === 3 ? " o1-hex-gold" : ""}`}><s.Icon size={24} strokeWidth={1.6} /></span>
              <div className="o1-step-txt"><div className="o1-step-t">{s.t}</div><div className="o1-step-d">{s.d}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="o1-sys">
        <div className="o1-sys-grid">
          <div className="o1-sys-copy">
            <div className="o1-eye o1-eye-r">בהירות הופכת למערכת</div>
            <h3 className="o1-h o1-h-r">הסיגנל שלך <span className="o1-gd">מניע הכל.</span></h3>
            <p>כשהסיגנל שלך ברור, כל מה שאתה בונה מיושר לאותו כיוון. לא עוד רעיונות מפוזרים, אלא מערכת אחת שמושכת לאותו מקום.</p>
          </div>
          <div className="o1-diagram">
            <div className="o1-node"><span className="o1-node-glow" aria-hidden /><span className="o1-hex o1-hex-gold o1-hex-lg"><Activity size={26} strokeWidth={1.7} /></span><b>הסיגנל שלך</b><span className="o1-node-sub">מי אתה, ומה רק אתה יכול להציע</span></div>
            <div className="o1-down" aria-hidden><ChevronDown size={22} /></div>
            <div className="o1-kids">
              {KIDS.map((k) => (
                <div className="o1-kid" key={k.t}><span className="o1-hex o1-hex-sm"><k.Icon size={18} strokeWidth={1.7} /></span><span className="o1-kid-txt"><b>{k.t}</b><span>{k.d}</span></span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="o1-princ-sec">
        <span className="o1-bee o1-bee-c" aria-hidden><Image src="/beegood_logo.png" alt="" width={400} height={315} /></span>
        <div className="o1-princ">
          {PRINC.map((p) => (
            <div className="o1-princ-item" key={p.t}><span className="o1-hex o1-hex-md"><p.Icon size={22} strokeWidth={1.6} /></span><div className="o1-princ-txt"><h4>{p.t}</h4><p>{p.d}</p></div></div>
          ))}
        </div>
        <p className="o1-punch">אנחנו לא מוכרים סרטונים.<br />אנחנו בונים את הבהירות שגורמת לתוכן לעבוד.</p>
      </section>
    </div>
  );
}

/* ─────────────────── DIRECTION 2 — EDITORIAL LUMINOUS ─────────────────── */
function DirB() {
  return (
    <div className="o2">
      <section className="o2-recog">
        <div className="o2-eye">הכרה</div>
        <h3 className="o2-h">עדיין לא בטוח <span className="o2-gd">מה הצעד הבא?</span></h3>
        <p className="o2-sub">ניסית כבר הרבה. אולי מה שחסר הוא בסיס אחד ברור.</p>
        <div className="o2-recog-list">
          {RECOG.map((r, i) => (
            <div className="o2-recog-item" key={r.t}>
              <span className="o2-num">{String(i + 1).padStart(2, "0")}</span>
              <r.Icon className="o2-ri" size={22} strokeWidth={1.4} />
              <span className="o2-recog-t">{r.t}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="o2-journey">
        <div className="o2-jhead">
          <div className="o2-eye">מרעש לסיגנל</div>
          <h3 className="o2-h">מתחת לרעש, יש משהו עקבי. <span className="o2-gd">משהו שרק אתה יכול להביא.</span></h3>
        </div>
        <div className="o2-flow">
          <span className="o2-line" aria-hidden />
          {STEPS.map((s, i) => (
            <div className="o2-step" key={s.t}>
              <span className={`o2-ring${i === 3 ? " o2-ring-on" : ""}`}><s.Icon size={20} strokeWidth={1.4} /></span>
              <div className="o2-step-t">{s.t}</div>
              <div className="o2-step-d">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="o2-sys">
        <div className="o2-eye o2-eye-c">בהירות הופכת למערכת</div>
        <h3 className="o2-h o2-h-c">הסיגנל שלך <span className="o2-gd">מניע הכל.</span></h3>
        <p className="o2-sys-lede">כשהסיגנל שלך ברור, כל מה שאתה בונה מיושר לאותו כיוון. לא עוד רעיונות מפוזרים, אלא מערכת אחת שמושכת לאותו מקום.</p>
        <div className="o2-orb"><span className="o2-orb-glow" aria-hidden /><Activity size={30} strokeWidth={1.4} /><span className="o2-orb-lbl">הסיגנל שלך</span></div>
        <div className="o2-cols">
          {KIDS.map((k) => (
            <div className="o2-col" key={k.t}><k.Icon size={20} strokeWidth={1.4} /><h4>{k.t}</h4><p>{k.d}</p></div>
          ))}
        </div>
      </section>

      <section className="o2-princ-sec">
        <div className="o2-princ">
          {PRINC.map((p) => (
            <div className="o2-princ-item" key={p.t}><p.Icon size={22} strokeWidth={1.4} /><h4>{p.t}</h4><p>{p.d}</p></div>
          ))}
        </div>
        <p className="o2-punch">אנחנו לא מוכרים סרטונים.<br /><span className="o2-gd">אנחנו בונים את הבהירות שגורמת לתוכן לעבוד.</span></p>
      </section>
    </div>
  );
}

/* ─────────────────── DIRECTION 3 — IMMERSIVE HONEYCOMB ─────────────────── */
function DirC() {
  return (
    <div className="o3">
      <section className="o3-recog">
        <div className="o3-eye">הכרה</div>
        <h3 className="o3-h">עדיין לא בטוח <span className="o3-gd">מה הצעד הבא?</span></h3>
        <p className="o3-sub">ניסית כבר הרבה. אולי מה שחסר הוא בסיס אחד ברור.</p>
        <div className="o3-recog-items">
          {RECOG.map((r) => (
            <div className="o3-recog-item" key={r.t}><span className="o3-hex o3-hex-sm o3-hex-fill"><r.Icon size={22} strokeWidth={1.8} /></span><span>{r.t}</span></div>
          ))}
        </div>
      </section>

      <section className="o3-journey">
        <div className="o3-jhead">
          <div className="o3-eye">מרעש לסיגנל</div>
          <h3 className="o3-h">מתחת לרעש, יש משהו עקבי.<br /><span className="o3-gd">משהו שרק אתה יכול להביא.</span></h3>
        </div>
        <div className="o3-flow">
          <span className="o3-band" aria-hidden />
          {STEPS.map((s, i) => (
            <div className="o3-step" key={s.t}>
              <span className={`o3-hex o3-hex-lg${i === 3 ? " o3-hex-fill o3-hex-glow" : " o3-hex-fill"}`}><s.Icon size={26} strokeWidth={1.8} /></span>
              <div className="o3-step-txt"><div className="o3-step-t">{s.t}</div><div className="o3-step-d">{s.d}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="o3-sys">
        <div className="o3-sys-grid">
          <div className="o3-sys-copy">
            <div className="o3-eye o3-eye-r">בהירות הופכת למערכת</div>
            <h3 className="o3-h o3-h-r">הסיגנל שלך <span className="o3-gd">מניע הכל.</span></h3>
            <p>כשהסיגנל שלך ברור, כל מה שאתה בונה מיושר לאותו כיוון. לא עוד רעיונות מפוזרים, אלא מערכת אחת שמושכת לאותו מקום.</p>
          </div>
          <div className="o3-diagram">
            <div className="o3-node"><span className="o3-node-glow" aria-hidden /><span className="o3-hex o3-hex-xl o3-hex-fill o3-hex-glow"><Activity size={32} strokeWidth={1.8} /></span><b>הסיגנל שלך</b><span className="o3-node-sub">מי אתה, ומה רק אתה יכול להציע</span></div>
            <div className="o3-kids">
              {KIDS.map((k) => (
                <div className="o3-kid" key={k.t}><span className="o3-hex o3-hex-md o3-hex-fill"><k.Icon size={20} strokeWidth={1.8} /></span><b>{k.t}</b><span>{k.d}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="o3-princ-sec">
        <div className="o3-princ">
          {PRINC.map((p) => (
            <div className="o3-princ-item" key={p.t}><span className="o3-hex o3-hex-md o3-hex-fill"><p.Icon size={22} strokeWidth={1.8} /></span><h4>{p.t}</h4><p>{p.d}</p></div>
          ))}
        </div>
        <p className="o3-punch">אנחנו לא מוכרים סרטונים.<br />אנחנו בונים את הבהירות שגורמת לתוכן לעבוד.</p>
      </section>
    </div>
  );
}

const OPT_CSS = `
.opt-root{--bg:#080C14;--card:#141820;--border:#2C323E;--line:#232936;--gold:#C9964A;--gold-l:#E8B94A;--gold-d:#9E7C3A;--fg:#EDE9E1;--muted:#AAB0BD;background:var(--bg);color:var(--fg);min-height:100vh;overflow-x:hidden}
.opt-root *{box-sizing:border-box}
.opt-hero{text-align:center;padding:56px 22px 8px}
.opt-eyebrow{font-size:11px;letter-spacing:3px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:14px}
.opt-hero h1{font-size:clamp(22px,3.4vw,30px);font-weight:900;margin:0 0 10px}
.opt-hero p{color:var(--muted);font-size:15px;margin:0 auto;max-width:44ch;line-height:1.7}
.opt-divider{position:sticky;top:64px;z-index:20;background:rgba(8,12,20,.9);backdrop-filter:blur(10px);border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-top:40px}
.opt-divider-in{max-width:1080px;margin:0 auto;padding:12px 22px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.opt-badge{background:linear-gradient(180deg,#f4d27a,#d59b1f);color:#2a1d05;font-weight:800;font-size:12px;border-radius:9999px;padding:4px 12px;flex:none}
.opt-dname{font-weight:800;font-size:16px;color:var(--gold-l)}
.opt-ddesc{font-size:12.5px;color:var(--muted)}
.opt-foot{text-align:center;color:var(--muted);font-size:12px;padding:40px 22px;opacity:.7}

/* hexagon utility shared by dir1 + dir3 (distinct prefixes below reference their own) */

/* ══════════ DIRECTION 1 — HONEYCOMB ══════════ */
.o1 .o1-eye{font-size:11px;letter-spacing:3px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:14px;text-align:center}
.o1 .o1-eye-r{text-align:right}
.o1 .o1-h{font-size:clamp(21px,3vw,28px);font-weight:800;line-height:1.3;text-align:center;margin:0 0 26px;text-wrap:balance}
.o1 .o1-h-r{text-align:right;margin-bottom:14px}
.o1 .o1-gd{color:var(--gold-l)}
.o1-hex{position:relative;flex:none;display:grid;place-items:center;width:56px;height:62px;filter:drop-shadow(0 10px 22px rgba(201,150,74,.26))}
.o1-hex::before{content:"";position:absolute;inset:0;background:linear-gradient(155deg,var(--gold-l),var(--gold-d));clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
.o1-hex::after{content:"";position:absolute;inset:2px;background:#10151F;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
.o1-hex>svg{position:relative;z-index:1;color:var(--gold-l)}
.o1-hex-sm{width:48px;height:53px}
.o1-hex-md{width:60px;height:66px}
.o1-hex-lg{width:82px;height:90px}
.o1-hex-gold::after{background:linear-gradient(155deg,#f4d27a,#d59b1f)}
.o1-hex-gold>svg{color:#2a1d05}
.o1-bee{position:absolute;pointer-events:none;z-index:0;opacity:.05}
.o1-bee img{display:block;width:100%;height:auto}
.o1-bee:not(.o1-bee-c){top:20px;right:-40px;width:220px}
.o1-bee-c{top:6px;left:50%;transform:translateX(-50%);width:400px;opacity:.04}
.o1-recog{position:relative;overflow:hidden;max-width:1000px;margin:0 auto;padding:64px 22px;text-align:center}
.o1-in{position:relative;z-index:1}
.o1-sub{color:var(--muted);font-size:15px;margin:0 auto 32px;max-width:48ch;line-height:1.7}
.o1-recog-items{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:840px;margin:0 auto}
.o1-recog-item{display:flex;flex-direction:column;align-items:center;gap:18px;padding:32px 18px;border:1px solid var(--border);background:linear-gradient(180deg,var(--card),#0F131C);border-radius:18px;font-size:15.5px;color:var(--fg);font-weight:600}
.o1-journey{position:relative;overflow:hidden;background:#0B0F17;padding:70px 22px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.o1-jhead{position:relative;z-index:1;max-width:760px;margin:0 auto 46px;text-align:center}
.o1-flow{position:relative;z-index:1;max-width:940px;margin:0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.o1-line{position:absolute;top:33px;left:11%;right:11%;height:2px;z-index:0;background:linear-gradient(90deg,transparent,var(--gold) 12%,var(--gold-l) 50%,var(--gold) 88%,transparent);opacity:.55}
.o1-step{position:relative;z-index:1;flex:1;max-width:200px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}
.o1-step-txt{display:flex;flex-direction:column;align-items:center;gap:4px}
.o1-step-t{font-size:17px;font-weight:800}
.o1-step-d{font-size:13px;color:var(--muted);line-height:1.5}
.o1-sys{max-width:1080px;margin:0 auto;padding:74px 22px}
.o1-sys-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.o1-sys-copy{text-align:right}
.o1-sys-copy p{color:var(--muted);font-size:15px;line-height:1.75;max-width:46ch;margin:0}
.o1-diagram{display:flex;flex-direction:column;align-items:center}
.o1-node{position:relative;width:100%;max-width:340px;border:1px solid rgba(201,150,74,.5);background:linear-gradient(160deg,rgba(201,150,74,.14),var(--card));border-radius:20px;padding:24px 18px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.o1-node-glow{position:absolute;inset:-34% 6%;background:radial-gradient(circle,rgba(201,150,74,.3),transparent 68%);z-index:0}
.o1-node .o1-hex{margin-bottom:8px}
.o1-node b{position:relative;z-index:1;color:var(--gold-l);font-size:16.5px}
.o1-node-sub{position:relative;z-index:1;font-size:12.5px;color:var(--muted)}
.o1-down{color:var(--gold);margin:12px 0}
.o1-kids{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%;max-width:540px}
.o1-kid{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid var(--border);background:var(--card);border-radius:16px;padding:22px 12px 18px;text-align:center}
.o1-kid-txt{display:flex;flex-direction:column;gap:4px;align-items:center}
.o1-kid b{font-size:14.5px}
.o1-kid span{font-size:11.5px;color:var(--muted);line-height:1.5}
.o1-princ-sec{position:relative;overflow:hidden;background:#101520;padding:70px 22px;border-top:1px solid var(--line)}
.o1-princ{position:relative;z-index:1;max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.o1-princ-item{display:flex;flex-direction:column;align-items:center;text-align:center}
.o1-princ-item .o1-hex{margin-bottom:18px}
.o1-princ-txt{display:flex;flex-direction:column;align-items:center}
.o1-princ-item h4{font-size:17.5px;font-weight:800;margin:0 0 8px}
.o1-princ-item p{font-size:13.5px;color:var(--muted);line-height:1.65;margin:0}
.o1-punch{position:relative;z-index:1;font-size:clamp(18px,2.6vw,24px);font-weight:800;line-height:1.5;margin:48px auto 0;text-align:center;max-width:40ch}

/* ══════════ DIRECTION 2 — EDITORIAL LUMINOUS ══════════ */
.o2{--o2-hair:rgba(201,150,74,.28)}
.o2 .o2-eye{font-size:10.5px;letter-spacing:4px;font-weight:700;color:var(--gold);text-transform:uppercase;margin-bottom:18px;text-align:center}
.o2 .o2-eye-c{text-align:center}
.o2 .o2-h{font-size:clamp(22px,3vw,30px);font-weight:800;line-height:1.32;text-align:center;margin:0 0 22px;letter-spacing:-.01em}
.o2 .o2-h-c{text-align:center}
.o2 .o2-gd{color:var(--gold-l)}
.o2-recog{max-width:900px;margin:0 auto;padding:74px 22px 66px;text-align:center}
.o2-sub{color:var(--muted);font-size:15px;margin:0 auto 44px;max-width:46ch;line-height:1.7}
.o2-recog-list{max-width:620px;margin:0 auto;display:flex;flex-direction:column}
.o2-recog-item{display:flex;align-items:center;gap:22px;padding:24px 6px;border-top:1px solid var(--o2-hair);text-align:right}
.o2-recog-item:last-child{border-bottom:1px solid var(--o2-hair)}
.o2-num{font-size:26px;font-weight:800;color:transparent;-webkit-text-stroke:1px var(--gold);letter-spacing:1px;flex:none;width:46px}
.o2-ri{color:var(--gold-l);flex:none}
.o2-recog-t{font-size:17px;font-weight:600;color:var(--fg)}
.o2-journey{background:#0A0E16;padding:78px 22px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.o2-jhead{max-width:760px;margin:0 auto 56px;text-align:center}
.o2-flow{position:relative;max-width:900px;margin:0 auto;display:flex;justify-content:space-between;gap:8px}
.o2-line{position:absolute;top:32px;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,var(--gold-l),transparent);z-index:0;box-shadow:0 0 14px 1px rgba(232,185,74,.4)}
.o2-step{position:relative;z-index:1;flex:1;max-width:190px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px}
.o2-ring{width:64px;height:64px;border-radius:50%;border:1px solid var(--o2-hair);background:#0A0E16;display:grid;place-items:center;color:var(--gold-l)}
.o2-ring-on{border-color:var(--gold-l);box-shadow:0 0 0 5px rgba(232,185,74,.08),0 0 26px rgba(232,185,74,.35)}
.o2-step-t{font-size:16.5px;font-weight:800}
.o2-step-d{font-size:12.5px;color:var(--muted);line-height:1.55}
.o2-sys{max-width:820px;margin:0 auto;padding:80px 22px;text-align:center}
.o2-sys-lede{color:var(--muted);font-size:15px;line-height:1.75;max-width:48ch;margin:0 auto 48px}
.o2-orb{position:relative;width:150px;height:150px;margin:0 auto 12px;border-radius:50%;border:1px solid var(--gold-l);display:grid;place-items:center;color:var(--gold-l)}
.o2-orb-glow{position:absolute;inset:-40%;background:radial-gradient(circle,rgba(232,185,74,.28),transparent 62%);z-index:0}
.o2-orb>svg{position:relative;z-index:1}
.o2-orb-lbl{position:absolute;bottom:-34px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:14px;font-weight:800;color:var(--gold-l);z-index:1}
.o2-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:64px}
.o2-col{padding:8px 22px;text-align:center;color:var(--gold-l)}
.o2-col+.o2-col{border-right:1px solid var(--o2-hair)}
.o2-col h4{font-size:16px;font-weight:800;color:var(--fg);margin:14px 0 8px}
.o2-col p{font-size:12.5px;color:var(--muted);line-height:1.6;margin:0}
.o2-princ-sec{background:#0A0E16;padding:76px 22px;border-top:1px solid var(--line)}
.o2-princ{max-width:980px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr)}
.o2-princ-item{padding:8px 30px;text-align:center;color:var(--gold-l)}
.o2-princ-item+.o2-princ-item{border-right:1px solid var(--o2-hair)}
.o2-princ-item h4{font-size:17px;font-weight:800;color:var(--fg);margin:16px 0 10px}
.o2-princ-item p{font-size:13px;color:var(--muted);line-height:1.65;margin:0}
.o2-punch{font-size:clamp(18px,2.6vw,24px);font-weight:800;line-height:1.55;margin:56px auto 0;text-align:center;max-width:40ch;color:var(--fg)}

/* ══════════ DIRECTION 3 — IMMERSIVE HONEYCOMB ══════════ */
.o3{background-image:url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z' fill='%23E8B94A' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")}
.o3 .o3-eye{font-size:11px;letter-spacing:3px;font-weight:800;color:var(--gold-l);text-transform:uppercase;margin-bottom:14px;text-align:center}
.o3 .o3-eye-r{text-align:right}
.o3 .o3-h{font-size:clamp(21px,3vw,28px);font-weight:800;line-height:1.3;text-align:center;margin:0 0 26px;text-wrap:balance}
.o3 .o3-h-r{text-align:right;margin-bottom:14px}
.o3 .o3-gd{color:var(--gold-l)}
.o3-hex{position:relative;flex:none;display:grid;place-items:center;width:56px;height:62px}
.o3-hex::before{content:"";position:absolute;inset:0;background:linear-gradient(155deg,var(--gold-l),var(--gold-d));clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
.o3-hex::after{content:"";position:absolute;inset:2px;background:#17120A;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
.o3-hex>svg{position:relative;z-index:1;color:var(--gold-l)}
.o3-hex-fill::after{background:linear-gradient(155deg,#f6d67e,#cf951c)}
.o3-hex-fill>svg{color:#2a1d05}
.o3-hex-glow{filter:drop-shadow(0 0 20px rgba(232,185,74,.55))}
.o3-hex-sm{width:52px;height:57px}
.o3-hex-md{width:60px;height:66px}
.o3-hex-lg{width:74px;height:81px}
.o3-hex-xl{width:96px;height:106px}
.o3-recog{max-width:1000px;margin:0 auto;padding:64px 22px;text-align:center}
.o3-sub{color:var(--muted);font-size:15px;margin:0 auto 32px;max-width:48ch;line-height:1.7}
.o3-recog-items{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:840px;margin:0 auto}
.o3-recog-item{display:flex;flex-direction:column;align-items:center;gap:18px;padding:32px 18px;border:1px solid rgba(201,150,74,.28);background:linear-gradient(180deg,rgba(201,150,74,.1),rgba(28,22,12,.6));border-radius:18px;font-size:15.5px;color:var(--fg);font-weight:600}
.o3-journey{position:relative;padding:70px 22px;border-top:1px solid rgba(201,150,74,.18);border-bottom:1px solid rgba(201,150,74,.18);background:linear-gradient(180deg,rgba(201,150,74,.05),transparent)}
.o3-jhead{max-width:760px;margin:0 auto 46px;text-align:center}
.o3-flow{position:relative;max-width:940px;margin:0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.o3-band{position:absolute;top:28px;left:10%;right:10%;height:8px;border-radius:9999px;z-index:0;background:linear-gradient(90deg,rgba(201,150,74,.15),var(--gold-l),rgba(201,150,74,.15));box-shadow:0 0 24px rgba(232,185,74,.4)}
.o3-step{position:relative;z-index:1;flex:1;max-width:200px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}
.o3-step-txt{display:flex;flex-direction:column;align-items:center;gap:4px}
.o3-step-t{font-size:17px;font-weight:800}
.o3-step-d{font-size:13px;color:var(--muted);line-height:1.5}
.o3-sys{max-width:1080px;margin:0 auto;padding:74px 22px}
.o3-sys-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.o3-sys-copy{text-align:right}
.o3-sys-copy p{color:var(--muted);font-size:15px;line-height:1.75;max-width:46ch;margin:0}
.o3-diagram{display:flex;flex-direction:column;align-items:center;gap:26px}
.o3-node{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.o3-node-glow{position:absolute;inset:-70% -30%;background:radial-gradient(circle,rgba(232,185,74,.22),transparent 62%);z-index:0}
.o3-node b{position:relative;z-index:1;color:var(--gold-l);font-size:17px}
.o3-node-sub{position:relative;z-index:1;font-size:12.5px;color:var(--muted);max-width:24ch}
.o3-kids{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%;max-width:560px}
.o3-kid{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid rgba(201,150,74,.25);background:linear-gradient(180deg,rgba(201,150,74,.08),rgba(28,22,12,.5));border-radius:16px;padding:22px 12px 18px;text-align:center}
.o3-kid b{font-size:14.5px}
.o3-kid span{font-size:11.5px;color:var(--muted);line-height:1.5}
.o3-princ-sec{padding:70px 22px;border-top:1px solid rgba(201,150,74,.18);background:linear-gradient(180deg,rgba(201,150,74,.05),transparent)}
.o3-princ{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.o3-princ-item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px}
.o3-princ-item h4{font-size:17.5px;font-weight:800;margin:0}
.o3-princ-item p{font-size:13.5px;color:var(--muted);line-height:1.65;margin:0}
.o3-punch{font-size:clamp(18px,2.6vw,24px);font-weight:800;line-height:1.5;margin:48px auto 0;text-align:center;max-width:40ch}

/* ── responsive (all directions) ── */
@media(max-width:900px){
  .o1-sys-grid,.o3-sys-grid{grid-template-columns:1fr;gap:30px}
  .o1-sys-copy,.o1-sys-copy .o1-h,.o1-sys-copy .o1-eye,.o3-sys-copy,.o3-sys-copy .o3-h,.o3-sys-copy .o3-eye{text-align:center}
  .o1-sys-copy p,.o3-sys-copy p{margin:0 auto}
}
@media(max-width:760px){
  .opt-divider{top:56px}
  .o1-recog{padding:52px 18px}
  .o1-recog-items,.o3-recog-items{grid-template-columns:1fr;gap:12px}
  .o1-recog-item,.o3-recog-item{flex-direction:row;justify-content:flex-start;text-align:right;padding:18px;gap:16px}
  .o1-journey,.o3-journey{padding:54px 18px}
  .o1-flow{flex-direction:column;align-items:stretch;gap:24px;max-width:430px;margin-inline:auto}
  .o1-line{top:30px;bottom:30px;left:auto;right:29px;width:2px;height:auto;background:linear-gradient(180deg,transparent,var(--gold) 10%,var(--gold-l) 50%,var(--gold) 90%,transparent)}
  .o1-step{max-width:none;flex-direction:row;align-items:center;text-align:right;gap:20px}
  .o1-step-txt{align-items:flex-start}
  .o1-kids{grid-template-columns:1fr;max-width:390px;gap:12px;margin-inline:auto}
  .o1-kid{flex-direction:row;text-align:right;align-items:center;gap:16px;padding:16px 18px}
  .o1-kid-txt{align-items:flex-start}
  .o1-princ,.o3-princ{grid-template-columns:1fr;gap:30px}
  .o1-princ-item{flex-direction:row;text-align:right;align-items:center;gap:20px}
  .o1-princ-item .o1-hex{margin-bottom:0}
  .o1-princ-txt{align-items:flex-start}
  .o2-flow{flex-direction:column;align-items:center;gap:26px;max-width:320px;margin-inline:auto}
  .o2-line{display:none}
  .o2-cols,.o2-princ{grid-template-columns:1fr}
  .o2-col+.o2-col,.o2-princ-item+.o2-princ-item{border-right:0;border-top:1px solid var(--o2-hair)}
  .o2-col,.o2-princ-item{padding:26px 22px}
  .o3-flow{flex-direction:column;align-items:center;gap:22px;max-width:340px;margin-inline:auto}
  .o3-band{top:0;bottom:0;left:auto;right:36px;width:8px;height:auto;background:linear-gradient(180deg,rgba(201,150,74,.15),var(--gold-l),rgba(201,150,74,.15))}
  .o3-step{max-width:none;flex-direction:row;align-items:center;text-align:right;gap:20px;width:100%}
  .o3-step-txt{align-items:flex-start}
  .o3-kids{grid-template-columns:1fr;max-width:360px;gap:12px;margin-inline:auto}
}
`;
