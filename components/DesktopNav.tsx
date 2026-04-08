"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { label: "אודות",         href: "/about" },
  { label: "הצוות",        href: "/team" },
  { label: "הדרכה חינמית", href: "/training" },
  { label: "קוויז",        href: "/quiz" },
];

const DROPDOWN_ITEMS = [
  { label: "אתגר 7 ימים",      price: "₪197",    href: "/challenge" },
  { label: "סדנה יום אחד",     price: "₪1,080",  href: "/workshop" },
  { label: "קורס דיגיטלי",     price: "₪1,800",  href: "/course" },
  { label: "פגישת אסטרטגיה",   price: "₪4,000",  href: "/strategy" },
  { label: "יום צילום פרמיום", price: "₪14,000", href: "/premium" },
  { label: "שותפות",           price: "₪10k+",   href: "/partnership" },
];

const EXTRA_LINKS = [
  { label: "הכוורת 🐝",        href: "/hive" },
  { label: "האזור האישי שלי", href: "/my" },
];

const LINK_STYLE = (active: boolean): React.CSSProperties => ({
  color: active ? "#E8B94A" : "#EDE9E1",
  fontSize: 14,
  fontFamily: "var(--font-assistant), Assistant, sans-serif",
  fontWeight: active ? 700 : 400,
  textDecoration: "none",
  whiteSpace: "nowrap",
  transition: "color 150ms",
});

interface DesktopNavProps {
  userInitial?: string | null;
}

export function DesktopNav({ userInitial = null }: DesktopNavProps) {
  const pathname = usePathname();
  const [dropOpen, setDropOpen] = useState(false);

  const dropActive = DROPDOWN_ITEMS.some((i) => pathname === i.href);

  return (
    <nav
      className="hidden md:flex"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: 64,
        background: "#0D1018",
        borderBottom: "1px solid #2C323E",
      }}
    >
      {/* RIGHT (visually in RTL) - Logo image + text */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, textDecoration: "none" }}>
        <Image src="/beegood_logo.png" alt="Bee Good" width={38} height={30} />
        <div style={{ color: "#EDE9E1", fontWeight: 700, fontSize: 17, fontFamily: "var(--font-assistant), Assistant, sans-serif" }}>
          הדר דנן
        </div>
      </Link>

      {/* LEFT — auth capsule */}
      <div style={{ flexShrink: 0 }}>
        {userInitial ? (
          <a
            href="/account"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(127,119,221,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#9F97DD",
              textDecoration: "none",
            }}
          >
            {userInitial}
          </a>
        ) : (
          <a
            href="/login"
            style={{
              background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
              color: "#080C14",
              fontSize: 13, fontWeight: 700,
              padding: "6px 18px", borderRadius: 20,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            התחבר
          </a>
        )}
      </div>

      {/* CENTER - Nav links (RTL order) */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, direction: "rtl", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>

        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={LINK_STYLE(pathname === link.href)}
            onMouseEnter={(e) => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.color = "#C9964A"; }}
            onMouseLeave={(e) => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.color = "#EDE9E1"; }}
          >
            {link.label}
          </Link>
        ))}

        {/* Dropdown - מסלולים */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setDropOpen(true)}
          onMouseLeave={() => setDropOpen(false)}
        >
          <button
            style={{
              ...LINK_STYLE(dropActive),
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            מסלולים ▾
          </button>

          {dropOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                background: "#141820",
                border: "1px solid #2C323E",
                borderRadius: 8,
                minWidth: 240,
                zIndex: 100,
                direction: "rtl",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {DROPDOWN_ITEMS.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 24px",
                    borderBottom: i < DROPDOWN_ITEMS.length - 1 ? "1px solid #2C323E" : "none",
                    color: pathname === item.href ? "#E8B94A" : "#EDE9E1",
                    fontSize: 14,
                    fontFamily: "var(--font-assistant), Assistant, sans-serif",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D2430"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ color: "#9E9990", fontSize: 13 }}>{item.price}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {EXTRA_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={LINK_STYLE(pathname === link.href)}
            onMouseEnter={(e) => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.color = "#C9964A"; }}
            onMouseLeave={(e) => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.color = "#EDE9E1"; }}
          >
            {link.label}
          </Link>
        ))}

      </div>
    </nav>
  );
}
