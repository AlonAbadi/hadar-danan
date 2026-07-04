// חדר השידור — karaoke teleprompter (the pattern of the leading prompter
// apps): words light up at speaking pace, and the scroll FOLLOWS the lit
// word — the reader sets the rhythm mentally against the highlight, not
// against a conveyor belt.
//
// - Pace: word-level schedule. Each word's duration is weighted by its
//   length around a base of ~120 Hebrew wpm (2.0 w/s), the recorded-content
//   sweet spot; the speed control is a live multiplier.
// - Display: large type, ~3 lines visible; past words dim, the current word
//   is gold, upcoming words are bright.
// - Grace: a short beat after the countdown, then the first word lights.
// - rAF + dt everywhere: Low Power Mode cannot change the pace.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBroadcastCopy } from "@/lib/broadcast-copy";

const SPEED_MULTIPLIERS = [0.75, 0.9, 1.0, 1.15, 1.3];
const SIZE_STEPS = [34, 40, 48];
const WORDS_PER_SECOND = 2.0; // ~120 Hebrew wpm
const START_GRACE_MS = 900;
const READ_LINE_FRACTION = 0.32;
const FOLLOW_RATE = 5; // scroll catch-up speed (fraction/s toward target)

export interface TeleprompterHandle {
  start: () => void;
  pause: () => void;
  restart: () => void;
}

interface Word {
  text: string;
  gold: boolean; // hook/cta words render gold when upcoming
  durMs: number;
}

function buildWords(hook: string, body: string, cta: string | undefined, mult: number): Word[] {
  const parts: { text: string; gold: boolean }[] = [];
  hook.trim().split(/\s+/).filter(Boolean).forEach((t) => parts.push({ text: t, gold: true }));
  body.trim().split(/\s+/).filter(Boolean).forEach((t) => parts.push({ text: t, gold: false }));
  (cta ?? "").trim().split(/\s+/).filter(Boolean).forEach((t) => parts.push({ text: t, gold: true }));
  if (!parts.length) return [];
  // Length-weighted schedule, normalized so the average word hits the base pace.
  const weights = parts.map((p) => p.text.length + 2);
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
  const baseMs = 1000 / (WORDS_PER_SECOND * mult);
  return parts.map((p, i) => ({ ...p, durMs: (weights[i] / avg) * baseMs }));
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
  const [wordIdx, setWordIdx] = useState(-1); // -1 = nothing lit yet

  const words = useMemo(
    () => buildWords(hook, body, cta, SPEED_MULTIPLIERS[speedIdx]),
    [hook, body, cta, speedIdx]
  );
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const innerRef = useRef<HTMLDivElement | null>(null);
  const wordEls = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const graceLeftRef = useRef(START_GRACE_MS);
  const accRef = useRef(0);
  const idxRef = useRef(-1);
  const posRef = useRef(0);

  const tick = useCallback((ts: number) => {
    if (!runningRef.current) return;
    const last = lastTsRef.current ?? ts;
    const dt = Math.min(ts - last, 200);
    lastTsRef.current = ts;

    if (graceLeftRef.current > 0) {
      graceLeftRef.current -= dt;
    } else {
      const w = wordsRef.current;
      if (idxRef.current < 0) {
        idxRef.current = 0;
        setWordIdx(0);
      }
      accRef.current += dt;
      while (idxRef.current < w.length - 1 && accRef.current >= w[idxRef.current].durMs) {
        accRef.current -= w[idxRef.current].durMs;
        idxRef.current += 1;
        setWordIdx(idxRef.current);
      }
    }

    // Scroll follows the lit word: ease toward keeping it on the read line.
    const inner = innerRef.current;
    const el = idxRef.current >= 0 ? wordEls.current[idxRef.current] : null;
    if (inner && el) {
      const strip = inner.parentElement!;
      const readLine = strip.clientHeight * READ_LINE_FRACTION;
      const target = Math.max(0, el.offsetTop - readLine);
      posRef.current += (target - posRef.current) * Math.min(1, (dt / 1000) * FOLLOW_RATE);
      inner.style.transform = `translate3d(0, ${-posRef.current}px, 0)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Always (re)schedules — React effect cleanup cancels frames on re-render;
  // a guard here would freeze the prompter (learned in QA round 1).
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
    idxRef.current = -1;
    accRef.current = 0;
    graceLeftRef.current = START_GRACE_MS;
    posRef.current = 0;
    setWordIdx(-1);
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
    localStorage.setItem("broadcast_speed_idx", String(speedIdx));
  }, [speedIdx]);
  useEffect(() => {
    localStorage.setItem("broadcast_size_idx", String(sizeIdx));
  }, [sizeIdx]);

  const fontSize = SIZE_STEPS[sizeIdx];

  return (
    <div
      dir="rtl"
      onClick={() => (runningRef.current ? pause() : running && start())}
      style={{
        position: "absolute",
        top: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        paddingTop: "env(safe-area-inset-top)",
        height: "min(30dvh, 270px)",
        background: "rgba(8,12,20,0.82)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        overflow: "hidden",
        zIndex: 20,
        maskImage:
          "linear-gradient(to bottom, transparent 0, black 9%, black 56%, rgba(0,0,0,0.15) 82%, transparent 97%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, black 9%, black 56%, rgba(0,0,0,0.15) 82%, transparent 97%)",
      }}
    >
      <div
        ref={innerRef}
        style={{
          paddingTop: `calc(min(30dvh, 270px) * ${READ_LINE_FRACTION} * 0.5)`,
          paddingBottom: 320,
          paddingInline: 20,
          textAlign: "center",
          fontSize,
          lineHeight: 1.45,
          fontWeight: 700,
          willChange: "transform",
        }}
      >
        {words.map((w, i) => {
          const isPast = wordIdx >= 0 && i < wordIdx;
          const isNow = i === wordIdx;
          return (
            <span key={i}>
              <span
                ref={(el) => { wordEls.current[i] = el; }}
                style={{
                  display: "inline-block",
                  color: isNow
                    ? "#080C14"
                    : isPast
                      ? "rgba(237,233,225,0.32)"
                      : w.gold
                        ? "#E8B94A"
                        : "#EDE9E1",
                  background: isNow ? "#E8B94A" : "transparent",
                  borderRadius: isNow ? 8 : 0,
                  padding: isNow ? "0 6px" : 0,
                  margin: isNow ? "0 -6px" : 0,
                  transition: "color 0.12s, background 0.12s",
                }}
              >
                {w.text}
              </span>{" "}
            </span>
          );
        })}
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
