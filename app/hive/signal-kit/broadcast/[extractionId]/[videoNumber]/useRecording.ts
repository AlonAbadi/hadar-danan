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

  // Ordered capture recipes (expert panel): the prize is TRUE PORTRAIT 3:4
  // content (1440x1920 upright) — full vertical sensor FOV, only 25% width
  // lost to the 9:16 crop. iPhone Safari sometimes hands back the LANDSCAPE
  // sensor instead (rotation bookkeeping race), so each recipe is VERIFIED
  // against the actually-delivered frames (videoWidth/Height after settle),
  // never trusted from the request.
  const CAPTURE_RECIPES: { name: string; video: MediaTrackConstraints }[] = [
    {
      name: "A_portrait43",
      video: { facingMode: "user", width: { ideal: 1440 }, height: { ideal: 1920 }, aspectRatio: { ideal: 0.75 }, frameRate: { ideal: 30 } },
    },
    {
      name: "B_exact",
      video: { facingMode: "user", width: { exact: 1440 }, height: { exact: 1920 }, frameRate: { ideal: 30 } },
    },
    {
      name: "C_heightfirst",
      video: { facingMode: "user", height: { ideal: 1920, min: 1600 }, aspectRatio: { ideal: 0.75 }, frameRate: { ideal: 30 } },
    },
    {
      name: "D_1080p",
      video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 }, frameRate: { ideal: 30 } },
    },
  ];
  const AUDIO: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  const measureStream = useCallback(async (stream: MediaStream, settleMs: number) => {
    const probe = document.createElement("video");
    probe.muted = true;
    probe.playsInline = true;
    probe.srcObject = stream;
    await probe.play().catch(() => {});
    await new Promise((r) => setTimeout(r, settleMs));
    const w = probe.videoWidth;
    const h = probe.videoHeight;
    probe.srcObject = null;
    return { w, h };
  }, []);

  // Must be called from a user gesture ("אני מוכנה").
  const requestCamera = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !mimeType) {
      setCameraState("unsupported");
      return;
    }
    setCameraState("requesting");
    const failed: string[] = [];
    let accepted: { stream: MediaStream; recipe: string; w: number; h: number } | null = null;

    for (const recipe of CAPTURE_RECIPES) {
      // determinism: kill the previous track BEFORE re-requesting
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: recipe.video, audio: AUDIO });
      } catch (e) {
        if ((e as Error).name === "NotAllowedError") {
          setCameraState("denied");
          navigator.sendBeacon?.(
            "/api/broadcast/client-event",
            JSON.stringify({ type: "permission_denied" })
          );
          return;
        }
        failed.push(recipe.name);
        continue;
      }
      streamRef.current = stream;
      let { w, h } = await measureStream(stream, 1100);
      if (w > h) {
        // landscape content: one re-assert before giving up on this recipe
        try {
          await stream.getVideoTracks()[0].applyConstraints({ width: 1440, height: 1920, aspectRatio: 0.75 });
          await new Promise((r) => setTimeout(r, 700));
          ({ w, h } = await measureStream(stream, 100));
        } catch { /* keep measured values */ }
      }
      if (h > w) {
        accepted = { stream, recipe: recipe.name, w, h };
        break; // portrait content — take it (h>=1600 is the ideal, any portrait beats landscape)
      }
      failed.push(recipe.name + "_landscape");
      if (recipe === CAPTURE_RECIPES[CAPTURE_RECIPES.length - 1]) {
        // ladder exhausted: keep the landscape stream rather than no camera —
        // the WYSIWYG stage and the blur-pad burn both handle it honestly.
        accepted = { stream, recipe: recipe.name + "_landscape_accepted", w, h };
      } else {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    if (!accepted) {
      setCameraState("denied");
      return;
    }
    streamRef.current = accepted.stream;
    setEffAspect(accepted.h >= accepted.w ? "portrait" : "landscape");

    // Widest zoom the platform allows (iOS 17+; front min is 1.0 — control
    // only tightens, kept for completeness).
    const track = accepted.stream.getVideoTracks()[0];
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
      videoRef.current.srcObject = accepted.stream;
      videoRef.current.play().catch(() => {});
    }
    setCameraState("ready");

    // Field observability: which recipe actually won on which device.
    try {
      const settings = track.getSettings();
      fetch("/api/broadcast/client-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          type: "capture_recipe",
          detail: JSON.stringify({
            recipe: accepted.recipe,
            measured: `${accepted.w}x${accepted.h}`,
            settings: `${settings.width}x${settings.height}`,
            failed,
          }),
        }),
      }).catch(() => {});
    } catch { /* observability never blocks */ }

    try {
      wakeLockRef.current = await (navigator as unknown as {
        wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> };
      }).wakeLock?.request("screen") ?? null;
    } catch { /* iOS < 16.4 — camera capture inhibits auto-lock anyway */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mimeType, measureStream]);

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
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

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 128_000,
    });
    chunksRef.current = [];
    interruptedRef.current = false;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const durationMs = performance.now() - startedAtRef.current;
      if (timerRef.current) clearInterval(timerRef.current);
      if (rmsIntervalRef.current) clearInterval(rmsIntervalRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      setIsRecording(false);

      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      const trims = suggestTrims(rmsRef.current, durationMs);
      onFinishedRef.current({
        blob,
        mimeType,
        durationMs,
        suggestedTrimStartMs: trims?.start ?? null,
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
    setElapsedMs(0);
    timerRef.current = setInterval(
      () => setElapsedMs(performance.now() - startedAtRef.current),
      250
    );
    recorder.start(1000); // 1s timeslice shrinks the unprotected window
    setIsRecording(true);
  }, [mimeType]);

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
