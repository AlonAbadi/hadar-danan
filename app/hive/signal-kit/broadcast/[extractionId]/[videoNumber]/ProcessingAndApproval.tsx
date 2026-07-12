// חדר השידור — pipeline screens: "הבמאית עורכת" status, caption approval
// (the human gate: nothing burns without approval), and the output screen.
//
// UX contract (QA round 3): every screen has a TopBar with a way back, every
// long task shows live progress, and no state is ever a dead end — the
// handoff screen keeps checking and flows into the output on its own.
// Status transport: polling is the GUARANTEE (5s interval + on visibility),
// Realtime is the accelerator.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { getBroadcastCopy } from "@/lib/broadcast-copy";
import { scriptToLines, type CaptionLine, type CaptionsPayload, type CaptionTransform } from "@/lib/broadcast/captions";
import type { ScriptShape } from "./BroadcastRoomClient";
import { ActionButton, TopBar } from "./ui";

const POLL_MS = 5000;
const HANDOFF_MS = 90_000;
// Direct to /kaveret to kill the /hive/signal-kit → /kaveret redirect bounce
// (Alon 2026-07-11).
const KIT_HREF = "/kaveret";

interface EditSnapshot {
  status: "queued" | "transcribing" | "awaiting_captions" | "burning" | "ready" | "failed";
  error_detail: string | null;
  captions: CaptionsPayload | null;
  trim_start_ms: number | null;
  trim_end_ms: number | null;
  take_preview_url: string | null;
  take_media_url: string | null;
  output_url: string | null;
  output_download_url: string | null;
  cover_frames: string[] | null;
  cover_url: string | null;
  cover_download_url: string | null;
}

function useEditStatus(editId: string) {
  const [snap, setSnap] = useState<EditSnapshot | null>(null);
  const snapRef = useRef<EditSnapshot | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/broadcast/edits/${editId}`);
      if (!res.ok) return;
      const data = (await res.json()) as EditSnapshot;
      snapRef.current = data;
      setSnap(data);
    } catch { /* next poll covers it */ }
  }, [editId]);

  useEffect(() => {
    refresh();
    const iv = setInterval(() => {
      const s = snapRef.current?.status;
      if (s !== "ready" && s !== "failed") refresh();
    }, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);

    // Realtime accelerator — read-only, own-row, single-row filter.
    const supabase = createBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      supabase.realtime.setAuth(token);
      channel = supabase
        .channel(`edit-${editId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "broadcast_edits", filter: `id=eq.${editId}` },
          () => refresh()
        )
        .subscribe((state) => {
          if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
            navigator.sendBeacon?.(
              "/api/broadcast/client-event",
              JSON.stringify({ type: "realtime_fallback_to_poll", edit_id: editId })
            );
          }
        });
    });

    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      if (channel) supabase.removeChannel(channel);
    };
  }, [editId, refresh]);

  return { snap, refresh };
}

export function ProcessingAndApproval({
  editId,
  localTakeUrl,
  script,
  onAnotherTake,
}: {
  editId: string;
  localTakeUrl?: string | null;
  script: ScriptShape;
  firstName: string;
  onAnotherTake: () => void;
}) {
  const { snap, refresh } = useEditStatus(editId);

  if (!snap || snap.status === "queued" || snap.status === "transcribing") {
    return <StageScreen stage="transcribing" onAnotherTake={onAnotherTake} />;
  }
  if (snap.status === "awaiting_captions") {
    return (
      <CaptionApproval
        editId={editId}
        snap={snap}
        localTakeUrl={localTakeUrl}
        script={script}
        onApproved={refresh}
      />
    );
  }
  if (snap.status === "burning") {
    return <BurningScreen editId={editId} onAnotherTake={onAnotherTake} />;
  }
  if (snap.status === "ready") {
    return <OutputScreen editId={editId} snap={snap} onAnotherTake={onAnotherTake} onReopened={refresh} />;
  }
  // failed — never a dead end: retry path + way home
  return (
    <>
      <TopBar title={getBroadcastCopy("processing.title")} backHref={KIT_HREF} backLabel="לפרקים שלי" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.8 }}>
          {getBroadcastCopy("error.processing_failed")}
        </p>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          <ActionButton variant="primary" onClick={onAnotherTake}>
            {getBroadcastCopy("takes.another")}
          </ActionButton>
        </div>
      </div>
    </>
  );
}

