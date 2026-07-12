// English purchase-success client for The Signal Hive. Mirrors the tracking
// pattern of components/SuccessPage (which is Hebrew/ILS-hardcoded): a
// sessionStorage guard, browser Purchase pixels in USD, and the server-side
// CAPI mirror. Reads ?oid= via window.location to avoid the useSearchParams
// suspense requirement.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackPurchase, trackProductPurchase, PRODUCT_CUSTOM_EVENT } from "@/lib/analytics";
import { getSessionUser } from "@/lib/quiz-session";
import { EN_HIVE_PRICE_USD } from "@/lib/products";

const PRODUCT = "signal_hive_en_149";

const C = {
  bg: "#0D0C0A",
  card: "#161410",
  line: "rgba(242,237,228,0.10)",
  gold: "#C2973F",
  goldHi: "#E3BC6B",
  fg: "#F2EDE4",
  mut: "rgba(242,237,228,0.55)",
  green: "#7FD49B",
};

export function SuccessEnClient({ whatsappPhone }: { whatsappPhone: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // sessionStorage guard prevents re-firing on page refresh
    const key = `purchase_fired_${PRODUCT}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const eventId = new URLSearchParams(window.location.search).get("oid") ?? undefined;
    trackPurchase(PRODUCT, EN_HIVE_PRICE_USD, "USD", eventId);
    trackProductPurchase(PRODUCT, EN_HIVE_PRICE_USD, "USD", eventId);
    // CAPI — server-side purchase event for iOS/Safari attribution
    const user = getSessionUser();
    fetch("/api/meta-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "Purchase",
        productEventName: PRODUCT_CUSTOM_EVENT[PRODUCT],
        eventId,
        email: user?.email,
        phone: user?.phone,
        firstName: user?.name?.split(" ")[0],
        lastName: user?.name?.split(" ").slice(1).join(" ") || undefined,
        userId: user?.userId,
        contentName: PRODUCT,
        value: EN_HIVE_PRICE_USD,
        currency: "USD",
      }),
    }).catch(() => {});
  }, []);

  return (
    <main
      dir="ltr"
      lang="en"
      style={{
        background: C.bg,
        color: C.fg,
        minHeight: "100vh",
        fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 22px 80px", width: "100%" }}>
        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "22px 0 0" }}>
          <Link
            href="/en"
            style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", color: C.fg, fontSize: 19, fontWeight: 500, letterSpacing: "-0.02em" }}
          >
            <Image
              src="/beegood_logo.png"
              alt="beegood"
              width={40}
              height={32}
              style={{ width: "auto", height: 32, display: "block" }}
            />
            beegood
          </Link>
        </div>

        <div
          style={{
            textAlign: "center",
            paddingTop: 72,
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(10px)",
            transition: "opacity .5s ease, transform .5s ease",
          }}
        >
          <div
            style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(127,212,155,0.1)", border: "1.5px solid rgba(127,212,155,0.45)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div style={{ color: C.gold, fontSize: 12, letterSpacing: "0.24em", fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>
            The Signal Hive
          </div>
          <h1 style={{ fontSize: "clamp(30px, 7vw, 38px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 14px" }}>
            You&apos;re in.
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.7, color: C.mut, maxWidth: 400, margin: "0 auto" }}>
            Check your email - your entrance link is on its way. Everything inside was made from your signal, and it
            is waiting for you.
          </p>

          <Link
            href="/en/kaveret"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: 340,
              margin: "32px auto 0",
              minHeight: 54,
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 800,
              color: "#171204",
              background: "linear-gradient(180deg, #DFB662 0%, #C2973F 55%, #A87F2F 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 18px rgba(194,151,63,0.25)",
            }}
          >
            Open the Hive
          </Link>

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", marginTop: 36, textAlign: "left" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.goldHi, fontWeight: 700, marginBottom: 8 }}>
              What happens now
            </div>
            <div style={{ fontSize: 14, color: C.mut, lineHeight: 1.75 }}>
              Your entrance email arrives within a few minutes. If it does not, check your spam folder - or write to
              us and a human will let you in.
            </div>
          </div>

          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noopener"
            style={{ display: "inline-block", marginTop: 20, fontSize: 13.5, fontWeight: 600, color: C.gold, textDecoration: "none", borderBottom: `1px solid rgba(194,151,63,0.4)`, paddingBottom: 2 }}
          >
            Talk to us on WhatsApp
          </a>
        </div>
      </div>

      <footer style={{ marginTop: "auto", borderTop: `1px solid ${C.line}`, textAlign: "center", fontSize: 12, color: C.mut, padding: "20px 22px 28px", lineHeight: 2 }}>
        <p style={{ fontWeight: 600, margin: 0 }}>We do not create content. We build your signal. | TrueSignal©</p>
        <p style={{ margin: 0 }}>© 2026 Hadar Danan Ltd. All rights reserved.</p>
      </footer>
    </main>
  );
}
