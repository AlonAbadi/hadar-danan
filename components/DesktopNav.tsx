"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const NAV_LINKS = [
  { label: "אודות",         href: "/about" },
  { label: "בינג׳",         href: "/binge" },
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
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCapsuleClick = () => {
    startTransition(() => { router.push("/account"); });
  };

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
          <button
            onClick={handleCapsuleClick}
            disabled={isPending}
            style={{
              border: "1px solid rgba(232,185,74,0.35)",
              background: isPending ? "rgba(232,185,74,0.18)" : "rgba(232,185,74,0.08)",
              borderRadius: 999,
              padding: "5px 24px",
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 600, color: "#E8B94A",
              fontFamily: "inherit",
              cursor: isPending ? "default" : "pointer",
              pointerEvents: isPending ? "none" : "auto",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {isPending && (
              <span style={{
                width: 11, height: 11,
                border: "1.5px solid rgba(232,185,74,0.3)",
                borderTopColor: "#E8B94A",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                display: "inline-block", flexShrink: 0,
              }} />
            )}
            {userInitial}
          </button>
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

        {/* BeeGood text logo separator */}
        <Image
          src="/beegoodtxt.png"
          alt="beegood"
          width={80}
          height={20}
          style={{ opacity: 0.65, height: 20, width: "auto", flexShrink: 0, margin: "0 4px" }}
        />

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