// Live stage board: elapsed timer so a longer edit never looks stuck.
function StageScreen({
  stage,
  onAnotherTake,
}: {
  stage: "transcribing" | "burning";
  onAnotherTake?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const stages = [
    { key: "transcribing", label: getBroadcastCopy("processing.stage.transcribing") },
    { key: "awaiting_captions", label: getBroadcastCopy("processing.stage.awaiting_captions") },
    { key: "burning", label: getBroadcastCopy("processing.stage.burning") },
  ];
  const activeIdx = stage === "transcribing" ? 0 : 2;
  return (
    <>
      <TopBar title={getBroadcastCopy("processing.title")} backHref={KIT_HREF} backLabel="לפרקים שלי" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ color: "#9E9990", fontSize: 14, textAlign: "center" }}>
          {getBroadcastCopy("director.breathing")}
        </p>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {stages.map((s, i) => (
            <div
              key={s.key}
              style={{
                background: "#141820",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: i > activeIdx ? 0.45 : 1,
              }}
            >
              {i < activeIdx ? (
                <span style={{ color: "#7FD49B", fontWeight: 700 }}>✓</span>
              ) : i === activeIdx ? (
                <span className="br-spinner br-spinner-gold" />
              ) : (
                <span style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid #2C323E" }} />
              )}
              <span style={{ color: i === activeIdx ? "#EDE9E1" : "#9E9990", fontSize: 15, flex: 1 }}>
                {s.label}
              </span>
              {i === activeIdx ? (
                <span dir="ltr" style={{ color: "#9E9990", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                  {elapsed}s
                </span>
              ) : null}
            </div>
          ))}
        </div>
        {onAnotherTake ? (
          <div style={{ marginTop: 28 }}>
            <ActionButton variant="ghost" onClick={onAnotherTake}>
              {getBroadcastCopy("takes.another")}
            </ActionButton>
          </div>
        ) : null}
      </div>
    </>
  );
}

function BurningScreen({ editId, onAnotherTake }: { editId: string; onAnotherTake: () => void }) {
  const [handoff, setHandoff] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setHandoff(true);
      fetch(`/api/broadcast/edits/${editId}/notify`, { method: "POST" }).catch(() => {});
    }, HANDOFF_MS);
    return () => clearTimeout(t);
  }, [editId]);

  if (handoff) {
    // Not a dead end: keeps checking (parent polling), says so, and offers
    // the way back. The moment the burn finishes this flows into the output.
    return (
      <>
        <TopBar title={getBroadcastCopy("processing.title")} backHref={KIT_HREF} backLabel="לפרקים שלי" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
          <h2 style={{ color: "#EDE9E1", fontSize: 20, fontWeight: 700, lineHeight: 1.7 }}>
            {getBroadcastCopy("processing.handoff")}
          </h2>
          <p
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#9E9990",
              fontSize: 14,
            }}
          >
            <span className="br-live-dot" /> ממשיכה לבדוק ברקע, המסך יתעדכן לבד
          </p>
          <p style={{ color: "#9E9990", fontSize: 13, marginTop: 8 }}>
            {getBroadcastCopy("processing.handoff_note")}
          </p>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            <ActionButton variant="secondary" href={KIT_HREF}>
              חזרה לערכת האות
            </ActionButton>
          </div>
        </div>
      </>
    );
  }
  return <StageScreen stage="burning" onAnotherTake={onAnotherTake} />;
}

