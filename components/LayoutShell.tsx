"use client";

import { usePathname } from "next/navigation";

const FULL_SCREEN_ROUTES: string[] = [];

export function LayoutShell({
  nav,
  children,
}: {
  nav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav =
    FULL_SCREEN_ROUTES.includes(pathname) ||
    pathname.startsWith("/en") ||
    // חדר השידור is a full-viewport camera experience — no nav.
    pathname.startsWith("/hive/signal-kit/broadcast") ||
    // כוורת האות (member home) has its own floating tab bar — no nav. The
    // visitor state at /kaveret/i keeps the full site chrome deliberately.
    // The free /kaveret/first-reel acquisition flow (Alon 2026-07-24) keeps
    // the site chrome too so prospects have nav + footer around the reel
    // experience. Its camera phase covers the nav via zIndex 1000, so the
    // room stays full-screen without needing a shell exception.
    (pathname.startsWith("/kaveret") &&
      !pathname.startsWith("/kaveret/i") &&
      !pathname.startsWith("/kaveret/first-reel"));

  return (
    <>
      {!hideNav && nav}
      <div style={{ paddingTop: hideNav ? 0 : 64 }}>{children}</div>
    </>
  );
}
