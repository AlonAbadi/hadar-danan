import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { NotifyForm } from "./NotifyForm";

const BEE = "/beegood_logo.png";

export const metadata: Metadata = {
  title: "BeeGood OS · the execution engine for personal brands",
  description:
    "Layer 02, 03, 04. Your signal translated into business architecture, content intelligence, and the OS that tells you what matters most, next.",
  alternates: { canonical: "/en/os" },
  openGraph: {
    title: "BeeGood OS · beegood",
    description: "The execution engine for personal brands. Built on your signal.",
    images: [{ url: "https://beegood.online/og-image.jpg", width: 1200, height: 630 }],
  },
};

// Business OS palette
const C = {
  bg:        "#0D0C0A",
  panel:     "#111009",
  card:      "#161410",
  cardSoft:  "#1A1814",
  cream:     "#F8F4EE",
  border:    "rgba(242,237,228,0.10)",
  borderHi:  "rgba(194,151,63,0.28)",
  gold:      "#C2973F",
  goldDeep:  "#9A7526",
  text:      "#F2EDE4",
  textSoft:  "rgba(242,237,228,0.78)",
  textMute:  "rgba(242,237,228,0.55)",
  textFaint: "rgba(242,237,228,0.36)",
  textDim:   "rgba(242,237,228,0.28)",
  ctaBg:     "#C2973F",
  ctaFg:     "#0D0C0A",
  inkOnCream: "#0D0C0A",
  creamMute: "#5C5549",
};