function CaptionApproval({
  editId,
  snap,
  localTakeUrl,
  script,
  onApproved,
}: {
  editId: string;
  snap: EditSnapshot;
  localTakeUrl?: string | null;
  script: ScriptShape;
  onApproved: () => void;
}) {
  // Local blob first: it plays instantly. Without one (resume / re-edit),
  // the same-origin streaming proxy — non-Safari iOS browsers refuse to
  // stream cross-origin signed storage URLs in <video> (QA-proven CriOS
  // quirk), and same-origin bytes also keep canvas thumbnails untainted.
  // The raw signed URL is the last resort for old snapshots.
  const previewSrc = localTakeUrl ?? snap.take_media_url ?? snap.take_preview_url;
  const transcriptFailed =
    !snap.captions || snap.captions.source === "none" || !snap.captions.lines.length;
  const [mode, setMode] = useState<"captions" | "none" | "script_sync" | null>(
    transcriptFailed ? null : "captions"
  );
  const [lines, setLines] = useState<CaptionLine[]>(snap.captions?.lines ?? []);
  const [trimStart, setTrimStart] = useState(snap.trim_start_ms ?? 0);
  const [trimEnd, setTrimEnd] = useState(snap.trim_end_ms ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [syncIdx, setSyncIdx] = useState(0);
  const [transform, setTransform] = useState<CaptionTransform>(
    () => snap.captions?.transform ?? { z: 1, cx: 0.5, cy: 0.5 }
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/broadcast/edits/${editId}/captions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode ?? "none",
          lines: mode === "none" ? [] : lines,
          trim_start_ms: trimStart,
          trim_end_ms: trimEnd,
          transform,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onApproved();
    } catch {
      setSubmitting(false);
    }
  }, [editId, mode, lines, trimStart, trimEnd, transform, onApproved]);

  // Fallback chooser when transcription failed.
  if (transcriptFailed && mode === null) {
    return (
      <>
        <TopBar title={getBroadcastCopy("captions.title")} backHref={KIT_HREF} backLabel="לפרקים שלי" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
          <h2 style={{ color: "#EDE9E1", fontSize: 20, fontWeight: 700, textAlign: "center" }}>
            {getBroadcastCopy("captions.failed.title")}
          </h2>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <ActionButton variant="secondary" onClick={() => setMode("none")}>
              {getBroadcastCopy("captions.failed.option_none")}
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => {
                setLines(
                  scriptToLines([script.hook, script.body, script.cta].filter(Boolean).join("\n"))
                );
                setSyncIdx(0);
                setMode("script_sync");
              }}
            >
              {getBroadcastCopy("captions.failed.option_script")}
            </ActionButton>
          </div>
        </div>
      </>
    );
  }

  // Manual sync mode: she plays the take and taps "השורה הבאה" per line.
  if (mode === "script_sync") {
    const done = syncIdx >= lines.length;
    return (
      <>
        <TopBar
          title={getBroadcastCopy("captions.title")}
          onBack={() => setMode(null)}
          backLabel="לבחירה"
        />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 140px" }}>
          {previewSrc ? (
            <video
              ref={videoRef}
              src={previewSrc}
              playsInline
              controls
              style={portraitPreview("34dvh", 0, true)}
            />
          ) : null}
          <div style={{ marginTop: 16 }}>
            {lines.map((l, i) => (
              <p
                key={l.id}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: i === syncIdx ? "#1D2430" : "transparent",
                  color: i < syncIdx ? "#7FD49B" : i === syncIdx ? "#EDE9E1" : "#9E9990",
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                {l.text}
              </p>
            ))}
          </div>
          <div style={stickyBar}>
            {!done ? (
              <ActionButton
                variant="primary"
                onClick={() => {
                  const t = Math.round((videoRef.current?.currentTime ?? 0) * 1000);
                  setLines((prev) =>
                    prev.map((l, i) => {
                      if (i === syncIdx)
                        return { ...l, start_ms: i === 0 ? Math.max(0, t - 400) : l.start_ms, end_ms: t };
                      if (i === syncIdx + 1) return { ...l, start_ms: t };
                      return l;
                    })
                  );
                  setSyncIdx((i) => i + 1);
                }}
              >
                {getBroadcastCopy("captions.sync.next_line")} ({syncIdx + 1}/{lines.length})
              </ActionButton>
            ) : (
              <ActionButton variant="primary" busy={submitting} onClick={submit}>
                {getBroadcastCopy("captions.approve_cta")}
              </ActionButton>
            )}
          </div>
        </div>
      </>
    );
  }

  // mode === "none" confirmation, or the standard caption editor.
  if (mode === "none") {
    return (
      <>
        <TopBar
          title={getBroadcastCopy("captions.title")}
          onBack={() => setMode(null)}
          backLabel="לבחירה"
        />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.8 }}>
            {getBroadcastCopy("captions.failed.option_none")}
          </p>
          <div style={{ marginTop: 20 }}>
            <ActionButton variant="primary" busy={submitting} onClick={submit}>
              {getBroadcastCopy("captions.approve_cta")}
            </ActionButton>
          </div>
        </div>
      </>
    );
  }

  const visible = lines.filter((l) => !l.deleted);
  return (
    <>
      <TopBar title={getBroadcastCopy("captions.title")} backHref={KIT_HREF} backLabel="לפרקים שלי" />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 140px" }}>
        <p style={{ color: "#9E9990", fontSize: 13 }}>{getBroadcastCopy("captions.hint")}</p>
        {previewSrc ? (
          <ZoomPanPreview
            src={previewSrc}
            videoRef={previewRef}
            transform={transform}
            onChange={setTransform}
          />
        ) : null}
        {/* WhatsApp-style trim: frame strip + draggable start/end handles */}
        {previewSrc ? (
          <FilmstripTrimmer
            src={previewSrc}
            trimStart={trimStart}
            trimEnd={trimEnd}
            previewRef={previewRef}
            onDuration={(d) => {
              setTrimEnd((prev) => (prev > 0 ? Math.min(prev, d) : d));
              setTrimStart((prev) => Math.min(prev, Math.max(0, d - 1000)));
            }}
            onChange={(s, e) => {
              setTrimStart(s);
              setTrimEnd(e);
            }}
          />
        ) : null}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((l) => (
            <div
              key={l.id}
              style={{
                background: "#141820",
                borderRadius: 10,
                padding: 10,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <textarea
                dir="auto"
                value={l.text}
                rows={1}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((x) => (x.id === l.id ? { ...x, text: e.target.value, edited: true } : x))
                  )
                }
                style={{
                  flex: 1,
                  background: "#1D2430",
                  border: "1px solid #2C323E",
                  borderRadius: 8,
                  color: "#EDE9E1",
                  fontSize: 16,
                  lineHeight: 1.6,
                  padding: "8px 10px",
                  resize: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                aria-label={getBroadcastCopy("captions.delete_line")}
                className="br-btn"
                onClick={() =>
                  setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, deleted: true } : x)))
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid #2C323E",
                  background: "transparent",
                  color: "#9E9990",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={stickyBar}>
          <ActionButton
            variant="primary"
            busy={submitting}
            disabled={visible.length === 0}
            onClick={submit}
          >
            {getBroadcastCopy("captions.approve_cta")}
          </ActionButton>
        </div>
      </div>
    </>
  );
}

