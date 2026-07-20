"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import sty from "@/app/kaveret/kaveret.module.css";

/**
 * Site-wide floating tab bar for active כוורת האות members — the exact bar
 * from /kaveret, shown on every Hebrew page so a logged-in member can jump
 * back into the hive from anywhere. Each tab deep-links to its zone via
 * /kaveret#tab-N (KaveretClient reads the hash on mount and scrolls there).
 * Hidden where a local bar or a full-screen surface already owns the bottom.
 */
const HIDE_PREFIXES = ["/kaveret", "/en", "/admin", "/hive/signal-kit/broadcast"];

const TABS = [
  ["האות", <svg key="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.4" /><path d="M12 4v3M12 17v3M4 12h3M17 12h3" /></svg>],
  ["אתגר", <svg key="i" viewBox="0 0 24 24"><path d="M8 4h8M12 4v5" /><circle cx="12" cy="14" r="6" /><path d="M12 12v2.5l1.8 1.2" /></svg>],
  ["תסריטים", <svg key="i" viewBox="0 0 24 24"><path d="M8 4h8a2 2 0 0 1 2 2v14l-2-1.5L14 20l-2-1.5L10 20l-2-1.5L6 20V6a2 2 0 0 1 2-2z" /><path d="M9.5 9h5M9.5 12.5h5" /></svg>],
  ["התכנים", <svg key="i" viewBox="0 0 24 24"><path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></svg>],
] as const;

export function HiveFloatBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mini, setMini] = useState(false);
  const lastY = useRef(0);
  const acc = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      lastY.current = y;
      if (y < 90) { setMini(false); acc.current = 0; return; }
      if ((dy > 0 && acc.current < 0) || (dy < 0 && acc.current > 0)) acc.current = 0;
      acc.current += dy;
      if (acc.current > 24) setMini(false);
      else if (acc.current < -24) setMini(true);
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  if (HIDE_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <nav className={`${sty.tabbar} ${mini ? sty.mini : ""}`} aria-label="כוורת האות">
      {TABS.map(([label, icon], i) => (
        <button
          key={label}
          type="button"
          className={sty.tb}
          aria-label={`${label} בכוורת האות`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(6);
            router.push(`/kaveret#tab-${i}`);
          }}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
