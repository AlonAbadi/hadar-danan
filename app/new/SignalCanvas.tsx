"use client";

import { useEffect, useRef } from "react";

/**
 * SignalCanvas — a CONTAINED, TIME-DRIVEN oscilloscope trace that resolves grey
 * noise -> clean gold signal. Never driven by scroll position (that was the
 * fragile part). Alive on first paint (static noise frame painted synchronously),
 * then a self-running clock resolves over ~2.4s with a lock-in flash + a
 * right->left light pulse. Settles to a gentle breathe, then freezes.
 *
 * Robust + mobile-first: no ctx.shadowBlur in the loop (glow faked with a
 * double stroke), gradients/bloom cached, ONE rAF gated by IntersectionObserver
 * (pauses offscreen) and visibilitychange (pauses when tab hidden), resize only
 * on width/orientation change, DPR capped (1.5 on low-end). prefers-reduced-motion
 * paints the resolved gold frame once with zero rAF.
 *
 * trigger="load"  -> starts ~250ms after it becomes visible (hero).
 * trigger="inview"-> starts the first time it scrolls into view (journey).
 */
export function SignalCanvas({
  trigger = "load",
  className,
}: {
  trigger?: "load" | "inview";
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowEnd = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4;

    // seeded, fixed-at-mount harmonics (chaos that doesn't obviously repeat)
    let seed = 20260719;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const M = lowEnd ? 7 : 10;
    const harmonics = Array.from({ length: M }, () => ({
      spread: 2 + rnd() * 7, phase: rnd() * TAU, w: 0.5 + rnd() * 1.7, a: 0.5 + rnd() * 0.8, k: 0,
    }));
    const aSum = harmonics.reduce((s, h) => s + h.a, 0);
    harmonics.forEach((h) => (h.a /= aSum));

    const N = lowEnd ? 90 : 120;
    let W = 0, H = 0, dpr = 1, kFund = 0;
    let vign: CanvasGradient | null = null;
    let bloom: HTMLCanvasElement | null = null;

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2);
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      kFund = (TAU * 2.0) / W;
      harmonics.forEach((h) => (h.k = kFund * h.spread));
      vign = ctx.createRadialGradient(W / 2, H * 0.6, 0, W / 2, H * 0.6, Math.max(W, H) * 0.7);
      vign.addColorStop(0, "rgba(201,150,74,1)");
      vign.addColorStop(1, "rgba(201,150,74,0)");
      const bs = 72;
      bloom = document.createElement("canvas");
      bloom.width = bs; bloom.height = bs;
      const bx = bloom.getContext("2d");
      if (bx) {
        const bg = bx.createRadialGradient(bs / 2, bs / 2, 0, bs / 2, bs / 2, bs / 2);
        bg.addColorStop(0, "rgba(246,214,126,0.95)");
        bg.addColorStop(1, "rgba(246,214,126,0)");
        bx.fillStyle = bg; bx.fillRect(0, 0, bs, bs);
      }
    };

    const smooth = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
    const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
    const NR = 194, NG = 200, NB = 212, GR = 232, GG = 185, GB = 74;

    const val = (p: number, coh: number, noiseAmt: number, t: number) => {
      let y = Math.sin(p * kFund - t * 1.1) * coh;
      let n = 0;
      for (const h of harmonics) n += h.a * Math.sin(p * h.k + h.phase - t * h.w * 2);
      y += n * noiseAmt;
      y += Math.sin(p * 0.35 + t * 3.1) * Math.sin(p * 0.19 - t * 2.3) * 0.15 * noiseAmt;
      return y;
    };

    // animation state — resolves noise->signal, holds ~1s, then loops forever
    const RESOLVE = 2400, HOLD = 1100, CYCLE = RESOLVE + HOLD;
    let raf = 0, started = false, startArmed = false, cycleStart = 0, mountT = 0, lockFired = false, lockT = -1;
    let visible = false, lastRender = 0;

    const render = (coh: number, t: number, showGhost: boolean) => {
      const mid = H / 2;
      const maxAmp = H * 0.3;
      const snap = lockT >= 0 ? eio(Math.min(1, lockT)) * 0.5 : 0;
      const cEff = Math.min(1, coh + snap);
      const noiseAmt = 1 - cEff;
      const flash = lockT >= 0 ? Math.max(0, 1 - lockT) : 0;

      ctx.fillStyle = `rgb(${Math.round(lerp(8, 13, coh))},${Math.round(lerp(12, 16, coh))},${Math.round(lerp(20, 24, coh))})`;
      ctx.fillRect(0, 0, W, H);
      if (vign) { ctx.globalAlpha = 0.07 * coh + flash * 0.06; ctx.fillStyle = vign; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }

      if (showGhost && noiseAmt > 0.05) {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const p = (i / N) * W;
          let n = 0;
          for (const h of harmonics) n += h.a * Math.sin(p * h.k * 1.4 + h.phase * 2 - t * h.w * 2);
          const y = mid + n * maxAmp * 0.8;
          i === 0 ? ctx.moveTo(p, y) : ctx.lineTo(p, y);
        }
        ctx.strokeStyle = `rgba(${NR},${NG},${NB},${(noiseAmt * 0.2).toFixed(3)})`;
        ctx.lineWidth = 1.1; ctx.stroke();
      }

      const path = new Path2D();
      for (let i = 0; i <= N; i++) {
        const p = (i / N) * W;
        const y = mid + val(p, cEff, noiseAmt, t) * maxAmp;
        i === 0 ? path.moveTo(p, y) : path.lineTo(p, y);
      }
      const r = Math.round(lerp(NR, GR, cEff)), g = Math.round(lerp(NG, GG, cEff)), b = Math.round(lerp(NB, GB, cEff));
      // glow pass (fake shadowBlur) — greyish while noisy, gold as it resolves
      ctx.strokeStyle = `rgba(${r},${g},${b},${(0.12 + 0.16 * cEff + flash * 0.3).toFixed(3)})`;
      ctx.lineWidth = 6; ctx.lineJoin = "round"; ctx.stroke(path);
      // crisp pass
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = lerp(1.7, 2.1, cEff);
      ctx.globalAlpha = lerp(0.85, 1, cEff);
      ctx.stroke(path);
      ctx.globalAlpha = 1;

      if (lockT >= 0 && lockT <= 1 && bloom) {
        const sweep = eio(Math.min(1, lockT));
        const px = (1 - sweep) * W; // right -> left (RTL-correct)
        const y = mid + val(px, cEff, noiseAmt, t) * maxAmp;
        const size = 96 * (1 - sweep * 0.4);
        ctx.globalAlpha = Math.max(0, 1 - sweep) * 0.85 + 0.1;
        ctx.drawImage(bloom, px - size / 2, y - size / 2, size, size);
        ctx.globalAlpha = 1;
      }
    };

    const loop = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const beginClock = () => { if (!started) { started = true; mountT = performance.now(); cycleStart = mountT; } };

    const frame = (now: number) => {
      raf = 0;
      if (!started) { render(0, now / 1000, true); if (visible) loop(); return; }
      const ph = (now - mountT) / 1000; // continuous wave phase (never resets → smooth)
      let elapsed = now - cycleStart;
      if (elapsed >= CYCLE) { cycleStart = now; lockFired = false; lockT = -1; elapsed = 0; } // restart cycle
      const coh = elapsed < RESOLVE ? eio(elapsed / RESOLVE) : 1;
      if (!lockFired && coh >= 0.8) { lockFired = true; lockT = 0; }
      if (lockT >= 0 && lockT < 1) lockT = Math.min(1, lockT + 0.035);
      const active = elapsed < RESOLVE + 200 || (lockT >= 0 && lockT < 1);
      if (!active && now - lastRender < 33) { if (visible) loop(); return; } // throttle the hold to ~30fps
      lastRender = now;
      render(coh, ph, elapsed < RESOLVE + 200);
      if (visible) loop();
    };

    measure();

    if (reduce) {
      render(1, 0.4, false); // resolved gold, static
      let lastWr = window.innerWidth;
      const onR = () => { if (Math.abs(window.innerWidth - lastWr) >= 1) { lastWr = window.innerWidth; measure(); render(1, 0.4, false); } };
      window.addEventListener("resize", onR);
      return () => window.removeEventListener("resize", onR);
    }

    render(0, 0, true); // static noise first paint

    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) {
        if (!started) {
          if (trigger === "load") { if (!startArmed) { startArmed = true; window.setTimeout(() => { beginClock(); loop(); }, 250); } }
          else beginClock();
        }
        loop();
      } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.15 });
    io.observe(wrap);

    const onVis = () => { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else if (visible) loop(); };
    document.addEventListener("visibilitychange", onVis);

    let lastW = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - lastW) < 1) return; // ignore mobile URL-bar height changes
      lastW = window.innerWidth;
      measure();
      if (!started) render(0, 0, true);
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
    };
  }, [trigger]);

  return (
    <div ref={wrapRef} className={`sig-band${className ? " " + className : ""}`}>
      <canvas ref={canvasRef} className="sig-canvas" aria-hidden />
    </div>
  );
}
