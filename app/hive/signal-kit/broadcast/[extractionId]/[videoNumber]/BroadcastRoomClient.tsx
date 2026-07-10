// חדר השידור — full-viewport client orchestrator.
//
// State machine: prep → room (countdown → recording → review) → processing →
// captions → burning → output. Uploads run in the background through
// uploadManager the moment recording stops; the UI never blocks on them.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBroadcastCopy, setBroadcastGender, type BroadcastGender } from "@/lib/broadcast-copy";
import { Teleprompter, type TeleprompterHandle } from "./Teleprompter";
import { useRecording, type FinishedTake } from "./useRecording";
import { uploadManager, type TakeUpload } from "./uploadManager";
import { ProcessingAndApproval } from "./ProcessingAndApproval";
import { ActionButton, RoomStyles, TopBar } from "./ui";

const KIT_HREF = "/hive/signal-kit";

const MIN_TAKE_MS = 10_000;
const MAX_TAKE_MS = 180_000;
const HARD_STOP_MS = 240_000;

type Phase = "prep" | "room" | "review" | "pipeline";

export interface LocalTake {
  takeId: string;
  blobUrl: string;
  durationMs: number;
  interrupted: boolean;
  outOfRange: boolean;
}

export interface ScriptShape {
  hook: string;
  body: string;
  cta?: string;
}

