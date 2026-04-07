"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  videoId?: string; // YouTube video ID - set NEXT_PUBLIC_VIDEO_ID in .env.local
}

type YTPlayerState = -1 | 0 | 1 | 2 | 3 | 5;

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: () => void;
            onStateChange?: (e: { data: YTPlayerState }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: { PLAYING: 1; PAUSED: 2; ENDED: 0 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
  interface YTPlayerInstance {
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

function fireEvent(type: string, metadata: Record<string, unknown> = {}) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      anonymous_id: getCookie("anon_id"),
      metadata,
    }),
  }).catch(() => {});
}

export function VideoPlayer({ videoId }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fired50 = useRef(false);
  const fired80 = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedId = videoId ?? process.env.NEXT_PUBLIC_VIDEO_ID ?? "";

  useEffect(() => {
    if (!resolvedId) return;

    function initPlayer() {
      if (!containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: resolvedId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          hl: "he",
        },
        events: {
          onReady: () => setIsLoaded(true),
          onStateChange: (e) => {
            if (e.data === 1) {
              // PLAYING - start progress polling
              fireEvent("VIDEO_PLAY", { video_id: resolvedId });
              intervalRef.current = setInterval(() => {
                const player = playerRef.current;
                if (!player) return;
                const duration = player.getDuration();
                if (!duration) return;
                const pct = player.getCurrentTime() / duration;

                if (!fired50.current && pct >= 0.5) {
                  fired50.current = true;
                  fireEvent("VIDEO_50PCT", { video_id: resolvedId, pct: 50 });
                }
                if (!fired80.current && pct >= 0.8) {
                  fired80.current = true;
                  fireEvent("VIDEO_80PCT", { video_id: resolvedId, pct: 80 });
                  if (intervalRef.current) clearInterval(intervalRef.current);
                }
              }, 3000);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [resolvedId]);

  if (!resolvedId) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center gap-4 border border-gray-700">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-white mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">הגדר NEXT_PUBLIC_VIDEO_ID ב-env.local</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
