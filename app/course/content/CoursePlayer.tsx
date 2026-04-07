"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { COURSE_MODULES, ALL_LESSONS, TOTAL_LESSONS, lessonVideoId } from "@/lib/course-config";

interface Props {
  completedVideoIds: string[];
  userEmail: string;
}

function fmtMin(min: number): string {
  return `${String(min).padStart(2, "0")}:00`;
}

export default function CoursePlayer({ completedVideoIds, userEmail }: Props) {
  const initialCompleted   = new Set(completedVideoIds);
  const firstUncompletedId = ALL_LESSONS.find((l) => !initialCompleted.has(lessonVideoId(l.id)))?.id ?? 1;

  const [activeId, setActiveId]     = useState(firstUncompletedId);
  const [completed, setCompleted]   = useState<Set<string>>(initialCompleted);
  const [reportedAt, setReportedAt] = useState<Set<string>>(initialCompleted);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeLesson   = ALL_LESSONS.find((l) => l.id === activeId)!;
  const activeModule   = COURSE_MODULES.find((m) => m.lessons.some((l) => l.id === activeId))!;
  const completedCount = completed.size;
  const isPlaceholder  = activeLesson.videoId === "PLACEHOLDER";
  const progressPct    = (completedCount / TOTAL_LESSONS) * 100;
  const prevLesson     = ALL_LESSONS.find((l) => l.id === activeId - 1);
  const nextLesson     = ALL_LESSONS.find((l) => l.id === activeId + 1);
  const lessonDone     = completed.has(lessonVideoId(activeId));

  // Vimeo Player API - mark complete at 90%
  useEffect(() => {
    if (isPlaceholder || !iframeRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!win.Vimeo) return;
    const player = new win.Vimeo.Player(iframeRef.current);
    const videoId = lessonVideoId(activeId);
    player.on("timeupdate", (data: { percent: number }) => {
      if (data.percent >= 0.9 && !reportedAt.has(videoId)) markComplete(activeId);
    });
    return () => { player.off("timeupdate"); };
  }, [activeId, isPlaceholder]); // eslint-disable-line react-hooks/exhaustive-deps

  function markComplete(lessonId: number) {
    const videoId = lessonVideoId(lessonId);
    if (reportedAt.has(videoId)) return;
    setReportedAt((prev) => new Set(prev).add(videoId));
    setCompleted((prev) => new Set(prev).add(videoId));
    fetch("/api/video-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId, event_type: "completed", percent_watched: 90, email: userEmail }),
    }).catch(() => {});
  }

  function goTo(lessonId: number) {
    setActiveId(lessonId);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Lesson list (sidebar + mobile bottom) ─────────────────
  const LessonList = () => (
    <>
      {COURSE_MODULES.map((mod) => (
        <div key={mod.id}>
          {/* Module header */}
          <div style={{
            padding: "8px 16px",
            fontSize: 11, fontWeight: 700, color: "#9E9990",
            textAlign: "right",
            background: "#0D1219",
            borderBottom: "1px solid #1D2430",
          }}>
            מודול {mod.id} - {mod.title}
          </div>

          {/* Lesson rows */}
          {mod.lessons.map((lesson) => {
            const isActive = lesson.id === activeId;
            const isDone   = completed.has(lessonVideoId(lesson.id));
            return (
              <button
                key={lesson.id}
                onClick={() => goTo(lesson.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", width: "100%",
                  background: isActive ? "rgba(201,150,74,0.07)" : "transparent",
                  border: "none", borderBottom: "1px solid #1D2430",
                  cursor: "pointer", fontFamily: "Assistant, sans-serif",
                  textAlign: "right", direction: "rtl",
                }}
              >
                {/* RIGHT: number badge (rounded square) */}
                <span style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, direction: "ltr",
                  background: isDone
                    ? "rgba(52,168,83,0.15)"
                    : isActive ? "rgba(201,150,74,0.15)" : "rgba(255,255,255,0.05)",
                  color: isDone ? "#34A853" : isActive ? "#C9964A" : "#9E9990",
                  border: `1px solid ${isDone ? "rgba(52,168,83,0.3)" : isActive ? "rgba(201,150,74,0.3)" : "transparent"}`,
                }}>
                  {isDone ? "v" : lesson.id}
                </span>

                {/* MIDDLE: title + duration */}
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#E8B94A" : "#EDE9E1", marginBottom: 2 }}>
                    {lesson.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#9E9990" }}>{lesson.duration} דקות</div>
                </div>

                {/* LEFT: status badge */}
                {(isDone || isActive) && (
                  <span style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 700,
                    padding: "3px 8px", borderRadius: 12,
                    background: isDone ? "rgba(52,168,83,0.12)" : "rgba(201,150,74,0.12)",
                    color: isDone ? "#34A853" : "#E8B94A",
                  }}>
                    {isDone ? "הושלם" : "המשך"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );

  // ── Nav buttons (shared layout, RTL: first=right, second=left) ──
  const NavButtons = () => (
    <div style={{ display: "flex", gap: 10 }}>
      {/* RIGHT: הבא (gold) - first in DOM in RTL flex */}
      <button
        onClick={() => nextLesson && goTo(nextLesson.id)}
        disabled={!nextLesson}
        style={{
          flex: 1, padding: "12px 16px", borderRadius: 8, border: "none",
          background: nextLesson ? "linear-gradient(135deg, #E8B94A, #9E7C3A)" : "#1D2430",
          color: nextLesson ? "#080C14" : "#3A404E",
          fontSize: 14, fontWeight: 800,
          cursor: nextLesson ? "pointer" : "not-allowed",
          fontFamily: "Assistant, sans-serif",
        }}
      >
        השיעור הבא
      </button>
      {/* LEFT: קודם (ghost) - second in DOM */}
      <button
        onClick={() => prevLesson && goTo(prevLesson.id)}
        disabled={!prevLesson}
        style={{
          flex: 1, padding: "12px 16px", borderRadius: 8,
          border: "1px solid #2C323E", background: "transparent",
          color: prevLesson ? "#EDE9E1" : "#3A404E",
          fontSize: 14, fontWeight: 700,
          cursor: prevLesson ? "pointer" : "not-allowed",
          fontFamily: "Assistant, sans-serif",
        }}
      >
        השיעור הקודם
      </button>
    </div>
  );

  // ── Video area ─────────────────────────────────────────────
  const VideoArea = () => (
    <div style={{
      borderRadius: 12, overflow: "hidden",
      border: "1px solid #2C323E", background: "#000",
      position: "relative", paddingTop: "56.25%",
    }}>
      {isPlaceholder ? (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          background: "#0D1219",
        }}>
          <div style={{ fontSize: 14, color: "#9E9990", fontWeight: 700 }}>הסרטון יעלה בקרוב</div>
          <button
            onClick={() => markComplete(activeId)}
            style={{
              padding: "9px 20px", borderRadius: 8,
              border: "1px solid rgba(201,150,74,0.3)",
              background: "rgba(201,150,74,0.08)",
              color: "#C9964A", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "Assistant, sans-serif",
            }}
          >
            {lessonDone ? "הושלם" : "סמן כהושלם"}
          </button>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          key={activeId}
          src={`https://player.vimeo.com/video/${activeLesson.videoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
          title={activeLesson.title}
        />
      )}
    </div>
  );

  // ── Lesson progress bar (below video) ─────────────────────
  // RTL: first=right (total duration), last=left (current time)
  const LessonProgressBar = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
      <span style={{ fontSize: 12, color: "#9E9990", whiteSpace: "nowrap" }}>
        {fmtMin(activeLesson.duration)}
      </span>
      <div style={{ flex: 1, height: 4, background: "#2C323E", borderRadius: 2, position: "relative" }}>
        <div style={{
          position: "absolute", top: 0, right: 0, height: 4, borderRadius: 2,
          background: "linear-gradient(270deg, #E8B94A, #C9964A)",
          width: lessonDone ? "100%" : "0%",
          transition: "width 0.4s",
        }} />
      </div>
      <span style={{ fontSize: 12, whiteSpace: "nowrap", color: lessonDone ? "#34A853" : "#9E9990" }}>
        {lessonDone ? "הושלם" : "0:00"}
      </span>
    </div>
  );

  // ── Lesson meta + description ──────────────────────────────
  const LessonMeta = () => (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#9E9990", textAlign: "right", marginTop: 16, marginBottom: 4 }}>
        מודול {activeModule.id} - {activeModule.title}
      </div>
      <div style={{ fontSize: 13, color: "#9E9990", textAlign: "right", marginBottom: 12 }}>
        שיעור {activeId} · {activeLesson.duration} דקות
      </div>
      <div style={{
        background: "#0D1219", border: "1px solid #2C323E",
        borderRadius: 10, padding: "14px 16px", marginBottom: 16,
        textAlign: "right",
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1" }}>
          {activeLesson.title}
        </div>
      </div>
    </>
  );

  // ── Completion banner ──────────────────────────────────────
  const CompletionBanner = () => (
    <div style={{
      background: "rgba(232,185,74,0.08)", border: "1px solid rgba(232,185,74,0.25)",
      borderRadius: 12, padding: "20px 24px", textAlign: "center", marginTop: 16,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#E8B94A", marginBottom: 6 }}>
        סיימת את הקורס!
      </div>
      <div style={{ fontSize: 13, color: "#9E9990", marginBottom: 16 }}>
        הצעד הבא - פגישת אסטרטגיה אישית עם הדר
      </div>
      <Link href="/strategy" style={{
        display: "inline-block", padding: "10px 24px", borderRadius: 8,
        background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
        color: "#080C14", fontSize: 14, fontWeight: 800,
        textDecoration: "none", fontFamily: "Assistant, sans-serif",
      }}>
        קבע פגישת אסטרטגיה
      </Link>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div dir="rtl" lang="he" style={{ minHeight: "100vh", background: "#080C14", color: "#EDE9E1", fontFamily: "Assistant, sans-serif" }}>

      {/* MOBILE HEADER (hidden on desktop) */}
      <div className="cp-mob-hdr">
        <Link href="/course" style={{
          fontSize: 13, fontWeight: 700, color: "#9E9990",
          textDecoration: "none",
        }}>
          ← חזור לקורס
        </Link>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "#C9964A",
          padding: "3px 10px", borderRadius: 20,
          background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.25)",
        }}>
          שיעור {activeId}/{TOTAL_LESSONS}
        </span>
      </div>

      {/* DESKTOP HEADER (hidden on mobile) */}
      <header className="cp-desk-hdr">
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <span style={{
            fontSize: 14, fontWeight: 800,
            background: "linear-gradient(135deg, #E8B94A, #C9964A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            קורס TrueSignal דיגיטלי
          </span>
          <span style={{ fontSize: 12, color: "#9E9990" }}>
            {completedCount}/{TOTAL_LESSONS} שיעורים הושלמו
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

      {/* LAYOUT: sidebar (right, desktop) + main (left) */}
      {/*
        dir="rtl" makes flex-row flow right-to-left.
        Sidebar = first in DOM → RIGHT.
        Main    = second in DOM → LEFT.
      */}
      <div className="cp-layout">

        {/* SIDEBAR - desktop only, right column */}
        <aside className="cp-sidebar">
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid #2C323E",
            fontSize: 13, fontWeight: 800, color: "#EDE9E1", textAlign: "right",
            position: "sticky", top: 0, background: "#141820", zIndex: 1,
          }}>
            תוכן הקורס
          </div>
          <LessonList />
        </aside>

        {/* MAIN CONTENT - left column */}
        <main className="cp-main">

          <VideoArea />
          <LessonProgressBar />
          <LessonMeta />

          <div style={{ marginBottom: 24 }}>
            <NavButtons />
          </div>

          {completedCount === TOTAL_LESSONS && <CompletionBanner />}

          {/* MOBILE LESSON LIST - below nav, hidden on desktop */}
          <div className="cp-mob-list">
            <div style={{
              fontSize: 13, fontWeight: 800, color: "#EDE9E1",
              textAlign: "right", marginBottom: 10, marginTop: 8,
            }}>
              כל השיעורים
            </div>
            <div style={{ border: "1px solid #2C323E", borderRadius: 10, overflow: "hidden" }}>
              <LessonList />
            </div>
          </div>

        </main>
      </div>

      {/* Vimeo SDK - load only when real IDs exist */}
      {ALL_LESSONS.some((l) => l.videoId !== "PLACEHOLDER") && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script src="https://player.vimeo.com/api/player.js" />
      )}

      <style>{`
        /* ── Mobile (default) ── */
        .cp-mob-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #141820;
          border-bottom: 1px solid #2C323E;
        }
        .cp-desk-hdr {
          display: none;
        }
        .cp-layout {
          display: flex;
          flex-direction: row;
          max-width: 1280px;
          margin: 0 auto;
        }
        .cp-sidebar {
          display: none;
        }
        .cp-main {
          flex: 1;
          min-width: 0;
          padding: 16px;
          padding-bottom: 48px;
        }
        .cp-mob-list {
          display: block;
          margin-top: 8px;
        }

        /* ── Desktop (768px+) ── */
        @media (min-width: 768px) {
          .cp-mob-hdr {
            display: none;
          }
          .cp-desk-hdr {
            display: block;
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(8,12,20,0.96);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid #2C323E;
            padding: 0 24px;
          }
          .cp-sidebar {
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
          .cp-main {
            padding: 24px 28px 64px;
          }
          .cp-mob-list {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
