// /en — the English home. Repositioning approved by Alon 2026-07-13 from
// design/en-truesignal/beegood-en-repositioning.html: category creation, not
// agency copy. The page walks the TrueSignal hierarchy in order — Evidence →
// Signal → Identity → Positioning → Expression → Presence → Growth — and
// never promises expression before signal. Tone: quiet, earned, no hype, no
// exclamation marks, plain hyphens only. CTAs are discovery CTAs.
import Image from "next/image";
import Link from "next/link";

const BEE = "/beegood_logo.png";

const C = {
  bg: "#0D0C0A",
  panel: "#111009",
  card: "#161410",
  line: "rgba(242,237,228,0.08)",
  gold: "#C2973F",
  goldHi: "#E3BC6B",
  fg: "#F2EDE4",
  fgSoft: "rgba(242,237,228,0.72)",
  fgMut: "rgba(242,237,228,0.52)",
  fgFaint: "rgba(242,237,228,0.34)",
  green: "#7FBF8E",
};

const wrap: React.CSSProperties = {
  maxWidth: 1140,
  margin: "0 auto",
  padding: "0 clamp(20px, 4vw, 48px)",
};

const eyebrow: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: C.fgFaint,
  marginBottom: 40,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(28px, 4.4vw, 52px)",
  fontWeight: 700,
  lineHeight: 1.08,
  letterSpacing: "-0.035em",
  maxWidth: "22ch",
  margin: 0,
  color: C.fg,
};

const sec: React.CSSProperties = { padding: "clamp(70px, 10vw, 120px) 0" };
const sectionBorder: React.CSSProperties = { borderTop: `1px solid ${C.line}` };

const ctaMain: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#15130F",
  background: `linear-gradient(135deg, ${C.goldHi}, ${C.gold})`,
  borderRadius: 12,
  padding: "17px 32px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
};

const DEF_CELLS = [
  { n: "01 · YOU NOTICE", body: "What you see instantly, that others walk past. The thing people stop and ask you about." },
  { n: "02 · IT MATTERS", body: "Why it pulls you. Usually a chapter you lived through - the ground a way of seeing grew from." },
  { n: "03 · YOU INTERVENE", body: "The particular way you act on it. The tool you built for yourself first, that now serves others." },
  { n: "04 · IT REPEATS", body: "The transformation that keeps happening around you. What people thank you for, again and again." },
];

const LADDER = [
  { t: "Evidence", d: "your own words, your own moments", first: true },
  { t: "Signal", d: "the pattern, named" },
  { t: "Identity", d: "who you are when you work from it" },
  { t: "Positioning", d: "the place only you can hold" },
  { t: "Expression", d: "scripts, texts, visuals - in your voice" },
  { t: "Presence", d: "the right people recognize themselves" },
  { t: "Growth", d: "clients who arrive already convinced" },
];

const AFTER = [
  { k: "Writing", body: "You stop asking \"what should I post\" - every piece starts from the same truth, so it stops being a decision." },
  { k: "Speaking", body: "On camera you are not performing a script. You are saying something you have known for years." },
  { k: "Selling", body: "The right people recognize themselves in your signal before you say a word about price." },
  { k: "Deciding", body: "Offers, collaborations, directions - each one is measured against one question: does it come from the signal." },
];

const STEPS = [
  {
    num: "i",
    title: "The reading",
    body: "Six questions, about ten minutes. Your answers are read for the pattern - and your signal comes back in writing: the ground, the element, the tool, your people. Saved for you, for good.",
    tag: "Free",
  },
  {
    num: "ii",
    title: "The hive",
    body: "Everything built from your signal, in one room: your first episode fully scripted in your voice, your bio, about and manifesto written, designed cards that carry your line.",
    tag: "Opens with your reading",
  },
  {
    num: "iii",
    title: "The broadcast room",
    body: "Film your first episode with a teleprompter that follows your pace. The director edits, burns in the captions, and hands back a reel. Filmed, not produced.",
    tag: "First episode free",
  },
];

