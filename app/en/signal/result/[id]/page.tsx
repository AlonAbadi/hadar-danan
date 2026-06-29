import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { validateSignalOutputEn, type SignalOutputEn } from "@/lib/prompts/signal-engine-en";
import { CopyButton, ShareButton, PrintButton, RestartButton } from "./ActionButtons";

const BEE = "/beegood_logo.png";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
  const cardUrl = `${baseUrl}/en/signal/result/${id}/card.png`;
  return {
    title: "Your signal",
    description: "Your TrueSignal© diagnostic, prepared by hand.",
    robots: { index: false, follow: false },
    openGraph: {
      title: "TrueSignal© · beegood",
      description: "Your signal, prepared by hand.",
      images: [{ url: cardUrl, width: 1200, height: 1200, alt: "Your TrueSignal card" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "TrueSignal© · beegood",
      description: "Your signal, prepared by hand.",
      images: [cardUrl],
    },
  };
}

type ResultRow = {
  id:           string;
  user_id:      string;
  signal:       SignalOutputEn;
  generated_at: string;
};

async function fetchResult(id: string): Promise<ResultRow | null> {
  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from("signal_extractions")
    .select("id, user_id, signal, generated_at")
    .eq("id", id)
    .maybeSingle();

  if (!data?.signal) return null;
  if (!validateSignalOutputEn(data.signal)) return null;

  return data as ResultRow;
}

// Business OS palette
const C = {
  bg:        "#0D0C0A",
  panel:     "#111009",
  card:      "#161410",
  cardSoft:  "#1A1814",
  border:    "rgba(242,237,228,0.10)",
  borderHi:  "#C2973F",
  gold:      "#C2973F",
  goldDeep:  "#9A7526",
  goldFaint: "rgba(194,151,63,0.22)",
  text:      "#F2EDE4",
  textSoft:  "rgba(242,237,228,0.78)",
  textMute:  "rgba(242,237,228,0.55)",
  textFaint: "rgba(242,237,228,0.36)",
  textDim:   "rgba(242,237,228,0.28)",
  ctaBg:     "#C2973F",
  ctaFg:     "#0D0C0A",
};

export default async function EnSignalResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await fetchResult(id);
  if (!row) notFound();

  const s = row.signal;
  const letterNo = id.replace(/[^0-9]/g, "").slice(-3).padStart(3, "0") || "001";
  const dateStr = new Date(row.generated_at).toLocaleDateString("en-US", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
  const shareUrl = `${baseUrl}/en/signal/result/${id}`;

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "var(--font-jakarta), sans-serif" }}>
      <header
        style={{
          maxWidth:       1120,
          margin:         "0 auto",
          padding:        "40px clamp(22px, 5vw, 40px) 0",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            14,
          flexWrap:       "wrap",
        }}
      >
        <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: C.text }}>
          <Image
            src={BEE}
            alt="beegood"
            width={50}
            height={40}
            style={{ width: "auto", height: 40, display: "block" }}
          />
          <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
            beegood
          </span>
        </Link>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
          Prepared for you · No. {letterNo}
        </div>
      </header>

      {/* Hero - Your signal */}
      <section
        style={{
          maxWidth:  900,
          margin:    "0 auto",
          padding:   "clamp(48px, 8vh, 96px) clamp(22px, 5vw, 40px) clamp(40px, 6vh, 72px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize:      12,
            fontWeight:    700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color:         C.gold,
            marginBottom:  18,
          }}
        >
          TrueSignal© · Layer 01
        </div>
        <h1
          style={{
            fontSize:      "clamp(36px, 5.4vw, 64px)",
            fontWeight:    800,
            lineHeight:    0.98,
            letterSpacing: "-0.045em",
            color:         C.text,
            margin:        0,
          }}
        >
          Your signal.
        </h1>
        <p
          style={{
            fontSize:      14,
            letterSpacing: "0.06em",
            color:         C.textFaint,
            margin:        "18px 0 0",
          }}
        >
          Extracted on {dateStr}
        </p>
      </section>

      {/* Signal hero card - the centerpiece */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 clamp(22px, 5vw, 40px) clamp(40px, 6vw, 64px)" }}>
        <div
          className="signal-hero"
          style={{
            background:   `linear-gradient(145deg, ${C.cardSoft}, ${C.card})`,
            border:       `1px solid ${C.gold}`,
            borderRadius: 22,
            padding:      "clamp(36px, 5vw, 56px) clamp(28px, 4vw, 44px)",
            textAlign:    "center",
            boxShadow:    "0 12px 32px rgba(194,151,63,0.12)",
          }}
        >
          <div
            style={{
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color:         C.gold,
              marginBottom:  18,
            }}
          >
            The signal
          </div>
          <p
            style={{
              fontSize:      "clamp(22px, 3.2vw, 30px)",
              fontStyle:     "italic",
              fontWeight:    500,
              lineHeight:    1.45,
              letterSpacing: "-0.022em",
              color:         C.text,
              margin:        "0 0 32px",
            }}
          >
            “{s.signal}”
          </p>
          <div className="hero-actions" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <CopyButton text={`${s.signal}\n\nTrueSignal© · beegood.online/en`} />
            <ShareButton
              title="My signal - TrueSignal© beegood"
              text={s.signal}
              url={shareUrl}
            />
          </div>
        </div>
      </section>

      {/* Signal promise */}
      {s.signal_promise && (
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 clamp(22px, 5vw, 40px) clamp(28px, 4vw, 48px)" }}>
          <div
            style={{
              background:   "linear-gradient(180deg, rgba(194,151,63,0.06) 0%, transparent 100%)",
              border:       `1px solid ${C.goldFaint}`,
              borderRadius: 16,
              padding:      "24px 26px",
              position:     "relative",
            }}
          >
            <div
              aria-hidden
              style={{
                position:     "absolute",
                top:          -1,
                left:         26,
                width:        0,
                height:       0,
                borderLeft:   "7px solid transparent",
                borderRight:  "7px solid transparent",
                borderBottom: `8px solid ${C.gold}`,
              }}
            />
            <div
              style={{
                color:         C.gold,
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom:  10,
                display:       "flex",
                alignItems:    "center",
                gap:           6,
              }}
            >
              <span style={{ fontSize: 13 }}>↗</span> What your signal promises
            </div>
            <p style={{ margin: 0, lineHeight: 1.7, color: C.text, fontSize: 16 }}>{s.signal_promise}</p>
          </div>
        </section>
      )}

      {/* Element + People + Content directions stack */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(28px, 4vw, 48px) clamp(22px, 5vw, 40px) clamp(40px, 6vw, 64px)" }}>
        <Card label="The element you work in">
          <p style={{ margin: 0, lineHeight: 1.65, color: C.text, fontSize: 16 }}>{s.element}</p>
        </Card>

        <Card label="Who is looking for you">
          <p style={{ margin: 0, lineHeight: 1.65, color: C.text, fontSize: 16 }}>{s.people}</p>
        </Card>

        <Card label="Three directions to start this week">
          <ol style={{ margin: 0, paddingInlineStart: 22, lineHeight: 1.75, color: C.text, fontSize: 16 }}>
            {s.content_directions.map((d, i) => (
              <li key={i} style={{ marginBottom: 8 }}>{d}</li>
            ))}
          </ol>
        </Card>

        <Card label="A note from us" tone="warm">
          <p style={{ margin: "0 0 16px", lineHeight: 1.7, color: C.text, fontSize: 16 }}>{s.warm_note}</p>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Hadar &amp; Alon</div>
          <div style={{ fontSize: 12, color: C.textFaint, marginTop: 3 }}>Founders · beegood</div>
        </Card>
      </section>

      {/* Made to share - PNG card */}
      <section className="share-section" style={{ maxWidth: 760, margin: "0 auto", padding: "0 clamp(22px, 5vw, 40px) clamp(48px, 8vw, 88px)" }}>
        <div
          style={{
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         C.gold,
            margin:        "0 0 16px",
          }}
        >
          Made to share
        </div>
        <div
          style={{
            border:       `1px solid ${C.border}`,
            borderRadius: 12,
            overflow:     "hidden",
            background:   C.card,
            boxShadow:    "0 1px 0 rgba(0,0,0,0.3), 0 30px 60px -46px rgba(0,0,0,0.6)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/en/signal/result/${id}/card.png`}
            alt="Your TrueSignal card"
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        </div>
        <div
          style={{
            display:        "flex",
            justifyContent: "center",
            alignItems:     "center",
            gap:            18,
            marginTop:      20,
            flexWrap:       "wrap",
          }}
        >
          <a
            href={`/en/signal/result/${id}/card.png`}
            download={`truesignal-${id.slice(0, 8)}.png`}
            style={{
              fontFamily:    "var(--font-jakarta), sans-serif",
              fontSize:      13,
              fontWeight:    700,
              letterSpacing: "0.04em",
              color:         C.ctaFg,
              background:    C.ctaBg,
              border:        "none",
              borderRadius:  10,
              padding:       "11px 22px",
              textDecoration: "none",
            }}
          >
            Download card ↓
          </a>
          <p
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize:   14,
              fontStyle:  "italic",
              color:      C.textFaint,
              margin:     0,
            }}
          >
            Yours to post, today.
          </p>
        </div>
      </section>

      {/* OS upgrade CTA */}
      <section
        className="upgrade-section"
        style={{
          background: C.panel,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "clamp(64px, 10vw, 108px) clamp(22px, 5vw, 40px)" }}>
          <div
            style={{
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         C.textFaint,
              marginBottom:  16,
            }}
          >
            What comes next
          </div>
          <h2
            style={{
              fontSize:      "clamp(26px, 3.8vw, 44px)",
              fontWeight:    700,
              lineHeight:    1.08,
              letterSpacing: "-0.035em",
              color:         C.text,
              margin:        "0 0 24px",
              maxWidth:      "26ch",
            }}
          >
            Your signal is the foundation. The work of carrying it is what we build with you.
          </h2>
          <p
            style={{
              fontSize:   "clamp(15px, 1.7vw, 17px)",
              lineHeight: 1.65,
              color:      C.textMute,
              margin:     "0 0 36px",
              maxWidth:   "58ch",
            }}
          >
            Layer 01 (this) is yours, free, forever. Layers 02, 03, 04 translate the signal into business architecture, content intelligence, and the BeeGood OS execution engine.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <Link
              href="/en/os"
              style={{
                fontFamily:    "var(--font-jakarta), sans-serif",
                fontSize:      15,
                fontWeight:    700,
                color:         C.ctaFg,
                background:    C.ctaBg,
                border:        "none",
                borderRadius:  12,
                padding:       "16px 32px",
                cursor:        "pointer",
                textDecoration: "none",
                display:       "inline-flex",
                alignItems:    "center",
                gap:           10,
              }}
            >
              See what comes next <span style={{ fontSize: 18 }}>→</span>
            </Link>
            <a
              href="https://wa.me/972539566961"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily:    "var(--font-jakarta), sans-serif",
                fontSize:      15,
                fontWeight:    700,
                color:         C.ctaBg,
                background:    "transparent",
                border:        `1px solid ${C.ctaBg}`,
                borderRadius:  12,
                padding:       "15px 30px",
                textDecoration: "none",
                display:       "inline-flex",
                alignItems:    "center",
                gap:           10,
              }}
            >
              Talk to Hadar <span style={{ fontSize: 18 }}>→</span>
            </a>
            <Link
              href="/en/signal"
              style={{
                fontSize:       13,
                fontWeight:     600,
                letterSpacing:  "0.04em",
                color:          C.textMute,
                textDecoration: "none",
                borderBottom:   `1px solid ${C.border}`,
                paddingBottom:  2,
              }}
            >
              Take the five questions again
            </Link>
          </div>
        </div>
      </section>

      {/* Action footer + restart */}
      <section
        className="footer-actions"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "clamp(48px, 8vw, 88px) clamp(22px, 5vw, 40px) clamp(48px, 8vw, 88px)",
          textAlign: "center",
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <PrintButton />
        <RestartButton />
      </section>

      {/* Bottom footer */}
      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div
          style={{
            maxWidth:       1120,
            margin:         "0 auto",
            padding:        "32px clamp(22px, 5vw, 40px) 44px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            20,
            flexWrap:       "wrap",
          }}
        >
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: C.text }}>
            <Image
              src={BEE}
              alt=""
              width={36}
              height={28}
              style={{ width: "auto", height: 28, display: "block" }}
            />
            <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.015em" }}>beegood</span>
          </Link>
          <div style={{ fontSize: 12, letterSpacing: "0.06em", color: C.textFaint }}>
            The TrueSignal© Method · Business OS for Personal Brands · {dateStr}
          </div>
        </div>
      </footer>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 18mm 14mm; }
          .hero-actions, .footer-actions, .upgrade-section, .share-section { display: none !important; }
          body { background: #ffffff !important; color: #1a1a1a !important; }
          .signal-hero { background: #ffffff !important; border: 1px solid #C2973F !important; box-shadow: none !important; page-break-inside: avoid; }
          .signal-hero p { color: #1a1a1a !important; }
        }
      `}</style>
    </div>
  );
}

function Card({
  label,
  children,
  tone = "normal",
}: {
  label:    string;
  children: React.ReactNode;
  tone?:    "normal" | "warm";
}) {
  return (
    <div
      style={{
        background:    tone === "warm"
          ? `linear-gradient(145deg, rgba(194,151,63,0.10), ${C.card})`
          : C.card,
        border:        `1px solid ${tone === "warm" ? "rgba(194,151,63,0.30)" : C.border}`,
        borderRadius:  16,
        padding:       "24px 24px",
        color:         C.text,
        marginBottom:  14,
      }}
    >
      <div
        style={{
          color:         C.gold,
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom:  12,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16 }}>{children}</div>
    </div>
  );
}
