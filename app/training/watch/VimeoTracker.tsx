"use client";

import { useEffect, useRef } from "react";

const VIDEO_ID = "1178865564";
const MILESTONES = [25, 50, 75];

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined") (window as unknown as Record<string, (...a: unknown[]) => void>).fbq?.(...args);
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

function postEvent(payload: Record<string, unknown>) {
  fetch("/api/video-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, video_id: VIDEO_ID, anon_id: getCookie("anon_id") }),
  }).catch(() => {});
}

export function VimeoTracker({ iframeId }: { iframeId: string }) {
  const firedMilestones = useRef<Set<number>>(new Set());
  const lastDropOff = useRef<{ seconds: number; percent: number } | null>(null);
  const last15Segment = useRef<number>(-1);

  useEffect(() => {
    let attempts = 0;

    function attach() {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      if (!iframe) return;

      const Vimeo = (window as unknown as Record<string, unknown>).Vimeo as
        | { Player: new (el: HTMLIFrameElement) => {
            on: (event: string, cb: (data: { seconds: number; duration: number; percent: number }) => void) => void;
            off: (event: string) => void;
            setLoop: (loop: boolean) => Promise<void>;
          } }
        | undefined;

      if (!Vimeo?.Player) {
        if (attempts++ < 20) setTimeout(attach, 500);
        return;
      }

      const p = new Vimeo.Player(iframe);
      p.setLoop(false).catch(() => {});

      // play - fired when user starts or resumes watching
      p.on("play", () => {
        postEvent({ event_type: "play" });
      });

      // timeupdate - milestones + every 15 seconds
      p.on("timeupdate", (data) => {
        if (!data.duration) return;
        const pct = Math.floor((data.seconds / data.duration) * 100);
        lastDropOff.current = { seconds: data.seconds, percent: pct };

        // Milestone tracking (25%, 50%, 75%)
        for (const milestone of MILESTONES) {
          if (pct >= milestone && !firedMilestones.current.has(milestone)) {
            firedMilestones.current.add(milestone);
            postEvent({ event_type: "watch_progress", percent_watched: milestone, drop_off_second: Math.floor(data.seconds) });
            fbq("trackCustom", `VideoWatched${milestone}`, { video_id: VIDEO_ID, percent: milestone });
          }
        }

        // 15-second interval tracking for drop-off curve
        const seg = Math.floor(data.seconds / 15);
        if (seg > last15Segment.current) {
          last15Segment.current = seg;
          postEvent({ event_type: "timeupdate", percent_watched: pct, drop_off_second: Math.floor(data.seconds) });
        }
      });

      // pause - only if not near end
      p.on("pause", (data) => {
        if (!data.duration) return;
        const pct = Math.floor((data.seconds / data.duration) * 100);
        if (pct < 95) {
          postEvent({
            event_type: "drop_off",
            drop_off_second: Math.floor(data.seconds),
            percent_watched: pct,
          });
        }
      });

      // ended - video completed
      p.on("ended", () => {
        firedMilestones.current.add(100);
        postEvent({ event_type: "completed", percent_watched: 100 });
        fbq("trackCustom", "VideoCompleted", { video_id: VIDEO_ID });
      });
    }

    attach();
  }, [iframeId]);

  return null;
}
