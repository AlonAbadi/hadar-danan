import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { NotifyForm } from "./NotifyForm";

const BEE = "/beegood_logo.png";

export const metadata: Metadata = {
  title: "The Hive · beegood",
  description:
    "Your signal becomes a body of work. A monthly creative kit drawn from your signal, a new lesson from Hadar and Alon, and a quiet place to keep building.",
  alternates: { canonical: "/en/hive" },
  openGraph: {
    title: "The Hive · beegood",
    description: "Where your signal becomes a body of work.",
    images: [{ url: "https://beegood.online/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function EnHivePage() {
  return (
    <>
      {/* Header */}
      <header
        style={{
          maxWidth:       1200,
          margin:         "0 auto",
          padding:        "40px clamp(20px, 4vw, 40px) 32px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            16,
        }}
      >
        <Link
          href="/en"
          style={{ display: "flex", alignItems: "center", gap: 16, textDecoration: "none", color: "#0F1011" }}
        >
          <Image
            src={BEE}
            alt="beegood"
            width={50}
            height={40}
            style={{ width: "auto", height: 40, display: "block" }}
          />
          <span
            style={{
              fontFamily:    "var(--font-space-grotesk), sans-serif",
              fontSize:      24,
              fontWeight:    400,
              letterSpacing: "-0.02em",
            }}
          >
            beegood
          </span>
        </Link>
        <Link
          href="/en/signal"
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      13,
            fontWeight:    600,
            letterSpacing: "0.01em",
            color:         "#0F1011",
            background:    "none",
            border:        "1px solid rgba(15,16,17,0.16)",
            borderRadius:  999,
            padding:       "9px 18px",
            textDecoration: "none",
          }}
        >
          Take the diagnostic
        </Link>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth:  1000,
          margin:    "0 auto",
          padding:   "clamp(48px, 9vh, 104px) clamp(20px, 4vw, 40px) clamp(40px, 7vh, 80px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      13,
            fontWeight:    600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         "#9A7526",
            marginBottom:  28,
          }}
        >
          The Hive — beegood
        </div>
        <h1
          style={{
            fontFamily:    "var(--font-space-grotesk), sans-serif",
            fontWeight:    700,
            fontSize:      "clamp(42px, 7vw, 92px)",
            lineHeight:    0.98,
            letterSpacing: "-0.045em",
            margin:        0,
            color:         "#0F1011",
          }}
        >
          Your signal becomes<br />a <span style={{ color: "#9A7526" }}>body</span> of work.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize:   "clamp(18px, 2.1vw, 22px)",
            lineHeight: 1.55,
            color:      "#54565A",
            maxWidth:   "58ch",
            margin:     "30px auto 0",
          }}
        >
          Each month: a fresh creative kit drawn from your signal, a new lesson from Hadar and Alon, and a quiet place to keep building. The signal is yours forever — the work of making it reach people is what we build together.
        </p>
      </section>

      {/* Three pillars */}
      <section
        style={{
          maxWidth: 1100,
          margin:   "0 auto",
          padding:  "clamp(56px, 9vw, 96px) clamp(20px, 4vw, 40px)",
        }}
      >
        <div
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      12.5,
            fontWeight:    600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         "#9A7526",
            marginBottom:  18,
          }}
        >
          What lives inside
        </div>
        <h2
          style={{
            fontFamily:    "var(--font-space-grotesk), sans-serif",
            fontWeight:    700,
            fontSize:      "clamp(30px, 4.2vw, 48px)",
            lineHeight:    1.04,
            letterSpacing: "-0.04em",
            margin:        "0 0 48px",
            color:         "#0F1011",
            maxWidth:      "24ch",
          }}
        >
          Three rooms in the Hive, one signal at the center.
        </h2>
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:                 24,
          }}
        >
          {PILLARS.map((p) => (
            <div
              key={p.n}
              style={{
                background: "#FFFFFF",
                border:     "1px solid rgba(15,16,17,0.09)",
                borderRadius: 18,
                padding:    32,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-spectral), Georgia, serif",
                  fontStyle:  "italic",
                  fontSize:   24,
                  color:      "#9A7526",
                  marginBottom: 18,
                  letterSpacing: "0.02em",
                }}
              >
                {p.n}
              </div>
              <div
                style={{
                  fontFamily:    "var(--font-space-grotesk), sans-serif",
                  fontSize:      22,
                  fontWeight:    500,
                  letterSpacing: "-0.02em",
                  lineHeight:    1.22,
                  color:         "#0F1011",
                  marginBottom:  16,
                }}
              >
                {p.title}
              </div>
              <ul
                style={{
                  margin:     0,
                  padding:    0,
                  listStyle:  "none",
                  fontFamily: "var(--font-hanken-grotesk), sans-serif",
                  fontSize:   15,
                  lineHeight: 1.65,
                  color:      "#54565A",
                }}
              >
                {p.items.map((it, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "10px 0",
                      borderTop: i === 0 ? "1px solid rgba(15,16,17,0.08)" : undefined,
                      borderBottom: "1px solid rgba(15,16,17,0.08)",
                    }}
                  >
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Monthly rhythm */}
      <section style={{ background: "#F4EFE4" }}>
        <div
          style={{
            maxWidth: 880,
            margin:   "0 auto",
            padding:  "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 40px)",
          }}
        >
          <div
            style={{
              fontFamily:    "var(--font-hanken-grotesk), sans-serif",
              fontSize:      12.5,
              fontWeight:    600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color:         "#9A7526",
              marginBottom:  18,
            }}
          >
            The monthly rhythm
          </div>
          <h2
            style={{
              fontFamily:    "var(--font-space-grotesk), sans-serif",
              fontWeight:    600,
              fontSize:      "clamp(28px, 4.2vw, 44px)",
              lineHeight:    1.1,
              letterSpacing: "-0.035em",
              margin:        "0 0 40px",
              color:         "#211B12",
            }}
          >
            One signal. Two drops a month.
          </h2>

          {RHYTHM.map((r, i) => (
            <div
              key={r.when}
              style={{
                padding:    "26px 0",
                borderTop:  "1px solid rgba(33,27,18,0.10)",
                borderBottom: i === RHYTHM.length - 1 ? "1px solid rgba(33,27,18,0.10)" : undefined,
                display:    "grid",
                gridTemplateColumns: "minmax(120px, 180px) 1fr",
                gap:        24,
                alignItems: "baseline",
              }}
            >
              <div
                style={{
                  fontFamily:    "var(--font-hanken-grotesk), sans-serif",
                  fontSize:      11.5,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color:         "#6F521A",
                }}
              >
                {r.when}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-spectral), Georgia, serif",
                    fontStyle:  "italic",
                    fontSize:   "clamp(20px, 2.4vw, 24px)",
                    lineHeight: 1.4,
                    color:      "#211B12",
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-hanken-grotesk), sans-serif",
                    fontSize:   15,
                    lineHeight: 1.6,
                    color:      "#594F41",
                    marginTop:  8,
                  }}
                >
                  {r.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing card */}
      <section
        style={{
          maxWidth: 760,
          margin:   "0 auto",
          padding:  "clamp(80px, 12vw, 120px) clamp(20px, 4vw, 40px)",
        }}
      >
        <div
          style={{
            background:   "#FCFAF3",
            border:       "1px solid rgba(33,27,18,0.10)",
            borderRadius: 8,
            padding:      "clamp(40px, 6vw, 64px)",
            boxShadow:    "0 1px 0 rgba(26,23,18,0.03), 0 30px 60px -46px rgba(26,23,18,0.30)",
          }}
        >
          <div
            style={{
              fontFamily:    "var(--font-hanken-grotesk), sans-serif",
              fontSize:      11.5,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color:         "#6F521A",
              marginBottom:  20,
            }}
          >
            Membership · one tier, everything inside
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
            <div
              style={{
                fontFamily:    "var(--font-space-grotesk), sans-serif",
                fontSize:      "clamp(56px, 8vw, 92px)",
                fontWeight:    700,
                letterSpacing: "-0.045em",
                lineHeight:    1,
                color:         "#211B12",
              }}
            >
              $79
            </div>
            <div
              style={{
                fontFamily: "var(--font-spectral), Georgia, serif",
                fontStyle:  "italic",
                fontSize:   20,
                color:      "#594F41",
              }}
            >
              / month · cancel anytime
            </div>
          </div>

          <ul
            style={{
              margin:     "0 0 28px",
              padding:    0,
              listStyle:  "none",
            }}
          >
            {INCLUDED.map((line, i) => (
              <li
                key={i}
                style={{
                  padding:      "14px 0",
                  borderTop:    i === 0 ? "1px solid rgba(33,27,18,0.08)" : undefined,
                  borderBottom: "1px solid rgba(33,27,18,0.08)",
                  display:      "flex",
                  alignItems:   "baseline",
                  gap:          14,
                  fontFamily:   "var(--font-hanken-grotesk), sans-serif",
                  fontSize:     15.5,
                  lineHeight:   1.55,
                  color:        "#211B12",
                }}
              >
                <span style={{ color: "#9A7526", fontWeight: 700, flexShrink: 0 }}>·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <NotifyForm />

          <p
            style={{
              fontFamily:    "var(--font-hanken-grotesk), sans-serif",
              fontSize:      11.5,
              letterSpacing: "0.06em",
              color:         "#988D7B",
              margin:        "22px 0 0",
              lineHeight:    1.55,
            }}
          >
            14-day refund window · billed monthly via Stripe · no annual contract
          </p>
        </div>
      </section>

      {/* Founders quote */}
      <section
        style={{
          maxWidth: 760,
          margin:   "0 auto",
          padding:  "clamp(64px, 10vw, 120px) clamp(20px, 4vw, 40px)",
          textAlign: "center",
        }}
      >
        <div style={{ width: 34, height: 1, background: "#BE9540", margin: "0 auto 36px" }} />
        <p
          style={{
            fontFamily:    "var(--font-spectral), Georgia, serif",
            fontStyle:     "italic",
            fontWeight:    400,
            fontSize:      "clamp(22px, 3.2vw, 32px)",
            lineHeight:    1.4,
            letterSpacing: "-0.01em",
            color:         "#211B12",
            margin:        "0 auto",
            maxWidth:      "34ch",
          }}
        >
          “We do not sell the signal back to you. We carry it. Every month, the work of carrying it farther is what you pay for.”
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
          <Image
            src={BEE}
            alt=""
            width={36}
            height={28}
            style={{ width: "auto", height: 28, display: "block" }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-spectral), Georgia, serif",
            fontSize:   18,
            color:      "#211B12",
            marginTop:  14,
          }}
        >
          Hadar Danan &amp; Alon Abadi
        </div>
        <div
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      12,
            letterSpacing: "0.06em",
            color:         "#988D7B",
            marginTop:     6,
          }}
        >
          Founders of beegood · Creators of the TrueSignal© method
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          background: "#FBFBF9",
          borderTop:  "1px solid rgba(15,16,17,0.06)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(72px, 11vw, 110px) clamp(20px, 4vw, 40px)" }}>
          <div
            style={{
              fontFamily:    "var(--font-hanken-grotesk), sans-serif",
              fontSize:      12.5,
              fontWeight:    600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color:         "#9A7526",
              marginBottom:  18,
            }}
          >
            Questions, before you decide
          </div>
          <h2
            style={{
              fontFamily:    "var(--font-space-grotesk), sans-serif",
              fontWeight:    600,
              fontSize:      "clamp(28px, 4vw, 40px)",
              lineHeight:    1.1,
              letterSpacing: "-0.03em",
              margin:        "0 0 36px",
              color:         "#0F1011",
            }}
          >
            What people ask first.
          </h2>

          {FAQ.map((q, i) => (
            <div
              key={i}
              style={{
                padding:      "24px 0",
                borderTop:    "1px solid rgba(15,16,17,0.08)",
                borderBottom: i === FAQ.length - 1 ? "1px solid rgba(15,16,17,0.08)" : undefined,
              }}
            >
              <div
                style={{
                  fontFamily:    "var(--font-space-grotesk), sans-serif",
                  fontSize:      18,
                  fontWeight:    600,
                  letterSpacing: "-0.01em",
                  color:         "#0F1011",
                  marginBottom:  10,
                }}
              >
                {q.q}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-hanken-grotesk), sans-serif",
                  fontSize:   15.5,
                  lineHeight: 1.65,
                  color:      "#54565A",
                }}
              >
                {q.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ background: "#EBE3D2" }}>
        <div
          style={{
            maxWidth: 720,
            margin:   "0 auto",
            padding:  "clamp(80px, 12vw, 120px) clamp(20px, 4vw, 40px)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily:    "var(--font-spectral), Georgia, serif",
              fontStyle:     "italic",
              fontWeight:    400,
              fontSize:      "clamp(26px, 3.6vw, 38px)",
              lineHeight:    1.3,
              letterSpacing: "-0.02em",
              color:         "#211B12",
              margin:        "0 0 32px",
              maxWidth:      "28ch",
              marginLeft:    "auto",
              marginRight:   "auto",
            }}
          >
            The Hive opens soon. Leave your email and we will tell you first.
          </h2>
          <NotifyForm centered />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(15,16,17,0.08)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin:   "0 auto",
            padding:  "36px clamp(20px, 4vw, 40px) 28px",
            display:  "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap:      16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image
              src={BEE}
              alt=""
              width={25}
              height={20}
              style={{ width: "auto", height: 20, display: "block" }}
            />
            <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 15, fontWeight: 400, letterSpacing: "-0.015em", color: "#0F1011" }}>
              beegood
            </span>
          </div>
          <div style={{ textAlign: "right", maxWidth: "60ch" }}>
            <div style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 13, color: "#54565A" }}>
              The TrueSignal© Method · Wherever you are, in every language
            </div>
            <div
              style={{
                fontFamily: "var(--font-spectral), Georgia, serif",
                fontStyle:  "italic",
                fontSize:   13,
                color:      "#988D7B",
                marginTop:  6,
              }}
            >
              Tel Aviv · New York · London · Tokyo · São Paulo — a signal, everywhere
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

