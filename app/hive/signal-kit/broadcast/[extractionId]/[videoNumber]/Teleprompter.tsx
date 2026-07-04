// חדר השידור — teleprompter strip pinned to the top of the viewport (nearest
// the iPhone front lens).
//
// Behavior modeled on mature teleprompter apps (QA round 2 feedback):
// - Scroll speed is AUTO-CALIBRATED from the script: word count / natural
//   Hebrew speaking pace determines px/s, so the text arrives when the words
//   do. The user control is a gentle multiplier, not an absolute speed.
// - A gold read-line marks where to read; the script starts ON the line.
// - After the countdown there is a grace pause, then the scroll eases in —
//   nothing jumps the moment recording starts.
// - rAF with dt-based movement, so Low Power Mode never changes the pace.
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getBroadcastCopy } from "@/lib/broadcast-copy";

const SPEED_MULTIPLIERS = [0.7, 0.85, 1.0, 1.15, 1.35];
const SIZE_STEPS = [30, 36, 44];
const WORDS_PER_SECOND = 1.7; // deliberate on-camera Hebrew (~100 wpm; BIGVU recommends 120-140 English wpm for recorded content)
const START_GRACE_MS = 1600; // read the first line before anything moves
const RAMP_MS = 1400; // ease from 0 to full speed
const READ_LINE_FRACTION = 0.3; // read-line position inside the strip

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
  onRegisterControls,
}: {
  hook: string;
  body: string;
  cta?: string;
  running: boolean;
  onRegisterControls?: (h: TeleprompterHandle) => void;
}) {
  const [speedIdx, setSpeedIdx] = useState(() => {
    if (typeof window === "undefined") return 2;
    const saved = Number(localStorage.getItem("broadcast_speed_idx"));
    return Number.isInteger(saved) && saved >= 0 && saved < SPEED_MULTIPLIERS.length ? saved : 2;
  });
  const [sizeIdx, setSizeIdx] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = Number(localStorage.getItem("broadcast_size_idx"));
    return Number.isInteger(saved) && saved >= 0 && saved < SIZE_STEPS.length ? saved : 1;
  });
  const [paused, setPaused] = useState(false);

  const posRef = useRef(0);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const startedAtRef = useRef(0); // when the current run began (for grace+ramp)
  const scrolledMsRef = useRef(0); // accumulated active-scroll time across pauses
  const baseSpeedRef = useRef(24); // px/s, auto-calibrated below
  const multiplierRef = useRef(SPEED_MULTIPLIERS[speedIdx]);
  multiplierRef.current = SPEED_MULTIPLIERS[speedIdx];

  const fontSize = SIZE_STEPS[sizeIdx];
  const wordCount = `${hook} ${body} ${cta ?? ""}`.trim().split(/\s+/).length;

  // Auto-calibration: the whole script should finish scrolling past the
  // read-line in the time it takes to SAY it. Distance = the TEXT block only
  // (textRef) — counting the container paddings inflated the speed by up to
  // 2x on short scripts (QA round 4 bug).
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const textHeight = el.offsetHeight;
    const estSpeechSec = Math.max(wordCount / WORDS_PER_SECOND, 8);
    const px = textHeight / estSpeechSec;
    baseSpeedRef.current = Math.min(Math.max(px, 8), 60);
  }, [wordCount, fontSize, hook, body, cta]);

  const tick = useCallback((ts: number) => {
    if (!runningRef.current) return;
    const last = lastTsRef.current ?? ts;
    const dt = Math.min((ts - last) / 1000, 0.2);
    lastTsRef.current = ts;

    const sinceStart = scrolledMsRef.current + (performance.now() - startedAtRef.current);
    if (sinceStart >= START_GRACE_MS) {
      // ease-in ramp after the grace pause
      const ramp = Math.min((sinceStart - START_GRACE_MS) / RAMP_MS, 1);
      posRef.current += baseSpeedRef.current * multiplierRef.current * ramp * dt;
      const el = innerRef.current;
      if (el) {
        const max = el.scrollHeight;
        if (posRef.current > max) posRef.current = max;
        el.style.transform = `translate3d(0, ${-posRef.current}px, 0)`;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Always (re)schedules — React effect cleanup cancels frames on re-render,
  // so a guard here would freeze the prompter (QA round 1 bug).
  const start = useCallback(() => {
    runningRef.current = true;
    lastTsRef.current = null;
    startedAtRef.current = performance.now();
    setPaused(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    scrolledMsRef.current += performance.now() - startedAtRef.current;
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPaused(true);
  }, []);

  const restart = useCallback(() => {
    posRef.current = 0;
    scrolledMsRef.current = 0;
    startedAtRef.current = performance.now();
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
      scrolledMsRef.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, paused, start]);

  useEffect(() => {
    localStorage.setItem("broadcast_speed_idx", String(speedIdx));
  }, [speedIdx]);
  useEffect(() => {
    localStorage.setItem("broadcast_size_idx", String(sizeIdx));
  }, [sizeIdx]);

  return (
    <div
      ref={stripRef}
      dir="rtl"
      onClick={() => (runningRef.current ? pause() : running && start())}
      style={{
        position: "absolute",
        top: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        paddingTop: "env(safe-area-inset-top)",
        height: "min(32dvh, 290px)",
        background: "rgba(8,12,20,0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        overflow: "hidden",
        zIndex: 20,
        maskImage:
          "linear-gradient(to bottom, transparent 0, black 8%, black 52%, rgba(0,0,0,0.18) 78%, transparent 96%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, black 8%, black 52%, rgba(0,0,0,0.18) 78%, transparent 96%)",
      }}
    >
      {/* the read line — read whatever crosses it */}
      <div
        style={{
          position: "absolute",
          top: `calc(env(safe-area-inset-top) + ${READ_LINE_FRACTION * 100}%)`,
          insetInlineStart: 10,
          insetInlineEnd: 10,
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(232,185,74,0.55), transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div
        ref={innerRef}
        style={{
          // first line starts ON the read line; long padding-bottom lets the
          // last line scroll all the way up to it
          paddingTop: `calc(${READ_LINE_FRACTION * 100}% * 0.38)`,
          paddingBottom: 340,
          paddingInline: 22,
          textAlign: "center",
          fontSize,
          lineHeight: 1.5,
          color: "#EDE9E1",
          fontWeight: 600,
          willChange: "transform",
        }}
      >
        <div ref={textRef}>
          <span style={{ color: "#E8B94A", fontWeight: 700 }}>{hook}</span>{" "}
          <span>{body}</span>
          {cta ? (
            <>
              {" "}
              <span style={{ color: "#E8B94A", fontWeight: 700 }}>{cta}</span>
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
      {/* speed / size pills */}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Pill label="-" onClick={() => setSpeedIdx((i) => Math.max(0, i - 1))} />
        <Pill label={getBroadcastCopy("room.speed")} muted />
        <Pill label="+" onClick={() => setSpeedIdx((i) => Math.min(SPEED_MULTIPLIERS.length - 1, i + 1))} />
        <span style={{ width: 10 }} />
        <Pill label="א-" onClick={() => setSizeIdx((i) => Math.max(0, i - 1))} />
        <Pill label={getBroadcastCopy("room.size")} muted />
        <Pill label="א+" onClick={() => setSizeIdx((i) => Math.min(SIZE_STEPS.length - 1, i + 1))} />
      </div>
    </div>
  );
}

function Pill({ label, onClick, muted }: { label: string; onClick?: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: muted ? undefined : 34,
        height: 28,
        padding: "0 8px",
        borderRadius: 14,
        border: muted ? "none" : "1px solid rgba(232,185,74,0.35)",
        background: muted ? "transparent" : "rgba(20,24,32,0.8)",
        color: muted ? "#9E9990" : "#E8B94A",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
