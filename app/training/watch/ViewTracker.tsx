"use client";

import { useEffect } from "react";

/** Fires POST /api/training-view on mount. No UI. */
export function ViewTracker() {
  useEffect(() => {
    fetch("/api/training-view", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
