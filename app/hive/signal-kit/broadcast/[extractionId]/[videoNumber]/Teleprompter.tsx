// חדר השידור — voice-gated teleprompter (the industry model, per the
// five-expert benchmark: BIGVU "pause on silence", PromptSmart's
// wait-don't-guess contract, Teleprompter.com's always-visible live speed
// control, Elgato's fixed read-line):
//
// - CONSTANT smooth scroll at a WPM the user controls with a real slider —
//   no word karaoke, no dictated rhythm.
// - VOICE GATE: while you speak, the text flows; when you pause to breathe
//   or ad-lib, it eases to a stop and waits; when you speak again, it eases
//   back in. Silence is yours. (WebAudio RMS voice activity — no speech
//   recognition, which is banned on iOS Safari here.)
// - Failure bias: if the mic signal is unavailable, the gate stays open and
//   the prompter degrades to a classic constant scroll — never worse.
// - Drag the text to reposition; a plain tap pauses/resumes; the speed row
//   lives OUTSIDE the strip so a mis-tap can't pause you.
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getBroadcastCopy } from "@/lib/broadcast-copy";

const WPM_MIN = 80;
const WPM_MAX = 220;
const WPM_DEFAULT = 130; // recorded-content guidance; Hebrew on-camera sweet spot
const SIZE_STEPS = [34, 40, 48];
const START_GRACE_MS = 900;
const READ_LINE_FRACTION = 0.32;
const STRIP_H = "min(30dvh, 270px)";

// Voice gate (expert VAD spec, essentials): dB-domain adaptive floor with
// hysteresis; hold after ~700ms of silence; eased open/close.
const VAD_ON_DB = 8; // SNR above floor to open
const VAD_OFF_DB = 4; // SNR to stay open
const HANGOVER_MS = 700;
const GATE_OPEN_MS = 300;
const GATE_CLOSE_MS = 400;
const STALE_MS = 400;

export interface TeleprompterHandle {
  start: () => void;
  pause: () => void;
  restart: () => void;
}

