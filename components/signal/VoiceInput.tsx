"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "permission" | "recording" | "transcribing" | "error";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  hasExistingText?: boolean;
}

const MAX_SECONDS  = 120;
const WARN_SECONDS = 90;
const BARS         = 7;

const MIC_TYPES = [
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of MIC_TYPES) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch { /* noop */ }
  }
  return "";
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function VoiceInput({ onTranscript, disabled, hasExistingText }: Props) {
  const [state, setState]         = useState<State>("idle");
  const [seconds, setSeconds]     = useState(0);
  const [bars, setBars]           = useState<number[]>(Array(BARS).fill(0));
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<number | null>(null);
  const animRef     = useRef<number | null>(null);

  function teardown() {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (animRef.current)  { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    recorderRef.current = null;
  }

  useEffect(() => () => teardown(), []);

  useEffect(() => {
    function onHide() {
      if (document.hidden && recorderRef.current?.state === "recording") {
        stopRecording();
      }
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(blob: Blob) {
    setState("transcribing");
    try {
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("audio", blob, `audio.${ext}`);
      const res = await fetch("/api/signal/transcribe", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "service_unconfigured") {
          setErrorMsg("ההקלטה לא זמינה כרגע. אפשר להקליד את התשובה.");
        } else if (data.error === "rate_limited") {
          setErrorMsg("יותר מדי הקלטות. רגע אחד ונסה שוב.");
        } else {
          setErrorMsg("התמלול נכשל. אפשר להקליד את התשובה.");
        }
        setState("error");
        return;
      }
      const { text } = (await res.json()) as { text: string };
      onTranscript(text || "");
      setState("idle");
      setSeconds(0);
      setBars(Array(BARS).fill(0));
    } catch {
      setErrorMsg("בעיית רשת. אפשר להקליד את התשובה.");
      setState("error");
    }
  }

  async function startRecording() {
    setErrorMsg(null);
    setState("permission");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as DOMException)?.name;
      setErrorMsg(
        name === "NotAllowedError"
          ? "אין הרשאה למיקרופון. אפשר להקליד את התשובה."
          : "ההקלטה לא נתמכת בדפדפן הזה. אפשר להקליד את התשובה."
      );
      setState("error");
      return;
    }

    streamRef.current = stream;

    // Analyser
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      analyserRef.current = an;
    } catch { /* analyser is optional */ }

    // Recorder
    const mime = pickMime();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      setErrorMsg("ההקלטה לא נתמכת בדפדפן הזה. אפשר להקליד את התשובה.");
      setState("error");
      teardown();
      return;
    }
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      teardown();
      if (blob.size > 0) upload(blob);
      else {
        setErrorMsg("ההקלטה ריקה. נסה שוב.");
        setState("error");
      }
    };

    recorder.start();
    setState("recording");
    setSeconds(0);

    // Timer
    timerRef.current = window.setInterval(() => {
      setSeconds(s => {
        if (s + 1 >= MAX_SECONDS) {
          window.setTimeout(stopRecording, 0);
        }
        return s + 1;
      });
    }, 1000);

    // Amplitude loop
    const data = new Uint8Array(analyserRef.current?.frequencyBinCount ?? 0);
    function tick() {
      const an = analyserRef.current;
      if (!an) return;
      an.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / BARS));
      const next: number[] = [];
      for (let i = 0; i < BARS; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += data[i * step + j] ?? 0;
        next.push(Math.min(100, (sum / step / 128) * 100));
      }
      setBars(next);
      animRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (r && r.state !== "inactive") r.stop();
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (state === "idle" || state === "permission") {
    const isPerm = state === "permission";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled || isPerm}
          aria-label="הקלט תשובה בקול"
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
            color: "#2a1d05", border: "none", cursor: isPerm ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
            transition: "transform 0.12s ease",
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)"; }}
          onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          onMouseLeave={(e)=> { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          {isPerm ? (
            <div style={{ width: 24, height: 24, border: "3px solid #2a1d05", borderTopColor: "transparent", borderRadius: "50%", animation: "vi-spin 0.8s linear infinite" }} />
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 1.5a3.5 3.5 0 0 0-3.5 3.5v6a3.5 3.5 0 0 0 7 0V5A3.5 3.5 0 0 0 12 1.5z"/>
              <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H8.5a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2H13v-2.07A7 7 0 0 0 19 11z"/>
            </svg>
          )}
        </button>
        <div style={{ fontSize: 14, color: "#EDE9E1", fontWeight: 700, marginTop: 2 }}>
          {isPerm ? "מבקש הרשאה למיקרופון..." : (hasExistingText ? "הוסף הקלטה" : "הקלט תשובה")}
        </div>
        <div style={{ fontSize: 12, color: "#AAB0BD" }}>
          {isPerm ? "" : "או הקלד למטה"}
        </div>
        <style>{`@keyframes vi-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state === "recording") {
    const warning = seconds >= WARN_SECONDS;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "#EF4444",
            animation: "vi-pulse 1.2s ease-in-out infinite",
          }} />
          <span style={{
            color: warning ? "#EF4444" : "#EDE9E1",
            fontSize: 14, fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.04em",
          }}>
            {fmt(seconds)}{warning ? ` / ${fmt(MAX_SECONDS)}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 38 }} aria-hidden>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: 5,
              height: `${Math.max(6, Math.min(38, h * 0.38))}px`,
              background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 100%)",
              borderRadius: 999,
              transition: "height 80ms ease-out",
            }} />
          ))}
        </div>
        <button
          type="button"
          onClick={stopRecording}
          aria-label="עצור הקלטה"
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#EF4444",
            color: "#fff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 24px rgba(239,68,68,0.4)",
          }}
        >
          <div style={{ width: 22, height: 22, background: "#fff", borderRadius: 4 }} />
        </button>
        <div style={{ fontSize: 12, color: "#AAB0BD" }}>לחץ לסיום ההקלטה</div>
        <style>{`@keyframes vi-pulse { 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  if (state === "transcribing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(232,185,74,0.10)",
          border: "1px solid rgba(232,185,74,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 28, height: 28, border: "3px solid #E8B94A", borderTopColor: "transparent", borderRadius: "50%", animation: "vi-spin 0.8s linear infinite" }} />
        </div>
        <div style={{ fontSize: 14, color: "#EDE9E1", fontWeight: 700 }}>ממיר לטקסט...</div>
        <div style={{ fontSize: 12, color: "#AAB0BD" }}>שנייה אחת</div>
        <style>{`@keyframes vi-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // error
  return (
    <div style={{ marginBottom: 22 }}>
      <button
        type="button"
        onClick={() => { setState("idle"); setErrorMsg(null); setSeconds(0); setBars(Array(BARS).fill(0)); }}
        style={{
          width: "100%", padding: "12px 14px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.32)",
          borderRadius: 12,
          color: "#FCA5A5",
          fontSize: 13, lineHeight: 1.5,
          cursor: "pointer",
          textAlign: "right",
          fontFamily: "inherit",
          direction: "rtl",
        }}
      >
        {errorMsg ?? "שגיאה."} <span style={{ color: "#FECACA", textDecoration: "underline", marginInlineStart: 6 }}>נסה שוב</span>
      </button>
    </div>
  );
}
