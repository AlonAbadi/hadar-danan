"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";

const VIMEO_EMBED_URL =
  "https://player.vimeo.com/video/1178865564?badge=0&autopause=0&player_id=0&app_id=58479";

const TOTAL_LESSONS = 16;

const modules = [
  {
    id: 1,
    title: "למה השיווק נכשל",
    lessons: [
      { id: 1, title: "האמת על תוכן שלא מוכר" },
      { id: 2, title: "הטעות שכולם עושים" },
    ],
  },
  {
    id: 2,
    title: "הבסיס - הזהות השיווקית",
    lessons: [
      { id: 3, title: "מי את ולמה זה חשוב" },
      { id: 4, title: "הקול הייחודי שלך" },
    ],
  },
  {
    id: 3,
    title: "TrueSignal© - השיטה",
    lessons: [
      { id: 5, title: "איך לזהות את האות האמיתי" },
      { id: 6, title: "מה הקהל שלך באמת רוצה לשמוע" },
    ],
  },
  {
    id: 4,
    title: "בניית תוכן שמוכר",
    lessons: [
      { id: 7, title: "מבנה פוסט שגורם לאנשים לעצור" },
      { id: 8, title: "מהסטורי לסייל" },
    ],
  },
  {
    id: 5,
    title: "הפלטפורמות",
    lessons: [
      { id: 9,  title: "אינסטגרם - מה עובד ב-2026" },
      { id: 10, title: "טיקטוק ורילס - לגדול מהר" },
    ],
  },
  {
    id: 6,
    title: "המשפך השיווקי",
    lessons: [
      { id: 11, title: "מהתוכן החינמי לרכישה" },
      { id: 12, title: "בניית אמון בסדרת תוכן" },
    ],
  },
  {
    id: 7,
    title: "קהילה ומינוף",
    lessons: [
      { id: 13, title: "הפיכת עוקבים ללקוחות" },
      { id: 14, title: "שגרת תוכן שלא מתישה" },
    ],
  },
  {
    id: 8,
    title: "הצעד הבא",
    lessons: [
      { id: 15, title: "ניתוח מה עובד אצלך" },
      { id: 16, title: "תוכנית פעולה - 30 יום" },
    ],
  },
];

const STORAGE_KEY = "course_completed_lessons";

