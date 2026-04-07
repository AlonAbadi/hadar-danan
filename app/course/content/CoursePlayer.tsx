"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { COURSE_MODULES, ALL_LESSONS, TOTAL_LESSONS, lessonVideoId } from "@/lib/course-config";
import type { Lesson } from "@/lib/course-config";

interface Props {
  completedVideoIds: string[]; // from DB
  userEmail: string;
}

// ── Styles ────────────────────────────────────────────────────
const C = {
  page: {
    minHeight: "100vh",
    background: "#080C14",
    color: "#EDE9E1",
    fontFamily: "Assistant, sans-serif",
    direction: "rtl" as const,
  } as React.CSSProperties,
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    background: "rgba(8,12,20,0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #2C323E",
    padding: "0 20px",
  },
  headerInner: {
    maxWidth: 1280,
    margin: "0 auto",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 800,
    background: "linear-gradient(135deg, #E8B94A, #C9964A)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 20px",
    background: "#141820",
    borderBottom: "1px solid #2C323E",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    background: "#2C323E",
    borderRadius: 3,
    position: "relative" as const,
  },
  progressFill: (pct: number): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    background: "linear-gradient(270deg, #E8B94A, #C9964A)",
    width: `${pct}%`,
    transition: "width 0.4s",
  }),
  layout: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "flex" as const,
    flexDirection: "row" as const,
  } as React.CSSProperties,
  main: {
    flex: 1,
    minWidth: 0,
    padding: "20px 20px 48px",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 16,
  } as React.CSSProperties,
  videoBox: {
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #2C323E",
    background: "#000",
    position: "relative" as const,
    paddingTop: "56.25%",
  } as React.CSSProperties,
  videoPlaceholder: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column" as const,
    background: "#0D1219",
    gap: 12,
  } as React.CSSProperties,
  iframe: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: "none",
  } as React.CSSProperties,
  lessonMeta: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  lessonNumber: {
    fontSize: 11,
    fontWeight: 700,
    color: "#C9964A",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#EDE9E1",
    margin: 0,
  },
  lessonDuration: {
    fontSize: 13,
    color: "#9E9990",
    marginTop: 4,
  },
  navRow: {
    display: "flex",
    gap: 10,
  },
  navBtn: (disabled: boolean): React.CSSProperties => ({
    padding: "10px 22px",
    borderRadius: 8,
    border: "1px solid #2C323E",
    background: "transparent",
    color: disabled ? "#3A404E" : "#EDE9E1",
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "Assistant, sans-serif",
    transition: "border-color 0.15s",
  }),
  nextBtn: {
    padding: "10px 22px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    color: "#080C14",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
  } as React.CSSProperties,
  completedBanner: {
    background: "rgba(232,185,74,0.08)",
    border: "1px solid rgba(232,185,74,0.25)",
    borderRadius: 12,
    padding: "20px 24px",
    textAlign: "center" as const,
  },
  // Sidebar
  sidebar: {
    width: 320,
    flexShrink: 0,
    borderLeft: "1px solid #2C323E",
    background: "#141820",
    overflowY: "auto" as const,
    maxHeight: "calc(100vh - 8rem)",
    position: "sticky" as const,
    top: "8rem",
    alignSelf: "flex-start" as const,
  } as React.CSSProperties,
  sidebarHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #2C323E",
    fontSize: 13,
    fontWeight: 800,
    color: "#EDE9E1",
  },
  moduleHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    background: "#141820",
    borderBottom: "1px solid #2C323E",
  },
  moduleNum: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(201,150,74,0.12)",
    color: "#C9964A",
    fontSize: 11,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  moduleTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#EDE9E1",
  },
  lessonBtn: (active: boolean, done: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    width: "100%",
    background: active ? "rgba(201,150,74,0.1)" : "transparent",
    border: "none",
    borderLeft: active ? "3px solid #C9964A" : "3px solid transparent",
    cursor: "pointer",
    textAlign: "right" as const,
    fontFamily: "Assistant, sans-serif",
    transition: "background 0.1s",
  }),
  lessonDot: (active: boolean, done: boolean): React.CSSProperties => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 800,
    background: done
      ? "rgba(52,168,83,0.2)"
      : active
        ? "rgba(201,150,74,0.2)"
        : "rgba(255,255,255,0.05)",
    color: done ? "#34A853" : active ? "#C9964A" : "#9E9990",
    border: done
      ? "1px solid rgba(52,168,83,0.4)"
      : active
        ? "1px solid rgba(201,150,74,0.4)"
        : "1px solid transparent",
  }),
  lessonBtnLabel: (active: boolean, done: boolean): React.CSSProperties => ({
    fontSize: 13,
    color: active ? "#E8B94A" : done ? "#C9964A" : "#9E9990",
    flex: 1,
    textAlign: "right" as const,
    lineHeight: 1.4,
  }),
  lessonBtnDur: {
    fontSize: 11,
    color: "#3A404E",
    flexShrink: 0,
  } as React.CSSProperties,
};