export default function EnOsPage() {
  return (
    <div style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(13,12,10,0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth:       1200,
            margin:         "0 auto",
            padding:        "0 clamp(20px, 4vw, 48px)",
            height:         64,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            16,
          }}
        >
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
            <Image
              src={BEE}
              alt="beegood"
              width={50}
              height={40}
              style={{ width: "auto", height: 40, display: "block" }}
            />
            <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: C.text }}>
              beegood
            </span>
          </Link>
          <Link
            href="/en/signal"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.text,
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: "9px 20px",
              cursor: "pointer",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Take the diagnostic
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: 1100,
          margin:   "0 auto",
          padding:  "clamp(72px, 12vh, 140px) clamp(20px, 4vw, 48px) clamp(56px, 9vh, 100px)",
        }}
      >
        <div
          style={{
            display:       "inline-flex",
            alignItems:    "center",
            gap:           8,
            fontSize:      11.5,
            fontWeight:    700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         C.gold,
            background:    "rgba(194,151,63,0.10)",
            border:        `1px solid ${C.borderHi}`,
            borderRadius:  999,
            padding:       "7px 14px",
            marginBottom:  40,
          }}
        >
          Layers 02 · 03 · 04
        </div>
        <h1
          style={{
            fontSize:      "clamp(44px, 8vw, 100px)",
            fontWeight:    800,
            lineHeight:    0.96,
            letterSpacing: "-0.045em",
            margin:        0,
            color:         C.text,
            maxWidth:      "14ch",
          }}
        >
          BeeGood <span style={{ color: C.gold }}>OS</span>.
        </h1>
        <p
          style={{
            fontSize:    "clamp(18px, 2.1vw, 23px)",
            fontWeight:  400,
            lineHeight:  1.55,
            color:       C.textMute,
            maxWidth:    "54ch",
            margin:      "30px 0 0",
          }}
        >
          Your signal is yours, forever. The OS is what turns the signal into a business, the architecture, the content, and the execution engine that keeps answering one question: what matters most, next.
        </p>
      </section>

      {/* THREE LAYERS */}
      <section style={{ background: C.cream, color: C.inkOnCream }}>
        <div
          style={{
            maxWidth: 1200,
            margin:   "0 auto",
            padding:  "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 48px)",
          }}
        >
          <div
            style={{
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         C.goldDeep,
              marginBottom:  16,
            }}
          >
            What lives inside
          </div>
          <h2
            style={{
              fontSize:      "clamp(30px, 4.4vw, 54px)",
              fontWeight:    700,
              lineHeight:    1.06,
              letterSpacing: "-0.038em",
              color:         C.inkOnCream,
              margin:        "0 0 56px",
              maxWidth:      "24ch",
            }}
          >
            Three layers, on top of your signal.
          </h2>
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap:                 2,
              background:          "rgba(13,12,10,0.08)",
              borderRadius:        24,
              overflow:            "hidden",
            }}
          >
            {LAYERS.map((l) => (
              <div key={l.num} style={{ background: "#FFFFFF", padding: "40px 30px" }}>
                <div
                  style={{
                    fontSize:      36,
                    fontWeight:    800,
                    letterSpacing: "-0.02em",
                    color:         C.inkOnCream,
                    opacity:       0.18,
                    marginBottom:  20,
                  }}
                >
                  {l.num}
                </div>
                <div
                  style={{
                    fontSize:      11,
                    fontWeight:    700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color:         C.goldDeep,
                    marginBottom:  12,
                  }}
                >
                  Layer {l.num}
                </div>
                <div
                  style={{
                    fontSize:      22,
                    fontWeight:    700,
                    letterSpacing: "-0.025em",
                    lineHeight:    1.2,
                    color:         C.inkOnCream,
                    marginBottom:  14,
                  }}
                >
                  {l.title}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: C.creamMute, margin: 0 }}>
                  {l.body}
                </p>
                <ul style={{ margin: "20px 0 0", padding: 0, listStyle: "none" }}>
                  {l.items.map((it, i) => (
                    <li
                      key={i}
                      style={{
                        padding:      "12px 0",
                        borderTop:    i === 0 ? "1px solid rgba(13,12,10,0.08)" : undefined,
                        borderBottom: "1px solid rgba(13,12,10,0.08)",
                        fontSize:     14.5,
                        lineHeight:   1.5,
                        color:        C.creamMute,
                      }}
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NORTH STAR / MONTHLY RHYTHM */}
      <section style={{ background: C.bg, padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 48px)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div
            style={{
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         C.textDim,
              marginBottom:  16,
            }}
          >
            The monthly rhythm
          </div>
          <h2
            style={{
              fontSize:      "clamp(28px, 4.4vw, 48px)",
              fontWeight:    700,
              lineHeight:    1.08,
              letterSpacing: "-0.035em",
              margin:        "0 0 44px",
              color:         C.text,
            }}
          >
            One signal. Two drops a month.
          </h2>

          {RHYTHM.map((r, i) => (
            <div
              key={r.when}
              style={{
                padding:    "26px 0",
                borderTop:  `1px solid ${C.border}`,
                borderBottom: i === RHYTHM.length - 1 ? `1px solid ${C.border}` : undefined,
                display:    "grid",
                gridTemplateColumns: "minmax(120px, 180px) 1fr",
                gap:        24,
                alignItems: "baseline",
              }}
            >
              <div
                style={{
                  fontSize:      11.5,
                  fontWeight:    700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color:         C.gold,
                }}
              >
                {r.when}
              </div>
              <div>
                <div
                  style={{
                    fontSize:      "clamp(19px, 2.4vw, 23px)",
                    fontWeight:    600,
                    lineHeight:    1.35,
                    letterSpacing: "-0.02em",
                    color:         C.text,
                  }}
                >
                  {r.title}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: C.textMute, marginTop: 8 }}>
                  {r.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background: C.bg, padding: "0 clamp(20px, 4vw, 48px) clamp(72px, 11vw, 120px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              background:   C.panel,
              border:       `1px solid ${C.border}`,
              borderRadius: 20,
              padding:      "clamp(40px, 6vw, 64px)",
              boxShadow:    "0 1px 0 rgba(0,0,0,0.3), 0 30px 60px -46px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color:         C.gold,
                marginBottom:  20,
              }}
            >
              Membership · one tier, everything inside
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
              <div
                style={{
                  fontSize:      "clamp(56px, 8vw, 92px)",
                  fontWeight:    800,
                  letterSpacing: "-0.045em",
                  lineHeight:    1,
                  color:         C.text,
                }}
              >
                $79
              </div>
              <div style={{ fontSize: 20, fontStyle: "italic", color: C.textMute }}>
                / month · cancel anytime
              </div>
            </div>

            <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none" }}>
              {INCLUDED.map((line, i) => (
                <li
                  key={i}
                  style={{
                    padding:      "14px 0",
                    borderTop:    i === 0 ? `1px solid ${C.border}` : undefined,
                    borderBottom: `1px solid ${C.border}`,
                    display:      "flex",
                    alignItems:   "baseline",
                    gap:          14,
                    fontSize:     15.5,
                    lineHeight:   1.55,
                    color:        C.text,
                  }}
                >
                  <span style={{ color: C.gold, fontWeight: 700, flexShrink: 0 }}>·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <NotifyForm />

            <p
              style={{
                fontSize:      11.5,
                letterSpacing: "0.06em",
                color:         C.textFaint,
                margin:        "22px 0 0",
                lineHeight:    1.55,
              }}
            >
              14-day refund window · billed monthly via Stripe · no annual contract
            </p>
          </div>
        </div>
      </section>

      {/* FOUNDERS QUOTE */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(64px, 10vw, 120px) clamp(20px, 4vw, 48px)", textAlign: "center" }}>
        <div style={{ width: 34, height: 1, background: C.gold, margin: "0 auto 36px" }} />
        <p
          style={{
            fontSize:      "clamp(22px, 3vw, 32px)",
            fontWeight:    500,
            fontStyle:     "italic",
            lineHeight:    1.4,
            letterSpacing: "-0.022em",
            color:         C.text,
            margin:        "0 auto",
            maxWidth:      "34ch",
          }}
        >
          “We do not sell the signal back to you. We carry it. Every month, the work of carrying it farther is what you pay for.”
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <Image
            src={BEE}
            alt=""
            width={50}
            height={40}
            style={{ width: "auto", height: 40, display: "block" }}
          />
        </div>
        <div style={{ fontSize: 18, color: C.text, marginTop: 14, fontWeight: 600 }}>
          Hadar Danan &amp; Alon Abadi
        </div>
        <div style={{ fontSize: 12, letterSpacing: "0.06em", color: C.textFaint, marginTop: 6 }}>
          Founders of beegood · Creators of the TrueSignal© method
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: C.panel, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(72px, 11vw, 110px) clamp(20px, 4vw, 48px)" }}>
          <div
            style={{
              fontSize:      12.5,
              fontWeight:    700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color:         C.gold,
              marginBottom:  18,
            }}
          >
            Questions, before you decide
          </div>
          <h2
            style={{
              fontSize:      "clamp(28px, 4vw, 40px)",
              fontWeight:    700,
              lineHeight:    1.1,
              letterSpacing: "-0.03em",
              margin:        "0 0 36px",
              color:         C.text,
            }}
          >
            What people ask first.
          </h2>

          {FAQ.map((q, i) => (
            <div
              key={i}
              style={{
                padding:      "24px 0",
                borderTop:    `1px solid ${C.border}`,
                borderBottom: i === FAQ.length - 1 ? `1px solid ${C.border}` : undefined,
              }}
            >
              <div
                style={{
                  fontSize:      18,
                  fontWeight:    700,
                  letterSpacing: "-0.01em",
                  color:         C.text,
                  marginBottom:  10,
                }}
              >
                {q.q}
              </div>
              <div style={{ fontSize: 15.5, lineHeight: 1.65, color: C.textMute }}>
                {q.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CLOSING CTA */}
      <section style={{ background: C.bg }}>
        <div
          style={{
            maxWidth: 720,
            margin:   "0 auto",
            padding:  "clamp(80px, 12vw, 130px) clamp(20px, 4vw, 48px)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize:      "clamp(28px, 4vw, 44px)",
              fontWeight:    800,
              lineHeight:    1.1,
              letterSpacing: "-0.035em",
              color:         C.text,
              margin:        "0 0 32px",
              maxWidth:      "26ch",
              marginLeft:    "auto",
              marginRight:   "auto",
            }}
          >
            The OS opens soon. Leave your email and we will tell you first.
          </h2>
          <NotifyForm centered />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}>
        <div
          style={{
            maxWidth: 1200,
            margin:   "0 auto",
            padding:  "36px clamp(20px, 4vw, 48px) 52px",
            display:  "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap:      20,
            flexWrap: "wrap",
          }}
        >
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <Image
              src={BEE}
              alt=""
              width={36}
              height={28}
              style={{ width: "auto", height: 28, display: "block" }}
            />
            <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.015em", color: C.text }}>
              beegood
            </span>
          </Link>
          <span style={{ fontSize: 13, color: C.textDim }}>
            Business OS for Personal Brands · TrueSignal© Method
          </span>
          <span
            style={{
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color:         C.textDim,
            }}
          >
            Tel Aviv · New York · London · Tokyo · São Paulo
          </span>
        </div>
      </footer>
    </div>
  );
}

const LAYERS = [
  {
    num: "02",
    title: "Business Architecture",
    body: "Signal alone has no business value until translated. The shape of the offer, model, and funnel, drawn around who you are.",
    items: [
      "Offer architecture from the signal",
      "Pricing tied to differentiation",
      "Funnel that fits your voice",
    ],
  },
  {
    num: "03",
    title: "Content Intelligence",
    body: "The hooks, themes, and voice that carry your signal to the people who need it.",
    items: [
      "30 post hooks for LinkedIn, X, IG monthly",
      "8 quote cards designed from the signal",
      "Video scripts and narrative structures",
      "Bios for major platforms",
    ],
  },
  {
    num: "04",
    title: "BeeGood OS",
    body: "The execution engine. Unified data, AI decision intelligence, CRM, automations.",
    items: [
      "Always answers: what matters most, next",
      "Unified pipeline across channels",
      "Monthly founder lessons",
      "Full library kept inside",
    ],
  },
] as const;

const RHYTHM = [
  {
    when: "Day 1",
    title: "A fresh kit lands in your dashboard.",
    body:  "Generated from your signal that morning. Yours to download, post, edit, ignore - yours.",
  },
  {
    when: "Day 15",
    title: "A new founder lesson is published.",
    body:  "Hadar and Alon, on one specific way to carry your signal into the world this month.",
  },
  {
    when: "Anytime",
    title: "The signal lives at the centre.",
    body:  "Open it, re-read it, copy from it. Everything you receive is drawn from this one place.",
  },
] as const;

const INCLUDED = [
  "All three layers (02, 03, 04) on top of your signal",
  "Monthly creative kit drawn from your signal",
  "Monthly founder lesson from Hadar and Alon",
  "Full library of past months kept inside",
  "Your signal kept alive, returnable any time",
  "Cancel anytime · 14-day refund window",
] as const;

const FAQ = [
  {
    q: "Do I need to take the diagnostic first?",
    a: "Yes. Layer 01 (the signal) is the input the entire OS draws from. If you have not taken the five questions yet, you can do that free at /en/signal.",
  },
  {
    q: "What happens to my work if I cancel?",
    a: "Past kits you already received are yours to keep. You stop receiving new monthly drops at the end of the current cycle.",
  },
  {
    q: "Refunds?",
    a: "Within 14 days of the first charge, full refund, no questions. After that, cancel anytime and you are not charged again.",
  },
  {
    q: "Is everything in English?",
    a: "Yes. The OS (English) is for global members. If you read and write in Hebrew, the Israel edition is what you want, same brand, same method.",
  },
  {
    q: "When does it open?",
    a: "When checkout is wired and the first kit is ready. Leave your email above, you will be the first to know, and the first cohort is small on purpose.",
  },
] as const;