export default function CourseContentPage() {
  const [activeLesson, setActiveLesson] = useState(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  // Load completed lessons from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  function markComplete(id: number) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function selectLesson(id: number) {
    setActiveLesson(id);
    markComplete(id);
    // Scroll to top of player on mobile
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const activeTitle = modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === activeLesson)?.title ?? "";

  const completedCount = completed.size;

  return (
    <div dir="rtl" className="min-h-screen font-assistant" style={{ background: "#0D1018", color: "#EDE9E1" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b px-4 md:px-6"
        style={{ background: "rgba(13,16,24,0.95)", backdropFilter: "blur(12px)", borderColor: "#2C323E" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center h-16">
          <div className="flex flex-col items-center text-center">
            <p
              className="font-black text-sm md:text-base"
              style={{
                background: "linear-gradient(135deg,#E8B94A,#C9964A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              קורס - למה השיווק שלך לא עובד
            </p>
            <p className="text-xs hidden md:block" style={{ color: "#9E9990" }}>
              8 מודולים · 16 שיעורים · גישה מלאה
            </p>
          </div>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div
        className="px-4 md:px-6 py-2 border-b flex items-center gap-3"
        style={{ background: "#141820", borderColor: "#2C323E" }}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#C9964A" }}>
            שיעור {activeLesson} מתוך {TOTAL_LESSONS}
          </span>
          <div className="flex-1 rounded-full h-1.5" style={{ background: "#2C323E" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / TOTAL_LESSONS) * 100}%`,
                background: "linear-gradient(90deg, #E8B94A, #C9964A)",
              }}
            />
          </div>
          <span className="text-xs whitespace-nowrap" style={{ color: "#9E9990" }}>
            {completedCount}/{TOTAL_LESSONS} הושלמו
          </span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-0">

        {/* ── Main player (right in RTL) ── */}
        <main className="flex-1 min-w-0 p-4 md:p-6 flex flex-col gap-4">

          {/* Video */}
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{ border: "1px solid #2C323E", background: "#000" }}
          >
            <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
              <iframe
                key={activeLesson}
                src={VIMEO_EMBED_URL}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                title={activeTitle}
              />
            </div>
          </div>

          {/* Lesson info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#C9964A" }}>
                שיעור {activeLesson}
              </p>
              <h1 className="text-xl md:text-2xl font-black" style={{ color: "#EDE9E1" }}>
                {activeTitle}
              </h1>
            </div>
            {!completed.has(activeLesson) && (
              <button
                onClick={() => markComplete(activeLesson)}
                className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-80"
                style={{ background: "rgba(201,150,74,0.1)", border: "1px solid rgba(201,150,74,0.3)", color: "#C9964A" }}
              >
                ✓ סמן כהושלם
              </button>
            )}
            {completed.has(activeLesson) && (
              <span
                className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: "rgba(201,150,74,0.08)", color: "#C9964A" }}
              >
                ✓ הושלם
              </span>
            )}
          </div>

          {/* Next lesson button */}
          {activeLesson < TOTAL_LESSONS && (
            <button
              onClick={() => selectLesson(activeLesson + 1)}
              className="self-start rounded-full px-6 py-3 text-sm font-bold transition active:scale-[0.98] btn-cta-gold"
            >
              לשיעור הבא ←
            </button>
          )}
          {activeLesson === TOTAL_LESSONS && (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.2)" }}
            >
              <p className="font-black text-lg" style={{ color: "#C9964A" }}>🎉 סיימת את הקורס!</p>
              <p className="text-sm mt-1" style={{ color: "#9E9990" }}>
                הצעד הבא - פגישת אסטרטגיה אישית עם הדר
              </p>
              <Link
                href="/strategy"
                className="inline-block mt-3 rounded-full px-6 py-2 text-sm font-bold btn-cta-gold"
              >
                קבע פגישת אסטרטגיה ←
              </Link>
            </div>
          )}
        </main>

        {/* ── Sidebar (left in RTL = left side) ── */}
        <aside
          className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-r overflow-y-auto"
          style={{ borderColor: "#2C323E", background: "#141820", maxHeight: "calc(100vh - 8rem)" }}
        >
          <div className="p-4 border-b" style={{ borderColor: "#2C323E" }}>
            <p className="font-black text-sm" style={{ color: "#EDE9E1" }}>תוכן הקורס</p>
          </div>

          <div className="flex flex-col">
            {modules.map((mod) => (
              <div key={mod.id} className="border-b" style={{ borderColor: "#2C323E" }}>
                {/* Module header */}
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ background: "#141820" }}
                >
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: "rgba(201,150,74,0.12)", color: "#C9964A" }}
                  >
                    {mod.id}
                  </span>
                  <p className="text-sm font-bold" style={{ color: "#EDE9E1" }}>{mod.title}</p>
                </div>

                {/* Lessons */}
                <div className="flex flex-col">
                  {mod.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLesson;
                    const isDone = completed.has(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson.id)}
                        className="flex items-center gap-3 px-4 py-3 text-right w-full transition"
                        style={{
                          background: isActive ? "rgba(201,150,74,0.1)" : "transparent",
                          borderRight: isActive ? "3px solid #C9964A" : "3px solid transparent",
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Status icon */}
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{
                            background: isDone
                              ? "rgba(201,150,74,0.2)"
                              : isActive
                                ? "rgba(201,150,74,0.15)"
                                : "rgba(255,255,255,0.05)",
                            color: isDone || isActive ? "#C9964A" : "#9E9990",
                            border: isActive ? "1px solid rgba(201,150,74,0.4)" : "1px solid transparent",
                          }}
                        >
                          {isDone ? "✓" : lesson.id}
                        </span>
                        <span
                          className="text-sm text-right flex-1"
                          style={{ color: isActive ? "#E8B94A" : isDone ? "#C9964A" : "#9E9990" }}
                        >
                          {lesson.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Script src="https://player.vimeo.com/api/player.js" />
    </div>
  );
}