// ── Component ─────────────────────────────────────────────────
export default function CoursePlayer({ completedVideoIds, userEmail }: Props) {
  const completedSet = new Set(completedVideoIds);

  // Pick first uncompleted lesson as initial, fallback to 1
  const firstUncompletedId =
    ALL_LESSONS.find((l) => !completedSet.has(lessonVideoId(l.id)))?.id ?? 1;

  const [activeId, setActiveId]         = useState(firstUncompletedId);
  const [completed, setCompleted]       = useState<Set<string>>(new Set(completedVideoIds));
  const [reportedAt, setReportedAt]     = useState<Set<string>>(new Set(completedVideoIds));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<{ on: (event: string, cb: (data: unknown) => void) => void } | null>(null);

  const activeLesson  = ALL_LESSONS.find((l) => l.id === activeId)!;
  const activeModule  = COURSE_MODULES.find((m) => m.lessons.some((l) => l.id === activeId))!;
  const completedCount = completed.size;
  const isPlaceholder  = activeLesson.videoId === "PLACEHOLDER";

  // Vimeo Player API - only when real vimeoId
  useEffect(() => {
    if (isPlaceholder || !iframeRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!win.Vimeo) return;

    const player = new win.Vimeo.Player(iframeRef.current);
    playerRef.current = player;

    const videoId = lessonVideoId(activeId);
    player.on("timeupdate", (data: { percent: number }) => {
      if (data.percent >= 0.9 && !reportedAt.has(videoId)) {
        markComplete(activeId);
      }
    });

    return () => {
      player.off("timeupdate");
    };
  }, [activeId, isPlaceholder]);

  function markComplete(lessonId: number) {
    const videoId = lessonVideoId(lessonId);
    if (reportedAt.has(videoId)) return;

    setReportedAt((prev) => new Set(prev).add(videoId));
    setCompleted((prev) => new Set(prev).add(videoId));

    fetch("/api/video-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_id: videoId,
        event_type: "completed",
        percent_watched: 90,
        email: userEmail,
      }),
    }).catch(() => {});
  }

  function goTo(lessonId: number) {
    setActiveId(lessonId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const prevLesson = ALL_LESSONS.find((l) => l.id === activeId - 1);
  const nextLesson = ALL_LESSONS.find((l) => l.id === activeId + 1);
  const progressPct = (completedCount / TOTAL_LESSONS) * 100;

  return (
    <div style={C.page} dir="rtl" lang="he">
      {/* Header */}
      <header style={C.header}>
        <div style={C.headerInner}>
          <span style={C.headerTitle}>קורס דיגיטלי - TrueSignal</span>
          <span style={{ fontSize: 12, color: "#9E9990" }}>
            8 מודולים - 16 שיעורים
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div style={C.progressWrap}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#C9964A", whiteSpace: "nowrap" }}>
          {completedCount}/{TOTAL_LESSONS} הושלמו
        </span>
        <div style={C.progressTrack}>
          <div style={C.progressFill(progressPct)} />
        </div>
        <span style={{ fontSize: 12, color: "#9E9990", whiteSpace: "nowrap" }}>
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Layout */}
      <div style={C.layout}>
        {/* Sidebar - must come first in DOM so it appears on the right in RTL flex */}
        <aside style={C.sidebar}>
          <div style={C.sidebarHeader}>תוכן הקורס</div>
          {COURSE_MODULES.map((mod) => (
            <div key={mod.id} style={{ borderBottom: "1px solid #2C323E" }}>
              <div style={C.moduleHeader}>
                <div style={{ ...C.moduleNum, direction: "ltr" }}>{mod.id}</div>
                <div style={C.moduleTitle}>{mod.title}</div>
              </div>
              {mod.lessons.map((lesson) => {
                const isActive = lesson.id === activeId;
                const isDone   = completed.has(lessonVideoId(lesson.id));
                return (
                  <button
                    key={lesson.id}
                    style={C.lessonBtn(isActive, isDone)}
                    onClick={() => goTo(lesson.id)}
                  >
                    <div style={{ ...C.lessonDot(isActive, isDone), direction: "ltr" }}>
                      {isDone ? "v" : lesson.id}
                    </div>
                    <span style={C.lessonBtnLabel(isActive, isDone)}>
                      {lesson.title}
                    </span>
                    <span style={C.lessonBtnDur}>{lesson.duration}&apos;</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main style={C.main}>
          {/* Video */}
          <div style={C.videoBox}>
            {isPlaceholder ? (
              <div style={C.videoPlaceholder}>
                <div style={{ fontSize: 14, color: "#9E9990", fontWeight: 700 }}>
                  שיעור {activeId} - {activeLesson.title}
                </div>
                <div style={{ fontSize: 12, color: "#3A404E" }}>
                  הסרטון יעלה בקרוב
                </div>
                <button
                  onClick={() => markComplete(activeId)}
                  style={{
                    marginTop: 8,
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "1px solid rgba(201,150,74,0.3)",
                    background: "rgba(201,150,74,0.08)",
                    color: "#C9964A",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "Assistant, sans-serif",
                  }}
                >
                  {completed.has(lessonVideoId(activeId)) ? "הושלם" : "סמן כהושלם"}
                </button>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                key={activeId}
                src={`https://player.vimeo.com/video/${activeLesson.videoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
                style={C.iframe}
                title={activeLesson.title}
              />
            )}
          </div>

          {/* Lesson meta */}
          <div style={C.lessonMeta}>
            <div>
              <div style={C.lessonNumber}>
                מודול {activeModule.id} - שיעור {activeId}
              </div>
              <h1 style={C.lessonTitle}>{activeLesson.title}</h1>
              <div style={C.lessonDuration}>{activeLesson.duration} דקות</div>
            </div>
            {!isPlaceholder && !completed.has(lessonVideoId(activeId)) && (
              <button
                onClick={() => markComplete(activeId)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(201,150,74,0.3)",
                  background: "rgba(201,150,74,0.08)",
                  color: "#C9964A",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Assistant, sans-serif",
                }}
              >
                סמן כהושלם
              </button>
            )}
          </div>

          {/* Nav buttons - prev on right, next on left (RTL flex order) */}
          {completedCount < TOTAL_LESSONS && (
            <div style={C.navRow}>
              {prevLesson && (
                <button style={C.navBtn(false)} onClick={() => goTo(prevLesson.id)}>
                  שיעור קודם
                </button>
              )}
              {nextLesson && (
                <button style={C.nextBtn} onClick={() => goTo(nextLesson.id)}>
                  שיעור הבא
                </button>
              )}
            </div>
          )}

          {/* Completion banner */}
          {completedCount === TOTAL_LESSONS && (
            <div style={C.completedBanner}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#E8B94A", marginBottom: 6 }}>
                סיימת את הקורס!
              </div>
              <div style={{ fontSize: 13, color: "#9E9990", marginBottom: 16 }}>
                הצעד הבא - פגישת אסטרטגיה אישית עם הדר
              </div>
              <Link
                href="/strategy"
                style={{
                  display: "inline-block",
                  padding: "10px 24px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                  color: "#080C14",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                  fontFamily: "Assistant, sans-serif",
                }}
              >
                קבע פגישת אסטרטגיה
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Vimeo SDK - only load when needed */}
      {ALL_LESSONS.some((l) => l.videoId !== "PLACEHOLDER") && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script src="https://player.vimeo.com/api/player.js" />
      )}
    </div>
  );
}
