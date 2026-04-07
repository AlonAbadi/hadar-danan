"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { COURSE_MODULES, ALL_LESSONS, TOTAL_LESSONS, lessonVideoId } from "@/lib/course-config";

interface Props {
  completedVideoIds: string[];
  userEmail: string;
}

export default function CoursePlayer({ completedVideoIds, userEmail }: Props) {
  const completedSet       = new Set(completedVideoIds);
  const firstUncompletedId = ALL_LESSONS.find((l) => !completedSet.has(lessonVideoId(l.id)))?.id ?? 1;

  const [activeId, setActiveId]         = useState(firstUncompletedId);
  const [completed, setCompleted]       = useState<Set<string>>(new Set(completedVideoIds));
  const [reportedAt, setReportedAt]     = useState<Set<string>>(new Set(completedVideoIds));
  const [accordionOpen, setAccordionOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeLesson   = ALL_LESSONS.find((l) => l.id === activeId)!;
  const activeModule   = COURSE_MODULES.find((m) => m.lessons.some((l) => l.id === activeId))!;
  const completedCount = completed.size;
  const isPlaceholder  = activeLesson.videoId === "PLACEHOLDER";
  const progressPct    = (completedCount / TOTAL_LESSONS) * 100;
  const prevLesson     = ALL_LESSONS.find((l) => l.id === activeId - 1);
  const nextLesson     = ALL_LESSONS.find((l) => l.id === activeId + 1);

  // Vimeo Player API - fires markComplete at 90% watch time
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
    setAccordionOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Lesson list (shared between sidebar and mobile accordion) ──
  const LessonList = () => (
    <>
      {COURSE_MODULES.map((mod) => {
        const isDone   = (id: number) => completed.has(lessonVideoId(id));
        const isActive = (id: number) => id === activeId;
        return (
          <div key={mod.id} style={{ borderBottom: "1px solid #2C323E" }}>
            {/* Module header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", background: "#1A2030",
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: "rgba(201,150,74,0.15)", color: "#C9964A",
                fontSize: 11, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                direction: "ltr",
              }}>{mod.id}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#EDE9E1" }}>{mod.title}</span>
            </div>
            {/* Lessons */}
            {mod.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => goTo(lesson.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", width: "100%",
                  background: isActive(lesson.id) ? "rgba(201,150,74,0.08)" : "transparent",
                  border: "none",
                  borderLeft: isActive(lesson.id) ? "3px solid #C9964A" : "3px solid transparent",
                  cursor: "pointer", textAlign: "right",
                  fontFamily: "Assistant, sans-serif",
                  transition: "background 0.1s",
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, direction: "ltr",
                  background: isDone(lesson.id)
                    ? "rgba(52,168,83,0.2)"
                    : isActive(lesson.id) ? "rgba(201,150,74,0.15)" : "rgba(255,255,255,0.05)",
                  color: isDone(lesson.id) ? "#34A853" : isActive(lesson.id) ? "#C9964A" : "#9E9990",
                  border: isDone(lesson.id)
                    ? "1px solid rgba(52,168,83,0.4)"
                    : isActive(lesson.id) ? "1px solid rgba(201,150,74,0.4)" : "1px solid transparent",
                }}>
                  {isDone(lesson.id) ? "v" : lesson.id}
                </span>
                <span style={{
                  flex: 1, fontSize: 13, lineHeight: 1.4, textAlign: "right",
                  color: isActive(lesson.id) ? "#E8B94A" : isDone(lesson.id) ? "#C9964A" : "#9E9990",
                }}>
                  {lesson.title}
                </span>
                <span style={{ fontSize: 11, color: "#3A404E", flexShrink: 0 }}>
                  {lesson.duration}&apos;
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </>
  );

  return (
    <div dir="rtl" lang="he" style={{ minHeight: "100vh", background: "#080C14", color: "#EDE9E1", fontFamily: "Assistant, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,12,20,0.96)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #2C323E", padding: "0 20px",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 14, fontWeight: 800,
            background: "linear-gradient(135deg, #E8B94A, #C9964A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            קורס TrueSignal דיגיטלי
          </span>
          <span style={{ fontSize: 12, color: "#9E9990" }}>8 מודולים - 16 שיעורים</span>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div style={{ background: "#141820", borderBottom: "1px solid #2C323E", padding: "8px 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#C9964A", whiteSpace: "nowrap" }}>
            {completedCount}/{TOTAL_LESSONS} הושלמו
          </span>
          <div style={{ flex: 1, height: 6, background: "#2C323E", borderRadius: 3, position: "relative" }}>
            <div style={{
              position: "absolute", top: 0, right: 0,
              height: 6, borderRadius: 3,
              background: "linear-gradient(270deg, #E8B94A, #C9964A)",
              width: `${progressPct}%`,
              transition: "width 0.4s",
            }} />
          </div>
          <span style={{ fontSize: 12, color: "#9E9990", whiteSpace: "nowrap" }}>
            {Math.round(progressPct)}%
          </span>
        </div>
      </div>

      {/* ── Layout ── */}
      {/*
        dir="rtl" makes flex-direction: row go right-to-left.
        Sidebar is first in DOM → appears on the RIGHT.
        Main is second in DOM → appears on the LEFT.
      */}
      <div className="cp-layout">

        {/* ── Sidebar (right, desktop only) ── */}
        <aside className="cp-sidebar">
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid #2C323E",
            fontSize: 13, fontWeight: 800, color: "#EDE9E1", textAlign: "right",
          }}>
            תוכן הקורס
          </div>
          <LessonList />
        </aside>

        {/* ── Main content (left) ── */}
        <main className="cp-main">

          {/* Video */}
          <div style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid #2C323E", background: "#000",
            position: "relative", paddingTop: "56.25%",
            marginBottom: 16,
          }}>
            {isPlaceholder ? (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
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
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                title={activeLesson.title}
              />
            )}
          </div>

          {/* Nav buttons: prev (right) + next (left) - in RTL flex, first = right */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => prevLesson && goTo(prevLesson.id)}
              disabled={!prevLesson}
              style={{
                flex: 1, padding: "11px 16px", borderRadius: 8,
                border: "1px solid #2C323E", background: "transparent",
                color: prevLesson ? "#EDE9E1" : "#3A404E",
                fontSize: 14, fontWeight: 700,
                cursor: prevLesson ? "pointer" : "not-allowed",
                fontFamily: "Assistant, sans-serif",
              }}
            >
              השיעור הקודם
            </button>
            <button
              onClick={() => nextLesson && goTo(nextLesson.id)}
              disabled={!nextLesson}
              style={{
                flex: 1, padding: "11px 16px", borderRadius: 8,
                border: "none",
                background: nextLesson ? "linear-gradient(135deg, #E8B94A, #9E7C3A)" : "#1D2430",
                color: nextLesson ? "#080C14" : "#3A404E",
                fontSize: 14, fontWeight: 800,
                cursor: nextLesson ? "pointer" : "not-allowed",
                fontFamily: "Assistant, sans-serif",
              }}
            >
              השיעור הבא
            </button>
          </div>

          {/* Lesson label - centered */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#C9964A", fontWeight: 700, marginBottom: 6 }}>
              מודול {activeModule.id} - שיעור {activeId}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#EDE9E1", margin: "0 0 4px" }}>
              {activeLesson.title}
            </h1>
            <div style={{ fontSize: 13, color: "#9E9990" }}>{activeLesson.duration} דקות</div>
          </div>

          {/* Completion banner */}
          {completedCount === TOTAL_LESSONS && (
            <div style={{
              background: "rgba(232,185,74,0.08)", border: "1px solid rgba(232,185,74,0.25)",
              borderRadius: 12, padding: "20px 24px", textAlign: "center", marginTop: 8,
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
          )}

          {/* Mobile accordion - hidden on desktop via CSS */}
          <div className="cp-accordion">
            <button
              onClick={() => setAccordionOpen((o) => !o)}
              style={{
                width: "100%", padding: "14px 16px",
                background: "#141820", border: "none",
                borderTop: "1px solid #2C323E",
                borderBottom: accordionOpen ? "none" : "1px solid #2C323E",
                color: "#EDE9E1", fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", fontFamily: "Assistant, sans-serif",
                marginTop: 20,
              }}
            >
              <span>תוכן הקורס</span>
              <span style={{
                fontSize: 12, color: "#C9964A", fontWeight: 800,
                transform: accordionOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
                display: "inline-block",
              }}>
                v
              </span>
            </button>
            {accordionOpen && (
              <div style={{ background: "#141820", borderBottom: "1px solid #2C323E" }}>
                <LessonList />
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Vimeo SDK */}
      {ALL_LESSONS.some((l) => l.videoId !== "PLACEHOLDER") && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script src="https://player.vimeo.com/api/player.js" />
      )}

      <style>{`
        /* Desktop: two-column layout */
        .cp-layout {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: row;
          /* dir="rtl" on parent makes flex row flow right-to-left:
             sidebar (first in DOM) = RIGHT, main (second in DOM) = LEFT */
          min-height: calc(100vh - 8rem);
        }
        .cp-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: #141820;
          border-left: 1px solid #2C323E;
          position: sticky;
          top: 8rem;
          max-height: calc(100vh - 8rem);
          overflow-y: auto;
          align-self: flex-start;
        }
        .cp-main {
          flex: 1;
          min-width: 0;
          padding: 20px 24px 48px;
        }
        .cp-accordion {
          display: none;
        }

        /* Mobile: single column, accordion replaces sidebar */
        @media (max-width: 767px) {
          .cp-layout {
            flex-direction: column;
          }
          .cp-sidebar {
            display: none;
          }
          .cp-main {
            padding: 12px 12px 32px;
          }
          .cp-accordion {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
