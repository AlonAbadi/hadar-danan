// חדר השידור — pipeline screens: "הבמאית עורכת" status, caption approval
// (the human gate: nothing burns without approval), and the output screen.
//
// Status transport: polling is the GUARANTEE (5s interval + on visibility),
// Realtime is the accelerator. A dropped websocket can never strand the UI.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";
import { getBroadcastCopy } from "@/lib/broadcast-copy";
import { scriptToLines, type CaptionLine, type CaptionsPayload } from "@/lib/broadcast/captions";
import type { ScriptShape } from "./BroadcastRoomClient";

const POLL_MS = 5000;
const HANDOFF_MS = 90_000;
const TRIM_STEP_MS = 250;

interface EditSnapshot {
  status: "queued" | "transcribing" | "awaiting_captions" | "burning" | "ready" | "failed";
  error_detail: string | null;
  captions: CaptionsPayload | null;
  trim_start_ms: number | null;
  trim_end_ms: number | null;
  take_preview_url: string | null;
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

    // Realtime accelerator — first Realtime use in this codebase; read-only,
    // own-row, single-row filter (RLS SELECT policy authorizes it).
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
  script,
  onAnotherTake,
}: {
  editId: string;
  script: ScriptShape;
  firstName: string;
  onAnotherTake: () => void;
}) {
  const { snap, refresh } = useEditStatus(editId);

  if (!snap) return <StageScreen active="transcribing" />;
  if (snap.status === "queued" || snap.status === "transcribing") {
    return <StageScreen active="transcribing" />;
  }
  if (snap.status === "awaiting_captions") {
    return (
      <CaptionApproval
        editId={editId}
        snap={snap}
        script={script}
        onApproved={refresh}
      />
    );
  }
  if (snap.status === "burning") {
    return <BurningScreen editId={editId} />;
  }
  if (snap.status === "ready") {
    return <OutputScreen editId={editId} snap={snap} onAnotherTake={onAnotherTake} onRefresh={refresh} />;
  }
  // failed
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
      <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.8 }}>
        {getBroadcastCopy("error.processing_failed")}
      </p>
      <button type="button" onClick={onAnotherTake} style={secondaryBtn}>
        {getBroadcastCopy("takes.another")}
      </button>
    </div>
  );
}

function StageScreen({ active }: { active: "transcribing" | "burning" }) {
  const stages = [
    { key: "transcribing", label: getBroadcastCopy("processing.stage.transcribing") },
    { key: "awaiting_captions", label: getBroadcastCopy("processing.stage.awaiting_captions") },
    { key: "burning", label: getBroadcastCopy("processing.stage.burning") },
  ];
  const activeIdx = active === "transcribing" ? 0 : 2;
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px" }}>
      <h2 style={{ color: "#EDE9E1", fontSize: 22, fontWeight: 700, textAlign: "center" }}>
        {getBroadcastCopy("processing.title")}
      </h2>
      <p style={{ color: "#9E9990", fontSize: 14, textAlign: "center", marginTop: 8 }}>
        {getBroadcastCopy("director.breathing")}
      </p>
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
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
              opacity: i > activeIdx ? 0.5 : 1,
            }}
          >
            {i < activeIdx ? (
              <span style={{ color: "#7FD49B", fontWeight: 700 }}>✓</span>
            ) : i === activeIdx ? (
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  border: "2px solid #2C323E",
                  borderTopColor: "#E8B94A",
                  animation: "spin 0.9s linear infinite",
                  display: "inline-block",
                }}
              />
            ) : (
              <span style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid #2C323E" }} />
            )}
            <span style={{ color: i === activeIdx ? "#EDE9E1" : "#9E9990", fontSize: 15 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function BurningScreen({ editId }: { editId: string }) {
  const [handoff, setHandoff] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setHandoff(true);
      fetch(`/api/broadcast/edits/${editId}/notify`, { method: "POST" }).catch(() => {});
    }, HANDOFF_MS);
    return () => clearTimeout(t);
  }, [editId]);
  if (handoff) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
        <h2 style={{ color: "#EDE9E1", fontSize: 20, fontWeight: 700, lineHeight: 1.7 }}>
          {getBroadcastCopy("processing.handoff")}
        </h2>
        <p style={{ color: "#9E9990", fontSize: 14, marginTop: 12 }}>
          {getBroadcastCopy("processing.handoff_note")}
        </p>
      </div>
    );
  }
  return <StageScreen active="burning" />;
}