// WhatsApp-style trimmer: a strip of frames from the take with two draggable
// gold handles. Dragging a handle seeks the preview player to that exact
// moment so the cut point is chosen by eye, not by numbers. The video time
// axis always runs left-to-right (dir="ltr") even on this RTL page.
const THUMB_COUNT = 8;
const MIN_SELECTION_MS = 1000;
const HANDLE_W = 22;

function FilmstripTrimmer({
  src,
  trimStart,
  trimEnd,
  previewRef,
  onDuration,
  onChange,
}: {
  src: string;
  trimStart: number;
  trimEnd: number;
  previewRef: React.RefObject<HTMLVideoElement | null>;
  onDuration: (durationMs: number) => void;
  onChange: (startMs: number, endMs: number) => void;
}) {
  const [durationMs, setDurationMs] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const boundsRef = useRef({ start: trimStart, end: trimEnd, duration: 0 });
  boundsRef.current = { start: trimStart, end: trimEnd, duration: durationMs };

  // Duration truth ladder: the hidden thumbnail video when it loads, else
  // the MAIN preview player. iOS Safari does not load detached <video>
  // elements reliably — the element must live in the DOM (offscreen) and be
  // load()ed explicitly, every seek needs a timeout, and even then the main
  // player is the fallback that keeps the handles alive with no thumbnails.
  const reportDuration = useCallback(
    (ms: number) => {
      setDurationMs((prev) => {
        if (prev > 0 || ms <= 0) return prev;
        onDuration(ms);
        return ms;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const iv = setInterval(() => {
      const d = previewRef.current?.duration;
      if (d && isFinite(d) && d > 0) reportDuration(Math.round(d * 1000));
      if (boundsRef.current.duration > 0) clearInterval(iv);
    }, 400);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;";
    document.body.appendChild(video);
    video.src = src;
    video.load();

    const withTimeout = <T,>(p: Promise<T>, ms: number) =>
      Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

    const seekTo = (t: number) =>
      withTimeout(
        new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
          video.currentTime = t;
        }),
        2000
      );

    (async () => {
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error("thumb_load"));
        }),
        8000
      );
      // Chrome MediaRecorder webm reports Infinity until forced to the end.
      if (!isFinite(video.duration)) {
        await withTimeout(
          new Promise<void>((resolve) => {
            video.ondurationchange = () => isFinite(video.duration) && resolve();
            video.currentTime = 1e7;
          }),
          4000
        );
      }
      const dur = video.duration;
      if (cancelled || !isFinite(dur) || dur <= 0) return;
      reportDuration(Math.round(dur * 1000));

      const canvas = document.createElement("canvas");
      canvas.width = 72;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const collected: string[] = [];
      for (let i = 0; i < THUMB_COUNT; i++) {
        await seekTo(((i + 0.5) / THUMB_COUNT) * dur);
        if (cancelled) return;
        try {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const scale = Math.max(canvas.width / vw, canvas.height / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          ctx.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
          collected.push(canvas.toDataURL("image/jpeg", 0.55));
        } catch {
          return; // CORS-tainted canvas — strip stays as dark placeholders
        }
        setThumbs([...collected]);
      }
    })().catch(() => {
      /* thumbnails are decorative; the preview-player fallback owns duration */
    });
    return () => {
      cancelled = true;
      video.removeAttribute("src");
      video.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const msFromClientX = (clientX: number) => {
    const rect = stripRef.current?.getBoundingClientRect();
    const { duration } = boundsRef.current;
    if (!rect || !duration) return 0;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(frac * duration);
  };

  const seekPreview = (ms: number) => {
    const v = previewRef.current;
    if (v && Math.abs(v.currentTime * 1000 - ms) > 80) {
      v.pause();
      v.currentTime = ms / 1000;
    }
  };

  const startDrag = (which: "start" | "end") => (down: React.PointerEvent<HTMLDivElement>) => {
    down.preventDefault();
    const el = down.currentTarget;
    el.setPointerCapture(down.pointerId);
    const onMove = (e: PointerEvent) => {
      const ms = msFromClientX(e.clientX);
      const { start, end, duration } = boundsRef.current;
      if (which === "start") {
        const next = Math.min(ms, end - MIN_SELECTION_MS);
        onChange(Math.max(0, next), end);
        seekPreview(Math.max(0, next));
      } else {
        const next = Math.max(ms, start + MIN_SELECTION_MS);
        onChange(start, Math.min(duration, next));
        seekPreview(Math.min(duration, next));
      }
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const pct = (ms: number) => (durationMs ? (ms / durationMs) * 100 : 0);
  const startPct = pct(trimStart);
  const endPct = pct(durationMs ? trimEnd || durationMs : 0);
  const fmt = (ms: number) => {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const handleStyle: React.CSSProperties = {
    position: "absolute",
    top: -4,
    bottom: -4,
    width: HANDLE_W,
    background: "linear-gradient(135deg, #E8B94A, #C9964A)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "ew-resize",
    touchAction: "none",
    zIndex: 3,
  };

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ color: "#9E9990", fontSize: 13 }}>{getBroadcastCopy("captions.trim.strip_hint")}</p>
      <div dir="ltr" style={{ padding: `4px ${HANDLE_W}px`, marginTop: 8 }}>
        <div
          ref={stripRef}
          style={{
            position: "relative",
            height: 56,
            borderRadius: 8,
            background: "#141820",
          }}
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", borderRadius: 8, overflow: "hidden" }}>
            {Array.from({ length: THUMB_COUNT }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundImage: thumbs[i] ? `url(${thumbs[i]})` : undefined,
                  backgroundColor: "#1D2430",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ))}
          </div>
          {/* dimmed cut-away zones */}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${startPct}%`, background: "rgba(8,12,20,0.72)", borderRadius: "8px 0 0 8px", zIndex: 1 }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${100 - endPct}%`, background: "rgba(8,12,20,0.72)", borderRadius: "0 8px 8px 0", zIndex: 1 }} />
          {/* selection frame */}
          <div
            style={{
              position: "absolute",
              top: -4,
              bottom: -4,
              left: `${startPct}%`,
              width: `${Math.max(0, endPct - startPct)}%`,
              border: "3px solid #C9964A",
              borderLeft: "none",
              borderRight: "none",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            role="slider"
            aria-label={getBroadcastCopy("captions.trim_start.title")}
            aria-valuenow={Math.round(trimStart / 1000)}
            onPointerDown={startDrag("start")}
            style={{ ...handleStyle, left: `calc(${startPct}% - ${HANDLE_W}px)`, borderRadius: "8px 0 0 8px" }}
          >
            <span style={{ color: "#0D1018", fontSize: 15, fontWeight: 800 }}>‹</span>
          </div>
          <div
            role="slider"
            aria-label={getBroadcastCopy("captions.trim_end.title")}
            aria-valuenow={Math.round((trimEnd || durationMs) / 1000)}
            onPointerDown={startDrag("end")}
            style={{ ...handleStyle, left: `${endPct}%`, borderRadius: "0 8px 8px 0" }}
          >
            <span style={{ color: "#0D1018", fontSize: 15, fontWeight: 800 }}>›</span>
          </div>
        </div>
      </div>
      <p dir="rtl" style={{ color: "#EDE9E1", fontSize: 13, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
        {getBroadcastCopy("captions.trim.selected")}{" "}
        <span dir="ltr">{fmt(trimStart)}–{fmt(trimEnd || durationMs)}</span>
        {" · "}
        {Math.max(0, Math.round(((trimEnd || durationMs) - trimStart) / 1000))} שניות
      </p>
    </div>
  );
}

// Output: the reel, share (the daily-use action), download, next steps.
// No cover picker — Instagram generates covers automatically (QA round 3).
function OutputScreen({
  editId,
  snap,
  onAnotherTake,
  onReopened,
}: {
  editId: string;
  snap: EditSnapshot;
  onAnotherTake: () => void;
  onReopened: () => void;
}) {
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [reopening, setReopening] = useState(false);
  const [reopenNote, setReopenNote] = useState<string | null>(null);
  const approvedRef = useRef(false);
  const shareFetchedRef = useRef(false);

  const reopen = useCallback(async () => {
    setReopening(true);
    setReopenNote(null);
    try {
      const res = await fetch(`/api/broadcast/edits/${editId}/reopen`, { method: "POST" });
      if (res.status === 410) {
        setReopenNote(getBroadcastCopy("output.reedit_gone"));
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      onReopened(); // snapshot flips to awaiting_captions → the editor renders
    } catch {
      setReopenNote(getBroadcastCopy("error.upload_retry"));
    } finally {
      setReopening(false);
    }
  }, [editId, onReopened]);

  const approveOnce = useCallback(() => {
    if (approvedRef.current) return;
    approvedRef.current = true;
    fetch(`/api/broadcast/edits/${editId}/approve`, { method: "POST" }).catch(() => {});
  }, [editId]);

  // iOS share sheet with the actual video file — Instagram is a direct target.
  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([], "probe.mp4", { type: "video/mp4" })] });

  // iOS only allows navigator.share inside a FRESH tap — awaiting a 30MB
  // fetch inside the handler expires the gesture and the sheet never opens
  // (QA round 5 "share doesn't work"). So the file is fetched the moment the
  // screen loads, and the tap shares it synchronously.
  useEffect(() => {
    if (!snap.output_url || !canShareFiles || shareFetchedRef.current) return;
    shareFetchedRef.current = true;
    fetch(snap.output_url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => setShareFile(new File([blob], "reel.mp4", { type: "video/mp4" })))
      .catch(() => {
        shareFetchedRef.current = false; // allow a retry on next snapshot
      });
  }, [snap.output_url, canShareFiles]);

  const shareReel = useCallback(() => {
    if (!shareFile) return;
    approveOnce();
    // no await before share() — the user gesture must stay alive
    navigator.share({ files: [shareFile] }).catch(() => {
      /* user closed the sheet — nothing to do */
    });
  }, [shareFile, approveOnce]);

  return (
    <>
      <TopBar title="הרילס מוכן" backHref={KIT_HREF} backLabel="לפרקים שלי" />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 220px" }}>
        {snap.output_url ? (
          <div style={{ position: "relative" }}>
            <video src={snap.output_url} playsInline controls style={portraitPreview("56dvh", 0)} />
          </div>
        ) : null}
        <p
          style={{
            marginTop: 18,
            padding: "10px 14px",
            borderInlineStart: "3px solid #E8B94A",
            background: "#141820",
            borderRadius: 8,
            color: "#CDD1DA",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {getBroadcastCopy("director.release")}
        </p>
        <div style={{ ...stickyBar, flexDirection: "column", gap: 10 }}>
          {snap.output_url && canShareFiles ? (
            <ActionButton
              variant="primary"
              busy={!shareFile}
              busyLabel="מכינה את הקובץ לשיתוף"
              onClick={shareReel}
            >
              {getBroadcastCopy("output.share")}
            </ActionButton>
          ) : null}
          {snap.output_download_url ? (
            <ActionButton
              variant={canShareFiles ? "secondary" : "primary"}
              href={snap.output_download_url}
              onClick={approveOnce}
            >
              {getBroadcastCopy("output.download_video")}
            </ActionButton>
          ) : null}
          <ActionButton variant="ghost" busy={reopening} onClick={reopen}>
            {getBroadcastCopy("output.reedit")}
          </ActionButton>
          {reopenNote ? (
            <p style={{ color: "#9E9990", fontSize: 13, textAlign: "center", margin: 0 }}>{reopenNote}</p>
          ) : null}
          <ActionButton variant="ghost" onClick={onAnotherTake}>
            {getBroadcastCopy("takes.another")}
          </ActionButton>
          {/* Explicit exit back to the season view. The TopBar's
              "→ לפרקים שלי" is easy to miss on a phone once the customer
              scrolls to the share/download sticky bar; this ghost link
              gives them the same escape from inside the action rail. */}
          <ActionButton variant="ghost" href={KIT_HREF}>
            סיימתי לפרק הזה, חזרה לפרקים שלי ←
          </ActionButton>
        </div>
      </div>
    </>
  );
}

// Zoom/pan framing editor over the take preview — WYSIWYG with the burn:
// the visible window here IS the crop the server cuts (identical math in
// buildVideoFilter). Drag to reposition, pinch or slider to zoom, tap to
// play/pause. Portrait sources edit inside the 9:16 window; landscape
// sources keep their own frame (full-frame policy) and reframe within it.
function ZoomPanPreview({
  src,
  videoRef,
  transform,
  onChange,
}: {
  src: string;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  transform: CaptionTransform;
  onChange: (t: CaptionTransform) => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [vid, setVid] = useState({ w: 0, h: 0 });
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(transform);
  tRef.current = transform;
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; z: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const portrait = vid.w > 0 && vid.h > vid.w;
  const s0 = vid.w && box.w ? Math.max(box.w / vid.w, box.h / vid.h) : 0;

  const clampT = useCallback(
    (t: CaptionTransform): CaptionTransform => {
      if (!vid.w || !s0) return t;
      const z = Math.min(2.5, Math.max(1, t.z));
      const halfW = box.w / (2 * z * s0 * vid.w);
      const halfH = box.h / (2 * z * s0 * vid.h);
      return {
        z,
        cx: halfW >= 0.5 ? 0.5 : Math.min(1 - halfW, Math.max(halfW, t.cx)),
        cy: halfH >= 0.5 ? 0.5 : Math.min(1 - halfH, Math.max(halfH, t.cy)),
      };
    },
    [vid, box, s0]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), z: tRef.current.z };
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const t = tRef.current;
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 0 && pinchRef.current.dist > 0) {
        movedRef.current = true;
        onChange(clampT({ ...t, z: pinchRef.current.z * (dist / pinchRef.current.dist) }));
      }
      return;
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;
    if (s0 && vid.w) {
      onChange(
        clampT({
          ...t,
          cx: t.cx - dx / (t.z * s0 * vid.w),
          cy: t.cy - dy / (t.z * s0 * vid.h),
        })
      );
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0 && !movedRef.current) {
      const v = videoRef.current;
      if (v) {
        if (v.paused) v.play().catch(() => {});
        else v.pause();
      }
    }
  };

  const identity = transform.z <= 1.005 && Math.abs(transform.cx - 0.5) <= 0.005 && Math.abs(transform.cy - 0.5) <= 0.005;
  const { z, cx, cy } = transform;

  // Portrait: the editing window is the 9:16 output crop. Landscape: the
  // window is the source's own frame (full-frame policy — reframe within).
  const boxStyle: React.CSSProperties =
    vid.w > 0 && !portrait
      ? {
          position: "relative",
          width: "100%",
          aspectRatio: `${vid.w} / ${vid.h}`,
          margin: "14px auto 0",
          borderRadius: 12,
          background: "#000",
          overflow: "hidden",
        }
      : {
          position: "relative",
          height: "34dvh",
          aspectRatio: "9 / 16",
          width: "auto",
          maxWidth: "100%",
          margin: "14px auto 0",
          borderRadius: 12,
          background: "#000",
          overflow: "hidden",
        };

  return (
    <div>
      <div ref={boxRef} style={boxStyle}>
        <video
          ref={(el) => { videoRef.current = el; }}
          src={src}
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setVid({ w: v.videoWidth, h: v.videoHeight });
            // iOS Safari paints nothing until a play or a seek — nudge a
            // frame onto the screen so the editor never opens black.
            try { v.currentTime = Math.max(v.currentTime, 0.05); } catch { /* not seekable yet */ }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          style={
            vid.w && s0
              ? {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: vid.w * s0,
                  height: vid.h * s0,
                  maxWidth: "none",
                  transformOrigin: "0 0",
                  transform: `translate(${box.w / 2 - z * s0 * cx * vid.w}px, ${box.h / 2 - z * s0 * cy * vid.h}px) scale(${z})`,
                }
              : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
          }
        />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ position: "absolute", inset: 0, touchAction: "none", cursor: "grab" }}
        />
        {!playing ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(8,12,20,0.6)",
                border: "1px solid rgba(232,185,74,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#E8B94A" style={{ marginInlineStart: 3 }}>
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
            </span>
          </div>
        ) : null}
      </div>
      <div dir="rtl" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="br-btn"
          aria-label={playing ? "השהיה" : "ניגון"}
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) v.play().catch(() => {});
            else v.pause();
          }}
          style={{
            width: 38,
            height: 38,
            flex: "0 0 auto",
            borderRadius: 10,
            border: "1px solid rgba(232,185,74,0.35)",
            background: "transparent",
            color: "#E8B94A",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <rect x="5.5" y="4" width="4.4" height="16" rx="1.2" />
              <rect x="14.1" y="4" width="4.4" height="16" rx="1.2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style={{ marginInlineStart: 2 }}>
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          )}
        </button>
        <span style={{ color: "#9E9990", fontSize: 12, whiteSpace: "nowrap" }}>זום</span>
        <input
          type="range"
          dir="ltr"
          min={1}
          max={2.5}
          step={0.01}
          value={z}
          onChange={(e) => onChange(clampT({ ...transform, z: Number(e.target.value) }))}
          style={{ flex: 1, accentColor: "#C9964A" }}
          aria-label="זום"
        />
        {!identity ? (
          <button
            type="button"
            className="br-btn"
            onClick={() => onChange({ z: 1, cx: 0.5, cy: 0.5 })}
            style={{
              border: "1px solid rgba(232,185,74,0.35)",
              background: "transparent",
              color: "#E8B94A",
              borderRadius: 8,
              padding: "5px 9px",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {getBroadcastCopy("captions.zoom.reset")}
          </button>
        ) : null}
      </div>
      <p style={{ color: "#9E9990", fontSize: 12, marginTop: 4 }}>
        {getBroadcastCopy("captions.zoom.hint")}
      </p>
    </div>
  );
}

// Takes and outputs are portrait reels — lock the inline player to a centered
// 9:16 frame. Raw takes use COVER so the preview shows the exact crop the
// burn will produce (WYSIWYG); burned outputs are already 9:16.
const portraitPreview = (height: string, marginTop: number, cover = false): React.CSSProperties => ({
  display: "block",
  height,
  aspectRatio: "9 / 16",
  width: "auto",
  maxWidth: "100%",
  margin: `${marginTop}px auto 0`,
  borderRadius: 12,
  background: "#000",
  objectFit: cover ? "cover" : "contain",
});

const stickyBar: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  insetInlineStart: 0,
  insetInlineEnd: 0,
  padding: "14px 20px calc(env(safe-area-inset-bottom) + 14px)",
  background: "linear-gradient(to top, #080C14 70%, transparent)",
  display: "flex",
};

