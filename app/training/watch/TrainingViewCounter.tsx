"use client";

import { useEffect, useState } from "react";

interface TrainingViewCounterProps {
  initialCount: number;
}

export function TrainingViewCounter({ initialCount }: TrainingViewCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const [target, setTarget] = useState(initialCount);

  // POST the page view on mount and update target with fresh count
  useEffect(() => {
    fetch("/api/training-view", { method: "POST" })
      .then(r => r.json())
      .then((data: { count?: number }) => {
        if (typeof data.count === "number") setTarget(data.count);
      })
      .catch(() => {});
  }, []);

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

  return <>{displayCount.toLocaleString("he-IL")}</>;
}
