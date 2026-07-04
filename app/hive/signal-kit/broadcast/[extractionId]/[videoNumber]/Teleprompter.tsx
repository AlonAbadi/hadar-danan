// חדר השידור — teleprompter strip pinned to the top of the viewport (nearest
// the iPhone front lens). rAF loop with dt-based movement so Low Power Mode's
// 30fps throttling never changes the reading speed. Vertical scroll only —
// RTL affects typography, not scroll direction.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBroadcastCopy } from "@/lib/broadcast-copy";

const SPEED_STEPS = [40, 55, 70, 90, 115]; // px/s
const SIZE_STEPS = [22, 27, 33];

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
    if (typeof window === "undefined") return 1;
    const saved = Number(localStorage.getItem("broadcast_speed_idx"));
    return Number.isInteger(saved) && saved >= 0 && saved < SPEED_STEPS.length ? saved : 1;
  });
  const [sizeIdx, setSizeIdx] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = Number(localStorage.getItem("broadcast_size_idx"));
    return Number.isInteger(saved) && saved >= 0 && saved < SIZE_STEPS.length ? saved : 1;
  });
  const [paused, setPaused] = useState(false);

  const posRef = useRef(0);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const speedRef = useRef(SPEED_STEPS[speedIdx]);
  speedRef.current = SPEED_STEPS[speedIdx];

  const tick = useCallback((ts: number) => {
    if (!runningRef.current) return;
    const last = lastTsRef.current ?? ts;
    const dt = Math.min((ts - last) / 1000, 0.2);
    lastTsRef.current = ts;
    posRef.current += speedRef.current * dt;
    const el = innerRef.current;
    if (el) {
      const max = el.scrollHeight;
      if (posRef.current > max) posRef.current = max;
      el.style.transform = `translate3d(0, ${-posRef.current}px, 0)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // No early-return guard and always reschedule: the running-prop effect's
  // cleanup cancels the rAF on re-render (React strict ordering), so start()
  // must be safe to call again after its frame was cancelled — this was the
  // "teleprompter doesn't move" bug on the first iPhone QA.
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
        height: "min(34dvh, 300px)",
        background: "rgba(8,12,20,0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        overflow: "hidden",
        zIndex: 20,
        maskImage: "linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 40px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 40px), transparent 100%)",
      }}
    >
      <div
        ref={innerRef}
        style={{
          padding: "28px 24px 240px",
          textAlign: "center",
          fontSize,
          lineHeight: 1.65,
          color: "#EDE9E1",
          fontWeight: 500,
          willChange: "transform",
        }}
      >
        <span style={{ color: "#E8B94A", fontWeight: 700 }}>{hook}</span>{" "}
        <span>{body}</span>
        {cta ? (
          <>
            {" "}
            <span style={{ color: "#E8B94A", fontWeight: 700 }}>{cta}</span>
          </>
        ) : null}
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
        <Pill label="+" onClick={() => setSpeedIdx((i) => Math.min(SPEED_STEPS.length - 1, i + 1))} />
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