const PILLARS = [
  {
    n: "i",
    title: "The creative kit",
    items: [
      "30 post hooks for LinkedIn, X, IG",
      "8 quote cards designed from your signal (PNG)",
      "Bios for LinkedIn, IG, X, WhatsApp",
      "Manifesto — a long-form positioning piece",
      "5 email subject lines",
    ],
  },
  {
    n: "ii",
    title: "The video studio",
    items: [
      "Hook ideas for 15, 30, 60-second video opens",
      "Scripts in your voice for Reels and shorts",
      "Narrative structures for a body of work",
      "Shot list + b-roll suggestions",
    ],
  },
  {
    n: "iii",
    title: "The course, monthly",
    items: [
      "A new lesson every month, from Hadar and Alon",
      "On using your signal in the world",
      "Voice, video, written — whichever the lesson asks for",
      "Library grows as you stay",
    ],
  },
] as const;

const RHYTHM = [
  {
    when: "Day 1",
    title: "A fresh creative kit lands in your dashboard.",
    body:  "Generated from your signal that morning. Yours to download, post, edit, ignore — yours.",
  },
  {
    when: "Day 15",
    title: "A new lesson from us is published.",
    body:  "Hadar and Alon, on one specific way to carry your signal into the world this month.",
  },
  {
    when: "Anytime",
    title: "Your signal lives at the centre.",
    body:  "Open it, re-read it, copy from it. Everything you receive is drawn from this one place.",
  },
] as const;

const INCLUDED = [
  "Monthly creative kit drawn from your signal",
  "Monthly course lesson from Hadar and Alon",
  "Full library of past months kept inside",
  "Your signal kept alive, returnable any time",
  "Cancel anytime · 14-day refund window",
] as const;

const FAQ = [
  {
    q: "Do I need to take the diagnostic first?",
    a: "Yes — the signal is the input the entire Hive draws from. If you have not taken the five questions yet, you can do that free here: /en/signal.",
  },
  {
    q: "What happens to my kits if I cancel?",
    a: "Past kits you already received are yours to keep. You stop receiving new monthly drops at the end of the current cycle.",
  },
  {
    q: "Refunds?",
    a: "Within 14 days of the first charge, full refund, no questions. After that, cancel anytime and you are not charged again.",
  },
  {
    q: "Is everything in English?",
    a: "Yes. The Hive (English) is for global members. If you read and write in Hebrew, the Israel edition is what you want — same brand, same method.",
  },
  {
    q: "When does it open?",
    a: "When checkout is wired and the first kit is ready. Leave your email above — you will be the first to know, and the first cohort is small on purpose.",
  },
] as const;
