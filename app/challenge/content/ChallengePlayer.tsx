"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CHALLENGE_DAYS, isSessionDay } from "@/lib/challenge-config";

interface Props {
  enrollmentId:        string;
  maxUnlockedDay:      number;   // time-based — highest day currently accessible
  completedDayNumbers: number[];
  liveMeetingDate:     string;   // ISO string of next closing live meeting
}

export default function ChallengePlayer({
  enrollmentId,
  maxUnlockedDay,
  completedDayNumbers,
  liveMeetingDate,
}: Props) {
  const [completed, setCompleted]       = useState<Set<number>>(new Set(completedDayNumbers));
  const [reported, setReported]         = useState<Set<number>>(new Set(completedDayNumbers));
  const [marking, setMarking]           = useState(false);
  const [lockedPopup, setLockedPopup]   = useState(false);
  const [expanded, setExpanded]         = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Day 8 unlocks once day 7 is accessible
  const day8Accessible = maxUnlockedDay >= 7;

  // Start on the current active day (first uncompleted within unlocked range)
  const firstActive = (() => {
    for (let d = 0; d <= maxUnlockedDay; d++) {
      if (!completed.has(d)) return d;
    }
    return maxUnlockedDay;
  })();
  const [activeDay, setActiveDay] = useState(firstActive);

  const dayData        = CHALLENGE_DAYS.find((d) => d.day === activeDay)!;
  const isLocked       = activeDay > maxUnlockedDay || (activeDay === 8 && !day8Accessible);
  const isPlaceholder  = dayData.videoId === "PLACEHOLDER";
  const dayDone        = completed.has(activeDay);
  const completedCount = completed.size;
  const totalDays      = CHALLENGE_DAYS.length;
  const progressPct    = (completedCount / totalDays) * 100;
  const is916          = dayData.aspectRatio === "9:16";

  // Format live meeting date in Hebrew
  const liveMeetingLabel = (() => {
    const d = new Date(liveMeetingDate);
    return d.toLocaleDateString("he-IL", {
      weekday: "long", day: "numeric", month: "long",
    });
  })();

  // Vimeo Player API — auto-mark watched at 90%
  useEffect(() => {
    if (isPlaceholder || isLocked || !iframeRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!win.Vimeo) return;
    const player = new win.Vimeo.Player(iframeRef.current);
    player.on("timeupdate", (data: { percent: number }) => {
      if (data.percent >= 0.9 && !reported.has(activeDay)) markWatched(activeDay);
    });
    return () => { player.off("timeupdate"); };
  }, [activeDay, isPlaceholder, isLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markWatched(day: number) {
    if (reported.has(day) || marking) return;
    setReported((prev) => new Set(prev).add(day));
    setMarking(true);

    try {
      const res = await fetch("/api/challenge/complete-day", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ day_number: day }),
      });
      if (res.ok) {
        setCompleted((prev) => new Set(prev).add(day));
      }
    } catch {
      setReported((prev) => { const s = new Set(prev); s.delete(day); return s; });
    } finally {
      setMarking(false);
    }
  }

  function goTo(day: number) {
    setActiveDay(day);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDayClick(day: number) {
    const locked = day > maxUnlockedDay || (day === 8 && !day8Accessible);
    if (locked) {
      setLockedPopup(true);
    } else {
      goTo(day);
    }
  }

  // ── Day circle color ─────────────────────────────────────
  function circleStyle(day: number) {
    const isDone   = completed.has(day);
    const isActive = day === activeDay;
    const locked   = day > maxUnlockedDay || (day === 8 && !day8Accessible);
    const special  = isSessionDay(day);

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
        const isDone    = completed.has(d.day);
        const isActive  = d.day === activeDay;
        const locked    = d.day > maxUnlockedDay || (d.day === 8 && !day8Accessible);
        const cs        = circleStyle(d.day);
        const isSpecial = isSessionDay(d.day);

        return (
          <button
            key={d.day}
            onClick={() => handleDayClick(d.day)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", width: "100%",
              background: isActive ? "rgba(201,150,74,0.07)" : "transparent",
              border: "none", borderBottom: "1px solid #1D2430",
              cursor: "pointer",
              fontFamily: "Assistant, sans-serif",
              textAlign: "right", direction: "rtl",
              opacity: locked ? 0.5 : 1,
            }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, direction: "ltr",
              background: cs.bg, color: cs.color,
              border: `1px solid ${cs.border}`,
            }}>
              {isDone ? "✓" : locked ? "★" : isSpecial ? (d.day === 0 ? "★" : "✦") : d.day}
            </span>

            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: isActive ? "#E8B94A" : locked ? "#4A5060" : "#EDE9E1",
                marginBottom: 2,
              }}>
                {d.day === 0 ? "פתיחה" : d.day === 8 ? "סיום" : `יום ${d.day}`} — {d.title}
              </div>
              {d.day === 8 && (
                <div style={{ fontSize: 11, color: "#A78BFA" }}>
                  מפגש חי עם הדר — {liveMeetingLabel}
                </div>
              )}
            </div>

            {isDone ? (
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
    const canNext = nextDay && nextDay.day <= maxUnlockedDay && !(nextDay.day === 8 && !day8Accessible);
    const canPrev = prevDay && prevDay.day <= maxUnlockedDay;

    return (
      <div style={{ display: "flex", gap: 10 }}>
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
    const paddingTop  = is916 ? "177.78%" : "56.25%";
    const outerStyle: React.CSSProperties = is916
      ? { maxWidth: 340, margin: "0 auto", width: "100%" }
      : {};

    if (isLocked) {
      return (
        <div style={outerStyle}>
          <div style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid #2C323E", background: "#0D1219",
            position: "relative", paddingTop,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12, padding: "0 20px",
            }}>
              <span style={{ fontSize: 36 }}>🔒</span>
              <div style={{ fontSize: 14, color: "#9E9990", fontWeight: 700, textAlign: "center" }}>
                {activeDay === 8
                  ? "מפגש הסיום יפתח לאחר שיום 7 יהיה זמין"
                  : "יום זה ייפתח מחר בבוקר"}
              </div>
              <div style={{ fontSize: 12, color: "#4A5060", textAlign: "center" }}>
                תקבל הודעה בווצאפ כשיגיע הזמן
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Day 8 is accessible but has no video yet — show live meeting info instead
    if (activeDay === 8 && isPlaceholder) {
      return (
        <div style={{
          borderRadius: 12, border: "1px solid rgba(139,92,246,0.3)",
          background: "rgba(139,92,246,0.06)",
          padding: "40px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA", marginBottom: 8 }}>
            מפגש חי עם הדר
          </div>
          <div style={{ fontSize: 15, color: "#EDE9E1", fontWeight: 700, marginBottom: 8 }}>
            {liveMeetingLabel}
          </div>
          <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            מפגש הסיום יתקיים ב-Zoom עם הדר.
            נסכם את השבוע, נחגוג את ההישגים, ונדבר על הצעדים הבאים.
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: "#4A5060" }}>
            קישור ה-Zoom יישלח לפני המפגש
          </div>
        </div>
      );
    }

    return (
      <div style={outerStyle}>
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: "1px solid #2C323E", background: "#000",
          position: "relative", paddingTop,
        }}>
          <iframe
            ref={iframeRef}
            key={activeDay}
            src={`https://player.vimeo.com/video/${dayData.videoId}?badge=0&autopause=0&loop=0&player_id=0&app_id=58479`}
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
            title={dayData.title}
          />
        </div>
      </div>
    );
  };

  // collapse expanded panel when switching days
  useEffect(() => { setExpanded(false); }, [activeDay]);

  // ── Day meta + description ───────────────────────────────
  const DayMeta = () => (
    <>
      {!dayDone && !isLocked && activeDay !== 8 && (
        <div style={{ textAlign: "center", marginTop: 14, marginBottom: 4 }}>
          <button
            onClick={() => markWatched(activeDay)}
            disabled={marking}
            style={{
              padding: "9px 24px", borderRadius: 8, border: "none",
              background: marking ? "#2C323E" : "linear-gradient(135deg, #E8B94A, #9E7C3A)",
              color: marking ? "#9E9990" : "#080C14",
              fontSize: 13, fontWeight: 800,
              cursor: marking ? "not-allowed" : "pointer",
              fontFamily: "Assistant, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {marking ? "שומר..." : "סמן כנצפה ✓"}
          </button>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: "#9E9990", textAlign: "right", marginTop: 14, marginBottom: 4 }}>
        {activeDay === 0 ? "מפגש פתיחה" : activeDay === 8 ? "מפגש סיום" : `יום ${activeDay} מתוך 7`}
        {" · "}
        {dayData.aspectRatio === "9:16" ? "ריל" : "וידאו"}
      </div>

      <div style={{
        background: "#0D1219", border: "1px solid #2C323E",
        borderRadius: 10, marginBottom: 16, textAlign: "right", overflow: "hidden",
      }}>
        {/* Header row */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#EDE9E1", marginBottom: 6 }}>
            {dayData.title}
          </div>
          <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.7 }}>
            {dayData.description}
          </div>
        </div>

        {/* Expand button — only if bullets exist */}
        {dayData.bullets.length > 0 && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                width: "100%", padding: "10px 16px",
                background: expanded ? "rgba(201,150,74,0.06)" : "transparent",
                border: "none", borderTop: "1px solid #1D2430",
                color: "#C9964A", fontSize: 12, fontWeight: 700,
                cursor: "pointer", textAlign: "right", direction: "rtl",
                fontFamily: "Assistant, sans-serif",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{
                display: "inline-block",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                fontSize: 10,
              }}>▼</span>
              {expanded ? "הסתר" : "נקודות מפתח"}
            </button>

            {expanded && (
              <div style={{
                padding: "4px 16px 16px",
                borderTop: "1px solid #1D2430",
              }}>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {dayData.bullets.map((b, i) => (
                    <li key={i} style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      padding: "8px 0",
                      borderBottom: i < dayData.bullets.length - 1 ? "1px solid #1D2430" : "none",
                    }}>
                      <span style={{ color: "#C9964A", fontSize: 14, flexShrink: 0, marginTop: 2 }}>◆</span>
                      <span style={{ fontSize: 13, color: "#EDE9E1", lineHeight: 1.7 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Show next-day unlock hint for unlocked, incomplete days */}
      {!dayDone && !isLocked && activeDay < 7 && activeDay > 0 && (
        <div style={{
          background: "rgba(201,150,74,0.05)", border: "1px solid rgba(201,150,74,0.15)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 16,
          fontSize: 12, color: "#9E9990", textAlign: "center",
        }}>
          יום {activeDay + 1} ייפתח מחר בבוקר אוטומטית
        </div>
      )}
    </>
  );

  // ── Live meeting block (shown after day 7 is unlocked) ───
  const LiveMeetingBlock = () => {
    if (maxUnlockedDay < 7) return null;
    if (activeDay === 8) return null;
    return (
      <div style={{
        background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)",
        borderRadius: 12, padding: "20px 24px", textAlign: "center", marginTop: 16,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#A78BFA", marginBottom: 6 }}>
          🎉 סיימת את 7 הימים!
        </div>
        <div style={{ fontSize: 13, color: "#EDE9E1", fontWeight: 700, marginBottom: 4 }}>
          מפגש חי עם הדר — {liveMeetingLabel}
        </div>
        <div style={{ fontSize: 12, color: "#9E9990", marginBottom: 16, lineHeight: 1.6 }}>
          מפגש הסיום בזום מחכה לך — קישור ישלח לפני המפגש
        </div>
        <button
          onClick={() => goTo(8)}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
            color: "#fff", fontSize: 14, fontWeight: 800,
            cursor: "pointer", fontFamily: "Assistant, sans-serif",
          }}
        >
          לפרטי מפגש הסיום ←
        </button>
      </div>
    );
  };

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

  // ── Locked popup ─────────────────────────────────────────
  const LockedPopup = () => (
    <div
      onClick={() => setLockedPopup(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#141820", border: "1px solid #2C323E",
          borderRadius: 16, padding: "32px 28px", textAlign: "center",
          maxWidth: 320, width: "100%",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#EDE9E1", marginBottom: 8 }}>
          היום נעול
        </div>
        <div style={{ fontSize: 14, color: "#9E9990", lineHeight: 1.7, marginBottom: 20 }}>
          תגיע מחר — תשלח לך הודעה בווצאפ 📱
        </div>
        <button
          onClick={() => setLockedPopup(false)}
          style={{
            padding: "10px 28px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
            color: "#080C14", fontSize: 14, fontWeight: 800,
            cursor: "pointer", fontFamily: "Assistant, sans-serif",
          }}
        >
          הבנתי
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────
  return (
    <div dir="rtl" lang="he" style={{ minHeight: "100vh", background: "#080C14", color: "#EDE9E1", fontFamily: "Assistant, sans-serif" }}>

      {/* Locked day popup */}
      {lockedPopup && <LockedPopup />}

      {/* MOBILE HEADER */}
      <div className="ch-mob-hdr">
        <span />
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

        <main className="ch-main">
          <VideoArea />
          <DayMeta />
          <LiveMeetingBlock />
          <div style={{ marginBottom: 24 }}>
            <NavButtons />
          </div>
          {completedCount === totalDays && <CompletionBanner />}

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

      {CHALLENGE_DAYS.some((d) => d.videoId !== "PLACEHOLDER") && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script src="https://player.vimeo.com/api/player.js" />
      )}

      <style>{`
        .ch-mob-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #141820; border-bottom: 1px solid #2C323E;
        }
        .ch-desk-hdr { display: none; }
        .ch-layout { display: flex; flex-direction: row; max-width: 1280px; margin: 0 auto; }
        .ch-sidebar { display: none; }
        .ch-main { flex: 1; min-width: 0; padding: 16px; padding-bottom: 48px; }
        .ch-mob-list { display: block; margin-top: 8px; }
        @media (min-width: 768px) {
          .ch-mob-hdr { display: none; }
          .ch-desk-hdr {
            display: block; position: sticky; top: 0; z-index: 50;
            background: rgba(8,12,20,0.96); backdrop-filter: blur(12px);
            border-bottom: 1px solid #2C323E; padding: 0 24px;
          }
          .ch-sidebar {
            display: block; width: 280px; flex-shrink: 0;
            background: #141820; border-left: 1px solid #2C323E;
            position: sticky; top: 6rem; max-height: calc(100vh - 6rem);
            overflow-y: auto; align-self: flex-start;
          }
          .ch-main { padding: 24px 28px 64px; }
          .ch-mob-list { display: none; }
        }
      `}</style>
    </div>
  );
}