export function BroadcastRoomClient({
  extractionId,
  videoNumber,
  videoTitle,
  script,
  firstName,
  gender,
}: {
  extractionId: string;
  videoNumber: number;
  videoTitle: string;
  script: ScriptShape;
  firstName: string;
  gender: BroadcastGender;
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  // Set before any child renders so every getBroadcastCopy call resolves
  // against the member's stored gender (users.gender, migration 051).
  setBroadcastGender(gender);
  const [phase, setPhase] = useState<Phase>("prep");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [takes, setTakes] = useState<LocalTake[]>([]);
  const [selectedTakeId, setSelectedTakeId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<TakeUpload[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [pipelineBlobUrl, setPipelineBlobUrl] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const prompterRef = useRef<TeleprompterHandle | null>(null);
  const takeCountRef = useRef(0);
  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const [nativeSheet, setNativeSheet] = useState<"closed" | "loading" | "ready" | "pip">("closed");
  const [floatUrl, setFloatUrl] = useState<string | null>(null);
  const floatVideoRef = useRef<HTMLVideoElement | null>(null);

  // Floating PiP prompter: a real MP4 of the scrolling script — iOS keeps
  // PiP windows alive over other apps, including the native camera.
  const openNativeSheet = useCallback(async () => {
    // CRITICAL: release our camera+mic FIRST. A live getUserMedia session
    // makes iOS treat the page as an active call, and the native camera then
    // refuses to record video ("not available while on a call") and pauses
    // the PiP window.
    rec.releaseCamera();
    setNativeSheet("loading");
    try {
      const wpm = Number(localStorage.getItem("broadcast_wpm")) || 130;
      const res = await fetch("/api/broadcast/prompter-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction_id: extractionId, video_number: videoNumber, wpm }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { url } = await res.json();
      setFloatUrl(url);
      setNativeSheet("ready");
    } catch {
      setFloatUrl(null);
      setNativeSheet("ready"); // still allow filming without the prompter
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractionId, videoNumber]);

  const startPiP = useCallback(async () => {
    const v = floatVideoRef.current;
    if (!v) return;
    try {
      await v.play();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wk = v as any;
      if (typeof wk.webkitSetPresentationMode === "function") {
        wk.webkitSetPresentationMode("picture-in-picture");
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
      }
      setNativeSheet("pip");
    } catch {
      // PiP refused — she can still read from the inline player
      setNativeSheet("pip");
    }
  }, []);

  // Native-camera path: iOS 26 WebKit hands browsers the LANDSCAPE sensor no
  // matter what (verified in the field, Chrome AND Safari), so the only way
  // to the native portrait framing is the native camera itself. The file it
  // returns enters the exact same pipeline (upload, whisper, burn, share).
  const onNativeFile = useCallback(async (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    const durationMs = await new Promise<number>((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve(Number.isFinite(v.duration) ? v.duration * 1000 : 0);
      v.onerror = () => resolve(0);
      v.src = blobUrl;
    });
    const outOfRange = durationMs > 0 && (durationMs < MIN_TAKE_MS || durationMs > MAX_TAKE_MS);
    try {
      const mime = (file.type || "video/mp4").split(";")[0];
      const res = await fetch("/api/broadcast/takes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction_id: extractionId,
          video_number: videoNumber,
          mime_type: mime === "video/quicktime" ? "video/quicktime" : "video/mp4",
        }),
      });
      if (res.status === 409) {
        const code = (await res.json().catch(() => ({})))?.error;
        if (code === "season_full") {
          setBanner(getBroadcastCopy("takes.season_full"));
          return;
        }
        throw new Error("create_409");
      }
      if (!res.ok) throw new Error(`create_${res.status}`);
      const { take_id, object_name, content_type } = await res.json();
      uploadManager.enqueue({
        takeId: take_id,
        blob: file,
        objectName: object_name,
        contentType: content_type,
        durationSeconds: durationMs / 1000,
        suggestedTrimStartMs: null,
        suggestedTrimEndMs: null,
      });
      setTakes((prev) => [
        ...prev,
        { takeId: take_id, blobUrl, durationMs, interrupted: false, outOfRange },
      ]);
      rec.releaseCamera();
      setPhase("review");
      setBanner(null);
    } catch {
      setBanner(getBroadcastCopy("error.upload_retry"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractionId, videoNumber]);

  const onTakeFinished = useCallback(async (take: FinishedTake) => {
    const outOfRange = take.durationMs < MIN_TAKE_MS || take.durationMs > MAX_TAKE_MS;
    takeCountRef.current += 1;
    try {
      const res = await fetch("/api/broadcast/takes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction_id: extractionId,
          video_number: videoNumber,
          mime_type: take.mimeType,
        }),
      });
      if (res.status === 409) {
        const code = (await res.json().catch(() => ({})))?.error;
        if (code === "season_full") {
          setBanner(getBroadcastCopy("takes.season_full"));
          return;
        }
        throw new Error("create_409");
      }
      if (!res.ok) throw new Error(`create_${res.status}`);
      const { take_id, object_name, content_type } = await res.json();
      // Iron rule: upload starts NOW, in the background.
      uploadManager.enqueue({
        takeId: take_id,
        blob: take.blob,
        objectName: object_name,
        contentType: content_type,
        durationSeconds: take.durationMs / 1000,
        suggestedTrimStartMs: take.suggestedTrimStartMs,
        suggestedTrimEndMs: take.suggestedTrimEndMs,
      });
      setTakes((prev) => [
        ...prev,
        {
          takeId: take_id,
          blobUrl: URL.createObjectURL(take.blob),
          durationMs: take.durationMs,
          interrupted: take.interrupted,
          outOfRange,
        },
      ]);
      setPhase("review");
      setBanner(null);
    } catch {
      setBanner(getBroadcastCopy("error.upload_retry"));
      setPhase("review");
    }
  }, [extractionId, videoNumber]);

  const rec = useRecording(onTakeFinished);

  useEffect(() => uploadManager.subscribe(setUploads), []);

  // Hard memory-guard stop.
  useEffect(() => {
    if (rec.isRecording && rec.elapsedMs > HARD_STOP_MS) rec.stopRecording();
  }, [rec, rec.isRecording, rec.elapsedMs]);

  // Revoke blob URLs on unmount.
  useEffect(
    () => () => {
      takes.forEach((t) => URL.revokeObjectURL(t.blobUrl));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Countdown beeps (real teleprompter behavior): short tick per digit, a
  // higher "go" tone at zero, then a beat of silence before the mic opens so
  // the tone is never captured in the take.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beep = useCallback((freq: number, durationMs: number) => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = (window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch { /* sound is a nicety, never a blocker */ }
  }, []);

  const beginCountdown = useCallback(() => {
    if (countdown !== null || rec.isRecording) return;
    setCountdown(3);
    beep(880, 130);
    prompterRef.current?.restart();
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(iv);
        beep(1318, 220); // "go"
        setCountdown(null);
        // one beat of silence: the go-tone dies before the mic opens, and
        // she gets a breath before the prompter's grace period begins
        setTimeout(() => {
          rec.startRecording();
          prompterRef.current?.start();
        }, 350);
      } else {
        beep(880, 130);
        setCountdown(n);
      }
    }, 1000);
  }, [countdown, rec, beep]);

  const stopTake = useCallback(() => {
    prompterRef.current?.pause();
    rec.stopRecording();
  }, [rec]);

  const anotherTake = useCallback(() => {
    setPhase("room");
    if (rec.cameraState !== "ready") rec.requestCamera();
  }, [rec]);

  const selectTake = useCallback(async (takeId: string) => {
    setSelecting(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/broadcast/takes/${takeId}/select`, { method: "POST" });
      if (res.status === 409) {
        const code = (await res.json().catch(() => ({})))?.error;
        setBanner(getBroadcastCopy(code === "season_full" ? "takes.season_full" : "takes.version_limit"));
        return;
      }
      if (!res.ok) throw new Error(`select_${res.status}`);
      const { edit_id } = await res.json();
      rec.releaseCamera();
      setPipelineBlobUrl(takes.find((t) => t.takeId === takeId)?.blobUrl ?? null);
      setEditId(edit_id);
      setPhase("pipeline");
    } catch {
      setBanner(getBroadcastCopy("error.processing_failed"));
    } finally {
      setSelecting(false);
    }
  }, [rec, takes]);

  const shell: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "#080C14",
    height: "100dvh",
    overflow: "hidden",
    color: "#EDE9E1",
    fontFamily: 'var(--font-assistant), "Assistant", Arial, sans-serif',
    touchAction: "manipulation", // kill iOS double-tap zoom inside the room
    overscrollBehavior: "none",
  };

  if (phase === "prep") {
    return (
      <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
        <RoomStyles />
        <PrepScreen
          script={script}
          videoTitle={videoTitle}
          onReady={() => {
            setPhase("room");
            rec.requestCamera();
          }}
        />
      </div>
    );
  }

  if (phase === "pipeline" && editId) {
    return (
      <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
        <RoomStyles />
        <ProcessingAndApproval
          editId={editId}
          localTakeUrl={pipelineBlobUrl}
          script={script}
          firstName={firstName}
          onAnotherTake={() => {
            setEditId(null);
            anotherTake();
          }}
        />
      </div>
    );
  }

  if (rec.cameraState === "unsupported") {
    return (
      <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
        <RoomStyles />
        <TopBar title={getBroadcastCopy("prep.eyebrow")} backHref={KIT_HREF} backLabel="לערכה" />
        <CenteredCard title={getBroadcastCopy("error.unsupported")} />
      </div>
    );
  }

  if (rec.cameraState === "denied") {
    return (
      <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
        <RoomStyles />
        <TopBar title={getBroadcastCopy("prep.eyebrow")} backHref={KIT_HREF} backLabel="לערכה" />
        <PermissionDenied onRetry={rec.requestCamera} />
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
        <RoomStyles />
        <TakeGallery
          takes={takes}
          uploads={uploads}
          selectedTakeId={selectedTakeId}
          onSelect={setSelectedTakeId}
          onConfirm={() => selectedTakeId && selectTake(selectedTakeId)}
          onAnother={anotherTake}
          confirming={selecting}
          banner={banner}
        />
      </div>
    );
  }

  // phase === "room"
  return (
    <div dir="rtl" style={shell} className="font-assistant">
      <RoomStyles />
      {/* WYSIWYG stage: the preview is EXACTLY the 9:16 frame the burn will
          produce (iPhone QA: Safari records the full landscape sensor, so a
          full-bleed preview showed a wider world than the reel — the mismatch
          read as "the video is zoomed in"). What you see is what she gets. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
          }}
        >
          <video
            ref={rec.attachPreview}
            autoPlay
            muted
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              // Full-bleed viewfinder (per Alon): the preview fills the whole
              // screen like a native camera, whatever the sensor delivers.
              // The recorded file keeps the sensor's own frame.
              objectFit: "cover",
              transform: "scaleX(-1)", // selfie mirror; the recorded file stays true
            }}
          />
        </div>
      </div>
      {/* always a way out of the camera, even mid-session */}
      {!rec.isRecording ? (
        <button
          type="button"
          aria-label="יציאה"
          className="br-btn"
          onClick={() => {
            rec.releaseCamera();
            if (takes.length > 0) setPhase("review");
            else window.location.href = KIT_HREF;
          }}
          style={{
            position: "absolute",
            top: "calc(env(safe-area-inset-top) + 10px)",
            insetInlineEnd: 12,
            zIndex: 30,
            width: 38,
            height: 38,
            borderRadius: 19,
            border: "1px solid rgba(237,233,225,0.3)",
            background: "rgba(8,12,20,0.6)",
            color: "#EDE9E1",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      ) : null}
      <Teleprompter
        hook={script.hook}
        body={script.body}
        cta={script.cta}
        voiceSamplesRef={rec.rmsSamplesRef}
        running={rec.isRecording}
        onRegisterControls={(h) => {
          prompterRef.current = h;
        }}
      />
      {countdown !== null ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(8,12,20,0.7)",
          }}
        >
          <span style={{ fontSize: 120, fontWeight: 800, color: "#E8B94A" }}>{countdown}</span>
        </div>
      ) : null}
      {/* bottom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          zIndex: 25,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 18px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          background: "linear-gradient(to top, rgba(8,12,20,0.85), transparent)",
          paddingTop: 40,
        }}
      >
        {rec.isRecording ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(20,24,32,0.85)",
              borderRadius: 16,
              padding: "4px 14px",
              border: "1px solid rgba(232,185,74,0.3)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: rec.elapsedMs > MAX_TAKE_MS ? "#E8B94A" : "#e14848",
                animation: "pulse 1.2s infinite",
              }}
            />
            <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums", fontSize: 15, color: "#EDE9E1" }}>
              {formatMs(rec.elapsedMs)}
            </span>
          </div>
        ) : null}
        {rec.zoom ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ZoomPill
              label="-"
              onClick={() =>
                rec.setCameraZoom(Math.max(rec.zoom!.min, +(rec.zoom!.current - 0.25).toFixed(2)))
              }
            />
            <span style={{ color: "#9E9990", fontSize: 12 }} dir="ltr">
              זום {rec.zoom.current.toFixed(2).replace(/\.?0+$/, "")}x
            </span>
            <ZoomPill
              label="+"
              onClick={() =>
                rec.setCameraZoom(Math.min(rec.zoom!.max, +(rec.zoom!.current + 0.25).toFixed(2)))
              }
            />
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <GhostCircle
            label={getBroadcastCopy("room.restart")}
            onClick={() => prompterRef.current?.restart()}
          />
          <button
            type="button"
            aria-label={rec.isRecording ? "עצירה" : "הקלטה"}
            onClick={rec.isRecording ? stopTake : beginCountdown}
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              border: "3px solid #E8B94A",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: rec.isRecording ? 26 : 54,
                height: rec.isRecording ? 26 : 54,
                borderRadius: rec.isRecording ? 6 : 27,
                background: "#E8B94A",
                transition: "all 0.2s",
              }}
            />
          </button>
          <GhostCircle
            label={getBroadcastCopy("room.pause")}
            onClick={() => prompterRef.current?.pause()}
          />
        </div>
        {!rec.isRecording ? (
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <p style={{ color: "#CDD1DA", fontSize: 12.5, textAlign: "center", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
              {getBroadcastCopy("room.placement_hint")}
            </p>
            <button
              type="button"
              className="br-btn"
              onClick={openNativeSheet}
              style={{
                background: "transparent",
                border: "1px solid rgba(237,233,225,0.3)",
                borderRadius: 999,
                padding: "8px 14px",
                color: "#EDE9E1",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {getBroadcastCopy("room.native_capture")}
            </button>
            {takes.length > 0 ? (
              <button
                type="button"
                onClick={() => setPhase("review")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9E9990",
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                {getBroadcastCopy("takes.title")} ({takes.length})
              </button>
            ) : null}
          </div>
        ) : null}
        {nativeSheet !== "closed" ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              background: "rgba(8,12,20,0.82)",
              display: "flex",
              alignItems: "flex-end",
            }}
            onClick={() => {
              setNativeSheet("closed");
              if (phase === "room") rec.requestCamera();
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: "#141820",
                borderRadius: "18px 18px 0 0",
                padding: "20px 20px calc(env(safe-area-inset-bottom) + 20px)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <p style={{ color: "#EDE9E1", fontSize: 16, fontWeight: 700, textAlign: "center" }}>
                {getBroadcastCopy("room.native_capture")}
              </p>
              {nativeSheet === "loading" ? (
                <p style={{ color: "#9E9990", fontSize: 14, textAlign: "center" }}>
                  <span className="br-spinner br-spinner-gold" /> {getBroadcastCopy("room.float_loading")}
                </p>
              ) : null}
              {floatUrl ? (
                <video
                  ref={floatVideoRef}
                  src={floatUrl}
                  playsInline
                  muted
                  controls={nativeSheet === "pip"}
                  style={{ width: 130, borderRadius: 10, alignSelf: "center", background: "#000" }}
                />
              ) : null}
              {nativeSheet === "ready" && floatUrl ? (
                <button
                  type="button"
                  className="br-btn"
                  onClick={startPiP}
                  style={{
                    minHeight: 50,
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
                    color: "#2a1d05",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {getBroadcastCopy("room.float_ready")}
                </button>
              ) : null}
              {nativeSheet === "pip" || (nativeSheet === "ready" && !floatUrl) ? (
                <button
                  type="button"
                  className="br-btn"
                  onClick={() => nativeInputRef.current?.click()}
                  style={{
                    minHeight: 50,
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
                    color: "#2a1d05",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {getBroadcastCopy("room.float_open_camera")}
                </button>
              ) : null}
              {nativeSheet === "ready" && floatUrl ? (
                <button
                  type="button"
                  className="br-btn"
                  onClick={() => nativeInputRef.current?.click()}
                  style={{
                    minHeight: 46,
                    borderRadius: 12,
                    border: "1px solid rgba(232,185,74,0.4)",
                    background: "transparent",
                    color: "#E8B94A",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {getBroadcastCopy("room.float_skip")}
                </button>
              ) : null}
              <p style={{ color: "#9E9990", fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>
                {getBroadcastCopy("room.float_hint")}
              </p>
            </div>
          </div>
        ) : null}
        <input
          ref={nativeInputRef}
          type="file"
          accept="video/*"
          capture="user"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onNativeFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </div>
  );
}

function PrepScreen({
  script,
  videoTitle,
  onReady,
}: {
  script: ScriptShape;
  videoTitle: string;
  onReady: () => void;
}) {
  return (
    <>
    <TopBar title={getBroadcastCopy("prep.eyebrow")} backHref={KIT_HREF} backLabel="לערכה" />
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 20px 120px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#EDE9E1", margin: "16px 0 4px" }}>
        {videoTitle || getBroadcastCopy("prep.title")}
      </h1>
      <div
        style={{
          background: "#141820",
          border: "1px solid rgba(232,185,74,0.14)",
          borderRadius: 16,
          padding: 24,
          marginTop: 20,
        }}
      >
        <p style={{ color: "#E8B94A", fontWeight: 700, fontSize: 20, lineHeight: 1.6 }}>
          {script.hook}
        </p>
        <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.8, marginTop: 12 }}>
          {script.body}
        </p>
        {script.cta ? (
          <p style={{ color: "#E8B94A", fontWeight: 700, fontSize: 18, marginTop: 12 }}>
            {script.cta}
          </p>
        ) : null}
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {(["prep.tip.eyeline", "prep.tip.one_friend", "prep.tip.no_fixing"] as const).map((k) => (
          <div
            key={k}
            style={{
              background: "#1D2430",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              color: "#CDD1DA",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span style={{ color: "#7FD49B", fontWeight: 700 }}>✓</span>
            {getBroadcastCopy(k)}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          padding: "14px 20px calc(env(safe-area-inset-bottom) + 14px)",
          background: "linear-gradient(to top, #080C14 65%, transparent)",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <ActionButton variant="primary" onClick={onReady}>
            {getBroadcastCopy("prep.cta")}
          </ActionButton>
        </div>
      </div>
    </div>
    </>
  );
}

function TakeGallery({
  takes,
  uploads,
  selectedTakeId,
  onSelect,
  onConfirm,
  onAnother,
  confirming,
  banner,
}: {
  takes: LocalTake[];
  uploads: TakeUpload[];
  selectedTakeId: string | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onAnother: () => void;
  confirming: boolean;
  banner: string | null;
}) {
  const uploadOf = (id: string) => uploads.find((u) => u.takeId === id);
  const selected = takes.find((t) => t.takeId === selectedTakeId);
  const directorLine =
    takes.length >= 5
      ? getBroadcastCopy("director.perfectionism_after_take5")
      : takes.length >= 1
        ? getBroadcastCopy("director.encourage_after_take1")
        : null;
  return (
    <div style={{ padding: "0 0 160px" }}>
      <TopBar title={getBroadcastCopy("takes.title")} backHref={KIT_HREF} backLabel="לערכה" />
      {directorLine ? (
        <p
          style={{
            margin: "12px 20px 0",
            padding: "10px 14px",
            borderInlineStart: "3px solid #E8B94A",
            background: "#141820",
            borderRadius: 8,
            color: "#CDD1DA",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {directorLine}
        </p>
      ) : null}
      {banner ? (
        <p style={{ margin: "12px 20px 0", color: "#E8B94A", fontSize: 14 }}>{banner}</p>
      ) : null}
      <div
        dir="rtl"
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          padding: "20px",
          scrollSnapType: "x mandatory",
        }}
      >
        {takes.map((t, i) => {
          const up = uploadOf(t.takeId);
          const isSel = t.takeId === selectedTakeId;
          return (
            <div
              key={t.takeId}
              onClick={() => onSelect(t.takeId)}
              style={{
                flex: "0 0 auto",
                width: "70vw",
                maxWidth: 300,
                scrollSnapAlign: "center",
                borderRadius: 12,
                overflow: "hidden",
                border: isSel ? "2px solid #E8B94A" : "2px solid #2C323E",
                boxShadow: isSel ? "0 0 30px rgba(232,185,74,0.25)" : undefined,
                position: "relative",
                background: "#141820",
              }}
            >
              <video
                src={t.blobUrl}
                playsInline
                controls
                preload="metadata"
                style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#9E9990",
                }}
              >
                <span>טייק {i + 1}{t.interrupted ? ` · ${getBroadcastCopy("takes.interrupted")}` : ""}</span>
                <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatMs(t.durationMs)}
                </span>
              </div>
              {up && up.state !== "done" ? (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    insetInlineStart: 8,
                    background: "rgba(8,12,20,0.85)",
                    borderRadius: 10,
                    padding: "3px 10px",
                    fontSize: 12,
                    color: up.state === "error" ? "#e14848" : "#E8B94A",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (up.state === "error") uploadManager.retry(t.takeId);
                  }}
                >
                  {up.state === "error"
                    ? getBroadcastCopy("error.upload_retry")
                    : `${getBroadcastCopy("takes.uploading")} ${Math.round(up.progress * 100)}%`}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {selected?.outOfRange ? (
        <p style={{ margin: "0 20px", color: "#E8B94A", fontSize: 14, lineHeight: 1.6 }}>
          {getBroadcastCopy(
            selected.durationMs < MIN_TAKE_MS ? "takes.duration_short" : "takes.duration_long"
          )}
        </p>
      ) : null}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          padding: "14px 20px calc(env(safe-area-inset-bottom) + 14px)",
          background: "linear-gradient(to top, #080C14 70%, transparent)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <ActionButton
          variant="primary"
          busy={confirming}
          busyLabel="הטייק נשלח לבמאית"
          disabled={
            !selectedTakeId ||
            selected?.outOfRange ||
            uploadOf(selectedTakeId ?? "")?.state !== "done"
          }
          onClick={onConfirm}
        >
          {getBroadcastCopy("takes.select_cta")}
        </ActionButton>
        <ActionButton variant="secondary" onClick={onAnother}>
          {getBroadcastCopy("takes.another")}
        </ActionButton>
      </div>
    </div>
  );
}

function PermissionDenied({ onRetry }: { onRetry: () => void }) {
  // Desktop visitors (field case: a member on Windows Chrome) get "film from
  // your phone" as the headline — the browser steps below are iOS-specific.
  const isDesktop =
    typeof navigator !== "undefined" && !/iPhone|iPad|Android/i.test(navigator.userAgent);
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px" }}>
      <div
        style={{
          background: "#141820",
          border: "1px solid rgba(232,185,74,0.14)",
          borderRadius: 16,
          padding: 28,
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#EDE9E1", fontSize: 20, fontWeight: 700 }}>
          {getBroadcastCopy(isDesktop ? "permission.desktop_title" : "permission.title")}
        </h2>
        <p style={{ color: "#CDD1DA", fontSize: 15, lineHeight: 1.7, marginTop: 10 }}>
          {getBroadcastCopy(isDesktop ? "permission.desktop_body" : "permission.body")}
        </p>
        {!isDesktop ? (
          <ol
            style={{
              textAlign: "start",
              color: "#9E9990",
              fontSize: 14,
              lineHeight: 2,
              marginTop: 14,
              paddingInlineStart: 20,
            }}
          >
            <li>{getBroadcastCopy("permission.step1")}</li>
            <li>{getBroadcastCopy("permission.step2")}</li>
            <li>{getBroadcastCopy("permission.step3")}</li>
          </ol>
        ) : null}
        <div style={{ marginTop: 18 }}>
          <ActionButton variant="primary" onClick={onRetry}>
            {getBroadcastCopy("permission.retry")}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function CenteredCard({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
      <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.7 }}>{title}</p>
    </div>
  );
}

function ZoomPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="br-btn"
      style={{
        width: 34,
        height: 28,
        borderRadius: 14,
        border: "1px solid rgba(232,185,74,0.35)",
        background: "rgba(20,24,32,0.8)",
        color: "#E8B94A",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function GhostCircle({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        border: "1px solid rgba(237,233,225,0.25)",
        background: "rgba(237,233,225,0.08)",
        color: "#EDE9E1",
        fontSize: 10,
        lineHeight: 1.1,
        padding: 2,
      }}
    >
      {label}
    </button>
  );
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
