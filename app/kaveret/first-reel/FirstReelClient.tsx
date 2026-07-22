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
  | "loading" | "prep" | "room" | "review"
  | "uploading" | "processing" | "result" | "failed" | "error";

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
        color: "#EDE9E1", borderRadius: 999, padding: "9px 14px", fontSize: 13.5, cursor: "pointer",
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
          setPhase("prep");
        }
      } catch {
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractionId, token]);

  useEffect(() => () => { rec.releaseCamera(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [countdown, rec, beep, isDesktopUA]);

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
  const gold = { color: "#E8B94A" };
  const goldBtn: React.CSSProperties = {
    background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
    color: "#0D1018", fontWeight: 800, fontSize: 16, border: "none",
    borderRadius: 12, padding: "14px 34px", cursor: "pointer", textDecoration: "none", display: "inline-block",
  };
  const ghostBtn: React.CSSProperties = {
    background: "none", border: "1px solid #2C323E", color: "#B9B4AA",
    borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer", textDecoration: "none", display: "inline-block",
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

  // The complete package, mirrored from /signal-hive (keep in sync with
  // app/signal-hive/page.tsx FOLDERS) + the challenge live session.
  const FOLDERS: [string, string, string][] = [
    ["0", "לוח האות", "האות שלך, הכאב שהוא פותר, ההבטחה והקהל, במקום אחד"],
    ["1", "אתגר האות · 7 ימים", "שבעה שיעורי עומק עם הדר, ממוסגרים סביב האות שלך + מפגש חי בזום"],
    ["2", "ערכת תוכן", "7 כיווני-תוכן וספריית פתיחות, כולם נגזרים מהאות שלך"],
    ["3", "ערכת ויזואל", "כרטיסי האות מוכנים לשיתוף + 7 כיווני-צילום"],
    ["4", "הבמאית", "7 בימויים אישיים, בדיוק כמו הסרטון שרק עשית, עם הכתוביות"],
  ];

  const Upsell = () => (
    <div style={{ maxWidth: 460, width: "100%", background: "linear-gradient(145deg, #1D2430, #111620)", border: "1px solid #C9964A55", borderRadius: 16, padding: "24px 22px", textAlign: "right" }}>
      <div style={{ fontSize: 13, letterSpacing: 2, color: "#9E7C3A", marginBottom: 6, textAlign: "center" }}>כוורת האות</div>
      <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.7, margin: "0 0 14px", textAlign: "center" }}>
        ככה עובדת הבמאית, על כל סרטון שלך.
        <br />
        <span style={gold}>וזה רק חלק אחד מחמישה.</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {FOLDERS.map(([n, t, d]) => (
          <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#14182066", borderRadius: 10, padding: "10px 12px" }}>
            <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, border: "1px solid #C9964A66", color: "#E8B94A", fontSize: 13.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#EDE9E1" }}>{t}</span>
              <span style={{ display: "block", fontSize: 13.5, color: "#B9B4AA", lineHeight: 1.6 }}>{d}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #2C323E", paddingTop: 14, fontSize: 14, lineHeight: 1.85 }}>
        <p style={{ margin: "0 0 10px" }}>
          <strong style={gold}>מה מקבלים עכשיו, בתשלום אחד של 590₪:</strong>
          <br />
          את כל חמש התיקיות, כולן נגזרות מהאות שלך. בלי התחייבות נוספת.
          <br />
          <span style={{ color: "#7FD49B", fontSize: 13 }}>ואם ממשיכים לסדנה, כל ה-590₪ מתקזזים ממחירה.</span>
        </p>
        <p style={{ margin: 0, color: "#B9B4AA" }}>
          <strong style={{ color: "#EDE9E1" }}>ומה בהמשך, רק אם תרצו:</strong>
          <br />
          אנחנו ממשיכים לייצר לכם תוכן, פוסטים וסרטונים, ב-99₪ לחודש. מפסיקים מתי שרוצים.
        </p>
      </div>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <a href="/signal-hive" style={goldBtn}>לפתוח את הכוורת ←</a>
      </div>
    </div>
  );

  const Centered = ({ children }: { children: React.ReactNode }) => (
    <div dir="rtl" style={{ ...shell, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
      <RoomStyles />
      {children}
    </div>
  );

  if (phase === "loading") return (
    <Centered>
      <div style={{ fontSize: 34, marginBottom: 14 }}>✨</div>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>התסריט שלך נכתב מהאות</h1>
      <p style={{ color: "#B9B4AA", fontSize: 14 }}>עוד רגע קטן...</p>
    </Centered>
  );

  if (phase === "error") return (
    <Centered>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>התסריט עוד לא מוכן</h1>
      <p style={{ color: "#B9B4AA", fontSize: 14, marginBottom: 20 }}>נסו לרענן את העמוד בעוד רגע</p>
      <a href={`/kaveret/i?t=${encodeURIComponent(token)}`} style={ghostBtn}>חזרה לאות ←</a>
    </Centered>
  );

  // ── prep: the product's prep screen shape with the first-reel script ──
  if (phase === "prep" || rec.cameraState === "denied" || rec.cameraState === "unsupported") return (
    <div dir="rtl" style={{ ...shell, overflowY: "auto" }} className="font-assistant">
      <RoomStyles />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "26px 20px 120px" }}>
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#9E7C3A", marginBottom: 6 }}>הסרטון הראשון שלך · 15 שניות</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#EDE9E1", margin: "0 0 4px" }}>{title}</h1>
        <div style={{ background: "#141820", border: "1px solid rgba(232,185,74,0.14)", borderRadius: 16, padding: 24, marginTop: 20 }}>
          <p style={{ color: "#E8B94A", fontWeight: 700, fontSize: 20, lineHeight: 1.6, margin: 0 }}>{scriptShape.hook}</p>
          {scriptShape.body ? (
            <p style={{ color: "#EDE9E1", fontSize: 17, lineHeight: 1.8, marginTop: 12 }}>{scriptShape.body}</p>
          ) : null}
          {scriptShape.cta ? (
            <p style={{ color: "#E8B94A", fontWeight: 700, fontSize: 18, marginTop: 12, marginBottom: 0 }}>{scriptShape.cta}</p>
          ) : null}
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
          <div style={{ background: "#1D2430", border: "1px solid rgba(232,185,74,0.3)", borderRadius: 12, padding: "14px 16px", marginTop: 20, fontSize: 13.5, color: "#CDD1DA", textAlign: "right", lineHeight: 1.8 }}>
            <strong style={{ color: "#E8B94A", display: "block", marginBottom: 4 }}>{getBroadcastCopy("permission.title")}</strong>
            {getBroadcastCopy("permission.step1")} · {getBroadcastCopy("permission.step2")} · {getBroadcastCopy("permission.step3")}
          </div>
        ) : null}
        {rec.cameraState === "unsupported" ? (
          <p style={{ color: "#B9B4AA", fontSize: 14, marginTop: 20, textAlign: "center" }}>
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
      </div>
    </div>
  );

  if (phase === "review") return (
    <div dir="rtl" style={{ ...shell, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
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
        <p style={{ color: "#B9B4AA", fontSize: 14, maxWidth: 340, lineHeight: 1.8 }}>
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
      <p style={{ color: "#B9B4AA", fontSize: 14, marginBottom: 16 }}>הטייק שלך שמור, אפשר לנסות שוב</p>
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
    <Centered>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>הרילס הראשון שלך מוכן 🎉</h1>
      <p style={{ ...gold, fontSize: 14, marginBottom: 14 }}>{title} · עם כתוביות מסונכרנות</p>
      {finalUrl && (
        <div style={{ ...frame, width: "min(400px, 92vw, calc(48dvh * 0.5625))", marginBottom: 16 }}>
          <video src={finalUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap", justifyContent: "center" }}>
        {downloadUrl && <a href={downloadUrl} style={goldBtn}>להוריד את הרילס ⬇</a>}
        {typeof navigator !== "undefined" && "share" in navigator && finalUrl && (
          <button style={ghostBtn} onClick={() => navigator.share({ url: finalUrl, title }).catch(() => {})}>
            לשתף
          </button>
        )}
        <button onClick={anotherTake} style={ghostBtn}>לצלם שוב</button>
      </div>
      <Upsell />
    </Centered>
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
          <div style={{ background: "rgba(20,24,32,0.9)", border: "1px solid rgba(232,185,74,0.4)", borderRadius: 12, padding: "6px 14px", fontSize: 13, color: "#E8B94A" }}>
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
            <span style={{ color: "#B9B4AA", fontSize: 13 }} dir="ltr">
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
          <p style={{ color: "#CDD1DA", fontSize: 13.5, textAlign: "center", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            {getBroadcastCopy(isDesktopUA ? "room.placement_hint_desktop" : "room.placement_hint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
