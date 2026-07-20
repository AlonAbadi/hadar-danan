// חדר השידור — camera + MediaRecorder + voice-level analysis lifecycle.
//
// iOS Safari rules baked in here: getUserMedia only inside a user gesture,
// ideal (never exact) constraints, one shared stream for preview + recorder +
// analyser, AudioContext resumed inside the gesture, stop-on-hidden so an
// interruption (call, lock, app switch) salvages the partial take, and all
// tracks stopped on teardown (kills the camera indicator).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2", // Safari iOS >= 14.5
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export interface FinishedTake {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  suggestedTrimStartMs: number | null;
  suggestedTrimEndMs: number | null;
  interrupted: boolean;
}

export type CameraState = "idle" | "requesting" | "ready" | "denied" | "unsupported";

export interface ZoomInfo {
  min: number;
  max: number;
  current: number;
}

export function useRecording(onTakeFinished: (take: FinishedTake) => void) {
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [zoom, setZoom] = useState<ZoomInfo | null>(null);
  const [effAspect, setEffAspect] = useState<"portrait" | "landscape" | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rmsRef = useRef<{ t: number; rms: number }[]>([]);
  const rmsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interruptedRef = useRef(false);
  // Desktop warm-up: recording starts at countdown start so the Mac capture
  // stall (frames freeze for seconds when the recorder attaches — Continuity
  // Camera renegotiation) burns inside the countdown. markGo() stamps the
  // real take start; suggested trims never begin before it.
  const goOffsetRef = useRef(0);
  // Flipped by whichever finish path runs first (onstop or the stop-timeout
  // guard in stopRecording). Whichever wins locks the other out so we never
  // hand off the same take twice.
  const stopHandledRef = useRef(true);
  const onFinishedRef = useRef(onTakeFinished);
  onFinishedRef.current = onTakeFinished;

  const mimeType =
    typeof window !== "undefined" && typeof MediaRecorder !== "undefined"
      ? MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? null
      : null;

  const attachPreview = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  // SINGLE acquisition (field data, iOS 26, Chrome+Safari: every constraint
  // recipe — including full-sensor — returns the LANDSCAPE sensor, so a
  // retry ladder only flashes the camera indicator repeatedly). One request,
  // one gentle re-assert, honest measurement, done. The blur-pad burn and
  // the aspect-aware stage handle whatever arrives.
  const requestCamera = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !mimeType) {
      setCameraState("unsupported");
      return;
    }
    setCameraState("requesting");
    let stream: MediaStream;
    try {
      // Widest FoV recipe (WebKit-source research, 2026-07-20): request the
      // full 4:3 LANDSCAPE format and never mention portrait. Portrait
      // constraints made WebKit center-crop the sensor (~44% of horizontal
      // FoV gone) and sometimes land on a 16:9 preset with less vertical
      // FoV — the "camera too close" complaint. The burn crops its 9:16
      // from the widest buffer instead, which is the FoV ceiling on iOS.
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1440 },
          frameRate: { ideal: 30 },
        },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      setCameraState("denied");
      if ((e as Error).name === "NotAllowedError") {
        navigator.sendBeacon?.(
          "/api/broadcast/client-event",
          JSON.stringify({ type: "permission_denied" })
        );
      }
      return;
    }
    streamRef.current = stream;

    // Measure what actually arrived (never trust the request on iOS).
    const probe = document.createElement("video");
    probe.muted = true;
    probe.playsInline = true;
    probe.srcObject = stream;
    await probe.play().catch(() => {});
    await new Promise((r) => setTimeout(r, 700));
    const w = probe.videoWidth;
    const h = probe.videoHeight;
    probe.srcObject = null;
    setEffAspect(h >= w ? "portrait" : "landscape");

    // Widest zoom the platform allows (front min is 1.0; kept for completeness).
    const track = stream.getVideoTracks()[0];
    try {
      const caps = track.getCapabilities?.() as
        | (MediaTrackCapabilities & { zoom?: { min: number; max: number } })
        | undefined;
      if (caps?.zoom && caps.zoom.max > caps.zoom.min) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min } as any] });
        setZoom({ min: caps.zoom.min, max: caps.zoom.max, current: caps.zoom.min });
      }
    } catch { /* zoom control is a nicety */ }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
    setCameraState("ready");

    // Field observability: what this device/browser actually delivered.
    try {
      const settings = track.getSettings();
      fetch("/api/broadcast/client-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          type: "capture_recipe",
          detail: JSON.stringify({
            recipe: "single_shot",
            measured: `${w}x${h}`,
            settings: `${settings.width}x${settings.height}`,
          }),
        }),
      }).catch(() => {});
    } catch { /* observability never blocks */ }

    try {
      wakeLockRef.current = await (navigator as unknown as {
        wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> };
      }).wakeLock?.request("screen") ?? null;
    } catch { /* iOS < 16.4 — camera capture inhibits auto-lock anyway */ }
  }, [mimeType]);

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return;

    // Belt-and-suspenders finish. iOS Safari MediaRecorder can silently
    // fail to fire `onstop` after `stop()` on the 3rd+ take of a session
    // (memory pressure, orientation change during recording, or the audio
    // context being suspended by the OS). Alon 2026-07-11 hit this at
    // take 3 — the phase stayed "room" forever because `isRecording`
    // depended on `onstop` running.
    //
    // (a) requestData() before stop() forces any pending timeslice chunk
    //     out, so the blob is complete even if onstop misfires.
    // (b) after stop(), watch for onstop to fire within 3s. If it doesn't,
    //     assemble the blob from the accumulated chunks and hand off to
    //     the same onFinished path onstop would have taken. Guarded by
    //     `stopHandledRef` so we never fire twice.
    try { rec.requestData(); } catch { /* browser doesn't support it — harmless */ }
    stopHandledRef.current = false;
    rec.stop();

    setTimeout(() => {
      if (stopHandledRef.current) return; // onstop already ran, we're fine
      stopHandledRef.current = true;
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (rmsIntervalRef.current) { clearInterval(rmsIntervalRef.current); rmsIntervalRef.current = null; }
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      setIsRecording(false);

      const chunks = chunksRef.current;
      chunksRef.current = [];
      const durationMs = performance.now() - startedAtRef.current;
      const type = chunks[0]?.type || rec.mimeType || "video/mp4";
      const blob = new Blob(chunks, { type });
      const trims = suggestTrims(rmsRef.current, durationMs);
      const floor = goOffsetRef.current;
      onFinishedRef.current({
        blob,
        mimeType: type,
        durationMs,
        suggestedTrimStartMs:
          trims || floor > 0 ? Math.max(trims?.start ?? 0, floor) : null,
        suggestedTrimEndMs: trims?.end ?? null,
        interrupted: true, // fell through the guard — mark it so we log it
      });
    }, 3000);
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !mimeType || recorderRef.current?.state === "recording") return;

    // Voice-level analysis on the live stream: suggested cut points only.
    try {
      const Ctx = (window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const ctx = new Ctx();
      ctx.resume().catch(() => {});
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser); // NOT connected to destination (no playback routing)
      const buf = new Uint8Array(analyser.fftSize);
      rmsRef.current = [];
      audioCtxRef.current = ctx;
      rmsIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        rmsRef.current.push({
          t: performance.now() - startedAtRef.current,
          rms: Math.sqrt(sum / buf.length),
        });
      }, 100);
    } catch { /* analysis is optional — never blocks recording */ }

    // Full-sensor streams get more bits so the server downscale stays crisp.
    const trackHeight = stream.getVideoTracks()[0]?.getSettings().height ?? 1920;
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: trackHeight > 2200 ? 8_000_000 : 5_000_000,
      audioBitsPerSecond: 128_000,
    });
    chunksRef.current = [];
    interruptedRef.current = false;
    stopHandledRef.current = false;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      // Guard race with stopRecording's timeout fallback. First writer wins.
      if (stopHandledRef.current) return;
      stopHandledRef.current = true;

      const durationMs = performance.now() - startedAtRef.current;
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (rmsIntervalRef.current) { clearInterval(rmsIntervalRef.current); rmsIntervalRef.current = null; }
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      setIsRecording(false);

      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      const trims = suggestTrims(rmsRef.current, durationMs);
      const floor = goOffsetRef.current;
      onFinishedRef.current({
        blob,
        mimeType,
        durationMs,
        suggestedTrimStartMs:
          trims || floor > 0 ? Math.max(trims?.start ?? 0, floor) : null,
        suggestedTrimEndMs: trims?.end ?? null,
        interrupted: interruptedRef.current,
      });
    };
    recorder.onerror = () => {
      interruptedRef.current = true;
      if (recorder.state !== "inactive") recorder.stop();
    };
    recorderRef.current = recorder;
    startedAtRef.current = performance.now();
    goOffsetRef.current = 0;
    setElapsedMs(0);
    timerRef.current = setInterval(
      () => setElapsedMs(performance.now() - startedAtRef.current),
      250
    );
    recorder.start(1000); // 1s timeslice shrinks the unprotected window
    setIsRecording(true);
  }, [mimeType]);

  // Stamp the real take start ("go") when recording began early (desktop
  // countdown warm-up) — everything before it is countdown, trimmed away.
  const markGo = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      goOffsetRef.current = performance.now() - startedAtRef.current;
    }
  }, []);

  // Interruption: anything that hides the page mid-recording ends the take —
  // the flushed chunks assemble into a playable partial take.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && recorderRef.current?.state === "recording") {
        interruptedRef.current = true;
        recorderRef.current.stop();
      }
      if (document.visibilityState === "visible") {
        // Restore preview if the camera track died while backgrounded.
        const tracks = streamRef.current?.getVideoTracks() ?? [];
        if (cameraState === "ready" && tracks.every((t) => t.readyState === "ended")) {
          requestCamera();
        }
        wakeLockRef.current?.release().catch(() => {});
        (navigator as unknown as {
          wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> };
        }).wakeLock?.request("screen").then((l) => { wakeLockRef.current = l; }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [cameraState, requestCamera]);

  const releaseCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setCameraState("idle");
  }, []);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (rmsIntervalRef.current) clearInterval(rmsIntervalRef.current);
    audioCtxRef.current?.close().catch(() => {});
    wakeLockRef.current?.release().catch(() => {});
  }, []);

  const setCameraZoom = useCallback((value: number) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    track.applyConstraints({ advanced: [{ zoom: value } as any] }).then(
      () => setZoom((z) => (z ? { ...z, current: value } : z)),
      () => {}
    );
  }, []);

  return {
    cameraState,
    isRecording,
    elapsedMs,
    zoom,
    effAspect,
    rmsSamplesRef: rmsRef,
    setCameraZoom,
    mimeSupported: mimeType !== null,
    attachPreview,
    requestCamera,
    releaseCamera,
    startRecording,
    markGo,
    stopRecording,
  };
}

function suggestTrims(
  samples: { t: number; rms: number }[],
  durationMs: number
): { start: number; end: number } | null {
  if (samples.length < 10) return null;
  const sorted = [...samples].map((s) => s.rms).sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.05)];
  const threshold = Math.max(floor * 3, 0.02);
  const sustained = (i: number) =>
    samples.slice(i, i + 2).every((s) => s.rms > threshold);
  let start: number | null = null;
  let end: number | null = null;
  for (let i = 0; i < samples.length - 2; i++) {
    if (sustained(i)) { start = samples[i].t; break; }
  }
  for (let i = samples.length - 3; i >= 0; i--) {
    if (sustained(i)) { end = samples[i + 1].t; break; }
  }
  if (start === null || end === null || end <= start) return null;
  return {
    start: Math.max(0, Math.round(start - 300)),
    end: Math.min(Math.round(durationMs), Math.round(end + 400)),
  };
}
