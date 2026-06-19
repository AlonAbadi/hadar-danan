import Image from "next/image";
import Link from "next/link";
import { QuestionCard } from "./QuestionCard";

const BEE = "/beegood_logo.png";

export default function EnHomePage() {
  return (
    <div style={{ fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif" }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(13,12,10,0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(242,237,228,0.07)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 clamp(20px, 4vw, 48px)",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
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
            <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "#F2EDE4" }}>
              beegood
            </span>
          </Link>
          <Link
            href="/en/signal"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#0D0C0A",
              background: "#C2973F",
              border: "none",
              borderRadius: 999,
              padding: "9px 20px",
              cursor: "pointer",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Start free &rarr;
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(80px, 14vh, 160px) clamp(20px, 4vw, 48px) clamp(60px, 10vh, 120px)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#C2973F",
            background: "rgba(194,151,63,0.10)",
            border: "1px solid rgba(194,151,63,0.22)",
            borderRadius: 999,
            padding: "7px 14px",
            marginBottom: 44,
          }}
        >
          Business OS for Personal Brands
        </div>
        <h1
          style={{
            fontSize: "clamp(48px, 9vw, 118px)",
            fontWeight: 800,
            lineHeight: 0.93,
            letterSpacing: "-0.048em",
            margin: 0,
            color: "#F2EDE4",
            maxWidth: "14ch",
          }}
        >
          Stop guessing.<br />Know what <span style={{ color: "#C2973F" }}>actually</span><br />matters next.
        </h1>
        <p
          style={{
            fontSize: "clamp(18px, 2.1vw, 23px)",
            fontWeight: 400,
            lineHeight: 1.55,
            color: "rgba(242,237,228,0.55)",
            maxWidth: "52ch",
            margin: "36px 0 0",
          }}
        >
          Most personal brands buy more tools, more courses, and more consultants, and still don&apos;t know what truly matters now. BeeGood is the first operating system built to tell you.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginTop: 48 }}>
          <Link
            href="/en/signal"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0D0C0A",
              background: "#C2973F",
              border: "none",
              borderRadius: 12,
              padding: "17px 34px",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            Reveal my signal, free <span style={{ fontSize: 18 }}>&rarr;</span>
          </Link>
          <span style={{ fontSize: 14, color: "rgba(242,237,228,0.32)" }}>
            &asymp; 10 minutes · yours to keep forever
          </span>
        </div>
      </section>

      {/* CHAOS — the problem */}
      <section
        style={{
          background: "#111009",
          borderTop: "1px solid rgba(242,237,228,0.06)",
          borderBottom: "1px solid rgba(242,237,228,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "clamp(64px, 10vw, 112px) clamp(20px, 4vw, 48px)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(242,237,228,0.28)",
              marginBottom: 48,
            }}
          >
            The problem
          </div>
          <div
            className="two-col"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(32px, 5vw, 72px)",
              alignItems: "end",
              marginBottom: "clamp(48px, 8vw, 96px)",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 50px)",
                fontWeight: 700,
                lineHeight: 1.06,
                letterSpacing: "-0.035em",
                margin: 0,
                color: "rgba(242,237,228,0.32)",
              }}
            >
              There are already too many tools.
            </h2>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 50px)",
                fontWeight: 700,
                lineHeight: 1.06,
                letterSpacing: "-0.035em",
                margin: 0,
                color: "#F2EDE4",
              }}
            >
              The real pain is not knowing what actually matters now.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 1,
              background: "rgba(242,237,228,0.07)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            {CHAOS.map((c) => (
              <div key={c.eyebrow} style={{ background: "#111009", padding: "28px 24px" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#C2973F",
                    marginBottom: 14,
                  }}
                >
                  {c.eyebrow}
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.4, color: "rgba(242,237,228,0.70)" }}>
                  {c.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE SYSTEM — four layers (cream band) */}
      <section style={{ background: "#F8F4EE" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 48px)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#9A7526",
              marginBottom: 16,
            }}
          >
            The system
          </div>
          <h2
            style={{
              fontSize: "clamp(30px, 4.4vw, 54px)",
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-0.038em",
              color: "#0D0C0A",
              margin: "0 0 56px",
              maxWidth: "22ch",
            }}
          >
            Four layers. One question answered: what matters most, right now.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 2,
              background: "rgba(13,12,10,0.08)",
              borderRadius: 24,
              overflow: "hidden",
            }}
          >
            {LAYERS.map((l, i) => {
              const cardInner = (
                <>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: i === 0 ? "#0D0C0A" : "rgba(13,12,10,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 22,
                    }}
                  >
                    {i === 0 ? (
                      <Image src={BEE} alt="" width={22} height={22} style={{ width: "64%", height: "auto", display: "block" }} />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#0D0C0A" }}>{l.num}</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#9A7526",
                      marginBottom: 12,
                    }}
                  >
                    Layer {l.num}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: "-0.025em",
                      lineHeight: 1.2,
                      color: "#0D0C0A",
                      marginBottom: 12,
                    }}
                  >
                    {l.title}
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.65, color: "#5C5549" }}>{l.body}</div>
                  {l.cta && (
                    <div style={{ marginTop: 20, fontSize: 12.5, fontWeight: 700, color: "#C2973F" }}>
                      {l.cta}
                    </div>
                  )}
                </>
              );

              const cardStyle = {
                background: i === 0 ? "#FFFFFF" : "#FAFAF8",
                padding: "36px 28px",
                display: "block",
                textDecoration: "none",
                color: "inherit",
              } as const;

              return l.href ? (
                <Link key={l.num} href={l.href} style={cardStyle}>
                  {cardInner}
                </Link>
              ) : (
                <div key={l.num} style={cardStyle}>
                  {cardInner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NORTH STAR */}
      <section
        style={{
          background: "#0D0C0A",
          padding: "clamp(80px, 13vw, 160px) clamp(20px, 4vw, 48px)",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(242,237,228,0.30)",
              marginBottom: 32,
            }}
          >
            The north star
          </div>
          <h2
            style={{
              fontSize: "clamp(32px, 5.6vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.045em",
              color: "#F2EDE4",
              margin: 0,
            }}
          >
            BeeGood continuously answers<br />one question,
          </h2>
          <h2
            style={{
              fontSize: "clamp(32px, 5.6vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.045em",
              color: "#C2973F",
              margin: "12px 0 0",
            }}
          >
            What is the most important thing<br />this business should do next?
          </h2>
        </div>
      </section>

      {/* TRUESIGNAL ENTRY — two-col on cream */}
      <section style={{ background: "#F8F4EE" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 48px)",
          }}
        >
          <div
            className="two-col"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(40px, 7vw, 100px)",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#9A7526",
                  background: "rgba(154,117,38,0.10)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  marginBottom: 22,
                }}
              >
                TrueSignal© · Layer 01 · Free
              </div>
              <h2
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: "-0.035em",
                  color: "#0D0C0A",
                  margin: 0,
                }}
              >
                Start here.<br />Five questions.<br />Ten minutes.
              </h2>
              <p
                style={{
                  fontSize: "clamp(16px, 1.8vw, 19px)",
                  lineHeight: 1.65,
                  color: "#5C5549",
                  margin: "22px 0 0",
                }}
              >
                Before architecture, strategy, and execution, there is signal. The one thing only you can give. Five questions reveal it clearly enough to build everything else from.
              </p>
              <p
                style={{
                  fontSize: "clamp(16px, 1.8vw, 19px)",
                  lineHeight: 1.65,
                  color: "#5C5549",
                  margin: "16px 0 0",
                }}
              >
                This is the entry to BeeGood. It is free, and what you receive is yours to keep.
              </p>
              <Link
                href="/en/signal"
                style={{
                  marginTop: 32,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0D0C0A",
                  background: "#C2973F",
                  border: "none",
                  borderRadius: 12,
                  padding: "16px 32px",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                Reveal my signal, free <span style={{ fontSize: 18 }}>&rarr;</span>
              </Link>
            </div>
            <div>
              <QuestionCard />
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  marginTop: 16,
                  border: "1px solid rgba(13,12,10,0.08)",
                }}
              >
                <Image
                  src="/mock-signal-card.png"
                  alt="Your signal card"
                  width={520}
                  height={260}
                  style={{ display: "block", width: "100%", height: "auto", objectFit: "cover" }}
                />
              </div>
              <p style={{ fontSize: 13, color: "#A79C8C", textAlign: "center", margin: "12px 0 0" }}>
                What you receive is yours to keep, free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SCENE */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 clamp(20px, 4vw, 48px) clamp(72px, 11vw, 120px)",
        }}
      >
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(242,237,228,0.07)",
            width: "100%",
            aspectRatio: "21 / 8",
          }}
        >
          <Image
            src="/mock-scene.png"
            alt="The signal, in the wild"
            width={1200}
            height={457}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </section>

      {/* FOUNDERS */}
      <section
        style={{
          background: "#111009",
          padding: "clamp(72px, 11vw, 120px) clamp(20px, 4vw, 48px)",
        }}
      >
        <div
          className="two-col"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(36px, 6vw, 80px)",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(242,237,228,0.30)",
                marginBottom: 28,
              }}
            >
              Signed
            </div>
            <p
              style={{
                fontSize: "clamp(22px, 3vw, 34px)",
                fontWeight: 500,
                fontStyle: "italic",
                lineHeight: 1.38,
                letterSpacing: "-0.022em",
                color: "#F2EDE4",
                margin: 0,
              }}
            >
              &ldquo;BeeGood does not help personal brands do more. It helps them know what truly matters, and execute accordingly.&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 36 }}>
              <Image
                src={BEE}
                alt=""
                width={50}
                height={40}
                style={{ width: "auto", height: 40, display: "block", flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: "#F2EDE4" }}>
                  Hadar Danan &amp; Alon Abadi
                </div>
                <div style={{ fontSize: 13, color: "rgba(242,237,228,0.36)", marginTop: 4 }}>
                  Founders · beegood
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(242,237,228,0.07)",
            }}
          >
            <Image
              src="/mock-founders.png"
              alt="Hadar & Alon"
              width={520}
              height={520}
              style={{ display: "block", width: "100%", height: "auto", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section
        style={{
          background: "#0D0C0A",
          padding: "clamp(80px, 14vw, 180px) clamp(20px, 4vw, 48px)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(34px, 6.4vw, 82px)",
            fontWeight: 800,
            lineHeight: 0.96,
            letterSpacing: "-0.048em",
            color: "#F2EDE4",
            margin: 0,
            maxWidth: "16ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          You can only give<br />what <span style={{ color: "#C2973F" }}>you</span> are.
        </h2>
        <p
          style={{
            fontSize: "clamp(16px, 1.9vw, 20px)",
            color: "rgba(242,237,228,0.45)",
            maxWidth: "44ch",
            margin: "28px auto 0",
            lineHeight: 1.6,
          }}
        >
          Five questions stand between you and the sentence you have been trying to say for years. It is free to start.
        </p>
        <Link
          href="/en/signal"
          style={{
            marginTop: 44,
            fontSize: 16,
            fontWeight: 700,
            color: "#0D0C0A",
            background: "#C2973F",
            border: "none",
            borderRadius: 14,
            padding: "18px 42px",
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 11,
          }}
        >
          Begin the five questions <span style={{ fontSize: 18 }}>&rarr;</span>
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(242,237,228,0.07)", background: "#0D0C0A" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "36px clamp(20px, 4vw, 48px) 52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
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
            <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.015em", color: "#F2EDE4" }}>beegood</span>
          </Link>
          <span style={{ fontSize: 13, color: "rgba(242,237,228,0.24)" }}>
            Business OS for Personal Brands · TrueSignal© Method
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(242,237,228,0.16)",
            }}
          >
            Tel Aviv · New York · London · Tokyo · São Paulo
          </span>
        </div>
      </footer>

      {/* Mobile single-column override for two-col grids */}
      <style>{`@media(max-width:760px){.two-col{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}

const CHAOS = [
  { eyebrow: "Strategic chaos", body: "Too many possible actions. No way to know which one truly moves the needle." },
  { eyebrow: "Operational chaos", body: "Ten disconnected tools, none of which talk to each other." },
  { eyebrow: "Decision chaos", body: "No unified visibility. No clarity on what to stop, start, or prioritize." },
  { eyebrow: "Identity chaos", body: "Growth disconnected from who you actually are. Scale without signal." },
] as const;

const LAYERS = [
  {
    num: "01",
    title: "Signal Intelligence",
    body: "Who are you, and what can only you uniquely offer? This layer extracts the authentic signal that no competitor can copy.",
    cta: "Start here, free →",
    href: "/en/signal",
  },
  {
    num: "02",
    title: "Business Architecture",
    body: "Signal alone has no business value until translated. What offer, what model, what funnel, what pricing, all designed around who you are.",
    cta: null,
    href: null,
  },
  {
    num: "03",
    title: "Content Intelligence",
    body: "How should the brand speak? What hooks, what themes, what voice? Signal translated into content that attracts the right people.",
    cta: null,
    href: null,
  },
  {
    num: "04",
    title: "BeeGood OS",
    body: "The execution engine. Unified data, AI decision intelligence, CRM, automations, all answering one question: what matters most right now?",
    cta: "Learn more →",
    href: "/en/hive",
  },
] as const;
