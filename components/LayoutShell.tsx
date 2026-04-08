"use client";

import { usePathname } from "next/navigation";

const FULL_SCREEN_ROUTES = ["/binge"];

export function LayoutShell({
  nav,
  children,
}: {
  nav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = FULL_SCREEN_ROUTES.includes(pathname);

  return (
    <>
      {!hideNav && nav}
      <div style={{ paddingTop: hideNav ? 0 : 64 }}>{children}</div>
    </>
  );
}
