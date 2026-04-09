"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const ITEMS_GROUP1 = [
  { label: "אודות",  href: "/about" },
  { label: "בינג׳",  href: "/binge" },
  { label: "הצוות", href: "/team" },
];

const ITEMS_GROUP2 = [
  { label: "הדרכה חינמית",      href: "/training" },
  { label: "קוויז - איפה אתה?", href: "/quiz" },
];

const ITEMS_GROUP3 = [
  { label: "אתגר 7 ימים",      price: "₪197",    href: "/challenge" },
  { label: "סדנה יום אחד",     price: "₪1,080",  href: "/workshop" },
  { label: "קורס דיגיטלי",     price: "₪1,800",  href: "/course" },
  { label: "פגישת אסטרטגיה",   price: "₪4,000",  href: "/strategy" },
  { label: "יום צילום פרמיום", price: "₪14,000", href: "/premium" },
  { label: "שותפות",           price: "₪10k+",   href: "/partnership" },
];

const ITEMS_GROUP4 = [{ label: "הכוורת 🐝",        href: "/hive" }];
const ITEMS_GROUP5 = [{ label: "האזור האישי שלי", href: "/my" }];

interface MobileNavProps {
  userInitial?: string | null;
}

export function MobileNav({ userInitial = null }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <nav
        className="md:hidden"
        dir="ltr"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 64,
          background: "#0D1018",
          borderBottom: "1px solid #2C323E",
        }}
      >
        {/* FAR LEFT — hamburger */}
        <button
          aria-label="פתח תפריט"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          style={{ lineHeight: 0, padding: 4, background: "none", border: "none", flexShrink: 0 }}
        >
          <Menu color="#EDE9E1" size={28} />
        </button>

        {/* IMMEDIATELY RIGHT of hamburger — auth capsule */}
        <div style={{ marginRight: 8, flexShrink: 0 }}>
          {userInitial ? (
            <a
              href="/account"
              style={{
                border: "1px solid rgba(159,151,221,0.5)",
                background: "rgba(127,119,221,0.08)",
                borderRadius: 20,
                padding: "5px 24px",
                display: "flex", alignItems: "center",
                fontSize: 13, fontWeight: 600, color: "#9F97DD",
                textDecoration: "none", whiteSpace: "nowrap",
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
                fontSize: 12, fontWeight: 700,
                padding: "5px 14px", borderRadius: 20,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              התחבר
            </a>
          )}
        </div>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* FAR RIGHT — text + bee logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#EDE9E1", fontFamily: "var(--font-assistant), Assistant, sans-serif" }}>הדר דנן</span>
          <Image src="/beegood_logo.png" alt="Bee Good" width={38} height={30} />
        </Link>
      </nav>

      {/* ── Overlay ─────────────────────────────────────────── */}
      {open && (
        <div
          aria-hidden
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
        />
      )}

      {/* ── Drawer ──────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ניווט"
        dir="rtl"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "80vw",
          maxWidth: 320,
          background: "#141820",
          borderLeft: "1px solid #2C323E",
          zIndex: 50,
          overflowY: "auto",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 64,
            borderBottom: "1px solid #2C323E",
          }}
        >
          <button
            aria-label="סגור תפריט"
            onClick={close}
            style={{ lineHeight: 0, padding: 4, background: "none", border: "none" }}
          >
            <X color="#EDE9E1" size={22} />
          </button>
          <span style={{ color: "#EDE9E1", fontWeight: 700, fontSize: 15, textAlign: "right", paddingRight: 8 }}>תפריט</span>
        </div>

        {/* Group 1 */}
        {ITEMS_GROUP1.map((item) => (
          <DrawerItem key={item.href} item={item} active={pathname === item.href} onClose={close} />
        ))}

        <Divider />

        {/* Group 2 */}
        {ITEMS_GROUP2.map((item) => (
          <DrawerItem key={item.href} item={item} active={pathname === item.href} onClose={close} />
        ))}

        <Divider />

        {/* Group 3 - מסלולים */}
        <div style={{ color: "#C9964A", fontSize: 11, fontWeight: 700, padding: "16px 24px 4px", textAlign: "right", paddingRight: 24 }}>
          מסלולים
        </div>
        {ITEMS_GROUP3.map((item) => (
          <DrawerItem key={item.href} item={item} active={pathname === item.href} onClose={close} />
        ))}

        <Divider />

        {/* Group 4 */}
        {ITEMS_GROUP4.map((item) => (
          <DrawerItem key={item.href} item={item} active={pathname === item.href} onClose={close} />
        ))}

        <Divider />

        {/* Group 5 */}
        {ITEMS_GROUP5.map((item) => (
          <DrawerItem key={item.href} item={item} active={pathname === item.href} onClose={close} />
        ))}
      </div>
    </>
  );
}

function DrawerItem({
  item,
  active,
  onClose,
}: {
  item: { label: string; href: string; price?: string };
  active: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        direction: "rtl",
        padding: "16px 24px",
        borderBottom: "1px solid #2C323E",
        color: active ? "#E8B94A" : "#EDE9E1",
        fontWeight: active ? 700 : 400,
        fontSize: 15,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D2430"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span style={{ color: active ? "#E8B94A" : "#EDE9E1" }}>{item.label}</span>
      {item.price && <span style={{ color: "#9E9990", fontSize: 13 }}>{item.price}</span>}
    </Link>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#2C323E" }} />;
}
