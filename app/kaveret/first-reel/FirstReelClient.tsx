"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The first-reel experience: script → countdown → 15s front-camera recording
 * with a scrolling prompter → the take goes to the REAL broadcast engine
 * (Whisper transcription + synced captions burned with the exact member
 * settings) → the finished reel comes back for playback + download.
 *
 * Download/playback use server signed URLs (iOS Safari ignores the download
 * attribute on blob links - the reason v1 "didn't work" on iPhone).
 */

type Phase =
  | "loading" | "ready" | "countdown" | "recording"
  | "review" | "uploading" | "processing" | "result" | "failed"
  | "fallback" | "error";

const MAX_SECONDS = 16;
const POLL_MS = 3500;
const POLL_MAX_MS = 5 * 60_000;

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

export function FirstReelClient({ extractionId, token }: { extractionId: string; token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const mimeRef = useRef("video/webm");
  const prompterRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // ── script ──
  useEffect(() => {
    track("FIRST_REEL_VIEW", extractionId);
    (async () => {
      try {
        const res = await fetch(`/api/signal/${extractionId}/first-reel?t=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setTitle(data.title);
        setScript(data.script);
        setPhase("ready");
      } catch {
        setPhase("error");
      }
    })();
  }, [extractionId, token]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => () => { stopStream(); cancelAnimationFrame(rafRef.current); }, [stopStream]);

  // ── camera ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      setPhase("countdown");
      setCount(3);
    } catch {
      setPhase("fallback");
    }
  }, []);

  useEffect(() => {
    if ((phase === "countdown" || phase === "recording") && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  // ── countdown → record ──
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { beginRecording(); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  const beginRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) { setPhase("fallback"); return; }
    // Safari records mp4; Chrome records webm (broadcast-room learning)
    const mime = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
    mimeRef.current = mime.startsWith("video/mp4") ? "video/mp4" : "video/webm";
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, { mimeType: mime });
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current });
      blobRef.current = blob;
      setBlobUrl(URL.createObjectURL(blob));
      stopStream();
      setPhase("review");
      track("FIRST_REEL_RECORDED", extractionId);
    };
    recorderRef.current = rec;
    rec.start(500);
    setElapsed(0);
    setPhase("recording");

    const el = prompterRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const sec = (now - start) / 1000;
      setElapsed(Math.min(sec, MAX_SECONDS));
      if (el) {
        const total = el.scrollHeight - el.clientHeight;
        const p = Math.min(Math.max((sec - 1.5) / 13, 0), 1);
        el.scrollTop = total * p;
      }
      if (sec >= MAX_SECONDS) { recorderRef.current?.state === "recording" && recorderRef.current.stop(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [extractionId, stopStream]);

  const stopEarly = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const retake = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    blobRef.current = null;
    setFinalUrl(null);
    setDownloadUrl(null);
    startCamera();
  }, [blobUrl, startCamera]);

  // ── send to the engine + poll ──
  // The take uploads DIRECTLY to storage via a signed URL (Vercel's 4.5MB
  // request limit rejects real takes; the member product solved this the
  // same way with TUS). Then a tiny process call kicks the render.
  const submitTake = useCallback(async () => {
    const blob = blobRef.current;
    if (!blob) return;
    setPhase("uploading");
    try {
      const urlRes = await fetch(`/api/signal/${extractionId}/first-reel/upload?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime: mimeRef.current }),
      });
      const { uploadUrl, path } = await urlRes.json();
      if (!urlRes.ok || !uploadUrl) throw new Error("upload url failed");

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeRef.current, "x-upsert": "true" },
        body: blob,
      });
      if (!put.ok) throw new Error("storage upload failed");

      const proc = await fetch(`/api/signal/${extractionId}/first-reel/process?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!proc.ok) throw new Error("process failed");
      setPhase("processing");
      track("FIRST_REEL_SUBMITTED", extractionId);

      const deadline = Date.now() + POLL_MAX_MS;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        const st = await fetch(`/api/signal/${extractionId}/first-reel/status?t=${encodeURIComponent(token)}`);
        const data = await st.json();
        if (data.status === "ready" && data.url) {
          setFinalUrl(data.url);
          setDownloadUrl(data.downloadUrl ?? data.url);
          setPhase("result");
          track("FIRST_REEL_READY", extractionId);
          return;
        }
        if (data.status === "failed") { setPhase("failed"); return; }
      }
      setPhase("failed");
    } catch {
      setPhase("failed");
    }
  }, [extractionId, token]);

  // ── styles ──
  const S = {
    page: { minHeight: "100dvh", background: "#080C14", color: "#EDE9E1", fontFamily: "var(--font-assistant), Assistant, sans-serif", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" as const },
    gold: { color: "#E8B94A" },
    btn: { background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)", color: "#0D1018", fontWeight: 800, fontSize: 16, border: "none", borderRadius: 12, padding: "14px 34px", cursor: "pointer", textDecoration: "none", display: "inline-block" },
    ghost: { background: "none", border: "1px solid #2C323E", color: "#9E9990", borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer", textDecoration: "none", display: "inline-block" },
    frame: { position: "relative" as const, width: "min(400px, 92vw)", aspectRatio: "9/16", maxHeight: "72dvh", borderRadius: 20, overflow: "hidden", background: "#000", border: "1px solid #2C323E" },
  };

  const offerHref = `/kaveret/i?t=${encodeURIComponent(token)}#kaveret-offer`;

  const Upsell = () => (
    <div style={{ maxWidth: 440, background: "linear-gradient(145deg, #1D2430, #111620)", border: "1px solid #C9964A55", borderRadius: 16, padding: "22px 24px" }}>
      <div style={{ fontSize: 12, letterSpacing: 2, color: "#9E7C3A", marginBottom: 8 }}>כוורת האות</div>
      <p style={{ fontSize: 15, lineHeight: 1.85, margin: "0 0 14px", textAlign: "right" }}>
        ככה עובדת הבמאית, על כל סרטון שלך.
      </p>
      <div style={{ textAlign: "right", fontSize: 14, lineHeight: 1.85, margin: "0 0 14px" }}>
        <p style={{ margin: "0 0 10px" }}>
          <strong style={S.gold}>מה מקבלים עכשיו, בתשלום אחד של 590₪:</strong>
          <br />
          כל 7 הסרטונים של העונה הראשונה, כתובים מהאות שלך, עם הבמאית והכתוביות. בלי התחייבות נוספת.
        </p>
        <p style={{ margin: 0, color: "#9E9990" }}>
          <strong style={{ color: "#EDE9E1" }}>ומה בהמשך, רק אם תרצו:</strong>
          <br />
          אנחנו ממשיכים לייצר לכם תוכן, פוסטים וסרטונים, ב-99₪ לחודש. מפסיקים מתי שרוצים.
        </p>
      </div>
      <a href={offerHref} style={S.btn}>לפתוח את הכוורת ←</a>
    </div>
  );

  if (phase === "loading") return (
    <div style={S.page} dir="rtl">
      <div style={{ fontSize: 34, marginBottom: 14 }}>✨</div>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>התסריט שלך נכתב מהאות</h1>
      <p style={{ color: "#9E9990", fontSize: 14 }}>עוד רגע קטן...</p>
    </div>
  );

  if (phase === "error") return (
    <div style={S.page} dir="rtl">
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>התסריט עוד לא מוכן</h1>
      <p style={{ color: "#9E9990", fontSize: 14, marginBottom: 20 }}>נסו לרענן את העמוד בעוד רגע</p>
      <a href={`/kaveret/i?t=${encodeURIComponent(token)}`} style={S.ghost}>חזרה לאות ←</a>
    </div>
  );

  if (phase === "ready" || phase === "fallback") return (
    <div style={S.page} dir="rtl">
      <div style={{ maxWidth: 440 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: "#9E7C3A", marginBottom: 8 }}>הסרטון הראשון שלך · 15 שניות</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 18 }}>{title}</h1>
        <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 14, padding: "20px 22px", textAlign: "right", marginBottom: 20 }}>
          {script.split("\n").map((line, i) => (
            <p key={i} style={{ fontSize: 17, lineHeight: 1.9, margin: "0 0 6px" }}>{line}</p>
          ))}
        </div>
        {phase === "fallback" ? (
          <>
            <p style={{ color: "#9E9990", fontSize: 14, marginBottom: 16 }}>
              המצלמה לא זמינה בדפדפן הזה. אפשר לצלם את התסריט במצלמת הטלפון הרגילה, שורה-שורה, ולחזור לכאן.
            </p>
            <a href={offerHref} style={S.btn}>ככה זה נראה בכוורת ←</a>
          </>
        ) : (
          <>
            <p style={{ color: "#9E9990", fontSize: 14, marginBottom: 18 }}>
              הטקסט ירוץ על המסך בקצב דיבור. אחרי הצילום הבמאית מוסיפה כתוביות מסונכרנות ומחזירה רילס מוכן.
            </p>
            <button style={S.btn} onClick={startCamera}>לצלם עכשיו 🎬</button>
          </>
        )}
      </div>
    </div>
  );

  if (phase === "countdown" || phase === "recording") return (
    <div style={S.page} dir="rtl">
      <div style={S.frame}>
        <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        {phase === "countdown" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,12,20,0.55)", fontSize: 96, fontWeight: 800, color: "#E8B94A" }}>
            {count === 0 ? "▶" : count}
          </div>
        )}
        {phase === "recording" && (
          <>
            <div ref={prompterRef} style={{ position: "absolute", top: 0, left: 0, right: 0, height: "42%", overflow: "hidden", background: "linear-gradient(to bottom, rgba(8,12,20,0.92) 70%, transparent)", padding: "18px 20px 40px", textAlign: "center" }}>
              {script.split("\n").map((line, i) => (
                <p key={i} style={{ fontSize: 22, lineHeight: 1.8, fontWeight: 700, color: "#FFFFFF", margin: "0 0 10px", textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>{line}</p>
              ))}
              <div style={{ height: 120 }} />
            </div>
            <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <span style={{ background: "rgba(8,12,20,0.7)", borderRadius: 8, padding: "4px 10px", fontSize: 13, color: "#EA4335", fontWeight: 700 }}>
                ● {Math.max(0, Math.ceil(MAX_SECONDS - elapsed))}
              </span>
              <button onClick={stopEarly} style={{ background: "#EA4335", border: "none", borderRadius: "50%", width: 52, height: 52, cursor: "pointer", fontSize: 18 }}>■</button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (phase === "review") return (
    <div style={S.page} dir="rtl">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>איך יצא?</h1>
      {blobUrl && (
        <div style={{ ...S.frame, maxHeight: "58dvh", marginBottom: 16 }}>
          <video src={blobUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button style={S.btn} onClick={submitTake}>שלחו לבמאית לכתוביות ←</button>
        <button onClick={retake} style={S.ghost}>לצלם שוב</button>
      </div>
    </div>
  );

  if (phase === "uploading" || phase === "processing") return (
    <div style={S.page} dir="rtl">
      <div style={{ fontSize: 38, marginBottom: 14 }}>🎬</div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 8 }}>
        {phase === "uploading" ? "הטייק עולה לבמאית..." : "הבמאית עובדת על הסרטון שלך"}
      </h1>
      <p style={{ color: "#9E9990", fontSize: 14, maxWidth: 340, lineHeight: 1.8 }}>
        תמלול, סנכרון כתוביות וחיתוך. בדיוק כמו בכוורת.
        <br />
        זה לוקח בערך דקה, שווה לחכות.
      </p>
      <div style={{ marginTop: 18, width: 200, height: 4, background: "#1D2430", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: "40%", height: "100%", background: "linear-gradient(90deg, #E8B94A, #C9964A)", borderRadius: 2, animation: "frslide 1.4s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes frslide { 0% { margin-right: -40%; } 100% { margin-right: 100%; } }`}</style>
    </div>
  );

  if (phase === "failed") return (
    <div style={S.page} dir="rtl">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>הכתוביות לא הסתדרו הפעם</h1>
      <p style={{ color: "#9E9990", fontSize: 14, marginBottom: 16 }}>הטייק הגולמי שלך שמור כאן בינתיים</p>
      {blobUrl && (
        <div style={{ ...S.frame, maxHeight: "44dvh", marginBottom: 16 }}>
          <video src={blobUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap", justifyContent: "center" }}>
        <button style={S.btn} onClick={submitTake}>לנסות שוב ←</button>
        <button onClick={retake} style={S.ghost}>לצלם מחדש</button>
      </div>
      <Upsell />
    </div>
  );

  // result — the finished reel with burned captions
  return (
    <div style={S.page} dir="rtl">
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>הרילס הראשון שלך מוכן 🎉</h1>
      <p style={{ ...S.gold, fontSize: 14, marginBottom: 14 }}>{title} · עם כתוביות מסונכרנות</p>
      {finalUrl && (
        <div style={{ ...S.frame, maxHeight: "52dvh", marginBottom: 16 }}>
          <video src={finalUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap", justifyContent: "center" }}>
        {downloadUrl && <a href={downloadUrl} style={S.btn}>להוריד את הרילס ⬇</a>}
        {typeof navigator !== "undefined" && "share" in navigator && finalUrl && (
          <button
            style={S.ghost}
            onClick={() => navigator.share({ url: finalUrl, title }).catch(() => {})}
          >
            לשתף
          </button>
        )}
        <button onClick={retake} style={S.ghost}>לצלם שוב</button>
      </div>
      <Upsell />
    </div>
  );
}