export function Teleprompter({
  hook,
  body,
  cta,
  running,
  voiceSamplesRef,
  onRegisterControls,
}: {
  hook: string;
  body: string;
  cta?: string;
  running: boolean;
  voiceSamplesRef?: React.MutableRefObject<readonly { t: number; rms: number }[]>;
  onRegisterControls?: (h: TeleprompterHandle) => void;
}) {
  const [wpm, setWpm] = useState(() => {
    if (typeof window === "undefined") return WPM_DEFAULT;
    const saved = Number(localStorage.getItem("broadcast_wpm"));
    return saved >= WPM_MIN && saved <= WPM_MAX ? saved : WPM_DEFAULT;
  });
  const [sizeIdx, setSizeIdx] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = Number(localStorage.getItem("broadcast_size_idx"));
    return Number.isInteger(saved) && saved >= 0 && saved < SIZE_STEPS.length ? saved : 1;
  });
  const [vadOn, setVadOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("broadcast_vad") !== "off";
  });
  const [paused, setPaused] = useState(false);

  const wordCount = `${hook} ${body} ${cta ?? ""}`.trim().split(/\s+/).filter(Boolean).length;

  const stripRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const posRef = useRef(0);
  const pxPerWordRef = useRef(8);
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;
  const vadOnRef = useRef(vadOn);
  vadOnRef.current = vadOn;

  // gate + VAD state
  const gateRef = useRef(0); // 0..1, eased
  const armedRef = useRef(true); // no motion until the first voice attack
  const speakingRef = useRef(false);
  const lastVoiceAtRef = useRef(0);
  const floorDbRef = useRef(-55);
  const graceLeftRef = useRef(START_GRACE_MS);

  // manual drag
  const dragRef = useRef<{ startY: number; startPos: number; moved: boolean } | null>(null);
  const manualUntilRef = useRef(0);

  // px-per-word calibration from the actual rendered text
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || wordCount === 0) return;
    pxPerWordRef.current = Math.max(el.offsetHeight / wordCount, 1.5);
  }, [wordCount, sizeIdx, hook, body, cta]);

  const tick = useCallback((ts: number) => {
    if (!runningRef.current) return;
    const last = lastTsRef.current ?? ts;
    const dt = Math.min(ts - last, 200);
    lastTsRef.current = ts;

    if (graceLeftRef.current > 0) {
      graceLeftRef.current -= dt;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // ---- voice gate ----
    let gateTarget = 1;
    if (vadOnRef.current) {
      const samples = voiceSamplesRef?.current ?? [];
      const stale = samples.length < 3 || performance.now() - lastSampleWallclock(samples) > STALE_MS;
      if (stale) {
        gateTarget = 1; // no usable mic signal — classic constant scroll
        armedRef.current = false;
      } else {
        const tail = samples.slice(-20); // last ~2s
        const dbs = tail.map((s) => 20 * Math.log10(Math.max(s.rms, 1e-6)));
        const sorted = [...dbs].sort((a, b) => a - b);
        const p20 = sorted[Math.floor(sorted.length * 0.2)];
        // asymmetric floor: falls fast, rises slow
        const f = floorDbRef.current;
        floorDbRef.current =
          p20 < f ? f + (p20 - f) * Math.min(1, dt / 500) : f + (p20 - f) * Math.min(1, dt / 8000);
        floorDbRef.current = Math.min(Math.max(floorDbRef.current, -75), -30);

        const last2 = dbs.slice(-2);
        const snrOn = last2.every((d) => d > floorDbRef.current + VAD_ON_DB);
        const snrOff = dbs.slice(-Math.ceil(HANGOVER_MS / 100)).every((d) => d < floorDbRef.current + VAD_OFF_DB);
        if (!speakingRef.current && snrOn) {
          speakingRef.current = true;
          armedRef.current = false; // first attack releases the prompter
          lastVoiceAtRef.current = ts;
        } else if (speakingRef.current && snrOff) {
          speakingRef.current = false;
        }
        if (speakingRef.current) lastVoiceAtRef.current = ts;
        gateTarget = armedRef.current ? 0 : speakingRef.current ? 1 : 0;
      }
    } else {
      armedRef.current = false;
    }
    const rate = dt / (gateTarget > gateRef.current ? GATE_OPEN_MS : GATE_CLOSE_MS);
    gateRef.current += (gateTarget - gateRef.current) * Math.min(1, rate * 3);
    if (Math.abs(gateTarget - gateRef.current) < 0.02) gateRef.current = gateTarget;

    // ---- constant scroll, gated ----
    if (ts >= manualUntilRef.current) {
      const pxPerSec = (wpmRef.current / 60) * pxPerWordRef.current;
      posRef.current += pxPerSec * gateRef.current * (dt / 1000);
    }
    const inner = innerRef.current;
    if (inner) {
      const max = inner.scrollHeight;
      if (posRef.current > max) posRef.current = max;
      if (posRef.current < 0) posRef.current = 0;
      inner.style.transform = `translate3d(0, ${-posRef.current}px, 0)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [voiceSamplesRef]);

  // Always (re)schedules — React effect cleanup cancels frames on re-render;
  // a guard here would freeze the prompter (QA round 1 lesson).
  const start = useCallback(() => {
    runningRef.current = true;
    lastTsRef.current = null;
    setPaused(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPaused(true);
  }, []);

  const restart = useCallback(() => {
    posRef.current = 0;
    graceLeftRef.current = START_GRACE_MS;
    gateRef.current = 0;
    armedRef.current = true;
    speakingRef.current = false;
    // keep floorDbRef — the room's noise didn't change
    if (innerRef.current) innerRef.current.style.transform = "translate3d(0, 0, 0)";
    lastTsRef.current = null;
  }, []);

  useEffect(() => {
    onRegisterControls?.({ start, pause, restart });
  }, [onRegisterControls, start, pause, restart]);

  useEffect(() => {
    if (running && !paused) {
      start();
    } else if (!running) {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, paused, start]);

  useEffect(() => {
    localStorage.setItem("broadcast_wpm", String(wpm));
  }, [wpm]);
  useEffect(() => {
    localStorage.setItem("broadcast_size_idx", String(sizeIdx));
  }, [sizeIdx]);
  useEffect(() => {
    localStorage.setItem("broadcast_vad", vadOn ? "on" : "off");
  }, [vadOn]);

  // Drag to reposition; plain tap = pause/resume.
  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { startY: e.touches[0].clientY, startPos: posRef.current, moved: false };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.touches[0].clientY - d.startY;
    if (Math.abs(dy) > 8) d.moved = true;
    if (d.moved) {
      posRef.current = Math.max(0, d.startPos - dy);
      manualUntilRef.current = performance.now() + 3600_000; // hold while dragging
      if (innerRef.current) innerRef.current.style.transform = `translate3d(0, ${-posRef.current}px, 0)`;
    }
  };
  const onTouchEnd = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d?.moved) {
      manualUntilRef.current = performance.now() + 1000; // resume auto after 1s
    } else if (runningRef.current) {
      pause();
    } else if (running) {
      start();
    }
  };

  const fontSize = SIZE_STEPS[sizeIdx];

  return (
    <>
      <div
        ref={stripRef}
        dir="rtl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          // desktop fallback (touch devices handled in onTouchEnd)
          if ("ontouchstart" in window) return;
          e.stopPropagation();
          if (runningRef.current) pause();
          else if (running) start();
        }}
        style={{
          position: "absolute",
          top: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          paddingTop: "env(safe-area-inset-top)",
          height: STRIP_H,
          background: "rgba(8,12,20,0.82)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          overflow: "hidden",
          zIndex: 20,
          maskImage:
            "linear-gradient(to bottom, transparent 0, black 9%, black 58%, rgba(0,0,0,0.2) 84%, transparent 98%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, black 9%, black 58%, rgba(0,0,0,0.2) 84%, transparent 98%)",
        }}
      >
        {/* fixed read line — read whatever crosses it */}
        <div
          style={{
            position: "absolute",
            top: `calc(env(safe-area-inset-top) + ${READ_LINE_FRACTION * 100}%)`,
            insetInlineStart: 10,
            insetInlineEnd: 10,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(232,185,74,0.6), transparent)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <div
          ref={innerRef}
          style={{
            paddingTop: `calc(${STRIP_H} * ${READ_LINE_FRACTION} * 0.6)`,
            paddingBottom: 320,
            paddingInline: 20,
            textAlign: "center",
            fontSize,
            lineHeight: 1.5,
            fontWeight: 700,
            color: "#EDE9E1",
            willChange: "transform",
          }}
        >
          <div ref={textRef}>
            <span style={{ color: "#E8B94A" }}>{hook}</span> <span>{body}</span>
            {cta ? (
              <>
                {" "}
                <span style={{ color: "#E8B94A" }}>{cta}</span>
              </>
            ) : null}
          </div>
        </div>
        {paused && running ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#E8B94A",
              fontSize: 15,
              background: "rgba(8,12,20,0.5)",
            }}
          >
            {getBroadcastCopy("room.pause")}
          </div>
        ) : null}
      </div>

      {/* control row — a SIBLING of the strip: taps here can never pause */}
      <div
        dir="rtl"
        style={{
          position: "absolute",
          top: `calc(env(safe-area-inset-top) + ${STRIP_H} + 6px)`,
          insetInlineStart: 12,
          insetInlineEnd: 12,
          zIndex: 21,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px",
          borderRadius: 14,
          background: "rgba(8,12,20,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <span dir="ltr" style={{ color: "#E8B94A", fontSize: 12.5, fontWeight: 700, minWidth: 30, textAlign: "center" }}>
          {wpm}
        </span>
        <input
          type="range"
          min={WPM_MIN}
          max={WPM_MAX}
          step={5}
          value={wpm}
          onChange={(e) => setWpm(Number(e.target.value))}
          aria-label={getBroadcastCopy("room.speed")}
          style={{ flex: 1, accentColor: "#E8B94A", height: 36 }}
        />
        <button
          type="button"
          onClick={() => setVadOn((v) => !v)}
          style={{
            height: 36,
            padding: "0 10px",
            borderRadius: 10,
            border: `1px solid ${vadOn ? "rgba(232,185,74,0.6)" : "rgba(237,233,225,0.2)"}`,
            background: vadOn ? "rgba(232,185,74,0.15)" : "transparent",
            color: vadOn ? "#E8B94A" : "#9E9990",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          עצירה בשקט
        </button>
        <button
          type="button"
          onClick={() => setSizeIdx((i) => (i + 1) % SIZE_STEPS.length)}
          style={{
            width: 44,
            height: 36,
            borderRadius: 10,
            border: "1px solid rgba(232,185,74,0.35)",
            background: "transparent",
            color: "#E8B94A",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          א{fontSize === SIZE_STEPS[2] ? "-" : "+"}
        </button>
      </div>
    </>
  );
}

// Wall-clock age of the newest sample: samples carry t relative to recorder
// start; approximate freshness by array growth instead of absolute clocks.
let lastLen = 0;
let lastLenAt = 0;
function lastSampleWallclock(samples: readonly { t: number; rms: number }[]): number {
  const now = performance.now();
  if (samples.length !== lastLen) {
    lastLen = samples.length;
    lastLenAt = now;
  }
  return lastLenAt;
}
