"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Menu, X } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

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
  { label: "שותפות",           price: "+₪10k",   href: "/partnership" },
];

const ITEMS_GROUP4 = [{ label: "הכוורת 🐝",        href: "/hive" }];
const ITEMS_GROUP5 = [{ label: "האזור האישי שלי", href: "/account" }];

interface MobileNavProps {
  userInitial?: string | null;
}

export function MobileNav({ userInitial = null }: MobileNavProps) {
  const [open, setOpen]               = useState(false);
  const [accordionOpen, setAccordion] = useState(false);
  const [signingOut, setSigningOut]   = useState(false);
  const pathname                      = usePathname();
  const router                        = useRouter();
  const [isPending, startTransition]  = useTransition();
  const supabase                      = createBrowserClient();

  const handleCapsuleClick = () => {
    startTransition(() => { router.push("/account"); });
  };

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

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
          overflow: "hidden",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease",
          display: "flex",
          flexDirection: "column",
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
            flexShrink: 0,
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

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
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

          {/* Group 3 — מסלולים accordion */}
          <button
            onClick={() => setAccordion(o => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              direction: "rtl",
              padding: "14px 24px",
              background: "none",
              border: "none",
              borderBottom: "1px solid #2C323E",
              cursor: "pointer",
            }}
          >
            <span style={{ color: "#C9964A", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>
              מסלולים
            </span>
            <span
              style={{
                color: "#C9964A",
                fontSize: 12,
                display: "inline-block",
                transform: accordionOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              ▼
            </span>
          </button>

          {/* Accordion body */}
          <div
            style={{
              maxHeight: accordionOpen ? ITEMS_GROUP3.length * 56 : 0,
              overflow: "hidden",
              transition: "max-height 0.3s ease",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {ITEMS_GROUP3.map((item) => (
              <DrawerItem key={item.href} item={item} active={pathname === item.href} onClose={close} />
            ))}
          </div>

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

          {/* ── Sign-out capsule (logged-in only) ────────────── */}
          {userInitial && (
          <div style={{ padding: "16px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                direction: "rtl",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 100,
                padding: "10px 18px",
                background: "rgba(0,0,0,0.3)",
                transition: "background 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <span style={{ color: "#9E9990", fontSize: 13, fontWeight: 500 }}>
                {userInitial}
              </span>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  background: "none",
                  border: "none",
                  cursor: signingOut ? "default" : "pointer",
                  color: "#ef4444",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: signingOut ? 0.6 : 1,
                }}
              >
                {signingOut && (
                  <span style={{
                    width: 10, height: 10,
                    border: "1.5px solid rgba(239,68,68,0.3)",
                    borderTopColor: "#ef4444",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                )}
                התנתק
              </button>
            </div>
          </div>
          )}
        </div>
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
