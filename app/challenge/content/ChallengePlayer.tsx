"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CHALLENGE_DAYS, dayVideoId, isSessionDay } from "@/lib/challenge-config";

interface Props {
  completedVideoIds: string[];
  unlockedDays: number[];
  nextUnlockDate: string | null; // YYYY-MM-DD
  userEmail: string;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** ms until midnight Israel time on the given YYYY-MM-DD date */
function msUntilIsraelDate(dateStr: string): number {
  // Midnight Israel time = 21:00 UTC previous day (UTC+3, no DST adjustment needed for estimate)
  // More precisely: parse the date as start of day in Asia/Jerusalem
  const target = new Date(`${dateStr}T00:00:00+03:00`);
  return target.getTime() - Date.now();
}

export default function ChallengePlayer({
  completedVideoIds,
  unlockedDays,
  nextUnlockDate,
  userEmail,
}: Props) {
  const initialCompleted = new Set(completedVideoIds);

  // Start on first uncompleted unlocked day
  const firstActive =
    unlockedDays.find((d) => !initialCompleted.has(dayVideoId(d))) ??
    unlockedDays[unlockedDays.length - 1] ??
    0;

  const [activeDay, setActiveDay]   = useState(firstActive);
  const [completed, setCompleted]   = useState<Set<string>>(initialCompleted);
  const [reported, setReported]     = useState<Set<string>>(initialCompleted);
  const [countdown, setCountdown]   = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dayData    = CHALLENGE_DAYS.find((d) => d.day === activeDay)!;
  const isLocked   = !unlockedDays.includes(activeDay);
  const isPlaceholder = dayData.videoId === "PLACEHOLDER";
  const dayDone    = completed.has(dayVideoId(activeDay));
  const completedCount = completed.size;
  const totalDays  = CHALLENGE_DAYS.length;
  const progressPct = (completedCount / totalDays) * 100;
  const is916      = dayData.aspectRatio === "9:16";

  // Day 8 is locked until day 7 is completed
  const day8Locked = activeDay === 8 && !completed.has(dayVideoId(7)) && !completedVideoIds.includes(dayVideoId(7));

  // Countdown timer
  useEffect(() => {
    if (!nextUnlockDate) return;
    function tick() {
      const ms = msUntilIsraelDate(nextUnlockDate!);
      if (ms > 0) setCountdown(fmtCountdown(ms));
      else setCountdown("");
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextUnlockDate]);

  // Vimeo Player API - mark complete at 90%
  useEffect(() => {
    if (isPlaceholder || isLocked || !iframeRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!win.Vimeo) return;
    const player = new win.Vimeo.Player(iframeRef.current);
    const vid = dayVideoId(activeDay);
    player.on("timeupdate", (data: { percent: number }) => {
      if (data.percent >= 0.9 && !reported.has(vid)) markComplete(activeDay);
    });
    return () => { player.off("timeupdate"); };
  }, [activeDay, isPlaceholder, isLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  function markComplete(day: number) {
    const vid = dayVideoId(day);
    if (reported.has(vid)) return;
    setReported((prev) => new Set(prev).add(vid));
    setCompleted((prev) => new Set(prev).add(vid));
    fetch("/api/video-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: vid, event_type: "completed", percent_watched: 90, email: userEmail }),
    }).catch(() => {});
  }

  function goTo(day: number) {
    setActiveDay(day);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Day circle color ─────────────────────────────────────
  function circleStyle(day: number) {
    const isDone   = completed.has(dayVideoId(day));
    const isActive = day === activeDay;
    const locked   = !unlockedDays.includes(day);
    const special  = isSessionDay(day); // day 0 or 8

    if (isDone)   return { bg: "rgba(52,168,83,0.15)",    color: "#34A853",  border: "rgba(52,168,83,0.4)" };
    if (isActive) return { bg: "rgba(232,185,74,0.18)",   color: "#E8B94A",  border: "rgba(232,185,74,0.5)" };
    if (locked)   return { bg: "rgba(255,255,255,0.05)",  color: "#3A404E",  border: "transparent" };
    if (special)  return { bg: "rgba(139,92,246,0.15)",   color: "#A78BFA",  border: "rgba(139,92,246,0.35)" };
    return         { bg: "rgba(201,150,74,0.08)",         color: "#C9964A",  border: "rgba(201,150,74,0.2)" };
  }

  // ── Day list (sidebar + mobile bottom) ──────────────────
  const DayList = () => (
    <>
      {CHALLENGE_DAYS.map((d) => {
        const isDone   = completed.has(dayVideoId(d.day));
        const isActive = d.day === activeDay;
        const locked   = !unlockedDays.includes(d.day);
        const cs       = circleStyle(d.day);
        const isSpecial = isSessionDay(d.day);
        const formatLabel = d.aspectRatio === "9:16" ? "ריל" : "וידאו";

        return (
          <button
            key={d.day}
            onClick={() => !locked && goTo(d.day)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", width: "100%",
              background: isActive ? "rgba(201,150,74,0.07)" : "transparent",
              border: "none", borderBottom: "1px solid #1D2430",
              cursor: locked ? "not-allowed" : "pointer",
              fontFamily: "Assistant, sans-serif",
              textAlign: "right", direction: "rtl",
              opacity: locked ? 0.5 : 1,
            }}
          >
            {/* RIGHT: day circle */}
            <span style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, direction: "ltr",
              background: cs.bg, color: cs.color,
              border: `1px solid ${cs.border}`,
            }}>
              {isDone ? "✓" : isSpecial ? (d.day === 0 ? "★" : "✦") : d.day}
            </span>

            {/* MIDDLE: title + format/duration */}
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: isActive ? "#E8B94A" : locked ? "#4A5060" : "#EDE9E1",
                marginBottom: 2,
              }}>
                {d.day === 0 ? "פתיחה" : d.day === 8 ? "סיום" : `יום ${d.day}`} — {d.title}
              </div>
              <div style={{ fontSize: 11, color: "#9E9990" }}>
                {formatLabel} · {d.duration} דקות
              </div>
            </div>

            {/* LEFT: status badge */}
            {locked ? (
              <span style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700,
                padding: "3px 8px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", color: "#4A5060",
              }}>
                נעול
              </span>
            ) : isDone ? (
              <span style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700,
                padding: "3px 8px", borderRadius: 12,
                background: "rgba(52,168,83,0.12)", color: "#34A853",
              }}>
                הושלם
              </span>
            ) : isActive ? (
              <span style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700,
                padding: "3px 8px", borderRadius: 12,
                background: "rgba(201,150,74,0.12)", color: "#E8B94A",
              }}>
                המשך
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );

  // ── Nav buttons ─────────────────────────────────────────
  const NavButtons = () => {
    const prevDay = CHALLENGE_DAYS.find((d) => d.day === activeDay - 1);
    const nextDay = CHALLENGE_DAYS.find((d) => d.day === activeDay + 1);
    const canNext = nextDay && unlockedDays.includes(nextDay.day) && !(nextDay.day === 8 && !completed.has(dayVideoId(7)));
    const canPrev = prevDay && unlockedDays.includes(prevDay.day);

    return (
      <div style={{ display: "flex", gap: 10 }}>
        {/* RIGHT: הבא (gold) */}
        <button
          onClick={() => canNext && goTo(nextDay!.day)}
          disabled={!canNext}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 8, border: "none",
            background: canNext ? "linear-gradient(135deg, #E8B94A, #9E7C3A)" : "#1D2430",
            color: canNext ? "#080C14" : "#3A404E",
            fontSize: 14, fontWeight: 800,
            cursor: canNext ? "pointer" : "not-allowed",
            fontFamily: "Assistant, sans-serif",
          }}
        >
          היום הבא
        </button>
        {/* LEFT: קודם (ghost) */}
        <button
          onClick={() => canPrev && goTo(prevDay!.day)}
          disabled={!canPrev}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 8,
            border: "1px solid #2C323E", background: "transparent",
            color: canPrev ? "#EDE9E1" : "#3A404E",
            fontSize: 14, fontWeight: 700,
            cursor: canPrev ? "pointer" : "not-allowed",
            fontFamily: "Assistant, sans-serif",
          }}
        >
          היום הקודם
        </button>
      </div>
    );
  };

  // ── Video area ───────────────────────────────────────────
  const VideoArea = () => {
    // 16:9 → paddingTop 56.25%, 9:16 → paddingTop 177.78%
    const paddingTop = is916 ? "177.78%" : "56.25%";

    if (isLocked || day8Locked) {
      return (
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: "1px solid #2C323E", background: "#0D1219",
          position: "relative", paddingTop,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🔒</span>
            {day8Locked ? (
              <div style={{ fontSize: 14, color: "#9E9990", fontWeight: 700, textAlign: "center", padding: "0 16px" }}>
                מפגש הסיום יפתח לאחר שתסיים את יום 7
              </div>
            ) : countdown ? (
              <>
                <div style={{ fontSize: 13, color: "#9E9990", fontWeight: 700 }}>נפתח בעוד</div>
                <div style={{
                  fontSize: 24, fontWeight: 800, color: "#E8B94A",
                  fontVariantNumeric: "tabular-nums", direction: "ltr",
                }}>
                  {countdown}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#9E9990", fontWeight: 700 }}>היום נעול</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{
        borderRadius: 12, overflow: "hidden",
        border: "1px solid #2C323E", background: "#000",
        position: "relative", paddingTop,
      }}>
        {isPlaceholder ? (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#0D1219",
          }}>
            <div style={{ fontSize: 14, color: "#9E9990", fontWeight: 700 }}>הסרטון יעלה בקרוב</div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={activeDay}
            src={`https://player.vimeo.com/video/${dayData.videoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
            title={dayData.title}
          />
        )}
      </div>
    );
  };

  // ── Progress bar (below video) ───────────────────────────
  const DayProgressBar = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
      <span style={{ fontSize: 12, color: "#9E9990", whiteSpace: "nowrap" }}>
        {String(dayData.duration).padStart(2, "0")}:00
      </span>
      <div style={{ flex: 1, height: 4, background: "#2C323E", borderRadius: 2, position: "relative" }}>
        <div style={{
          position: "absolute", top: 0, right: 0, height: 4, borderRadius: 2,
          background: "linear-gradient(270deg, #E8B94A, #C9964A)",
          width: dayDone ? "100%" : "0%",
          transition: "width 0.4s",
        }} />
      </div>
      <span style={{ fontSize: 12, whiteSpace: "nowrap", color: dayDone ? "#34A853" : "#9E9990" }}>
        {dayDone ? "הושלם" : "0:00"}
      </span>
    </div>
  );

  // ── Day meta + description ───────────────────────────────
  const DayMeta = () => (
    <>
      {/* "סמן כהושלם" button */}
      {!dayDone && !isLocked && !day8Locked && (
        <div style={{ textAlign: "center", marginTop: 14, marginBottom: 4 }}>
          <button
            onClick={() => markComplete(activeDay)}
            style={{
              padding: "9px 24px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
              color: "#080C14", fontSize: 13, fontWeight: 800,
              cursor: "pointer", fontFamily: "Assistant, sans-serif",
            }}
          >
            סמן כהושלם
          </button>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: "#9E9990", textAlign: "right", marginTop: 14, marginBottom: 4 }}>
        {activeDay === 0 ? "מפגש פתיחה" : activeDay === 8 ? "מפגש סיום" : `יום ${activeDay} מתוך 7`}
        {" · "}
        {dayData.aspectRatio === "9:16" ? "ריל" : "וידאו"} · {dayData.duration} דקות
      </div>

      <div style={{
        background: "#0D1219", border: "1px solid #2C323E",
        borderRadius: 10, padding: "14px 16px", marginBottom: 16,
        textAlign: "right",
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1", marginBottom: 6 }}>
          {dayData.title}
        </div>
        <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.7 }}>
          {dayData.description}
        </div>
      </div>

      {/* Countdown box — show when there are locked future days */}
      {countdown && !isLocked && (
        <div style={{
          background: "rgba(201,150,74,0.06)", border: "1px solid rgba(201,150,74,0.2)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "center",
        }}>
          <div style={{ fontSize: 12, color: "#9E9990", marginBottom: 4 }}>היום הבא נפתח בעוד</div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: "#E8B94A",
            fontVariantNumeric: "tabular-nums", direction: "ltr",
          }}>
            {countdown}
          </div>
        </div>
      )}
    </>
  );

  // ── Completion banner ────────────────────────────────────
  const CompletionBanner = () => (
    <div style={{
      background: "rgba(232,185,74,0.08)", border: "1px solid rgba(232,185,74,0.25)",
      borderRadius: 12, padding: "20px 24px", textAlign: "center", marginTop: 16,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#E8B94A", marginBottom: 6 }}>
        סיימת את האתגר!
      </div>
      <div style={{ fontSize: 13, color: "#9E9990", marginBottom: 16 }}>
        הצעד הבא — סדנה יום אחד לבניית המסר שמוכר
      </div>
      <Link href="/workshop" style={{
        display: "inline-block", padding: "10px 24px", borderRadius: 8,
        background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
        color: "#080C14", fontSize: 14, fontWeight: 800,
        textDecoration: "none", fontFamily: "Assistant, sans-serif",
      }}>
        לפרטים על הסדנה
      </Link>
    </div>
  );

  // ── Render ───────────────────────────────────────────────
  return (
    <div dir="rtl" lang="he" style={{ minHeight: "100vh", background: "#080C14", color: "#EDE9E1", fontFamily: "Assistant, sans-serif" }}>

      {/* MOBILE HEADER */}
      <div className="ch-mob-hdr">
        <Link href="/challenge" style={{
          fontSize: 13, fontWeight: 700, color: "#9E9990", textDecoration: "none",
        }}>
          ← חזור לאתגר
        </Link>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "#C9964A",
          padding: "3px 10px", borderRadius: 20,
          background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.25)",
        }}>
          {activeDay === 0 ? "פתיחה" : activeDay === 8 ? "סיום" : `יום ${activeDay}/7`}
        </span>
      </div>

      {/* DESKTOP HEADER */}
      <header className="ch-desk-hdr">
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <span style={{
            fontSize: 14, fontWeight: 800,
            background: "linear-gradient(135deg, #E8B94A, #C9964A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            אתגר 7 הימים
          </span>
          <span style={{ fontSize: 12, color: "#9E9990" }}>
            {completedCount}/{totalDays} ימים הושלמו
          </span>
        </div>
        <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 10 }}>
          <div style={{ height: 3, background: "#2C323E", borderRadius: 2, position: "relative" }}>
            <div style={{
              position: "absolute", top: 0, right: 0, height: 3, borderRadius: 2,
              background: "linear-gradient(270deg, #E8B94A, #C9964A)",
              width: `${progressPct}%`, transition: "width 0.4s",
            }} />
          </div>
        </div>
      </header>

      {/* LAYOUT */}
      <div className="ch-layout">

        {/* SIDEBAR - desktop right column */}
        <aside className="ch-sidebar">
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid #2C323E",
            fontSize: 13, fontWeight: 800, color: "#EDE9E1", textAlign: "right",
            position: "sticky", top: 0, background: "#141820", zIndex: 1,
          }}>
            ימי האתגר
          </div>
          <DayList />
        </aside>

        {/* MAIN CONTENT */}
        <main className="ch-main">
          <VideoArea />
          {!isLocked && !day8Locked && <DayProgressBar />}
          <DayMeta />

          <div style={{ marginBottom: 24 }}>
            <NavButtons />
          </div>

          {completedCount === totalDays && <CompletionBanner />}

          {/* MOBILE DAY LIST */}
          <div className="ch-mob-list">
            <div style={{
              fontSize: 13, fontWeight: 800, color: "#EDE9E1",
              textAlign: "right", marginBottom: 10, marginTop: 8,
            }}>
              כל ימי האתגר
            </div>
            <div style={{ border: "1px solid #2C323E", borderRadius: 10, overflow: "hidden" }}>
              <DayList />
            </div>
          </div>
        </main>
      </div>

      {/* Vimeo SDK */}
      {CHALLENGE_DAYS.some((d) => d.videoId !== "PLACEHOLDER") && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script src="https://player.vimeo.com/api/player.js" />
      )}

      <style>{`
        /* ── Mobile (default) ── */
        .ch-mob-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #141820;
          border-bottom: 1px solid #2C323E;
        }
        .ch-desk-hdr { display: none; }
        .ch-layout {
          display: flex;
          flex-direction: row;
          max-width: 1280px;
          margin: 0 auto;
        }
        .ch-sidebar { display: none; }
        .ch-main {
          flex: 1;
          min-width: 0;
          padding: 16px;
          padding-bottom: 48px;
        }
        .ch-mob-list { display: block; margin-top: 8px; }

        /* ── Desktop (768px+) ── */
        @media (min-width: 768px) {
          .ch-mob-hdr { display: none; }
          .ch-desk-hdr {
            display: block;
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(8,12,20,0.96);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid #2C323E;
            padding: 0 24px;
          }
          .ch-sidebar {
            display: block;
            width: 280px;
            flex-shrink: 0;
            background: #141820;
            border-left: 1px solid #2C323E;
            position: sticky;
            top: 6rem;
            max-height: calc(100vh - 6rem);
            overflow-y: auto;
            align-self: flex-start;
          }
          .ch-main { padding: 24px 28px 64px; }
          .ch-mob-list { display: none; }
        }
      `}</style>
    </div>
  );
}
