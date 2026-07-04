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
    // כוורת האות has its own floating tab bar (design/kaveret mockup) — no nav.
    pathname.startsWith("/kaveret");

  return (
    <>
      {!hideNav && nav}
      <div style={{ paddingTop: hideNav ? 0 : 64 }}>{children}</div>
    </>
  );
}
