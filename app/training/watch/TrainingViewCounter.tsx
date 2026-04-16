"use client";

import { useEffect, useState } from "react";

interface TrainingViewCounterProps {
  initialCount: number;
  /** When true, POSTs /api/training-view on mount and updates to the returned count. Default: false. */
  shouldTrack?: boolean;
  /** Optional label rendered below the number (for standalone use). */
  label?: string;
}

export function TrainingViewCounter({
  initialCount,
  shouldTrack = false,
  label,
}: TrainingViewCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const [target, setTarget] = useState(initialCount);

  // If shouldTrack: POST and refresh count from response
  useEffect(() => {
    if (!shouldTrack) return;
    fetch("/api/training-view", { method: "POST" })
      .then(r => r.json())
      .then((data: { count?: number }) => {
        if (typeof data.count === "number") setTarget(data.count);
      })
      .catch(() => {});
  }, [shouldTrack]);

  // Count-up animation from 0 to target (ease-out cubic, 1.5s)
  useEffect(() => {
    if (target === 0) {
      setDisplayCount(0);
      return;
    }
    const duration = 1500;
    const start = Date.now();

    function step() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [target]);

  const number = displayCount.toLocaleString("he-IL");

  // Standalone mode: renders number + label together
  if (label) {
    return (
      <>
        <div className="stat-val">{number}</div>
        <div className="stat-label">{label}</div>
      </>
    );
  }

  // Embedded mode (inside stat-val from parent): renders number only
  return <>{number}</>;
}
