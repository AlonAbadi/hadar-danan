// /en/hive — the English activation page for The Signal Hive ($149 one-time,
// product signal_hive_en_149). The English counterpart of /signal-hive: a
// short sales summary a lead reaches from the locked kaveret (/en/kaveret/i)
// or from the nurture emails. Replaced the old redirect-to-strategy stub.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EN_HIVE_PRICE_USD, EN_HIVE_ANCHOR_USD } from "@/lib/products";
import { HiveCTAEn } from "./HiveCTAEn";

export const metadata: Metadata = {
  title: "The Signal Hive · your signal, put to work",
  description:
    "You found your signal. The Signal Hive is the activation layer: your signal system, seven scripted episodes filmed in the broadcast room, your social texts and designed visual assets - all drawn from your answers. One payment.",
  alternates: { canonical: "/en/hive" },
};

const C = {
  bg: "#0D0C0A",
  card: "#161410",
  soft: "#1A1814",
  line: "rgba(242,237,228,0.10)",
  gold: "#C2973F",
  goldHi: "#E3BC6B",
  goldDeep: "#9A7526",
  fg: "#F2EDE4",
  mut: "rgba(242,237,228,0.55)",
  green: "#7FD49B",
};

const INSIDE = [
  {
    n: "0",
    title: "Your signal system",
    body: "Your signal, the pain it resolves, the promise, the audience and the positioning line - held in one place. The anchor everything else comes from.",
  },
  {
    n: "1",
    title: "Seven scripted episodes",
    body: "Seven scripts in your voice, filmed in the broadcast room with a teleprompter. The text runs at your pace, the director cuts and returns a reel.",
  },
  {
    n: "2",
    title: "Captions, burned in",
    body: "Every episode comes back with captions burned into the frame. Ready to post, nothing left to edit.",
  },
  {
    n: "3",
    title: "Your social texts",
    body: "Bio, about and manifesto - written from your signal, ready to paste wherever your audience meets you.",
  },
  {
    n: "4",
    title: "Designed visual assets",
    body: "Your signal cards in every format, designed and ready to share.",
  },
];

export default function EnHivePage() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "972539566961";
  return (
    <main
      dir="ltr"
      lang="en"
      style={{
        background: C.bg,
        color: C.fg,
        minHeight: "100vh",
        fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 22px 100px" }}>
        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0 0" }}>
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.mut }}>
            TrueSignal©
          </span>
        </div>

        {/* hero */}
        <div style={{ textAlign: "center", paddingTop: 52 }}>
          <div style={{ color: C.gold, fontSize: 12, letterSpacing: "0.24em", fontWeight: 700, textTransform: "uppercase", marginBottom: 18 }}>
            The Signal Hive
          </div>
          <h1 style={{ fontSize: "clamp(30px, 7vw, 40px)", lineHeight: 1.15, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
            You found your signal.
            <br />
            Now it goes to work.
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.7, color: C.mut, maxWidth: 520, margin: "0 auto" }}>
            Not another course. The activation layer that takes you from{" "}
            <b style={{ color: C.fg }}>knowing your signal</b> to{" "}
            <b style={{ color: C.fg }}>putting it out into the world</b> - everything inside is drawn from your
            answers, not from a template.
          </p>
        </div>

        {/* what's inside */}
        <h2 style={{ fontSize: 21, fontWeight: 800, margin: "52px 0 18px", textAlign: "center", letterSpacing: "-0.02em" }}>
          What is inside
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {INSIDE.map((f) => (
            <div
              key={f.n}
              style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}
            >
              <div
                style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: "rgba(194,151,63,0.1)", border: "1px solid rgba(194,151,63,0.3)", color: C.goldHi, fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {f.n}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 5, letterSpacing: "-0.01em" }}>{f.title}</div>
                <div style={{ fontSize: 14.5, color: C.mut, lineHeight: 1.65 }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* price + CTA */}
        <div style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 18, padding: "26px 24px", marginTop: 36 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div
              style={{ display: "inline-block", fontSize: 12, fontWeight: 800, color: C.green, background: "rgba(127,212,155,0.08)", border: "1px solid rgba(127,212,155,0.35)", borderRadius: 999, padding: "4px 14px", marginBottom: 10, letterSpacing: "0.04em" }}
            >
              40% off
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 18, color: C.mut, textDecoration: "line-through" }}>${EN_HIVE_ANCHOR_USD}</span>
              <span style={{ fontSize: 38, fontWeight: 800, color: C.goldHi }}>${EN_HIVE_PRICE_USD}</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: 13.5, color: C.fg, lineHeight: 1.9 }}>
              <li>
                <span style={{ color: C.green, marginRight: 6 }}>✔</span>Immediate access
              </li>
              <li>
                <span style={{ color: C.green, marginRight: 6 }}>✔</span>One payment, no subscription
              </li>
              <li>
                <span style={{ color: C.green, marginRight: 6 }}>✔</span>Yours for good
              </li>
            </ul>
          </div>
          <HiveCTAEn whatsappPhone={wa} />
          <div style={{ textAlign: "center", fontSize: 12.5, color: C.mut, marginTop: 18, lineHeight: 1.6, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
            Have not taken the diagnostic yet?{" "}
            <Link href="/en/signal" style={{ color: C.gold, textDecoration: "underline", textUnderlineOffset: 3 }}>
              Start there, free
            </Link>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 18, color: C.fg, lineHeight: 1.55, marginTop: 44, maxWidth: 460, marginLeft: "auto", marginRight: "auto", fontWeight: 700, letterSpacing: "-0.01em" }}>
          You found what only you bring.
          <br />
          <span style={{ color: C.goldHi }}>Now let the world meet it.</span>
        </p>

        {/* footer */}
        <footer style={{ marginTop: 56, paddingTop: 24, borderTop: `1px solid ${C.line}`, textAlign: "center", fontSize: 12, color: C.mut, lineHeight: 2 }}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/privacy" style={{ color: C.mut, textDecoration: "none" }}>Privacy policy</a>
            <a href="/terms" style={{ color: C.mut, textDecoration: "none" }}>Terms of use</a>
          </div>
          <p style={{ fontWeight: 600, marginTop: 6 }}>We do not create content. We build your signal. | TrueSignal©</p>
          <p>© 2026 Hadar Danan Ltd. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