export default function EnHomePage() {
  return (
    <div style={{ fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif", background: C.bg, color: C.fg }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(13,12,10,0.9)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ ...wrap, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
            <Image src={BEE} alt="beegood" width={50} height={40} style={{ width: "auto", height: 40, display: "block" }} />
            <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: C.fg }}>beegood</span>
          </Link>
          <Link
            href="/en/reading"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#15130F",
              background: C.gold,
              borderRadius: 999,
              padding: "10px 20px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Reveal my signal &rarr;
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ padding: "clamp(90px, 15vh, 170px) 0 clamp(70px, 10vh, 120px)" }}>
        <div style={wrap}>
          <span
            style={{
              display: "inline-block",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.gold,
              border: "1px solid rgba(194,151,63,0.28)",
              background: "rgba(194,151,63,0.08)",
              borderRadius: 999,
              padding: "7px 15px",
              marginBottom: 42,
            }}
          >
            The operating system for authentic personal brands
          </span>
          <h1
            style={{
              fontSize: "clamp(42px, 7.2vw, 96px)",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
              maxWidth: "17ch",
              margin: 0,
            }}
          >
            You don&apos;t have<br />a content problem.<br />
            <span style={{ color: C.fgFaint }}>You have a</span> <span style={{ color: C.gold }}>source</span>{" "}
            <span style={{ color: C.fgFaint }}>problem.</span>
          </h1>
          <p style={{ fontSize: "clamp(17px, 2vw, 21px)", color: C.fgMut, maxWidth: "46ch", marginTop: 34 }}>
            Every business that works keeps revealing the same pattern. Most founders never learn to name theirs -
            so they keep producing, and it keeps sounding like everyone else.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginTop: 46 }}>
            <Link href="/en/reading" style={ctaMain}>
              Reveal my signal <span>&rarr;</span>
            </Link>
            <span style={{ fontSize: 13.5, color: C.fgFaint }}>
              &asymp; 10 minutes &middot; built from your own words &middot; yours to keep
            </span>
          </div>
        </div>
      </header>

      {/* THE PROBLEM */}
      <section style={sectionBorder}>
        <div style={{ ...wrap, ...sec }}>
          <div style={eyebrow}>Why most people struggle</div>
          <div className="en-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(28px, 5vw, 64px)", alignItems: "end" }}>
            <h3 style={{ fontSize: "clamp(24px, 3.4vw, 42px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", margin: 0, color: C.fgFaint }}>
              Marketing teaches you how to speak.
            </h3>
            <h3 style={{ fontSize: "clamp(24px, 3.4vw, 42px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", margin: 0 }}>
              Nobody teaches you where to speak from.
            </h3>
          </div>
          <p style={{ marginTop: "clamp(48px, 7vw, 84px)", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 500, lineHeight: 1.35, maxWidth: "30ch" }}>
            So you bought the course, hired the ghostwriter, tried the tool - and the words still don&apos;t sound like you.
            Not because the words are wrong. Because <b style={{ color: C.gold, fontWeight: 700 }}>they come from nowhere.</b>
          </p>
        </div>
      </section>

      {/* WHAT IS A SIGNAL */}
      <section style={{ ...sectionBorder, background: C.panel }}>
        <div style={{ ...wrap, ...sec }}>
          <div style={eyebrow}>What is a signal</div>
          <p
            style={{
              fontFamily: "var(--font-spectral), Georgia, serif",
              fontSize: "clamp(26px, 4vw, 46px)",
              lineHeight: 1.25,
              maxWidth: "24ch",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            A signal is not a slogan.<br />
            It is the <em style={{ color: C.gold }}>pattern</em> your work keeps proving,<br />
            whether you name it or not.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 1,
              background: C.line,
              borderRadius: 18,
              overflow: "hidden",
              marginTop: "clamp(44px, 6vw, 72px)",
            }}
          >
            {DEF_CELLS.map((c) => (
              <div key={c.n} style={{ background: C.panel, padding: "30px 26px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.gold, letterSpacing: "0.14em", marginBottom: 14 }}>{c.n}</div>
                <p style={{ fontSize: 15.5, color: C.fgSoft, lineHeight: 1.55, margin: 0 }}>{c.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: "clamp(40px, 5vw, 60px)", fontSize: "clamp(17px, 2vw, 21px)", color: C.fgMut, maxWidth: "50ch" }}>
            Identity, positioning, content, offers, sales - <b style={{ color: C.fg, fontWeight: 600 }}>all of it is downstream of this pattern.</b>{" "}
            Which is why fixing any of them first never holds.
          </p>
        </div>
      </section>

      {/* EVIDENCE */}
      <section style={sectionBorder}>
        <div style={{ ...wrap, ...sec }}>
          <div style={eyebrow}>How we discover it</div>
          <div className="en-two-col" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "clamp(36px, 6vw, 80px)", alignItems: "center" }}>
            <div>
              <h2 style={h2}>
                We don&apos;t start with positioning.<br />We start with evidence.
              </h2>
              <p style={{ fontSize: "clamp(16px, 1.8vw, 18.5px)", color: C.fgMut, marginTop: 28, maxWidth: "44ch" }}>
                Six questions. Not about your market - about your moments. Where time disappears for you.
                What people stop to ask you. What they thank you for. The chapter that changed how you see.
              </p>
              <p style={{ fontSize: "clamp(16px, 1.8vw, 18.5px)", color: C.fgMut, marginTop: 18, maxWidth: "44ch" }}>
                Your answers are read for the pattern they already contain.{" "}
                <b style={{ color: C.fg, fontWeight: 600 }}>Nothing is invented.</b> A signal that could belong to a
                thousand other people has failed - yours is anchored in your own words, or it doesn&apos;t leave the room.
              </p>
              <p style={{ fontSize: "clamp(16px, 1.8vw, 18.5px)", marginTop: 18 }}>
                <b style={{ color: C.fg, fontWeight: 600 }}>We don&apos;t create authenticity. We reveal it.</b>
              </p>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "30px 28px" }}>
              <div style={{ fontSize: 13, color: C.fgFaint, marginBottom: 10, letterSpacing: "0.04em" }}>
                Q3 &middot; What do people thank you for the most?
              </div>
              <p style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontSize: 17, color: C.fgSoft, lineHeight: 1.65, fontStyle: "italic", margin: 0 }}>
                &quot;They thank me for making them feel safe with numbers. One client wrote:{" "}
                <span style={{ background: "rgba(194,151,63,0.16)", borderRadius: 3, padding: "0 3px" }}>
                  you are the first person who explained my own business to me without making me feel stupid.
                </span>
                &quot;
              </p>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed rgba(194,151,63,0.3)", fontSize: 13, color: C.gold, fontWeight: 600 }}>
                &uarr; This sentence is evidence. The signal is already in it.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIERARCHY */}
      <section style={{ ...sectionBorder, background: C.panel }}>
        <div style={{ ...wrap, ...sec }}>
          <div style={eyebrow}>The order that works</div>
          <h2 style={h2}>
            Everything has an order.<br />Most people build it backwards.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "clamp(44px, 6vw, 72px)" }}>
            {LADDER.map((r, i) => (
              <div key={r.t} style={{ display: "contents" }}>
                {i > 0 && <div style={{ color: C.fgFaint, fontSize: 18, padding: "8px 0" }}>&darr;</div>}
                <div
                  style={{
                    width: "min(460px, 100%)",
                    textAlign: "center",
                    border: r.first ? "1px solid rgba(194,151,63,0.5)" : `1px solid ${C.line}`,
                    borderRadius: 14,
                    background: r.first ? "linear-gradient(135deg, rgba(194,151,63,0.14), rgba(194,151,63,0.04))" : C.card,
                    padding: "18px 20px",
                  }}
                >
                  <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.01em", color: r.first ? C.goldHi : C.fg }}>{r.t}</div>
                  <div style={{ fontSize: 13, color: C.fgFaint, marginTop: 3 }}>{r.d}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 36, fontSize: 15, color: C.fgMut }}>
            We never reverse this order. <b style={{ color: C.fg }}>No expression before signal. Ever.</b>
          </p>
        </div>
      </section>

      {/* WHAT CHANGES */}
      <section style={sectionBorder}>
        <div style={{ ...wrap, ...sec }}>
          <div style={eyebrow}>What changes after</div>
          <h2 style={h2}>
            Once the source is named,<br />everything downstream gets lighter.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 1,
              background: C.line,
              borderRadius: 18,
              overflow: "hidden",
              marginTop: "clamp(44px, 6vw, 64px)",
            }}
          >
            {AFTER.map((a) => (
              <div key={a.k} style={{ background: C.bg, padding: "30px 26px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, marginBottom: 12 }}>
                  {a.k}
                </div>
                <p style={{ fontSize: 15.5, color: C.fgSoft, lineHeight: 1.55, margin: 0 }}>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ ...sectionBorder, background: C.panel }}>
        <div style={{ ...wrap, ...sec }}>
          <div style={eyebrow}>Your first step</div>
          <h2 style={h2}>
            From evidence to presence,<br />in one place.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: "clamp(44px, 6vw, 64px)" }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "30px 28px", position: "relative" }}>
                <span style={{ position: "absolute", top: 24, right: 26, fontFamily: "var(--font-spectral), Georgia, serif", fontSize: 30, color: "rgba(194,151,63,0.35)", fontStyle: "italic" }}>
                  {s.num}
                </span>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em", maxWidth: "85%", marginTop: 0 }}>{s.title}</h4>
                <p style={{ fontSize: 14.5, color: C.fgMut, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 16,
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: C.green,
                    border: "1px solid rgba(127,191,142,0.35)",
                    borderRadius: 999,
                    padding: "4px 12px",
                  }}
                >
                  {s.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section style={sectionBorder}>
        <div style={{ ...wrap, ...sec, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(32px, 5vw, 56px)" }}>
          {[
            <>Content is not the source.<br /><b style={{ color: C.gold, fontWeight: 500 }}>The Signal is.</b></>,
            <>Our job is not to invent your message.<br /><b style={{ color: C.fg, fontWeight: 500 }}>It is to uncover the one that already exists.</b></>,
            <>The Signal is not created.<br /><b style={{ color: C.fg, fontWeight: 500 }}>It is discovered.</b></>,
          ].map((q, i) => (
            <p key={i} style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontSize: "clamp(19px, 2.2vw, 24px)", lineHeight: 1.45, color: C.fgSoft, margin: 0 }}>
              {q}
            </p>
          ))}
        </div>
      </section>

      {/* AI STANCE */}
      <section style={{ ...sectionBorder, background: C.panel }}>
        <div style={{ ...wrap, ...sec }}>
          <div style={eyebrow}>Where the machine stands</div>
          <p style={{ fontSize: "clamp(24px, 3.4vw, 40px)", fontWeight: 500, lineHeight: 1.3, letterSpacing: "-0.02em", maxWidth: "26ch", margin: 0 }}>
            Our AI is an <b style={{ color: C.gold, fontWeight: 700 }}>amplifier</b>.<br />
            It never invents.<br />
            It only amplifies what is already true.
          </p>
          <p style={{ marginTop: 26, fontSize: "clamp(15px, 1.7vw, 18px)", color: C.fgMut, maxWidth: "52ch" }}>
            Every script, every card, every line traces back to something you actually said.
            If it isn&apos;t in your evidence, it doesn&apos;t ship. That is the whole discipline.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={sectionBorder}>
        <div style={{ ...wrap, textAlign: "center", padding: "clamp(90px, 13vw, 150px) 0" }}>
          <h2 style={{ ...h2, margin: "0 auto" }}>
            Your business has been<br />revealing the same thing for years.
          </h2>
          <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: C.fgMut, margin: "26px auto 0", maxWidth: "44ch" }}>
            Ten minutes. Six questions. The pattern, named - in writing, in your own words, yours to keep.
          </p>
          <div style={{ marginTop: 42 }}>
            <Link href="/en/reading" style={ctaMain}>
              Reveal my signal <span>&rarr;</span>
            </Link>
          </div>
          <span style={{ display: "block", marginTop: 18, fontSize: 13.5, color: C.fgFaint }}>
            Free &middot; no card &middot; your first filmed episode is on us
          </span>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "44px 0 60px", textAlign: "center" }}>
        <div style={wrap}>
          <div style={{ display: "flex", gap: 18, justifyContent: "center", fontSize: 12.5 }}>
            <a href="/privacy" style={{ color: C.fgFaint, textDecoration: "none" }}>Privacy policy</a>
            <a href="/terms" style={{ color: C.fgFaint, textDecoration: "none" }}>Terms of use</a>
          </div>
          <p style={{ marginTop: 14, fontSize: 12.5, color: C.fgMut, fontWeight: 600 }}>
            We do not create content. We reveal your signal. | TrueSignal&copy;
          </p>
          <p style={{ marginTop: 6, fontSize: 12, color: C.fgFaint }}>&copy; 2026 Hadar Danan Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