function CaptionApproval({
  editId,
  snap,
  script,
  onApproved,
}: {
  editId: string;
  snap: EditSnapshot;
  script: ScriptShape;
  onApproved: () => void;
}) {
  const transcriptFailed = !snap.captions || snap.captions.source === "none" || !snap.captions.lines.length;
  const [mode, setMode] = useState<"captions" | "none" | "script_sync" | null>(
    transcriptFailed ? null : "captions"
  );
  const [lines, setLines] = useState<CaptionLine[]>(snap.captions?.lines ?? []);
  const [trimStart, setTrimStart] = useState(snap.trim_start_ms ?? 0);
  const [trimEnd, setTrimEnd] = useState(snap.trim_end_ms ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [syncIdx, setSyncIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onApproved();
    } catch {
      setSubmitting(false);
    }
  }, [editId, mode, lines, trimStart, trimEnd, onApproved]);

  // Fallback chooser when transcription failed.
  if (transcriptFailed && mode === null) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px" }}>
        <h2 style={{ color: "#EDE9E1", fontSize: 20, fontWeight: 700, textAlign: "center" }}>
          {getBroadcastCopy("captions.failed.title")}
        </h2>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" style={optionCard} onClick={() => setMode("none")}>
            {getBroadcastCopy("captions.failed.option_none")}
          </button>
          <button
            type="button"
            style={optionCard}
            onClick={() => {
              setLines(scriptToLines([script.hook, script.body, script.cta].filter(Boolean).join("\n")));
              setSyncIdx(0);
              setMode("script_sync");
            }}
          >
            {getBroadcastCopy("captions.failed.option_script")}
          </button>
        </div>
      </div>
    );
  }

  // Manual sync mode: she plays the take and taps "השורה הבאה" per line.
  if (mode === "script_sync") {
    const done = syncIdx >= lines.length;
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 140px" }}>
        <h2 style={{ color: "#EDE9E1", fontSize: 20, fontWeight: 700 }}>
          {getBroadcastCopy("captions.failed.option_script")}
        </h2>
        {snap.take_preview_url ? (
          <video
            ref={videoRef}
            src={snap.take_preview_url}
            playsInline
            controls
            style={portraitPreview("36dvh", 14)}
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
            <button
              type="button"
              style={primaryBtn(true)}
              onClick={() => {
                const t = Math.round((videoRef.current?.currentTime ?? 0) * 1000);
                setLines((prev) =>
                  prev.map((l, i) => {
                    if (i === syncIdx) return { ...l, start_ms: i === 0 ? Math.max(0, t - 400) : l.start_ms, end_ms: t };
                    if (i === syncIdx + 1) return { ...l, start_ms: t };
                    return l;
                  })
                );
                setSyncIdx((i) => i + 1);
              }}
            >
              {getBroadcastCopy("captions.sync.next_line")} ({syncIdx + 1}/{lines.length})
            </button>
          ) : (
            <button type="button" style={primaryBtn(!submitting)} disabled={submitting} onClick={submit}>
              {getBroadcastCopy("captions.approve_cta")}
            </button>
          )}
        </div>
      </div>
    );
  }

  // mode === "none" confirmation, or the standard caption editor.
  if (mode === "none") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
        <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.8 }}>
          {getBroadcastCopy("captions.failed.option_none")}
        </p>
        <div style={{ marginTop: 20 }}>
          <button type="button" style={primaryBtn(!submitting)} disabled={submitting} onClick={submit}>
            {getBroadcastCopy("captions.approve_cta")}
          </button>
        </div>
      </div>
    );
  }

  const visible = lines.filter((l) => !l.deleted);
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 140px" }}>
      <h2 style={{ color: "#EDE9E1", fontSize: 20, fontWeight: 700 }}>
        {getBroadcastCopy("captions.title")}
      </h2>
      <p style={{ color: "#9E9990", fontSize: 13, marginTop: 6 }}>{getBroadcastCopy("captions.hint")}</p>
      {snap.take_preview_url ? (
        <video
          src={snap.take_preview_url}
          playsInline
          controls
          style={portraitPreview("36dvh", 14)}
        />
      ) : null}
      {/* trim nudges — two text buttons, never a timeline */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <TrimCard
          title={getBroadcastCopy("captions.trim_start.title")}
          valueMs={trimStart}
          onExpand={() => setTrimStart((v) => Math.max(0, v - TRIM_STEP_MS))}
          onShrink={() => setTrimStart((v) => v + TRIM_STEP_MS)}
        />
        <TrimCard
          title={getBroadcastCopy("captions.trim_end.title")}
          valueMs={trimEnd}
          onExpand={() => setTrimEnd((v) => v + TRIM_STEP_MS)}
          onShrink={() => setTrimEnd((v) => Math.max(trimStart + 1000, v - TRIM_STEP_MS))}
        />
      </div>
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
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={stickyBar}>
        <button
          type="button"
          style={primaryBtn(!submitting && visible.length > 0)}
          disabled={submitting || visible.length === 0}
          onClick={submit}
        >
          {getBroadcastCopy("captions.approve_cta")}
        </button>
      </div>
    </div>
  );
}

