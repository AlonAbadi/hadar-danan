import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

const BEE = "/beegood_logo.png";
const WA  = "https://wa.me/972539566961?text=" + encodeURIComponent("Hi Hadar, I took the signal diagnostic and I'd like to book a strategy session.");

export const metadata: Metadata = {
  title: "Strategy Session · turn your signal into your position",
  description:
    "A 90-minute session, one on one with Hadar Danan. We take the signal from your diagnostic and build your positioning from it - who the client is, what the offer is, why you.",
  alternates: { canonical: "/en/strategy" },
  openGraph: {
    title: "Strategy Session · beegood",
    description: "90 minutes, one on one. Your signal, turned into the way the market positions you.",
    images: [{ url: "https://beegood.online/og-image.jpg", width: 1200, height: 630 }],
  },
};

const C = {
  bg:        "#0D0C0A",
  panel:     "#111009",
  card:      "#161410",
  cream:     "#F8F4EE",
  border:    "rgba(242,237,228,0.10)",
  borderHi:  "rgba(194,151,63,0.28)",
  gold:      "#C2973F",
  goldDeep:  "#9A7526",
  text:      "#F2EDE4",
  textSoft:  "rgba(242,237,228,0.78)",
  textMute:  "rgba(242,237,228,0.55)",
  ctaBg:     "#C2973F",
  ctaFg:     "#0D0C0A",
  inkOnCream: "#0D0C0A",
  creamMute: "#5C5549",
};

const STEPS = [
  { n: "01", t: "We start from your signal", d: "Not a blank page. We open with the differentiation your diagnostic already surfaced - the thing only you see." },
  { n: "02", t: "We build the positioning", d: "Who exactly is the client, what is the offer, and why you and not the ten others who do the same thing." },
  { n: "03", t: "You leave with one direction", d: "Not a deck. One clear, sharp direction you can act on the next morning - the message, the audience, the move." },
];

function Cta({ label }: { label: string }) {
  return (
    <a href={WA} target="_blank" rel="noopener noreferrer"
      style={{
        fontFamily: "var(--font-jakarta), sans-serif", fontSize: 15, fontWeight: 700,
        color: C.ctaFg, background: C.ctaBg, border: "none", borderRadius: 12,
        padding: "16px 34px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10,
      }}>
      {label} <span style={{ fontSize: 18 }}>→</span>
    </a>
  );
}

export default function EnStrategyPage() {
  return (
    <div style={{ fontFamily: "var(--font-jakarta), sans-serif", background: C.bg, color: C.text }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(13,12,10,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 4vw, 48px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
            <Image src={BEE} alt="beegood" width={50} height={40} style={{ width: "auto", height: 40, display: "block" }} />
            <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: C.text }}>beegood</span>
          </Link>
          <Link href="/en/signal" style={{ fontSize: 13, fontWeight: 600, color: C.text, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 999, padding: "9px 20px", textDecoration: "none", whiteSpace: "nowrap" }}>
            Take the diagnostic
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(72px, 12vh, 140px) clamp(20px, 4vw, 48px) clamp(56px, 9vh, 100px)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, background: "rgba(194,151,63,0.10)", border: `1px solid ${C.borderHi}`, borderRadius: 999, padding: "7px 14px", marginBottom: 40 }}>
          Strategy Session · 90 minutes · one on one
        </div>
        <h1 style={{ fontSize: "clamp(40px, 7vw, 88px)", fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.045em", margin: 0, color: C.text, maxWidth: "16ch" }}>
          Knowing your signal is the easy part.
        </h1>
        <p style={{ fontSize: "clamp(18px, 2.1vw, 23px)", fontWeight: 400, lineHeight: 1.55, color: C.textMute, maxWidth: "54ch", margin: "30px 0 40px" }}>
          Turning it into the way the market positions you is the hard part. In the strategy session we take the signal from your diagnostic and build your positioning from it - the client, the offer, and why you. One direction you can act on the next morning.
        </p>
        <Cta label="Book your session" />
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: C.cream, color: C.inkOnCream }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 48px)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.goldDeep, marginBottom: 36 }}>
            What happens in the room
          </div>
          <div style={{ display: "grid", gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "clamp(20px,4vw,52px)", padding: "30px 0", borderTop: `1px solid rgba(13,12,10,0.10)`, borderBottom: i === STEPS.length - 1 ? `1px solid rgba(13,12,10,0.10)` : undefined }}>
                <div style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, color: C.gold, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{s.n}</div>
                <div>
                  <h3 style={{ fontSize: "clamp(20px,2.4vw,26px)", fontWeight: 700, margin: "0 0 8px", color: C.inkOnCream, letterSpacing: "-0.02em" }}>{s.t}</h3>
                  <p style={{ fontSize: "clamp(15px,1.7vw,17px)", lineHeight: 1.65, color: C.creamMute, margin: 0, maxWidth: "52ch" }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEE + FINAL CTA */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(72px, 11vw, 130px) clamp(20px, 4vw, 48px)", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gold, marginBottom: 18 }}>
          No risk
        </div>
        <h2 style={{ fontSize: "clamp(28px, 4.4vw, 48px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", margin: "0 0 22px", color: C.text }}>
          If we don&apos;t crack it in the first session, the next one is on me.
        </h2>
        <p style={{ fontSize: "clamp(16px,1.9vw,19px)", lineHeight: 1.6, color: C.textMute, maxWidth: "50ch", margin: "0 auto 40px" }}>
          This is not a lecture or a template. It is work on your business, from the signal you already have. Bring your diagnostic - we start there.
        </p>
        <Cta label="Book your session" />
        <p style={{ fontSize: 13, color: C.textMute, marginTop: 22 }}>
          Don&apos;t have your signal yet? <Link href="/en/signal" style={{ color: C.gold, textDecoration: "none" }}>Take the 5-minute diagnostic →</Link>
        </p>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px clamp(20px,4vw,48px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <Image src={BEE} alt="beegood" width={40} height={32} style={{ width: "auto", height: 32 }} />
            <span style={{ fontSize: 18, color: C.textMute }}>beegood</span>
          </Link>
          <span style={{ fontSize: 12, color: C.textMute }}>We don&apos;t make content. We build your signal. · TrueSignal©</span>
        </div>
      </footer>
    </div>
  );
}
