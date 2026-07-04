// חדר השידור — full-viewport client orchestrator.
//
// State machine: prep → room (countdown → recording → review) → processing →
// captions → burning → output. Uploads run in the background through
// uploadManager the moment recording stops; the UI never blocks on them.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getBroadcastCopy, setBroadcastGender, type BroadcastGender } from "@/lib/broadcast-copy";
import { Teleprompter, type TeleprompterHandle } from "./Teleprompter";
import { useRecording, type FinishedTake } from "./useRecording";
import { uploadManager, type TakeUpload } from "./uploadManager";
import { ProcessingAndApproval } from "./ProcessingAndApproval";

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
  const [banner, setBanner] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const prompterRef = useRef<TeleprompterHandle | null>(null);
  const takeCountRef = useRef(0);

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

  const beginCountdown = useCallback(() => {
    if (countdown !== null || rec.isRecording) return;
    setCountdown(3);
    prompterRef.current?.restart();
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(iv);
        setCountdown(null);
        rec.startRecording();
        prompterRef.current?.start();
      } else {
        setCountdown(n);
      }
    }, 1000);
  }, [countdown, rec]);

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
        setBanner(getBroadcastCopy("takes.version_limit"));
        return;
      }
      if (!res.ok) throw new Error(`select_${res.status}`);
      const { edit_id } = await res.json();
      rec.releaseCamera();
      setEditId(edit_id);
      setPhase("pipeline");
    } catch {
      setBanner(getBroadcastCopy("error.processing_failed"));
    } finally {
      setSelecting(false);
    }
  }, [rec]);

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
        <ProcessingAndApproval
          editId={editId}
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
        <CenteredCard title={getBroadcastCopy("error.unsupported")} />
      </div>
    );
  }

  if (rec.cameraState === "denied") {
    return (
      <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
        <PermissionDenied onRetry={rec.requestCamera} />
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
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
          objectFit: "cover",
          transform: "scaleX(-1)", // selfie mirror; the recorded file stays true
        }}
      />
      <Teleprompter
        hook={script.hook}
        body={script.body}
        cta={script.cta}
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
        {takes.length > 0 && !rec.isRecording ? (
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
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 120px" }}>
      <Link
        href="/hive/signal-kit"
        style={{ color: "#9E9990", fontSize: 14, textDecoration: "none" }}
      >
        → חזרה
      </Link>
      <p
        style={{
          fontSize: 11,
          letterSpacing: 1.6,
          color: "#C9964A",
          marginTop: 24,
          fontWeight: 600,
        }}
      >
        {getBroadcastCopy("prep.eyebrow")}
      </p>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#EDE9E1", margin: "8px 0 4px" }}>
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
        <button
          type="button"
          onClick={onReady}
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "0 auto",
            display: "block",
            height: 52,
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
            color: "#2a1d05",
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {getBroadcastCopy("prep.cta")}
        </button>
      </div>
    </div>
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
    <div style={{ padding: "24px 0 140px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#EDE9E1", padding: "0 20px" }}>
        {getBroadcastCopy("takes.title")}
      </h2>
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
        <button
          type="button"
          disabled={
            !selectedTakeId ||
            confirming ||
            selected?.outOfRange ||
            uploadOf(selectedTakeId ?? "")?.state !== "done"
          }
          onClick={onConfirm}
          style={{
            height: 52,
            borderRadius: 12,
            border: "none",
            background:
              selectedTakeId && !selected?.outOfRange && uploadOf(selectedTakeId)?.state === "done"
                ? "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)"
                : "#2C323E",
            color:
              selectedTakeId && !selected?.outOfRange && uploadOf(selectedTakeId)?.state === "done"
                ? "#2a1d05"
                : "#9E9990",
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {confirming ? "..." : getBroadcastCopy("takes.select_cta")}
        </button>
        <button
          type="button"
          onClick={onAnother}
          style={{
            height: 48,
            borderRadius: 12,
            border: "1px solid rgba(232,185,74,0.4)",
            background: "transparent",
            color: "#E8B94A",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {getBroadcastCopy("takes.another")}
        </button>
      </div>
    </div>
  );
}

function PermissionDenied({ onRetry }: { onRetry: () => void }) {
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
          {getBroadcastCopy("permission.title")}
        </h2>
        <p style={{ color: "#CDD1DA", fontSize: 15, lineHeight: 1.7, marginTop: 10 }}>
          {getBroadcastCopy("permission.body")}
        </p>
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
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 18,
            height: 48,
            width: "100%",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
            color: "#2a1d05",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {getBroadcastCopy("permission.retry")}
        </button>
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
