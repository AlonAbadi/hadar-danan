"use client";

import { useEffect, useRef, useState } from "react";

interface SocialProofProps {
  count: number;
  light?: boolean; // light background variant for homepage
}

function useCountUp(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}

// Mosaic grid of placeholder "alumni photos" - colored initials
const ALUMNI = [
  { initials: "מ.ל", color: "#6366f1" },
  { initials: "ר.ש", color: "#8b5cf6" },
  { initials: "ע.מ", color: "#ec4899" },
  { initials: "ד.כ", color: "#14b8a6" },
  { initials: "נ.ב", color: "#f59e0b" },
  { initials: "א.ג", color: "#10b981" },
  { initials: "ש.ר", color: "#3b82f6" },
  { initials: "ל.ה", color: "#ef4444" },
  { initials: "מ.ד", color: "#a855f7" },
  { initials: "י.ק", color: "#06b6d4" },
  { initials: "ה.נ", color: "#f97316" },
  { initials: "ב.ו", color: "#84cc16" },
];

export function SocialProof({ count, light = false }: SocialProofProps) {
  const displayCount = Math.max(count + 250, 500);
  const animated = useCountUp(displayCount);

  const counterColor = light ? "#2563eb" : "#4ade80";
  const headingColor = light ? "text-gray-900" : "text-white";
  const subColor = light ? "text-gray-500" : "text-gray-500";

  return (
    <div className="flex flex-col items-center gap-10 text-center">
      {/* Mosaic grid of alumni */}
      <div className="grid grid-cols-6 gap-2 w-full max-w-xs mx-auto">
        {ALUMNI.map((a, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl flex items-center justify-center text-white font-bold text-xs"
            style={{ background: a.color }}
          >
            {a.initials}
          </div>
        ))}
      </div>

      {/* Counter */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-6xl font-black tabular-nums" style={{ color: counterColor }}>
          {animated.toLocaleString("he-IL")}+
        </span>
        <p className={`font-bold text-xl ${headingColor}`}>בעלי עסקים כבר עשו את זה</p>
        <p className={`text-sm ${subColor}`}>מעל 500 בעלי עסקים השיגו לקוחות חדשים דרך תוכן וידאו</p>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-gray-500 text-sm mr-2">4.9/5 · 127 ביקורות</span>
      </div>
    </div>
  );
}
