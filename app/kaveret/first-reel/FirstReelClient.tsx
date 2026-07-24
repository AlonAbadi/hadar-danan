"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useRecording,
  type FinishedTake,
} from "@/app/hive/signal-kit/broadcast/[extractionId]/[videoNumber]/useRecording";
import {
  Teleprompter,
  type TeleprompterHandle,
} from "@/app/hive/signal-kit/broadcast/[extractionId]/[videoNumber]/Teleprompter";
import { RoomStyles } from "@/app/hive/signal-kit/broadcast/[extractionId]/[videoNumber]/ui";
import { getBroadcastCopy } from "@/lib/broadcast-copy";

/**
 * The first-reel experience = the REAL broadcast room, not a lite copy.
 * Camera, zoom, voice-paced teleprompter, countdown beeps, gold record
 * button - all imported or mirrored verbatim from the member product
 * (useRecording + Teleprompter are the same modules). Only the after-take
 * path differs: signed-URL upload -> auto-approved caption render -> the
 * finished reel, instead of the member take gallery + approval flow.
 */

type Phase =
  | "loading" | "intake" | "refining" | "prep" | "room" | "review"
  | "uploading" | "processing" | "result" | "failed" | "error";

// Alon 2026-07-24: BEFORE the prospect sees the auto-generated script,
// Hadar asks 3 questions (story / stance / payoff). The answers refine
// the script to be the prospect's OWN voice, not just their signal. The
// intake is skipped on subsequent visits (localStorage guard) so a user
// returning after a session doesn't re-answer.
const INTAKE_MIN_STORY_CHARS = 40;
const INTAKE_KEY = (id: string) => `first_reel_intake_done:${id}`;

// Same guards as the member room; the script is ~15s so the min take drops
// to a false-start filter rather than the member 10s floor.
const MIN_TAKE_MS = 4_000;
const MAX_TAKE_MS = 180_000;
const HARD_STOP_MS = 240_000;
const POLL_MS = 3500;
const POLL_MAX_MS = 5 * 60_000;

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

function track(type: string, extractionId: string) {
  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        anonymous_id: getCookie("anon_id"),
        metadata: { extraction_id: extractionId, page: "/kaveret/first-reel" },
      }),
    }).catch(() => {});
  } catch { /* non-critical */ }
}

// Split the generated 3-5 line script into the product's hook/body/cta shape.
function toScriptShape(script: string): { hook: string; body: string; cta?: string } {
  const lines = script.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return { hook: script, body: "" };
  if (lines.length === 2) return { hook: lines[0], body: lines[1] };
  return { hook: lines[0], body: lines.slice(1, -1).join("\n"), cta: lines[lines.length - 1] };
}

function ZoomPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="br-btn"
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 17,
        border: "1px solid rgba(237,233,225,0.3)", background: "rgba(8,12,20,0.6)",
        color: "#EDE9E1", fontSize: 17, cursor: "pointer",
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
      className="br-btn"
      onClick={onClick}
      style={{
        border: "1px solid rgba(237,233,225,0.3)", background: "rgba(8,12,20,0.6)",
        color: "#EDE9E1", borderRadius: 999, padding: "9px 14px", fontSize: 14, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export function FirstReelClient({ extractionId, token }: { extractionId: string; token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  // Alon 2026-07-24: prospect can edit the script before filming. `editing`
  // toggles the prep-phase inline editor; the edited hook/body override the
  // parsed shape both in the teleprompter and in the prep preview.
  const [editing, setEditing] = useState(false);
  const [editHook, setEditHook] = useState("");
  const [editBody, setEditBody] = useState("");
  const [intakeAnswers, setIntakeAnswers] = useState({ story: "", stance: "", payoff: "" });
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [intakeProbeVisible, setIntakeProbeVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [take, setTake] = useState<FinishedTake | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [language, setLanguage] = useState<"he" | "en">("he");
  const [processingElapsed, setProcessingElapsed] = useState(0);

  const prompterRef = useRef<TeleprompterHandle | null>(null);
  const isDesktopUA =
    typeof navigator !== "undefined" && !/iPhone|iPad|Android/i.test(navigator.userAgent);

  // ── the take lands here (same contract as the member room) ──
  const onTakeFinished = useCallback((t: FinishedTake) => {
    if (t.durationMs < MIN_TAKE_MS) {
      setBanner("הטייק קצר מדי, נסו שוב");
      return;
    }
    setTake(t);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(t.blob);
    });
    setPhase("review");
    track("FIRST_REEL_RECORDED", extractionId);
  }, [extractionId]);

  const rec = useRecording(onTakeFinished);

  // Hard memory-guard stop (member behavior).
  useEffect(() => {
    if (rec.isRecording && rec.elapsedMs > HARD_STOP_MS) rec.stopRecording();
  }, [rec, rec.isRecording, rec.elapsedMs]);

  // ── script + existing render (the reel must never disappear on return) ──
  useEffect(() => {
    track("FIRST_REEL_VIEW", extractionId);
    (async () => {
      try {
        const [scriptRes, statusRes] = await Promise.all([
          fetch(`/api/signal/${extractionId}/first-reel?t=${encodeURIComponent(token)}`),
          fetch(`/api/signal/${extractionId}/first-reel/status?t=${encodeURIComponent(token)}`),
        ]);
        const data = await scriptRes.json();
        if (!scriptRes.ok) throw new Error(data.error);
        setTitle(data.title);
        setScript(data.script);
        if (data.language === "en") setLanguage("en");
        const st = await statusRes.json().catch(() => ({}));
        if (st.status === "ready" && st.url) {
          setFinalUrl(st.url);
          setDownloadUrl(st.downloadUrl ?? st.url);
          setPhase("result");
        } else {
          // Alon 2026-07-24: fresh callers land in the intake (3 questions)
          // before the prep screen. Returning callers who already completed
          // the intake skip straight to prep (localStorage guard).
          const intakeDone = typeof window !== "undefined" && localStorage.getItem(INTAKE_KEY(extractionId)) === "1";
          setPhase(intakeDone ? "prep" : "intake");
        }
      } catch {
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractionId, token]);

  useEffect(() => () => { rec.releaseCamera(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Funnel instrumentation (Alon 2026-07-23): the observed drop is between
  // opening the script and a finished take — mark every camera milestone so
  // the drop point is visible in the events table.
  const camTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (rec.cameraState === camTrackedRef.current) return;
    camTrackedRef.current = rec.cameraState;
    if (rec.cameraState === "requesting") track("FIRST_REEL_CAMERA_REQUESTED", extractionId);
    else if (rec.cameraState === "ready") track("FIRST_REEL_CAMERA_READY", extractionId);
    else if (rec.cameraState === "denied") track("FIRST_REEL_CAMERA_DENIED", extractionId);
    else if (rec.cameraState === "unsupported") track("FIRST_REEL_CAMERA_UNSUPPORTED", extractionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.cameraState, extractionId]);

  // ── countdown + beeps: verbatim member-room behavior ──
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
    track("FIRST_REEL_RECORD_STARTED", extractionId);
    setBanner(null);
    setCountdown(3);
    beep(880, 130);
    prompterRef.current?.restart();
    // Desktop warm-up + iPhone late start: identical to the member room.
    if (isDesktopUA) rec.startRecording();
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(iv);
        beep(1318, 220); // "go"
        setCountdown(null);
        setTimeout(() => {
          if (isDesktopUA) rec.markGo();
          else rec.startRecording();
          prompterRef.current?.start();
        }, 350);
      } else {
        beep(880, 130);
        setCountdown(n);
      }
    }, 1000);
  }, [countdown, rec, beep, isDesktopUA, extractionId]);

  const stopTake = useCallback(() => {
    prompterRef.current?.pause();
    rec.stopRecording();
  }, [rec]);

  const anotherTake = useCallback(() => {
    setPhase("room");
    if (rec.cameraState !== "ready") rec.requestCamera();
  }, [rec]);

  // ── send to the engine: direct-to-storage upload, then render kick ──
  const submitTake = useCallback(async () => {
    if (!take) return;
    setPhase("uploading");
    try {
      const urlRes = await fetch(`/api/signal/${extractionId}/first-reel/upload?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime: take.mimeType.split(";")[0] }),
      });
      const { uploadUrl, path } = await urlRes.json();
      if (!urlRes.ok || !uploadUrl) throw new Error("upload url failed");

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": take.mimeType.split(";")[0], "x-upsert": "true" },
        body: take.blob,
      });
      if (!put.ok) throw new Error("storage upload failed");

      const proc = await fetch(`/api/signal/${extractionId}/first-reel/process?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          duration_ms: Math.round(take.durationMs),
          trim_start_ms: take.suggestedTrimStartMs,
          trim_end_ms: take.suggestedTrimEndMs,
        }),
      });
      if (!proc.ok) throw new Error("process failed");
      setPhase("processing");
      track("FIRST_REEL_SUBMITTED", extractionId);
      const startedAt = Date.now();
      const tick = setInterval(() => setProcessingElapsed(Date.now() - startedAt), 1000);
      // eslint-disable-next-line no-inner-declarations
      var clearTick = () => clearInterval(tick);

      const deadline = Date.now() + POLL_MAX_MS;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        const st = await fetch(`/api/signal/${extractionId}/first-reel/status?t=${encodeURIComponent(token)}`);
        const data = await st.json();
        if (data.status === "ready" && data.url) {
          clearTick();
          setFinalUrl(data.url);
          setDownloadUrl(data.downloadUrl ?? data.url);
          setPhase("result");
          track("FIRST_REEL_READY", extractionId);
          return;
        }
        if (data.status === "failed") { clearTick(); setPhase("failed"); return; }
      }
      clearTick();
      setPhase("failed");
    } catch {
      setPhase("failed");
    }
  }, [take, extractionId, token]);

  // ── shell: identical to the member room ──
  const shell: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "#080C14",
    height: "100dvh",
    overflow: "hidden",
    color: "#EDE9E1",
    fontFamily: 'var(--font-assistant), "Assistant", Arial, sans-serif',
    touchAction: "manipulation",
    overscrollBehavior: "none",
  };

  // Alon 2026-07-24: for non-camera phases the fixed-position shell was
  // hiding the site top nav (LayoutShell renders it at zIndex 1). Split
  // into `pageShell` (regular flow, room for nav + footer) and keep the
  // fixed `shell` only for the actual camera room/countdown.
  const pageShell: React.CSSProperties = {
    background: "#080C14",
    color: "#EDE9E1",
    fontFamily: 'var(--font-assistant), "Assistant", Arial, sans-serif',
    minHeight: "100dvh",
  };
  const gold = { color: "#E8B94A" };
  const goldBtn: React.CSSProperties = {
    background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
    color: "#0D1018", fontWeight: 800, fontSize: 16, border: "none",
    borderRadius: 12, padding: "14px 34px", cursor: "pointer", textDecoration: "none", display: "inline-block",
  };
  const ghostBtn: React.CSSProperties = {
    background: "none", border: "1px solid #2C323E", color: "#D6D2C9",
    borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", textDecoration: "none", display: "inline-block",
  };
  // A true 9:16 reels box, always: the width is capped by the height budget
  // too (58dvh * 9/16) so aspect-ratio and max-height can never fight - the
  // fight is what made iOS render the raw landscape sensor "square".
  const frame: React.CSSProperties = {
    position: "relative", width: "min(400px, 92vw, calc(58dvh * 0.5625))", aspectRatio: "9/16",
    borderRadius: 20, overflow: "hidden", background: "#000", border: "1px solid #2C323E",
  };
  const offerHref = `/kaveret/i?t=${encodeURIComponent(token)}#kaveret-offer`;
  const scriptShape = toScriptShape(script);

  // Alon 2026-07-24: renumbered 1-5 (was 0-4) and reworded the intro so
  // it doesn't read as "video 1 of 5". These are FIVE DIFFERENT
  // PRODUCTS in the same package, not five videos.
  const FOLDERS: [string, string, string][] = [
    ["1", "לוח האות", "האות שלך, הכאב שהוא פותר, ההבטחה והקהל, במקום אחד"],
    ["2", "אתגר האות · 7 ימים", "שבעה שיעורי עומק עם הדר, ממוסגרים סביב האות שלך + מפגש חי בזום"],
    ["3", "ערכת תוכן", "7 כיווני-תוכן וספריית פתיחות, כולם נגזרים מהאות שלך"],
    ["4", "ערכת ויזואל", "כרטיסי האות מוכנים לשיתוף + 7 כיווני-צילום"],
    ["5", "הבמאית", "7 בימויים אישיים, בדיוק כמו הסרטון שרק עשית, עם הכתוביות"],
  ];

  const Upsell = () => (
    <div style={{ maxWidth: 460, width: "100%", background: "linear-gradient(145deg, #1D2430, #111620)", border: "1px solid #C9964A55", borderRadius: 16, padding: "24px 22px", textAlign: "right" }}>
      <div style={{ fontSize: 14, letterSpacing: 1, color: "#E8B94A", fontWeight: 700, marginBottom: 6, textAlign: "center" }}>כוורת האות</div>
      <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.7, margin: "0 0 14px", textAlign: "center" }}>
        הרילס הזה יצא לך מהבמאית, מוצר אחד מתוך חמישה בכוורת האות.
        <br />
        <span style={gold}>חמישה מוצרים שונים באותה חבילה, כולם נגזרים מהאות שלך.</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {FOLDERS.map(([n, t, d]) => (
          <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#14182066", borderRadius: 10, padding: "10px 12px" }}>
            <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, border: "1px solid #C9964A66", color: "#E8B94A", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#EDE9E1" }}>{t}</span>
              <span style={{ display: "block", fontSize: 14, color: "#D6D2C9", lineHeight: 1.6 }}>{d}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #2C323E", paddingTop: 14, fontSize: 14, lineHeight: 1.85 }}>
        <p style={{ margin: "0 0 10px" }}>
          <strong style={gold}>מה מקבלים עכשיו, בתשלום אחד של <span dir="ltr">₪590</span>:</strong>
          <br />
          את כל חמש התיקיות, כולן נגזרות מהאות שלך. בלי התחייבות נוספת.
          <br />
          <span style={{ color: "#7FD49B", fontSize: 14 }}>ואם ממשיכים לסדנה, כל ה-<span dir="ltr">₪590</span> מתקזזים ממחירה.</span>
        </p>
        <p style={{ margin: 0, color: "#D6D2C9" }}>
          <strong style={{ color: "#EDE9E1" }}>ומה בהמשך, רק אם תרצו:</strong>
          <br />
          אנחנו ממשיכים לייצר לכם תוכן, פוסטים וסרטונים, ב-<span dir="ltr">₪99</span> לחודש. מפסיקים מתי שרוצים.
        </p>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <a href="/signal-hive" style={goldBtn}>לפתוח את הכוורת ←</a>
        <a
          href={`https://wa.me/972539566961?text=${encodeURIComponent("היי הדר, ראיתי את הרילס הראשון שיצא לי מהמערכת ורוצה לקבוע פגישה איתך.")}`}
          target="_blank" rel="noreferrer"
          style={{ ...ghostBtn, textDecoration: "none" }}
        >
          לקבוע פגישה עם הדר ←
        </a>
      </div>
    </div>
  );

  const Centered = ({ children }: { children: React.ReactNode }) => (
    // pageShell (regular flow, not fixed) so the top nav from LayoutShell
    // is visible above intake/refining/loading/error screens too.
    <div dir="rtl" style={{ ...pageShell, minHeight: "calc(100dvh - 64px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
      <RoomStyles />
      {children}
    </div>
  );

  // Alon 2026-07-24: iOS Safari treats <a download> as a Files-only save;
  // to reach the Photos library we hand the file to navigator.share as a
  // File object so the native share sheet's "Save Video" option appears.
  // On Android and desktop we fall through to a normal download link.
  function SaveReelButton({ finalUrl, downloadUrl, title }: { finalUrl: string; downloadUrl: string; title: string }) {
    const [busy, setBusy] = useState(false);
    const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const canShareFile = typeof navigator !== "undefined" &&
      typeof (navigator as unknown as { canShare?: (data: { files: File[] }) => boolean }).canShare === "function";

    if (isIOS && canShareFile) {
      return (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await fetch(finalUrl);
              const blob = await r.blob();
              const file = new File([blob], "first-reel.mp4", { type: blob.type || "video/mp4" });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const nav = navigator as any;
              if (nav.canShare({ files: [file] })) {
                await nav.share({ files: [file], title });
              } else {
                window.location.href = downloadUrl;
              }
            } catch {
              window.location.href = downloadUrl;
            } finally {
              setBusy(false);
            }
          }}
          style={goldBtn}
        >
          {busy ? "מכינה…" : "שתף ↗"}
        </button>
      );
    }

    return (
      <>
        {typeof navigator !== "undefined" && "share" in navigator ? (
          <button style={goldBtn} onClick={() => navigator.share({ url: finalUrl, title }).catch(() => {})}>
            שתף ↗
          </button>
        ) : (
          <a href={downloadUrl} style={goldBtn}>להוריד את הרילס ⬇</a>
        )}
      </>
    );
  }

  // Alon 2026-07-24: mirrors the existing floating tab bar from
  // KaveretVisitorClient (kaveret.module.css .tabbar) — same glass +
  // backdrop-blur + centered pill anchored to the safe-area bottom.
  // Everything needed sits inside it: return to the signal page.
  function BackToSignalBar({ token }: { token: string }) {
    return (
      <nav
        aria-label="ניווט"
        dir="rtl"
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: "calc(10px + env(safe-area-inset-bottom))",
          zIndex: 60,
          maxWidth: 560,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          padding: "7px 6px",
          borderRadius: 999,
          background: "rgba(13,17,26,0.88)",
          backdropFilter: "blur(30px) saturate(150%)",
          WebkitBackdropFilter: "blur(30px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.45), 0 14px 40px rgba(0,0,0,0.55)",
        }}
      >
        <a
          href={`/kaveret/i?t=${encodeURIComponent(token)}`}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            textDecoration: "none", color: "#EDE9E1", padding: "8px 10px", minHeight: 52,
          }}
        >
          <span style={{ textAlign: "right", minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>חזרה לאות שלי</span>
            <span style={{ display: "block", fontSize: 12, color: "#D6D2C9", lineHeight: 1.35 }}>לוח האות, הכוורת, הפגישה עם הדר</span>
          </span>
          <span style={{
            flexShrink: 0, background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            color: "#0D1018", fontWeight: 800, fontSize: 14, borderRadius: 999, padding: "9px 17px", whiteSpace: "nowrap",
          }}>
            לפתוח ←
          </span>
        </a>
      </nav>
    );
  }

  function FirstReelFooter() {
    // Alon 2026-07-24: mirrors the full homepage footer — brand mark,
    // TrueSignal microcopy, product links, legal links, and contact.
    // The Santosha palette is intact so it sits inside the reel shell
    // without needing a separate theme break.
    const linkStyle: React.CSSProperties = { color: "#9E9990", textDecoration: "none", fontSize: 13, lineHeight: 2 };
    const colLabel: React.CSSProperties = { color: "#C9964A", fontSize: 12, letterSpacing: 1, marginBottom: 6, fontWeight: 700 };
    return (
      <footer style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid #2C323E", width: "100%", maxWidth: 720, color: "#9E9990", fontSize: 13, lineHeight: 1.7, textAlign: "right", padding: "28px 4px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 24, marginBottom: 24 }}>
          <div>
            <div style={colLabel}>המוצרים</div>
            <div><a href="/signal" style={linkStyle}>אבחון האות</a></div>
            <div><a href="/signal-hive" style={linkStyle}>כוורת האות</a></div>
            <div><a href="/strategy" style={linkStyle}>פגישה עם הדר</a></div>
          </div>
          <div>
            <div style={colLabel}>המערכת</div>
            <div><a href="/method" style={linkStyle}>שיטת TrueSignal©</a></div>
            <div><a href="/about" style={linkStyle}>על הדר</a></div>
            <div><a href="/team" style={linkStyle}>צוות</a></div>
          </div>
          <div>
            <div style={colLabel}>עזרה</div>
            <div><a href={`https://wa.me/972539566961`} target="_blank" rel="noreferrer" style={linkStyle}>וואטסאפ</a></div>
            <div><a href="/accessibility" style={linkStyle}>נגישות</a></div>
            <div><a href="/privacy" style={linkStyle}>פרטיות</a></div>
            <div><a href="/terms" style={linkStyle}>תנאי שימוש</a></div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #2C323E", paddingTop: 18, textAlign: "center", fontSize: 12, color: "#7d786f", lineHeight: 1.8 }}>
          <div style={{ marginBottom: 6, color: "#C9964A", fontWeight: 700, letterSpacing: 0.5 }}>הדר דנן · beegood</div>
          <div>אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. · <span dir="ltr" style={{ unicodeBidi: "embed" as const, color: "#C9964A" }}>TrueSignal©</span></div>
        </div>
      </footer>
    );
  }

  if (phase === "loading") return (
    <Centered>
      <div style={{ fontSize: 34, marginBottom: 14 }}>✨</div>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>התסריט שלך נכתב מהאות</h1>
      <p style={{ color: "#D6D2C9", fontSize: 14 }}>עוד רגע קטן...</p>
    </Centered>
  );

  if (phase === "error") return (
    <Centered>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>התסריט עוד לא מוכן</h1>
      <p style={{ color: "#D6D2C9", fontSize: 14, marginBottom: 20 }}>נסו לרענן את העמוד בעוד רגע</p>
      <a href={`/kaveret/i?t=${encodeURIComponent(token)}`} style={ghostBtn}>חזרה לאות ←</a>
    </Centered>
  );

  // ── intake: 3 Hadar-style questions BEFORE the prep screen (Alon 2026-07-24) ──
  const setIntakeAt = (id: "story" | "stance" | "payoff", v: string) => {
    setIntakeAnswers((cur) => ({ ...cur, [id]: v }));
    if (id === "story" && v.trim().length >= INTAKE_MIN_STORY_CHARS) setIntakeProbeVisible(false);
  };
  const submitIntake = async () => {
    setIntakeError(null);
    if (intakeAnswers.story.trim().length < INTAKE_MIN_STORY_CHARS) {
      setIntakeProbeVisible(true); return;
    }
    if (intakeAnswers.stance.trim().length < 5) {
      setIntakeError("צריך גם עמדה קצרה, לא רק את הסיפור."); return;
    }
    setPhase("refining");
    try {
      const r = await fetch(`/api/signal/${extractionId}/first-reel/refine?t=${encodeURIComponent(token)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakeAnswers),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "refine_failed");
      setTitle(j.title);
      setScript(j.script);
      if (j.language === "en") setLanguage("en");
      try { localStorage.setItem(INTAKE_KEY(extractionId), "1"); } catch { /* private mode */ }
      setPhase("prep");
    } catch (e) {
      setIntakeError(String((e as Error).message ?? "error"));
      setPhase("intake");
    }
  };

  if (phase === "intake") return (
    <div dir="rtl" style={{ ...pageShell, overflowY: "auto" }} className="font-assistant">
      <RoomStyles />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "26px 20px 160px" }}>
        <div style={{ fontSize: 14, letterSpacing: 1, color: "#E8B94A", fontWeight: 700, marginBottom: 6 }}>לפני שהדר כותבת</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#EDE9E1", margin: "0 0 6px" }}>שלוש שאלות. אחר כך תסריט שהוא אתה.</h1>
        <p style={{ color: "#D6D2C9", fontSize: 15, lineHeight: 1.65, margin: "0 0 22px" }}>
          תכתוב איך שאתה מדבר. חצי־שבור בסדר. הדר תסדר את זה.
        </p>

        {[
          { id: "story"  as const, label: "שאלה 1", q: "לקוח אחד, פרויקט אחד, רגע ספציפי, שבו עשית או ראית משהו שאף אחד אחר בתחום שלך לא היה עושה או רואה.", hint: "שם, פרט קונקרטי, שני משפטים. לא צריך יותר.", rows: 5, probe: "רגע, תן לי משהו יותר ספציפי. מי היה הלקוח? מה בפועל אמרת או ראית שם?" },
          { id: "stance" as const, label: "שאלה 2", q: "מה זה היה שאתה ראית שאחרים לא ראו?", hint: "כמו שהיית אומר ללקוח בפגישה, במשפט אחד־שניים.", rows: 3, probe: "" },
          { id: "payoff" as const, label: "שאלה 3 · אופציונלית", q: "מה קרה בסוף? מה הלקוח הרגיש, אמר, או עשה?", hint: "אפשר לדלג.", rows: 3, probe: "" },
        ].map((q) => (
          <div key={q.id} style={{ marginTop: 22 }}>
            <div style={{ color: "#C9964A", fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>{q.label}</div>
            <div style={{ fontSize: 18, lineHeight: 1.5, fontWeight: 600, color: "#EDE9E1", marginBottom: 4 }}>{q.q}</div>
            <div style={{ color: "#9E9990", fontSize: 13, marginBottom: 10 }}>{q.hint}</div>
            <textarea
              value={intakeAnswers[q.id]}
              onChange={(e) => setIntakeAt(q.id, e.target.value)}
              rows={q.rows}
              placeholder="ענה כאן במילים שלך"
              style={{ width: "100%", background: "#0D1018", border: "1px solid #2C323E", borderRadius: 10, padding: "12px 14px", color: "#EDE9E1", fontFamily: "inherit", fontSize: 15, lineHeight: 1.6, resize: "vertical", outline: "none", direction: "rtl", boxSizing: "border-box" }}
            />
            {q.id === "story" && intakeProbeVisible && q.probe ? (
              <div style={{ marginTop: 10, background: "#1F1A0F", border: "1px solid #6A5024", padding: "10px 12px", borderRadius: 8, fontSize: 14, color: "#E8B94A", lineHeight: 1.55 }}>
                <strong style={{ color: "#C9964A", marginInlineEnd: 6 }}>הדר עצרה אותך.</strong>
                {q.probe}
              </div>
            ) : null}
          </div>
        ))}

        {intakeError ? (
          <div style={{ color: "#E8B4B4", fontSize: 14, marginTop: 16 }}>{intakeError}</div>
        ) : null}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button type="button" onClick={submitIntake} style={goldBtn}>
            בנה לי את הסרטון
          </button>
          <div style={{ color: "#9E9990", fontSize: 13, marginTop: 10 }}>הדר לוקחת את המילים שלך + האות שלך + כותבת סרטון של 20-30 שניות.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <FirstReelFooter />
        </div>
        <BackToSignalBar token={token} />
      </div>
    </div>
  );

  if (phase === "refining") return (
    <Centered>
      <div style={{ fontSize: 34, marginBottom: 14 }}>✨</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>הדר כותבת מהמילים שלך</h1>
      <p style={{ color: "#D6D2C9", fontSize: 14 }}>בוחרת מהלך, מסדרת, עוברת עורך. עוד רגע.</p>
    </Centered>
  );

  // ── prep: the product's prep screen shape with the first-reel script ──
  if (phase === "prep" || rec.cameraState === "denied" || rec.cameraState === "unsupported") return (
    <div dir="rtl" style={{ ...pageShell, overflowY: "auto" }} className="font-assistant">
      <RoomStyles />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "26px 20px 160px" }}>
        <div style={{ fontSize: 14, letterSpacing: 1, color: "#E8B94A", fontWeight: 700, marginBottom: 6 }}>הסרטון הראשון שלך · 15 שניות</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#EDE9E1", margin: "0 0 4px" }}>{title}</h1>
        <div style={{ background: "#141820", border: "1px solid rgba(232,185,74,0.14)", borderRadius: 16, padding: 24, marginTop: 20 }}>
          {editing ? (
            <>
              <label style={{ color: "#9E9990", fontSize: 12, letterSpacing: 1, display: "block", marginBottom: 4 }}>פתיח</label>
              <textarea
                value={editHook}
                onChange={(e) => setEditHook(e.target.value)}
                rows={2}
                style={{ width: "100%", background: "#0D1018", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 12px", color: "#E8B94A", fontFamily: "inherit", fontSize: 17, fontWeight: 700, lineHeight: 1.5, resize: "vertical", outline: "none", direction: "rtl", boxSizing: "border-box", marginBottom: 14 }}
              />
              <label style={{ color: "#9E9990", fontSize: 12, letterSpacing: 1, display: "block", marginBottom: 4 }}>גוף</label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={5}
                style={{ width: "100%", background: "#0D1018", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 12px", color: "#EDE9E1", fontFamily: "inherit", fontSize: 16, lineHeight: 1.7, resize: "vertical", outline: "none", direction: "rtl", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => { setEditing(false); }}
                  style={{ background: "transparent", color: "#9E9990", border: "1px solid #2C323E", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextScript = [editHook.trim(), editBody.trim()].filter(Boolean).join("\n");
                    setScript(nextScript);
                    setEditing(false);
                  }}
                  style={{ background: "#C9964A", color: "#0D1018", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  שמור
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: "#E8B94A", fontWeight: 700, fontSize: 20, lineHeight: 1.6, margin: 0 }}>{scriptShape.hook}</p>
              {scriptShape.body ? (
                <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.8, marginTop: 12 }}>{scriptShape.body}</p>
              ) : null}
              {scriptShape.cta ? (
                <p style={{ color: "#E8B94A", fontWeight: 700, fontSize: 18, marginTop: 12, marginBottom: 0 }}>{scriptShape.cta}</p>
              ) : null}
              <div style={{ textAlign: "left", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditHook(scriptShape.hook ?? "");
                    setEditBody([scriptShape.body, scriptShape.cta].filter(Boolean).join("\n"));
                    setEditing(true);
                  }}
                  style={{ background: "transparent", color: "#9E9990", border: "1px solid #2C323E", borderRadius: 6, padding: "6px 12px", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
                >
                  ✎ ערוך תסריט
                </button>
              </div>
            </>
          )}
        </div>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {(["prep.tip.eyeline", "prep.tip.one_friend", "prep.tip.no_fixing"] as const).map((k) => (
            <div key={k} style={{ background: "#1D2430", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#CDD1DA", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ color: "#7FD49B", fontWeight: 700 }}>✓</span>
              {getBroadcastCopy(k)}
            </div>
          ))}
        </div>
        {rec.cameraState === "denied" ? (
          <div style={{ background: "#1D2430", border: "1px solid rgba(232,185,74,0.3)", borderRadius: 12, padding: "14px 16px", marginTop: 20, fontSize: 14, color: "#CDD1DA", textAlign: "right", lineHeight: 1.8 }}>
            <strong style={{ color: "#E8B94A", display: "block", marginBottom: 4 }}>{getBroadcastCopy("permission.title")}</strong>
            {getBroadcastCopy("permission.step1")} · {getBroadcastCopy("permission.step2")} · {getBroadcastCopy("permission.step3")}
          </div>
        ) : null}
        {rec.cameraState === "unsupported" ? (
          <p style={{ color: "#D6D2C9", fontSize: 14, marginTop: 20, textAlign: "center" }}>
            {getBroadcastCopy("error.unsupported")}
          </p>
        ) : null}
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <button
            style={goldBtn}
            onClick={() => {
              setPhase("room");
              rec.requestCamera();
            }}
          >
            לצלם עכשיו 🎬
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <FirstReelFooter />
        </div>
        <BackToSignalBar token={token} />
      </div>
    </div>
  );

  if (phase === "review") return (
    <div dir="rtl" style={{ ...pageShell, minHeight: "calc(100dvh - 64px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
      <RoomStyles />
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>איך יצא?</h1>
      {blobUrl && (
        <div style={frame}>
          <video src={blobUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
        <button style={goldBtn} onClick={submitTake}>שלחו לבמאית לכתוביות ←</button>
        <button onClick={anotherTake} style={ghostBtn}>עוד טייק</button>
      </div>
    </div>
  );

  if (phase === "uploading" || phase === "processing") {
    const EST_MS = 150_000; // honest budget: transcription + burn on a real take
    const remaining = Math.max(0, Math.ceil((EST_MS - processingElapsed) / 1000));
    const pct = Math.min(95, Math.round((processingElapsed / EST_MS) * 100));
    return (
      <Centered>
        <div style={{ fontSize: 38, marginBottom: 14 }}>🎬</div>
        <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 8 }}>
          {phase === "uploading" ? "הטייק עולה לבמאית..." : "הבמאית עובדת על הסרטון שלך"}
        </h1>
        <p style={{ color: "#D6D2C9", fontSize: 14, maxWidth: 340, lineHeight: 1.8 }}>
          תמלול, סנכרון כתוביות וחיתוך. בדיוק כמו בכוורת.
        </p>
        {phase === "processing" ? (
          <>
            <div style={{ marginTop: 18, width: 240, height: 6, background: "#1D2430", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #E8B94A, #C9964A)", borderRadius: 3, transition: "width 1s linear" }} />
            </div>
            <p style={{ color: "#E8B94A", fontSize: 14, fontWeight: 700, marginTop: 10 }}>
              {remaining > 0
                ? `נשארו בערך ${remaining >= 60 ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} דקות` : `${remaining} שניות`}`
                : "עוד רגעים אחדים, הבמאית מסיימת..."}
            </p>
          </>
        ) : (
          <div style={{ marginTop: 18, width: 200, height: 4, background: "#1D2430", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: "40%", height: "100%", background: "linear-gradient(90deg, #E8B94A, #C9964A)", borderRadius: 2, animation: "frslide 1.4s ease-in-out infinite" }} />
          </div>
        )}
        <style>{`@keyframes frslide { 0% { margin-right: -40%; } 100% { margin-right: 100%; } }`}</style>
      </Centered>
    );
  }

  if (phase === "failed") return (
    <Centered>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>הכתוביות לא הסתדרו הפעם</h1>
      <p style={{ color: "#D6D2C9", fontSize: 14, marginBottom: 16 }}>הטייק שלך שמור, אפשר לנסות שוב</p>
      {blobUrl && (
        <div style={{ ...frame, width: "min(400px, 92vw, calc(40dvh * 0.5625))", marginBottom: 16 }}>
          <video src={blobUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap", justifyContent: "center" }}>
        <button style={goldBtn} onClick={submitTake}>לנסות שוב ←</button>
        <button onClick={anotherTake} style={ghostBtn}>לצלם מחדש</button>
      </div>
      <Upsell />
    </Centered>
  );

  if (phase === "result") return (
    <div dir="rtl" style={{ ...pageShell, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px 140px", textAlign: "center" }}>
      <RoomStyles />
      <BackToSignalBar token={token} />
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>הרילס הראשון שלך מוכן 🎉</h1>
      <p style={{ ...gold, fontSize: 14, marginBottom: 14 }}>{title} · עם כתוביות מסונכרנות</p>
      {/* Alon 2026-07-24: repeated invisibility reports. Fixed pixel
          dimensions (240×427 = 9/16 portrait) that don't depend on
          aspect-ratio or padding-bottom tricks, and don't shrink to
          zero on any layout. maxWidth caps on narrow phones only. */}
      <div style={{ width: 240, height: 427, maxWidth: "78vw", background: "#000", borderRadius: 20, overflow: "hidden", border: "1px solid #2C323E", marginBottom: 16, position: "relative" }}>
        {finalUrl ? (
          <video
            src={finalUrl}
            controls
            playsInline
            preload="metadata"
            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", background: "#000" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9E9990", fontSize: 13 }}>
            מכינה את הצפייה…
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap", justifyContent: "center" }}>
        {finalUrl && <SaveReelButton finalUrl={finalUrl} downloadUrl={downloadUrl ?? finalUrl} title={title} />}
        <button onClick={anotherTake} style={ghostBtn}>לצלם שוב</button>
      </div>
      <Upsell />
      <FirstReelFooter />
    </div>
  );

  // ── phase === "room": the member room, verbatim ──
  return (
    <div dir="rtl" style={shell} className="font-assistant">
      <RoomStyles />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <video
            ref={rec.attachPreview}
            autoPlay
            muted
            playsInline
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", transform: "scaleX(-1)",
            }}
          />
        </div>
      </div>
      {!rec.isRecording ? (
        <button
          type="button"
          aria-label={getBroadcastCopy("room.exit")}
          className="br-btn"
          onClick={() => {
            rec.releaseCamera();
            setPhase(take ? "review" : "prep");
          }}
          style={{
            position: "absolute", top: "calc(env(safe-area-inset-top) + 10px)", insetInlineEnd: 12,
            zIndex: 30, width: 38, height: 38, borderRadius: 19,
            border: "1px solid rgba(237,233,225,0.3)", background: "rgba(8,12,20,0.6)",
            color: "#EDE9E1", fontSize: 16, cursor: "pointer",
          }}
        >
          ✕
        </button>
      ) : null}
      <Teleprompter
        hook={scriptShape.hook}
        body={scriptShape.body}
        cta={scriptShape.cta}
        language={language}
        voiceSamplesRef={rec.rmsSamplesRef}
        running={rec.isRecording && countdown === null}
        onRegisterControls={(h) => { prompterRef.current = h; }}
      />
      {countdown !== null ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,12,20,0.7)" }}>
          <span style={{ fontSize: 120, fontWeight: 800, color: "#E8B94A" }}>{countdown}</span>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, zIndex: 25,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 18px)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          background: "linear-gradient(to top, rgba(8,12,20,0.85), transparent)", paddingTop: 40,
        }}
      >
        {banner ? (
          <div style={{ background: "rgba(20,24,32,0.9)", border: "1px solid rgba(232,185,74,0.4)", borderRadius: 12, padding: "6px 14px", fontSize: 14, color: "#E8B94A" }}>
            {banner}
          </div>
        ) : null}
        {rec.isRecording ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(20,24,32,0.85)", borderRadius: 16, padding: "4px 14px", border: "1px solid rgba(232,185,74,0.3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: rec.elapsedMs > MAX_TAKE_MS ? "#E8B94A" : "#e14848", animation: "pulse 1.2s infinite" }} />
            <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums", fontSize: 15, color: "#EDE9E1" }}>
              {formatMs(rec.elapsedMs)}
            </span>
          </div>
        ) : null}
        {rec.zoom ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ZoomPill label="-" onClick={() => rec.setCameraZoom(Math.max(rec.zoom!.min, +(rec.zoom!.current - 0.25).toFixed(2)))} />
            <span style={{ color: "#D6D2C9", fontSize: 14 }} dir="ltr">
              {getBroadcastCopy("room.zoom")} {rec.zoom.current.toFixed(2).replace(/\.?0+$/, "")}x
            </span>
            <ZoomPill label="+" onClick={() => rec.setCameraZoom(Math.min(rec.zoom!.max, +(rec.zoom!.current + 0.25).toFixed(2)))} />
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <GhostCircle label={getBroadcastCopy("room.restart")} onClick={() => prompterRef.current?.restart()} />
          <button
            type="button"
            aria-label={getBroadcastCopy(rec.isRecording ? "room.stop" : "room.record")}
            onClick={rec.isRecording ? stopTake : beginCountdown}
            style={{
              width: 72, height: 72, borderRadius: 36, border: "3px solid #E8B94A",
              background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span
              style={{
                width: rec.isRecording ? 26 : 54, height: rec.isRecording ? 26 : 54,
                borderRadius: rec.isRecording ? 6 : 27, background: "#E8B94A", transition: "all 0.2s",
              }}
            />
          </button>
          <GhostCircle label={getBroadcastCopy("room.pause")} onClick={() => prompterRef.current?.pause()} />
        </div>
        {!rec.isRecording ? (
          <p style={{ color: "#CDD1DA", fontSize: 14, textAlign: "center", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            {getBroadcastCopy(isDesktopUA ? "room.placement_hint_desktop" : "room.placement_hint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
