"use client";

import { useEffect } from "react";

export function PageViewTracker() {
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PAGE_VIEW",
        metadata: { page: "training_watch" },
      }),
    });
  }, []);

  return null;
}