function TrimCard({
  title,
  valueMs,
  onExpand,
  onShrink,
}: {
  title: string;
  valueMs: number;
  onExpand: () => void;
  onShrink: () => void;
}) {
  return (
    <div style={{ flex: 1, background: "#141820", borderRadius: 10, padding: 12 }}>
      <p style={{ color: "#9E9990", fontSize: 12 }}>{title}</p>
      <p dir="ltr" style={{ color: "#EDE9E1", fontSize: 15, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
        {(valueMs / 1000).toFixed(2)}s
      </p>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={onExpand} style={miniBtn}>
          {getBroadcastCopy("captions.trim.expand")}
        </button>
        <button type="button" onClick={onShrink} style={miniBtn}>
          {getBroadcastCopy("captions.trim.shrink")}
        </button>
      </div>
    </div>
  );
}

function OutputScreen({
  editId,
  snap,
  onAnotherTake,
  onRefresh,
}: {
  editId: string;
  snap: EditSnapshot;
  onAnotherTake: () => void;
  onRefresh: () => void;
}) {
  const [frameIdx, setFrameIdx] = useState<number | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const approvedRef = useRef(false);

  const approveOnce = useCallback(() => {
    if (approvedRef.current) return;
    approvedRef.current = true;
    fetch(`/api/broadcast/edits/${editId}/approve`, { method: "POST" }).catch(() => {});
  }, [editId]);

  // iOS share sheet with the actual video file — Instagram appears as a
  // target, which is the closest thing to "open the reel in Instagram".
  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([], "probe.mp4", { type: "video/mp4" })] });

  const shareReel = useCallback(async () => {
    if (!snap.output_url) return;
    setShareBusy(true);
    approveOnce();
    try {
      const res = await fetch(snap.output_url);
      const blob = await res.blob();
      const file = new File([blob], "reel.mp4", { type: "video/mp4" });
      await navigator.share({ files: [file] });
    } catch {
      /* user cancelled the sheet, or fetch failed — download stays available */
    } finally {
      setShareBusy(false);
    }
  }, [snap.output_url, approveOnce]);

  const pickCover = useCallback(
    async (i: number) => {
      setFrameIdx(i);
      setCoverBusy(true);
      try {
        const res = await fetch(`/api/broadcast/edits/${editId}/cover`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frame_index: i }),
        });
        if (res.ok) onRefresh();
      } finally {
        setCoverBusy(false);
      }
    },
    [editId, onRefresh]
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 160px" }}>
      {snap.output_url ? (
        <div style={{ position: "relative" }}>
          <video
            src={snap.output_url}
            playsInline
            controls
            style={portraitPreview("52dvh", 0)}
          />
          <span
            style={{
              position: "absolute",
              bottom: 12,
              insetInlineEnd: 12,
              border: "1px solid #E8B94A",
              color: "#E8B94A",
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 12,
              letterSpacing: 0.5,
              background: "rgba(8,12,20,0.6)",
            }}
          >
            {getBroadcastCopy("output.stamp")}
          </span>
        </div>
      ) : null}
      {snap.cover_frames?.length ? (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: "#EDE9E1", fontSize: 16, fontWeight: 700 }}>
            {getBroadcastCopy("output.cover_title")}
          </p>
          <p style={{ color: "#9E9990", fontSize: 13, marginTop: 4 }}>
            {getBroadcastCopy("output.cover_hint")}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {snap.cover_frames.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => pickCover(i)}
                disabled={coverBusy}
                style={{
                  flex: 1,
                  padding: 0,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: frameIdx === i ? "2px solid #E8B94A" : "2px solid #2C323E",
                  background: "transparent",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <p
        style={{
          marginTop: 22,
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
          <button
            type="button"
            disabled={shareBusy}
            onClick={shareReel}
            style={primaryBtn(!shareBusy)}
          >
            {shareBusy ? "..." : getBroadcastCopy("output.share")}
          </button>
        ) : null}
        {snap.output_download_url ? (
          <a
            href={snap.output_download_url}
            onClick={approveOnce}
            style={{
              ...(canShareFiles ? secondaryBtn : primaryBtn(true)),
              marginTop: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            {getBroadcastCopy("output.download_video")}
          </a>
        ) : null}
        {snap.cover_download_url ? (
          <a
            href={snap.cover_download_url}
            style={{ ...secondaryBtn, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
          >
            {getBroadcastCopy("output.download_cover")}
          </a>
        ) : null}
        <button
          type="button"
          onClick={onAnotherTake}
          style={{ background: "transparent", border: "none", color: "#9E9990", fontSize: 15 }}
        >
          {getBroadcastCopy("takes.another")}
        </button>
        <Link
          href="/hive/signal-kit"
          style={{ color: "#C9964A", fontSize: 13, textAlign: "center", textDecoration: "none" }}
        >
          {getBroadcastCopy("output.review_link")}
        </Link>
      </div>
    </div>
  );
}

// Takes and outputs are portrait reels — lock the inline player to a centered
// 9:16 frame instead of letting Safari letterbox it into a wide box
// (first iPhone QA finding: "הציג לי לרוחב").
const portraitPreview = (height: string, marginTop: number): React.CSSProperties => ({
  display: "block",
  height,
  aspectRatio: "9 / 16",
  width: "auto",
  maxWidth: "100%",
  margin: `${marginTop}px auto 0`,
  borderRadius: 12,
  background: "#000",
  objectFit: "contain",
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

const primaryBtn = (enabled: boolean): React.CSSProperties => ({
  flex: 1,
  height: 52,
  borderRadius: 12,
  border: "none",
  background: enabled ? "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)" : "#2C323E",
  color: enabled ? "#2a1d05" : "#9E9990",
  fontSize: 17,
  fontWeight: 700,
});

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  height: 48,
  borderRadius: 12,
  border: "1px solid rgba(232,185,74,0.4)",
  background: "transparent",
  color: "#E8B94A",
  fontSize: 16,
  fontWeight: 600,
  marginTop: 16,
};

const optionCard: React.CSSProperties = {
  background: "#141820",
  border: "1px solid rgba(232,185,74,0.2)",
  borderRadius: 12,
  padding: "18px 16px",
  color: "#EDE9E1",
  fontSize: 16,
  fontWeight: 600,
  textAlign: "center",
};

const miniBtn: React.CSSProperties = {
  border: "1px solid rgba(232,185,74,0.35)",
  background: "transparent",
  color: "#E8B94A",
  borderRadius: 8,
  padding: "6px 8px",
  fontSize: 12,
};
