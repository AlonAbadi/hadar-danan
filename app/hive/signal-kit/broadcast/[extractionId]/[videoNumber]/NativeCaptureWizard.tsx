// חדר השידור — guided wizard for the native-camera path (r4).
//
// Expert-panel redesign (2026-07-20): the cramped bottom sheet became a
// fullscreen two-step wizard. One action per screen, one gold button per
// screen, auto-advance on success signals. The PiP window is "חלון הטקסט",
// never a technical term. The client enters PiP then PAUSES on the title
// card — she starts the scroll from the native PiP play button after the
// camera is already recording (page JS is suspended in the background, so
// every second of timing is baked into the MP4 itself).
//
// DOM invariant: the <video> element renders exactly ONCE at a stable tree
// position (visibility via CSS + flex order) — moving it between steps
// would unmount it and kill the live PiP window.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBroadcastCopy, getBroadcastLanguage } from "@/lib/broadcast-copy";
import { ActionButton } from "./ui";

type Step = "intro" | "s1" | "s2" | "e1" | "e2";

export const PIP_TUTORIAL_KEY = "broadcast_pip_tutorial_done";

export function NativeCaptureWizard({
  extractionId,
  videoNumber,
  onOpenCamera,
  onClose,
}: {
  extractionId: string;
  videoNumber: number;
  onOpenCamera: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(() => {
    try {
      return localStorage.getItem(PIP_TUTORIAL_KEY) ? "s1" : "intro";
    } catch {
      return "intro";
    }
  });
  const [floatUrl, setFloatUrl] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [entering, setEntering] = useState(false);
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraLaunchedRef = useRef(false);
  const enteringRef = useRef(false);
  const pipEnteredRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Fetch the prompter MP4 (server-cached per user/video/wpm).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const wpm = Number(localStorage.getItem("broadcast_wpm")) || 130;
        const res = await fetch("/api/broadcast/prompter-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ extraction_id: extractionId, video_number: videoNumber, wpm }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { url } = await res.json();
        if (alive) setFloatUrl(url);
      } catch {
        if (alive) setFetchFailed(true); // filming without the prompter stays possible
      }
    })();
    return () => { alive = false; };
  }, [extractionId, videoNumber]);

  const onPipEntered = useCallback(() => {
    const el = videoRef.current;
    if (!el || pipEnteredRef.current) return;
    pipEnteredRef.current = true;
    enteringRef.current = false;
    // The pause IS the design: she starts the scroll from the native PiP
    // play button after the camera is recording. Frame 0 = the title card.
    el.pause();
    try { el.currentTime = 0; } catch { /* keep whatever frame */ }
    setPipActive(true);
    setEntering(false);
    setFlash(true);
    setTimeout(() => {
      if (mountedRef.current) { setFlash(false); setStep("s2"); }
    }, 1100);
  }, []);

  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    const onReady = () => setVideoReady(true);
    el.addEventListener("canplaythrough", onReady, { once: true });
    if (el.readyState >= 3) setVideoReady(true);
    el.addEventListener("webkitpresentationmodechanged", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mode = (el as any).webkitPresentationMode;
      if (mode === "picture-in-picture") onPipEntered();
      else if (mode === "inline") { pipEnteredRef.current = false; setPipActive(false); }
    });
    el.addEventListener("enterpictureinpicture", onPipEntered);
    el.addEventListener("leavepictureinpicture", () => { pipEnteredRef.current = false; setPipActive(false); });
  }, [onPipEntered]);

  // Single user tap — synchronous play + PiP inside the SAME gesture.
  const startPiP = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setEntering(true);
    enteringRef.current = true;
    v.muted = true;
    try { v.currentTime = 0; } catch { /* not seekable yet */ }
    const p = v.play();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wk = v as any;
      if (typeof wk.webkitSupportsPresentationMode === "function" && wk.webkitSupportsPresentationMode("picture-in-picture")) {
        wk.webkitSetPresentationMode("picture-in-picture");
      } else if (v.requestPictureInPicture) {
        v.requestPictureInPicture().catch(() => {
          if (mountedRef.current && !pipEnteredRef.current) { enteringRef.current = false; setEntering(false); setStep("e1"); }
        });
      } else {
        enteringRef.current = false;
        setEntering(false);
        setStep("e1");
        return;
      }
    } catch {
      enteringRef.current = false;
      setEntering(false);
      setStep("e1");
      return;
    }
    p?.catch(() => { /* Low Power Mode — PiP may still open on the poster */ });
    // Safety net: if no PiP event ever fires, surface the retry screen.
    setTimeout(() => {
      if (mountedRef.current && enteringRef.current && !pipEnteredRef.current) {
        enteringRef.current = false;
        setEntering(false);
        setStep("e1");
      }
    }, 2500);
  }, []);

  const openCamera = useCallback(() => {
    cameraLaunchedRef.current = true;
    onOpenCamera();
  }, [onOpenCamera]);

  // Returned from the camera empty-handed: a successful file unmounts this
  // wizard (phase flips to review), so still being here ~1.2s after the page
  // becomes visible again means she came back without a video.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible" || !cameraLaunchedRef.current) return;
      setTimeout(() => {
        if (mountedRef.current && cameraLaunchedRef.current) {
          cameraLaunchedRef.current = false;
          setStep("e2");
        }
      }, 1200);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const dir = getBroadcastLanguage() === "en" ? "ltr" : "rtl";
  const c = getBroadcastCopy;

  const h1: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#EDE9E1", lineHeight: 1.35, margin: "14px 0 0" };
  const bodyTxt: React.CSSProperties = { fontSize: 16, lineHeight: 1.6, color: "#B9BCC4" };
  const skipLink: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#8A8F99",
    fontSize: 15,
    textDecoration: "underline",
    marginTop: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const topBar = (label: string | null) => (
    <div style={{ display: "flex", alignItems: "center", minHeight: 44, position: "relative" }}>
      <button
        type="button"
        aria-label={c("nav.back")}
        onClick={onClose}
        className="br-btn"
        style={{
          width: 38, height: 38, borderRadius: 19,
          border: "1px solid rgba(237,233,225,0.3)",
          background: "rgba(8,12,20,0.6)", color: "#EDE9E1", fontSize: 16,
        }}
      >
        ✕
      </button>
      {label ? (
        <span style={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, textAlign: "center", fontSize: 13, color: "#8A8F99", pointerEvents: "none" }}>
          {label}
        </span>
      ) : null}
    </div>
  );

  const dots = (active: 1 | 2) => (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
      {[1, 2].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i === active ? "#E8B94A" : "#2A2F3A" }} />
      ))}
    </div>
  );

  const numBadge = (n: number) => (
    <span
      style={{
        flex: "0 0 auto", width: 30, height: 30, borderRadius: 15,
        border: "1.5px solid #E8B94A", color: "#E8B94A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 700,
      }}
    >
      {n}
    </span>
  );

  const chip = pipActive ? (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#141820", borderRadius: 999, padding: "6px 14px", alignSelf: "center", marginTop: 10 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: "#7FD49B" }} />
      <span style={{ fontSize: 13.5, color: "#EDE9E1" }}>{c("native.chip_on")} <span style={{ color: "#7FD49B" }}>✓</span></span>
    </div>
  ) : (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#141820", borderRadius: 999, padding: "6px 14px", alignSelf: "center", marginTop: 10 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: "#E8B94A" }} />
      <span style={{ fontSize: 13.5, color: "#B9BCC4" }}>
        {c("native.chip_off")}{" "}
        <button type="button" onClick={startPiP} style={{ background: "none", border: "none", color: "#E8B94A", textDecoration: "underline", fontSize: 13.5, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
          {c("native.chip_reopen")}
        </button>
      </span>
    </div>
  );

  // Flex `order` places the stable video wrapper mid-flow on S1 (between the
  // headline group at order 1 and the body group at order 3) without ever
  // moving it in the DOM.
  const headGroup: React.CSSProperties = { order: 1, display: "flex", flexDirection: "column" };
  const tailGroup: React.CSSProperties = { order: 3, display: "flex", flexDirection: "column", flex: 1 };

  return (
    <div
      dir={dir}
      className="font-assistant"
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "#080C14", overflowY: "auto", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          width: "100%", maxWidth: 480, margin: "0 auto",
          padding: "16px 22px calc(env(safe-area-inset-bottom) + 28px)",
          display: "flex", flexDirection: "column", flex: 1,
        }}
      >
        {/* ── stable video slot (order 2) — mounted once, forever ── */}
        <div style={{ order: 2, display: step === "s1" ? "block" : "none", marginTop: 18 }}>
          {flash ? (
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 16, background: "#141820", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 18, color: "#EDE9E1", fontWeight: 700 }}>
                {c("native.s1_success")} <span style={{ color: "#7FD49B" }}>✓</span>
              </span>
              <span style={{ fontSize: 14, color: "#8A8F99", textAlign: "center", padding: "0 12px" }}>{c("native.s1_drag")}</span>
            </div>
          ) : null}
          {floatUrl ? (
            <video
              ref={attachVideo}
              src={floatUrl}
              playsInline
              muted
              preload="auto"
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 16,
                border: "1px solid rgba(232,185,74,0.35)",
                background: "#000",
                display: flash ? "none" : "block",
              }}
            />
          ) : !fetchFailed ? (
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 16, background: "#141820", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#9E9990", fontSize: 14 }}>
                <span className="br-spinner br-spinner-gold" /> {c("room.float_loading")}
              </span>
            </div>
          ) : null}
        </div>

        {step === "intro" ? (
          <>
            <div style={headGroup}>
              {topBar(null)}
              <h1 style={h1}>{c("native.intro_title")}</h1>
            </div>
            <div style={tailGroup}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                {(["native.intro_step1", "native.intro_step2", "native.intro_step3"] as const).map((k, i) => (
                  <div key={k} style={{ display: "flex", gap: 12, alignItems: "center", background: "#141820", borderRadius: 14, padding: "14px 16px" }}>
                    {numBadge(i + 1)}
                    <span style={{ ...bodyTxt, color: "#DDD9D0" }}>{c(k)}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "#8A8F99", marginTop: 16, lineHeight: 1.6 }}>{c("native.intro_reassure")}</p>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <ActionButton variant="primary" onClick={() => setStep("s1")}>
                  {c("native.intro_cta")}
                </ActionButton>
                <div style={{ textAlign: "center" }}>
                  <button type="button" style={skipLink} onClick={openCamera}>
                    {c("room.float_skip")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {step === "s1" ? (
          <>
            <div style={headGroup}>
              {topBar(c("native.step1_label"))}
              {dots(1)}
              <h1 style={h1}>{c("native.s1_title")}</h1>
            </div>
            <div style={tailGroup}>
              <p style={{ ...bodyTxt, marginTop: 14 }}>{c("native.s1_explain")}</p>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                {fetchFailed ? (
                  <ActionButton variant="primary" onClick={openCamera}>
                    {c("room.float_open_camera")}
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="primary"
                    disabled={!videoReady}
                    busy={entering}
                    busyLabel={c("room.float_loading")}
                    onClick={startPiP}
                  >
                    {c("native.s1_cta")}
                  </ActionButton>
                )}
                <div style={{ textAlign: "center" }}>
                  <button type="button" style={skipLink} onClick={openCamera}>
                    {c("room.float_skip")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {step === "s2" ? (
          <>
            <div style={headGroup}>
              {topBar(c("native.step2_label"))}
              {dots(2)}
              {chip}
              <h1 style={h1}>{c("native.s2_title")}</h1>
            </div>
            <div style={tailGroup}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                {(["native.s2_item1", "native.s2_item2", "native.s2_item3"] as const).map((k, i) => (
                  <div key={k} style={{ display: "flex", gap: 12, alignItems: "center", background: "#141820", borderRadius: 14, padding: "14px 16px" }}>
                    {numBadge(i + 1)}
                    <span style={{ ...bodyTxt, color: "#DDD9D0" }}>{c(k)}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#141820", borderRadius: 14, padding: "14px 16px", marginTop: 14, borderInlineStart: "3px solid #E8B94A" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#EDE9E1", margin: 0 }}>{c("native.s2_pacing_title")}</p>
                <p style={{ fontSize: 14, color: "#B9BCC4", lineHeight: 1.65, margin: "6px 0 0" }}>{c("native.s2_pacing_body")}</p>
              </div>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <ActionButton variant="primary" onClick={openCamera}>
                  {c("room.float_open_camera")}
                </ActionButton>
                <p style={{ fontSize: 13, color: "#8A8F99", textAlign: "center", marginTop: 8 }}>{c("native.s2_front_hint")}</p>
              </div>
            </div>
          </>
        ) : null}

        {step === "e1" ? (
          <>
            <div style={headGroup}>
              {topBar(null)}
              <h1 style={h1}>{c("native.e1_title")}</h1>
            </div>
            <div style={tailGroup}>
              <p style={{ ...bodyTxt, marginTop: 12 }}>{c("native.e1_body")}</p>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <ActionButton variant="primary" onClick={() => { setStep("s1"); startPiP(); }}>
                  {c("native.e1_retry")}
                </ActionButton>
                <div style={{ textAlign: "center" }}>
                  <button type="button" style={skipLink} onClick={openCamera}>
                    {c("room.float_skip")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {step === "e2" ? (
          <>
            <div style={headGroup}>
              {topBar(null)}
              <h1 style={h1}>{c("native.e2_title")}</h1>
            </div>
            <div style={tailGroup}>
              <p style={{ ...bodyTxt, marginTop: 12 }}>{c("native.e2_body")}</p>
              {!pipActive && floatUrl ? <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>{chip}</div> : null}
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <ActionButton variant="primary" onClick={openCamera}>
                  {c("native.e2_cta")}
                </ActionButton>
                <div style={{ textAlign: "center" }}>
                  <button type="button" style={skipLink} onClick={onClose}>
                    {c("nav.back")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
