"use client";

import { useEffect, useRef } from "react";

/**
 * SignalExperience — "קו האות · The Signal Line".
 * ONE fixed full-viewport oscilloscope trace behind the whole page. A single
 * `coherence` scalar, driven by scroll across the 4-section block, resolves the
 * line from grey noise (top) to one clean gold signal (bottom). A "lock-in"
 * fires near coherence 0.8 — residual noise collapses, a flash blooms, and a
 * bright pulse sweeps the line RIGHT→LEFT once; the JOURNEY sentence reaches
 * full clarity on the same beat. Content reveals are bound to coherence, not
 * timers, so copy and motion can't drift. One canvas, one rAF, one scalar — no
 * particles, no deps. Respects prefers-reduced-motion. Used ONLY on /new/live.
 */
export function SignalExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const block = blockRef.current;
    if (!canvas || !block) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, mobile = false, t = 0, raf = 0;

    // fixed-at-mount noise harmonics (chaos that never repeats identically)
    const seedRand = (() => { let s = 20260719; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; })();
    const M = 10;
    let harmonics: { k: number; phase: number; w: number; a: number }[] = [];
    const buildHarmonics = () => {
      const kFund = mobile ? (TAU * 2.4) / H : (TAU * 2.2) / W;
      harmonics = Array.from({ length: mobile ? 8 : M }, () => ({
        k: kFund * (2 + seedRand() * 7),
        phase: seedRand() * TAU,
        w: 0.5 + seedRand() * 1.7,
        a: 0.5 + seedRand() * 0.8,
      }));
      const sum = harmonics.reduce((s, h) => s + h.a, 0);
      harmonics.forEach((h) => (h.a /= sum));
    };

    const setup = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      mobile = W < 760;
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildHarmonics();
    };
    setup();

    const smooth = (a: number, b: number, x: number) => {
      const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return u * u * (3 - 2 * u);
    };
    const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

    // grey -> gold
    const NR = 170, NG = 176, NB = 189; // #AAB0BD
    const GR = 232, GG = 185, GB = 74; // #E8B94A

    // reveal targets (bound to coherence)
    const reveals = Array.from(block.querySelectorAll<HTMLElement>("[data-a]")).map((el) => ({
      el, a: parseFloat(el.dataset.a || "0"), b: parseFloat(el.dataset.b || "1"),
    }));

    // lock-in state
    let lockFired = false;
    let lockT = -1; // 0..1 progress once fired
    let prevCoh = 0;

    const coherenceNow = () => {
      const r = block.getBoundingClientRect();
      const denom = r.height - H;
      if (denom <= 0) return 0;
      return Math.min(1, Math.max(0, -r.top / denom));
    };

    const draw = () => {
      const raw = coherenceNow();
      const coh = easeInOutCubic(raw);

      // lock-in trigger (forward crossing of 0.8)
      if (!lockFired && prevCoh < 0.8 && coh >= 0.8) { lockFired = true; lockT = 0; }
      if (lockFired && coh < 0.72) { lockFired = false; lockT = -1; } // allow re-arm on scroll back
      prevCoh = coh;
      if (lockT >= 0 && lockT < 1) lockT = Math.min(1, lockT + 0.035);
      const flash = lockT >= 0 ? Math.max(0, 1 - lockT) : 0; // 1 -> 0 bloom

      // effective coherence: lock snaps residual noise away fast
      const snap = lockT >= 0 ? easeInOutCubic(lockT) * 0.55 : 0;
      const cEff = Math.min(1, coh + snap);
      const noiseAmt = 1 - cEff;

      // ── background: near-black warming toward signal + gold vignette at base ──
      const bg = `rgb(${Math.round(lerp(8, 13, coh))},${Math.round(lerp(12, 16, coh))},${Math.round(lerp(20, 24, coh))})`;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const vig = ctx.createRadialGradient(W / 2, H * (mobile ? 0.9 : 0.72), 0, W / 2, H * (mobile ? 0.9 : 0.72), Math.max(W, H) * 0.7);
      vig.addColorStop(0, `rgba(201,150,74,${(0.06 * coh + flash * 0.05).toFixed(3)})`);
      vig.addColorStop(1, "rgba(201,150,74,0)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      const N = mobile ? 120 : 220;
      const maxAmp = (mobile ? W : H) * 0.15;
      const strokeR = Math.round(lerp(NR, GR, cEff));
      const strokeG = Math.round(lerp(NG, GG, cEff));
      const strokeB = Math.round(lerp(NB, GB, cEff));

      const val = (p: number) => {
        // one sample of the trace deviation at param p (px along the line)
        let y = Math.sin(p * (mobile ? (TAU * 2.4) / H : (TAU * 2.2) / W) - t) * cEff;
        let n = 0;
        for (const h of harmonics) n += h.a * Math.sin(p * h.k + h.phase - t * h.w);
        y += n * noiseAmt;
        y += Math.sin(p * 0.35 + t * 3.1) * Math.sin(p * 0.19 - t * 2.3) * 0.15 * noiseAmt;
        return y;
      };

      // faint competing ghost traces while noisy (dissolve as signal arrives)
      const ghostA = noiseAmt * 0.12;
      if (ghostA > 0.01) {
        for (let g = 0; g < 2; g++) {
          ctx.beginPath();
          for (let i = 0; i <= N; i++) {
            const p = (i / N) * (mobile ? H : W);
            let n = 0;
            for (const h of harmonics) n += h.a * Math.sin(p * h.k * (1.3 + g * 0.4) + h.phase * (g + 1) - t * h.w);
            const d = n * maxAmp * 0.8;
            const cx = mobile ? W / 2 + d : p;
            const cy = mobile ? p : H / 2 + d;
            i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
          }
          ctx.strokeStyle = `rgba(${NR},${NG},${NB},${ghostA.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ── the main trace ──
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const p = (i / N) * (mobile ? H : W);
        const d = val(p) * maxAmp;
        const cx = mobile ? W / 2 + d : p;
        const cy = mobile ? p : H / 2 + d;
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = `rgb(${strokeR},${strokeG},${strokeB})`;
      ctx.lineWidth = lerp(1, 2.2, cEff);
      ctx.shadowColor = "rgba(201,150,74,0.85)";
      ctx.shadowBlur = cEff * 16 + flash * 26;
      ctx.globalAlpha = lerp(0.5, 1, cEff);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // ── lock-in light pulse: one bright bloom sweeping RIGHT -> LEFT ──
      if (lockT >= 0 && lockT <= 1) {
        const sweep = easeInOutCubic(lockT);
        const pPos = mobile ? sweep * H : (1 - sweep) * W; // desktop R->L; mobile top->bottom
        const d = val(pPos) * maxAmp;
        const cx = mobile ? W / 2 + d : pPos;
        const cy = mobile ? pPos : H / 2 + d;
        const rad = 46;
        const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        pg.addColorStop(0, `rgba(246,214,126,${(0.9 * (1 - sweep) + 0.25).toFixed(3)})`);
        pg.addColorStop(1, "rgba(246,214,126,0)");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, TAU);
        ctx.fill();
      }

      // ── reveal copy bound to coherence ──
      for (const r of reveals) {
        const o = smooth(r.a, r.b, coh);
        r.el.style.opacity = String(o);
        r.el.style.transform = `translateY(${((1 - o) * 16).toFixed(1)}px)`;
      }

      if (!reduce) {
        t += 0.016 * TAU * 0.18; // ~0.18Hz breathe — never frozen
        raf = requestAnimationFrame(draw);
      }
    };

    const onResize = () => { setup(); if (reduce) draw(); };
    window.addEventListener("resize", onResize);
    let scrollTick = false;
    const onScroll = () => { if (reduce && !scrollTick) { scrollTick = true; requestAnimationFrame(() => { draw(); scrollTick = false; }); } };
    if (reduce) window.addEventListener("scroll", onScroll, { passive: true });

    if (reduce) draw();
    else raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div dir="rtl" className="sl-root">
      <style>{SL_CSS}</style>
      <canvas ref={canvasRef} className="sl-canvas" aria-hidden />

      <div ref={blockRef} className="sl-block">
        {/* 1 — RECOGNITION (max noise) */}
        <section className="sl-sec sl-recog">
          <div className="sl-inner">
            <div className="sl-eye" data-a="0" data-b="0.05">הכרה</div>
            <h2 className="sl-h" data-a="0" data-b="0.06">עדיין לא בטוח <span className="sl-gd">מה הצעד הבא?</span></h2>
            <p className="sl-lede" data-a="0.01" data-b="0.08">ניסית כבר הרבה. אולי מה שחסר הוא בסיס אחד ברור — מתחת לכל הרעש.</p>
            <div className="sl-frags">
              <span className="sl-frag" data-a="0.02" data-b="0.09">שאלת את ה-AI.</span>
              <span className="sl-frag" data-a="0.04" data-b="0.11">חשבת להעתיק מהמתחרים.</span>
              <span className="sl-frag" data-a="0.06" data-b="0.13">כבר לא יודע איזה תוכן להעלות.</span>
            </div>
          </div>
        </section>

        {/* 2 — JOURNEY (the wow / lock-in) */}
        <section className="sl-sec sl-journey">
          <div className="sl-inner">
            <div className="sl-eye" data-a="0.16" data-b="0.24">מרעש לסיגנל</div>
            <div className="sl-beats">
              <span className="sl-beat" data-a="0.14" data-b="0.24">רעש</span>
              <span className="sl-beat" data-a="0.34" data-b="0.44">דפוסים</span>
              <span className="sl-beat sl-beat-on" data-a="0.58" data-b="0.7">סיגנל</span>
              <span className="sl-beat sl-beat-on" data-a="0.84" data-b="0.94">צמיחה</span>
            </div>
            <h2 className="sl-h sl-h-big">
              <span data-a="0.2" data-b="0.42">מתחת לרעש, יש משהו עקבי.</span><br />
              <span className="sl-gd" data-a="0.72" data-b="0.86">משהו שרק אתה יכול להביא.</span>
            </h2>
          </div>
        </section>

        {/* 3 — SYSTEM (the clean signal drives everything) */}
        <section className="sl-sec sl-sys">
          <div className="sl-inner">
            <div className="sl-eye" data-a="0.86" data-b="0.92">בהירות הופכת למערכת</div>
            <h2 className="sl-h" data-a="0.87" data-b="0.93">הסיגנל שלך <span className="sl-gd">מניע הכל.</span></h2>
            <p className="sl-lede" data-a="0.88" data-b="0.94">אות אחד ברור. כל מה שנבנה ממנו מיושר לאותו כיוון.</p>
            <div className="sl-outs" data-a="0.9" data-b="0.96">
              <span className="sl-out">אסטרטגיה</span>
              <span className="sl-dot" aria-hidden />
              <span className="sl-out">תוכן</span>
              <span className="sl-dot" aria-hidden />
              <span className="sl-out">דאטה</span>
            </div>
          </div>
        </section>

        {/* 4 — PRINCIPLES (steady heartbeat) */}
        <section className="sl-sec sl-princ">
          <div className="sl-inner">
            <div className="sl-values" data-a="0.95" data-b="1">
              <span>האדם במרכז</span><i aria-hidden>·</i><span>נבנה להחזיק</span><i aria-hidden>·</i><span>מדע ונשמה</span>
            </div>
            <p className="sl-punch" data-a="0.96" data-b="1">
              אנחנו לא מוכרים סרטונים.<br /><span className="sl-gd">אנחנו בונים את הבהירות שגורמת לתוכן לעבוד.</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

const SL_CSS = `
.sl-root{--gold:#C9964A;--gold-l:#E8B94A;--fg:#EDE9E1;--muted:#AAB0BD;background:#080C14;color:var(--fg)}
.sl-root *{box-sizing:border-box}
.sl-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;display:block}
.sl-block{position:relative;z-index:1}
.sl-sec{min-height:118vh;display:flex;align-items:center;justify-content:center;padding:80px 24px}
.sl-inner{max-width:60ch;width:100%;text-align:center}
.sl-gd{color:var(--gold-l)}
.sl-eye{font-size:11px;letter-spacing:4px;font-weight:700;color:var(--gold);text-transform:uppercase;margin-bottom:20px}
.sl-h{font-weight:300;font-size:clamp(26px,4.4vw,46px);line-height:1.24;letter-spacing:-.01em;margin:0;text-wrap:balance}
.sl-h-big{font-weight:300;font-size:clamp(30px,5.6vw,60px);line-height:1.2}
.sl-lede{color:var(--muted);font-size:clamp(15px,2vw,18px);font-weight:300;line-height:1.7;margin:22px auto 0;max-width:44ch}
.sl-frags{display:flex;flex-direction:column;gap:12px;margin-top:40px;align-items:center}
.sl-frag{font-size:14px;color:var(--muted);position:relative;padding-top:12px}
.sl-frag::before{content:"";position:absolute;top:0;right:50%;transform:translateX(50%);width:1px;height:8px;background:var(--gold);opacity:.5}
.sl-beats{display:flex;justify-content:center;gap:clamp(18px,5vw,54px);margin-bottom:30px}
.sl-beat{font-size:12px;letter-spacing:3px;font-weight:700;color:var(--muted);text-transform:uppercase}
.sl-beat-on{color:var(--gold-l)}
.sl-outs{display:flex;align-items:center;justify-content:center;gap:clamp(16px,4vw,34px);margin-top:38px}
.sl-out{font-size:clamp(15px,2vw,19px);font-weight:400;color:var(--fg)}
.sl-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);flex:none;box-shadow:0 0 10px 1px rgba(232,185,74,.6)}
.sl-values{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;font-size:13px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:30px}
.sl-values i{color:var(--gold);font-style:normal}
.sl-punch{font-weight:300;font-size:clamp(20px,3.2vw,32px);line-height:1.5;margin:0 auto;max-width:40ch}
/* reveal defaults (JS drives opacity/transform each frame) */
.sl-block [data-a]{opacity:0;will-change:opacity,transform}
@media(prefers-reduced-motion:reduce){.sl-block [data-a]{opacity:1}}
@media(max-width:760px){
  .sl-sec{min-height:112vh;padding:70px 20px}
  .sl-beats{gap:20px}
}
`;
