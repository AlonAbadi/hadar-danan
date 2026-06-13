import Image from "next/image";
import Link from "next/link";
import { QuestionCard } from "./QuestionCard";

const BEE = "/beegood_logo.png";

export default function EnHomePage() {
  return (
    <>
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "26px clamp(20px, 4vw, 40px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <Image
            src={BEE}
            alt="beegood"
            width={33}
            height={26}
            style={{ width: "auto", height: 26, display: "block" }}
          />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 19,
              fontWeight: 400,
              letterSpacing: "-0.015em",
              color: "#0F1011",
            }}
          >
            beegood
          </span>
        </div>
        <Link
          href="/en/signal"
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#0F1011",
            background: "none",
            border: "1px solid rgba(15,16,17,0.16)",
            borderRadius: 999,
            padding: "9px 18px",
            textDecoration: "none",
            transition: "background .2s ease, color .2s ease",
          }}
        >
          Reveal my signal
        </Link>
      </header>

      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "clamp(48px, 9vh, 104px) clamp(20px, 4vw, 40px) clamp(40px, 7vh, 80px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#9A7526",
            marginBottom: 28,
          }}
        >
          The signal only you can give
        </div>
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(46px, 8.4vw, 108px)",
            lineHeight: 0.96,
            letterSpacing: "-0.045em",
            margin: 0,
            color: "#0F1011",
          }}
        >
          You can only give<br />what <span style={{ color: "#9A7526" }}>you</span> are.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: "clamp(18px, 2.1vw, 22px)",
            fontWeight: 400,
            lineHeight: 1.5,
            color: "#54565A",
            maxWidth: "54ch",
            margin: "30px auto 0",
          }}
        >
          Five questions reveal the one signal that is yours alone — the way you already help people, named clearly enough to build on. Then we help it reach the people who are waiting for it.
        </p>

        <QuestionCard />

        <p
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#9A7526",
            margin: "28px 0 0",
          }}
        >
          What you receive is yours to keep — free.
        </p>
      </section>

      <section
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "clamp(64px, 10vw, 110px) clamp(20px, 4vw, 40px)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#9A7526",
            marginBottom: 22,
          }}
        >
          The work, before it has words for it
        </div>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontWeight: 600,
            fontSize: "clamp(28px, 4.4vw, 52px)",
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            margin: "0 0 30px",
            color: "#0F1011",
            maxWidth: "16ch",
          }}
        >
          Why five questions
        </h2>
        <p
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: "clamp(17px, 1.8vw, 19px)",
            lineHeight: 1.65,
            color: "#3D3E42",
            margin: "0 0 18px",
            maxWidth: "62ch",
          }}
        >
          A generic tool returns a generic answer. Two people in the same field differ in who they are — not in what they do.
        </p>
        <p
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: "clamp(16px, 1.7vw, 18px)",
            lineHeight: 1.7,
            color: "#54565A",
            margin: "0 0 14px",
            maxWidth: "62ch",
          }}
        >
          Most positioning starts from the market: what is selling, what competitors claim, where the gap is. It produces language that fits everyone and belongs to no one.
        </p>
        <p
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: "clamp(16px, 1.7vw, 18px)",
            lineHeight: 1.7,
            color: "#54565A",
            margin: 0,
            maxWidth: "62ch",
          }}
        >
          This starts from you. The element you work in without effort. The chapter that taught you something. The tool you built to get through it. Where those meet is a signal no one can copy — because it was never about the work. It was about you.
        </p>
      </section>

      <section style={{ background: "#111113", color: "#F3F1EC" }}>
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 40px)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-hanken-grotesk), sans-serif",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C2973F",
              marginBottom: 24,
            }}
          >
            Reach, in service of meaning
          </div>
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontWeight: 500,
              fontSize: "clamp(28px, 4.4vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              margin: 0,
              color: "#F7F5F0",
            }}
          >
            The world has never had more reach, and rarely less signal. We put the engine of reach behind the one thing worth multiplying — <span style={{ color: "#C2973F" }}>what is yours.</span>
          </h2>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 40px)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#9A7526",
            marginBottom: 18,
          }}
        >
          What you walk away with
        </div>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(30px, 4.2vw, 48px)",
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            margin: "0 0 10px",
            color: "#0F1011",
            maxWidth: "22ch",
          }}
        >
          In about ten minutes, three things you can use tomorrow.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            marginTop: 48,
          }}
        >
          {THREE.map((card) => (
            <div
              key={card.n}
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,16,17,0.09)",
                borderRadius: 18,
                padding: 30,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-spectral), Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 22,
                  color: "#9A7526",
                  marginBottom: 16,
                  letterSpacing: "0.02em",
                }}
              >
                {card.n}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                  color: "#0F1011",
                }}
              >
                {card.title}
              </div>
              <div style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 15, lineHeight: 1.6, color: "#54565A", marginTop: 10 }}>
                {card.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Specimen card — sample of a real signal so visitors see the shape of what they receive */}
      <section
        style={{
          background: "#F4EFE4",
          padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 40px)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-hanken-grotesk), sans-serif",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#9A7526",
              marginBottom: 28,
            }}
          >
            One signal, in full —
          </div>

          <div
            style={{
              background: "#FCFAF3",
              border: "1px solid rgba(33,27,18,0.10)",
              borderRadius: 8,
              padding: "clamp(36px, 5vw, 56px)",
              boxShadow: "0 1px 0 rgba(26,23,18,0.03), 0 30px 60px -46px rgba(26,23,18,0.30)",
            }}
          >
            {/* Specimen header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                marginBottom: 36,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <Image
                  src={BEE}
                  alt=""
                  width={28}
                  height={22}
                  style={{ width: "auto", height: 22, display: "block" }}
                />
                <span style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontSize: 17, color: "#211B12" }}>
                  beegood
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-hanken-grotesk), sans-serif",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#6F521A",
                }}
              >
                A signal — specimen · No. 001
              </div>
            </div>

            <SpecimenRow label="Who it is for">
              Anyone standing at the edge of a second chapter, quietly unsure they are allowed to want it.
            </SpecimenRow>
            <SpecimenRow label="Where to begin" multiline>
              A short letter to the version of you from five years ago.
              <br />
              The one belief your work quietly argues for.
              <br />
              A weekly note to the people standing where you once stood.
            </SpecimenRow>
            <SpecimenRow label="Signed" last>
              <span style={{ fontStyle: "italic" }}>Hadar &amp; Alon</span>
            </SpecimenRow>
          </div>
        </div>
      </section>

      {/* Founders quote */}
      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "clamp(88px, 13vw, 140px) clamp(20px, 4vw, 40px)",
          textAlign: "center",
        }}
      >
        <div style={{ width: 34, height: 1, background: "#BE9540", margin: "0 auto 36px" }} />
        <p
          style={{
            fontFamily: "var(--font-spectral), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(24px, 3.4vw, 36px)",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            color: "#211B12",
            margin: "0 auto",
            maxWidth: "32ch",
          }}
        >
          “Reach can be borrowed. A signal cannot. Ours is to carry yours farther into the world — and to keep it, unmistakably, yours.”
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
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
            fontSize: 18,
            color: "#211B12",
            marginTop: 16,
          }}
        >
          Hadar Danan &amp; Alon Abadi
        </div>
        <div
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 12,
            letterSpacing: "0.06em",
            color: "#988D7B",
            marginTop: 6,
          }}
        >
          Founders of beegood · Creators of the TrueSignal© method
        </div>
      </section>

      {/* Closing CTA */}
      <section
        style={{
          background: "#EBE3D2",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "clamp(80px, 12vw, 120px) clamp(20px, 4vw, 40px)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-spectral), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(26px, 3.6vw, 38px)",
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              color: "#211B12",
              margin: 0,
              maxWidth: "26ch",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Five questions stand between you and a sentence you have been trying to say for years.
          </h2>
          <div style={{ marginTop: 38 }}>
            <Link
              href="/en/signal"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-hanken-grotesk), sans-serif",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#F4EFE4",
                background: "#211B12",
                border: "none",
                borderRadius: 4,
                padding: "16px 32px",
                textDecoration: "none",
              }}
            >
              Begin the five questions <span style={{ fontSize: 15 }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(15,16,17,0.08)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "36px clamp(20px, 4vw, 40px) 28px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
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
                fontStyle: "italic",
                fontSize: 13,
                color: "#988D7B",
                marginTop: 6,
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

function SpecimenRow({
  label,
  children,
  multiline = false,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  multiline?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "26px 0",
        borderTop: "1px solid rgba(33,27,18,0.08)",
        borderBottom: last ? "1px solid rgba(33,27,18,0.08)" : undefined,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-hanken-grotesk), sans-serif",
          fontSize: 10.5,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#988D7B",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-spectral), Georgia, serif",
          fontStyle: "italic",
          fontSize: "clamp(19px, 2.4vw, 22px)",
          lineHeight: multiline ? 1.85 : 1.5,
          letterSpacing: "-0.01em",
          color: "#211B12",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const THREE = [
  {
    n: "i",
    title: "One sentence to say out loud, without apology",
    body: "The signal itself — what only you can give, in a line you can stand behind in any room.",
  },
  {
    n: "ii",
    title: "The people already looking for you",
    body: "Your audience named as a place in life, not a demographic — the ones who need what you carry.",
  },
  {
    n: "iii",
    title: "Three directions to start making this week",
    body: "Specific places to begin, so you are not waiting for clarity before you create.",
  },
];
