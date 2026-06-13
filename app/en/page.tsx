import Image from "next/image";
import Link from "next/link";
import { QuestionCard } from "./QuestionCard";

const BEE = "/beelogo.png";

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
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#111113",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image src={BEE} alt="beegood" width={22} height={22} style={{ width: "64%", height: "auto", display: "block" }} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 19,
              fontWeight: 500,
              letterSpacing: "-0.02em",
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
          Five questions reveal the one signal that is yours alone — the way you already help people, named clearly enough to build on. Then we help it reach the people waiting for it.
        </p>

        <QuestionCard />
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
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(30px, 4.2vw, 48px)",
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            margin: "0 0 10px",
            color: "#0F1011",
            maxWidth: "18ch",
          }}
        >
          In ten minutes, three things you can use tomorrow.
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
              <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 14, fontWeight: 700, color: "#9A7526", marginBottom: 16 }}>
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

      <footer style={{ borderTop: "1px solid rgba(15,16,17,0.08)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "32px clamp(20px, 4vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#111113", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src={BEE} alt="" width={17} height={17} style={{ width: "64%", height: "auto", display: "block" }} />
            </div>
            <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 15, fontWeight: 500, color: "#0F1011" }}>
              beegood
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 13, color: "#9A9C9E" }}>
            The TrueSignal© Method · Wherever you are, in every language
          </span>
        </div>
      </footer>
    </>
  );
}

const THREE = [
  {
    n: "01",
    title: "One sentence to say out loud",
    body: "The signal itself — what only you can give, in a line you can stand behind in any room.",
  },
  {
    n: "02",
    title: "The people looking for you",
    body: "Your audience named as a place in life, not a demographic — the ones who need what you carry.",
  },
  {
    n: "03",
    title: "Three directions to make this week",
    body: "Specific places to begin, so you are not waiting for clarity before you create.",
  },
];
